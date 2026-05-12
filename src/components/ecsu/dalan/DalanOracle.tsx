import Icon from "@/components/ui/icon";

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
      { id: "gemma-2-9b", label: "Gemma 2 9B" },
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

export { AI_PROVIDERS };

interface OracleEntry {
  task: string;
  result: number;
  timestamp: string;
}

interface DalanOracleProps {
  task: string;
  setTask: (v: string) => void;
  log: OracleEntry[];
  running: boolean;
  aiProvider: string;
  setAiProvider: (v: string) => void;
  aiModel: string;
  setAiModel: (v: string) => void;
  aiReply: string | null;
  aiError: string | null;
  onRun: () => void;
}

const DalanOracle = ({
  task, setTask, log, running,
  aiProvider, setAiProvider, aiModel, setAiModel,
  aiReply, aiError, onRun,
}: DalanOracleProps) => {
  return (
    <div className="space-y-4">
      <div className="bg-[#060d1f] border border-[#FFD700]/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="Terminal" size={15} className="text-[#FFD700]" />
          <span className="text-[#FFD700] font-bold text-sm tracking-widest">SYNERGON-ORACLE · ЕЦСУ</span>
        </div>

        <div className="flex gap-2 mb-3">
          <select
            value={aiProvider}
            onChange={(e) => {
              setAiProvider(e.target.value);
              const prov = AI_PROVIDERS.find(p => p.id === e.target.value);
              if (prov) setAiModel(prov.models[0].id);
            }}
            className="bg-[#0d1225] border border-[#FFD700]/20 text-[#FFD700] rounded-lg px-3 py-2 text-xs focus:outline-none"
          >
            {AI_PROVIDERS.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <select
            value={aiModel}
            onChange={(e) => setAiModel(e.target.value)}
            className="bg-[#0d1225] border border-[#FFD700]/20 text-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none flex-1"
          >
            {AI_PROVIDERS.find(p => p.id === aiProvider)?.models.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>

        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Введите задачу или смету для оптимизации DALAN..."
          rows={4}
          className="w-full bg-black border border-[#00FF41]/20 text-white rounded-lg px-4 py-3 text-sm font-mono placeholder-gray-700 focus:outline-none focus:border-[#00FF41] resize-none mb-3"
        />
        <button
          onClick={onRun}
          disabled={running || !task.trim()}
          className="bg-[#0056b3] hover:bg-[#0068d6] disabled:opacity-40 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
        >
          {running ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Zap" size={15} />}
          ЗАПУСТИТЬ ОПТИМИЗАЦИЮ DALAN
        </button>

        {aiReply && (
          <div className="mt-3 bg-[#00FF41]/5 border border-[#00FF41]/20 rounded-lg p-4">
            <div className="text-[#00FF41] text-xs font-mono mb-2 flex items-center gap-2">
              <Icon name="Bot" size={12} />
              DALAN · {AI_PROVIDERS.find(p => p.id === aiProvider)?.label} · {aiModel}
            </div>
            <div className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">{aiReply}</div>
          </div>
        )}
        {aiError && (
          <div className="mt-3 bg-[#e94560]/10 border border-[#e94560]/30 rounded-lg p-3 text-[#e94560] text-sm flex items-center gap-2">
            <Icon name="AlertTriangle" size={14} />
            {aiError}
          </div>
        )}
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
  );
};

export default DalanOracle;
