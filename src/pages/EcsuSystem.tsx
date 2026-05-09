import { useState } from "react";
import Icon from "@/components/ui/icon";
import EcsuOverview from "@/components/ecsu/EcsuOverview";
import EcsuIncidents from "@/components/ecsu/EcsuIncidents";
import EcsuAnalytics from "@/components/ecsu/EcsuAnalytics";
import EcsuFinance from "@/components/ecsu/EcsuFinance";
import EcsuOrgans from "@/components/ecsu/EcsuOrgans";
import EcsuSecurity from "@/components/ecsu/EcsuSecurity";
import EcsuDalan from "@/components/ecsu/EcsuDalan";
import AdminPanel from "@/components/AdminPanel";

type Section = "overview" | "incidents" | "analytics" | "finance" | "organs" | "security" | "dalan" | "admin";

const navItems: { id: Section; label: string; icon: string; color?: string }[] = [
  { id: "overview", label: "Обзор", icon: "LayoutDashboard" },
  { id: "incidents", label: "Инциденты", icon: "AlertTriangle" },
  { id: "analytics", label: "ИИ-аналитика", icon: "BarChart3" },
  { id: "finance", label: "Финансы", icon: "DollarSign" },
  { id: "organs", label: "Органы ECSU", icon: "Network" },
  { id: "security", label: "Безопасность", icon: "Shield" },
  { id: "dalan", label: "Dalan ИИ", icon: "Brain", color: "#e94560" },
  { id: "admin", label: "Администратор", icon: "Settings2", color: "#FFD700" },
];

const topNav = ["Поиск", "ЦПВОА", "Уведомления", "Аналитика", "Поглощение", "Финансы", "Владелец", "Правовая база", "API"];

interface Props {
  onLogout: () => void;
}

const EcsuSystem = ({ onLogout }: Props) => {
  const [active, setActive] = useState<Section>("overview");
  const [showAdmin, setShowAdmin] = useState(false);

  if (showAdmin) {
    return <AdminPanel onLogout={() => setShowAdmin(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#080c1a] text-white flex flex-col">
      {/* Top bar */}
      <div className="bg-[#0d1225] border-b border-blue-900/40 px-4 py-2 flex items-center gap-2 overflow-x-auto">
        <div className="flex items-center gap-2 mr-4 shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Icon name="Shield" size={16} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-xs leading-tight">ЦЕНТР ЗАДАЧ (ЦЗ)</div>
            <div className="text-blue-400 text-[10px]">ECSU 2.0 · Аналитика</div>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {topNav.map((item) => (
            <button
              key={item}
              className="shrink-0 px-3 py-1.5 rounded text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-blue-900/50"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-xs">Онлайн</span>
          <button onClick={onLogout} className="text-gray-500 hover:text-red-400 transition-colors ml-2">
            <Icon name="LogOut" size={15} />
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-48 bg-[#0a0f1e] border-r border-blue-900/30 flex flex-col py-3 gap-0.5 shrink-0">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => item.id === "admin" ? setShowAdmin(true) : setActive(item.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-all text-left ${
                active === item.id
                  ? "bg-blue-600/20 text-blue-400 border-r-2 border-blue-400"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              style={item.color && active !== item.id ? { color: item.color + "99" } : item.color && active === item.id ? { color: item.color } : {}}
            >
              <Icon name={item.icon} size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {active === "overview" && <EcsuOverview />}
          {active === "incidents" && <EcsuIncidents />}
          {active === "analytics" && <EcsuAnalytics />}
          {active === "finance" && <EcsuFinance />}
          {active === "organs" && <EcsuOrgans />}
          {active === "security" && <EcsuSecurity />}
          {active === "dalan" && <EcsuDalan />}
        </div>
      </div>
    </div>
  );
};

export default EcsuSystem;
