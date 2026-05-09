import Icon from "@/components/ui/icon";
import { useState } from "react";

const incidents = [
  { region: "Северо-Западный", x: 28, y: 35, level: "high" },
  { region: "Центральный", x: 52, y: 42, level: "critical" },
  { region: "Южный", x: 45, y: 68, level: "medium" },
  { region: "Приволжский", x: 62, y: 38, level: "high" },
  { region: "Уральский", x: 72, y: 32, level: "low" },
  { region: "Сибирский", x: 82, y: 40, level: "medium" },
  { region: "Дальневосточный", x: 88, y: 55, level: "low" },
  { region: "Северо-Кавказский", x: 38, y: 72, level: "critical" },
];

const dotColor = { critical: "#e94560", high: "#f59e0b", medium: "#a78bfa", low: "#94a3b8" };
const dotSize = { critical: 14, high: 12, medium: 10, low: 8 };

const stats = [
  { label: "Всего инцидентов", value: "1 247", delta: "+12%", icon: "AlertTriangle", color: "#e94560" },
  { label: "Решено", value: "893", delta: "+8%", icon: "CheckCircle", color: "#00c896" },
  { label: "Активных", value: "241", delta: "-3%", icon: "Activity", color: "#f59e0b" },
  { label: "Стран-участниц", value: "47", delta: "+2", icon: "Globe", color: "#60a5fa" },
];

const EcsuOverview = () => {
  const [mapMode, setMapMode] = useState<"flat" | "globe" | "heat">("flat");

  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">ОБЗОР СИСТЕМЫ</h2>
        <p className="text-gray-500 text-sm">Апрель 2026 · Все регионы</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
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
            <span className="bg-blue-900/40 text-blue-400 text-xs px-2 py-0.5 rounded-full">8 объектов</span>
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
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#94a3b8] inline-block" />Низ.</span>
            </div>
          </div>
        </div>

        {/* Map canvas */}
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
              <svg className="absolute inset-0 w-full h-full opacity-20">
                <ellipse cx="30%" cy="38%" rx="10%" ry="8%" fill="#1e3a5f" />
                <ellipse cx="52%" cy="44%" rx="12%" ry="9%" fill="#1e3a5f" />
                <ellipse cx="45%" cy="68%" rx="9%" ry="7%" fill="#1e3a5f" />
                <ellipse cx="63%" cy="40%" rx="11%" ry="8%" fill="#1e3a5f" />
                <ellipse cx="73%" cy="34%" rx="10%" ry="7%" fill="#1e3a5f" />
                <ellipse cx="83%" cy="42%" rx="9%" ry="8%" fill="#1e3a5f" />
                <ellipse cx="89%" cy="56%" rx="8%" ry="9%" fill="#1e3a5f" />
                <ellipse cx="38%" cy="72%" rx="8%" ry="6%" fill="#1e3a5f" />
              </svg>
              {incidents.map((inc, i) => (
                <div
                  key={i}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ left: `${inc.x}%`, top: `${inc.y}%` }}
                >
                  <div
                    className="rounded-full animate-pulse"
                    style={{
                      width: dotSize[inc.level as keyof typeof dotSize],
                      height: dotSize[inc.level as keyof typeof dotSize],
                      background: dotColor[inc.level as keyof typeof dotColor],
                      boxShadow: `0 0 8px ${dotColor[inc.level as keyof typeof dotColor]}`,
                    }}
                  />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-[#0d1225] border border-blue-900/50 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {inc.region}
                  </div>
                </div>
              ))}
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
                  {incidents.map((inc, i) => {
                    const angle = (inc.x / 100) * Math.PI * 1.6 - 0.8;
                    const lat = (inc.y / 100) * Math.PI - Math.PI / 2;
                    const cx = 120 + Math.cos(lat) * Math.sin(angle) * 95;
                    const cy = 120 - Math.sin(lat) * 95;
                    const color = dotColor[inc.level as keyof typeof dotColor];
                    return (
                      <g key={i}>
                        <circle cx={cx} cy={cy} r={dotSize[inc.level as keyof typeof dotSize] / 2} fill={color} opacity="0.9" />
                        <circle cx={cx} cy={cy} r={dotSize[inc.level as keyof typeof dotSize]} fill={color} opacity="0.2" />
                      </g>
                    );
                  })}
                  <circle cx="120" cy="120" r="100" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.3" />
                </svg>
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-blue-400 text-xs font-mono opacity-60">3D ГЛОБУС · ECSU</div>
              </div>
            </div>
          )}

          {/* Heat mode */}
          {mapMode === "heat" && (
            <>
              <svg className="absolute inset-0 w-full h-full">
                {incidents.map((inc, i) => {
                  const color = dotColor[inc.level as keyof typeof dotColor];
                  const r = inc.level === "critical" ? 80 : inc.level === "high" ? 65 : inc.level === "medium" ? 50 : 35;
                  return (
                    <radialGradient key={`g${i}`} id={`hg${i}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                      <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </radialGradient>
                  );
                }).concat(
                  incidents.map((inc, i) => (
                    <ellipse
                      key={`e${i}`}
                      cx={`${inc.x}%`}
                      cy={`${inc.y}%`}
                      rx={`${(incidents[i].level === "critical" ? 80 : incidents[i].level === "high" ? 65 : 50) / 10}%`}
                      ry={`${(incidents[i].level === "critical" ? 80 : incidents[i].level === "high" ? 65 : 50) / 6}%`}
                      fill={`url(#hg${i})`}
                    />
                  )) as unknown as React.ReactElement[]
                )}
              </svg>
              <div className="absolute top-3 left-3 text-blue-400 text-xs font-mono opacity-60">ТЕПЛОВАЯ КАРТА · ИНТЕНСИВНОСТЬ УГРОЗ</div>
              {incidents.map((inc, i) => (
                <div
                  key={i}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ left: `${inc.x}%`, top: `${inc.y}%` }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: dotColor[inc.level as keyof typeof dotColor] }} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-[#0d1225] border border-blue-900/50 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {inc.region}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Watermark */}
          <div className="absolute bottom-3 right-3 text-blue-900/50 text-xs font-mono">ECSU 2.0 · DALAN</div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="mt-4 bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
        <div className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <Icon name="Activity" size={15} className="text-blue-400" />
          Последние события
        </div>
        <div className="space-y-2">
          {[
            { time: "14:23", text: "Инцидент #1247 — Центральный регион · Критический", color: "#e94560" },
            { time: "13:55", text: "Инцидент #1246 решён — Приволжский регион", color: "#00c896" },
            { time: "13:12", text: "DALAN: оптимизация потока данных +10% (Сдвиг Николаева)", color: "#FFD700" },
            { time: "12:44", text: "Инцидент #1245 — Северо-Кавказский · Критический", color: "#e94560" },
            { time: "11:30", text: "Подключена новая страна-участница (#47)", color: "#60a5fa" },
          ].map((e, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              <span className="text-gray-600 w-10 shrink-0">{e.time}</span>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: e.color }} />
              <span className="text-gray-300">{e.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EcsuOverview;