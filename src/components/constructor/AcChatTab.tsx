import { useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Message, KnowledgeItem, QUICK_PROMPTS, SK, lsGet, lsSet } from "./AcTypes";

interface Props {
  messages: Message[];
  saveMessages: (m: Message[]) => void;
  knowledge: KnowledgeItem[];
  saveKnowledge: (k: KnowledgeItem[]) => void;
  docsLength: number;
  input: string;
  setInput: (v: string) => void;
  loading: boolean;
  error: string;
  connColor: string;
  settingsHost: string;
  settingsPort: string;
  onSend: (text?: string) => void;
}

const AcChatTab = ({
  messages, saveMessages, knowledge, saveKnowledge,
  docsLength, input, setInput, loading, error,
  connColor, settingsHost, settingsPort, onSend,
}: Props) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const clearHistory = () => {
    if (confirm("Очистить историю чата?")) saveMessages([]);
  };

  const rateMessage = (idx: number, rating: 1 | -1) => {
    const updated = messages.map((m, i) => i === idx ? { ...m, rating } : m);
    saveMessages(updated);
    const fb = lsGet<{ msgIdx: number; rating: 1 | -1; comment: string }[]>(SK.feedback, []);
    fb.push({ msgIdx: idx, rating, comment: "" });
    lsSet(SK.feedback, fb);
  };

  const saveToKnowledge = (msgContent: string, prevContent: string) => {
    const kItem: KnowledgeItem = {
      id: Date.now().toString(),
      question: prevContent || "Вопрос",
      answer: msgContent,
      source: "manual",
      createdAt: new Date().toLocaleDateString("ru-RU"),
    };
    saveKnowledge([kItem, ...knowledge]);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Быстрые промпты */}
      {messages.length === 0 && (
        <div className="p-4 grid grid-cols-3 gap-2">
          {QUICK_PROMPTS.map(p => (
            <button key={p.label} onClick={() => onSend(p.text)}
              className="flex flex-col items-start gap-1.5 p-3 bg-[#0a0f1e] border border-blue-900/30 rounded-xl hover:border-purple-700/40 text-left transition-all group">
              <Icon name={p.icon} size={14} className="text-purple-400 group-hover:text-purple-300" />
              <span className="text-xs text-gray-400 group-hover:text-gray-200">{p.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Сообщения */}
      <div className="flex-1 overflow-auto px-4 py-3 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${m.role === "assistant" ? "bg-gradient-to-br from-purple-600 to-blue-700" : "bg-[#1e2d4a]"}`}>
              <Icon name={m.role === "assistant" ? "BrainCircuit" : "User"} size={13} className="text-white" />
            </div>
            <div className="flex-1 max-w-[80%]">
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "assistant"
                  ? "bg-[#0d1225] border border-blue-900/30 text-gray-200"
                  : "bg-gradient-to-br from-purple-700 to-blue-700 text-white"
              }`}>
                {m.content}
              </div>
              {m.role === "assistant" && (
                <div className="flex items-center gap-2 mt-1.5 pl-1">
                  <button onClick={() => navigator.clipboard.writeText(m.content)}
                    className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-400 transition-colors">
                    <Icon name="Copy" size={10} />
                    Копировать
                  </button>
                  <button onClick={() => rateMessage(i, 1)}
                    className={`text-[10px] flex items-center gap-0.5 transition-colors ${m.rating === 1 ? "text-green-400" : "text-gray-600 hover:text-green-400"}`}>
                    <Icon name="ThumbsUp" size={10} />
                    {m.rating === 1 ? "Хорошо" : ""}
                  </button>
                  <button onClick={() => rateMessage(i, -1)}
                    className={`text-[10px] flex items-center gap-0.5 transition-colors ${m.rating === -1 ? "text-red-400" : "text-gray-600 hover:text-red-400"}`}>
                    <Icon name="ThumbsDown" size={10} />
                    {m.rating === -1 ? "Плохо" : ""}
                  </button>
                  <button
                    onClick={() => saveToKnowledge(m.content, messages[i - 1]?.content || "")}
                    className="text-[10px] text-gray-600 hover:text-purple-400 transition-colors flex items-center gap-0.5">
                    <Icon name="BookmarkPlus" size={10} />
                    В базу знаний
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-blue-700 flex items-center justify-center">
              <Icon name="BrainCircuit" size={13} className="text-white" />
            </div>
            <div className="bg-[#0d1225] border border-blue-900/30 px-4 py-3 rounded-2xl flex items-center gap-1.5">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
              <span className="text-gray-600 text-xs ml-2">LM Studio думает...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-3 text-sm text-red-300 flex items-start gap-2">
            <Icon name="AlertCircle" size={14} className="mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold mb-1">Ошибка подключения к LM Studio</div>
              <div className="text-xs text-red-400">{error}</div>
              <div className="text-xs text-gray-500 mt-2">
                Как запустить: откройте LM Studio → вкладка «Local Server» → нажмите «Start Server»
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Поле ввода */}
      <div className="px-4 pb-4 pt-2 border-t border-blue-900/10">
        {messages.length > 0 && (
          <button onClick={clearHistory} className="text-[10px] text-gray-700 hover:text-gray-500 mb-2 transition-colors">
            Очистить историю
          </button>
        )}
        <div className="flex gap-2">
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
            placeholder="Опиши что нужно создать... (Enter — отправить, Shift+Enter — новая строка)"
            rows={2}
            className="flex-1 bg-[#0a0f1e] border border-blue-900/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none resize-none focus:border-purple-700/50" />
          <button onClick={() => onSend()} disabled={!input.trim() || loading}
            className="w-12 bg-gradient-to-br from-purple-600 to-blue-700 text-white rounded-xl flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity flex-shrink-0">
            <Icon name="Send" size={16} />
          </button>
        </div>
        <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-700">
          <span className="flex items-center gap-1">
            <Icon name="BookOpen" size={9} />
            {knowledge.length} знаний в RAG
          </span>
          <span className="flex items-center gap-1">
            <Icon name="FileText" size={9} />
            {docsLength} документов
          </span>
          <span className="flex items-center gap-1" style={{ color: connColor }}>
            <Icon name="Cpu" size={9} />
            {settingsHost}:{settingsPort}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AcChatTab;
