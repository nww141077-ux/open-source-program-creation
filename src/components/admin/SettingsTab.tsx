import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const CONFIG_URL = "https://functions.poehali.dev/744a3183-098e-4b3a-8b5b-c27893d57779";

const CATEGORY_LABELS: Record<string, string> = {
  interface: "Интерфейс",
  system: "Система",
  security: "Безопасность",
  dalan: "Dalan",
  gateway: "Шлюз",
  general: "Общее",
};

interface Setting {
  key: string;
  value: string;
  label: string;
}

const SettingsTab = () => {
  const [settings, setSettings] = useState<Record<string, Setting[]>>({});
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${CONFIG_URL}?action=settings`)
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        const flat: Record<string, string> = {};
        Object.values(data as Record<string, Setting[]>).forEach((items) =>
          items.forEach((s: Setting) => (flat[s.key] = s.value))
        );
        setEdited(flat);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const save = async (key: string) => {
    setSaving(key);
    await fetch(`${CONFIG_URL}?action=save_setting`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: edited[key] }),
    });
    setSaving(null);
    setSaved(key);
    setTimeout(() => setSaved(null), 2000);
  };

  if (loading) return <div className="text-gray-500 animate-pulse">Загрузка настроек...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Icon name="Settings" size={20} className="text-[#e94560]" />
        Настройки интерфейса и системы
      </h2>
      <div className="space-y-8">
        {Object.entries(settings).map(([category, items]) => (
          <div key={category}>
            <div className="text-[#e94560] text-xs font-bold uppercase tracking-widest mb-3">
              {CATEGORY_LABELS[category] || category}
            </div>
            <div className="bg-[#1a1a2e] rounded-xl border border-[#e94560]/10 divide-y divide-[#e94560]/10">
              {items.map((s) => (
                <div key={s.key} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">{s.label}</div>
                    <div className="text-gray-600 text-xs mt-0.5">{s.key}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.value === "true" || s.value === "false" ? (
                      <button
                        onClick={() => {
                          const newVal = edited[s.key] === "true" ? "false" : "true";
                          setEdited((prev) => ({ ...prev, [s.key]: newVal }));
                        }}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          edited[s.key] === "true" ? "bg-[#e94560]" : "bg-gray-700"
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                            edited[s.key] === "true" ? "left-7" : "left-1"
                          }`}
                        />
                      </button>
                    ) : (
                      <input
                        value={edited[s.key] ?? ""}
                        onChange={(e) =>
                          setEdited((prev) => ({ ...prev, [s.key]: e.target.value }))
                        }
                        className="bg-[#0d0d1a] border border-[#e94560]/20 text-white rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:border-[#e94560]"
                      />
                    )}
                    <button
                      onClick={() => save(s.key)}
                      disabled={saving === s.key}
                      className="bg-[#e94560] hover:bg-[#c73550] text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {saved === s.key ? (
                        <Icon name="Check" size={14} />
                      ) : saving === s.key ? (
                        <Icon name="Loader2" size={14} className="animate-spin" />
                      ) : (
                        "Сохранить"
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SettingsTab;