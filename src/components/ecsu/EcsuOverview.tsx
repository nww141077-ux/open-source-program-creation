import Icon from "@/components/ui/icon";
import { useState, useEffect } from "react";

const INCIDENTS_URL = "https://functions.poehali.dev/df1d9dd9-c455-479d-807f-b25e000928ff";

const dotColor = { critical: "#e94560", high: "#f59e0b", medium: "#a78bfa", low: "#94a3b8" };
const dotSize  = { critical: 14, high: 12, medium: 10, low: 8 };

const COUNTRY_COORDS: Record<string, { x: number; y: number }> = {
  "Russia": { x: 68, y: 28 }, "Russian Federation": { x: 68, y: 28 },
  "China": { x: 75, y: 38 }, "United States": { x: 20, y: 38 }, "USA": { x: 20, y: 38 },
  "India": { x: 68, y: 48 }, "Brazil": { x: 35, y: 62 }, "Global": { x: 50, y: 50 },
  "Japan": { x: 82, y: 36 }, "Germany": { x: 50, y: 30 }, "France": { x: 48, y: 32 },
  "United Kingdom": { x: 46, y: 28 }, "Ukraine": { x: 55, y: 30 }, "Iran": { x: 60, y: 40 },
  "Syria": { x: 57, y: 40 }, "Pakistan": { x: 65, y: 42 }, "Turkey": { x: 56, y: 35 },
  "North Korea": { x: 80, y: 34 }, "South Korea": { x: 81, y: 36 },
  "Australia": { x: 80, y: 68 }, "Canada": { x: 22, y: 25 }, "Mexico": { x: 18, y: 45 },
  "Indonesia": { x: 78, y: 56 }, "Philippines": { x: 82, y: 50 }, "Thailand": { x: 76, y: 48 },
  "Spain": { x: 46, y: 36 }, "Italy": { x: 51, y: 35 }, "Poland": { x: 52, y: 29 },
  "Bangladesh": { x: 70, y: 46 }, "Peru": { x: 28, y: 60 }, "Kyrgyzstan": { x: 67, y: 36 },
  "Nigeria": { x: 50, y: 52 }, "Egypt": { x: 56, y: 43 }, "South Africa": { x: 55, y: 72 },
  "Papua New Guinea": { x: 84, y: 58 }, "Argentina": { x: 32, y: 72 },
};

function getCoords(country: string) {
  if (COUNTRY_COORDS[country]) return COUNTRY_COORDS[country];
  const upper = country.toUpperCase();
  if (upper.includes("INDONESIA") || upper.includes("SUMATRA")) return { x: 78, y: 56 };
  if (upper.includes("CHINA") || upper.includes("SICHUAN")) return { x: 76, y: 37 };
  if (upper.includes("JAPAN") || upper.includes("KURIL")) return { x: 83, y: 33 };
  if (upper.includes("RUSSIA") || upper.includes("KAMCHATKA")) return { x: 78, y: 27 };
  if (upper.includes("INDIA") || upper.includes("NICOBAR")) return { x: 70, y: 50 };
  if (upper.includes("PHILIPPINES") || upper.includes("MINDANAO")) return { x: 82, y: 50 };
  if (upper.includes("NEW ZEALAND") || upper.includes("KERMADEC")) return { x: 87, y: 70 };
  if (upper.includes("ALASKA") || upper.includes("ALEUTIAN")) return { x: 12, y: 25 };
  if (upper.includes("CHILE") || upper.includes("PERU")) return { x: 27, y: 62 };
  if (upper.includes("MEXICO") || upper.includes("OAXACA")) return { x: 18, y: 46 };
  if (upper.includes("AFRICA")) return { x: 52, y: 58 };
  if (upper.includes("ATLANTIC")) return { x: 42, y: 45 };
  if (upper.includes("PACIFIC")) return { x: 15, y: 52 };
  if (upper.includes("INDIAN")) return { x: 66, y: 58 };
  return { x: 40 + Math.random() * 30, y: 35 + Math.random() * 25 };
}

interface Stats {
  total: number; critical: number; high: number;
  medium: number; low: number; resolved: number; active: number; countries: number;
}
interface MapDot { country: string; severity: string; x: number; y: number; count: number; }
interface RecentInc { title: string; country: string; severity: string; created_at: string; }

const WEEK_BARS = [
  { day: "Пн", value: 39 }, { day: "Вт", value: 8 },
  { day: "Ср", value: 24 }, { day: "Чт", value: 16 },
  { day: "Пт", value: 9  }, { day: "Сб", value: 34 },
  { day: "Вс", value: 34 },
];

