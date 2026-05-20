import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

// ──────────────────────────────────────────
// ЯДРО TahkaOS
// ──────────────────────────────────────────
class TahkaKernel {
  running = false;
  startTime: number | null = null;
  phaseShift = 0.5;
  processes = 0;
  memoryUsage = 0.35;

  start() {
    if (this.running) return;
    this.running = true;
    this.startTime = Date.now();
    this.processes = Math.floor(Math.random() * 40) + 12;
  }

  stop() {
    this.running = false;
    this.processes = 0;
  }

  calcDynamicLoad(t: number): number[] {
    const loads: number[] = [];
    for (let i = 0; i < 100; i++) {
      const omega = 0.1;
      const phi = (2 * Math.PI / 100) * i;
      const load = 50 * (1 + 0.8 * Math.sin(omega * t + phi + this.phaseShift));
      loads.push(Math.max(0, Math.min(100, Math.round(load))));
    }
    return loads;
  }

  getUptime() {
    if (!this.startTime) return 0;
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  getLoad(): number {
    if (!this.running) return 0;
    const t = Date.now() / 1000;
    const l = this.calcDynamicLoad(t);
    return Math.round(l.reduce((a, b) => a + b, 0) / l.length);
  }
}

// ──────────────────────────────────────────
// БЛОК ПИТАНИЯ
// ──────────────────────────────────────────
class PowerSupply {
  isOn = false;
  voltage = 0;

  turnOn() { this.isOn = true; this.voltage = 12.0; }
  turnOff() { this.isOn = false; this.voltage = 0; }
}

// синглтоны
const kernel = new TahkaKernel();
const psu = new PowerSupply();

// ──────────────────────────────────────────
// ВСПОМОГАТЕЛЬНЫЕ UI
// ──────────────────────────────────────────
const MiniBar = ({ value, color }: { value: number; color: string }) => (
  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
    <div className="h-full rounded-full transition-all duration-500"
      style={{ width: `${Math.min(value, 100)}%`, background: color }} />
  </div>
);

const LogLine = ({ line }: { line: string }) => {
  const isWarn  = line.includes("[WARN]");
  const isOk    = line.includes("[OK]");
  const isErr   = line.includes("[ERR]");
  const color   = isErr ? "#e94560" : isWarn ? "#f59e0b" : isOk ? "#34d399" : "#94a3b8";
  return <div style={{ color }} className="text-xs font-mono leading-5">{line}</div>;
};

// ──────────────────────────────────────────
// ГЛАВНЫЙ КОМПОНЕНТ
// ──────────────────────────────────────────
const EcsuTahkaOS = () => {
  const [tab, setTab] = useState<"kernel" | "monitor" | "calc" | "psu">("kernel");

  // ── ЯДРО ──
  const [kernelRunning, setKernelRunning] = useState(false);
  const [kernelLoad, setKernelLoad] = useState(0);
  const [uptime, setUptime] = useState(0);
  const [log, setLog] = useState<string[]>([
    "[SYS] TahkaOS v1.0.0 — второе ядро ECSU",
    "[SYS] Ожидание команды запуска...",
  ]);
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) =>
    setLog(prev => {
      const ts = new Date().toLocaleTimeString("ru", { hour12: false });
      return [...prev.slice(-120), `[${ts}] ${msg}`];
    });

  const startKernel = () => {
    kernel.start();
    psu.turnOn();
    setKernelRunning(true);
    setPsuOn(true);
    setPsuVoltage(12);
    addLog("[OK] Блок питания: ВКЛ, 12 В");
    addLog("[OK] Запуск ядра TahkaOS...");
    addLog(`[OK] Версия: 1.0.0 · Сдвиг фазы: ${kernel.phaseShift.toFixed(3)} рад`);
    addLog(`[OK] Процессов инициализировано: ${kernel.processes}`);
    addLog("[OK] Ядро ЗАПУЩЕНО и передано в ECSU");
  };

  const stopKernel = () => {
    kernel.stop();
    setKernelRunning(false);
    addLog("[WARN] Остановка ядра TahkaOS...");
    addLog("[SYS] Ядро ОСТАНОВЛЕНО");
  };

