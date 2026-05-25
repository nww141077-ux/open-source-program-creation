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
import EcsuOwner from "@/components/ecsu/EcsuOwner";
import EcsuKovcheg from "@/components/ecsu/EcsuKovcheg";
import EcsuUpdateManager from "@/components/ecsu/EcsuUpdateManager";
import EcsuGraphium from "@/components/ecsu/EcsuGraphium";

type Section =
  | "overview" | "incidents" | "forecast" | "analytics"
  | "organs" | "security" | "license" | "loader" | "settings"
  | "finance" | "dalan" | "tahka" | "admin" | "owner" | "graphium" | "cpvoa" | "kovcheg";

// ── Верхняя навигация (цветные таблетки)
const topNavItems: { id: Section | "cpvoa" | "updates" | "uved" | "vozm" | "admin_btn"; label: string; icon: string; color: string; bg: string; adminOnly?: boolean }[] = [
  { id: "cpvoa",     label: "ЦПВОА",        icon: "Radar",           color: "#34d399", bg: "#1a3d2e" },
  { id: "uved",      label: "Уведомления",  icon: "Bell",            color: "#f59e0b", bg: "#2d2a14" },
  { id: "analytics", label: "Аналитика",    icon: "BarChart2",       color: "#a78bfa", bg: "#2d1f4a" },
  { id: "organs",    label: "Поглощение",   icon: "Zap",             color: "#e94560", bg: "#3d1520" },
  { id: "finance",   label: "Финансы",      icon: "DollarSign",      color: "#fbbf24", bg: "#3d2e00", adminOnly: true },
  { id: "owner",     label: "Владелец",     icon: "Crown",           color: "#f97316", bg: "#3d1f00" },
  { id: "license",   label: "Правовая база",icon: "Scale",           color: "#60a5fa", bg: "#1e3a5f" },
  { id: "dalan",     label: "API",          icon: "Code2",           color: "#34d399", bg: "#1a3d2e", adminOnly: true },
  { id: "loader",    label: "Документы",    icon: "FileText",        color: "#94a3b8", bg: "#1e2533" },
  { id: "forecast",  label: "Пользователи", icon: "Users",           color: "#a78bfa", bg: "#2d1f4a" },
  { id: "security",  label: "Вознаграждения",icon: "Gift",           color: "#fbbf24", bg: "#3d2e00" },
  { id: "tahka",     label: "Экстренные",   icon: "Siren",           color: "#e94560", bg: "#3d1520", adminOnly: true },
  { id: "vozm",      label: "Возможности",  icon: "Sparkles",        color: "#34d399", bg: "#1a3d2e" },
  { id: "admin_btn", label: "Аналитика",    icon: "Settings2",       color: "#FFD700", bg: "#2a2000", adminOnly: true },
];

// ── Боковое меню (как на скриншоте)
const sideNavItems: { id: Section; label: string; icon: string }[] = [
  { id: "overview",   label: "Обзор",         icon: "LayoutDashboard" },
  { id: "incidents",  label: "Инциденты",     icon: "AlertTriangle" },
  { id: "forecast",   label: "Прогнозы",      icon: "TrendingUp" },
  { id: "analytics",  label: "ИИ-аналитика",  icon: "BrainCircuit" },
  { id: "organs",     label: "Органы ECSU",   icon: "Network" },
  { id: "security",   label: "Безопасность",  icon: "ShieldCheck" },
  { id: "license",    label: "Лицензия",      icon: "Scale" },
  { id: "loader",     label: "Загрузчик",     icon: "Upload" },
  { id: "settings",   label: "Настройки",     icon: "Settings" },
];

interface Props {
  onLogout: () => void;
  role: "admin" | "user";
  userName: string;
}

