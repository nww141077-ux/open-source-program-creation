import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import DalanOracle from "./dalan/DalanOracle";
import DalanShift from "./dalan/DalanShift";
import DalanSync from "./dalan/DalanSync";
import DalanEngine from "./dalan/DalanEngine";

const DALAN_SYNC_URL = "https://functions.poehali.dev/6d891868-ea53-4120-8843-9fb50f12c771";
const DALAN_AI_URL = "https://functions.poehali.dev/7b0103d3-1c04-463b-b543-f2f2b89a53df";

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
  const [aiProvider, setAiProvider] = useState("yandex");
  const [aiModel, setAiModel] = useState("yandexgpt-lite");
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [shiftInput, setShiftInput] = useState("");
  const [shiftResult, setShiftResult] = useState<{ nominal: number; actual: number; delta: number } | null>(null);

  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncLoading, setSyncLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const autoSyncRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [autoSync, setAutoSync] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

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

  const runOracle = async () => {
    if (!task.trim()) return;
    setRunning(true);
    setAiReply(null);
    setAiError(null);
    try {
      const res = await fetch(DALAN_AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: aiProvider,
          model: aiModel,
          messages: [{ role: "user", content: task }],
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setAiReply(data.reply);
        const result = Math.floor(Math.random() * 6 + 110);
        setLog((prev) => [{ task, result, timestamp: new Date().toLocaleTimeString("ru-RU") }, ...prev]);
        setTask("");
      } else {
        setAiError(data.error || "Нет ответа от ИИ");
      }
    } catch {
      setAiError("Ошибка соединения с DALAN AI");
    }
    setRunning(false);
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
        <DalanOracle
          task={task}
          setTask={setTask}
          log={log}
          running={running}
          aiProvider={aiProvider}
          setAiProvider={setAiProvider}
          aiModel={aiModel}
          setAiModel={setAiModel}
          aiReply={aiReply}
          aiError={aiError}
          onRun={runOracle}
        />
      )}

      {tab === "shift" && (
        <DalanShift
          shiftInput={shiftInput}
          setShiftInput={setShiftInput}
          shiftResult={shiftResult}
          onRun={runShift}
        />
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
        <DalanSync
          syncStatus={syncStatus}
          syncLoading={syncLoading}
          syncing={syncing}
          syncMsg={syncMsg}
          autoSync={autoSync}
          setAutoSync={setAutoSync}
          onSync={() => runSync(false)}
        />
      )}

      {tab === "engine" && (
        <DalanEngine
          leftSpeed={leftSpeed}
          rightSpeed={rightSpeed}
          lastCmd={lastCmd}
          syncStatus={syncStatus}
          engineRunning={engineRunning}
          onSlider={handleSlider}
          onStop={stopEngine}
        />
      )}
    </div>
  );
};

export default EcsuDalan;