  useEffect(() => {
    if (!kernelRunning) return;
    const t = setInterval(() => {
      setKernelLoad(kernel.getLoad());
      setUptime(kernel.getUptime());
    }, 1000);
    return () => clearInterval(t);
  }, [kernelRunning]);

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [log]);

  // ── МОНИТОР ──
  const [cpuHistory, setCpuHistory] = useState<number[]>(Array(30).fill(0));
  const [memHistory, setMemHistory] = useState<number[]>(Array(30).fill(35));

  useEffect(() => {
    if (!kernelRunning) return;
    const t = setInterval(() => {
      const cpu = kernel.getLoad();
      const mem = Math.min(95, kernel.memoryUsage * 100 + (Math.random() - 0.5) * 4);
      setCpuHistory(h => [...h.slice(1), cpu]);
      setMemHistory(h => [...h.slice(1), Math.round(mem)]);
      kernel.memoryUsage = mem / 100;
    }, 1000);
    return () => clearInterval(t);
  }, [kernelRunning]);

  const sparkline = (data: number[], color: string) => {
    const max = 100;
    const w = 4, gap = 2;
    return (
      <svg width={data.length * (w + gap)} height={40} className="block">
        {data.map((v, i) => {
          const h = Math.max(2, (v / max) * 40);
          return <rect key={i} x={i * (w + gap)} y={40 - h} width={w} height={h} rx="1" fill={color} opacity={0.7} />;
        })}
      </svg>
    );
  };

  // ── КАЛЬКУЛЯТОР ──
  const [calcExpr, setCalcExpr] = useState("");
  const [calcResult, setCalcResult] = useState<string | null>(null);

  const calcAppend = (v: string) => {
    setCalcResult(null);
    setCalcExpr(e => e + v);
  };
  const calcClear = () => { setCalcExpr(""); setCalcResult(null); };
  const calcEval = () => {
    try {
       
      const r = eval(calcExpr.replace(/\^/g, "**"));
      setCalcResult(String(r));
      addLog(`[CALC] ${calcExpr} = ${r}`);
    } catch {
      setCalcResult("Ошибка");
      setTimeout(calcClear, 1500);
    }
  };

  const calcBtns = [
    ["7","8","9","/"],
    ["4","5","6","*"],
    ["1","2","3","-"],
    ["0",".","^","+"],
  ];

  // ── БЛОК ПИТАНИЯ ──
  const [psuOn, setPsuOn] = useState(false);
  const [psuVoltage, setPsuVoltage] = useState(0);
  const [psuHistory, setPsuHistory] = useState<number[]>(Array(20).fill(0));

  useEffect(() => {
    const t = setInterval(() => {
      if (psuOn) {
        const v = 12 + (Math.random() - 0.5) * 0.3;
        setPsuVoltage(parseFloat(v.toFixed(2)));
        setPsuHistory(h => [...h.slice(1), parseFloat(v.toFixed(2))]);
      }
    }, 800);
    return () => clearInterval(t);
  }, [psuOn]);

  const togglePsu = () => {
    if (psuOn) {
      psu.turnOff();
      setPsuOn(false);
      setPsuVoltage(0);
      setPsuHistory(Array(20).fill(0));
      addLog("[WARN] Блок питания: ВЫКЛЮЧЁН");
      if (kernelRunning) { stopKernel(); }
    } else {
      psu.turnOn();
      setPsuOn(true);
      setPsuVoltage(12);
      addLog("[OK] Блок питания: ВКЛ, 12 В");
    }
  };

  // ── ВКЛАДКИ ──
  const tabs = [
    { id: "kernel",  label: "Ядро",         icon: "Cpu" },
    { id: "monitor", label: "Монитор",       icon: "Activity" },
    { id: "calc",    label: "Калькулятор",   icon: "Calculator" },
    { id: "psu",     label: "Питание",       icon: "Zap" },
  ] as const;

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  };

  return (
    <div className="p-6 max-w-4xl">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-700 rounded-xl flex items-center justify-center">
            <Icon name="Cpu" size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">TahkaOS · Второе ядро</h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: kernelRunning ? "#34d399" : "#6b7280" }} />
              <span style={{ color: kernelRunning ? "#34d399" : "#6b7280" }}>
                {kernelRunning ? `ЗАПУЩЕНО · ${formatUptime(uptime)}` : "ОСТАНОВЛЕНО"}
              </span>
              <span className="text-gray-600">·</span>
              <span className="text-gray-500">v1.0.0</span>
              {kernelRunning && (
                <>
                  <span className="text-gray-600">·</span>
                  <span className="text-cyan-400">Нагрузка {kernelLoad}%</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Быстрые кнопки управления ядром */}
        <div className="flex gap-2">
          <button
            onClick={startKernel}
            disabled={kernelRunning}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
            style={{ background: "#34d39922", border: "1px solid #34d39966", color: "#34d399" }}
          >
            <Icon name="Play" size={14} />
            Запустить
          </button>
          <button
            onClick={stopKernel}
            disabled={!kernelRunning}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
            style={{ background: "#e9456022", border: "1px solid #e9456066", color: "#e94560" }}
          >
            <Icon name="Square" size={14} />
            Стоп
          </button>
        </div>
      </div>

      {/* Вкладки */}
      <div className="flex gap-1 mb-5">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border"
            style={tab === t.id
              ? { background: "#1e3a5f", borderColor: "#3b82f666", color: "#60a5fa" }
              : { background: "transparent", borderColor: "rgba(255,255,255,0.05)", color: "#6b7280" }
            }
          >
            <Icon name={t.icon} size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════ ЯДРО ═══════════════════ */}
      {tab === "kernel" && (
        <div className="space-y-4">
          {/* Статус-карточки */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Статус",    value: kernelRunning ? "ЗАПУЩЕНО" : "СТОП", color: kernelRunning ? "#34d399" : "#e94560", icon: "Power" },
              { label: "Нагрузка", value: `${kernelLoad}%`,          color: "#60a5fa", icon: "Activity" },
              { label: "Процессы", value: kernelRunning ? String(kernel.processes) : "0", color: "#a78bfa", icon: "List" },
              { label: "Память",   value: `${(kernel.memoryUsage * 100).toFixed(1)}%`, color: "#f59e0b", icon: "MemoryStick" },
            ].map(c => (
              <div key={c.label} className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <Icon name={c.icon} size={14} style={{ color: c.color }} />
                </div>
                <div className="text-xl font-bold" style={{ color: c.color }}>{c.value}</div>
                <div className="text-gray-500 text-xs mt-0.5">{c.label}</div>
              </div>
            ))}
          </div>

          {/* Параметры ядра */}
          <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
            <div className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-3">Параметры ядра</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Сдвиг фазы (φ)</span>
                <span className="text-cyan-400 font-mono">{kernel.phaseShift.toFixed(3)} рад</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Время работы</span>
                <span className="text-white font-mono">{formatUptime(uptime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Версия</span>
                <span className="text-gray-300">TahkaOS 1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Режим</span>
                <span className="text-blue-400">Второе ядро ECSU</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Блок питания</span>
                <span style={{ color: psuOn ? "#34d399" : "#e94560" }}>{psuOn ? `ВКЛ · ${psuVoltage} В` : "ВЫКЛ"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Динамическая нагрузка</span>
                <span className="text-gray-300 font-mono text-xs">
                  {kernelRunning
                    ? `[${kernel.calcDynamicLoad(Date.now()).slice(0, 4).join(", ")}...]`
                    : "—"
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Лог */}
          <div className="bg-[#060d1f] border border-blue-900/20 rounded-xl">
            <div className="flex items-center justify-between px-4 py-2 border-b border-blue-900/20">
              <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Системный журнал</span>
              <button onClick={() => setLog(["[SYS] Журнал очищен"])} className="text-gray-600 hover:text-gray-400 text-xs transition-colors">Очистить</button>
            </div>
            <div ref={logRef} className="p-3 space-y-0.5 overflow-y-auto" style={{ maxHeight: 200 }}>
              {log.map((l, i) => <LogLine key={i} line={l} />)}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ МОНИТОР ═══════════════════ */}
      {tab === "monitor" && (
        <div className="space-y-4">
          {!kernelRunning && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 flex items-center gap-2 text-yellow-400 text-sm">
              <Icon name="AlertTriangle" size={16} />
              Ядро не запущено. Данные недоступны.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* CPU */}
            <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon name="Cpu" size={16} className="text-blue-400" />
                  <span className="text-white text-sm font-medium">CPU · Динамическая нагрузка</span>
                </div>
                <span className="text-2xl font-bold text-blue-400">{kernelLoad}%</span>
              </div>
              <MiniBar value={kernelLoad} color={kernelLoad > 80 ? "#e94560" : kernelLoad > 50 ? "#f59e0b" : "#60a5fa"} />
              <div className="mt-3">{sparkline(cpuHistory, "#60a5fa")}</div>
              <div className="text-gray-600 text-xs mt-2">ω=0.1 · φ={kernel.phaseShift.toFixed(3)} · 100 потоков</div>
            </div>

            {/* RAM */}
            <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon name="MemoryStick" size={16} className="text-purple-400" />
                  <span className="text-white text-sm font-medium">Память</span>
                </div>
                <span className="text-2xl font-bold text-purple-400">{(kernel.memoryUsage * 100).toFixed(1)}%</span>
              </div>
              <MiniBar value={kernel.memoryUsage * 100} color="#a78bfa" />
              <div className="mt-3">{sparkline(memHistory, "#a78bfa")}</div>
              <div className="text-gray-600 text-xs mt-2">Виртуальная память ядра</div>
            </div>
          </div>

          {/* Процессы */}
          <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
            <div className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-3">Активные процессы ядра</div>
            <div className="grid grid-cols-3 gap-2">
              {kernelRunning
                ? Array.from({ length: Math.min(kernel.processes, 12) }, (_, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#1a1a2e] rounded-lg px-3 py-2 text-xs">
                    <span className="text-gray-400 font-mono">tahka_{String(i + 1).padStart(3, "0")}</span>
                    <span className="text-green-400">{Math.floor(Math.random() * 5 + 1)}%</span>
                  </div>
                ))
                : <div className="col-span-3 text-gray-600 text-sm py-4 text-center">Нет активных процессов</div>
              }
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ КАЛЬКУЛЯТОР ═══════════════════ */}
      {tab === "calc" && (
        <div className="max-w-xs">
          <div className="bg-[#0d1225] border border-blue-900/30 rounded-2xl p-4">
            {/* Дисплей */}
            <div className="bg-[#060d1f] rounded-xl px-4 py-3 mb-3 text-right min-h-[56px] flex flex-col justify-end">
              <div className="text-gray-500 text-xs font-mono truncate">{calcExpr || "0"}</div>
              {calcResult !== null && (
                <div className="text-white text-2xl font-bold font-mono">{calcResult}</div>
              )}
            </div>

            {/* Кнопки */}
            <div className="grid grid-cols-4 gap-2 mb-2">
              {calcBtns.flat().map((btn) => {
                const isOp = ["/", "*", "-", "+", "^"].includes(btn);
                return (
                  <button
                    key={btn}
                    onClick={() => calcAppend(btn)}
                    className="py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80 active:scale-95"
                    style={isOp
                      ? { background: "#1e3a5f", color: "#60a5fa", border: "1px solid #3b82f633" }
                      : { background: "#1a1a2e", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.05)" }
                    }
                  >
                    {btn}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={calcEval}
                className="py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
                style={{ background: "#34d399", color: "#000" }}
              >
                =
              </button>
              <button
                onClick={calcClear}
                className="py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
                style={{ background: "#e9456022", color: "#e94560", border: "1px solid #e9456044" }}
              >
                C
              </button>
            </div>

            <div className="text-gray-700 text-xs text-center mt-3">Используй ^ для степени</div>
          </div>
        </div>
      )}

      {/* ═══════════════════ БЛОК ПИТАНИЯ ═══════════════════ */}
      {tab === "psu" && (
        <div className="space-y-4 max-w-lg">
          {/* Главная карточка */}
          <div className={`rounded-2xl p-5 border transition-all ${psuOn
            ? "bg-green-900/10 border-green-500/30"
            : "bg-[#0d1225] border-blue-900/30"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${psuOn ? "bg-green-500/20" : "bg-gray-700/30"}`}>
                  <Icon name="Zap" size={24} style={{ color: psuOn ? "#34d399" : "#6b7280" }} />
                </div>
                <div>
                  <div className="text-white font-bold">Блок питания ATX</div>
                  <div className="text-xs" style={{ color: psuOn ? "#34d399" : "#e94560" }}>
                    {psuOn ? "ВКЛ · Работает" : "ВЫКЛ · Питание отсутствует"}
                  </div>
                </div>
              </div>
              <button
                onClick={togglePsu}
                className="w-14 h-7 rounded-full transition-all relative"
                style={{ background: psuOn ? "#34d399" : "#374151" }}
              >
                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow ${psuOn ? "left-8" : "left-1"}`} />
              </button>
            </div>

            {/* Вольтметр */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "+12V", value: psuOn ? psuVoltage : 0, nominal: 12, color: "#34d399" },
                { label: "+5V",  value: psuOn ? 5.02 + (Math.random() * 0.06 - 0.03) : 0, nominal: 5, color: "#60a5fa" },
                { label: "+3.3V", value: psuOn ? 3.31 + (Math.random() * 0.04 - 0.02) : 0, nominal: 3.3, color: "#a78bfa" },
              ].map(ch => (
                <div key={ch.label} className="bg-[#060d1f] rounded-xl p-3 text-center border border-white/5">
                  <div className="text-gray-500 text-xs mb-1">{ch.label}</div>
                  <div className="text-xl font-bold font-mono" style={{ color: ch.color }}>
                    {ch.value.toFixed(2)}
                  </div>
                  <div className="text-gray-700 text-xs">В</div>
                  <div className="mt-2">
                    <MiniBar value={psuOn ? (ch.value / ch.nominal) * 100 : 0} color={ch.color} />
                  </div>
                </div>
              ))}
            </div>

            {/* График напряжения */}
            <div className="bg-[#060d1f] rounded-xl p-3 border border-white/5">
              <div className="text-gray-500 text-xs mb-2">График напряжения +12V</div>
              <svg width="100%" height="40" viewBox={`0 0 ${psuHistory.length * 6} 40`} preserveAspectRatio="none">
                <polyline
                  points={psuHistory.map((v, i) => `${i * 6},${40 - ((v / 13) * 38)}`).join(" ")}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <div className="text-gray-600 text-xs px-1">
            Выключение блока питания останавливает ядро TahkaOS.
          </div>
        </div>
      )}
    </div>
  );
};

export default EcsuTahkaOS;
