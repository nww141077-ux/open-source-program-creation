/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const INCIDENTS = [
  { id: 1, type: "ecology", title: "Незаконная вырубка леса", country: "Бразилия", lat: -10, lng: -55, status: "active", severity: "high", date: "12.04.2026", area: "2 400 га" },
  { id: 2, type: "water", title: "Загрязнение реки Рейн", country: "Германия", lat: 51, lng: 7, status: "investigating", severity: "medium", date: "11.04.2026", area: "180 км" },
  { id: 3, type: "air", title: "Выброс CO₂ сверх нормы", country: "Китай", lat: 35, lng: 105, status: "resolved", severity: "high", date: "10.04.2026", area: "—" },
  { id: 4, type: "ecology", title: "Браконьерство в заповеднике", country: "Кения", lat: -1, lng: 37, status: "active", severity: "medium", date: "09.04.2026", area: "500 га" },
  { id: 5, type: "cyber", title: "Кибератака на инфраструктуру", country: "Норвегия", lat: 60, lng: 10, status: "investigating", severity: "critical", date: "08.04.2026", area: "—" },
  { id: 6, type: "water", title: "Нефтяной разлив", country: "Нигерия", lat: 5, lng: 6, status: "active", severity: "critical", date: "07.04.2026", area: "320 км²" },
  { id: 7, type: "air", title: "Лесные пожары", country: "Канада", lat: 55, lng: -105, status: "resolved", severity: "high", date: "06.04.2026", area: "15 000 га" },
  { id: 8, type: "ecology", title: "Незаконный сброс отходов", country: "Индия", lat: 20, lng: 78, status: "active", severity: "medium", date: "05.04.2026", area: "—" },
];

const STATS = [
  { value: "1 247", label: "Всего инцидентов", icon: "AlertTriangle", color: "#f43f5e" },
  { value: "893", label: "Решено (72%)", icon: "CheckCircle", color: "#00ff87" },
  { value: "48ч", label: "Среднее время реакции", icon: "Timer", color: "#3b82f6" },
  { value: "47", label: "Стран участниц", icon: "Globe", color: "#a855f7" },
];

const TYPE_LABELS: Record<string, string> = { ecology: "Экология", water: "Вода", air: "Воздух", cyber: "Кибер" };
const TYPE_COLORS: Record<string, string> = { ecology: "#00ff87", water: "#3b82f6", air: "#f59e0b", cyber: "#f43f5e" };
const TYPE_ICONS: Record<string, string> = { ecology: "Leaf", water: "Droplets", air: "Wind", cyber: "Shield" };

const STATUS_COLORS: Record<string, string> = { active: "#f43f5e", investigating: "#f59e0b", resolved: "#00ff87" };
const STATUS_LABELS: Record<string, string> = { active: "Активен", investigating: "Расследование", resolved: "Решён" };

const SEVERITY_COLORS: Record<string, string> = { critical: "#f43f5e", high: "#f59e0b", medium: "#3b82f6" };
const SEVERITY_LABELS: Record<string, string> = { critical: "Критический", high: "Высокий", medium: "Средний" };

// Simple SVG world map dots for key locations
const MAP_DOTS = [
  { x: 22, y: 62, incident: INCIDENTS[0] },
  { x: 51, y: 28, incident: INCIDENTS[1] },
  { x: 72, y: 33, incident: INCIDENTS[2] },
  { x: 56, y: 52, incident: INCIDENTS[3] },
  { x: 52, y: 20, incident: INCIDENTS[4] },
  { x: 55, y: 50, incident: INCIDENTS[5] },
  { x: 18, y: 22, incident: INCIDENTS[6] },
  { x: 68, y: 42, incident: INCIDENTS[7] },
];

