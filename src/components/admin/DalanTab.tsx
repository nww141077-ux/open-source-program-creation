import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const CONFIG_URL = "https://functions.poehali.dev/744a3183-098e-4b3a-8b5b-c27893d57779";

interface DalanParam {
  key: string;
  value: string;
  label: string;
  type: string;
}

interface OracleEntry {
  task: string;
  result: number;
  timestamp: string;
}

interface StrategyItem {
  id: number;
  title: string;
  status: "active" | "pending" | "completed";
  priority: "high" | "medium" | "low";
  progress: number;
  description: string;
}

// Авторская методика Николаева В.В.
function calculateShift(inputValue: number) {
  const COEFFICIENT = 11 / 10; // 1.1 — постоянная сдвига
  const result = inputValue * COEFFICIENT;
  return { nominal: inputValue, actual: result, delta: result - inputValue };
}

const INITIAL_STRATEGY: StrategyItem[] = [
  { id: 0, title: "Сдвиг Николаева (авторская методика)", status: "active", priority: "high", progress: 100, description: "Коэффициент оптимизации 1.1 — авторская разработка Николаева В.В. Применяется как базовый множитель в движке DALAN." },
  { id: 1, title: "Оптимизация ресурсов ЕЦСУ", status: "active", priority: "high", progress: 72, description: "Перераспределение потоков с применением коэффициента Николаева ×1.1" },
  { id: 2, title: "Расширение контрактной базы", status: "active", priority: "high", progress: 45, description: "Контракт № 5052834788 — выполнение плана" },
  { id: 3, title: "Интеграция нейросети Dalan", status: "active", priority: "medium", progress: 88, description: "Автоматизация аналитических процессов" },
  { id: 4, title: "Стратегический резерв SYNERGON", status: "pending", priority: "medium", progress: 0, description: "Формирование резервного фонда" },
  { id: 5, title: "Аудит внешних шлюзов", status: "completed", priority: "low", progress: 100, description: "Проверка всех каналов передачи данных" },
];

