import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import AiChat, { CpvoaContext } from "@/components/AiChat";

const SECURITY_API = "https://functions.poehali.dev/15640332-461b-47d1-b024-8fa25fb344ef";
const _SCHEDULER_API = "https://functions.poehali.dev/129bc872-862f-4f58-8992-a6f164ca410d";
void _SCHEDULER_API;

// ─── Типы ────────────────────────────────────────────────────────────────────
type Mode = "standard" | "advanced" | "emergency" | "offline" | "intrusion_scan";
type ConnectionStatus = "online" | "mesh" | "offline";

interface IntrusionScan {
  status: "scanning" | "done" | "idle";
  source?: { ip: string; isp: string; country: string; asn: string };
  spectrum?: { band: string; freq_mhz: number; signal_strength_db: number; intrusion_type: string; threat_level: string };
  penalty_usd?: number;
  message?: string;
  absorption_synced?: boolean;
}

interface Incident {
  id: string;
  category: string;
  threat: "low" | "medium" | "high" | "critical";
  location: string;
  source: string;
  time: string;
  description: string;
}

// ─── Константы ───────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "ЦПВОА: проверить аномалии на частоте 101.2 МГц",
  "ЦПВОА: проанализировать световые сигналы",
  "ЦПВОА: отправить SOS через меш",
  "ЦПВОА: показать последние инциденты в радиусе 5 км",
  "ЦПВОА: синхронизировать буфер",
  "ЦПВОА: мониторинг эфира 88–108 МГц",
  "ЦПВОА: статус датчиков",
];

// ─── Тип для точки на карте ──────────────────────────────────────────────────
interface MapPoint {
  id: string;
  x: number;   // % от ширины SVG
  y: number;   // % от высоты SVG
  threat: "low" | "medium" | "high" | "critical";
  label: string;
  category: string;
  pulse: boolean;
}

const MOCK_INCIDENTS: Incident[] = [
  { id: "1", category: "Радиоэфир", threat: "high", location: "53.2°N 83.7°E", source: "FM 101.2 МГц", time: "14:32", description: "Обнаружена нестандартная модуляция сигнала, отклонение от нормы +23 дБ" },
  { id: "2", category: "Визуальный", threat: "medium", location: "53.1°N 83.8°E", source: "Камера #4", time: "14:15", description: "Зафиксированы световые вспышки с кодированным паттерном" },
  { id: "3", category: "Меш‑сеть", threat: "low", location: "Локальная", source: "Узел #7", time: "13:58", description: "Незарегистрированный узел пытается подключиться к сети ЦПВОА" },
  { id: "4", category: "Кибер", threat: "critical", location: "Внешний IP", source: "Брандмауэр", time: "13:45", description: "Обнаружена попытка несанкционированного доступа к буферу сообщений" },
];

// Начальные точки на карте (примерное расположение на упрощённой карте России/СНГ)
const INITIAL_MAP_POINTS: MapPoint[] = [
  { id: "1", x: 56, y: 38, threat: "high",     label: "FM 101.2 МГц", category: "Радиоэфир", pulse: true },
  { id: "2", x: 58, y: 36, threat: "medium",   label: "Камера #4",    category: "Визуальный", pulse: false },
  { id: "3", x: 55, y: 40, threat: "low",      label: "Меш‑узел #7", category: "Меш-сеть",  pulse: false },
  { id: "4", x: 72, y: 30, threat: "critical", label: "Внешний IP",   category: "Кибер",     pulse: true },
];

// Генератор новых случайных инцидентов для автообновления
const RANDOM_CATEGORIES = ["Радиоэфир", "Кибер", "Визуальный", "Меш-сеть", "Физический"] as const;
const RANDOM_THREATS: Array<"low" | "medium" | "high" | "critical"> = ["low", "medium", "high", "critical"];
const RANDOM_DESCS = [
  "Зафиксирован нетипичный сигнал в диапазоне",
  "Попытка несанкционированного подключения",
  "Аномальная активность узла",
  "Сигнал SOS из сектора наблюдения",
  "Нарушение периметра по датчику",
  "Дрейф частоты приёмника сверх нормы",
  "Пакетная атака на буфер сообщений",
];

const THREAT_CONFIG = {
  low:      { label: "Низкая",     color: "#4CAF50", bg: "rgba(76,175,80,0.15)" },
  medium:   { label: "Средняя",    color: "#FFC107", bg: "rgba(255,193,7,0.15)" },
  high:     { label: "Высокая",    color: "#FF9800", bg: "rgba(255,152,0,0.15)" },
  critical: { label: "Критическая",color: "#F44336", bg: "rgba(244,67,54,0.15)" },
};

const TIMELINE = [
  { time: "14:32", event: "Аномалия FM 101.2 МГц", threat: "high" as const },
  { time: "14:15", event: "Световой сигнал — камера #4", threat: "medium" as const },
  { time: "13:58", event: "Неизвестный меш‑узел #7", threat: "low" as const },
  { time: "13:45", event: "Атака на буфер сообщений", threat: "critical" as const },
  { time: "12:10", event: "Синхронизация завершена", threat: "low" as const },
];

// ─── Вспомогательные компоненты ───────────────────────────────────────────────

function StatusDot({ active, color }: { active: boolean; color: string }) {
  return (
    <span className="relative inline-flex w-2 h-2">
      <span className="w-2 h-2 rounded-full" style={{ background: active ? color : "#555" }} />
      {active && <span className="absolute inset-0 rounded-full animate-ping opacity-50" style={{ background: color }} />}
    </span>
  );
}