export default function GlobalLaw() {
  const navigate = useNavigate();
  const [selectedIncident, setSelectedIncident] = useState<typeof INCIDENTS[0] | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [tab, setTab] = useState<"map" | "list">("map");

  const filtered = filterType === "all" ? INCIDENTS : INCIDENTS.filter(i => i.type === filterType);

  return (
    <div className="min-h-screen font-body" style={{ background: "#060a12" }}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-3"
        style={{ background: "rgba(6,10,18,0.97)", borderBottom: "1px solid rgba(0,255,135,0.12)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #00ff87, #3b82f6)" }}>
            <Icon name="Globe" size={16} className="text-black" />
          </div>
          <div>
            <div className="font-display text-base font-bold text-white tracking-wide leading-none">СИСТЕМА УПРАВЛЕНИЯ</div>
            <div className="text-white/30 text-[10px]">ЕЦСУ 2.0 · Lite</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/egsu/report")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-black transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #f43f5e, #f59e0b)" }}>
            <Icon name="AlertTriangle" size={14} />
            <span className="hidden md:block">Сообщить о нарушении</span>
            <span className="md:hidden">Сообщить</span>
          </button>
          <button onClick={() => navigate("/egsu/dashboard")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            <Icon name="LayoutDashboard" size={14} />
            <span className="hidden md:block">Дашборд</span>
          </button>
        </div>
      </nav>

      <div className="pt-14">
        {/* STATS BAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: "rgba(255,255,255,0.05)" }}>
          {STATS.map((s) => (
            <div key={s.label} className="flex items-center gap-3 px-5 py-4" style={{ background: "#060a12" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${s.color}15` }}>
                <Icon name={s.icon as any} size={16} style={{ color: s.color }} />
              </div>
              <div>
                <div className="font-display text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-white/40 text-xs">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div className="flex items-center gap-2 px-4 md:px-8 py-3 overflow-x-auto"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={() => setFilterType("all")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
            style={{ background: filterType === "all" ? "rgba(0,255,135,0.15)" : "rgba(255,255,255,0.05)", color: filterType === "all" ? "#00ff87" : "rgba(255,255,255,0.5)", border: filterType === "all" ? "1px solid rgba(0,255,135,0.3)" : "1px solid transparent" }}>
            Все типы
          </button>
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <button key={key} onClick={() => setFilterType(key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
              style={{ background: filterType === key ? `${TYPE_COLORS[key]}15` : "rgba(255,255,255,0.05)", color: filterType === key ? TYPE_COLORS[key] : "rgba(255,255,255,0.5)", border: filterType === key ? `1px solid ${TYPE_COLORS[key]}40` : "1px solid transparent" }}>
              <Icon name={TYPE_ICONS[key] as any} size={12} />
              {label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1 shrink-0">
            {(["map", "list"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ background: tab === t ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.05)", color: tab === t ? "#3b82f6" : "rgba(255,255,255,0.4)" }}>
                {t === "map" ? "Карта" : "Список"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-180px)]">
          {/* MAP / LIST */}
          <div className="flex-1">
            {tab === "map" ? (
              <div className="relative w-full h-[400px] lg:h-full min-h-[400px]"
                style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(59,130,246,0.05) 0%, transparent 70%)" }}>
                {/* SVG World Map simplified */}
                <svg viewBox="0 0 100 60" className="w-full h-full" style={{ opacity: 0.15 }}>
                  {/* Continents simplified outlines */}
                  <ellipse cx="22" cy="45" rx="14" ry="8" fill="#3b82f6" />
                  <ellipse cx="50" cy="28" rx="18" ry="12" fill="#3b82f6" />
                  <ellipse cx="72" cy="35" rx="16" ry="10" fill="#3b82f6" />
                  <ellipse cx="55" cy="50" rx="6" ry="4" fill="#3b82f6" />
                  <ellipse cx="18" cy="22" rx="12" ry="8" fill="#3b82f6" />
                  <ellipse cx="82" cy="50" rx="8" ry="5" fill="#3b82f6" />
                </svg>

                {/* Incident dots */}
                {MAP_DOTS.filter(d => filterType === "all" || d.incident.type === filterType).map((dot) => (
                  <button
                    key={dot.incident.id}
                    onClick={() => setSelectedIncident(dot.incident)}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-150"
                    style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
                  >
                    <div className="relative">
                      <div className="w-4 h-4 rounded-full border-2 border-white/30"
                        style={{ background: SEVERITY_COLORS[dot.incident.severity] }} />
                      {dot.incident.status === "active" && (
                        <div className="absolute inset-0 rounded-full animate-ping opacity-60"
                          style={{ background: SEVERITY_COLORS[dot.incident.severity] }} />
                      )}
                    </div>
                  </button>
                ))}

                {/* Legend */}
                <div className="absolute bottom-4 left-4 p-3 rounded-xl space-y-1.5"
                  style={{ background: "rgba(6,10,18,0.9)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {Object.entries(SEVERITY_LABELS).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2 text-xs text-white/50">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: SEVERITY_COLORS[key] }} />
                      {label}
                    </div>
                  ))}
                </div>

                {/* Selected popup */}
                {selectedIncident && (
                  <div className="absolute top-4 right-4 w-64 p-4 rounded-xl animate-fade-up"
                    style={{ background: "rgba(6,10,18,0.97)", border: `1px solid ${SEVERITY_COLORS[selectedIncident.severity]}40` }}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${TYPE_COLORS[selectedIncident.type]}15` }}>
                          <Icon name={TYPE_ICONS[selectedIncident.type] as any} size={14} style={{ color: TYPE_COLORS[selectedIncident.type] }} />
                        </div>
                        <span className="text-white font-semibold text-sm leading-tight">{selectedIncident.title}</span>
                      </div>
                      <button onClick={() => setSelectedIncident(null)} className="text-white/30 hover:text-white/60 shrink-0">
                        <Icon name="X" size={14} />
                      </button>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-white/40">Страна</span>
                        <span className="text-white/70">{selectedIncident.country}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">Статус</span>
                        <span style={{ color: STATUS_COLORS[selectedIncident.status] }}>{STATUS_LABELS[selectedIncident.status]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">Угроза</span>
                        <span style={{ color: SEVERITY_COLORS[selectedIncident.severity] }}>{SEVERITY_LABELS[selectedIncident.severity]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">Дата</span>
                        <span className="text-white/70">{selectedIncident.date}</span>
                      </div>
                      {selectedIncident.area !== "—" && (
                        <div className="flex justify-between">
                          <span className="text-white/40">Масштаб</span>
                          <span className="text-white/70">{selectedIncident.area}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 md:p-6 space-y-2">
                {filtered.map((inc) => (
                  <div key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
                    style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${SEVERITY_COLORS[inc.severity]}20` }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${TYPE_COLORS[inc.type]}15` }}>
                      <Icon name={TYPE_ICONS[inc.type] as any} size={18} style={{ color: TYPE_COLORS[inc.type] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white/90 font-medium text-sm truncate">{inc.title}</div>
                      <div className="text-white/30 text-xs mt-0.5">{inc.country} · {inc.date}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: `${SEVERITY_COLORS[inc.severity]}15`, color: SEVERITY_COLORS[inc.severity] }}>
                        {SEVERITY_LABELS[inc.severity]}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: `${STATUS_COLORS[inc.status]}15`, color: STATUS_COLORS[inc.status] }}>
                        {STATUS_LABELS[inc.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SIDEBAR — recent */}
          <div className="w-full lg:w-80 shrink-0 p-4"
            style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", background: "rgba(6,10,18,0.8)" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#f43f5e" }} />
              <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Последние инциденты</span>
            </div>
            <div className="space-y-2">
              {INCIDENTS.slice(0, 6).map((inc) => (
                <button key={inc.id} onClick={() => { setSelectedIncident(inc); setTab("map"); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:bg-white/3"
                  style={{ border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[inc.status] }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-white/80 text-xs font-medium truncate">{inc.title}</div>
                    <div className="text-white/30 text-[10px] mt-0.5">{inc.country} · {inc.date}</div>
                  </div>
                  <Icon name={TYPE_ICONS[inc.type] as any} size={12} style={{ color: TYPE_COLORS[inc.type] }} className="shrink-0" />
                </button>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl" style={{ background: "rgba(0,255,135,0.05)", border: "1px solid rgba(0,255,135,0.1)" }}>
              <div className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">ИИ-статус</div>
              {[
                { label: "Точность классификации", value: 78, color: "#00ff87" },
                { label: "Обработано за сегодня", value: 92, color: "#3b82f6" },
                { label: "Подтверждено вручную", value: 64, color: "#a855f7" },
              ].map((item) => (
                <div key={item.label} className="mb-2.5">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/40">{item.label}</span>
                    <span style={{ color: item.color }}>{item.value}%</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-1 rounded-full transition-all" style={{ width: `${item.value}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-center">
              <p className="text-white/20 text-[10px]">© 2024 Николаев Владимир Владимирович</p>
              <p className="text-white/15 text-[10px]">Все права защищены · ЕЦСУ 2.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}