import Icon from "@/components/ui/icon";

interface BaseModel {
  id: string; name: string; org: string; license: string; license_type: string;
  license_url: string; description: string; params: string; languages: string[];
  via: string; ollama_tag: string; commercial_ok: boolean; finetune_ok: boolean; color: string;
}

const LICENSE_COLORS: Record<string, string> = {
  mit: "#00c8a0", apache2: "#3b82f6", open: "#a855f7", gemma: "#4285f4",
};
const LICENSE_ICONS: Record<string, string> = {
  mit: "Unlock", apache2: "Shield", open: "Globe", gemma: "Star",
};

interface Props {
  models: BaseModel[];
  selectedModelId: string;
  onSelect: (id: string) => void;
}

export default function ModelsCatalog({ models, selectedModelId, onSelect }: Props) {
  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-white">Базовые модели с открытым кодом</h2>
        <p className="text-white/40 text-sm mt-1">Все модели имеют открытые лицензии — можно использовать, дообучать и распространять</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {models.map(m => {
          const isSelected = selectedModelId === m.id;
          const licColor = LICENSE_COLORS[m.license_type] ?? "#a855f7";
          const licIcon = LICENSE_ICONS[m.license_type] ?? "Shield";
          return (
            <div key={m.id} className="rounded-2xl overflow-hidden transition-all"
              style={{ border: `1px solid ${isSelected ? m.color + "60" : "rgba(255,255,255,0.07)"}`, background: isSelected ? `${m.color}0c` : "rgba(255,255,255,0.02)" }}>
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${m.color}20`, border: `1px solid ${m.color}40` }}>
                      <Icon name="BrainCircuit" size={18} style={{ color: m.color }} />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{m.name}</div>
                      <div className="text-white/40 text-xs">{m.org} · {m.params}</div>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                      style={{ background: `${m.color}25`, color: m.color }}>ВЫБРАНА</span>
                  )}
                </div>

                <p className="text-white/50 text-xs leading-relaxed mb-3">{m.description}</p>

                <div className="flex items-center gap-2 mb-3 p-2 rounded-lg"
                  style={{ background: `${licColor}10`, border: `1px solid ${licColor}25` }}>
                  <Icon name={licIcon as "Shield"} size={13} style={{ color: licColor }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold" style={{ color: licColor }}>{m.license}</div>
                    <a href={m.license_url} target="_blank" rel="noreferrer"
                      className="text-[10px] underline opacity-60" style={{ color: licColor }}>
                      Читать лицензию →
                    </a>
                  </div>
                </div>

                <div className="flex gap-2 mb-3">
                  {[
                    { ok: m.commercial_ok, label: "Коммерческое" },
                    { ok: m.finetune_ok, label: "Дообучение" },
                  ].map(r => (
                    <div key={r.label} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg"
                      style={{ background: r.ok ? "rgba(0,200,160,0.1)" : "rgba(239,68,68,0.1)", color: r.ok ? "#00c8a0" : "#f87171", border: `1px solid ${r.ok ? "rgba(0,200,160,0.25)" : "rgba(239,68,68,0.25)"}` }}>
                      <Icon name={r.ok ? "Check" : "X"} size={10} />
                      {r.label}
                    </div>
                  ))}
                  <div className="text-[10px] px-2 py-1 rounded-lg text-white/30"
                    style={{ background: "rgba(255,255,255,0.04)" }}>
                    {m.languages.join(", ").toUpperCase()}
                  </div>
                </div>

                <div className="text-[10px] text-white/30 mb-3">
                  Доступна через: <span className="text-white/50">{m.via}</span>
                </div>

                <button
                  onClick={() => onSelect(m.id)}
                  className="w-full py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
                  style={{
                    background: isSelected ? `${m.color}30` : `linear-gradient(135deg, ${m.color}, #6366f1)`,
                    color: isSelected ? m.color : "white",
                    border: isSelected ? `1px solid ${m.color}50` : "none",
                  }}>
                  {isSelected ? "✓ Выбрана — перейти к настройке" : "Выбрать эту модель"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
