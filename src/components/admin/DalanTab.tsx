import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const CONFIG_URL = "https://functions.poehali.dev/744a3183-098e-4b3a-8b5b-c27893d57779";

interface DalanParam {
  key: string;
  value: string;
  label: string;
  type: string;
}

const DalanTab = () => {
  const [params, setParams] = useState<DalanParam[]>([]);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${CONFIG_URL}?action=dalan`)
      .then((r) => r.json())
      .then((data: DalanParam[]) => {
        setParams(data);
        const flat: Record<string, string> = {};
        data.forEach((p) => (flat[p.key] = p.value));
        setEdited(flat);
        setLoading(false);
      });
  }, []);

  const save = async (key: string) => {
    setSaving(key);
    await fetch(`${CONFIG_URL}?action=save_dalan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: edited[key] }),
    });
    setSaving(null);
    setSaved(key);
    setTimeout(() => setSaved(null), 2000);
  };

  if (loading) return <div className="text-gray-500 animate-pulse">Загрузка конфигурации Dalan...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <Icon name="Brain" size={20} className="text-[#e94560]" />
        Конфигурация нейросети Dalan
      </h2>
      <p className="text-gray-500 text-sm mb-6">Параметры архитектуры и обучения модели</p>

      <div className="bg-[#1a1a2e] rounded-xl border border-[#e94560]/10 divide-y divide-[#e94560]/10">
        {params.map((p) => (
          <div key={p.key} className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1">
              <div className="text-white text-sm font-medium">{p.label}</div>
              <div className="text-gray-600 text-xs mt-0.5">{p.key}</div>
            </div>
            <div className="flex items-center gap-2">
              {p.type === "boolean" ? (
                <button
                  onClick={() => {
                    const newVal = edited[p.key] === "true" ? "false" : "true";
                    setEdited((prev) => ({ ...prev, [p.key]: newVal }));
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    edited[p.key] === "true" ? "bg-[#e94560]" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                      edited[p.key] === "true" ? "left-7" : "left-1"
                    }`}
                  />
                </button>
              ) : (
                <input
                  type={p.type === "number" ? "number" : "text"}
                  value={edited[p.key] ?? ""}
                  onChange={(e) =>
                    setEdited((prev) => ({ ...prev, [p.key]: e.target.value }))
                  }
                  className="bg-[#0d0d1a] border border-[#e94560]/20 text-white rounded-lg px-3 py-2 text-sm w-40 focus:outline-none focus:border-[#e94560]"
                />
              )}
              <button
                onClick={() => save(p.key)}
                disabled={saving === p.key}
                className="bg-[#e94560] hover:bg-[#c73550] text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saved === p.key ? (
                  <Icon name="Check" size={14} />
                ) : saving === p.key ? (
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
  );
};

export default DalanTab;
