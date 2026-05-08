import { useEffect, useState } from "react";

import Icon from "@/components/ui/icon";

const CONFIG_URL = "https://functions.poehali.dev/744a3183-098e-4b3a-8b5b-c27893d57779";

interface StoreModule {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  size: string;
  icon: string;
  installed: boolean;
  popular?: boolean;
}

const CATEGORIES = ["Все", "Безопасность", "Аналитика", "Интеграции", "Сеть", "Утилиты"];



const StoreTab = () => {
  const [modules, setModules] = useState<StoreModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [search, setSearch] = useState("");
  const [installing, setInstalling] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch(`${CONFIG_URL}?action=store`)
      .then((r) => r.json())
      .then((data) => {
        setModules(data);
        setLoading(false);
      });
  }, []);

  const filtered = modules.filter((m) => {
    const matchCat = activeCategory === "Все" || m.category === activeCategory;
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleInstall = async (mod: StoreModule) => {
    const newInstalled = !mod.installed;

    if (newInstalled) {
      setInstalling(mod.id);
      setProgress((p) => ({ ...p, [mod.id]: 0 }));
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((r) => setTimeout(r, 120));
        setProgress((p) => ({ ...p, [mod.id]: i }));
      }
    }

    await fetch(`${CONFIG_URL}?action=store_install`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: mod.id, installed: newInstalled }),
    });

    setModules((prev) =>
      prev.map((m) => (m.id === mod.id ? { ...m, installed: newInstalled } : m))
    );
    setInstalling(null);
    setProgress((p) => {
      const next = { ...p };
      delete next[mod.id];
      return next;
    });
  };

  const installedCount = modules.filter((m) => m.installed).length;

  if (loading) return <div className="text-gray-500 animate-pulse">Загрузка магазина...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Icon name="Store" size={20} className="text-[#e94560]" />
          Магазин модулей
        </h2>
        <div className="flex items-center gap-2 bg-[#1a1a2e] border border-[#e94560]/20 rounded-lg px-3 py-1.5 text-sm">
          <Icon name="Package" size={14} className="text-[#e94560]" />
          <span className="text-gray-400">Установлено:</span>
          <span className="text-white font-bold">{installedCount}</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Icon
          name="Search"
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск модулей..."
          className="w-full bg-[#1a1a2e] border border-[#e94560]/20 text-white rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#e94560] placeholder-gray-600"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeCategory === cat
                ? "bg-[#e94560] text-white"
                : "bg-[#1a1a2e] text-gray-400 hover:text-white border border-[#e94560]/10 hover:border-[#e94560]/30"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Modules grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((mod) => (
          <div
            key={mod.id}
            className={`bg-[#1a1a2e] rounded-xl border transition-colors p-4 ${
              mod.installed
                ? "border-[#e94560]/30"
                : "border-[#e94560]/10 hover:border-[#e94560]/20"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    mod.installed ? "bg-[#e94560]/20" : "bg-white/5"
                  }`}
                >
                  <Icon
                    name={mod.icon}
                    size={20}
                    className={mod.installed ? "text-[#e94560]" : "text-gray-400"}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold text-sm">{mod.name}</span>
                    {mod.popular && (
                      <span className="text-[10px] bg-[#e94560]/20 text-[#e94560] px-1.5 py-0.5 rounded font-medium">
                        Популярный
                      </span>
                    )}
                    {mod.installed && (
                      <span className="text-[10px] bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded font-medium">
                        Установлен
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                    {mod.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-600">
                    <span>v{mod.version}</span>
                    <span>{mod.size}</span>
                    <span className="text-gray-700">•</span>
                    <span>{mod.category}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleInstall(mod)}
                disabled={installing === mod.id}
                className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                  mod.installed
                    ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    : "bg-[#e94560] text-white hover:bg-[#c73550]"
                }`}
              >
                {installing === mod.id
                  ? `${progress[mod.id] ?? 0}%`
                  : mod.installed
                  ? "Удалить"
                  : "Установить"}
              </button>
            </div>

            {/* Progress bar */}
            {installing === mod.id && (
              <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#e94560] transition-all duration-100 rounded-full"
                  style={{ width: `${progress[mod.id] ?? 0}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-gray-600 py-16">
          <Icon name="PackageSearch" size={40} className="mx-auto mb-3 opacity-30" />
          <div>Модули не найдены</div>
        </div>
      )}
    </div>
  );
};

export default StoreTab;