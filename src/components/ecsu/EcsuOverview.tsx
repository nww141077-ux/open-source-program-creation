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

const recentIncidents = [
  { code: "ИНЦ-001", title: "Незаконная вырубка леса", region: "Сибирский", level: "high" },
  { code: "ИНЦ-003", title: "Загрязнение реки Рейн", region: "Международный", level: "critical" },
  { code: "ИНЦ-003", title: "Выброс CO₂ сверх нормы", region: "Центральный", level: "medium" },
  { code: "ИНЦ-004", title: "Браконьерство в заповеднике", region: "Уральский", level: "high" },
];

const weekData = [22, 38, 15, 52, 41, 28, 63, 19, 44, 31, 55, 20, 48, 36];

const EcsuOverview = () => {
  const [mapMode, setMapMode] = useState<"flat" | "globe" | "heat">("globe");

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
      <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="Map" size={16} className="text-blue-400" />
            <span className="text-white font-bold text-sm">КАРТА ИНЦИДЕНТОВ</span>
            <span className="bg-blue-900/40 text-blue-400 text-xs px-2 py-0.5 rounded-full">8 объектов</span>
          </div>
          <div className="flex gap-1">
            {(["flat", "globe", "heat"] as const).map((m) => (
              <button key={m} onClick={() => setMapMode(m)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  mapMode === m ? "bg-blue-600 text-white" : "text-gray-500 hover:text-white"
                }`}>
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

        <div className="relative bg-[#060d1f] rounded-xl overflow-hidden" style={{ height: 320 }}>
          {/* Flat */}
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
                <div key={i} className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ left: `${inc.x}%`, top: `${inc.y}%` }}>
                  <div className="rounded-full animate-pulse"
                    style={{
                      width: dotSize[inc.level as keyof typeof dotSize],
                      height: dotSize[inc.level as keyof typeof dotSize],
                      background: dotColor[inc.level as keyof typeof dotColor],
                      boxShadow: `0 0 8px ${dotColor[inc.level as keyof typeof dotColor]}`,
                    }} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-[#0d1225] border border-blue-900/50 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {inc.region}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Globe */}
          {mapMode === "globe" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <svg width="260" height="260" viewBox="0 0 260 260">
                  <defs>
                    <radialGradient id="globeGrad" cx="35%" cy="35%">
                      <stop offset="0%" stopColor="#1e3a8a" />
                      <stop offset="100%" stopColor="#0a1628" />
                    </radialGradient>
                  </defs>
                  <circle cx="130" cy="130" r="110" fill="url(#globeGrad)" stroke="#1e3a5f" strokeWidth="1.5" />
                  <ellipse cx="130" cy="130" rx="110" ry="44" fill="none" stroke="#1e4a8f" strokeWidth="0.8" opacity="0.6" />
                  <ellipse cx="130" cy="130" rx="110" ry="22" fill="none" stroke="#1e4a8f" strokeWidth="0.5" opacity="0.4" />
                  <ellipse cx="130" cy="130" rx="65" ry="110" fill="none" stroke="#1e4a8f" strokeWidth="0.8" opacity="0.6" />
                  <ellipse cx="130" cy="130" rx="32" ry="110" fill="none" stroke="#1e4a8f" strokeWidth="0.5" opacity="0.4" />
                  <line x1="20" y1="130" x2="240" y2="130" stroke="#1e4a8f" strokeWidth="0.8" opacity="0.5" />
                  <line x1="130" y1="20" x2="130" y2="240" stroke="#1e4a8f" strokeWidth="0.8" opacity="0.5" />
                  {incidents.map((inc, i) => {
                    const angle = (inc.x / 100) * Math.PI * 1.6 - 0.8;
                    const lat = (inc.y / 100) * Math.PI - Math.PI / 2;
                    const cx = 130 + Math.cos(lat) * Math.sin(angle) * 105;
                    const cy = 130 - Math.sin(lat) * 105;
                    const color = dotColor[inc.level as keyof typeof dotColor];
                    const size = dotSize[inc.level as keyof typeof dotSize];
                    return (
                      <g key={i}>
                        <circle cx={cx} cy={cy} r={size} fill={color} opacity="0.15" />
                        <circle cx={cx} cy={cy} r={size / 2} fill={color} opacity="0.9" />
                      </g>
                    );
                  })}
                  <circle cx="130" cy="130" r="110" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.25" />
                </svg>
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-blue-400 text-xs font-mono opacity-50 whitespace-nowrap">3D ГЛОБУС · ECSU</div>
              </div>
            </div>
          )}

          {/* Heat */}
          {mapMode === "heat" && (
            <svg className="absolute inset-0 w-full h-full">
              {incidents.map((inc, i) => {
                const color = dotColor[inc.level as keyof typeof dotColor];
                const r = inc.level === "critical" ? 80 : inc.level === "high" ? 65 : inc.level === "medium" ? 50 : 35;
                return (
                  <g key={i}>
                    <defs>
                      <radialGradient id={`hg${i}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.7" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    <circle cx={`${inc.x}%`} cy={`${inc.y}%`} r={r} fill={`url(#hg${i})`} />
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
          <div className="text-white font-bold text-sm mb-1">ИНЦИДЕНТЫ ЗА НЕДЕЛЮ</div>
          <div className="flex items-end gap-1 h-20 mt-3">
            {weekData.map((v, i) => (
              <div key={i} className="flex-1 rounded-t"
                style={{
                  height: `${(v / Math.max(...weekData)) * 100}%`,
                  background: "linear-gradient(180deg, #3b82f6 0%, #1e40af 100%)",
                  opacity: 0.6 + (v / Math.max(...weekData)) * 0.4,
                }} />
            ))}
          </div>
          <div className="flex justify-between text-gray-600 text-[10px] mt-1">
            <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span>
          </div>
        </div>

        <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
          <div className="text-white font-bold text-sm mb-3">ПО ТИПАМ</div>
          <div className="space-y-2">
            {[
              { label: "Экология", pct: 42, color: "#00c896" },
              { label: "Кибербезопасность", pct: 28, color: "#3b82f6" },
              { label: "Вода", pct: 18, color: "#60a5fa" },
              { label: "Отходы", pct: 8, color: "#f59e0b" },
              { label: "Прибор", pct: 4, color: "#e94560" },
            ].map(t => (
              <div key={t.label}>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-gray-400">{t.label}</span>
                  <span style={{ color: t.color }}>{t.pct}%</span>
                </div>
                <div className="h-1 rounded-full bg-blue-900/30">
                  <div className="h-1 rounded-full" style={{ width: `${t.pct}%`, background: t.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Последние инциденты */}
      <div className="mt-4 bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
        <div className="text-white font-bold text-sm mb-3">ПОСЛЕДНИЕ ИНЦИДЕНТЫ</div>
        <div className="space-y-2">
          {recentIncidents.map((inc, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: dotColor[inc.level as keyof typeof dotColor] }} />
              <span className="text-gray-500 text-xs font-mono w-16 shrink-0">{inc.code}</span>
              <span className="text-gray-300 text-sm flex-1">{inc.title}</span>
              <span className="text-gray-600 text-xs">{inc.region}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EcsuOverview;
