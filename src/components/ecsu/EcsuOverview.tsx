import Icon from "@/components/ui/icon";
import { useState, useEffect } from "react";

const INCIDENTS_URL = "https://functions.poehali.dev/df1d9dd9-c455-479d-807f-b25e000928ff";

const dotColor = { critical: "#e94560", high: "#f59e0b", medium: "#a78bfa", low: "#94a3b8" };
const dotSize = { critical: 14, high: 12, medium: 10, low: 8 };

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
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  resolved: number;
  active: number;
  countries: number;
}

interface MapDot {
  country: string;
  severity: string;
  x: number;
  y: number;
  count: number;
}

interface RecentInc {
  title: string;
  country: string;
  severity: string;
  created_at: string;
}

const EcsuOverview = () => {
  const [mapMode, setMapMode] = useState<"flat" | "globe" | "heat">("flat");
  const [stats, setStats] = useState<Stats | null>(null);
  const [mapDots, setMapDots] = useState<MapDot[]>([]);
  const [recent, setRecent] = useState<RecentInc[]>([]);
  const [loading, setLoading] = useState(true);

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
          if (!byCountry[key]) {
            byCountry[key] = { severity: inc.severity, count: 0 };
          }
          byCountry[key].count++;
          const order = ["critical","high","medium","low"];
          if (order.indexOf(inc.severity) < order.indexOf(byCountry[key].severity)) {
            byCountry[key].severity = inc.severity;
          }
        });
        const dots: MapDot[] = Object.entries(byCountry).map(([country, info]) => ({
          country,
          severity: info.severity,
          count: info.count,
          ...getCoords(country),
        }));
        setMapDots(dots);
        setRecent(incs.slice(0, 5).map((inc: RecentInc & { severity: string }) => ({
          title: inc.title,
          country: inc.country,
          severity: inc.severity,
          created_at: inc.created_at,
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statsCards = stats ? [
    { label: "Всего инцидентов", value: stats.total.toString(), delta: `+${stats.critical} крит.`, icon: "AlertTriangle", color: "#e94560" },
    { label: "Решено", value: stats.resolved.toString(), delta: `${Math.round(stats.resolved/stats.total*100)}%`, icon: "CheckCircle", color: "#00c896" },
    { label: "Активных", value: stats.active.toString(), delta: `${stats.high} высоких`, icon: "Activity", color: "#f59e0b" },
    { label: "Стран охвачено", value: stats.countries.toString(), delta: "международные", icon: "Globe", color: "#60a5fa" },
  ] : [
    { label: "Всего инцидентов", value: "...", delta: "", icon: "AlertTriangle", color: "#e94560" },
    { label: "Решено", value: "...", delta: "", icon: "CheckCircle", color: "#00c896" },
    { label: "Активных", value: "...", delta: "", icon: "Activity", color: "#f59e0b" },
    { label: "Стран охвачено", value: "...", delta: "", icon: "Globe", color: "#60a5fa" },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">ОБЗОР СИСТЕМЫ</h2>
          <p className="text-gray-500 text-sm">Международные данные · Реальная база ЕЦСУ</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-xs">LIVE</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {statsCards.map((s) => (
          <div key={s.label} className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Icon name={s.icon} size={18} style={{ color: s.color }} />
              <span className="text-xs font-bold" style={{ color: s.color }}>{s.delta}</span>
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-gray-500 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="Map" size={16} className="text-blue-400" />
            <span className="text-white font-bold text-sm">КАРТА ИНЦИДЕНТОВ</span>
            <span className="bg-blue-900/40 text-blue-400 text-xs px-2 py-0.5 rounded-full">
              {loading ? "..." : `${mapDots.length} стран`}
            </span>
          </div>
          <div className="flex gap-1">
            {(["flat", "globe", "heat"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMapMode(m)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  mapMode === m ? "bg-blue-600 text-white" : "text-gray-500 hover:text-white"
                }`}
              >
                {m === "flat" ? "Плоская" : m === "globe" ? "3D Глобус" : "Тепловая"}
              </button>
            ))}
            <div className="flex items-center gap-2 ml-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#e94560] inline-block" />Крит.</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f59e0b] inline-block" />Выс.</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#a78bfa] inline-block" />Ср.</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#94a3b8] inline-block" />Мин.</span>
            </div>
          </div>
        </div>

        <div className="relative bg-[#060d1f] rounded-xl overflow-hidden" style={{ height: 320 }}>

          {/* Flat mode */}
          {mapMode === "flat" && (
            <>
              <svg className="absolute inset-0 w-full h-full opacity-10">
                {[...Array(10)].map((_, i) => (
                  <line key={`h${i}`} x1="0" y1={`${i * 10}%`} x2="100%" y2={`${i * 10}%`} stroke="#60a5fa" strokeWidth="0.5" />
                ))}
                {[...Array(10)].map((_, i) => (
                  <line key={`v${i}`} x1={`${i * 10}%`} y1="0" x2={`${i * 10}%`} y2="100%" stroke="#60a5fa" strokeWidth="0.5" />
                ))}
              </svg>
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm animate-pulse">Загрузка карты...</div>
              ) : (
                mapDots.map((dot, i) => {
                  const color = dotColor[dot.severity as keyof typeof dotColor] || "#94a3b8";
                  const size = dotSize[dot.severity as keyof typeof dotSize] || 8;
                  return (
                    <div
                      key={i}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                      style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
                    >
                      <div
                        className="rounded-full animate-pulse"
                        style={{ width: size, height: size, background: color, boxShadow: `0 0 8px ${color}` }}
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-[#0d1225] border border-blue-900/50 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {dot.country} · {dot.count} инц.
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* Globe mode */}
          {mapMode === "globe" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <svg width="240" height="240" viewBox="0 0 240 240">
                  <circle cx="120" cy="120" r="100" fill="#0a1628" stroke="#1e3a5f" strokeWidth="1.5" />
                  <ellipse cx="120" cy="120" rx="100" ry="40" fill="none" stroke="#1e3a5f" strokeWidth="0.8" opacity="0.5" />
                  <ellipse cx="120" cy="120" rx="60" ry="100" fill="none" stroke="#1e3a5f" strokeWidth="0.8" opacity="0.5" />
                  <line x1="20" y1="120" x2="220" y2="120" stroke="#1e3a5f" strokeWidth="0.8" opacity="0.5" />
                  <line x1="120" y1="20" x2="120" y2="220" stroke="#1e3a5f" strokeWidth="0.8" opacity="0.5" />
                  {mapDots.map((dot, i) => {
                    const angle = (dot.x / 100) * Math.PI * 1.6 - 0.8;
                    const lat = (dot.y / 100) * Math.PI - Math.PI / 2;
                    const cx = 120 + Math.cos(lat) * Math.sin(angle) * 95;
                    const cy = 120 - Math.sin(lat) * 95;
                    const color = dotColor[dot.severity as keyof typeof dotColor] || "#94a3b8";
                    const r = (dotSize[dot.severity as keyof typeof dotSize] || 8) / 2;
                    return (
                      <g key={i}>
                        <circle cx={cx} cy={cy} r={r} fill={color} opacity="0.9" />
                        <circle cx={cx} cy={cy} r={r * 2} fill={color} opacity="0.15" />
                      </g>
                    );
                  })}
                  <circle cx="120" cy="120" r="100" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.3" />
                </svg>
                <div className="absolute top-1 left-1/2 -translate-x-1/2 text-blue-400 text-xs font-mono opacity-60">3D ГЛОБУС · ECSU</div>
              </div>
            </div>
          )}

          {/* Heat mode */}
          {mapMode === "heat" && (
            <>
              <svg className="absolute inset-0 w-full h-full">
                <defs>
                  {mapDots.map((dot, i) => (
                    <radialGradient key={`g${i}`} id={`hg${i}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={dotColor[dot.severity as keyof typeof dotColor] || "#94a3b8"} stopOpacity="0.55" />
                      <stop offset="100%" stopColor={dotColor[dot.severity as keyof typeof dotColor] || "#94a3b8"} stopOpacity="0" />
                    </radialGradient>
                  ))}
                </defs>
                {mapDots.map((dot, i) => {
                  const r = dot.severity === "critical" ? 8 : dot.severity === "high" ? 6 : dot.severity === "medium" ? 5 : 3;
                  return (
                    <ellipse key={`e${i}`} cx={`${dot.x}%`} cy={`${dot.y}%`} rx={`${r}%`} ry={`${r * 0.6}%`} fill={`url(#hg${i})`} />
                  );
                })}
              </svg>
              <div className="absolute top-3 left-3 text-blue-400 text-xs font-mono opacity-60">ТЕПЛОВАЯ КАРТА · УГРОЗЫ</div>
              {mapDots.map((dot, i) => (
                <div key={i} className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                  style={{ left: `${dot.x}%`, top: `${dot.y}%` }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor[dot.severity as keyof typeof dotColor] || "#94a3b8" }} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-[#0d1225] border border-blue-900/50 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {dot.country} · {dot.count}
                  </div>
                </div>
              ))}
            </>
          )}

          <div className="absolute bottom-3 right-3 text-blue-900/50 text-xs font-mono">ECSU 2.0 · DALAN</div>
        </div>
      </div>

      {/* Recent */}
      <div className="mt-4 bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
        <div className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <Icon name="Activity" size={15} className="text-blue-400" />
          Последние события
        </div>
        <div className="space-y-2">
          {loading ? (
            <div className="text-gray-600 text-xs animate-pulse">Загрузка...</div>
          ) : recent.map((e, i) => {
            const color = dotColor[e.severity as keyof typeof dotColor] || "#94a3b8";
            return (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className="text-gray-600 w-20 shrink-0">{e.created_at?.slice(0, 10)}</span>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-gray-300 truncate">{e.title}</span>
                <span className="text-gray-600 shrink-0 ml-auto">{e.country}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EcsuOverview;
