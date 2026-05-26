import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const AI_URL = "https://functions.poehali.dev/e74ce640-7610-467a-81ee-cab7c2347d3e";

// ── 5 режимов ИИ из скриншота ──
const AI_MODES = [
  {
    id: "assistant",
    label: "Ассистент",
    icon: "Bot",
    color: "#9b1dcc",
    bg: "from-[#e94560] to-[#9b1dcc]",
    description: "Общий ИИ-ассистент ЕЦСУ. Управляет настройками, модулями, бэкапами.",
    suggestions: [
      "Покажи текущие настройки системы",
      "Какие модули сейчас включены?",
      "Создай точку восстановления",
      "Покажи параметры Dalan",
    ],
  },
  {
    id: "analytics",
    label: "Аналитика",
    icon: "BarChart3",
    color: "#34d399",
    bg: "from-[#34d399] to-[#059669]",
    description: "Аналитический модуль. Статистика инцидентов, тренды, прогнозы.",
    suggestions: [
      "Сколько критических инцидентов за неделю?",
      "Прогноз угроз на следующую неделю",
      "Топ стран по числу инцидентов",
      "Динамика активности по типам",
    ],
  },
  {
    id: "cpvoa",
    label: "ЦПВОА",
    icon: "Radar",
    color: "#f59e0b",
    bg: "from-[#f59e0b] to-[#d97706]",
    description: "Центр Противодействия Внешним Операциям и Атакам ЕЦСУ.",
    suggestions: [
      "Оцени текущий уровень угроз",
      "Разработай контрмеры для FM-аномалии",
      "Приоритеты на ближайшие 24 часа",
      "Статус оперативного реагирования",
    ],
  },
  {
    id: "threats",
    label: "Анализ угроз",
    icon: "ShieldAlert",
    color: "#e94560",
    bg: "from-[#e94560] to-[#b91c3c]",
    description: "Анализ радиоаномалий, кибератак, геополитических угроз.",
    suggestions: [
      "Анализ дрейфа частоты FM 101.2 МГц",
      "Классифицируй инцидент: атака на буфер",
      "Оцени угрозу от неизвестного меш-узла",
      "Кибератака на инфраструктуру — анализ",
    ],
  },
  {
    id: "codegen",
    label: "Генерация кода",
    icon: "Code2",
    color: "#60a5fa",
    bg: "from-[#3b82f6] to-[#1d4ed8]",
    description: "Генерирует Python, PowerShell, Bash скрипты для Windows/Linux.",
    suggestions: [
      "Напиши агент мониторинга CPU/RAM для Windows",
      "Скрипт автоматического бэкапа на Python",
      "PowerShell установщик для ЕЦСУ агента",
      "Bash-демон для Linux меш-узла",
    ],
  },
];

const AI_MODELS = [
  { id: "meta-llama/llama-3.1-8b-instruct:free",   label: "Llama 3.1 8B (free)"   },
  { id: "meta-llama/llama-3.3-70b-instruct:free",  label: "Llama 3.3 70B (free)"  },
  { id: "mistralai/mistral-7b-instruct:free",       label: "Mistral 7B (free)"     },
  { id: "google/gemma-3-4b-it:free",                label: "Gemma 3 4B (free)"     },
  { id: "deepseek/deepseek-r1:free",                label: "DeepSeek R1 (free)"    },
];

interface Message {
  role: "user" | "assistant";
  content: string;
  action_result?: string;
}

// История диалогов по режимам
type ChatHistory = Record<string, Message[]>;

const DEFAULT_GREETINGS: Record<string, string> = {
  assistant: "Система ЕЦСУ DALAN активна. Я твой ИИ-ассистент — могу читать настройки, управлять модулями и создавать точки восстановления. Что сделать?",
  analytics:  "Аналитический модуль запущен. Готов анализировать инциденты, строить прогнозы и считать статистику по системе ЕЦСУ. Какой анализ нужен?",
  cpvoa:      "ЦПВОА активен. Готов оценить угрозы, разработать контрмеры и определить приоритеты оперативного реагирования. Какова текущая обстановка?",
  threats:    "Модуль анализа угроз готов. Могу классифицировать инциденты, анализировать аномалии и оценивать угрозы по 10-балльной шкале. Что анализировать?",
  codegen:    "Модуль генерации кода активен. Пишу Python, PowerShell, Bash для Windows и Linux. Что нужно сгенерировать?",
};

