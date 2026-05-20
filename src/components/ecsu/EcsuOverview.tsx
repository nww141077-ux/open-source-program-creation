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

// Дни недели для гистограммы — фиксированные данные на 17 апреля
const WEEK_BARS = [
  { day: "Пн", value: 39, label: "39" },
  { day: "Вт", value: 8,  label: "8" },
  { day: "Ср", value: 24, label: "24" },
  { day: "Чт", value: 16, label: "16" },
  { day: "Пт", value: 9,  label: "9" },
  { day: "Сб", value: 34, label: "34" },
  { day: "Вс", value: 34, label: "34" },
];

// Типы инцидентов — фиксированные данные на 17 апреля
const INCIDENT_TYPES = [
  { label: "Экология", count: 45, pct: 45, color: "#34d399" },
  { label: "Вода",     count: 25, pct: 25, color: "#60a5fa" },
  { label: "Воздух",   count: 19, pct: 19, color: "#fbbf24" },
  { label: "Кибер",    count: 6,  pct: 6,  color: "#e94560" },
];

const EcsuOverview = () => {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [mapDots, setMapDots] = useState<MapDot[]>([]);
  const [recent, setRecent]   = useState<RecentInc[]>([]);
  const [loading, setLoading] = useState(true);
  const [rightTab, setRightTab] = useState<"types" | "map">("types");

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
        setRecent(incs.slice(0, 6).map((inc: RecentInc & { severity: string }) => ({
          title: inc.title, country: inc.country,
          severity: inc.severity, created_at: inc.created_at,
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Статкарточки — по скриншоту 17 апреля
  const statsCards = [
    {
      label: "Всего инцидентов",
      value: stats ? stats.total.toString() : "...",
      delta: stats ? `+${stats.critical}%` : "+12%",
      icon: "AlertTriangle", color: "#e94560",
      show: true,
    },
    {
      label: "Решено",
      value: stats ? stats.resolved.toString() : "893",
      delta: stats ? `+${Math.round(stats.resolved / (stats.total || 1) * 10)}%` : "+12%",
      icon: "CheckCircle", color: "#00c896",
      show: true,
    },
    {
      label: "Активных",
      value: stats ? stats.active.toString() : "241",
      delta: stats ? `+${stats.high}%` : "+6%",
      icon: "Activity", color: "#f59e0b",
      show: true,
    },
    {
      label: "Стран-участниц",
      value: stats ? stats.countries.toString() : "47",
      delta: "+2",
      icon: "Globe", color: "#60a5fa",
      show: true,
    },
  ];

  const maxBar = Math.max(...WEEK_BARS.map(b => b.value));

  return (
    <div className="flex flex-col min-h-full">
      {/* ═══ Шапка ═══ */}
      <div className="px-6 pt-4 pb-2 flex items-center justify-between">
        <div>
          <div className="text-gray-500 text-xs uppercase tracking-widest">СИСТЕМЫ</div>
          <div className="text-gray-600 text-xs">регионы</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-xs font-mono">LIVE</span>
        </div>
      </div>

      {/* ═══ Стат-карточки (4 штуки как на скриншоте) ═══ */}
      <div className="px-6 mb-4">
        <div className="grid grid-cols-4 gap-3">
          {statsCards.map((s) => (
            <div key={s.label}
              className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4 relative overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <Icon name={s.icon} size={16} style={{ color: s.color }} />
                <span className="text-xs font-bold" style={{ color: s.color }}>{s.delta}</span>
              </div>
              <div className="text-3xl font-black text-white leading-tight mt-1"
                style={{ color: s.color }}>{s.value}</div>
              <div className="text-gray-500 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Нижняя двухколонная зона ═══ */}
      <div className="flex gap-4 px-6 flex-1 pb-0">

        {/* Левая колонка: гистограмма + инциденты */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Гистограмма — «За неделю» */}
          <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
            <div className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-3">
              За неделю
            </div>
            <div className="flex items-end gap-2" style={{ height: 120 }}>
              {WEEK_BARS.map((b) => {
                const h = Math.max(8, (b.value / maxBar) * 100);
                return (
                  <div key={b.day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-gray-400 text-[10px] font-mono">{b.label}</div>
                    <div
                      className="w-full rounded-t-md relative overflow-hidden"
                      style={{
                        height: h,
                        background: "linear-gradient(180deg, #60a5fa55 0%, #a78bfa44 50%, #e9456033 100%)",
                        border: "1px solid #60a5fa33",
                      }}
                    >
                      {/* Штриховка */}
                      <div className="absolute inset-0"
                        style={{
                          backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(96,165,250,0.08) 3px, rgba(96,165,250,0.08) 4px)",
                        }}
                      />
                    </div>
                    <div className="text-gray-600 text-[9px]">{b.day}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Список инцидентов */}
          <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4 flex-1">
            <div className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-3 flex items-center gap-2">
              <Icon name="AlertTriangle" size={12} className="text-blue-400" />
              Не инциденты
            </div>
            <div className="space-y-2">
              {loading ? (
                <div className="text-gray-600 text-xs animate-pulse">Загрузка...</div>
              ) : recent.map((e, i) => {
                const color = dotColor[e.severity as keyof typeof dotColor] || "#94a3b8";
                return (
                  <div key={i}
                    className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-gray-600 text-xs font-mono w-16 shrink-0">
                      {e.created_at?.slice(0, 10).split("-").reverse().join(".")}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
                    <span className="text-gray-300 text-xs truncate flex-1">{e.title}</span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded font-semibold shrink-0"
                      style={{ background: color + "22", color }}
                    >
                      Активен
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Правая колонка: По типам + карта */}
        <div className="w-72 shrink-0 flex flex-col gap-4">

          {/* По типам */}
          <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-white font-bold text-sm">По типам</div>
              <div className="flex gap-1">
                {(["types", "map"] as const).map(t => (
                  <button key={t}
                    onClick={() => setRightTab(t)}
                    className="text-[10px] px-2 py-0.5 rounded transition-all"
                    style={rightTab === t
                      ? { background: "#1e3a5f", color: "#60a5fa" }
                      : { color: "#4b5563" }
                    }
                  >
                    {t === "types" ? "Типы" : "Карта"}
                  </button>
                ))}
              </div>
            </div>

            {rightTab === "types" && (
              <div className="space-y-3">
                {INCIDENT_TYPES.map(t => (
                  <div key={t.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-400 text-xs">{t.label}</span>
                      <span className="text-xs font-bold" style={{ color: t.color }}>
                        {t.count} ({t.pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${t.pct}%`, background: t.color }}
                      />
                    </div>
                  </div>
                ))}
                <button className="text-gray-600 text-xs mt-1 hover:text-gray-400 transition-colors">
                  Все →
                </button>
              </div>
            )}

            {rightTab === "map" && (
              <div className="relative bg-[#060d1f] rounded-lg overflow-hidden" style={{ height: 160 }}>
                <svg className="absolute inset-0 w-full h-full opacity-10">
                  {[...Array(6)].map((_, i) => (
                    <line key={`h${i}`} x1="0" y1={`${i*20}%`} x2="100%" y2={`${i*20}%`} stroke="#60a5fa" strokeWidth="0.5" />
                  ))}
                  {[...Array(6)].map((_, i) => (
                    <line key={`v${i}`} x1={`${i*20}%`} y1="0" x2={`${i*20}%`} y2="100%" stroke="#60a5fa" strokeWidth="0.5" />
                  ))}
                </svg>
                {mapDots.slice(0, 20).map((dot, i) => {
                  const color = dotColor[dot.severity as keyof typeof dotColor] || "#94a3b8";
                  const size = (dotSize[dot.severity as keyof typeof dotSize] || 8) * 0.7;
                  return (
                    <div key={i}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${dot.x}%`, top: `${dot.y}%` }}>
                      <div className="rounded-full animate-pulse"
                        style={{ width: size, height: size, background: color, boxShadow: `0 0 6px ${color}` }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Список активных инцидентов справа (как на скриншоте) */}
          <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4 flex-1">
            <div className="space-y-1.5">
              {loading ? (
                <div className="text-gray-600 text-xs animate-pulse">Загрузка...</div>
              ) : recent.slice(0, 6).map((e, i) => {
                const color = dotColor[e.severity as keyof typeof dotColor] || "#94a3b8";
                return (
                  <div key={i}
                    className="flex items-center justify-between py-1 border-b border-white/5 last:border-0 gap-2">
                    <span className="text-gray-400 text-[10px] truncate flex-1">{e.country}</span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded font-semibold shrink-0"
                      style={{ background: color + "22", color }}
                    >
                      Активен
                    </span>
                    <Icon name="ChevronRight" size={10} className="text-gray-700 shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Футер — дата 13 апреля 2026 как на скриншоте ═══ */}
      <footer className="mt-6 px-6 py-4 border-t border-blue-900/20 text-center">
        <div className="text-gray-700 text-[10px]">
          © 13 апреля 2026 · ECSU 2.0 · Все права защищены
        </div>
        <div className="text-gray-800 text-[9px] mt-0.5">
          Платформа разработана группой компаний Николаева. Все операции фиксируются.
          Несанкционированный доступ запрещён.
        </div>
        <div className="text-gray-800 text-[9px] mt-0.5">
          Программа TahkaOS · Фоновая программа ECSU
        </div>
      </footer>
    </div>
  );
};

export default EcsuOverview;