const EcsuOverview = () => {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [mapDots, setMapDots] = useState<MapDot[]>([]);
  const [recent, setRecent]   = useState<RecentInc[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapMode, setMapMode] = useState<"flat" | "heat">("flat");

  useEffect(() => {
    fetch(`${INCIDENTS_URL}?action=stats`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});

    fetch(`${INCIDENTS_URL}?action=list&limit=200`)
      .then(r => r.json())
      .then(data => {
        const incs = data.incidents || [];
        const byCountry: Record<string, { severity: string; count: number }> = {};
        incs.forEach((inc: RecentInc & { severity: string }) => {
          const key = inc.country;
          if (!byCountry[key]) byCountry[key] = { severity: inc.severity, count: 0 };
          byCountry[key].count++;
          const order = ["critical","high","medium","low"];
          if (order.indexOf(inc.severity) < order.indexOf(byCountry[key].severity))
            byCountry[key].severity = inc.severity;
        });
        setMapDots(Object.entries(byCountry).map(([country, info]) => ({
          country, severity: info.severity, count: info.count, ...getCoords(country),
        })));
        setRecent(incs.slice(0, 8).map((inc: RecentInc & { severity: string }) => ({
          title: inc.title, country: inc.country,
          severity: inc.severity, created_at: inc.created_at,
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const maxBar = Math.max(...WEEK_BARS.map(b => b.value));
  const activeCount = mapDots.filter(d => d.severity === "critical" || d.severity === "high").length;

  const statsCards = [
    { label: "Всего инцидентов", value: stats ? stats.total.toString() : "...", delta: stats ? `+${stats.critical}%` : "+12%", icon: "AlertTriangle", color: "#e94560" },
    { label: "Решено",           value: stats ? stats.resolved.toString() : "...", delta: stats ? `+${Math.round(stats.resolved / (stats.total || 1) * 10)}%` : "+8%", icon: "CheckCircle", color: "#00c896" },
    { label: "Активных",         value: stats ? stats.active.toString() : "...", delta: stats ? `-${stats.high}%` : "-3%", icon: "Activity", color: "#f59e0b" },
    { label: "Стран-участниц",   value: stats ? stats.countries.toString() : "...", delta: "+2", icon: "Globe", color: "#a78bfa" },
  ];

  return (
    <div className="flex flex-col min-h-full pb-6">

      {/* Шапка */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div>
          <div className="text-gray-500 text-[10px] uppercase tracking-widest">Апрель 2026 · Все регионы</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-xs font-mono">LIVE</span>
        </div>
      </div>

      {/* Карточки 2×2 */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-2 gap-3">
          {statsCards.map((s) => (
            <div key={s.label}
              className="bg-[#0d1225] border border-blue-900/30 rounded-2xl p-4 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: s.color + "22" }}>
                  <Icon name={s.icon} size={16} style={{ color: s.color }} />
                </div>
                <span className="text-xs font-bold" style={{ color: s.color }}>{s.delta}</span>
              </div>
              <div className="text-3xl font-black leading-tight" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-gray-500 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Карта инцидентов */}
      <div className="px-4 mb-4">
        <div className="bg-[#0d1225] border border-blue-900/30 rounded-2xl overflow-hidden">
          {/* Заголовок карты */}
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon name="Map" size={14} className="text-purple-400" />
                <span className="text-white font-bold text-sm tracking-wide">КАРТА ИНЦИДЕНТОВ</span>
                <span className="bg-purple-900/40 text-purple-400 text-[10px] px-2 py-0.5 rounded-full">
                  {mapDots.length} объектов
                </span>
              </div>
            </div>
            {/* Переключатели */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMapMode("flat")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={mapMode === "flat"
                  ? { background: "#6d28d9", color: "#fff" }
                  : { background: "#1a1f35", color: "#6b7280" }}
              >
                <Icon name="Map" size={11} />
                Плоская
              </button>
              <button
                onClick={() => setMapMode("heat")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={mapMode === "heat"
                  ? { background: "#6d28d9", color: "#fff" }
                  : { background: "#1a1f35", color: "#6b7280" }}
              >
                <Icon name="Flame" size={11} />
                Тепловая
              </button>
              {/* Легенда */}
              <div className="flex items-center gap-2 ml-auto">
                {[["#e94560","Крит."],["#f59e0b","Выс."],["#a78bfa","Ср."],["#94a3b8","Низ."]].map(([c,l]) => (
                  <div key={l} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                    <span className="text-[9px] text-gray-500">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Сама карта */}
          <div className="relative mx-4 mb-3 bg-[#060d1f] rounded-xl overflow-hidden" style={{ height: 200 }}>
            {/* Сетка */}
            <svg className="absolute inset-0 w-full h-full opacity-10">
              {[...Array(8)].map((_, i) => (
                <line key={`h${i}`} x1="0" y1={`${i*14}%`} x2="100%" y2={`${i*14}%`} stroke="#60a5fa" strokeWidth="0.5" />
              ))}
              {[...Array(10)].map((_, i) => (
                <line key={`v${i}`} x1={`${i*11}%`} y1="0" x2={`${i*11}%`} y2="100%" stroke="#60a5fa" strokeWidth="0.5" />
              ))}
            </svg>

            {/* Континенты (упрощённые блоки) */}
            <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 80">
              {/* Евразия */}
              <ellipse cx="65" cy="32" rx="28" ry="14" fill="#1e3a5f" />
              {/* Северная Америка */}
              <ellipse cx="20" cy="30" rx="13" ry="12" fill="#1e3a5f" />
              {/* Южная Америка */}
              <ellipse cx="30" cy="60" rx="8" ry="13" fill="#1e3a5f" />
              {/* Африка */}
              <ellipse cx="52" cy="55" rx="9" ry="14" fill="#1e3a5f" />
              {/* Австралия */}
              <ellipse cx="80" cy="65" rx="7" ry="6" fill="#1e3a5f" />
            </svg>

            {/* Точки */}
            {mapDots.slice(0, 25).map((dot, i) => {
              const color = dotColor[dot.severity as keyof typeof dotColor] || "#94a3b8";
              const size = mapMode === "heat"
                ? (dotSize[dot.severity as keyof typeof dotSize] || 8) * 1.8
                : (dotSize[dot.severity as keyof typeof dotSize] || 8);
              const opacity = mapMode === "heat" ? 0.4 : 1;
              return (
                <div key={i}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${dot.x}%`, top: `${dot.y}%` }}>
                  <div
                    className="rounded-full animate-pulse"
                    style={{ width: size, height: size, background: color, boxShadow: `0 0 ${size}px ${color}`, opacity }}
                  />
                </div>
              );
            })}

            {/* Подсказка */}
            <div className="absolute bottom-2 left-3 text-gray-600 text-[9px]">
              Нажми на точку → детали и видео
            </div>
            <div className="absolute bottom-2 right-3 text-gray-600 text-[9px]">
              {activeCount} активных · пульсируют
            </div>
          </div>
        </div>
      </div>

      {/* Инциденты за неделю */}
      <div className="px-4 mb-4">
        <div className="bg-[#0d1225] border border-blue-900/30 rounded-2xl p-4">
          <div className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-3">
            Инциденты за неделю
          </div>
          <div className="flex items-end gap-1.5" style={{ height: 80 }}>
            {WEEK_BARS.map((b) => {
              const h = Math.max(6, (b.value / maxBar) * 70);
              return (
                <div key={b.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[9px] text-gray-500">{b.value}</div>
                  <div className="w-full rounded-t-sm relative overflow-hidden"
                    style={{ height: h, background: "linear-gradient(180deg,#3b82f6,#1e3a5f)" }}>
                    <div className="absolute inset-0"
                      style={{ backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(96,165,250,0.08) 3px,rgba(96,165,250,0.08) 4px)" }}
                    />
                  </div>
                  <div className="text-gray-600 text-[9px]">{b.day}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Список инцидентов */}
      <div className="px-4">
        <div className="bg-[#0d1225] border border-blue-900/30 rounded-2xl p-4">
          <div className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
            <Icon name="AlertTriangle" size={12} className="text-blue-400" />
            Последние инциденты
          </div>
          <div className="space-y-2">
            {loading ? (
              <div className="text-gray-600 text-xs animate-pulse py-4 text-center">Загрузка...</div>
            ) : recent.map((e, i) => {
              const color = dotColor[e.severity as keyof typeof dotColor] || "#94a3b8";
              return (
                <div key={i}
                  className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <span className="w-2 h-2 rounded-full shrink-0 mt-0.5"
                    style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-300 text-xs truncate">{e.title}</div>
                    <div className="text-gray-600 text-[10px] mt-0.5">{e.country} · {e.created_at?.slice(0,10).split("-").reverse().join(".")}</div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold shrink-0"
                    style={{ background: color + "22", color }}>
                    Активен
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Футер */}
      <div className="mt-6 px-4 text-center">
        <div className="text-gray-700 text-[9px]">© 2026 · ECSU 2.0 · SYNERGON GLOBAL · Николаев В.В.</div>
      </div>
    </div>
  );
};

export default EcsuOverview;
