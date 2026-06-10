import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

interface Incident {
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  time: string;
  description: string;
  coords: string;
  source: string;
}

interface AnomalyEvent {
  time: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
}

const SEVERITY_COLOR: Record<string, string> = {
  low: "#34d399",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#e94560",
};

const SEVERITY_LABEL: Record<string, string> = {
  low: "Низкая",
  medium: "Средняя",
  high: "Высокая",
  critical: "Критическая",
};

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: "1",
    type: "Визуальный",
    severity: "critical",
    time: "21:09",
    description: "Дрейф частоты приёмника сверх нормы — визуальный",
    coords: "64.5°N 102.6°E",
    source: "Визуальный #8",
  },
];

const ANOMALY_HISTORY: AnomalyEvent[] = [
  { time: "14:32", title: "Аномалия FM 101.2 МГц", severity: "high" },
  { time: "14:15", title: "Световой сигнал — камера #4", severity: "medium" },
  { time: "13:58", title: "Неизвестный меш-узел #7", severity: "low" },
  { time: "13:45", title: "Атака на буфер сообщений", severity: "critical" },
  { time: "12:10", title: "Синхронизация завершена", severity: "low" },
];

const SOURCES = [
  { id: "radio", label: "Радио", icon: "Radio", count: 3, color: "#34d399" },
  { id: "camera", label: "Камеры", icon: "Camera", count: 1, color: "#60a5fa" },
  { id: "mesh", label: "Меш-сеть", icon: "Network", count: 2, color: "#a78bfa" },
  { id: "inet", label: "Интернет", icon: "Globe", count: 0, color: "#34d399" },
];

// Узлы на "карте" (радар)
const MAP_NODES = [
  { id: "buf1", label: "Буфер", x: 42, y: 52, severity: "critical" as const },
  { id: "buf2", label: "Буфер #3", x: 38, y: 48, severity: "critical" as const },
  { id: "fm",   label: "FM 101.2 МГц", x: 50, y: 44, severity: "medium" as const },
  { id: "mesh", label: "Меш-узел #7", x: 62, y: 50, severity: "medium" as const },
  { id: "ext",  label: "Внешний IP", x: 74, y: 40, severity: "high" as const },
];