const AiAssistantTab = () => {
  const [activeMode, setActiveMode] = useState("assistant");
  const [model, setModel]           = useState(AI_MODELS[0].id);
  const [chatHistory, setChatHistory] = useState<ChatHistory>(() => {
    const init: ChatHistory = {};
    AI_MODES.forEach(m => {
      init[m.id] = [{ role: "assistant", content: DEFAULT_GREETINGS[m.id] }];
    });
    return init;
  });
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const currentMode = AI_MODES.find(m => m.id === activeMode)!;
  const messages    = chatHistory[activeMode] || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const copyMsg = useCallback((text: string, idx: number) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  }, []);

  const switchMode = (modeId: string) => {
    setActiveMode(modeId);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const clearChat = () => {
    setChatHistory(prev => ({
      ...prev,
      [activeMode]: [{ role: "assistant", content: DEFAULT_GREETINGS[activeMode] }],
    }));
  };

  const send = async (text?: string) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");

    const prevMessages = chatHistory[activeMode] || [];
    const newMessages: Message[] = [...prevMessages, { role: "user", content: userText }];
    setChatHistory(prev => ({ ...prev, [activeMode]: newMessages }));
    setLoading(true);

    try {
      const res = await fetch(AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          mode: activeMode,
          model,
        }),
      });
      const data = await res.json();
      const reply: Message = {
        role: "assistant",
        content: data.reply || "Нет ответа от ИИ",
        action_result: data.action_result,
      };
      setChatHistory(prev => ({ ...prev, [activeMode]: [...newMessages, reply] }));
    } catch {
      setChatHistory(prev => ({
        ...prev,
        [activeMode]: [...newMessages, { role: "assistant", content: "Ошибка соединения с ИИ-модулем. Проверь подключение." }],
      }));
    }
    setLoading(false);
  };

  const currentSuggestions = currentMode.suggestions;
  const showSuggestions = messages.length <= 1;

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-0">

      {/* ── Левая панель: режимы ── */}
      <div className="w-56 flex-shrink-0 flex flex-col gap-1 pr-3 border-r border-blue-900/20 overflow-y-auto">
        <div className="text-gray-500 text-[10px] uppercase tracking-widest px-1 pb-2 pt-1">Режим ИИ</div>
        {AI_MODES.map(mode => (
          <button
            key={mode.id}
            onClick={() => switchMode(mode.id)}
            className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all border ${
              activeMode === mode.id
                ? "border-opacity-40 bg-opacity-20"
                : "border-transparent hover:bg-white/5"
            }`}
            style={activeMode === mode.id ? {
              background: mode.color + "18",
              borderColor: mode.color + "55",
            } : {}}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: activeMode === mode.id ? mode.color + "33" : "#1e2d4a" }}
            >
              <Icon name={mode.icon} size={13} style={{ color: mode.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold" style={{ color: activeMode === mode.id ? mode.color : "#e2e8f0" }}>
                {mode.label}
              </div>
              <div className="text-[9px] text-gray-600 leading-tight mt-0.5 line-clamp-2">
                {mode.description}
              </div>
            </div>
          </button>
        ))}

        <div className="mt-3 pt-3 border-t border-blue-900/20">
          <div className="text-gray-500 text-[10px] uppercase tracking-widest px-1 pb-2">Модель</div>
          <select
            value={model}
            onChange={e => setModel(e.target.value)}
            className="w-full bg-[#0a0f1e] border border-blue-900/30 text-gray-300 text-[10px] rounded-lg px-2 py-1.5 outline-none"
          >
            {AI_MODELS.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Правая: чат ── */}
      <div className="flex-1 flex flex-col min-w-0 pl-4">

        {/* Шапка режима */}
        <div className="flex items-center gap-3 pb-3 border-b border-blue-900/20 mb-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${currentMode.bg}`}
          >
            <Icon name={currentMode.icon} size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-base">{currentMode.label}</div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: currentMode.color }} />
              <span className="text-xs" style={{ color: currentMode.color }}>
                Активен · {AI_MODELS.find(m => m.id === model)?.label}
              </span>
            </div>
          </div>
          <button
            onClick={clearChat}
            title="Очистить чат"
            className="p-1.5 text-gray-600 hover:text-gray-300 transition-colors"
          >
            <Icon name="RotateCcw" size={14} />
          </button>
        </div>

        {/* Подсказки */}
        {showSuggestions && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {currentSuggestions.map(s => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-[11px] border px-3 py-1.5 rounded-full transition-all hover:opacity-90"
                style={{
                  background: currentMode.color + "12",
                  borderColor: currentMode.color + "40",
                  color: currentMode.color,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Сообщения */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-gradient-to-br ${
                  msg.role === "assistant" ? currentMode.bg : "from-[#2a2a3e] to-[#1a1a2e]"
                }`}
              >
                <Icon name={msg.role === "assistant" ? currentMode.icon : "User"} size={12} className="text-white" />
              </div>
              <div className={`flex flex-col gap-1 max-w-[82%] ${msg.role === "user" ? "items-end" : ""}`}>
                <div
                  className={`px-3.5 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "text-white"
                      : "bg-[#0d1225] border text-gray-200"
                  }`}
                  style={msg.role === "user"
                    ? { background: currentMode.color }
                    : { borderColor: currentMode.color + "25" }
                  }
                >
                  {msg.content}
                </div>
                {msg.action_result && (
                  <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <Icon name="CheckCircle" size={11} />
                    {msg.action_result}
                  </div>
                )}
                {msg.role === "assistant" && (
                  <button
                    onClick={() => copyMsg(msg.content, i)}
                    className="self-start flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-all"
                    style={copiedIdx === i
                      ? { color: "#34d399", background: "#34d39915" }
                      : { color: "#4b5563" }
                    }
                  >
                    <Icon name={copiedIdx === i ? "Check" : "Copy"} size={10} />
                    {copiedIdx === i ? "Скопировано" : "Копировать"}
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${currentMode.bg}`}>
                <Icon name={currentMode.icon} size={12} className="text-white" />
              </div>
              <div className="bg-[#0d1225] border px-4 py-3 rounded-xl flex gap-1 items-center" style={{ borderColor: currentMode.color + "25" }}>
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: currentMode.color, animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Ввод */}
        <div className="pt-3 mt-2 border-t border-blue-900/20">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder={`Спроси ${currentMode.label}...`}
              disabled={loading}
              className="flex-1 bg-[#0a0f1e] border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none disabled:opacity-50 transition-colors"
              style={{ borderColor: currentMode.color + "40" }}
              onFocus={e => (e.target.style.borderColor = currentMode.color + "90")}
              onBlur={e => (e.target.style.borderColor = currentMode.color + "40")}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all hover:opacity-90 bg-gradient-to-br flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${currentMode.color}, ${currentMode.color}aa)` }}
            >
              <Icon name="Send" size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantTab;
