/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Icon from "@/components/ui/icon";

const WEEKLY = [
  { day: "Пн", count: 12 },
  { day: "Вт", count: 19 },
  { day: "Ср", count: 8 },
  { day: "Чт", count: 24 },
  { day: "Пт", count: 16 },
  { day: "Сб", count: 9 },
  { day: "Вс", count: 14 },
];

const BY_TYPE = [
  { type: "Экология", count: 45, color: "#00ff87" },
  { type: "Вода", count: 28, color: "#3b82f6" },
  { type: "Воздух", count: 19, color: "#f59e0b" },
  { type: "Кибер", count: 8, color: "#f43f5e" },
];

const STATUS_COLORS: Record<string, string> = { active: "#f43f5e", investigating: "#f59e0b", resolved: "#00ff87" };
const STATUS_LABELS: Record<string, string> = { active: "Активен", investigating: "Расследование", resolved: "Решён" };

const KPI_DETAILS = [
  {
    label: "Всего инцидентов", value: "1 247", delta: "+12%", icon: "AlertTriangle", color: "#f43f5e",
    description: "Общее число зафиксированных инцидентов в системе ECSU за текущий месяц. Включает все категории угроз — экологические, кибер-, водные и воздушные нарушения.",
    breakdown: [
      { label: "Экологические", value: "561", pct: 45 },
      { label: "Водные", value: "349", pct: 28 },
      { label: "Воздушные", value: "237", pct: 19 },
      { label: "Кибератаки", value: "100", pct: 8 },
    ],
    trend: "Рост на 12% по сравнению с мартом 2026 года. Основной вклад — Юго-Восточная Азия (+34%).",
  },
  {
    label: "Решено", value: "893", delta: "+8%", icon: "CheckCircle", color: "#00ff87",
    description: "Количество инцидентов, по которым завершено расследование, приняты меры реагирования и закрыто дело. Решение подтверждается координатором и вносится в базу ECSU.",
    breakdown: [
      { label: "В срок (< 72ч)", value: "621", pct: 70 },
      { label: "Затяжные (> 72ч)", value: "272", pct: 30 },
    ],
    trend: "Эффективность выросла на 8%. Среднее время закрытия инцидента — 41 час.",
  },
  {
    label: "Активных", value: "241", delta: "-3%", icon: "Activity", color: "#f59e0b",
    description: "Инциденты в статусе «Активен» или «Расследование», требующие внимания операторов и органов реагирования прямо сейчас. Снижение показателя — положительная динамика.",
    breakdown: [
      { label: "Критические", value: "18", pct: 7 },
      { label: "Высокий приоритет", value: "89", pct: 37 },
      { label: "Средний приоритет", value: "134", pct: 56 },
    ],
    trend: "Снижение на 3% — результат работы СБР в Нигерии и Канаде.",
  },
  {
    label: "Стран-участниц", value: "47", delta: "+2", icon: "Globe", color: "#a855f7",
    description: "Число государств, которые официально подписали соглашение ECSU 2.0 и ведут активную отчётность. В апреле к системе присоединились Эфиопия и Боливия.",
    breakdown: [
      { label: "Европа", value: "18", pct: 38 },
      { label: "Азия", value: "14", pct: 30 },
      { label: "Африка", value: "9", pct: 19 },
      { label: "Америки", value: "6", pct: 13 },
    ],
    trend: "В апреле 2026 присоединились Эфиопия и Боливия. Ещё 12 стран на стадии ратификации.",
  },
];

const maxCount = Math.max(...WEEKLY.map(w => w.count));
const total = BY_TYPE.reduce((a, b) => a + b.count, 0);

// Координаты стран на SVG-карте (x,y в процентах от размера 1000x500)
const COUNTRY_COORDS: Record<string, [number, number]> = {
  "Бразилия": [280, 340], "Германия": [490, 165], "Китай": [730, 210],
  "Кения": [540, 310], "Норвегия": [490, 130], "Нигерия": [480, 290],
  "Канада": [210, 155], "Индия": [650, 250], "Россия": [620, 145],
  "США": [185, 210], "Австралия": [790, 380], "Франция": [470, 175],
  "Япония": [800, 205], "Аргентина": [265, 400], "ЮАР": [510, 370],
};

const SEV_COLOR: Record<string, string> = {
  critical: "#f43f5e", high: "#f59e0b", medium: "#a855f7", low: "#3b82f6",
};