const EcsuCpvoa = () => {
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [updateCount, setUpdateCount] = useState(1);
  const [lastUpdate, setLastUpdate] = useState("21:09:21");
  const [aiQuery, setAiQuery] = useState("");
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [newIncident, setNewIncident] = useState({ type: "", description: "", severity: "medium" as Incident["severity"], coords: "", source: "" });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPaused) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      const now = new Date();
      setLastUpdate(`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`);
      setUpdateCount(c => c + 1);
    }, 8000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPaused]);

  const addIncident = () => {
    if (!newIncident.type || !newIncident.description) return;
    const now = new Date();
    setIncidents(prev => [{
      id: Date.now().toString(),
      ...newIncident,
      time: `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`,
    }, ...prev]);
    setNewIncident({ type: "", description: "", severity: "medium", coords: "", source: "" });
    setShowAddForm(false);
  };

  const criticalCount = incidents.filter(i => i.severity === "critical").length;

  return (
    <div className="flex flex-col h-full bg-[#080c1a] text-white">

      {/* Поисковая строка ИИ */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 bg-[#0d1225] border border-blue-900/40 rounded-lg px-3 py-2.5">
          <input
            value={aiQuery}
            onChange={e => setAiQuery(e.target.value)}
            placeholder="Введите запрос для анализа через ЦПВОА (например: 'ЦПВОА: проверить аномалии в эфире на 101.2 МГц')"
            className="flex-1 bg-transparent text-sm text-gray-300 placeholder-gray-600 outline-none"
          />
          <button className="w-8 h-8 bg-[#34d399] rounded-lg flex items-center justify-center hover:bg-[#22c55e] transition-colors flex-shrink-0">
            <Icon name="Search" size={14} className="text-black" />
          </button>
        </div>
      </div>

      {/* Быстрые кнопки модулей */}
      <div className="px-4 pb-3 grid grid-cols-5 gap-2">
        {[
          { label: "Мониторинг эфира", icon: "Radio", color: "#34d399", bg: "#1a3d2e" },
          { label: "Визуальный анализ", icon: "Eye", color: "#60a5fa", bg: "#1e3a5f" },
          { label: "Меш-сеть", icon: "Network", color: "#f59e0b", bg: "#3d2e00" },
          { label: "Оффлайн-режим", icon: "WifiOff", color: "#94a3b8", bg: "#1e2533" },
          { label: "Экстренный сигнал", icon: "Siren", color: "#e94560", bg: "#3d1520" },
        ].map(btn => (
          <button
            key={btn.label}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all hover:opacity-80"
            style={{ background: btn.bg, borderColor: btn.color + "44" }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: btn.color + "22" }}>
              <Icon name={btn.icon} size={16} style={{ color: btn.color }} />
            </div>
            <span className="text-[10px] font-medium text-center leading-tight" style={{ color: btn.color }}>{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Карта инцидентов */}
      <div className="px-4 pb-3">
        <div className="bg-[#0a0f1e] border border-blue-900/40 rounded-xl overflow-hidden">
          {/* Заголовок карты */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-blue-900/30">
            <Icon name="Map" size={14} className="text-blue-400" />
            <span className="text-blue-300 text-xs font-semibold uppercase tracking-wider">Карта инцидентов</span>
            <span className="px-1.5 py-0.5 bg-blue-900/40 rounded text-[10px] text-blue-400">{incidents.length} точек</span>
            <span className="px-1.5 py-0.5 bg-[#34d399]/10 border border-[#34d399]/20 rounded text-[10px] text-[#34d399] flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#34d399] rounded-full animate-pulse inline-block" />
              авто-обновление
            </span>
            <span className="text-gray-600 text-[10px] ml-auto">обновл. {updateCount} раз · {lastUpdate}</span>
            <button
              onClick={() => setIsPaused(p => !p)}
              className="px-2 py-0.5 rounded text-[10px] border flex items-center gap-1"
              style={isPaused
                ? { background: "#34d399"+"22", borderColor: "#34d399"+"44", color: "#34d399" }
                : { background: "#f59e0b"+"22", borderColor: "#f59e0b"+"44", color: "#f59e0b" }
              }
            >
              <Icon name={isPaused ? "Play" : "Pause"} size={10} />
              {isPaused ? "Старт" : "Пауза"}
            </button>
            <button
              onClick={() => setShowAddForm(s => !s)}
              className="px-2 py-0.5 rounded text-[10px] border border-blue-700/40 text-blue-400 hover:bg-blue-900/30 transition-colors flex items-center gap-1"
            >
              <Icon name="Plus" size={10} />
              Добавить
            </button>
            <button className="px-2 py-0.5 rounded text-[10px] border border-gray-700/40 text-gray-500 hover:bg-gray-900/30 transition-colors">
              Скрыть
            </button>
          </div>

          {/* Визуальная "карта" — эллипс-радар */}
          <div className="relative bg-[#060b18] h-48 overflow-hidden">
            {/* Концентрические эллипсы */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <ellipse cx="50" cy="55" rx="48" ry="30" fill="none" stroke="#1e3a5f" strokeWidth="0.3" />
              <ellipse cx="50" cy="55" rx="34" ry="21" fill="none" stroke="#1e3a5f" strokeWidth="0.3" />
              <ellipse cx="50" cy="55" rx="20" ry="13" fill="none" stroke="#1e3a5f" strokeWidth="0.3" />
              <ellipse cx="50" cy="55" rx="48" ry="30" fill="rgba(30,58,95,0.08)" />
              {/* Линии сетки */}
              <line x1="2" y1="55" x2="98" y2="55" stroke="#1e3a5f" strokeWidth="0.2" />
              <line x1="50" y1="25" x2="50" y2="85" stroke="#1e3a5f" strokeWidth="0.2" />
            </svg>

            {/* Узлы */}
            {MAP_NODES.map(node => (
              <div
                key={node.id}
                className="absolute flex flex-col items-center"
                style={{ left: `${node.x}%`, top: `${node.y}%`, transform: "translate(-50%,-50%)" }}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 animate-pulse"
                  style={{
                    background: SEVERITY_COLOR[node.severity] + "88",
                    borderColor: SEVERITY_COLOR[node.severity],
                    boxShadow: `0 0 8px ${SEVERITY_COLOR[node.severity]}88`,
                  }}
                />
                <span className="text-[8px] mt-0.5 px-1 py-0.5 bg-black/60 rounded whitespace-nowrap" style={{ color: SEVERITY_COLOR[node.severity] }}>
                  {node.label}
                </span>
              </div>
            ))}

            {/* Критических метка */}
            {criticalCount > 0 && (
              <div className="absolute top-2 right-3 flex items-center gap-1 text-[10px] text-[#e94560]">
                <Icon name="AlertTriangle" size={10} className="text-[#e94560]" />
                {criticalCount} критических
              </div>
            )}

            {/* Легенда */}
            <div className="absolute bottom-2 left-3 flex items-center gap-3">
              {["low","medium","high","critical"].map(s => (
                <div key={s} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: SEVERITY_COLOR[s] }} />
                  <span className="text-[8px] text-gray-500">{SEVERITY_LABEL[s]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Форма добавления инцидента */}
      {showAddForm && (
        <div className="px-4 pb-3">
          <div className="bg-[#0d1225] border border-blue-900/40 rounded-xl p-4 space-y-3">
            <div className="text-sm font-semibold text-blue-300 flex items-center gap-2">
              <Icon name="Plus" size={14} />
              Новый инцидент
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={newIncident.type} onChange={e => setNewIncident(p => ({...p, type: e.target.value}))}
                placeholder="Тип (Визуальный, Радио...)"
                className="bg-[#060b18] border border-blue-900/30 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 outline-none" />
              <select value={newIncident.severity} onChange={e => setNewIncident(p => ({...p, severity: e.target.value as Incident["severity"]}))}
                className="bg-[#060b18] border border-blue-900/30 rounded-lg px-3 py-1.5 text-sm text-white outline-none">
                {["low","medium","high","critical"].map(s => <option key={s} value={s}>{SEVERITY_LABEL[s]}</option>)}
              </select>
            </div>
            <input value={newIncident.description} onChange={e => setNewIncident(p => ({...p, description: e.target.value}))}
              placeholder="Описание инцидента"
              className="w-full bg-[#060b18] border border-blue-900/30 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 outline-none" />
            <div className="grid grid-cols-2 gap-2">
              <input value={newIncident.coords} onChange={e => setNewIncident(p => ({...p, coords: e.target.value}))}
                placeholder="Координаты (64.5°N 102.6°E)"
                className="bg-[#060b18] border border-blue-900/30 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 outline-none" />
              <input value={newIncident.source} onChange={e => setNewIncident(p => ({...p, source: e.target.value}))}
                placeholder="Источник"
                className="bg-[#060b18] border border-blue-900/30 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 outline-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={addIncident} className="flex-1 py-1.5 bg-[#34d399] text-black text-sm font-semibold rounded-lg hover:bg-[#22c55e] transition-colors">Добавить</button>
              <button onClick={() => setShowAddForm(false)} className="px-4 py-1.5 bg-gray-800 text-gray-400 text-sm rounded-lg hover:bg-gray-700 transition-colors">Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* Список инцидентов */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="AlertTriangle" size={14} className="text-[#f59e0b]" />
          <span className="text-sm font-semibold text-white uppercase tracking-wider">Инциденты</span>
          <span className="w-5 h-5 flex items-center justify-center bg-[#e94560] text-white text-[10px] font-bold rounded-full">{incidents.length}</span>
        </div>
        <div className="space-y-2">
          {incidents.map(inc => (
            <div key={inc.id} className="bg-[#0a0f1e] border border-blue-900/30 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-300">{inc.type}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: SEVERITY_COLOR[inc.severity]+"22", color: SEVERITY_COLOR[inc.severity] }}>
                  {SEVERITY_LABEL[inc.severity]}
                </span>
                <span className="text-gray-600 text-[10px] ml-auto">{inc.time}</span>
              </div>
              <p className="text-gray-400 text-xs">{inc.description}</p>
              {(inc.coords || inc.source) && (
                <div className="flex items-center gap-3 mt-1.5">
                  {inc.coords && <span className="text-[10px] text-gray-600">{inc.coords}</span>}
                  {inc.source && (
                    <span className="flex items-center gap-1 text-[10px] text-blue-400">
                      <Icon name="Link" size={9} />
                      {inc.source}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Источники данных */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="Database" size={14} className="text-blue-400" />
          <span className="text-sm font-semibold text-white uppercase tracking-wider">Источники данных</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {SOURCES.map(src => (
            <div
              key={src.id}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border"
              style={{ background: src.color + "11", borderColor: src.color + "33" }}
            >
              <Icon name={src.icon} size={13} style={{ color: src.color }} />
              <span className="text-xs text-gray-300">{src.label}</span>
              {src.count > 0 && (
                <span className="ml-auto text-[10px] font-bold" style={{ color: src.color }}>{src.count}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Рекомендации */}
      {showRecommendations && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Lightbulb" size={14} className="text-[#f59e0b]" />
            <span className="text-sm font-semibold text-white uppercase tracking-wider">Рекомендации</span>
          </div>
          <div className="space-y-2">
            {[
              "Активировать все датчики для подтверждения критического инцидента (узел #буфер)",
              "Переключить соединение на меш-сеть для обхода потенциально скомпрометированного канала",
              "Буферизировать исходящие сообщения до завершения верификации источника аномалии",
            ].map((rec, i) => (
              <div key={i} className="flex items-start gap-3 bg-[#0a0f1e] border border-blue-900/30 rounded-xl px-4 py-2.5">
                <span className="w-5 h-5 flex items-center justify-center bg-blue-900/40 text-blue-400 text-[10px] font-bold rounded-full flex-shrink-0 mt-0.5">{i+1}</span>
                <span className="text-gray-300 text-xs leading-relaxed">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Хронология аномалий */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="Clock" size={14} className="text-gray-400" />
          <span className="text-sm font-semibold text-white uppercase tracking-wider">Хронология аномалий</span>
        </div>
        <div className="space-y-1.5">
          {ANOMALY_HISTORY.map((ev, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 bg-[#0a0f1e] border border-blue-900/20 rounded-lg">
              <span className="text-[10px] text-gray-600 w-10 flex-shrink-0">{ev.time}</span>
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: SEVERITY_COLOR[ev.severity] }}
              />
              <span className="text-xs text-gray-300 flex-1">{ev.title}</span>
              <span
                className="px-2 py-0.5 rounded-full text-[9px] font-semibold flex-shrink-0"
                style={{ background: SEVERITY_COLOR[ev.severity]+"22", color: SEVERITY_COLOR[ev.severity] }}
              >
                {SEVERITY_LABEL[ev.severity]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EcsuCpvoa;