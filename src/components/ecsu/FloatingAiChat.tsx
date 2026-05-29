import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const AI_URL = "https://functions.poehali.dev/e74ce640-7610-467a-81ee-cab7c2347d3e";

const QUICK_ACTIONS = [
  { label: "Что не решено?",        icon: "AlertCircle",   mode: "assistant" },
  { label: "Приоритеты ЦПВОА",      icon: "Radar",         mode: "cpvoa"     },
  { label: "Критические инциденты", icon: "AlertTriangle", mode: "threats"   },
  { label: "Прогноз на неделю",     icon: "TrendingUp",    mode: "analytics" },
];

const MODE_COLORS: Record<string, string> = {
  assistant: "#e94560",
  analytics:  "#34d399",
  cpvoa:      "#f59e0b",
  threats:    "#e94560",
  codegen:    "#60a5fa",
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

const FloatingAiChat = () => {
  const [open, setOpen]           = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [currentMode, setCurrentMode] = useState("assistant");

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const copyMsg = useCallback((text: string, idx: number) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, text: string) => {
    e.dataTransfer.setData("text/plain", text);
    e.dataTransfer.effectAllowed = "copy";
  }, []);

  const send = async (text?: string, mode?: string) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");

    const activeMode = mode || currentMode;
    if (mode) setCurrentMode(mode);

    const newMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch(AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          mode: activeMode,
          model: "meta-llama/llama-3.1-8b-instruct:free",
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Нет ответа от ИИ" }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Ошибка соединения с ИИ-модулем." }]);
    }
    setLoading(false);
  };

  const accentColor = MODE_COLORS[currentMode] || "#e94560";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        style={{ background: `linear-gradient(135deg, ${accentColor}, #9b1dcc)` }}
      >
        <Icon name="Bot" size={22} className="text-white" />
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-[310px] bg-[#0d1225] border rounded-2xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden"
      style={{
        borderColor: accentColor + "30",
        maxHeight: minimized ? "auto" : "480px",
      }}
    >
      {/* Шапка */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-b"
        style={{
          background: `linear-gradient(135deg, ${accentColor}22, #9b1dcc18)`,
          borderColor: accentColor + "25",
        }}
      >
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${accentColor}, #9b1dcc)` }}
        >
          <Icon name="Bot" size={13} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white text-xs font-bold leading-tight">ИИ-Ассистент ЕЦСУ</div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accentColor }} />
            <span className="text-[9px]" style={{ color: accentColor }}>
              {currentMode === "assistant" ? "Ассистент" :
               currentMode === "cpvoa"     ? "ЦПВОА" :
               currentMode === "analytics" ? "Аналитика" :
               currentMode === "threats"   ? "Угрозы" : "Онлайн"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              title="Очистить чат"
              className="text-gray-600 hover:text-gray-400 p-0.5 transition-colors"
            >
              <Icon name="RotateCcw" size={11} />
            </button>
          )}
          <button onClick={() => setMinimized(!minimized)} className="text-gray-500 hover:text-gray-300 p-0.5">
            <Icon name={minimized ? "Maximize2" : "Minimize2"} size={12} />
          </button>
          <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-red-400 p-0.5">
            <Icon name="X" size={12} />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Быстрые действия */}
          {messages.length === 0 && (
            <div className="px-2 pt-2 pb-1.5 flex flex-wrap gap-1 border-b border-white/5">
              {QUICK_ACTIONS.map(a => (
                <button
                  key={a.label}
                  onClick={() => send(a.label, a.mode)}
                  className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-full border transition-all hover:opacity-90"
                  style={{
                    background: MODE_COLORS[a.mode] + "12",
                    borderColor: MODE_COLORS[a.mode] + "40",
                    color: MODE_COLORS[a.mode],
                  }}
                >
                  <Icon name={a.icon} size={9} />
                  {a.label}
                </button>
              ))}
            </div>
          )}

          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-2" style={{ minHeight: "140px" }}>
            {messages.length === 0 && (
              <div className="text-center text-gray-600 text-[10px] mt-6 px-4">
                Задай вопрос или выбери действие выше
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-1.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: msg.role === "assistant"
                      ? `linear-gradient(135deg, ${accentColor}, #9b1dcc)`
                      : "#2a2a3e",
                  }}
                >
                  <Icon name={msg.role === "assistant" ? "Bot" : "User"} size={10} className="text-white" />
                </div>

                <div className="flex flex-col gap-0.5 max-w-[85%]">
                  <div
                    draggable={msg.role === "assistant"}
                    onDragStart={msg.role === "assistant" ? e => handleDragStart(e, msg.content) : undefined}
                    className="px-2.5 py-1.5 rounded-xl text-[11px] leading-relaxed whitespace-pre-wrap"
                    style={msg.role === "user"
                      ? { background: accentColor, color: "#fff" }
                      : { background: "#0a0f1e", color: "#e2e8f0", border: `1px solid ${accentColor}20`, cursor: "grab" }
                    }
                  >
                    {msg.content}
                  </div>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1 pl-0.5">
                      <button
                        onClick={() => copyMsg(msg.content, i)}
                        className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded transition-all"
                        style={copiedIdx === i
                          ? { color: "#34d399", background: "#34d39920" }
                          : { color: "#4b5563" }
                        }
                      >
                        <Icon name={copiedIdx === i ? "Check" : "Copy"} size={9} />
                        {copiedIdx === i ? "Скопировано" : "Копировать"}
                      </button>
                      <span className="text-[8px] text-gray-700">· перетащи в поле</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-1.5">
                <div
                  className="w-5 h-5 rounded-lg flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${accentColor}, #9b1dcc)` }}
                >
                  <Icon name="Bot" size={10} className="text-white" />
                </div>
                <div
                  className="px-3 py-2 rounded-xl flex gap-1 items-center"
                  style={{ background: "#0a0f1e", border: `1px solid ${accentColor}20` }}
                >
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: accentColor, animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Ввод */}
          <div className="px-2.5 pb-2.5 pt-1.5 border-t border-white/5">
            <div className="flex gap-1.5">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Сообщение ЕЦСУ..."
                className="flex-1 bg-[#0a0f1e] border rounded-xl px-3 py-2 text-[11px] text-white placeholder-gray-600 outline-none transition-colors"
                style={{ borderColor: accentColor + "35" }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all hover:opacity-90 flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${accentColor}, #9b1dcc)` }}
              >
                <Icon name="Send" size={13} className="text-white" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FloatingAiChat;