function IncidentMap({ incidents }: { incidents: any[] }) {
  const [hovered, setHovered] = useState<any | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const points = incidents.map(inc => ({
    ...inc,
    coords: COUNTRY_COORDS[inc.country] || null,
  })).filter(inc => inc.coords);

  return (
    <div className="rounded-2xl overflow-hidden relative"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <h3 className="font-display text-sm font-semibold text-white/70 uppercase tracking-wider">Карта инцидентов</h3>
        <div className="flex items-center gap-3 text-[10px]">
          {Object.entries(SEV_COLOR).map(([k, c]) => (
            <span key={k} className="flex items-center gap-1 text-white/40">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: c }} />
              {k === "critical" ? "Критич." : k === "high" ? "Высокий" : k === "medium" ? "Средний" : "Низкий"}
            </span>
          ))}
        </div>
      </div>
      <div className="relative" style={{ paddingBottom: "50%" }}>
        <svg
          viewBox="0 0 1000 500"
          className="absolute inset-0 w-full h-full"
          style={{ background: "transparent" }}
        >
          {/* Упрощённые контуры континентов */}
          {/* Северная Америка */}
          <path d="M 80,100 L 330,80 L 360,200 L 320,280 L 250,300 L 200,260 L 140,220 L 100,160 Z"
            fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          {/* Южная Америка */}
          <path d="M 220,300 L 320,290 L 340,360 L 300,440 L 240,450 L 210,400 L 215,340 Z"
            fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          {/* Европа */}
          <path d="M 440,100 L 560,90 L 570,170 L 510,200 L 450,195 L 430,150 Z"
            fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          {/* Африка */}
          <path d="M 450,210 L 570,200 L 590,260 L 560,370 L 500,410 L 450,380 L 430,310 L 440,250 Z"
            fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          {/* Азия */}
          <path d="M 570,80 L 860,70 L 870,200 L 820,250 L 750,260 L 660,230 L 600,220 L 570,170 Z"
            fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          {/* Австралия */}
          <path d="M 740,340 L 870,330 L 880,410 L 820,440 L 750,420 L 730,380 Z"
            fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

          {/* Сетка */}
          {[100, 200, 300, 400].map(y => (
            <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          ))}
          {[200, 400, 600, 800].map(x => (
            <line key={x} x1={x} y1="0" x2={x} y2="500" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          ))}

          {/* Точки инцидентов */}
          {points.map((inc, i) => {
            const [cx, cy] = inc.coords!;
            const color = SEV_COLOR[inc.severity] || "#a855f7";
            return (
              <g key={i}
                onMouseEnter={e => { setHovered(inc); setTooltipPos({ x: cx / 10, y: cy / 5 }); }}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}>
                {/* Пульсирующий круг для активных */}
                {inc.status === "active" && (
                  <circle cx={cx} cy={cy} r="14" fill={color} opacity="0.12">
                    <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.15;0.05;0.15" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={cx} cy={cy} r="6" fill={color} opacity="0.9"
                  stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                {/* Подпись страны */}
                <text x={cx + 9} y={cy + 4} fontSize="9" fill="rgba(255,255,255,0.4)"
                  style={{ pointerEvents: "none" }}>
                  {inc.country}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Тултип */}
        {hovered && (
          <div
            className="absolute z-10 px-3 py-2 rounded-xl text-xs pointer-events-none"
            style={{
              left: `${tooltipPos.x}%`,
              top: `${tooltipPos.y}%`,
              transform: "translate(-50%, -120%)",
              background: "#0d1220",
              border: `1px solid ${SEV_COLOR[hovered.severity] || "#a855f7"}60`,
              boxShadow: `0 4px 20px rgba(0,0,0,0.5)`,
              minWidth: 160,
            }}
          >
            <div className="font-bold text-white mb-0.5">{hovered.title}</div>
            <div className="text-white/50">{hovered.country} · {hovered.date}</div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: SEV_COLOR[hovered.severity] }} />
              <span style={{ color: SEV_COLOR[hovered.severity] }}>{hovered.severity}</span>
              <span className="text-white/30">· AI {hovered.ai}%</span>
            </div>
          </div>
        )}
      </div>
      <div className="px-5 py-2 text-[10px] text-white/20" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        Показано {points.length} инцидентов на карте · пульсирующие точки — активные
      </div>
    </div>
  );
}

type Props = {
  incidents: any[];
  onShowAll: () => void;
  onSelectIncident: (inc: any) => void;
};

