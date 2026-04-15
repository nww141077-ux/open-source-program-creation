import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

const SEARCH_ENGINES = [
  {
    id: "brave",
    name: "Brave Search",
    url: "https://search.brave.com/search?q=",
    icon: "🦁",
    desc: "Независимый · без трекеров",
    color: "#f59e0b",
  },
  {
    id: "duckduckgo",
    name: "DuckDuckGo",
    url: "https://duckduckgo.com/?q=",
    icon: "🦆",
    desc: "Без слежки · открытый",
    color: "#de5833",
  },
  {
    id: "searxng",
    name: "SearXNG",
    url: "https://searx.be/search?q=",
    icon: "🔍",
    desc: "Открытый код · метапоиск",
    color: "#3b82f6",
  },
  {
    id: "metager",
    name: "MetaGer",
    url: "https://metager.org/meta/meta.ger3?eingabe=",
    icon: "🔎",
    desc: "Некоммерческий · Германия",
    color: "#a855f7",
  },
  {
    id: "mojeek",
    name: "Mojeek",
    url: "https://www.mojeek.com/search?q=",
    icon: "🌐",
    desc: "Собственный индекс · без профилирования",
    color: "#00ff87",
  },
  {
    id: "startpage",
    name: "Startpage",
    url: "https://www.startpage.com/search?q=",
    icon: "🛡️",
    desc: "Приватный · нидерланды",
    color: "#06b6d4",
  },
];

export default function EgsuSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [engineId, setEngineId] = useState("brave");
  const [showEngines, setShowEngines] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const engine = SEARCH_ENGINES.find(e => e.id === engineId)!;

  function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    window.open(`${engine.url}${encodeURIComponent(query.trim())}`, "_blank", "noopener,noreferrer");
    setQuery("");
    setOpen(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setOpen(false); setShowEngines(false); }
  }

  // Закрыть при клике вне
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowEngines(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Фокус при открытии
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {/* Кнопка открытия */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
          style={{ background: "rgba(6,182,212,0.12)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.25)" }}
        >
          <Icon name="Search" size={14} />
          <span className="hidden md:block">Поиск</span>
        </button>
      )}

      {/* Развёрнутая строка поиска */}
      {open && (
        <form onSubmit={handleSearch} className="flex items-center gap-1">
          {/* Выбор поисковика */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEngines(!showEngines)}
              className="flex items-center gap-1.5 px-2 py-2 rounded-l-lg text-sm font-semibold transition-all"
              style={{ background: `${engine.color}15`, color: engine.color, border: `1px solid ${engine.color}30`, borderRight: "none" }}
              title={engine.name}
            >
              <span className="text-base leading-none">{engine.icon}</span>
              <Icon name="ChevronDown" size={11} />
            </button>

            {/* Дропдаун поисковиков */}
            {showEngines && (
              <div className="absolute top-full left-0 mt-1 w-64 rounded-xl overflow-hidden z-50 shadow-2xl"
                style={{ background: "rgba(6,10,18,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="px-3 py-2 text-white/30 text-[10px] uppercase tracking-widest border-b"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  Поисковые системы (открытый код)
                </div>
                {SEARCH_ENGINES.map(eng => (
                  <button
                    key={eng.id}
                    type="button"
                    onClick={() => { setEngineId(eng.id); setShowEngines(false); inputRef.current?.focus(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 transition-all text-left hover:bg-white/5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <span className="text-xl leading-none">{eng.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium flex items-center gap-2">
                        {eng.name}
                        {eng.id === engineId && <Icon name="Check" size={12} style={{ color: eng.color }} />}
                      </div>
                      <div className="text-white/30 text-[10px] truncate">{eng.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Поле ввода */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder={`Поиск через ${engine.name}...`}
            className="w-48 md:w-64 px-3 py-2 text-sm text-white placeholder-white/25 outline-none"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: `1px solid ${engine.color}30`,
              borderLeft: "none",
              borderRight: "none",
            }}
          />

          {/* Кнопка поиска */}
          <button
            type="submit"
            className="px-3 py-2 text-sm font-semibold transition-all rounded-r-lg"
            style={{ background: `${engine.color}20`, color: engine.color, border: `1px solid ${engine.color}30`, borderLeft: "none" }}
          >
            <Icon name="Search" size={14} />
          </button>

          {/* Закрыть */}
          <button
            type="button"
            onClick={() => { setOpen(false); setShowEngines(false); setQuery(""); }}
            className="p-2 rounded-lg transition-all text-white/30 hover:text-white/60"
          >
            <Icon name="X" size={14} />
          </button>
        </form>
      )}
    </div>
  );
}