function ThreatBadge({ level }: { level: keyof typeof THREAT_CONFIG }) {
  const cfg = THREAT_CONFIG[level];
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

// ─── Главная страница ─────────────────────────────────────────────────────────

export default function EgsuCpvoa() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [mode, setMode] = useState<Mode>("standard");
  const [connection, setConnection] = useState<ConnectionStatus>("online");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"history" | "cache" | "settings" | "buffer">("history");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sensors, setSensors] = useState({ radio: true, camera: false, mesh: true });
  const [battery] = useState(78);
  const [results, setResults] = useState<Incident[]>([]);
  const [queryHistory, setQueryHistory] = useState<string[]>([
    "ЦПВОА: мониторинг 101.2 МГц",
    "ЦПВОА: статус датчиков",
    "ЦПВОА: инциденты 5 км",
  ]);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiCpvoaCtx, setAiCpvoaCtx] = useState<CpvoaContext | null>(null);
  const [intrusionScan, setIntrusionScan] = useState<IntrusionScan>({ status: "idle" });
  const [showIntrusionPanel, setShowIntrusionPanel] = useState(false);
  const [absorbSyncing, setAbsorbSyncing] = useState(false);
  const [absorbResult, setAbsorbResult] = useState<{ penalty_usd: number; channel: string; message: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Карта инцидентов ──
  const [mapPoints, setMapPoints] = useState<MapPoint[]>(INITIAL_MAP_POINTS);
  const [selectedMapPoint, setSelectedMapPoint] = useState<MapPoint | null>(null);
  const [mapAutoUpdate, setMapAutoUpdate] = useState(true);
  const [lastMapUpdate, setLastMapUpdate] = useState(new Date());
  const [mapUpdateCount, setMapUpdateCount] = useState(0);
  const [showMap, setShowMap] = useState(true);

  // ── Автообновление карты инцидентов ──
  const addRandomIncident = useCallback(() => {
    const cat = RANDOM_CATEGORIES[Math.floor(Math.random() * RANDOM_CATEGORIES.length)];
    const threat = RANDOM_THREATS[Math.floor(Math.random() * RANDOM_THREATS.length)];
    const desc = RANDOM_DESCS[Math.floor(Math.random() * RANDOM_DESCS.length)];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    const newId = String(Date.now());
    const newPoint: MapPoint = {
      id: newId,
      x: 20 + Math.random() * 65,
      y: 15 + Math.random() * 60,
      threat,
      label: `${cat} #${Math.floor(Math.random()*99)+1}`,
      category: cat,
      pulse: threat === "critical" || threat === "high",
    };
    const newIncident: Incident = {
      id: newId,
      category: cat,
      threat,
      location: `${(50 + Math.random()*15).toFixed(1)}°N ${(60 + Math.random()*60).toFixed(1)}°E`,
      source: newPoint.label,
      time: timeStr,
      description: `${desc} — ${cat.toLowerCase()}`,
    };
    setMapPoints(pts => {
      const updated = [...pts, newPoint];
      return updated.length > 12 ? updated.slice(updated.length - 12) : updated;
    });
    setResults(prev => {
      const updated = [newIncident, ...prev];
      return updated.length > 10 ? updated.slice(0, 10) : updated;
    });
    setLastMapUpdate(new Date());
    setMapUpdateCount(c => c + 1);
  }, []);

  useEffect(() => {
    if (!mapAutoUpdate) return;
    const interval = setInterval(() => {
      addRandomIncident();
    }, 8000);
    return () => clearInterval(interval);
  }, [mapAutoUpdate, addRandomIncident]);

  // ── Сканирование вторжения через эфир/спектр ──
  const runIntrusionScan = async (band: string, freqMhz: number, signalDb: number, sourceType: string) => {
    setIntrusionScan({ status: "scanning" });
    setMode("intrusion_scan");
    try {
      const resp = await fetch(`${SECURITY_API}/intrusion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spectrum_band: band,
          freq_mhz: freqMhz,
          signal_strength_db: signalDb,
          source_type: sourceType,
          description: `ЦПВОА обнаружил вторжение в диапазоне ${band} (${freqMhz} МГц, ${signalDb} дБ)`,
        }),
      });
      const data = await resp.json();
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      setIntrusionScan({
        status: "done",
        source: { ip: parsed.intrusion_analysis?.band || "radio", isp: parsed.geo?.isp || "Unknown", country: parsed.geo?.country || "Unknown", asn: parsed.geo?.asn || "Unknown" },
        spectrum: { band, freq_mhz: freqMhz, signal_strength_db: signalDb, intrusion_type: parsed.intrusion_analysis?.intrusion_type || "unknown", threat_level: parsed.intrusion_analysis?.threat_level || "medium" },
        penalty_usd: parsed.absorption_charged_usd,
        message: parsed.message,
        absorption_synced: parsed.absorption_sync,
      });
      setMode("advanced");
    } catch {
      setIntrusionScan({ status: "done", message: "Ошибка сканирования. Работаю в офлайн-режиме." });
      setMode("standard");
    }
  };

  // ── Реагирование на блокировку системы → Поглощение ──
  const respondToBlock = async (blockerIp: string, channel: string) => {
    setAbsorbSyncing(true);
    try {
      const resp = await fetch(`${SECURITY_API}/block-response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip_address: blockerIp,
          channel,
          block_type: "system_block",
          description: "Несанкционированная блокировка системы ECSU — ответ ЦПВОА",
        }),
      });
      const data = await resp.json();
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      setAbsorbResult({
        penalty_usd: parsed.penalty_usd || 0,
        channel: parsed.blocker_identified?.isp || channel,
        message: parsed.message || "Режим Поглощения активирован",
      });
    } catch {
      setAbsorbResult({ penalty_usd: 10000, channel, message: "Режим Поглощения активирован (офлайн)" });
    } finally {
      setAbsorbSyncing(false);
    }
  };

  // Открыть ИИ с текущим контекстом ЦПВОА
  const openAiWithContext = (message?: string) => {
    void message;
    const ctx: CpvoaContext = {
      incidents: results.length > 0 ? results : MOCK_INCIDENTS,
      sensors,
      connection,
      mode,
      query: queryHistory[0] ?? "",
    };
    setAiCpvoaCtx(ctx);
    setAiChatOpen(true);
  };

  // Детектирование критической угрозы → экстренный режим
  useEffect(() => {
    const hasCritical = MOCK_INCIDENTS.some(i => i.threat === "critical");
    if (hasCritical && mode !== "emergency") {
      // не автоматически включаем, только если явно нет иного режима
    }
  }, [mode]);

  // Прогресс‑бар при обработке
  useEffect(() => {
    if (!processing) { setProgress(0); return; }
    const t = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(t); setProcessing(false); return 100; }
        return p + 4;
      });
    }, 50);
    return () => clearInterval(t);
  }, [processing]);

  function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setProcessing(true);
    setMode("advanced");
    setQueryHistory(h => [query, ...h.slice(0, 19)]);
    setTimeout(() => {
      setResults(MOCK_INCIDENTS);
    }, 1400);
    setQuery("");
    setFocused(false);
  }

  function handleFocus() {
    setFocused(true);
    if (!query.startsWith("ЦПВОА: ") && !query) setQuery("ЦПВОА: ");
  }

  function handleBlur() {
    setTimeout(() => setFocused(false), 150);
  }

  function quickAction(action: string) {
    const queries: Record<string, string> = {
      radio: "ЦПВОА: мониторинг эфира 88–108 МГц",
      camera: "ЦПВОА: проанализировать световые сигналы",
      mesh: "ЦПВОА: статус меш‑сети",
      offline: "ЦПВОА: переключить в оффлайн‑режим",
      sos: "ЦПВОА: отправить SOS через меш",
    };
    if (action === "offline") {
      setConnection(c => c === "offline" ? "online" : "offline");
      setMode(c => c === "offline" ? "standard" : "offline");
      return;
    }
    if (action === "sos") {
      setMode("emergency");
      return;
    }
    setQuery(queries[action] ?? "");
    inputRef.current?.focus();
  }

  const connConfig = {
    online:  { label: "Интернет",  color: "#4CAF50", icon: "Wifi" },
    mesh:    { label: "Меш‑сеть",  color: "#2196F3", icon: "Network" },
    offline: { label: "Оффлайн",   color: "#F44336", icon: "WifiOff" },
  }[connection];

  // ─── Emergency overlay ────────────────────────────────────────────────────
  if (mode === "emergency") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{ background: "rgba(244,67,54,0.97)" }}>
        <div className="text-center animate-pulse">
          <div className="text-8xl mb-6">⚠️</div>
          <div className="text-white text-4xl font-black mb-2 tracking-widest">КРИТИЧЕСКАЯ УГРОЗА</div>
          <div className="text-white/70 text-lg mb-8">ЦПВОА обнаружил критический инцидент</div>
          <div className="text-white/50 text-sm mb-10">Все датчики активированы · Буфер сообщений сохранён</div>
          <button onClick={() => { setMode("advanced"); setResults(MOCK_INCIDENTS); }}
            className="px-12 py-5 rounded-2xl text-2xl font-black text-white border-4 border-white mr-4 hover:bg-white/10 transition-all">
            📡 ОТПРАВИТЬ SOS
          </button>
          <button onClick={() => setMode("standard")}
            className="px-8 py-5 rounded-2xl text-lg font-bold text-white/60 hover:text-white transition-all">
            Отменить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-[Roboto,sans-serif]" style={{ background: "#2B2B2B", color: "#FFFFFF" }}>
      {/* ─── ИИ-чат с интеграцией ЦПВОА ─── */}
      {aiChatOpen && aiCpvoaCtx && (
        <AiChat
          onClose={() => setAiChatOpen(false)}
          initialCpvoaContext={aiCpvoaCtx}
        />
      )}

      {/* ─── NAV ─── */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 gap-3"
        style={{ background: "rgba(30,30,30,0.98)", borderBottom: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>

        {/* Логотип + назад */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/egsu/dashboard")}
            className="text-white/30 hover:text-white/70 transition-colors">
            <Icon name="ChevronLeft" size={18} />
          </button>
          <button onClick={() => setSidebarOpen(o => !o)}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <Icon name="Menu" size={18} className="text-white/60" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
              style={{ background: "linear-gradient(135deg, #4CAF50, #2196F3)" }}>
              Ц
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-sm tracking-wider leading-none">ЦПВОА</div>
              <div className="text-white/30 text-[9px] tracking-widest">СИСТЕМА МОНИТОРИНГА</div>
            </div>
          </div>
        </div>

        {/* Статусная панель */}
        <div className="flex items-center gap-3">
          {/* Прогресс обработки */}
          {processing && (
            <div className="flex items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 28 28">
                <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                <circle cx="14" cy="14" r="11" fill="none" stroke="#4CAF50" strokeWidth="2.5"
                  strokeDasharray={`${2 * Math.PI * 11}`}
                  strokeDashoffset={`${2 * Math.PI * 11 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 0.1s" }} />
                <text x="14" y="18" textAnchor="middle" fill="#4CAF50" fontSize="7" fontWeight="bold">{progress}%</text>
              </svg>
            </div>
          )}

          {/* Датчики */}
          <div className="hidden md:flex items-center gap-1.5 text-[10px] text-white/40">
            <StatusDot active={sensors.radio} color="#4CAF50" />
            <span>📻</span>
            <StatusDot active={sensors.camera} color="#2196F3" />
            <span>📷</span>
            <StatusDot active={sensors.mesh} color="#FFC107" />
            <span>🌐</span>
          </div>

          {/* Батарея */}
          <div className="hidden sm:flex items-center gap-1 text-xs" style={{ color: battery > 30 ? "#4CAF50" : "#F44336" }}>
            <Icon name="Battery" size={14} />
            <span>{battery}%</span>
          </div>

          {/* Связь */}
          <button onClick={() => setConnection(c => c === "online" ? "mesh" : c === "mesh" ? "offline" : "online")}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all"
            style={{ background: `${connConfig.color}15`, color: connConfig.color, border: `1px solid ${connConfig.color}30` }}>
            <Icon name={connConfig.icon as "Wifi"} size={13} />
            <span className="hidden sm:block">{connConfig.label}</span>
          </button>

          {/* ИИ */}
          <button onClick={() => openAiWithContext()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all hover:scale-105"
            style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }}>
            <Icon name="Bot" size={13} />
            ИИ
          </button>

          {/* ВТОРЖЕНИЕ */}
          <button onClick={() => setShowIntrusionPanel(p => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all hover:scale-105"
            style={{ background: showIntrusionPanel ? "rgba(255,152,0,0.25)" : "rgba(255,152,0,0.12)", color: "#FF9800", border: "1px solid rgba(255,152,0,0.35)" }}>
            <Icon name="Radar" size={13} />
            ВТОРЖЕНИЕ
          </button>

          {/* SOS */}
          <button onClick={() => setMode("emergency")}
            className="px-3 py-1.5 rounded-lg text-xs font-black tracking-wider transition-all hover:scale-105"
            style={{ background: "rgba(244,67,54,0.15)", color: "#F44336", border: "1px solid rgba(244,67,54,0.3)" }}>
            SOS
          </button>
        </div>
      </nav>

      {/* ─── ПАНЕЛЬ СКАНИРОВАНИЯ ВТОРЖЕНИЙ ─── */}
      {showIntrusionPanel && (
        <div className="fixed top-14 right-0 z-40 w-80 max-h-screen overflow-y-auto"
          style={{ background: "rgba(20,15,5,0.98)", border: "1px solid rgba(255,152,0,0.3)", borderTop: "none" }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(255,152,0,0.2)" }}>
            <div className="flex items-center justify-between">
              <div className="font-bold text-sm" style={{ color: "#FF9800" }}>⚡ Режим сканирования вторжений</div>
              <button onClick={() => setShowIntrusionPanel(false)} className="text-white/30 hover:text-white/70"><Icon name="X" size={14} /></button>
            </div>
            <div className="text-white/40 text-[10px] mt-1">Обнаружение источника угрозы через эфир/спектр</div>
          </div>

          <div className="p-4 space-y-3">
            {/* Быстрые действия сканирования */}
            <div className="text-white/30 text-[10px] uppercase tracking-widest">Сканировать диапазон</div>
            {[
              { band: "fm_radio", freq: 101.2, signal: 75, label: "FM 88–108 МГц", icon: "Radio", color: "#4CAF50" },
              { band: "wifi_24", freq: 2400, signal: 65, label: "WiFi 2.4 ГГц", icon: "Wifi", color: "#2196F3" },
              { band: "mesh", freq: 915, signal: 55, label: "Меш-сеть 915 МГц", icon: "Network", color: "#FFC107" },
              { band: "lte", freq: 1800, signal: 70, label: "LTE 1800 МГц", icon: "Signal", color: "#9C27B0" },
              { band: "satellite", freq: 12000, signal: 80, label: "Спутник 12 ГГц", icon: "Satellite", color: "#F44336" },
            ].map(({ band, freq, signal, label, icon, color }) => (
              <button key={band}
                onClick={() => runIntrusionScan(band, freq, signal, band === "mesh" ? "mesh" : "radio")}
                disabled={intrusionScan.status === "scanning"}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:scale-[1.01]"
                style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                <Icon name={icon} size={15} style={{ color }} />
                <div>
                  <div className="text-sm font-semibold text-white/90">{label}</div>
                  <div className="text-[10px]" style={{ color }}>Сигнал ~{signal} дБ · Click для сканирования</div>
                </div>
              </button>
            ))}

            {/* Реагирование на блокировку */}
            <div className="text-white/30 text-[10px] uppercase tracking-widest mt-4">Реагирование на блокировку</div>
            <button
              onClick={() => respondToBlock("0.0.0.0", "unknown_channel")}
              disabled={absorbSyncing}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all"
              style={{ background: "rgba(244,67,54,0.1)", border: "1px solid rgba(244,67,54,0.3)" }}>
              <Icon name="ShieldOff" size={15} style={{ color: "#F44336" }} />
              <div>
                <div className="text-sm font-semibold" style={{ color: "#F44336" }}>
                  {absorbSyncing ? "Активация Поглощения..." : "Активировать Режим Поглощения"}
                </div>
                <div className="text-[10px] text-white/40">Штраф $10,000 на блокировщика · Постоянная блокировка</div>
              </div>
            </button>

            {/* Результат сканирования */}
            {intrusionScan.status === "scanning" && (
              <div className="flex items-center gap-2 px-3 py-3 rounded-xl" style={{ background: "rgba(255,152,0,0.1)" }}>
                <div className="w-3 h-3 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-sm text-orange-300">Сканирование эфира...</span>
              </div>
            )}
            {intrusionScan.status === "done" && intrusionScan.message && (
              <div className="px-3 py-3 rounded-xl space-y-2" style={{ background: "rgba(255,152,0,0.08)", border: "1px solid rgba(255,152,0,0.2)" }}>
                <div className="text-[11px] font-bold" style={{ color: "#FF9800" }}>Результат анализа</div>
                {intrusionScan.spectrum && (
                  <div className="text-[11px] text-white/60 space-y-1">
                    <div>Диапазон: <span className="text-white/80">{intrusionScan.spectrum.band}</span></div>
                    <div>Тип: <span className="text-white/80">{intrusionScan.spectrum.intrusion_type}</span></div>
                    <div>Угроза: <span style={{ color: intrusionScan.spectrum.threat_level === "critical" ? "#F44336" : "#FF9800" }}>{intrusionScan.spectrum.threat_level}</span></div>
                  </div>
                )}
                {intrusionScan.penalty_usd && (
                  <div className="text-sm font-bold" style={{ color: "#4CAF50" }}>Штраф: ${intrusionScan.penalty_usd?.toFixed(0)} USD →  Поглощение</div>
                )}
              </div>
            )}

            {/* Результат поглощения */}
            {absorbResult && (
              <div className="px-3 py-3 rounded-xl" style={{ background: "rgba(244,67,54,0.08)", border: "1px solid rgba(244,67,54,0.25)" }}>
                <div className="text-[11px] font-bold text-red-400 mb-1">Режим Поглощения активирован</div>
                <div className="text-[11px] text-white/60">Канал: {absorbResult.channel}</div>
                <div className="text-sm font-bold mt-1" style={{ color: "#4CAF50" }}>Штраф: ${absorbResult.penalty_usd?.toFixed(0)} USD</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── SIDEBAR ─── */}
      {sidebarOpen && (
        <aside className="fixed left-0 top-0 bottom-0 w-72 z-50 flex flex-col"
          style={{ background: "rgba(20,20,20,0.99)", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <span className="font-bold tracking-wider text-sm text-white/80">ЦПВОА · Панель</span>
            <button onClick={() => setSidebarOpen(false)} className="text-white/40 hover:text-white/70 transition-colors">
              <Icon name="X" size={16} />
            </button>
          </div>

          {/* Табы */}
          <div className="grid grid-cols-2 gap-1 p-3">
            {([
              { id: "history",  icon: "History",    label: "История" },
              { id: "cache",    icon: "Database",   label: "Кэш" },
              { id: "settings", icon: "Settings",   label: "Настройки" },
              { id: "buffer",   icon: "Inbox",      label: "Буфер" },
            ] as { id: typeof sidebarTab; icon: string; label: string }[]).map(t => (
              <button key={t.id} onClick={() => setSidebarTab(t.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: sidebarTab === t.id ? "rgba(76,175,80,0.15)" : "rgba(255,255,255,0.04)",
                  color: sidebarTab === t.id ? "#4CAF50" : "rgba(255,255,255,0.5)",
                  border: sidebarTab === t.id ? "1px solid rgba(76,175,80,0.3)" : "1px solid transparent",
                }}>
                <Icon name={t.icon as "History"} size={13} />
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {sidebarTab === "history" && (
              <div className="space-y-1">
                <div className="text-white/30 text-[10px] uppercase tracking-widest px-1 mb-2">Последние запросы</div>
                {queryHistory.map((q, i) => (
                  <button key={i} onClick={() => { setQuery(q); setSidebarOpen(false); inputRef.current?.focus(); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-white/60 hover:bg-white/5 hover:text-white/90 transition-all font-mono">
                    {q}
                  </button>
                ))}
              </div>
            )}
            {sidebarTab === "cache" && (
              <div className="space-y-2">
                <div className="text-white/30 text-[10px] uppercase tracking-widest px-1 mb-2">Офлайн‑базы</div>
                {[
                  { name: "Карты 50 км", size: "23 МБ", date: "13.04.26" },
                  { name: "Справочник МГП", size: "8 МБ", date: "12.04.26" },
                  { name: "Журнал инцидентов", size: "4 МБ", date: "13.04.26" },
                  { name: "Частоты ФМ", size: "1 МБ", date: "10.04.26" },
                ].map(d => (
                  <div key={d.name} className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div>
                      <div className="text-white/80 text-xs font-medium">{d.name}</div>
                      <div className="text-white/30 text-[10px]">{d.date}</div>
                    </div>
                    <span className="text-white/40 text-[10px]">{d.size}</span>
                  </div>
                ))}
              </div>
            )}
            {sidebarTab === "settings" && (
              <div className="space-y-4">
                <div className="text-white/30 text-[10px] uppercase tracking-widest px-1 mb-2">Датчики</div>
                {([
                  { key: "radio" as const, icon: "📻", label: "Радиомониторинг" },
                  { key: "camera" as const, icon: "📷", label: "Камера (Li‑Fi)" },
                  { key: "mesh" as const, icon: "🌐", label: "Меш‑сеть" },
                ]).map(s => (
                  <div key={s.key} className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <span>{s.icon}</span>{s.label}
                    </div>
                    <button onClick={() => setSensors(prev => ({ ...prev, [s.key]: !prev[s.key] }))}
                      className="w-10 h-5 rounded-full transition-all relative"
                      style={{ background: sensors[s.key] ? "#4CAF50" : "rgba(255,255,255,0.15)" }}>
                      <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow"
                        style={{ left: sensors[s.key] ? "22px" : "2px" }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {sidebarTab === "buffer" && (
              <div className="space-y-2">
                <div className="text-white/30 text-[10px] uppercase tracking-widest px-1 mb-2">Неотправленные сигналы</div>
                <div className="px-3 py-3 rounded-lg text-xs text-white/40 text-center"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}>
                  Буфер пуст
                </div>
                <button className="w-full mt-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: "rgba(33,150,243,0.15)", color: "#2196F3", border: "1px solid rgba(33,150,243,0.3)" }}>
                  🔄 Синхронизировать
                </button>
              </div>
            )}
          </div>
        </aside>
      )}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />}

      {/* ─── MAIN ─── */}
      <main className="flex-1 pt-16 px-4 pb-8 max-w-4xl mx-auto w-full">

        {/* Офлайн‑баннер */}
        {connection === "offline" && (
          <div className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
            style={{ background: "rgba(244,67,54,0.12)", color: "#F44336", border: "1px solid rgba(244,67,54,0.25)" }}>
            <Icon name="WifiOff" size={15} />
            Оффлайн‑режим активен · Используются локальные данные
            <button onClick={() => { setConnection("online"); setMode("standard"); }}
              className="ml-auto text-xs underline opacity-70 hover:opacity-100">Включить связь</button>
          </div>
        )}

        {/* ─── Поисковая строка ─── */}
        <div className="mt-8 mb-6 relative">
          <form onSubmit={handleSearch}>
            <div className="relative rounded-2xl overflow-visible"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: `2px solid ${focused ? "#4CAF50" : "rgba(255,255,255,0.1)"}`,
                boxShadow: focused ? "0 0 0 4px rgba(76,175,80,0.1)" : "none",
                transition: "all 0.2s",
              }}>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder='Введите запрос для анализа через ЦПВОА (например: "ЦПВОА: проверить аномалии в эфире на 101.2 МГц")'
                className="w-full bg-transparent px-5 py-4 pr-20 text-sm text-white placeholder-white/20 outline-none"
                style={{ fontFamily: "Roboto, sans-serif", fontSize: "14px" }}
              />
              <button type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #4CAF50, #2196F3)", color: "#fff" }}>
                <Icon name="Search" size={16} />
              </button>
            </div>
          </form>

          {/* Подсказки автодополнения */}
          {focused && query.length > 3 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-30 shadow-2xl"
              style={{ background: "rgba(20,20,20,0.99)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="px-4 py-2 text-white/20 text-[10px] uppercase tracking-widest border-b"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                Форматы запросов ЦПВОА
              </div>
              {SUGGESTIONS.filter(s => s.toLowerCase().includes(query.toLowerCase().replace("цпвоа: ", ""))).map(s => (
                <button key={s} onMouseDown={() => { setQuery(s); setFocused(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs text-white/60 hover:bg-white/5 hover:text-white/90 transition-all font-mono border-b"
                  style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── Быстрые кнопки ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {[
            { action: "radio",   icon: "📻", label: "Мониторинг эфира",   color: "#4CAF50" },
            { action: "camera",  icon: "📷", label: "Визуальный анализ",  color: "#2196F3" },
            { action: "mesh",    icon: "🌐", label: "Меш‑сеть",           color: "#FFC107" },
            { action: "offline", icon: "🔒", label: connection === "offline" ? "Вкл. связь" : "Оффлайн‑режим", color: "#9E9E9E" },
            { action: "sos",     icon: "⚠️", label: "Экстренный сигнал",  color: "#F44336" },
          ].map(btn => (
            <button key={btn.action} onClick={() => quickAction(btn.action)}
              className="flex flex-col items-center gap-2 px-3 py-4 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95"
              style={{
                background: `${btn.color}12`,
                color: btn.color,
                border: `1px solid ${btn.color}30`,
              }}>
              <span className="text-2xl">{btn.icon}</span>
              <span className="text-center leading-tight">{btn.label}</span>
            </button>
          ))}
        </div>

        {/* ─── КАРТА ИНЦИДЕНТОВ ─── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon name="Map" size={15} style={{ color: "#2196F3" }} />
              <span className="text-sm font-bold text-white/80 tracking-wider uppercase">Карта инцидентов</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: "rgba(33,150,243,0.15)", color: "#2196F3" }}>
                {mapPoints.length} точек
              </span>
              {mapAutoUpdate && (
                <span className="flex items-center gap-1 text-[10px]" style={{ color: "#4CAF50" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  авто-обновление
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/25 font-mono">
                обновл. {mapUpdateCount} раз · {lastMapUpdate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
              <button
                onClick={() => setMapAutoUpdate(v => !v)}
                className="px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
                style={{
                  background: mapAutoUpdate ? "rgba(76,175,80,0.12)" : "rgba(255,255,255,0.05)",
                  color: mapAutoUpdate ? "#4CAF50" : "#888",
                  border: `1px solid ${mapAutoUpdate ? "rgba(76,175,80,0.3)" : "rgba(255,255,255,0.08)"}`,
                }}>
                {mapAutoUpdate ? "⏸ Пауза" : "▶ Запуск"}
              </button>
              <button
                onClick={() => addRandomIncident()}
                className="px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
                style={{ background: "rgba(33,150,243,0.12)", color: "#2196F3", border: "1px solid rgba(33,150,243,0.25)" }}>
                + Добавить
              </button>
              <button
                onClick={() => setShowMap(v => !v)}
                className="px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
                style={{ background: "rgba(255,255,255,0.05)", color: "#888", border: "1px solid rgba(255,255,255,0.08)" }}>
                {showMap ? "Скрыть" : "Показать"}
              </button>
            </div>
          </div>

          {showMap && (
            <div className="relative rounded-2xl overflow-hidden"
              style={{ background: "rgba(10,15,30,0.95)", border: "1px solid rgba(33,150,243,0.2)", height: "320px" }}>

              {/* Фоновая сетка карты */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Сетка */}
                {[10,20,30,40,50,60,70,80,90].map(v => (
                  <g key={v}>
                    <line x1={v} y1="0" x2={v} y2="100" stroke="rgba(33,150,243,0.06)" strokeWidth="0.3" />
                    <line x1="0" y1={v} x2="100" y2={v} stroke="rgba(33,150,243,0.06)" strokeWidth="0.3" />
                  </g>
                ))}
                {/* Контур "России" — упрощённый */}
                <polyline
                  points="18,22 28,18 42,14 55,12 70,15 82,20 88,28 85,40 80,52 75,60 70,65 60,68 50,70 40,68 30,62 22,55 16,45 14,35 18,22"
                  fill="rgba(33,150,243,0.04)" stroke="rgba(33,150,243,0.15)" strokeWidth="0.5" />
                {/* Ура л */}
                <line x1="52" y1="12" x2="52" y2="70" stroke="rgba(33,150,243,0.08)" strokeWidth="0.4" strokeDasharray="1,2" />
                {/* Метки городов */}
                <text x="54" y="37" fill="rgba(255,255,255,0.12)" fontSize="2.2" fontFamily="monospace">Москва</text>
                <text x="38" y="30" fill="rgba(255,255,255,0.08)" fontSize="1.8" fontFamily="monospace">СПб</text>
                <text x="65" y="42" fill="rgba(255,255,255,0.08)" fontSize="1.8" fontFamily="monospace">Екб</text>
                <text x="74" y="48" fill="rgba(255,255,255,0.08)" fontSize="1.8" fontFamily="monospace">Новосиб</text>
                {/* Точки инцидентов */}
                {mapPoints.map(pt => {
                  const cfg = THREAT_CONFIG[pt.threat];
                  const isSelected = selectedMapPoint?.id === pt.id;
                  return (
                    <g key={pt.id} style={{ cursor: "pointer" }} onClick={() => setSelectedMapPoint(p => p?.id === pt.id ? null : pt)}>
                      {pt.pulse && (
                        <circle cx={pt.x} cy={pt.y} r="4" fill="none" stroke={cfg.color} strokeWidth="0.5" opacity="0.4">
                          <animate attributeName="r" values="3;8;3" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                        </circle>
                      )}
                      <circle
                        cx={pt.x} cy={pt.y} r={isSelected ? "3.5" : "2.5"}
                        fill={cfg.color}
                        stroke={isSelected ? "#fff" : "rgba(0,0,0,0.5)"}
                        strokeWidth={isSelected ? "0.8" : "0.4"}
                        opacity="0.9"
                      />
                      <text x={pt.x + 3} y={pt.y + 1} fill="rgba(255,255,255,0.55)" fontSize="1.8" fontFamily="monospace">
                        {pt.label.length > 12 ? pt.label.slice(0, 12) + "…" : pt.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Легенда */}
              <div className="absolute bottom-3 left-3 flex items-center gap-3">
                {(Object.entries(THREAT_CONFIG) as Array<[string, typeof THREAT_CONFIG["low"]]>).map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                    <span className="text-[9px] text-white/40">{cfg.label}</span>
                  </div>
                ))}
              </div>

              {/* Счётчик в правом углу */}
              <div className="absolute top-3 right-3 text-[10px] font-mono text-white/25">
                {mapPoints.filter(p => p.threat === "critical").length > 0 && (
                  <span className="text-red-400 font-bold animate-pulse">
                    ⚠ {mapPoints.filter(p => p.threat === "critical").length} критических
                  </span>
                )}
              </div>

              {/* Popup выбранной точки */}
              {selectedMapPoint && (
                <div className="absolute top-3 left-3 px-3 py-2.5 rounded-xl max-w-[200px] shadow-xl"
                  style={{ background: "rgba(10,15,30,0.97)", border: `1px solid ${THREAT_CONFIG[selectedMapPoint.threat].color}40` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <ThreatBadge level={selectedMapPoint.threat} />
                    <button onClick={() => setSelectedMapPoint(null)} className="ml-auto text-white/30 hover:text-white text-xs">✕</button>
                  </div>
                  <div className="text-xs font-bold text-white/90">{selectedMapPoint.label}</div>
                  <div className="text-[10px] text-white/40 mt-0.5">{selectedMapPoint.category}</div>
                  <div className="text-[10px] text-white/25 mt-1 font-mono">
                    x:{selectedMapPoint.x.toFixed(1)} y:{selectedMapPoint.y.toFixed(1)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Результаты / Расширенный режим ─── */}
        {(mode === "advanced" || results.length > 0) && (
          <div className="space-y-6">

            {/* Сводка инцидентов */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Icon name="AlertTriangle" size={15} style={{ color: "#FFC107" }} />
                <span className="text-sm font-bold text-white/80 tracking-wider uppercase">Инциденты</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(244,67,54,0.2)", color: "#F44336" }}>
                  {results.length}
                </span>
              </div>
              <div className="space-y-2">
                {(results.length > 0 ? results : MOCK_INCIDENTS).map(inc => (
                  <div key={inc.id} className="flex items-start gap-3 px-4 py-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-white/80">{inc.category}</span>
                        <ThreatBadge level={inc.threat} />
                        <span className="text-[10px] text-white/30">{inc.time}</span>
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed">{inc.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/25">
                        <span>📍 {inc.location}</span>
                        <span>📡 {inc.source}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Источники данных */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Icon name="Database" size={15} style={{ color: "#2196F3" }} />
                <span className="text-sm font-bold text-white/80 tracking-wider uppercase">Источники данных</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { src: "📻 Радио",     active: sensors.radio,  count: 3 },
                  { src: "📷 Камеры",    active: sensors.camera, count: 1 },
                  { src: "🌐 Меш‑сеть", active: sensors.mesh,   count: 2 },
                  { src: "💻 Интернет",  active: connection !== "offline", count: 0 },
                ].map(s => (
                  <div key={s.src} className="px-3 py-2.5 rounded-xl text-xs flex items-center justify-between"
                    style={{ background: s.active ? "rgba(76,175,80,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${s.active ? "rgba(76,175,80,0.2)" : "rgba(255,255,255,0.06)"}` }}>
                    <span style={{ color: s.active ? "#fff" : "#555" }}>{s.src}</span>
                    {s.count > 0 && <span className="font-bold" style={{ color: "#F44336" }}>{s.count}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Рекомендации */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Icon name="Lightbulb" size={15} style={{ color: "#4CAF50" }} />
                <span className="text-sm font-bold text-white/80 tracking-wider uppercase">Рекомендации</span>
              </div>
              <div className="space-y-2">
                {[
                  { p: "1", text: "Активировать все датчики для подтверждения критического инцидента (узел #буфер)", color: "#F44336" },
                  { p: "2", text: "Переключить соединение на меш‑сеть для обхода потенциально скомпрометированного канала", color: "#FFC107" },
                  { p: "3", text: "Буферизировать исходящие сообщения до завершения верификации источника аномалии", color: "#2196F3" },
                ].map(r => (
                  <div key={r.p} className="flex items-start gap-3 px-4 py-3 rounded-xl"
                    style={{ background: `${r.color}08`, border: `1px solid ${r.color}20` }}>
                    <span className="text-xs font-black" style={{ color: r.color }}>{r.p}.</span>
                    <p className="text-xs text-white/60 leading-relaxed">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Таймлайн */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Icon name="Clock" size={15} style={{ color: "#9E9E9E" }} />
                <span className="text-sm font-bold text-white/80 tracking-wider uppercase">Хронология аномалий</span>
              </div>
              <div className="relative pl-5">
                <div className="absolute left-2 top-0 bottom-0 w-px" style={{ background: "rgba(255,255,255,0.1)" }} />
                {TIMELINE.map((ev, i) => (
                  <div key={i} className="relative mb-4 last:mb-0">
                    <div className="absolute -left-3.5 top-1 w-3 h-3 rounded-full border-2"
                      style={{ background: THREAT_CONFIG[ev.threat].color, borderColor: "#2B2B2B" }} />
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono" style={{ color: "#9E9E9E" }}>{ev.time}</span>
                      <span className="text-xs text-white/70">{ev.event}</span>
                      <ThreatBadge level={ev.threat} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Стандартный режим — подсказка */}
        {mode === "standard" && results.length === 0 && (
          <div className="text-center py-16 text-white/20">
            <div className="text-6xl mb-4">🔍</div>
            <div className="text-lg font-bold mb-2">ЦПВОА готов к работе</div>
            <div className="text-sm">Введите запрос или выберите быстрое действие</div>
            <div className="mt-6 text-xs font-mono space-y-1">
              {SUGGESTIONS.slice(0, 3).map(s => (
                <div key={s} className="opacity-40">{s}</div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="text-center py-4 text-[10px] text-white/15"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        ЦПВОА · Версия 1.0 · Правообладатель: Николаев В.В. · 2026
      </footer>
    </div>
  );
}