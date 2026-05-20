import { useState } from "react";
import Icon from "@/components/ui/icon";
import EcsuOverview from "@/components/ecsu/EcsuOverview";
import EcsuIncidents from "@/components/ecsu/EcsuIncidents";
import EcsuAnalytics from "@/components/ecsu/EcsuAnalytics";
import EcsuFinance from "@/components/ecsu/EcsuFinance";
import EcsuOrgans from "@/components/ecsu/EcsuOrgans";
import EcsuSecurity from "@/components/ecsu/EcsuSecurity";
import EcsuDalan from "@/components/ecsu/EcsuDalan";
import EcsuForecast from "@/components/ecsu/EcsuForecast";
import EcsuLicense from "@/components/ecsu/EcsuLicense";
import EcsuLoader from "@/components/ecsu/EcsuLoader";
import EcsuSettings from "@/components/ecsu/EcsuSettings";
import AdminPanel from "@/components/AdminPanel";
import FloatingAiChat from "@/components/ecsu/FloatingAiChat";
import EcsuCpvoa from "@/components/ecsu/EcsuCpvoa";
import EcsuMusonSync from "@/components/ecsu/EcsuMusonSync";
import EcsuTahkaOS from "@/components/ecsu/EcsuTahkaOS";

type Section =
  | "overview" | "incidents" | "forecast" | "analytics"
  | "organs" | "security" | "license" | "loader" | "settings"
  | "finance" | "dalan" | "tahka" | "admin";

// ── Основная навигация (левая панель быстрых кнопок на скриншоте 17 апр)
const quickNavItems: { id: Section; label: string; icon: string; color: string; bg: string; adminOnly?: boolean }[] = [
  { id: "overview",   label: "Обзор",        icon: "LayoutDashboard", color: "#60a5fa", bg: "#1e3a5f" },
  { id: "incidents",  label: "Инциденты",    icon: "AlertTriangle",   color: "#e94560", bg: "#3d1520" },
  { id: "analytics",  label: "Аналитика",    icon: "BarChart2",       color: "#a78bfa", bg: "#2d1f4a" },
  { id: "organs",     label: "Поглощение",   icon: "Zap",             color: "#e94560", bg: "#3d1520" },
  { id: "finance",    label: "Финансы",      icon: "DollarSign",      color: "#fbbf24", bg: "#3d2e00", adminOnly: true },
  { id: "settings",   label: "Владелец",     icon: "Crown",           color: "#f97316", bg: "#3d1f00" },
  { id: "license",    label: "Правовая база",icon: "Scale",           color: "#60a5fa", bg: "#1e3a5f" },
  { id: "dalan",      label: "API",          icon: "Code2",           color: "#34d399", bg: "#1a3d2e", adminOnly: true },
  { id: "loader",     label: "Документы",    icon: "FileText",        color: "#94a3b8", bg: "#1e2533" },
  { id: "forecast",   label: "Пользователями",icon: "Users",          color: "#a78bfa", bg: "#2d1f4a" },
  { id: "security",   label: "Вознаграждения",icon: "Gift",           color: "#fbbf24", bg: "#3d2e00" },
  { id: "tahka",      label: "Экстренные",   icon: "Siren",           color: "#e94560", bg: "#3d1520", adminOnly: true },
];

interface Props {
  onLogout: () => void;
  role: "admin" | "user";
  userName: string;
}

