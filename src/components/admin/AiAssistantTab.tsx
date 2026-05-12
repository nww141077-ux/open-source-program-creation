import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

const AI_URL = "https://functions.poehali.dev/7b0103d3-1c04-463b-b543-f2f2b89a53df";

const AI_PROVIDERS = [
  {
    id: "openrouter", label: "OpenRouter", models: [
      { id: "llama-3.1-8b", label: "Llama 3.1 8B (free)" },
      { id: "llama-3.3-70b", label: "Llama 3.3 70B (free)" },
      { id: "mixtral-8x7b", label: "Mixtral 8x7B (free)" },
      { id: "gemma-2-9b", label: "Gemma 2 9B (free)" },
      { id: "deepseek-r1", label: "DeepSeek R1 (free)" },
    ]
  },
  {
    id: "groq", label: "Groq", models: [
      { id: "llama-3.1-8b", label: "Llama 3.1 8B" },
      { id: "llama-3.3-70b", label: "Llama 3.3 70B" },
      { id: "mixtral-8x7b", label: "Mixtral 8x7B" },
    ]
  },
  {
    id: "gemini", label: "Google Gemini", models: [
      { id: "gemini-flash", label: "Gemini 1.5 Flash" },
      { id: "gemini-2-flash", label: "Gemini 2.0 Flash" },
      { id: "gemini-pro", label: "Gemini 1.5 Pro" },
    ]
  },
  {
    id: "yandex", label: "YandexGPT", models: [
      { id: "yandexgpt-lite", label: "YandexGPT Lite" },
      { id: "yandexgpt", label: "YandexGPT Pro" },
    ]
  },
];

interface Message {
  role: "user" | "assistant";
  content: string;
  action_result?: string;
}

const SUGGESTIONS = [
  "Покажи текущие настройки системы",
  "Какие модули сейчас включены?",
  "Создай точку восстановления",
  "Покажи параметры Dalan",
  "Включи модуль мониторинга",
  "Последние точки восстановления",
];

const AiAssistantTab = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Система ECSU DALAN активна. Я твой ИИ-ассистент администратора — могу читать и изменять настройки, модули, конфигурацию Dalan, создавать точки восстановления. Что нужно сделать?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiProvider, setAiProvider] = useState("groq");
  const [aiModel, setAiModel] = useState("llama-3.3-70b");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
          provider: aiProvider,
          model: aiModel,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "Нет ответа",
          action_result: data.action_result,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Ошибка соединения с ИИ-модулем. Проверь подключение." },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="w-10 h-10 bg-gradient-to-br from-[#e94560] to-[#9b1dcc] rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon name="Bot" size={20} className="text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-lg">ИИ-Ассистент</div>
          <div className="text-green-400 text-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse" />
            Онлайн · {AI_PROVIDERS.find(p=>p.id===aiProvider)?.label} · {aiModel}
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <select
            value={aiProvider}
            onChange={(e) => {
              setAiProvider(e.target.value);
              const prov = AI_PROVIDERS.find(p => p.id === e.target.value);
              if (prov) setAiModel(prov.models[0].id);
            }}
            className="bg-[#1a1a2e] border border-[#e94560]/20 text-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
          >
            {AI_PROVIDERS.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <select
            value={aiModel}
            onChange={(e) => setAiModel(e.target.value)}
            className="bg-[#1a1a2e] border border-[#e94560]/20 text-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
          >
            {AI_PROVIDERS.find(p => p.id === aiProvider)?.models.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === "assistant"
                  ? "bg-gradient-to-br from-[#e94560] to-[#9b1dcc]"
                  : "bg-[#2a2a3e]"
              }`}
            >
              <Icon name={msg.role === "assistant" ? "Bot" : "User"} size={14} className="text-white" />
            </div>
            <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === "user" ? "items-end" : ""}`}>
              <div
                className={`px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "assistant"
                    ? "bg-[#1a1a2e] text-gray-200 border border-[#e94560]/10"
                    : "bg-[#e94560] text-white"
                }`}
              >
                {msg.content}
              </div>
              {msg.action_result && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                  <Icon name="CheckCircle" size={12} />
                  {msg.action_result}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e94560] to-[#9b1dcc] flex items-center justify-center">
              <Icon name="Bot" size={14} className="text-white" />
            </div>
            <div className="bg-[#1a1a2e] border border-[#e94560]/10 px-4 py-3 rounded-xl flex gap-1 items-center">
              <span className="w-2 h-2 bg-[#e94560] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-[#e94560] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-[#e94560] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs bg-[#1a1a2e] border border-[#e94560]/20 text-gray-400 hover:text-white hover:border-[#e94560]/50 px-3 py-1.5 rounded-full transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Напиши команду или вопрос..."
          disabled={loading}
          className="flex-1 bg-[#1a1a2e] border border-[#e94560]/20 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#e94560] placeholder-gray-600 disabled:opacity-50"
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="bg-[#e94560] hover:bg-[#c73550] text-white px-4 py-3 rounded-xl transition-colors disabled:opacity-40"
        >
          <Icon name="Send" size={18} />
        </button>
      </div>
    </div>
  );
};

export default AiAssistantTab;