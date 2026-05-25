import Icon from "@/components/ui/icon";
import { useState, useEffect } from "react";

const INCIDENTS_URL =
  "https://functions.poehali.dev/df1d9dd9-c455-479d-807f-b25e000928ff";

const SEV_COLOR: Record<string, string> = {
  critical: "#e94560",
  high: "#f59e0b",
  medium: "#a78bfa",
  low: "#94a3b8",
};

const COUNTRY_XY: Record<string, [number, number]> = {
  Russia: [68, 25], "Russian Federation": [68, 25],
  China: [75, 36], "United States": [20, 36], USA: [20, 36],
  India: [68, 46], Brazil: [35, 60], Global: [50, 50],
  Japan: [82, 34], Germany: [50, 28], France: [48, 30],
  "United Kingdom": [46, 26], Ukraine: [55, 28], Iran: [60, 38],
  Syria: [57, 38], Pakistan: [65, 40], Turkey: [56, 33],
  "North Korea": [80, 32], "South Korea": [81, 34],
  Australia: [80, 66], Canada: [22, 23], Mexico: [18, 43],
  Indonesia: [78, 54], Philippines: [82, 48], Thailand: [76, 46],
  Spain: [46, 34], Italy: [51, 33], Poland: [52, 27],
  Nigeria: [50, 50], Egypt: [56, 41], "South Africa": [55, 70],
};

function getXY(country: string): [number, number] {
  if (COUNTRY_XY[country]) return COUNTRY_XY[country];
  const u = country.toUpperCase();
  if (u.includes("CHINA")) return [75, 36];
  if (u.includes("RUSSIA")) return [68, 25];
  if (u.includes("INDIA")) return [68, 46];
  if (u.includes("JAPAN")) return [82, 34];
  if (u.includes("AFRICA")) return [52, 55];
  return [30 + Math.random() * 40, 30 + Math.random() * 30];
}

interface ApiIncident {
  id: number;
  title: string;
  country: string;
  severity: string;
  status: string;
  type?: string;
  created_at: string;
}

interface MapDot {
  x: number;
  y: number;
  severity: string;
  country: string;
}

const STRATEGIC_OBJECTS = [
  { name: "Узел ЦПВОА-1 · Москва", status: "online", color: "#00c896" },
  { name: "Ретранслятор FM-101 · Урал", status: "warning", color: "#f59e0b" },
  { name: "Меш-узел #7 · Сибирь", status: "online", color: "#00c896" },
  { name: "Буфер #3 · Дальний Восток", status: "critical", color: "#e94560" },
  { name: "Внешний IP-шлюз · Запад", status: "online", color: "#00c896" },
  { name: "Резервный канал · Юг", status: "offline", color: "#94a3b8" },
];

