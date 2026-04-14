import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

const AI_API = "https://functions.poehali.dev/daefa87e-0693-4de5-9191-bbc918e1d241";

interface Message {
  role: "user" | "assistant";
  text: string;
  time: string;
  suggestions?: string[];
  loading?: boolean;
}

const getTime = () => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

const genSession = () => `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// Начальные подсказки по темам
const TOPIC_GROUPS = [
  {
    label: "⚖️ Право",
    color: "#3b82f6",
    items: ["Права обвиняемого", "Как подать иск?", "Что такое УПК?"],
  },
  {
    label: "🌐 ЕЦСУ",
    color: "#a855f7",
    items: ["Критические инциденты", "Что умеет ЕЦСУ?", "Статистика системы"],
  },
  {
    label: "💡 Советы",
    color: "#00ff87",
    items: ["Как защитить данные?", "Что делать при кибератаке?", "Экологические нормы"],
  },
  {
    label: "🔍 Анализ",
    color: "#f59e0b",
    items: ["Объясни МГП", "Международное право", "Нефтяной разлив Нигерия"],
  },
];

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:1px 4px;border-radius:4px;font-size:0.85em">$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:2px solid rgba(168,85,247,0.5);padding-left:8px;color:rgba(255,255,255,0.6);margin:4px 0">$1</blockquote>')
    .replace(/^• (.+)$/gm, '<div style="display:flex;gap:6px;margin:2px 0"><span style="color:#a855f7;flex-shrink:0">•</span><span>$1</span></div>')
    .replace(/^(\d+)\. (.+)$/gm, '<div style="display:flex;gap:6px;margin:2px 0"><span style="color:#3b82f6;flex-shrink:0;font-weight:bold">$1.</span><span>$2</span></div>')
    .replace(/✓ (.+)/g, '<div style="display:flex;gap:6px;align-items:flex-start"><span style="color:#00ff87;flex-shrink:0">✓</span><span>$1</span></div>')
    .replace(/\n\n/g, '<div style="height:8px"></div>')
    .replace(/\n/g, "<br/>");
}

interface Props {
  onClose: () => void;
}

export default function AiChat({ onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Привет! Я ИИ-ассистент ЕЦСУ 2.0 на базе **Google Gemini**.\n\nМогу помочь с любыми вопросами: право, экология, кибербезопасность, наука, технологии — или просто поговорить.\n\nВыбери тему или напиши сам:",
      time: getTime(),
      suggestions: ["Что ты умеешь?", "Правовая консультация", "Критические инциденты"],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(genSession);
  const [showTopics, setShowTopics] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const buildHistory = () =>
    messages
      .filter(m => !m.loading)
      .map(m => ({ role: m.role, content: m.text }));

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    setInput("");
    setShowTopics(false);

    const userMsg: Message = { role: "user", text, time: getTime() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = buildHistory();
      const res = await fetch(AI_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: sessionId, history }),
      });
      const data = await res.json();

      let reply = "";
      let suggestions: string[] = [];

      if (typeof data === "string") {
        try { const parsed = JSON.parse(data); reply = parsed.reply || data; suggestions = parsed.suggestions || []; }
        catch { reply = data; }
      } else {
        reply = data.reply || "Не получил ответ от сервера.";
        suggestions = data.suggestions || [];
      }

      setMessages(prev => [
        ...prev,
        { role: "assistant", text: reply, time: getTime(), suggestions },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          text: "⚠️ Нет связи с сервером. Проверьте соединение и попробуйте ещё раз.",
          time: getTime(),
          suggestions: ["Попробовать снова", "Правовая база", "Инциденты ЕЦСУ"],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      text: "Диалог очищен. Чем могу помочь?",
      time: getTime(),
      suggestions: ["Правовой вопрос", "Инциденты", "Совет дня"],
    }]);
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl overflow-hidden"
      style={{
        width: 400,
        maxWidth: "calc(100vw - 2rem)",
        height: 620,
        background: "#0a0f1a",
        border: "1px solid rgba(168,85,247,0.35)",
        boxShadow: "0 0 60px rgba(168,85,247,0.15), 0 20px 40px rgba(0,0,0,0.5)",
      }}
    >
      {/* ── HEADER ── */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ background: "rgba(168,85,247,0.12)", borderBottom: "1px solid rgba(168,85,247,0.2)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center relative"
            style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}
          >
            <Icon name="Bot" size={16} className="text-white" />
            <span
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: "#00ff87", borderColor: "#0a0f1a" }}
            />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-none">ИИ-Ассистент ЕЦСУ</div>
            <div className="text-white/35 text-[10px]">Gemini · онлайн</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowTopics(p => !p)}
            title="Темы"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
            style={{ background: showTopics ? "rgba(168,85,247,0.2)" : "transparent" }}
          >
            <Icon name="LayoutGrid" size={14} />
          </button>
          <button
            onClick={clearChat}
            title="Очистить чат"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
          >
            <Icon name="Trash2" size={14} />
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
          >
            <Icon name="X" size={16} />
          </button>
        </div>
      </div>

      {/* ── TOPICS PANEL ── */}
      {showTopics && (
        <div
          className="shrink-0 p-3 grid grid-cols-2 gap-2"
          style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          {TOPIC_GROUPS.map(g => (
            <div key={g.label}>
              <div className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: g.color }}>{g.label}</div>
              {g.items.map(item => (
                <button
                  key={item}
                  onClick={() => { send(item); setShowTopics(false); }}
                  className="block w-full text-left text-xs text-white/60 hover:text-white/90 py-0.5 transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── MESSAGES ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(168,85,247,0.3) transparent" }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div style={{ maxWidth: "88%" }}>
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
                    <Icon name="Bot" size={11} className="text-white" />
                  </div>
                  <span className="text-white/25 text-[10px]">{msg.time}</span>
                </div>
              )}

              <div
                className="rounded-xl px-3 py-2.5 text-sm leading-relaxed"
                style={msg.role === "user"
                  ? { background: "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(59,130,246,0.25))", color: "rgba(255,255,255,0.92)", border: "1px solid rgba(168,85,247,0.3)" }
                  : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.87)", border: "1px solid rgba(255,255,255,0.08)" }
                }
              >
                {msg.role === "user"
                  ? <span>{msg.text}</span>
                  : <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
                }
              </div>

              {msg.role === "user" && (
                <div className="text-right mt-0.5">
                  <span className="text-white/20 text-[10px]">{msg.time}</span>
                </div>
              )}

              {/* Варианты ответа */}
              {msg.role === "assistant" && msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {msg.suggestions.map((s, si) => (
                    <button
                      key={si}
                      onClick={() => send(s)}
                      disabled={loading}
                      className="text-xs px-2.5 py-1 rounded-lg transition-all hover:scale-105 disabled:opacity-40"
                      style={{
                        background: "rgba(168,85,247,0.12)",
                        color: "#c4b5fd",
                        border: "1px solid rgba(168,85,247,0.25)",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Индикатор набора */}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
                <Icon name="Bot" size={11} className="text-white" />
              </div>
              <div className="flex items-center gap-1 px-3 py-2 rounded-xl"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {[0, 1, 2].map(d => (
                  <span
                    key={d}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: "#a855f7",
                      animation: `bounce 1s ease-in-out ${d * 0.15}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── INPUT ── */}
      <div
        className="shrink-0 px-3 py-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.2)" }}
      >
        <div
          className="flex items-end gap-2 rounded-xl px-3 py-2"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(168,85,247,0.25)" }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Напишите сообщение... (Enter — отправить)"
            rows={1}
            disabled={loading}
            className="flex-1 bg-transparent text-white text-sm outline-none resize-none placeholder-white/25 leading-relaxed"
            style={{ maxHeight: 96, minHeight: 22 }}
            onInput={e => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 96) + "px";
            }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30 shrink-0"
            style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}
          >
            <Icon name="Send" size={14} className="text-white" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-1">
          <span className="text-white/15 text-[10px]">Shift+Enter — перенос строки</span>
          <span className="text-white/15 text-[10px]">Gemini AI · ЕЦСУ 2.0</span>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
