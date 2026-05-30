import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const allNavItems: { id: Section; label: string; icon: string; color?: string; adminOnly?: boolean }[] = [
  { id: "overview", label: "Обзор", icon: "LayoutDashboard" },
  { id: "incidents", label: "Инциденты", icon: "AlertTriangle" },
  { id: "analytics", label: "ИИ-аналитика", icon: "BarChart3" },
  { id: "finance", label: "Финансы", icon: "DollarSign", adminOnly: true },
  { id: "organs", label: "Органы ECSU", icon: "Network" },
  { id: "security", label: "Безопасность", icon: "Shield", adminOnly: true },
  { id: "dalan", label: "Dalan ИИ", icon: "Brain", color: "#e94560", adminOnly: true },
  { id: "admin", label: "Администратор", icon: "Settings2", color: "#FFD700", adminOnly: true },
];

const topNav = [
  { label: "ЦПВОА",        route: null,                   section: "overview" as Section },
  { label: "Уведомления",  route: "/ecsu/notifications",  section: null },
  { label: "Финансы",      route: "/ecsu/finance",        section: null },
  { label: "Правовая база",route: "/ecsu/legal",          section: null },
  { label: "Инциденты",    route: null,                   section: "incidents" as Section },
  { label: "Аналитика",    route: null,                   section: "analytics" as Section },
  { label: "Органы ЕЦСУ",  route: null,                   section: "organs" as Section },
  { label: "Безопасность", route: null,                   section: "security" as Section },
  { label: "Dalan ИИ",     route: null,                   section: "dalan" as Section },
];

interface Props {
  onLogout: () => void;
  role: "admin" | "user";
  userName: string;
}

const EcsuSystem = ({ onLogout, role, userName }: Props) => {
  const navigate = useNavigate();
  const [active, setActive] = useState<Section>("overview");
  const [showAdmin, setShowAdmin] = useState(false);

  const navItems = allNavItems.filter((item) => !item.adminOnly || role === "admin");

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
              key={item.label}
              onClick={() => {
                if (item.route) navigate(item.route);
                else if (item.section) setActive(item.section);
              }}
              className={`shrink-0 px-3 py-1.5 rounded text-xs font-medium transition-colors border ${
                item.section && active === item.section
                  ? "text-blue-400 bg-blue-600/20 border-blue-900/50"
                  : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent hover:border-blue-900/50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 bg-blue-700 rounded-full flex items-center justify-center">
              <Icon name="User" size={12} className="text-white" />
            </div>
            <div>
              <div className="text-white text-xs font-medium leading-tight">{userName}</div>
              <div className="text-gray-500 text-[10px]">{role === "admin" ? "Администратор" : "Пользователь"}</div>
            </div>
          </div>
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <button onClick={onLogout} className="text-gray-500 hover:text-red-400 transition-colors">
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
              style={
                item.color && active !== item.id
                  ? { color: item.color + "99" }
                  : item.color && active === item.id
                  ? { color: item.color }
                  : {}
              }
            >
              <Icon name={item.icon} size={16} />
              <span>{item.label}</span>
            </button>
          ))}

          {role === "user" && (
            <div className="mx-3 mt-auto mb-2 bg-blue-900/20 border border-blue-900/30 rounded-lg px-3 py-2">
              <div className="text-blue-400 text-xs font-medium">Режим просмотра</div>
              <div className="text-gray-600 text-[10px] mt-0.5">Расширенный доступ — у администратора</div>
            </div>
          )}
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