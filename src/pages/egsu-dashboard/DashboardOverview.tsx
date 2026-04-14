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
    description: "Общее число зафиксированных инцидентов в системе ЕЦСУ за текущий месяц. Включает все категории угроз — экологические, кибер-, водные и воздушные нарушения.",
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
    description: "Количество инцидентов, по которым завершено расследование, приняты меры реагирования и закрыто дело. Решение подтверждается координатором и вносится в базу ЕЦСУ.",
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
    description: "Число государств, которые официально подписали соглашение ЕЦСУ 2.0 и ведут активную отчётность. В апреле к системе присоединились Эфиопия и Боливия.",
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
