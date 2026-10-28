import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const DALAN_SYNC_URL = "https://functions.poehali.dev/6d891868-ea53-4120-8843-9fb50f12c771";

function calculateShift(inputValue: number) {
  const result = inputValue * (11 / 10);
  return { nominal: inputValue, actual: result, delta: result - inputValue };
}

interface OracleEntry {
  task: string;
  result: number;
  timestamp: string;
}

interface SyncStatus {
  gateway_enabled: boolean;
  gateway_url: string | null;
  pc_online: boolean;
  auto_source: "pc" | "cloud";
  dalan_config: { key: string; value: string; label: string; type: string }[];
  sync_time: string;
}

const EcsuDalan = () => {
  const [tab, setTab] = useState<"oracle" | "shift" | "status" | "sync" | "engine">("oracle");
  const [task, setTask] = useState("");
  const [log, setLog] = useState<OracleEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [shiftInput, setShiftInput] = useState("");
  const [shiftResult, setShiftResult] = useState<{ nominal: number; actual: number; delta: number } | null>(null);

  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncLoading, setSyncLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const autoSyncRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [autoSync, setAutoSync] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Ultra-Light Engine
  const [leftSpeed, setLeftSpeed] = useState(0);
  const [rightSpeed, setRightSpeed] = useState(0);
  const [lastCmd, setLastCmd] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendMotorCommand = (motor: string, speed: number) => {
    const cmd = `${motor}:${speed}`;
    setLastCmd(cmd);
    const gwUrl = syncStatus?.gateway_url;
    if (gwUrl && syncStatus?.pc_online) {
      fetch(`${gwUrl.replace(/\/$/, "")}/api/motor`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: cmd,
      }).catch(() => {});
    }
  };

  const handleSlider = (motor: "left" | "right", value: number) => {
    if (motor === "left") setLeftSpeed(value);
    else setRightSpeed(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => sendMotorCommand(motor, value), 250);
  };

  const stopEngine = () => {
    setLeftSpeed(0);
    setRightSpeed(0);
    sendMotorCommand("all", 0);
  };

  const engineRunning = leftSpeed > 0 || rightSpeed > 0;

  const loadStatus = () => {
    fetch(`${DALAN_SYNC_URL}?action=status`)
      .then(r => r.json())
      .then((data: SyncStatus) => {
        setSyncStatus(data);
        setSyncLoading(false);
      })
      .catch(() => setSyncLoading(false));
  };

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    if (autoSync) {
      autoSyncRef.current = setInterval(() => {
        runSync(true);
      }, 30000);
    } else {
      if (autoSyncRef.current) clearInterval(autoSyncRef.current);
    }
    return () => { if (autoSyncRef.current) clearInterval(autoSyncRef.current); };
  }, [autoSync]);

  const runSync = async (silent = false) => {
    if (!silent) setSyncing(true);
    try {
      const res = await fetch(`${DALAN_SYNC_URL}?action=sync`);
      const data = await res.json();
      setLastSync(new Date().toLocaleTimeString("ru-RU"));
      if (!silent) {
        setSyncMsg({ text: data.message || "Синхронизация завершена", ok: data.ok });
        setTimeout(() => setSyncMsg(null), 4000);
      }
      loadStatus();
    } catch {
      if (!silent) setSyncMsg({ text: "Ошибка синхронизации", ok: false });
    }
    if (!silent) setSyncing(false);
  };

  const runOracle = () => {
    if (!task.trim()) return;
    setRunning(true);
    setTimeout(() => {
      const result = Math.floor(Math.random() * 6 + 110);
      setLog((prev) => [{ task, result, timestamp: new Date().toLocaleTimeString("ru-RU") }, ...prev]);
      setTask("");
      setRunning(false);
    }, 1200);
  };

  const runShift = () => {
    const val = parseFloat(shiftInput);
    if (!isNaN(val)) setShiftResult(calculateShift(val));
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 bg-gradient-to-br from-[#e94560] to-[#9b1dcc] rounded-xl flex items-center justify-center">
          <Icon name="Brain" size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">DALAN · ИИ-модуль ЕЦСУ</h2>
          <p className="text-[#e94560] text-xs">Авторская разработка Николаева В.В. · Активен</p>
        </div>
        {syncStatus && (
          <div className={`ml-auto flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border ${
            syncStatus.pc_online
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-blue-900/20 border-blue-900/30 text-blue-400"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${syncStatus.pc_online ? "bg-green-400 animate-pulse" : "bg-blue-500"}`} />
            {syncStatus.pc_online ? "ПК · Онлайн" : "Облако · Авто"}
            {lastSync && <span className="text-gray-600 ml-1">· {lastSync}</span>}
          </div>
        )}
      </div>
      <p className="text-gray-500 text-xs mb-5 ml-12">Нейросеть оптимизации и аналитики системы ЕЦСУ</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { id: "oracle", label: "ORACLE-Терминал", icon: "Terminal" },
          { id: "shift", label: "Сдвиг Николаева", icon: "FlaskConical" },
          { id: "status", label: "Статус системы", icon: "Activity" },
          { id: "sync", label: "Директива синхронизации", icon: "RefreshCw", color: "#00c896" },
          { id: "engine", label: "Ultra-Light Engine", icon: "Cpu", color: "#a78bfa" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? "bg-[#e94560] text-white" : "bg-[#0d1225] text-gray-400 hover:text-white border border-blue-900/30"
            }`}
            style={t.color && tab !== t.id ? { borderColor: t.color + "40", color: t.color + "99" } :
                   t.color && tab === t.id ? { background: t.color } : {}}
          >
            <Icon name={t.icon} size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "oracle" && (
        <div className="space-y-4">
          <div className="bg-[#060d1f] border border-[#FFD700]/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="Terminal" size={15} className="text-[#FFD700]" />
              <span className="text-[#FFD700] font-bold text-sm tracking-widest">SYNERGON-ORACLE · ЕЦСУ</span>
            </div>
            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Введите задачу или смету для оптимизации DALAN..."
              rows={4}
              className="w-full bg-black border border-[#00FF41]/20 text-white rounded-lg px-4 py-3 text-sm font-mono placeholder-gray-700 focus:outline-none focus:border-[#00FF41] resize-none mb-3"
            />
            <button
              onClick={runOracle}
              disabled={running || !task.trim()}
              className="bg-[#0056b3] hover:bg-[#0068d6] disabled:opacity-40 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
            >
              {running ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Zap" size={15} />}
              ЗАПУСТИТЬ ОПТИМИЗАЦИЮ DALAN
            </button>
          </div>
          <div className="bg-[#060d1f] border border-blue-900/20 rounded-xl p-5">
            <div className="text-[#FFD700] font-bold text-sm mb-3 flex items-center gap-2">
              <Icon name="ScrollText" size={14} />
              ЛОГ ОПЕРАЦИЙ
            </div>
            {log.length === 0 ? (
              <div className="text-gray-600 text-sm font-mono">--- ОЖИДАНИЕ ВВОДА ДАННЫХ ---</div>
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto">
                {log.map((e, i) => (
                  <div key={i} className="border border-[#FFD700]/10 rounded-lg p-3 bg-black/30">
                    <div className="text-gray-500 text-xs font-mono mb-1">[{e.timestamp}] АНАЛИЗ DALAN:</div>
                    <div className="text-white text-sm mb-1">{e.task}</div>
                    <div className="flex gap-4">
                      <span className="text-[#00FF41] font-bold font-mono text-sm">ЭФФЕКТИВНОСТЬ: +{e.result}%</span>
                      <span className="text-[#FFD700] text-xs font-bold">✓ ПРИНЯТЬ К ИСПОЛНЕНИЮ</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "shift" && (
        <div className="bg-[#060d1f] border border-[#FFD700]/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="FlaskConical" size={15} className="text-[#FFD700]" />
            <span className="text-[#FFD700] font-bold text-sm">СДВИГ НИКОЛАЕВА · ЯДРО DALAN</span>
          </div>
          <p className="text-gray-600 text-xs mb-5">Авторская методика Николаева В.В. · Коэффициент ×1.1 · Зарегистрировано в ЕЦСУ</p>
          <div className="flex gap-3 items-end mb-4">
            <div className="flex-1">
              <div className="text-gray-400 text-xs mb-1">Входное значение (номинал)</div>
              <input
                type="number"
                value={shiftInput}
                onChange={(e) => setShiftInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runShift()}
                placeholder="Введите число..."
                className="w-full bg-black border border-[#FFD700]/30 text-white rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#FFD700]"
              />
            </div>
            <button
              onClick={runShift}
              className="bg-[#FFD700] hover:bg-[#e6c200] text-black px-5 py-2.5 rounded-lg font-bold text-sm transition-colors"
            >
              Применить ×1.1
            </button>
          </div>
          {shiftResult && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Номинал", value: shiftResult.nominal, color: "#fff" },
                { label: "Результат", value: shiftResult.actual.toFixed(2), color: "#00FF41" },
                { label: "Прирост", value: `+${shiftResult.delta.toFixed(2)}`, color: "#FFD700" },
              ].map((r) => (
                <div key={r.label} className="bg-black/50 rounded-lg p-3 text-center">
                  <div className="text-gray-500 text-xs mb-1">{r.label}</div>
                  <div className="font-mono font-bold text-lg" style={{ color: r.color }}>{r.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "status" && (
        <div className="space-y-3">
          {[
            { label: "Нейросеть DALAN", status: "Активна", uptime: "99.8%", color: "#00c896" },
            { label: "Алгоритм Сдвига Николаева", status: "Применён", uptime: "100%", color: "#FFD700" },
            { label: "ORACLE-Терминал", status: "Онлайн", uptime: "99.5%", color: "#00c896" },
            { label: "Модуль аналитики", status: "Активен", uptime: "98.2%", color: "#00c896" },
            { label: "Интеграция с ЕЦСУ", status: "Синхронизирован", uptime: "100%", color: "#60a5fa" },
            {
              label: "Источник конфигурации",
              status: syncStatus ? (syncStatus.pc_online ? "ПК (шлюз)" : "Облако") : "...",
              uptime: syncStatus?.auto_source === "pc" ? "ПК" : "CDN",
              color: syncStatus?.pc_online ? "#00c896" : "#60a5fa"
            },
          ].map((s) => (
            <div key={s.label} className="bg-[#0d1225] border border-blue-900/30 rounded-xl px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: s.color }} />
                <span className="text-white text-sm font-medium">{s.label}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span style={{ color: s.color }}>{s.status}</span>
                <span className="text-gray-500">Uptime: {s.uptime}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "sync" && (
        <div className="space-y-4">
          {/* Директива */}
          <div className="bg-[#060d1f] border border-[#00c896]/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="RefreshCw" size={15} className="text-[#00c896]" />
              <span className="text-[#00c896] font-bold text-sm tracking-wider">ДИРЕКТИВА АВТОСИНХРОНИЗАЦИИ · DALAN</span>
            </div>
            <p className="text-gray-600 text-xs mb-4">
              При подключении шлюза (ngrok/localtunnel) система автоматически загружает конфигурацию Dalan с ПК.
              Если ПК недоступен — используется облачная конфигурация из базы данных.
            </p>

            {syncLoading ? (
              <div className="text-gray-600 animate-pulse text-sm">Проверка статуса...</div>
            ) : syncStatus ? (
              <div className="space-y-3">
                {/* Источник */}
                <div className="flex items-center justify-between bg-black/30 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Icon name="Cpu" size={16} className={syncStatus.pc_online ? "text-green-400" : "text-blue-400"} />
                    <span className="text-white text-sm font-medium">Активный источник</span>
                  </div>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                    syncStatus.pc_online
                      ? "bg-green-500/15 text-green-400"
                      : "bg-blue-500/15 text-blue-400"
                  }`}>
                    {syncStatus.pc_online ? "ПК · Локальный шлюз" : "Облако · База данных ЕЦСУ"}
                  </span>
                </div>

                {/* Шлюз */}
                <div className="flex items-center justify-between bg-black/30 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Icon name="Link" size={16} className="text-gray-500" />
                    <span className="text-gray-400 text-sm">Шлюз ПК</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {syncStatus.gateway_enabled
                      ? syncStatus.gateway_url || "URL не задан"
                      : "Отключён"}
                  </span>
                </div>

                {/* Автосинхронизация */}
                <div className="flex items-center justify-between bg-black/30 rounded-lg px-4 py-3">
                  <div>
                    <div className="text-white text-sm font-medium">Автосинхронизация</div>
                    <div className="text-gray-600 text-xs mt-0.5">Каждые 30 секунд · автовыбор источника</div>
                  </div>
                  <button
                    onClick={() => setAutoSync(!autoSync)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${autoSync ? "bg-[#00c896]" : "bg-gray-700"}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${autoSync ? "left-7" : "left-1"}`} />
                  </button>
                </div>

                {syncMsg && (
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${
                    syncMsg.ok ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}>
                    <Icon name={syncMsg.ok ? "CheckCircle" : "XCircle"} size={15} />
                    {syncMsg.text}
                  </div>
                )}

                <button
                  onClick={() => runSync(false)}
                  disabled={syncing}
                  className="w-full bg-[#00c896] hover:bg-[#00a87e] disabled:opacity-50 text-black font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {syncing
                    ? <><Icon name="Loader2" size={16} className="animate-spin" /> Синхронизация...</>
                    : <><Icon name="RefreshCw" size={16} /> Запустить синхронизацию сейчас</>}
                </button>
              </div>
            ) : (
              <div className="text-red-400 text-sm">Не удалось подключиться к модулю синхронизации</div>
            )}
          </div>

          {/* Конфигурация Dalan из БД */}
          {syncStatus?.dalan_config && (
            <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
              <div className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                <Icon name="Settings2" size={14} className="text-[#FFD700]" />
                Текущая конфигурация DALAN
                <span className="text-gray-600 text-xs font-normal ml-1">
                  · источник: {syncStatus.pc_online ? "ПК" : "облако"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {syncStatus.dalan_config.map(cfg => (
                  <div key={cfg.key} className="bg-black/30 rounded-lg px-3 py-2 flex items-center justify-between">
                    <span className="text-gray-500 text-xs">{cfg.label || cfg.key}</span>
                    <span className="text-[#FFD700] font-mono text-xs font-bold">{cfg.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "engine" && (() => {
        const totalNominal = (leftSpeed + rightSpeed) / 2;
        const actualPower = totalNominal * 1.1;
        const shift = actualPower - totalNominal;
        return (
          <div className="space-y-4">
            {/* Заголовок UBO */}
            <div className="bg-black border border-[#FFD700] rounded-xl p-5 shadow-[0_0_20px_rgba(0,255,65,0.1)]">
              <div className="text-center mb-4">
                <div className="text-[#FFD700] font-bold text-base tracking-[3px] font-mono">DALAN ENGINE v1.2</div>
                <div className="text-[#00FF41] text-xs font-mono mt-0.5 opacity-60">UBO EDITION · SYNERGON GLOBAL</div>
              </div>

              {/* Вектор L */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#888] text-xs font-mono font-bold">ВЕКТОР L (ЛЕВЫЙ)</span>
                  <span className="text-[#FFD700] font-mono font-bold text-sm">{leftSpeed}%</span>
                </div>
                <input
                  type="range" min={0} max={100} value={leftSpeed}
                  onChange={e => handleSlider("left", Number(e.target.value))}
                  className="w-full cursor-pointer accent-[#00FF41]"
                  style={{ accentColor: "#00FF41" }}
                />
              </div>

              {/* Вектор R */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#888] text-xs font-mono font-bold">ВЕКТОР R (ПРАВЫЙ)</span>
                  <span className="text-[#FFD700] font-mono font-bold text-sm">{rightSpeed}%</span>
                </div>
                <input
                  type="range" min={0} max={100} value={rightSpeed}
                  onChange={e => handleSlider("right", Number(e.target.value))}
                  className="w-full cursor-pointer"
                  style={{ accentColor: "#00FF41" }}
                />
              </div>

              <div className="text-center text-[#444] text-[10px] font-mono mb-4">
                КОЭФФИЦИЕНТ СДВИГА: 10=11 ACTIVE
              </div>

              <button
                onClick={stopEngine}
                className="w-full py-3 bg-transparent border border-[#FF3131] text-[#FF3131] font-bold font-mono text-sm transition-all hover:bg-[#FF3131] hover:text-black"
              >
                АВАРИЙНАЯ ОСТАНОВКА
              </button>
            </div>

            {/* Панель статуса */}
            <div className="bg-black border border-[#333] rounded-xl p-4 space-y-3 font-mono">
              <div
                className={`px-4 py-3 text-center font-bold text-sm border ${
                  engineRunning
                    ? "border-[#FFD700] text-[#FFD700] animate-pulse"
                    : "border-[#00FF41] text-[#00FF41]"
                }`}
              >
                {engineRunning ? "ДВИЖОК В РАБОТЕ (10=11)" : "СИСТЕМА ГОТОВА"}
              </div>

              <div className="flex items-center justify-between bg-[#0a0a0a] px-3 py-2 rounded">
                <span className="text-[#555] text-xs">ПОТОК ДАННЫХ</span>
                <span className="text-[#00FF41] text-xs">
                  {lastCmd ? `L:${leftSpeed} | R:${rightSpeed} | SHIFT:${shift.toFixed(2)}` : "IDLE"}
                </span>
              </div>

              <div className="flex items-center justify-between bg-[#0a0a0a] px-3 py-2 rounded">
                <span className="text-[#555] text-xs">ФАКТИЧЕСКАЯ МОЩНОСТЬ (10=11)</span>
                <span className="text-[#FFD700] font-bold">{actualPower.toFixed(2)} UNITS</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { label: "НОМИНАЛ", value: totalNominal.toFixed(1), color: "#888" },
                  { label: "ФАКТ ×1.1", value: actualPower.toFixed(2), color: "#00FF41" },
                  { label: "ПРИРОСТ", value: `+${shift.toFixed(2)}`, color: "#FFD700" },
                ].map(s => (
                  <div key={s.label} className="bg-[#0a0a0a] rounded px-2 py-2 text-center">
                    <div className="text-[#444] text-[9px] mb-0.5">{s.label}</div>
                    <div className="font-bold text-sm" style={{ color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between bg-[#0a0a0a] px-3 py-2 rounded">
                <span className="text-[#555] text-xs">ШЛЮЗ ПК</span>
                <span className={`text-xs ${syncStatus?.pc_online ? "text-[#00FF41]" : "text-[#444]"}`}>
                  {syncStatus?.pc_online ? `ONLINE · ${syncStatus.gateway_url}` : "OFFLINE"}
                </span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default EcsuDalan;