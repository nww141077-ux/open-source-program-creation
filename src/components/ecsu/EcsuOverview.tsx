import Icon from "@/components/ui/icon";
import { useState, useEffect, useRef } from "react";

const INCIDENTS_URL =
  "https://functions.poehali.dev/df1d9dd9-c455-479d-807f-b25e000928ff";

const SEV_COLOR: Record<string, string> = {
  critical: "#e94560",
  high: "#f59e0b",
  medium: "#a78bfa",
  low: "#94a3b8",
};

/* ────────────────────────────────────────────────
   Типы
──────────────────────────────────────────────── */
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

interface GlobeDot {
  lat: number; // radians
  lon: number; // radians
  severity: string;
  count: number;
}

interface RecentInc {
  title: string;
  country: string;
  severity: string;
  created_at: string;
}

/* ────────────────────────────────────────────────
   Координаты стран (широта, долгота в градусах)
──────────────────────────────────────────────── */
const COUNTRY_LL: Record<string, [number, number]> = {
  Russia: [60, 90],
  "Russian Federation": [60, 90],
  China: [35, 105],
  "United States": [40, -100],
  USA: [40, -100],
  India: [22, 80],
  Brazil: [-10, -55],
  Global: [20, 0],
  Japan: [36, 138],
  Germany: [51, 10],
  France: [46, 2],
  "United Kingdom": [54, -2],
  Ukraine: [49, 32],
  Iran: [33, 53],
  Syria: [35, 38],
  Pakistan: [30, 70],
  Turkey: [39, 35],
  "North Korea": [40, 127],
  "South Korea": [37, 128],
  Australia: [-27, 134],
  Canada: [56, -96],
  Mexico: [24, -102],
  Indonesia: [-5, 120],
  Philippines: [13, 122],
  Thailand: [15, 101],
  Spain: [40, -4],
  Italy: [43, 12],
  Poland: [52, 20],
  Bangladesh: [24, 90],
  Peru: [-10, -76],
  Kyrgyzstan: [42, 75],
  Nigeria: [10, 8],
  Egypt: [27, 30],
  "South Africa": [-29, 25],
  "Papua New Guinea": [-6, 147],
  Argentina: [-38, -65],
};

function getLatLon(country: string): [number, number] {
  if (COUNTRY_LL[country]) return COUNTRY_LL[country];
  const u = country.toUpperCase();
  if (u.includes("INDONESIA") || u.includes("SUMATRA")) return [-5, 106];
  if (u.includes("CHINA") || u.includes("SICHUAN")) return [30, 104];
  if (u.includes("JAPAN") || u.includes("KURIL")) return [44, 146];
  if (u.includes("RUSSIA") || u.includes("KAMCHATKA")) return [54, 160];
  if (u.includes("INDIA") || u.includes("NICOBAR")) return [8, 93];
  if (u.includes("PHILIPPINES") || u.includes("MINDANAO")) return [8, 125];
  if (u.includes("NEW ZEALAND") || u.includes("KERMADEC")) return [-35, 176];
  if (u.includes("ALASKA") || u.includes("ALEUTIAN")) return [52, -175];
  if (u.includes("CHILE") || u.includes("PERU")) return [-20, -70];
  if (u.includes("MEXICO") || u.includes("OAXACA")) return [17, -96];
  if (u.includes("AFRICA")) return [0, 20];
  if (u.includes("ATLANTIC")) return [20, -40];
  if (u.includes("PACIFIC")) return [5, -150];
  if (u.includes("INDIAN")) return [-10, 75];
  return [20 + Math.random() * 30, -60 + Math.random() * 120];
}

/* ────────────────────────────────────────────────
   3D-глобус
──────────────────────────────────────────────── */
const GLOBE_R = 130;
const GLOBE_CX = 200;
const GLOBE_CY = 200;
const W = 400;
const H = 400;