const EcsuSystem = ({ onLogout, role, userName }: Props) => {
  const [active, setActive] = useState<Section>("overview");
  const [showAdmin, setShowAdmin]     = useState(false);
  const [showMuson, setShowMuson]     = useState(false);
  const [showUpdates, setShowUpdates] = useState(false);

  if (showAdmin) {
    return <AdminPanel onLogout={() => setShowAdmin(false)} />;
  }

  const handleTopNav = (id: string) => {
    if (id === "cpvoa")     { setActive("cpvoa"); return; }
    if (id === "updates")   { setShowUpdates(true); return; }
    if (id === "admin_btn") { setShowAdmin(true); return; }
    if (id === "uved")      { setActive("incidents"); return; }
    if (id === "vozm")      { setActive("forecast"); return; }
    setActive(id as Section);
  };

  return (
    <div className="h-screen bg-[#080c1a] text-white flex flex-col overflow-hidden">

      {/* ═══════════ ВЕРХНЯЯ ПОЛОСА ═══════════ */}
      <div className="bg-[#0a0f1e] border-b border-blue-900/40 px-3 py-1.5 flex items-center gap-2 shrink-0">

        {/* Лого */}
        <div className="flex items-center gap-1.5 mr-1 shrink-0">
          <div className="w-9 h-9 bg-[#0d1225] border border-blue-800/50 rounded-lg flex flex-col items-center justify-center">
            <div className="text-blue-400 font-black text-[7px] leading-tight">ЦЕНТР</div>
            <div className="text-blue-400 font-black text-[7px] leading-tight">ЗАДАЧ</div>
            <div className="text-blue-300 font-black text-[6px] leading-tight">(ЦЗ)</div>
          </div>
          <div>
            <div className="text-white font-bold text-[10px] leading-tight">ECSU 2.0</div>
            <div className="text-blue-400 text-[8px] leading-tight">Аналитика</div>
          </div>
        </div>

        {/* Поиск */}
        <div className="flex items-center gap-1.5 bg-[#0d1225] border border-blue-900/30 rounded-md px-2 py-1 shrink-0">
          <Icon name="Search" size={10} className="text-gray-500" />
          <span className="text-gray-500 text-[10px]">Поиск</span>
        </div>

        {/* Цветные кнопки навигации */}
        <div className="flex gap-1 overflow-x-auto flex-1" style={{ scrollbarWidth: "none" }}>
          {topNavItems
            .filter(item => !item.adminOnly || role === "admin")
            .map((item) => {
              const isActive = item.id === active ||
                (item.id === "uved" && active === "incidents") ||
                (item.id === "vozm" && active === "forecast");
              return (
                <button
                  key={item.id}
                  onClick={() => handleTopNav(item.id)}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all hover:opacity-90 border"
                  style={{
                    background: isActive ? item.bg + "ff" : item.bg + "bb",
                    color: item.color,
                    borderColor: isActive ? item.color + "66" : item.color + "22",
                    boxShadow: isActive ? `0 0 8px ${item.color}44` : "none",
                  }}
                >
                  <Icon name={item.icon} size={10} style={{ color: item.color }} />
                  {item.label}
                </button>
              );
            })}
        </div>

        {/* Правый блок */}
        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          <button
            onClick={() => setShowMuson(true)}
            className="flex items-center gap-1 px-2 py-1 bg-blue-900/30 border border-blue-700/30 rounded-md hover:bg-blue-800/40 transition-colors"
            title="Мусон-Агент"
          >
            <Icon name="CloudCog" size={10} className="text-blue-400" />
            <span className="text-blue-400 text-[9px]">МУСОН</span>
          </button>
          <button
            onClick={() => setShowUpdates(true)}
            className="flex items-center gap-1 px-2 py-1 bg-[#1a3d2e]/60 border border-[#34d399]/30 rounded-md hover:bg-[#1a3d2e] transition-colors"
            title="Обновления"
          >
            <Icon name="Download" size={10} className="text-[#34d399]" />
          </button>
          <div className="flex items-center gap-1 bg-[#0d1225] border border-blue-900/30 rounded-md px-2 py-1">
            <div className="w-4 h-4 bg-blue-700 rounded-full flex items-center justify-center">
              <Icon name="User" size={8} className="text-white" />
            </div>
            <span className="text-white text-[9px]">{userName}</span>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 bg-[#e94560]/20 border border-[#e94560]/30 rounded-md hover:bg-[#e94560]/30 transition-colors"
          >
            <Icon name="LogOut" size={10} className="text-[#e94560]" />
          </button>
        </div>
      </div>

      {/* ═══════════ ОСНОВНОЙ КОНТЕНТ (сайдбар + страница) ═══════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── БОКОВОЕ МЕНЮ (как на скриншоте) ── */}
        <div className="w-[148px] shrink-0 bg-[#0a0f1e] border-r border-blue-900/20 flex flex-col py-2 overflow-y-auto">
          {sideNavItems.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-left transition-all group ${
                  isActive
                    ? "bg-[#1e3a5f]/60 border-r-2 border-[#60a5fa]"
                    : "hover:bg-white/5 border-r-2 border-transparent"
                }`}
              >
                <Icon
                  name={item.icon}
                  size={14}
                  className={isActive ? "text-[#60a5fa]" : "text-gray-500 group-hover:text-gray-300"}
                />
                <span className={`text-xs font-medium leading-tight ${isActive ? "text-white" : "text-gray-500 group-hover:text-gray-300"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Разделитель */}
          <div className="mx-3 my-2 border-t border-blue-900/20" />

          {/* Графиум */}
          <button
            onClick={() => setActive("graphium")}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-left transition-all group ${
              active === "graphium"
                ? "bg-purple-900/20 border-r-2 border-purple-500"
                : "hover:bg-white/5 border-r-2 border-transparent"
            }`}
          >
            <Icon name="BookOpen" size={14} className={active === "graphium" ? "text-purple-400" : "text-gray-500 group-hover:text-gray-300"} />
            <span className={`text-xs font-medium ${active === "graphium" ? "text-purple-300" : "text-gray-500 group-hover:text-gray-300"}`}>
              Графиум
            </span>
          </button>

          {/* Админ-пункты */}
          {role === "admin" && (
            <>
              <div className="mx-3 my-1 border-t border-blue-900/20" />
              <button
                onClick={() => setActive("finance")}
                className={`flex items-center gap-2.5 px-4 py-2 text-left transition-all group ${
                  active === "finance" ? "bg-yellow-900/20 border-r-2 border-yellow-500" : "hover:bg-white/5 border-r-2 border-transparent"
                }`}
              >
                <Icon name="DollarSign" size={13} className={active === "finance" ? "text-yellow-400" : "text-gray-600 group-hover:text-gray-400"} />
                <span className={`text-[11px] font-medium ${active === "finance" ? "text-yellow-300" : "text-gray-600 group-hover:text-gray-400"}`}>Финансы</span>
              </button>
              <button
                onClick={() => setActive("owner")}
                className={`flex items-center gap-2.5 px-4 py-2 text-left transition-all group ${
                  active === "owner" ? "bg-orange-900/20 border-r-2 border-orange-500" : "hover:bg-white/5 border-r-2 border-transparent"
                }`}
              >
                <Icon name="Crown" size={13} className={active === "owner" ? "text-orange-400" : "text-gray-600 group-hover:text-gray-400"} />
                <span className={`text-[11px] font-medium ${active === "owner" ? "text-orange-300" : "text-gray-600 group-hover:text-gray-400"}`}>Владелец</span>
              </button>
              <button
                onClick={() => setActive("kovcheg")}
                className={`flex items-center gap-2.5 px-4 py-2 text-left transition-all group ${
                  active === "kovcheg" ? "bg-cyan-900/20 border-r-2 border-cyan-500" : "hover:bg-white/5 border-r-2 border-transparent"
                }`}
              >
                <Icon name="Anchor" size={13} className={active === "kovcheg" ? "text-cyan-400" : "text-gray-600 group-hover:text-gray-400"} />
                <span className={`text-[11px] font-medium ${active === "kovcheg" ? "text-cyan-300" : "text-gray-600 group-hover:text-gray-400"}`}>Ковчег</span>
              </button>
              <button
                onClick={() => setActive("tahka")}
                className={`flex items-center gap-2.5 px-4 py-2 text-left transition-all group ${
                  active === "tahka" ? "bg-red-900/20 border-r-2 border-red-500" : "hover:bg-white/5 border-r-2 border-transparent"
                }`}
              >
                <Icon name="Siren" size={13} className={active === "tahka" ? "text-red-400" : "text-gray-600 group-hover:text-gray-400"} />
                <span className={`text-[11px] font-medium ${active === "tahka" ? "text-red-300" : "text-gray-600 group-hover:text-gray-400"}`}>Экстренные</span>
              </button>
              <button
                onClick={() => setActive("dalan")}
                className={`flex items-center gap-2.5 px-4 py-2 text-left transition-all group ${
                  active === "dalan" ? "bg-green-900/20 border-r-2 border-green-500" : "hover:bg-white/5 border-r-2 border-transparent"
                }`}
              >
                <Icon name="Code2" size={13} className={active === "dalan" ? "text-green-400" : "text-gray-600 group-hover:text-gray-400"} />
                <span className={`text-[11px] font-medium ${active === "dalan" ? "text-green-300" : "text-gray-600 group-hover:text-gray-400"}`}>API</span>
              </button>
              <button
                onClick={() => setShowAdmin(true)}
                className="flex items-center gap-2.5 px-4 py-2 text-left transition-all hover:bg-white/5 border-r-2 border-transparent group"
              >
                <Icon name="Settings2" size={13} className="text-yellow-600 group-hover:text-yellow-400" />
                <span className="text-[11px] font-medium text-yellow-600 group-hover:text-yellow-400">Администратор</span>
              </button>
            </>
          )}
        </div>

        {/* ── КОНТЕНТ ── */}
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
          {active === "owner"     && <EcsuOwner />}
          {active === "graphium"  && <EcsuGraphium />}
          {active === "cpvoa"     && <EcsuCpvoa />}
          {active === "kovcheg"   && <EcsuKovcheg />}
        </div>
      </div>

      <FloatingAiChat />
      {showMuson   && <EcsuMusonSync   onClose={() => setShowMuson(false)} />}
      {showUpdates && <EcsuUpdateManager onClose={() => setShowUpdates(false)} />}
    </div>
  );
};

export default EcsuSystem;