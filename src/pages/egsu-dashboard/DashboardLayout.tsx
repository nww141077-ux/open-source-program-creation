/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import AiChat from "@/components/AiChat";
import EgsuSearch from "@/components/EgsuSearch";

type NavTab = "overview" | "incidents" | "predicted" | "ai" | "organs" | "security" | "license" | "loader" | "settings";

type Props = {
  activeTab: NavTab;
  setActiveTab: (t: NavTab) => void;
  chatOpen: boolean;
  setChatOpen: (v: boolean) => void;
  children: React.ReactNode;
};

export default function DashboardLayout({ activeTab, setActiveTab, chatOpen, setChatOpen, children }: Props) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen font-body" style={{ background: "#060a12" }}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-3"
        style={{ background: "rgba(6,10,18,0.97)", borderBottom: "1px solid rgba(168,85,247,0.15)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/egsu")} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
            <Icon name="ChevronLeft" size={16} />
          </button>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
            <Icon name="LayoutDashboard" size={14} className="text-white" />
          </div>
          <div>
            <div className="font-display text-base font-bold text-white tracking-wide leading-none">ДАШБОРД КООРДИНАТОРА</div>
            <div className="text-white/30 text-[10px]">ЕЦСУ 2.0 · Аналитика</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EgsuSearch />
          <button onClick={() => navigate("/egsu/cpvoa")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
            style={{ background: "rgba(76,175,80,0.12)", color: "#4CAF50", border: "1px solid rgba(76,175,80,0.25)" }}>
            <Icon name="Radio" size={14} />
            <span className="hidden md:block">ЦПВОА</span>
          </button>
          <button onClick={() => navigate("/egsu/notifications")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
            style={{ background: "rgba(168,85,247,0.12)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.25)" }}>
            <Icon name="Bell" size={14} />
            <span className="hidden md:block">Уведомления</span>
          </button>
          <button onClick={() => navigate("/egsu/analytics")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
            style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.25)" }}>
            <Icon name="BarChart3" size={14} />
            <span className="hidden md:block">Аналитика</span>
          </button>
          <button onClick={() => navigate("/egsu/security")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
            style={{ background: "rgba(244,63,94,0.12)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.25)" }}>
            <Icon name="ShieldAlert" size={14} />
            <span className="hidden md:block">Поглощение</span>
          </button>
          <button onClick={() => navigate("/egsu/finance")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
            style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}>
            <Icon name="Wallet" size={14} />
            <span className="hidden md:block">Финансы</span>
          </button>
          <button onClick={() => navigate("/egsu/owner")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
            style={{ background: "rgba(168,85,247,0.08)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.2)" }}>
            <Icon name="Crown" size={14} />
            <span className="hidden md:block">Владелец</span>
          </button>
          <button onClick={() => navigate("/egsu/legal")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
            style={{ background: "rgba(0,255,135,0.1)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.2)" }}>
            <Icon name="Scale" size={14} />
            <span className="hidden md:block">Правовая база</span>
          </button>
          <button onClick={() => navigate("/egsu/api")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
            style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.25)" }}>
            <Icon name="Plug" size={14} />
            <span className="hidden md:block">API</span>
          </button>
          <button onClick={() => navigate("/egsu/docs")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
            style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }}>
            <Icon name="FileText" size={14} />
            <span className="hidden md:block">Документы</span>
          </button>
          <button onClick={() => navigate("/egsu/rewards")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
            style={{ background: "rgba(0,255,135,0.1)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.25)" }}>
            <Icon name="Coins" size={14} />
            <span className="hidden md:block">Вознаграждения</span>
          </button>
          <button onClick={() => navigate("/egsu/emergency")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
            style={{ background: "rgba(244,63,94,0.15)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.3)" }}>
            <Icon name="ShieldAlert" size={14} />
            <span className="hidden md:block">Экстренные</span>
          </button>
          <button onClick={() => navigate("/egsu/install")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
            style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}>
            <Icon name="Download" size={14} />
            <span className="hidden md:block">Установить</span>
          </button>
          <button onClick={() => navigate("/egsu/report")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-black transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #f43f5e, #f59e0b)" }}>
            <Icon name="Plus" size={14} />
            <span className="hidden md:block">Новый инцидент</span>
          </button>
        </div>
      </nav>

      <div className="pt-14 flex">
        {/* SIDEBAR */}
        <aside className="fixed left-0 top-14 bottom-0 w-14 md:w-52 flex flex-col py-4 gap-1 px-2"
          style={{ background: "rgba(6,10,18,0.95)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="mb-2 px-1">
            <EgsuSearch />
          </div>
          {([
            { key: "overview", icon: "BarChart3", label: "Обзор" },
            { key: "incidents", icon: "AlertTriangle", label: "Инциденты" },
            { key: "predicted", icon: "BrainCircuit", label: "Прогнозы" },
            { key: "ai", icon: "Cpu", label: "ИИ-аналитика" },
            { key: "organs", icon: "Network", label: "Органы ЕЦСУ" },
            { key: "security", icon: "ShieldCheck", label: "Безопасность", color: "#f43f5e" },
            { key: "license", icon: "BadgeCheck", label: "Лицензия", color: "#f59e0b" },
            { key: "loader", icon: "Terminal", label: "Загрузчик", color: "#00ff87" },
            { key: "settings", icon: "Settings", label: "Настройки", color: "#3b82f6" },
          ] as { key: NavTab; icon: string; label: string; color?: string }[]).map((item) => (
            <button key={item.key} onClick={() => setActiveTab(item.key)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left"
              style={{
                background: activeTab === item.key ? `${item.color ? item.color + "18" : "rgba(168,85,247,0.12)"}` : "transparent",
                color: activeTab === item.key ? (item.color ?? "#a855f7") : "rgba(255,255,255,0.4)",
                border: activeTab === item.key ? `1px solid ${item.color ? item.color + "35" : "rgba(168,85,247,0.25)"}` : "1px solid transparent",
              }}>
              <Icon name={item.icon as any} size={17} />
              <span className="hidden md:block">{item.label}</span>
            </button>
          ))}
        </aside>

        {/* MAIN */}
        <main className="flex-1 ml-14 md:ml-52 p-4 md:p-6">
          {children}

          <div className="mt-8 text-center space-y-1">
            <p className="text-white/15 text-[10px]">© 13 апреля 2026 · ЕЦСУ 2.0 · Все права защищены</p>
            <p className="text-white/10 text-[10px]">Правообладатель и контрольный пакет акций: Николаев Владимир Владимирович</p>
            <p className="text-white/10 text-[10px]">Разработка: Poehali.dev · Партнёрская программа ЕЦСУ</p>
          </div>
        </main>
      </div>

      {/* AI Chat button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110"
          style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)", boxShadow: "0 0 24px rgba(168,85,247,0.5)" }}>
          <Icon name="Bot" size={24} className="text-white" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 animate-pulse" style={{ borderColor: "#060a12" }} />
        </button>
      )}

      {chatOpen && <AiChat onClose={() => setChatOpen(false)} />}
    </div>
  );
}