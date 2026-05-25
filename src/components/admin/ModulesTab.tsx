import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const CONFIG_URL = "https://functions.poehali.dev/744a3183-098e-4b3a-8b5b-c27893d57779";

interface Module {
  id: number;
  name: string;
  label: string;
  enabled: boolean;
}

const ModulesTab = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${CONFIG_URL}?action=modules`)
      .then((r) => r.json())
      .then((data) => {
        setModules(data);
        setLoading(false);
      });
  }, []);

  const toggle = async (mod: Module) => {
    setToggling(mod.id);
    const newEnabled = !mod.enabled;
    await fetch(`${CONFIG_URL}?action=save_module`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: mod.id, enabled: newEnabled }),
    });
    setModules((prev) =>
      prev.map((m) => (m.id === mod.id ? { ...m, enabled: newEnabled } : m))
    );
    setToggling(null);
  };

  if (loading) return <div className="text-gray-500 animate-pulse">Загрузка модулей...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Icon name="LayoutGrid" size={20} className="text-[#e94560]" />
        Управление модулями
      </h2>
      <div className="bg-[#1a1a2e] rounded-xl border border-[#e94560]/10 divide-y divide-[#e94560]/10">
        {modules.map((mod) => (
          <div key={mod.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <div className="text-white font-medium">{mod.label}</div>
              <div className="text-gray-600 text-xs mt-0.5">{mod.name}</div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  mod.enabled
                    ? "bg-green-500/10 text-green-400"
                    : "bg-gray-700/50 text-gray-500"
                }`}
              >
                {mod.enabled ? "Активен" : "Выключен"}
              </span>
              <button
                onClick={() => toggle(mod)}
                disabled={toggling === mod.id}
                className={`w-12 h-6 rounded-full transition-colors relative disabled:opacity-50 ${
                  mod.enabled ? "bg-[#e94560]" : "bg-gray-700"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                    mod.enabled ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModulesTab;