const EcsuCpvoa = () => {
  const [query, setQuery] = useState("");
  const [incidents, setIncidents] = useState<ApiIncident[]>([]);
  const [mapDots, setMapDots] = useState<MapDot[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentTab, setRecentTab] = useState<"all" | "open" | "closed">("all");

  useEffect(() => {
    fetch(`${INCIDENTS_URL}?action=list&limit=200`)
      .then((r) => r.json())
      .then((data) => {
        const incs: ApiIncident[] = data.incidents || [];
        setIncidents(incs);

        const byCountry: Record<string, { severity: string }> = {};
        incs.forEach((inc) => {
          if (!byCountry[inc.country]) byCountry[inc.country] = { severity: inc.severity };
          const order = ["critical", "high", "medium", "low"];
          if (order.indexOf(inc.severity) < order.indexOf(byCountry[inc.country].severity))
            byCountry[inc.country].severity = inc.severity;
        });
        setMapDots(
          Object.entries(byCountry).map(([country, info]) => {
            const [x, y] = getXY(country);
            return { x, y, severity: info.severity, country };
          })
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const recentFiltered = incidents
    .filter((inc) => {
      if (recentTab === "open") return inc.status !== "resolved";
      if (recentTab === "closed") return inc.status === "resolved";
      return true;
    })
    .slice(0, 8);

  return (
    <div className="min-h-full pb-8 text-white" style={{ background: "#080c1a" }}>

      {/* Поиск */}
      <div className="px-6 pt-5 pb-4">
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3 border border-blue-900/40"
          style={{ background: "#0d1225" }}
        >
          <Icon name="Search" size={16} className="text-gray-500 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Введи запрос для поиска через ЦПВОА (например: ЦПВОА, проверить активности в эфире на 192.3 МГц)"
            className="flex-1 bg-transparent text-sm text-gray-300 placeholder-gray-600 outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-gray-600 hover:text-gray-400">
              <Icon name="X" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 5 кнопок действий */}
      <div className="px-6 mb-6 grid grid-cols-5 gap-3">
        {[
          { label: "Мониторинг эфира", icon: "Radio", color: "#00c896", bg: "#00c89615" },
          { label: "Тревожный режим", icon: "ShieldAlert", color: "#60a5fa", bg: "#60a5fa15" },
          { label: "База сигналов", icon: "Database", color: "#f59e0b", bg: "#f59e0b15" },
          { label: "Справочная", icon: "BookOpen", color: "#94a3b8", bg: "#94a3b815" },
          { label: "ЭКСТРЕННЫЙ СИГНАЛ", icon: "Siren", color: "#e94560", bg: "#e9456015" },
        ].map((btn) => (
          <button
            key={btn.label}
            className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border transition-all hover:opacity-80 active:scale-95"
            style={{ background: btn.bg, borderColor: btn.color + "44" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: btn.color + "22" }}
            >
              <Icon name={btn.icon} size={20} style={{ color: btn.color }} />
            </div>
            <span
              className="text-[11px] font-semibold text-center leading-tight"
              style={{ color: btn.color }}
            >
              {btn.label}
            </span>
          </button>
        ))}
      </div>

      {/* Карта инцидентов ЦПВОА */}
      <div className="px-6 mb-6">
        <div
          className="rounded-2xl border border-blue-900/30 overflow-hidden"
          style={{ background: "#0d1225" }}
        >
          <div className="flex items-center gap-2 px-5 py-3 border-b border-blue-900/30">
            <Icon name="Map" size={14} className="text-blue-400" />
            <span className="text-white text-xs font-bold uppercase tracking-widest">
              Карта инцидентов ЦПВОА
            </span>
            <span className="ml-2 bg-blue-900/40 text-blue-400 text-[10px] px-2 py-0.5 rounded-full">
              {mapDots.length} объектов
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              <span className="text-green-400 text-[10px] font-mono">LIVE</span>
            </div>
          </div>

          <div
            className="relative mx-4 my-4 rounded-xl overflow-hidden"
            style={{ height: 200, background: "#060d1f" }}
          >
            {/* Сетка */}
            <svg className="absolute inset-0 w-full h-full opacity-10">
              {[...Array(7)].map((_, i) => (
                <line key={`h${i}`} x1="0" y1={`${i * 17}%`} x2="100%" y2={`${i * 17}%`}
                  stroke="#60a5fa" strokeWidth="0.5" />
              ))}
              {[...Array(10)].map((_, i) => (
                <line key={`v${i}`} x1={`${i * 11}%`} y1="0" x2={`${i * 11}%`} y2="100%"
                  stroke="#60a5fa" strokeWidth="0.5" />
              ))}
            </svg>
            {/* Континенты */}
            <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 80">
              <ellipse cx="65" cy="30" rx="27" ry="13" fill="#1e3a5f" />
              <ellipse cx="20" cy="28" rx="12" ry="11" fill="#1e3a5f" />
              <ellipse cx="30" cy="58" rx="7" ry="12" fill="#1e3a5f" />
              <ellipse cx="52" cy="53" rx="8" ry="13" fill="#1e3a5f" />
              <ellipse cx="80" cy="63" rx="6" ry="5" fill="#1e3a5f" />
            </svg>
            {/* Точки */}
            {mapDots.slice(0, 30).map((dot, i) => {
              const col = SEV_COLOR[dot.severity] || "#94a3b8";
              const sz = dot.severity === "critical" ? 8 : dot.severity === "high" ? 7 : 5;
              return (
                <div
                  key={i}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
                >
                  <div
                    className="rounded-full animate-pulse"
                    style={{
                      width: sz, height: sz,
                      background: col,
                      boxShadow: `0 0 ${sz + 4}px ${col}`,
                    }}
                  />
                </div>
              );
            })}
            {/* Легенда */}
            <div className="absolute bottom-2 left-3 flex gap-3">
              {[["#e94560", "Крит."], ["#f59e0b", "Выс."], ["#a78bfa", "Ср."], ["#94a3b8", "Низ."]].map(
                ([c, l]) => (
                  <div key={l} className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                    <span className="text-[9px] text-gray-500">{l}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Секция ИНЦИДЕНТЫ */}
      <div className="px-6 mb-6">
        <div
          className="rounded-2xl border border-blue-900/30 overflow-hidden"
          style={{ background: "#0d1225" }}
        >
          <div className="flex items-center gap-2 px-5 py-3 border-b border-blue-900/30">
            <Icon name="AlertTriangle" size={14} className="text-red-400" />
            <span className="text-white text-xs font-bold uppercase tracking-widest">Инциденты</span>
            <span className="ml-auto text-gray-600 text-[10px]">
              {incidents.length} записей
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-gray-600 text-sm animate-pulse">Загрузка...</div>
          ) : (
            <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
              {incidents.slice(0, 12).map((inc) => {
                const col = SEV_COLOR[inc.severity] || "#94a3b8";
                const date = inc.created_at?.slice(0, 10).split("-").reverse().join(".") || "—";
                return (
                  <div key={inc.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors cursor-default">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: col, boxShadow: `0 0 5px ${col}` }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-200 text-sm truncate">{inc.title}</div>
                      <div className="text-gray-500 text-[11px] mt-0.5">
                        {inc.country} · {date}
                      </div>
                    </div>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0"
                      style={{ background: col + "22", color: col }}
                    >
                      {inc.severity}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Секция ПОСЛЕДНИЕ ДАННЫЕ с вкладками */}
      <div className="px-6 mb-6">
        <div
          className="rounded-2xl border border-blue-900/30 overflow-hidden"
          style={{ background: "#0d1225" }}
        >
          <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-blue-900/30">
            <Icon name="Clock" size={14} className="text-purple-400" />
            <span className="text-white text-xs font-bold uppercase tracking-widest">Последние данные</span>
          </div>

          {/* Вкладки */}
          <div className="flex gap-1 px-4 py-3 border-b border-blue-900/20">
            {(["all", "open", "closed"] as const).map((tab) => {
              const labels = { all: "Все", open: "Открытые", closed: "Закрытые" };
              const active = recentTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setRecentTab(tab)}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all border"
                  style={
                    active
                      ? { background: "#6d28d9", borderColor: "#7c3aed88", color: "#fff" }
                      : { background: "transparent", borderColor: "#1e3a5f", color: "#6b7280" }
                  }
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          <div className="divide-y divide-white/5 max-h-56 overflow-y-auto">
            {recentFiltered.map((inc) => {
              const col = SEV_COLOR[inc.severity] || "#94a3b8";
              const date = inc.created_at?.slice(0, 10).split("-").reverse().join(".") || "—";
              return (
                <div key={inc.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: col }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-200 text-sm truncate">{inc.title}</div>
                    <div className="text-gray-500 text-[11px] mt-0.5">{inc.country} · {date}</div>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: col + "22", color: col }}
                  >
                    {inc.status === "resolved" ? "закрыт" : "открыт"}
                  </span>
                </div>
              );
            })}
            {recentFiltered.length === 0 && (
              <div className="py-6 text-center text-gray-600 text-sm">Нет данных</div>
            )}
          </div>
        </div>
      </div>

      {/* Стратегические объекты */}
      <div className="px-6">
        <div
          className="rounded-2xl border border-blue-900/30 overflow-hidden"
          style={{ background: "#0d1225" }}
        >
          <div className="flex items-center gap-2 px-5 py-3 border-b border-blue-900/30">
            <Icon name="Shield" size={14} className="text-yellow-400" />
            <span className="text-white text-xs font-bold uppercase tracking-widest">
              Стратегические объекты
            </span>
          </div>
          <div className="divide-y divide-white/5">
            {STRATEGIC_OBJECTS.map((obj) => (
              <div key={obj.name} className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    background: obj.color,
                    boxShadow: `0 0 6px ${obj.color}`,
                  }}
                />
                <span className="flex-1 text-gray-200 text-sm">{obj.name}</span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0"
                  style={{ background: obj.color + "22", color: obj.color }}
                >
                  {obj.status === "online"
                    ? "онлайн"
                    : obj.status === "warning"
                    ? "предупр."
                    : obj.status === "critical"
                    ? "критично"
                    : "офлайн"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 px-6 text-center">
        <div className="text-gray-700 text-[10px]">
          © 2026 · ЦПВОА · ECSU 2.0 · SYNERGON GLOBAL
        </div>
      </div>
    </div>
  );
};

export default EcsuCpvoa;