const EcsuSystem = ({ onLogout, role, userName }: Props) => {
  const [active, setActive] = useState<Section>("overview");
  const [showAdmin, setShowAdmin] = useState(false);
  const [showCpvoa, setShowCpvoa] = useState(false);
  const [showMuson, setShowMuson] = useState(false);

  const navItems = quickNavItems.filter(item => !item.adminOnly || role === "admin");

  if (showAdmin) {
    return <AdminPanel onLogout={() => setShowAdmin(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#080c1a] text-white flex flex-col">

      {/* ═══════════════ ВЕРХНЯЯ ПОЛОСА (как на скриншоте 17 апр) ═══════════════ */}
      <div className="bg-[#0a0f1e] border-b border-blue-900/40 px-3 py-1.5 flex items-center gap-2">

        {/* Лого ЦЗ */}
        <div className="flex items-center gap-1.5 mr-2 shrink-0">
          <div className="w-9 h-9 bg-[#0d1225] border border-blue-800/50 rounded-lg flex flex-col items-center justify-center">
            <div className="text-blue-400 font-black text-[8px] leading-tight">ЦЕНТР</div>
            <div className="text-blue-400 font-black text-[8px] leading-tight">ЗАДАЧ</div>
            <div className="text-blue-300 font-black text-[7px] leading-tight">(ЦЗ)</div>
          </div>
          <div>
            <div className="text-white font-bold text-[10px] leading-tight">ECSU 2.0</div>
            <div className="text-blue-400 text-[8px]">Единая ЦСУ</div>
          </div>
        </div>

        {/* Навигационные вкладки */}
        <div className="flex gap-1 overflow-x-auto flex-1" style={{ scrollbarWidth: "none" }}>
          {/* ЦПВОА — специальная кнопка */}
          <button
            onClick={() => setShowCpvoa(true)}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all hover:opacity-90 border border-white/10"
            style={{ background: "#1a3d2e", color: "#34d399" }}
          >
            <Icon name="Radar" size={10} style={{ color: "#34d399" }} />
            ЦПВОА
          </button>

          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all hover:opacity-90 border"
              style={{
                background: active === item.id ? item.bg + "dd" : item.bg,
                color: item.color,
                borderColor: active === item.id ? item.color + "55" : "rgba(255,255,255,0.08)",
                boxShadow: active === item.id ? `0 0 8px ${item.color}33` : "none",
              }}
            >
              <Icon name={item.icon} size={10} style={{ color: item.color }} />
              {item.label}
            </button>
          ))}

          {/* Уведомления */}
          <button
            className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all hover:opacity-90 border border-white/10"
            style={{ background: "#2d2a14", color: "#f59e0b" }}
          >
            <Icon name="Bell" size={10} style={{ color: "#f59e0b" }} />
            Уведомления
          </button>

          {/* Возможности */}
          <button
            className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all hover:opacity-90 border border-white/10"
            style={{ background: "#1a3d2e", color: "#34d399" }}
          >
            <Icon name="Sparkles" size={10} style={{ color: "#34d399" }} />
            Возможности
          </button>

          {/* Администратор (только admin) */}
          {role === "admin" && (
            <button
              onClick={() => setShowAdmin(true)}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all hover:opacity-90 border border-yellow-900/40"
              style={{ background: "#2a2000", color: "#FFD700" }}
            >
              <Icon name="Settings2" size={10} style={{ color: "#FFD700" }} />
              Администратор
            </button>
          )}
        </div>

        {/* Правый блок: пользователь + мусон + выход */}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <div className="flex items-center gap-1.5 bg-[#0d1225] border border-blue-900/30 rounded-lg px-2 py-1">
            <div className="w-5 h-5 bg-blue-700 rounded-full flex items-center justify-center">
              <Icon name="User" size={10} className="text-white" />
            </div>
            <div>
              <div className="text-white text-[10px] font-medium leading-tight">{userName}</div>
              <div className="text-gray-500 text-[8px]">{role === "admin" ? "Администратор" : "Пользователь"}</div>
            </div>
          </div>
          <button
            onClick={() => setShowMuson(true)}
            className="flex items-center gap-1 px-2 py-1 bg-blue-900/40 border border-blue-700/40 rounded-lg hover:bg-blue-800/50 transition-colors"
            title="Мусон-Агент · Синхронизация ПК"
          >
            <Icon name="CloudCog" size={12} className="text-blue-400" />
            <span className="text-blue-400 text-[9px] font-semibold">МУСОН</span>
          </button>
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <button onClick={onLogout} className="text-gray-500 hover:text-red-400 transition-colors p-1">
            <Icon name="LogOut" size={14} />
          </button>
        </div>
      </div>

      {/* ═══════════════ КОНТЕНТ ═══════════════ */}
      <div className="flex-1 overflow-auto">
        {active === "overview"  && <EcsuOverview />}
        {active === "incidents" && <EcsuIncidents />}
        {active === "forecast"  && <EcsuForecast />}
        {active === "analytics" && <EcsuAnalytics />}
        {active === "organs"    && <EcsuOrgans />}
        {active === "security"  && <EcsuSecurity />}
        {active === "license"   && <EcsuLicense />}
        {active === "loader"    && <EcsuLoader />}
        {active === "settings"  && <EcsuSettings />}
        {active === "finance"   && <EcsuFinance />}
        {active === "dalan"     && <EcsuDalan />}
        {active === "tahka"     && <EcsuTahkaOS />}
      </div>

      <FloatingAiChat />
      {showCpvoa && <EcsuCpvoa onClose={() => setShowCpvoa(false)} />}
      {showMuson && <EcsuMusonSync onClose={() => setShowMuson(false)} />}
    </div>
  );
};

export default EcsuSystem;
