import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const AI_URL = "https://functions.poehali.dev/e74ce640-7610-467a-81ee-cab7c2347d3e";

// Быстрые действия — как было 17 апреля
const QUICK_ACTIONS = [
  { label: "Что не решено?",        icon: "AlertCircle" },
  { label: "Приоритеты ЦПВОА",      icon: "Radar" },
  { label: "Критические инциденты", icon: "AlertTriangle" },
  { label: "Прогноз на неделю",     icon: "TrendingUp" },
];

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

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Копирование сообщения ассистента в буфер обмена
  const copyMsg = useCallback((text: string, idx: number) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  }, []);

  // Drag-and-drop — перетащить ответ в любое поле ввода системы
  const handleDragStart = useCallback((e: React.DragEvent, text: string) => {
    e.dataTransfer.setData("text/plain", text);
    e.dataTransfer.effectAllowed = "copy";
  }, []);

  const send = async (text?: string) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");

    const newMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch(AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "openrouter",
          model: "llama-3.1-8b",
          messages: newMessages,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "Нет ответа от ИИ" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Ошибка соединения с ИИ-модулем." },
      ]);
    }
    setLoading(false);
  };

  // ── Свёрнуто / кнопка открытия ──
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-gradient-to-br from-[#e94560] to-[#9b1dcc] rounded-full flex items-center justify-center shadow-lg shadow-[#e94560]/30 hover:scale-110 transition-transform"
      >
        <Icon name="Bot" size={22} className="text-white" />
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-[300px] bg-[#0d1225] border border-[#e94560]/20 rounded-xl shadow-2xl shadow-black/60 flex flex-col"
      style={{ maxHeight: minimized ? "auto" : "420px" }}
    >
      {/* ── Шапка (как было 17 апреля) ── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#e94560]/20 to-[#9b1dcc]/20 border-b border-[#e94560]/20 rounded-t-xl">
        <div className="w-6 h-6 bg-gradient-to-br from-[#e94560] to-[#9b1dcc] rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon name="Bot" size={12} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white text-xs font-bold leading-tight">ИИ-Ассистент ECSU</div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-[9px]">Онлайн</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(!minimized)}
            className="text-gray-500 hover:text-gray-300 transition-colors p-0.5"
          >
            <Icon name={minimized ? "Maximize2" : "Minimize2"} size={12} />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-500 hover:text-red-400 transition-colors p-0.5"
          >
            <Icon name="X" size={12} />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* ── Быстрые действия (как было 17 апреля) ── */}
          {messages.length === 0 && (
            <div className="px-2 py-2 flex flex-wrap gap-1 border-b border-white/5">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => send(a.label)}
                  className="flex items-center gap-1 text-[9px] bg-[#1a1a2e] border border-[#e94560]/20 text-gray-400 hover:text-white hover:border-[#e94560]/50 px-2 py-1 rounded-full transition-colors"
                >
                  <Icon name={a.icon} size={9} />
                  {a.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Сообщения ── */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2" style={{ minHeight: "120px" }}>
            {messages.length === 0 && (
              <div className="text-center text-gray-600 text-[10px] mt-4">
                Задай вопрос или выбери действие выше
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-1.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {/* Аватар */}
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-[#e94560] to-[#9b1dcc]"
                      : "bg-[#2a2a3e]"
                  }`}
                >
                  <Icon name={msg.role === "assistant" ? "Bot" : "User"} size={10} className="text-white" />
                </div>

                <div className="flex flex-col gap-0.5 max-w-[85%]">
                  {/* Пузырь сообщения */}
                  <div
                    draggable={msg.role === "assistant"}
                    onDragStart={msg.role === "assistant"
                      ? (e) => handleDragStart(e, msg.content)
                      : undefined}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] leading-relaxed whitespace-pre-wrap ${
                      msg.role === "assistant"
                        ? "bg-[#1a1a2e] text-gray-200 border border-[#e94560]/10 cursor-grab active:cursor-grabbing select-text"
                        : "bg-[#e94560] text-white"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Кнопка копирования — только ответы ассистента (дополнение 20.05) */}
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1 pl-0.5">
                      <button
                        onClick={() => copyMsg(msg.content, i)}
                        title="Копировать текст ответа"
                        className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded transition-all"
                        style={
                          copiedIdx === i
                            ? { color: "#34d399", background: "#34d39920" }
                            : { color: "#4b5563" }
                        }
                      >
                        <Icon name={copiedIdx === i ? "Check" : "Copy"} size={9} />
                        {copiedIdx === i ? "Скопировано" : "Копировать"}
                      </button>
                      <span className="text-[8px] text-gray-700">· или перетащи в поле</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Индикатор загрузки */}
            {loading && (
              <div className="flex gap-1.5">
                <div className="w-5 h-5 rounded bg-gradient-to-br from-[#e94560] to-[#9b1dcc] flex items-center justify-center">
                  <Icon name="Bot" size={10} className="text-white" />
                </div>
                <div className="bg-[#1a1a2e] border border-[#e94560]/10 px-3 py-2 rounded-lg flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-[#e94560] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-[#e94560] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-[#e94560] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── Поле ввода (как было 17 апреля) ── */}
          <div className="flex gap-1.5 px-2 py-2 border-t border-white/5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Напиши сообщение..."
              disabled={loading}
              className="flex-1 bg-[#1a1a2e] border border-[#e94560]/20 text-white rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-[#e94560] placeholder-gray-600 disabled:opacity-50"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="w-7 h-7 bg-[#e94560] hover:bg-[#c73350] disabled:opacity-40 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Icon name="Send" size={12} className="text-white" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FloatingAiChat;
