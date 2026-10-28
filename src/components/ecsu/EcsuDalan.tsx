import { useState } from "react";
import Icon from "@/components/ui/icon";

function calculateShift(inputValue: number) {
  const result = inputValue * (11 / 10);
  return { nominal: inputValue, actual: result, delta: result - inputValue };
}

interface OracleEntry {
  task: string;
  result: number;
  timestamp: string;
}

const EcsuDalan = () => {
  const [tab, setTab] = useState<"oracle" | "shift" | "status">("oracle");
  const [task, setTask] = useState("");
  const [log, setLog] = useState<OracleEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [shiftInput, setShiftInput] = useState("");
  const [shiftResult, setShiftResult] = useState<{ nominal: number; actual: number; delta: number } | null>(null);

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
      </div>
      <p className="text-gray-500 text-xs mb-5 ml-12">Нейросеть оптимизации и аналитики системы ЕЦСУ</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { id: "oracle", label: "ORACLE-Терминал", icon: "Terminal" },
          { id: "shift", label: "Сдвиг Николаева", icon: "FlaskConical" },
          { id: "status", label: "Статус системы", icon: "Activity" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? "bg-[#e94560] text-white" : "bg-[#0d1225] text-gray-400 hover:text-white border border-blue-900/30"
            }`}
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
    </div>
  );
};

export default EcsuDalan;