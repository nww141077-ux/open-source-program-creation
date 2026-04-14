/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import {
  SectionMission, SectionAudience, SectionRevenue, SectionCosts,
  SectionPhases, SectionKpi, SectionRisks, SectionSalary, SectionStrategy,
} from "./egsu-business/BusinessSections";

type Section =
  | "mission" | "audience" | "revenue" | "costs"
  | "phases" | "kpi" | "risks" | "salary" | "strategy";

const SECTIONS: { id: Section; icon: string; color: string; label: string }[] = [
  { id: "mission",  icon: "Star",        color: "#00ff87", label: "Миссия и ценности" },
  { id: "audience", icon: "Users",       color: "#a855f7", label: "Целевая аудитория" },
  { id: "revenue",  icon: "TrendingUp",  color: "#f59e0b", label: "Источники дохода" },
  { id: "costs",    icon: "PieChart",    color: "#3b82f6", label: "Структура затрат" },
  { id: "phases",   icon: "Rocket",      color: "#06b6d4", label: "Фазы развития" },
  { id: "kpi",      icon: "BarChart2",   color: "#f97316", label: "KPI" },
  { id: "risks",    icon: "ShieldAlert", color: "#f43f5e", label: "Риски" },
  { id: "salary",   icon: "Wallet",      color: "#8b5cf6", label: "Оплата труда" },
  { id: "strategy", icon: "Globe",       color: "#10b981", label: "Стратегия легализации" },
];

const SECTION_COMPONENTS: Record<Section, () => JSX.Element> = {
  mission: SectionMission, audience: SectionAudience, revenue: SectionRevenue,
  costs: SectionCosts, phases: SectionPhases, kpi: SectionKpi,
  risks: SectionRisks, salary: SectionSalary, strategy: SectionStrategy,
};

export default function EgsuBusiness() {
  const navigate = useNavigate();
  const [active, setActive] = useState<Section>("mission");

  const ActiveComponent = SECTION_COMPONENTS[active];
  const activeSection = SECTIONS.find(s => s.id === active)!;

  return (
    <div className="min-h-screen font-body" style={{ background: "#060a12" }}>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-3"
        style={{ background: "rgba(6,10,18,0.97)", borderBottom: "1px solid rgba(168,85,247,0.15)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/egsu")} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
            <Icon name="ChevronLeft" size={16} />
          </button>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
            <Icon name="TrendingUp" size={14} className="text-black" />
          </div>
          <div>
            <div className="font-display text-base font-bold text-white tracking-wide leading-none">БИЗНЕС-МОДЕЛЬ</div>
            <div className="text-white/30 text-[10px]">ЕЦСУ 2.0 · Стратегия и финансы</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/egsu/docs")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            <Icon name="FileText" size={13} />
            <span className="hidden md:inline">Документы</span>
          </button>
          <button onClick={() => navigate("/egsu/dashboard")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-black transition-colors"
            style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
            <Icon name="LayoutDashboard" size={13} />
            <span className="hidden md:inline">Дашборд</span>
          </button>
        </div>
      </nav>

      <div className="pt-16 pb-8 flex flex-col md:flex-row min-h-screen">
        <aside className="w-full md:w-64 shrink-0 flex md:flex-col gap-2 px-4 py-4 overflow-x-auto md:overflow-x-visible md:sticky md:top-16 md:h-[calc(100vh-4rem)]"
          style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="hidden md:block text-[10px] uppercase tracking-widest text-white/25 mb-2 pl-2">Разделы</div>
          {SECTIONS.map(({ id, icon, color, label }) => (
            <button key={id} onClick={() => setActive(id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all shrink-0"
              style={active === id
                ? { background: `${color}18`, border: `1px solid ${color}40`, color }
                : { border: "1px solid transparent", color: "rgba(255,255,255,0.4)" }}>
              <Icon name={icon as any} size={15} style={{ color: active === id ? color : undefined }} />
              <span className="text-xs font-medium whitespace-nowrap">{label}</span>
            </button>
          ))}
        </aside>

        <main className="flex-1 px-4 md:px-8 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${activeSection.color}20` }}>
                <Icon name={activeSection.icon as any} size={20} style={{ color: activeSection.color }} />
              </div>
              <div>
                <h1 className="text-white font-bold text-xl leading-none">{activeSection.label}</h1>
                <div className="text-white/30 text-xs mt-0.5">ЕЦСУ 2.0 · Бизнес-модель</div>
              </div>
            </div>
            <ActiveComponent />
          </div>
        </main>
      </div>
    </div>
  );
}