export default function DashboardOverview({ incidents, onShowAll, onSelectIncident }: Props) {
  const [selectedKpi, setSelectedKpi] = useState<typeof KPI_DETAILS[0] | null>(null);

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-bold text-white uppercase">Обзор системы</h1>
        <p className="text-white/30 text-sm mt-0.5">Апрель 2026 · Все регионы</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPI_DETAILS.map((kpi) => (
          <button key={kpi.label} onClick={() => setSelectedKpi(kpi)}
            className="p-4 rounded-2xl text-left transition-all hover:scale-[1.02] cursor-pointer w-full"
            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${kpi.color}20` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${kpi.color}15` }}>
                <Icon name={kpi.icon as any} size={16} style={{ color: kpi.color }} />
              </div>
              <span className="text-xs font-semibold" style={{ color: kpi.delta.startsWith("+") ? "#00ff87" : "#f43f5e" }}>
                {kpi.delta}
              </span>
            </div>
            <div className="font-display text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="text-white/40 text-xs mt-0.5">{kpi.label}</div>
          </button>
        ))}
      </div>

      {/* Модальное окно KPI */}
      {selectedKpi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={() => setSelectedKpi(null)}>
          <div className="w-full max-w-md rounded-2xl p-6"
            style={{ background: "#0d1220", border: `1px solid ${selectedKpi.color}40`, boxShadow: `0 0 60px ${selectedKpi.color}20` }}
            onClick={e => e.stopPropagation()}>
            {/* Заголовок */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${selectedKpi.color}20` }}>
                  <Icon name={selectedKpi.icon as any} size={20} style={{ color: selectedKpi.color }} />
                </div>
                <div>
                  <h2 className="text-white font-bold text-base">{selectedKpi.label}</h2>
                  <p className="text-xs mt-0.5 font-semibold" style={{ color: selectedKpi.delta.startsWith("+") ? "#00ff87" : "#f43f5e" }}>
                    {selectedKpi.delta} к прошлому месяцу
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedKpi(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 transition-colors"
                style={{ background: "rgba(255,255,255,0.05)" }}>
                <Icon name="X" size={14} />
              </button>
            </div>

            {/* Значение */}
            <div className="text-center py-4 mb-5 rounded-xl"
              style={{ background: `${selectedKpi.color}08`, border: `1px solid ${selectedKpi.color}20` }}>
              <div className="font-display text-5xl font-bold" style={{ color: selectedKpi.color }}>{selectedKpi.value}</div>
              <div className="text-white/40 text-xs mt-1">{selectedKpi.label} · Апрель 2026</div>
            </div>

            {/* Описание */}
            <p className="text-white/60 text-sm leading-relaxed mb-5">{selectedKpi.description}</p>

            {/* Разбивка */}
            <div className="mb-4">
              <h4 className="text-white/40 text-[10px] uppercase tracking-widest mb-3">Разбивка</h4>
              <div className="space-y-2.5">
                {selectedKpi.breakdown.map(b => (
                  <div key={b.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{b.label}</span>
                      <span style={{ color: selectedKpi.color }}>{b.value} ({b.pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${b.pct}%`, background: selectedKpi.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Тренд */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Icon name="TrendingUp" size={13} className="text-white/30 mt-0.5 shrink-0" />
              <p className="text-white/50 text-xs leading-relaxed">{selectedKpi.trend}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Карта инцидентов ── */}
      <IncidentMap incidents={incidents} />

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Weekly chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 className="font-display text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Инциденты за неделю</h3>
          <div className="flex items-end gap-3 h-28">
            {WEEKLY.map((w) => (
              <div key={w.day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-white/40 text-[10px]">{w.count}</span>
                <div className="w-full rounded-t-md transition-all"
                  style={{ height: `${(w.count / maxCount) * 96}px`, background: "linear-gradient(to top, #a855f7, #3b82f6)" }} />
                <span className="text-white/30 text-[10px]">{w.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By type */}
        <div className="p-5 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 className="font-display text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">По типам</h3>
          <div className="space-y-3">
            {BY_TYPE.map((item) => (
              <div key={item.type}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/60">{item.type}</span>
                  <span style={{ color: item.color }}>{item.count} ({Math.round(item.count / total * 100)}%)</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${item.count / total * 100}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <h3 className="font-display text-sm font-semibold text-white/70 uppercase tracking-wider">Последние инциденты</h3>
          <button onClick={onShowAll} className="text-xs text-white/30 hover:text-white/60 transition-colors">Все →</button>
        </div>
        {incidents.slice(0, 4).map((inc) => (
          <div key={inc.id}
            onClick={() => onSelectIncident(inc)}
            className="flex items-center gap-4 px-5 py-3 cursor-pointer transition-colors"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(168,85,247,0.07)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[inc.status] }} />
            <span className="text-white/30 text-xs w-20 shrink-0">{inc.id}</span>
            <span className="text-white/80 text-sm flex-1 truncate">{inc.title}</span>
            <span className="text-white/30 text-xs hidden md:block">{inc.country}</span>
            <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
              style={{ background: `${STATUS_COLORS[inc.status]}15`, color: STATUS_COLORS[inc.status] }}>
              {STATUS_LABELS[inc.status]}
            </span>
            <Icon name="ChevronRight" size={12} className="text-purple-400 opacity-50 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}