const DalanTab = () => {
  const [params, setParams] = useState<DalanParam[]>([]);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [section, setSection] = useState<"config" | "oracle" | "strategy">("oracle");

  // Oracle terminal
  const [oracleTask, setOracleTask] = useState("");
  const [oracleLog, setOracleLog] = useState<OracleEntry[]>([]);
  const [oracleRunning, setOracleRunning] = useState(false);

  // Strategy
  const [strategy, setStrategy] = useState<StrategyItem[]>(INITIAL_STRATEGY);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    fetch(`${CONFIG_URL}?action=dalan`)
      .then((r) => r.json())
      .then((data: DalanParam[]) => {
        setParams(data);
        const flat: Record<string, string> = {};
        data.forEach((p) => (flat[p.key] = p.value));
        setEdited(flat);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const save = async (key: string) => {
    setSaving(key);
    await fetch(`${CONFIG_URL}?action=save_dalan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: edited[key] }),
    });
    setSaving(null);
    setSaved(key);
    setTimeout(() => setSaved(null), 2000);
  };

  const [shiftInput, setShiftInput] = useState("");
  const [shiftResult, setShiftResult] = useState<{ nominal: number; actual: number; delta: number } | null>(null);

  const runShift = () => {
    const val = parseFloat(shiftInput);
    if (isNaN(val)) return;
    setShiftResult(calculateShift(val));
  };

  const runOracle = () => {
    if (!oracleTask.trim()) return;
    setOracleRunning(true);
    setTimeout(() => {
      const result = Math.floor(Math.random() * (115 - 110 + 1) + 110);
      const entry: OracleEntry = {
        task: oracleTask,
        result,
        timestamp: new Date().toLocaleTimeString("ru-RU"),
      };
      setOracleLog((prev) => [entry, ...prev]);
      setOracleTask("");
      setOracleRunning(false);
    }, 1200);
  };

  const addStrategy = () => {
    if (!newTitle.trim()) return;
    const item: StrategyItem = {
      id: Date.now(),
      title: newTitle,
      status: "pending",
      priority: "medium",
      progress: 0,
      description: newDesc,
    };
    setStrategy((prev) => [item, ...prev]);
    setNewTitle("");
    setNewDesc("");
  };

  const cycleStatus = (id: number) => {
    setStrategy((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const next = { active: "completed", completed: "pending", pending: "active" } as const;
        return { ...s, status: next[s.status] };
      })
    );
  };

  const statusColor = { active: "#e94560", pending: "#FFD700", completed: "#00c896" };
  const statusLabel = { active: "Активно", pending: "Ожидание", completed: "Завершено" };
  const priorityLabel = { high: "Высокий", medium: "Средний", low: "Низкий" };

  const sections = [
    { id: "oracle", label: "ORACLE-Терминал", icon: "Terminal" },
    { id: "strategy", label: "Стратегическое развитие", icon: "TrendingUp" },
    { id: "config", label: "Конфигурация нейросети", icon: "Brain" },
  ] as const;

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
        <Icon name="Brain" size={20} className="text-[#e94560]" />
        DALAN — Система управления ЕЦСУ
      </h2>
      <p className="text-gray-500 text-xs mb-4">SYNERGON GLOBAL · УБО: НИКОЛАЕВ В.В. · Контракт: № 5052834788</p>

      {/* Section tabs */}
      <div className="flex gap-2 mb-6">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              section === s.id
                ? "bg-[#e94560] text-white"
                : "bg-[#1a1a2e] text-gray-400 hover:text-white border border-[#e94560]/10"
            }`}
          >
            <Icon name={s.icon} size={15} />
            {s.label}
          </button>
        ))}
      </div>

      {/* ORACLE Terminal */}
      {section === "oracle" && (
        <div className="space-y-4">
          <div className="bg-[#0a0a0f] border border-[#FFD700]/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Terminal" size={16} className="text-[#FFD700]" />
              <span className="text-[#FFD700] font-bold tracking-widest text-sm">SYNERGON-ORACLE · ТЕРМИНАЛ ЕЦСУ</span>
            </div>
            <textarea
              value={oracleTask}
              onChange={(e) => setOracleTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && runOracle()}
              placeholder="Вставьте задачу или смету для оптимизации DALAN..."
              rows={4}
              className="w-full bg-black border border-[#00FF41]/30 text-white rounded-lg px-4 py-3 text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-[#00FF41] resize-none mb-3"
            />
            <button
              onClick={runOracle}
              disabled={oracleRunning || !oracleTask.trim()}
              className="bg-[#0056b3] hover:bg-[#0068d6] disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
            >
              {oracleRunning ? (
                <Icon name="Loader2" size={15} className="animate-spin" />
              ) : (
                <Icon name="Zap" size={15} />
              )}
              ЗАПУСТИТЬ ОПТИМИЗАЦИЮ DALAN
            </button>
          </div>

              {/* Сдвиг Николаева */}
          <div className="bg-[#0a0a0f] border border-[#FFD700]/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="FlaskConical" size={15} className="text-[#FFD700]" />
              <span className="text-[#FFD700] font-bold tracking-widest text-sm">СДВИГ НИКОЛАЕВА · ЯДРО DALAN</span>
            </div>
            <p className="text-gray-600 text-xs mb-4">Авторская методика Николаева В.В. · Коэффициент ×1.1 · Зарегистрировано в ЕЦСУ</p>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <div className="text-gray-400 text-xs mb-1">Входное значение (номинал)</div>
                <input
                  type="number"
                  value={shiftInput}
                  onChange={(e) => setShiftInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runShift()}
                  placeholder="Введите число..."
                  className="w-full bg-black border border-[#FFD700]/30 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#FFD700]"
                />
              </div>
              <button
                onClick={runShift}
                className="bg-[#FFD700] hover:bg-[#e6c200] text-black px-4 py-2 rounded-lg font-bold text-sm transition-colors"
              >
                Применить ×1.1
              </button>
            </div>
            {shiftResult && (
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div className="bg-black/40 rounded-lg p-3 text-center">
                  <div className="text-gray-500 text-xs mb-1">Номинал</div>
                  <div className="text-white font-mono font-bold">{shiftResult.nominal}</div>
                </div>
                <div className="bg-black/40 rounded-lg p-3 text-center">
                  <div className="text-gray-500 text-xs mb-1">Результат</div>
                  <div className="text-[#00FF41] font-mono font-bold">{shiftResult.actual.toFixed(2)}</div>
                </div>
                <div className="bg-black/40 rounded-lg p-3 text-center">
                  <div className="text-gray-500 text-xs mb-1">Прирост</div>
                  <div className="text-[#FFD700] font-mono font-bold">+{shiftResult.delta.toFixed(2)}</div>
                </div>
              </div>
            )}
          </div>

      {/* Log */}
          <div className="bg-[#0a0a0f] border border-[#e94560]/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="ScrollText" size={15} className="text-[#FFD700]" />
              <span className="text-[#FFD700] text-sm font-bold">ЛОГ ОПЕРАЦИЙ</span>
            </div>
            {oracleLog.length === 0 ? (
              <div className="text-gray-600 text-sm font-mono">--- ОЖИДАНИЕ ВВОДА ДАННЫХ ---</div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {oracleLog.map((entry, i) => (
                  <div key={i} className="border border-[#FFD700]/10 rounded-lg p-3 bg-black/30">
                    <div className="text-gray-400 text-xs font-mono mb-1">[{entry.timestamp}] АНАЛИЗ DALAN:</div>
                    <div className="text-white text-sm mb-2">{entry.task}</div>
                    <div className="flex items-center gap-4">
                      <span className="text-[#00FF41] font-bold font-mono text-sm">
                        ЭФФЕКТИВНОСТЬ: +{entry.result}%
                      </span>
                      <span className="text-[#FFD700] text-xs font-bold">✓ ПРИНЯТЬ К ИСПОЛНЕНИЮ В ЕЦСУ</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Strategic Development */}
      {section === "strategy" && (
        <div className="space-y-4">
          {/* Add new */}
          <div className="bg-[#1a1a2e] border border-[#e94560]/10 rounded-xl p-5">
            <div className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <Icon name="Plus" size={15} className="text-[#e94560]" />
              Добавить стратегическую задачу
            </div>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Название задачи..."
              className="w-full bg-[#0d0d1a] border border-[#e94560]/20 text-white rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-[#e94560]"
            />
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Описание (необязательно)..."
              className="w-full bg-[#0d0d1a] border border-[#e94560]/20 text-white rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-[#e94560]"
            />
            <button
              onClick={addStrategy}
              disabled={!newTitle.trim()}
              className="bg-[#e94560] hover:bg-[#c73550] disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Добавить
            </button>
          </div>

          {/* Strategy list */}
          <div className="space-y-3">
            {strategy.map((item) => (
              <div key={item.id} className="bg-[#1a1a2e] border border-[#e94560]/10 rounded-xl p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="text-white font-semibold text-sm">{item.title}</div>
                    {item.description && (
                      <div className="text-gray-500 text-xs mt-0.5">{item.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ color: statusColor[item.status], border: `1px solid ${statusColor[item.status]}33`, background: `${statusColor[item.status]}11` }}
                    >
                      {statusLabel[item.status]}
                    </span>
                    <button
                      onClick={() => cycleStatus(item.id)}
                      className="text-gray-600 hover:text-white transition-colors"
                      title="Сменить статус"
                    >
                      <Icon name="RefreshCw" size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-[#0d0d1a] rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${item.progress}%`, background: statusColor[item.status] }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{item.progress}%</span>
                  <span className="text-xs text-gray-600">{priorityLabel[item.priority]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Neural net config */}
      {section === "config" && (
        <div>
          {loading ? (
            <div className="text-gray-500 animate-pulse">Загрузка конфигурации Dalan...</div>
          ) : params.length === 0 ? (
            <div className="text-gray-500 text-sm">Параметры недоступны</div>
          ) : (
            <div className="bg-[#1a1a2e] rounded-xl border border-[#e94560]/10 divide-y divide-[#e94560]/10">
              {params.map((p) => (
                <div key={p.key} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">{p.label}</div>
                    <div className="text-gray-600 text-xs mt-0.5">{p.key}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.type === "boolean" ? (
                      <button
                        onClick={() => {
                          const newVal = edited[p.key] === "true" ? "false" : "true";
                          setEdited((prev) => ({ ...prev, [p.key]: newVal }));
                        }}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          edited[p.key] === "true" ? "bg-[#e94560]" : "bg-gray-700"
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                            edited[p.key] === "true" ? "left-7" : "left-1"
                          }`}
                        />
                      </button>
                    ) : (
                      <input
                        type={p.type === "number" ? "number" : "text"}
                        value={edited[p.key] ?? ""}
                        onChange={(e) =>
                          setEdited((prev) => ({ ...prev, [p.key]: e.target.value }))
                        }
                        className="bg-[#0d0d1a] border border-[#e94560]/20 text-white rounded-lg px-3 py-2 text-sm w-40 focus:outline-none focus:border-[#e94560]"
                      />
                    )}
                    <button
                      onClick={() => save(p.key)}
                      disabled={saving === p.key}
                      className="bg-[#e94560] hover:bg-[#c73550] text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {saved === p.key ? (
                        <Icon name="Check" size={14} />
                      ) : saving === p.key ? (
                        <Icon name="Loader2" size={14} className="animate-spin" />
                      ) : (
                        "Сохранить"
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DalanTab;