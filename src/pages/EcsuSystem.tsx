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
import EcsuOwner from "@/components/ecsu/EcsuOwner";
import AdminPanel from "@/components/AdminPanel";

type Section = "overview" | "incidents" | "analytics" | "finance" | "organs" | "security" | "dalan" | "owner" | "admin";

interface Props {
  onLogout: () => void;
  role: "admin" | "user";
  userName: string;
}

const EcsuSystem = ({ onLogout, role, userName }: Props) => {
  const navigate = useNavigate();
  const [active, setActive] = useState<Section>("overview");
  const [showAdmin, setShowAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (showAdmin) {
    return <AdminPanel onLogout={() => setShowAdmin(false)} />;
  }

  const menuItems: { id: Section; label: string; icon: string; color?: string }[] = [
    { id: "overview", label: "Обзор", icon: "LayoutDashboard" },
    { id: "incidents", label: "Инциденты", icon: "AlertTriangle" },
    { id: "analytics", label: "ИИ-аналитика", icon: "BarChart3" },
    { id: "finance", label: "Финансы", icon: "DollarSign" },
    { id: "organs", label: "Органы ECSU", icon: "Network" },
    { id: "security", label: "Безопасность", icon: "Shield" },
    { id: "dalan", label: "Dalan ИИ", icon: "Brain", color: "#e94560" },
    { id: "owner", label: "Владелец", icon: "Crown", color: "#FFD700" },
  ];

  const sectionTitle: Record<Section, string> = {
    overview: "Обзор",
    incidents: "Инциденты",
    analytics: "ИИ-аналитика",
    finance: "Финансы",
    organs: "Органы ECSU",
    security: "Безопасность",
    dalan: "Dalan ИИ",
    owner: "Владелец",
    admin: "Администратор",
  };

  return (
    <div className="min-h-screen bg-[#080c1a] text-white flex flex-col">
      {/* Хедер */}
      <div className="bg-[#0d1225] border-b border-blue-900/40 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-1"
          >
            <span className="text-white font-bold text-sm">E</span>
          </button>
          <div>
            <div className="text-white font-bold text-sm leading-tight">ECSU 2.0</div>
            <div className="text-blue-400 text-[10px] leading-tight">Система управления</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse hidden sm:block" />
          <span className="text-white/40 text-xs font-mono hidden sm:block">
            {new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button
            onClick={() => navigate("/ecsu/notifications")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.3)" }}
          >
            ВИП-канал
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
            style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)" }}
          >
            Центр управления
            <Icon name="ChevronDown" size={12} />
          </button>
        </div>
      </div>

      {/* Выпадающее меню */}
      {menuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute top-14 right-4 w-56 rounded-xl overflow-hidden shadow-2xl"
            style={{ background: "#0d1225", border: "1px solid rgba(99,102,241,0.3)" }}
            onClick={e => e.stopPropagation()}
          >
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setActive(item.id); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-white/5 text-left"
                style={{ color: active === item.id ? (item.color || "#818cf8") : (item.color ? item.color + "99" : "rgba(255,255,255,0.6)") }}
              >
                <Icon name={item.icon} size={15} />
                {item.label}
                {active === item.id && <Icon name="Check" size={12} className="ml-auto" />}
              </button>
            ))}
            {role === "admin" && (
              <>
                <div className="h-px bg-white/10 mx-3" />
                <button
                  onClick={() => { setShowAdmin(true); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-white/5"
                  style={{ color: "#FFD70099" }}
                >
                  <Icon name="Settings2" size={15} />
                  Администратор
                </button>
              </>
            )}
            <div className="h-px bg-white/10 mx-3" />
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400/70 hover:text-red-400 transition-colors"
            >
              <Icon name="LogOut" size={15} />
              Выйти
            </button>
          </div>
        </div>
      )}

      {/* Контент */}
      <div className="flex-1 overflow-auto">
        {active === "overview" && <EcsuOverview />}
        {active === "incidents" && <EcsuIncidents />}
        {active === "analytics" && <EcsuAnalytics />}
        {active === "finance" && <EcsuFinance />}
        {active === "organs" && <EcsuOrgans />}
        {active === "security" && <EcsuSecurity />}
        {active === "dalan" && <EcsuDalan />}
        {active === "owner" && <EcsuOwner />}
      </div>
    </div>
  );
};

export default EcsuSystem;
