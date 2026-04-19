import Icon from "@/components/ui/icon";

interface BaseModel {
  id: string; name: string; org: string; license: string; color: string;
}
interface ModelConfig {
  id?: number; base_model_id: string; model_name: string; owner_name: string;
  system_prompt: string; temperature: number; max_tokens: number; language: string; domain: string;
}

const DOMAINS = [
  { id: "general", label: "Общий ассистент" },
  { id: "legal", label: "Юридическая помощь" },
  { id: "security", label: "Кибербезопасность" },
  { id: "analytics", label: "Аналитика данных" },
  { id: "customer", label: "Поддержка клиентов" },
  { id: "coding", label: "Программирование" },
];

interface Props {
  config: ModelConfig;
  selectedModel: BaseModel | undefined;
  loading: boolean;
  onConfigChange: (config: ModelConfig) => void;
  onSave: () => void;
  onSwitchModel: () => void;
}

export default function ModelConfigTab({ config, selectedModel, loading, onConfigChange, onSave, onSwitchModel }: Props) {
  const set = (patch: Partial<ModelConfig>) => onConfigChange({ ...config, ...patch });

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white">Настройка модели</h2>
        <p className="text-white/40 text-sm mt-1">Специализация через системный промпт — это и есть ваше «дообучение»</p>
      </div>

      {selectedModel && (
        <div className="p-4 rounded-2xl flex items-center gap-3"
          style={{ background: `${selectedModel.color}0f`, border: `1px solid ${selectedModel.color}40` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${selectedModel.color}25` }}>
            <Icon name="BrainCircuit" size={18} style={{ color: selectedModel.color }} />
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: selectedModel.color }}>{selectedModel.name}</div>
            <div className="text-white/40 text-xs">{selectedModel.license} · {selectedModel.org}</div>
          </div>
          <button onClick={onSwitchModel} className="ml-auto text-xs text-white/30 hover:text-white/60">Сменить →</button>
        </div>
      )}

      <div className="p-5 rounded-2xl space-y-4"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Ваше имя (правообладатель)</label>
            <input type="text" value={config.owner_name} onChange={e => set({ owner_name: e.target.value })}
              placeholder="Владимир Иванов"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
            <div className="text-[10px] text-white/25 mt-1">Будет указано в юридическом документе</div>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Название вашей модели</label>
            <input type="text" value={config.model_name} onChange={e => set({ model_name: e.target.value })}
              placeholder="ECSU Assistant v1"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/40 mb-1.5">Предметная область</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {DOMAINS.map(d => (
              <button key={d.id} onClick={() => set({ domain: d.id })}
                className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: config.domain === d.id ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                  color: config.domain === d.id ? "#818cf8" : "rgba(255,255,255,0.4)",
                  border: `1px solid ${config.domain === d.id ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.06)"}`,
                }}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/40 mb-1.5">
            Системный промпт — специализация модели
            <span className="ml-2 text-indigo-400">← главный инструмент дообучения</span>
          </label>
          <textarea
            value={config.system_prompt}
            onChange={e => set({ system_prompt: e.target.value })}
            placeholder="Ты персональный ИИ-ассистент. Отвечай точно и по делу на русском языке. Специализируешься на юридических вопросах..."
            rows={5}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none leading-relaxed"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(99,102,241,0.3)", color: "white" }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Температура: {config.temperature}</label>
            <input type="range" min="0" max="1" step="0.05"
              value={config.temperature}
              onChange={e => set({ temperature: parseFloat(e.target.value) })}
              className="w-full accent-indigo-500" />
            <div className="flex justify-between text-[10px] text-white/25 mt-0.5">
              <span>Точный</span><span>Творческий</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Макс. токенов: {config.max_tokens}</label>
            <input type="range" min="256" max="4096" step="128"
              value={config.max_tokens}
              onChange={e => set({ max_tokens: parseInt(e.target.value) })}
              className="w-full accent-indigo-500" />
            <div className="flex justify-between text-[10px] text-white/25 mt-0.5">
              <span>256</span><span>4096</span>
            </div>
          </div>
        </div>

        <button onClick={onSave} disabled={loading}
          className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}>
          Сохранить конфигурацию
        </button>
      </div>

      <div className="p-4 rounded-2xl text-xs text-white/30 space-y-1"
        style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
        <div className="font-semibold text-indigo-400 mb-2">Что такое Instruction Tuning?</div>
        <p>Это способ специализировать модель без изменения её весов — через обучающие примеры (вопрос→ответ) и системный промпт. Это законный и признанный метод адаптации ИИ.</p>
        <p className="mt-2">После сохранения настроек — перейдите в раздел «Обучение» чтобы добавить примеры, затем сформируйте юридический документ.</p>
      </div>
    </div>
  );
}
