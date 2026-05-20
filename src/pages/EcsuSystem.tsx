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

type Section = "overview" | "incidents" | "forecast" | "analytics" | "organs" | "security" | "license" | "loader" | "settings" | "finance" | "dalan" | "admin";

const allNavItems: { id: Section; label: string; icon: string; color?: string; adminOnly?: boolean }[] = [
  { id: "overview", label: "Обзор", icon: "LayoutDashboard" },
  { id: "incidents", label: "Инциденты", icon: "AlertTriangle" },
  { id: "forecast", label: "Прогнозы", icon: "TrendingUp" },
  { id: "analytics", label: "ИИ-аналитика", icon: "BarChart3" },
  { id: "organs", label: "Органы ECSU", icon: "Network" },
  { id: "security", label: "Безопасность", icon: "Shield" },
  { id: "license", label: "Лицензия", icon: "BadgeCheck" },
  { id: "loader", label: "Загрузчик", icon: "Upload" },
  { id: "settings", label: "Настройки", icon: "Settings" },
  { id: "finance", label: "Финансы", icon: "DollarSign", adminOnly: true },
  { id: "dalan", label: "Dalan ИИ", icon: "Brain", color: "#e94560", adminOnly: true },
  { id: "admin", label: "Администратор", icon: "Settings2", color: "#FFD700", adminOnly: true },
];

const topNavItems = [
  { label: "Поиск", icon: "Search", color: "#60a5fa" },
  { label: "ЦПВОА", icon: "Radar", color: "#34d399" },
  { label: "Уведомления", icon: "Bell", color: "#f59e0b" },
  { label: "Аналитика", icon: "BarChart2", color: "#a78bfa" },
  { label: "Поглощение", icon: "Zap", color: "#e94560" },
  { label: "Финансы", icon: "DollarSign", color: "#fbbf24" },
  { label: "Владелец", icon: "Crown", color: "#f97316" },
  { label: "Правовая база", icon: "Scale", color: "#60a5fa" },
  { label: "API", icon: "Code2", color: "#34d399" },
  { label: "Документы", icon: "FileText", color: "#94a3b8" },
  { label: "Пользователи", icon: "Users", color: "#a78bfa" },
  { label: "Вознаграждения", icon: "Gift", color: "#fbbf24" },
  { label: "Экстренная", icon: "Siren", color: "#e94560" },
  { label: "Возможности", icon: "Sparkles", color: "#34d399" },
];

const tabColors: Record<string, string> = {
  "Поиск": "#1e3a5f",
  "ЦПВОА": "#1a3d2e",
  "Уведомления": "#2d2a14",
  "Аналитика": "#2d1f4a",
  "Поглощение": "#3d1520",
  "Финансы": "#3d2e00",
  "Владелец": "#3d1f00",
  "Правовая база": "#1e3a5f",
  "API": "#1a3d2e",
  "Документы": "#1e2533",
  "Пользователи": "#2d1f4a",
  "Вознаграждения": "#3d2e00",
  "Экстренная": "#3d1520",
  "Возможности": "#1a3d2e",
};

interface Props {
  onLogout: () => void;
  role: "admin" | "user";
  userName: string;
}

const EcsuSystem = ({ onLogout, role, userName }: Props) => {
  const [active, setActive] = useState<Section>("overview");
  const [showAdmin, setShowAdmin] = useState(false);

  const navItems = allNavItems.filter((item) => !item.adminOnly || role === "admin");

  if (showAdmin) {
    return <AdminPanel onLogout={() => setShowAdmin(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#080c1a] text-white flex flex-col">
      {/* Top bar */}
      <div className="bg-[#0a0f1e] border-b border-blue-900/40 px-3 py-1.5 flex items-center gap-2">
        {/* Logo */}
        <div className="flex items-center gap-1.5 mr-2 shrink-0">
          <div className="w-9 h-9 bg-[#0d1225] border border-blue-800/50 rounded-lg flex flex-col items-center justify-center">
            <div className="text-blue-400 font-black text-[8px] leading-tight">ЦЕНТР</div>
            <div className="text-blue-400 font-black text-[8px] leading-tight">ЗАДАЧ</div>
            <div className="text-blue-300 font-black text-[7px] leading-tight">(ЦЗ)</div>
          </div>
          <div>
            <div className="text-white font-bold text-[10px] leading-tight">ECSU 2.0</div>
            <div className="text-blue-400 text-[8px]">Аналитика</div>
          </div>
        </div>

        {/* Nav tabs */}
        <div className="flex gap-1 overflow-x-auto flex-1" style={{ scrollbarWidth: "none" }}>
          {topNavItems.map((item) => (
            <button
              key={item.label}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all hover:opacity-90 border border-white/10"
              style={{
                background: tabColors[item.label] || "#1a2030",
                color: item.color,
              }}
            >
              <Icon name={item.icon} size={10} style={{ color: item.color }} />
              {item.label}
            </button>
          ))}
        </div>

        {/* User */}
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
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <button onClick={onLogout} className="text-gray-500 hover:text-red-400 transition-colors p-1">
            <Icon name="LogOut" size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-44 bg-[#080c1a] border-r border-blue-900/20 flex flex-col py-2 gap-0.5 shrink-0">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => item.id === "admin" ? setShowAdmin(true) : setActive(item.id)}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-all text-left rounded-none ${
                active === item.id
                  ? "bg-[#1a1f3a] text-white border-l-2 border-blue-400"
                  : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
              }`}
              style={
                item.color
                  ? { color: active === item.id ? item.color : item.color + "88" }
                  : {}
              }
            >
              <Icon name={item.icon} size={15} />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {active === "overview" && <EcsuOverview />}
          {active === "incidents" && <EcsuIncidents />}
          {active === "forecast" && <EcsuForecast />}
          {active === "analytics" && <EcsuAnalytics />}
          {active === "organs" && <EcsuOrgans />}
          {active === "security" && <EcsuSecurity />}
          {active === "license" && <EcsuLicense />}
          {active === "loader" && <EcsuLoader />}
          {active === "settings" && <EcsuSettings />}
          {active === "finance" && <EcsuFinance />}
          {active === "dalan" && <EcsuDalan />}
        </div>
      </div>
      <FloatingAiChat />
    </div>
  );
};

export default EcsuSystem;