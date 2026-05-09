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
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-10">
            {[...Array(10)].map((_, i) => (
              <line key={`h${i}`} x1="0" y1={`${i * 10}%`} x2="100%" y2={`${i * 10}%`} stroke="#60a5fa" strokeWidth="0.5" />
            ))}
            {[...Array(10)].map((_, i) => (
              <line key={`v${i}`} x1={`${i * 10}%`} y1="0" x2={`${i * 10}%`} y2="100%" stroke="#60a5fa" strokeWidth="0.5" />
            ))}
          </svg>

          {/* Regions blobs */}
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

          {/* Incident dots */}
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