// Генерируем сетку
function gridLines() {
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  // Горизонтальные (широтные) — 9 линий
  for (let lat = -80; lat <= 80; lat += 20) {
    const pts: [number, number][] = [];
    for (let lon = -180; lon <= 180; lon += 5) {
      const x =
        GLOBE_CX + GLOBE_R * Math.cos((lat * Math.PI) / 180) * Math.sin((lon * Math.PI) / 180);
      const y = GLOBE_CY - GLOBE_R * Math.sin((lat * Math.PI) / 180);
      pts.push([x, y]);
    }
    for (let i = 0; i < pts.length - 1; i++) {
      lines.push({ x1: pts[i][0], y1: pts[i][1], x2: pts[i + 1][0], y2: pts[i + 1][1] });
    }
  }
  return lines;
}

interface GlobeProps {
  dots: GlobeDot[];
}

const Globe = ({ dots }: GlobeProps) => {
  const canvasRef = useRef<SVGGElement>(null);
  const angleRef = useRef(0);
  const [angle, setAngle] = useState(0);
  const dragging = useRef(false);
  const lastX = useRef(0);

  useEffect(() => {
    let rafId: number;
    const tick = () => {
      if (!dragging.current) {
        angleRef.current += 0.004;
      }
      setAngle(angleRef.current);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    lastX.current = e.clientX;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastX.current;
    angleRef.current += dx * 0.008;
    lastX.current = e.clientX;
  };
  const onMouseUp = () => {
    dragging.current = false;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    dragging.current = true;
    lastX.current = e.touches[0].clientX;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    const dx = e.touches[0].clientX - lastX.current;
    angleRef.current += dx * 0.008;
    lastX.current = e.touches[0].clientX;
  };
  const onTouchEnd = () => {
    dragging.current = false;
  };

  // Проецируем точки
  const projected = dots.map((dot) => {
    const lon = dot.lon + angle;
    const cosLat = Math.cos(dot.lat);
    const z = cosLat * Math.cos(lon); // глубина
    const x = GLOBE_CX + GLOBE_R * cosLat * Math.sin(lon);
    const y = GLOBE_CY - GLOBE_R * Math.sin(dot.lat);
    return { ...dot, px: x, py: y, z, visible: z > -0.1 };
  });

  // Сетка — меридианы (вертикальные) с учётом угла
  const meridianLines: { x1: number; y1: number; x2: number; y2: number; z: number }[] = [];
  for (let lon = -180; lon < 180; lon += 30) {
    const pts: [number, number, number][] = [];
    for (let lat2 = -85; lat2 <= 85; lat2 += 5) {
      const l = (lon * Math.PI) / 180 + angle;
      const la = (lat2 * Math.PI) / 180;
      const z = Math.cos(la) * Math.cos(l);
      const x = GLOBE_CX + GLOBE_R * Math.cos(la) * Math.sin(l);
      const y = GLOBE_CY - GLOBE_R * Math.sin(la);
      pts.push([x, y, z]);
    }
    for (let i = 0; i < pts.length - 1; i++) {
      meridianLines.push({
        x1: pts[i][0], y1: pts[i][1],
        x2: pts[i + 1][0], y2: pts[i + 1][1],
        z: (pts[i][2] + pts[i + 1][2]) / 2,
      });
    }
  }

  // Широтные линии
  const latLines: { x1: number; y1: number; x2: number; y2: number; z: number }[] = [];
  for (let lat2 = -70; lat2 <= 70; lat2 += 20) {
    const la = (lat2 * Math.PI) / 180;
    for (let lon = -180; lon < 180; lon += 5) {
      const l1 = (lon * Math.PI) / 180 + angle;
      const l2 = ((lon + 5) * Math.PI) / 180 + angle;
      const z1 = Math.cos(la) * Math.cos(l1);
      const z2 = Math.cos(la) * Math.cos(l2);
      latLines.push({
        x1: GLOBE_CX + GLOBE_R * Math.cos(la) * Math.sin(l1),
        y1: GLOBE_CY - GLOBE_R * Math.sin(la),
        x2: GLOBE_CX + GLOBE_R * Math.cos(la) * Math.sin(l2),
        y2: GLOBE_CY - GLOBE_R * Math.sin(la),
        z: (z1 + z2) / 2,
      });
    }
  }

  return (
    <div className="flex flex-col items-center select-none">
      <svg
        width={W}
        height={H}
        style={{ cursor: "grab", maxWidth: "100%" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <defs>
          <radialGradient id="globeGrad" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#1e4080" />
            <stop offset="60%" stopColor="#0a1f4e" />
            <stop offset="100%" stopColor="#060d1f" />
          </radialGradient>
          <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="transparent" />
            <stop offset="100%" stopColor="#1a3a6e88" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="globeClip">
            <circle cx={GLOBE_CX} cy={GLOBE_CY} r={GLOBE_R} />
          </clipPath>
        </defs>

        {/* Внешнее свечение */}
        <circle cx={GLOBE_CX} cy={GLOBE_CY} r={GLOBE_R + 18} fill="none"
          stroke="#1a4a8a" strokeWidth="18" opacity="0.15" />
        <circle cx={GLOBE_CX} cy={GLOBE_CY} r={GLOBE_R + 6} fill="none"
          stroke="#2563eb" strokeWidth="4" opacity="0.12" />

        {/* Основной шар */}
        <circle cx={GLOBE_CX} cy={GLOBE_CY} r={GLOBE_R} fill="url(#globeGrad)" />

        <g clipPath="url(#globeClip)" ref={canvasRef}>
          {/* Меридианы */}
          {meridianLines.filter(l => l.z > 0).map((l, i) => (
            <line key={`m${i}`}
              x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke="#3b82f6" strokeWidth="0.4"
              opacity={0.12 + l.z * 0.18}
            />
          ))}
          {/* Широтные */}
          {latLines.filter(l => l.z > 0).map((l, i) => (
            <line key={`la${i}`}
              x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke="#3b82f6" strokeWidth="0.4"
              opacity={0.1 + l.z * 0.15}
            />
          ))}

          {/* Точки */}
          {projected
            .filter(d => d.visible)
            .sort((a, b) => a.z - b.z)
            .map((d, i) => {
              const col = SEV_COLOR[d.severity] || "#94a3b8";
              const r = d.severity === "critical" ? 5 : d.severity === "high" ? 4 : 3;
              const op = 0.5 + d.z * 0.5;
              return (
                <g key={i} filter="url(#glow)">
                  <circle cx={d.px} cy={d.py} r={r + 3} fill={col} opacity={op * 0.25} />
                  <circle cx={d.px} cy={d.py} r={r} fill={col} opacity={op} />
                  <circle cx={d.px} cy={d.py} r={r * 0.45} fill="white" opacity={op * 0.6} />
                </g>
              );
            })}
        </g>

        {/* Блик */}
        <circle cx={GLOBE_CX - 42} cy={GLOBE_CY - 44} r={40}
          fill="white" opacity="0.045" />

        {/* Обводка шара */}
        <circle cx={GLOBE_CX} cy={GLOBE_CY} r={GLOBE_R}
          fill="none" stroke="#2563eb" strokeWidth="1.2" opacity="0.35" />
      </svg>
      <div className="text-gray-600 text-xs mt-1 tracking-wider select-none">
        ← перетащи для вращения →
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────
   Столбчатый график
──────────────────────────────────────────────── */
const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function buildWeekBars(incidents: { created_at?: string }[]) {
  const today = new Date();
  const counts: number[] = new Array(7).fill(0);
  incidents.forEach((inc) => {
    if (!inc.created_at) return;
    const d = new Date(inc.created_at);
    const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
    if (diff >= 0 && diff < 7) counts[6 - diff]++;
  });
  return counts;
}

/* ────────────────────────────────────────────────
   Главный компонент
──────────────────────────────────────────────── */
const EcsuOverview = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [globeDots, setGlobeDots] = useState<GlobeDot[]>([]);
  const [recent, setRecent] = useState<RecentInc[]>([]);
  const [weekBars, setWeekBars] = useState<number[]>(new Array(7).fill(0));
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${INCIDENTS_URL}?action=stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});

    fetch(`${INCIDENTS_URL}?action=list&limit=200`)
      .then((r) => r.json())
      .then((data) => {
        const incs: (RecentInc & { severity: string; type?: string })[] =
          data.incidents || [];

        // Глобус — группируем по стране
        const byCountry: Record<string, { severity: string; count: number }> = {};
        incs.forEach((inc) => {
          const key = inc.country;
          if (!byCountry[key]) byCountry[key] = { severity: inc.severity, count: 0 };
          byCountry[key].count++;
          const order = ["critical", "high", "medium", "low"];
          if (order.indexOf(inc.severity) < order.indexOf(byCountry[key].severity))
            byCountry[key].severity = inc.severity;
        });

        const dots: GlobeDot[] = Object.entries(byCountry).map(([country, info]) => {
          const [latDeg, lonDeg] = getLatLon(country);
          return {
            lat: (latDeg * Math.PI) / 180,
            lon: (lonDeg * Math.PI) / 180,
            severity: info.severity,
            count: info.count,
          };
        });
        setGlobeDots(dots);

        // Неделя
        setWeekBars(buildWeekBars(incs));

        // По типам
        const tc: Record<string, number> = { Экология: 0, Вода: 0, Воздух: 0, Кибер: 0 };
        incs.forEach((inc) => {
          const t = (inc.type || "").toLowerCase();
          if (t.includes("эколог") || t.includes("ecolog") || t.includes("химич")) tc["Экология"]++;
          else if (t.includes("вод") || t.includes("water") || t.includes("flood")) tc["Вода"]++;
          else if (t.includes("воздух") || t.includes("air") || t.includes("атмос")) tc["Воздух"]++;
          else if (t.includes("кибер") || t.includes("cyber") || t.includes("hack")) tc["Кибер"]++;
          else {
            // равномерно распределяем неизвестные
            const keys = Object.keys(tc);
            tc[keys[Math.floor(Math.random() * keys.length)]]++;
          }
        });
        setTypeCounts(tc);

        setRecent(
          incs.slice(0, 10).map((inc) => ({
            title: inc.title,
            country: inc.country,
            severity: inc.severity,
            created_at: inc.created_at,
          }))
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statsCards = [
    {
      label: "Всего инцидентов",
      value: stats ? stats.total.toString() : "—",
      icon: "AlertTriangle",
      color: "#e94560",
    },
    {
      label: "Решено",
      value: stats ? stats.resolved.toString() : "—",
      icon: "CheckCircle",
      color: "#00c896",
    },
    {
      label: "Активных",
      value: stats ? stats.active.toString() : "—",
      icon: "Activity",
      color: "#f59e0b",
    },
    {
      label: "Стран-участниц",
      value: stats ? stats.countries.toString() : "—",
      icon: "Globe",
      color: "#a78bfa",
    },
  ];

  const maxBar = Math.max(...weekBars, 1);
  const typeTotal = Object.values(typeCounts).reduce((a, b) => a + b, 0) || 1;
  const typeColors: Record<string, string> = {
    Экология: "#00c896",
    Вода: "#3b82f6",
    Воздух: "#a78bfa",
    Кибер: "#e94560",
  };

  return (
    <div
      className="min-h-full pb-8 text-white"
      style={{ background: "#080c1a" }}
    >
      {/* ── Шапка ── */}
      <div className="px-6 pt-5 pb-3 flex items-center justify-between">
        <span className="text-gray-400 text-sm uppercase tracking-widest font-semibold">
          Апрель 2026 · Все регионы
        </span>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
          </span>
          <span className="text-green-400 text-xs font-mono font-bold tracking-widest">LIVE</span>
        </div>
      </div>

      {/* ── 4 карточки ── */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-4 gap-4">
          {statsCards.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-5 flex flex-col gap-2 border border-blue-900/30"
              style={{ background: "#0d1225" }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: s.color + "22" }}
                >
                  <Icon name={s.icon} size={18} style={{ color: s.color }} />
                </div>
              </div>
              <div className="text-4xl font-black leading-none" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-gray-400 text-xs font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Глобус ── */}
      <div className="px-6 mb-6">
        <div
          className="rounded-2xl border border-blue-900/30 py-6 flex flex-col items-center"
          style={{ background: "#0d1225" }}
        >
          <Globe dots={globeDots} />
        </div>
      </div>

      {/* ── 2 блока: Неделя + По типам ── */}
      <div className="px-6 mb-6 grid grid-cols-2 gap-4">
        {/* Инциденты за неделю */}
        <div
          className="rounded-2xl border border-blue-900/30 p-5"
          style={{ background: "#0d1225" }}
        >
          <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">
            Инциденты за неделю
          </div>
          <div className="flex items-end gap-2" style={{ height: 90 }}>
            {weekBars.map((v, i) => {
              const h = Math.max(4, (v / maxBar) * 78);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[9px] text-gray-500">{v > 0 ? v : ""}</div>
                  <div
                    className="w-full rounded-t relative overflow-hidden"
                    style={{
                      height: h,
                      background: "linear-gradient(180deg,#3b82f6 0%,#1e3a5f 100%)",
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(96,165,250,0.07) 3px,rgba(96,165,250,0.07) 4px)",
                      }}
                    />
                  </div>
                  <div className="text-gray-600 text-[9px]">{WEEK_DAYS[i]}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* По типам */}
        <div
          className="rounded-2xl border border-blue-900/30 p-5"
          style={{ background: "#0d1225" }}
        >
          <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">
            По типам
          </div>
          <div className="flex flex-col gap-3">
            {Object.entries(typeCounts).map(([name, count]) => {
              const pct = Math.round((count / typeTotal) * 100);
              const col = typeColors[name] || "#94a3b8";
              return (
                <div key={name}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-300">{name}</span>
                    <span className="text-xs font-bold" style={{ color: col }}>
                      {pct}%
                    </span>
                  </div>
                  <div
                    className="w-full rounded-full overflow-hidden"
                    style={{ height: 6, background: "#1a2240" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: col }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Список последних инцидентов ── */}
      <div className="px-6">
        <div
          className="rounded-2xl border border-blue-900/30 p-5"
          style={{ background: "#0d1225" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Icon name="AlertTriangle" size={13} className="text-blue-400" />
            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">
              Последние инциденты
            </span>
          </div>

          {loading ? (
            <div className="text-gray-600 text-sm animate-pulse py-6 text-center">
              Загрузка...
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {recent.map((e, i) => {
                const col = SEV_COLOR[e.severity] || "#94a3b8";
                const date = e.created_at
                  ? e.created_at.slice(0, 10).split("-").reverse().join(".")
                  : "—";
                return (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: col, boxShadow: `0 0 6px ${col}` }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-200 text-sm truncate">{e.title}</div>
                      <div className="text-gray-500 text-[11px] mt-0.5">
                        {e.country} · {date}
                      </div>
                    </div>
                    <span
                      className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold shrink-0"
                      style={{ background: col + "22", color: col }}
                    >
                      {e.severity}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Футер */}
      <div className="mt-8 px-6 text-center">
        <div className="text-gray-700 text-[10px]">
          © 2026 · ECSU 2.0 · SYNERGON GLOBAL · Николаев В.В.
        </div>
      </div>
    </div>
  );
};

export default EcsuOverview;
