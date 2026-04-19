import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const MODULES = [
  { path: "/egsu/dashboard",     icon: "LayoutDashboard", label: "Центр управления",   color: "#00ff87",  desc: "Все данные системы",           key: "dash" },
  { path: "/egsu/cpvoa",         icon: "Radar",           label: "ЦПВОА",              color: "#2196F3",  desc: "Карта инцидентов и мониторинг", key: "cpvoa" },
  { path: "/egsu/security",      icon: "Shield",          label: "Безопасность",        color: "#a855f7",  desc: "Защита и доступы",              key: "sec" },
  { path: "/egsu/finance",       icon: "Wallet",          label: "Финансы",             color: "#f59e0b",  desc: "Счета и платежи",               key: "fin" },
  { path: "/egsu/analytics",     icon: "BarChart3",       label: "Аналитика",           color: "#3b82f6",  desc: "Статистика и отчёты",           key: "an" },
  { path: "/egsu/emergency",     icon: "AlertTriangle",   label: "Экстренные протоколы",color: "#f43f5e",  desc: "Кризисные сценарии",            key: "em" },
  { path: "/egsu/docs",          icon: "FileText",        label: "Документы",           color: "#10b981",  desc: "Правовая база и файлы",         key: "docs" },
  { path: "/egsu/ark",           icon: "Server",          label: "Ковчег",              color: "#8b5cf6",  desc: "Серверная инфраструктура",      key: "ark" },
  { path: "/egsu/migration",     icon: "Navigation",      label: "Эмиграция",           color: "#ec4899",  desc: "Система перемещения",           key: "mig" },
  { path: "/egsu/export",        icon: "Download",        label: "Экспорт",             color: "#06b6d4",  desc: "Упаковка и резервирование",     key: "exp" },
  { path: "/egsu/owner",         icon: "Crown",           label: "Настройки владельца", color: "#eab308",  desc: "Профиль и права",               key: "own" },
  { path: "/egsu/api",           icon: "Code2",           label: "API-менеджер",        color: "#64748b",  desc: "Интеграции и ключи",            key: "api" },
];

const SYSTEM_STATUS = [
  { label: "Ядро ECSU",     ok: true,  note: "v2.0 · активно" },
  { label: "База данных",   ok: true,  note: "PostgreSQL · онлайн" },
  { label: "ЦПВОА",         ok: true,  note: "мониторинг активен" },
  { label: "Безопасность",  ok: true,  note: "все системы работают" },
  { label: "Серверы (Ковчег)", ok: true, note: "3/3 узла в сети" },
  { label: "Финансы",       ok: true,  note: "синхронизировано" },
];

const QUICK_ACTIONS = [
  { label: "Проверить инциденты", path: "/egsu/cpvoa",     icon: "AlertTriangle", color: "#f43f5e" },
  { label: "Финансовый баланс",   path: "/egsu/finance",   icon: "Wallet",        color: "#f59e0b" },
  { label: "Экстренный режим",    path: "/egsu/emergency", icon: "Siren",         color: "#f43f5e" },
  { label: "Создать экспорт",     path: "/egsu/export",    icon: "Download",      color: "#06b6d4" },
];

export default function EgsuStart() {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [greeting, setGreeting] = useState("");
  const [activeModule, setActiveModule] = useState<string | null>(null);

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 6)  setGreeting("Доброй ночи");
    else if (h < 12) setGreeting("Доброе утро");
    else if (h < 18) setGreeting("Добрый день");
    else setGreeting("Добрый вечер");

    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;
  const dateStr = time.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#060a12", color: "#fff" }}>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3"
        style={{ background: "rgba(6,10,18,0.97)", borderBottom: "1px solid rgba(0,255,135,0.08)", backdropFilter: "blur(16px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm"
            style={{ background: "linear-gradient(135deg, #00ff87, #a855f7)" }}>
            <span className="text-black text-xs font-black">E</span>
          </div>
          <div>
            <div className="font-black text-sm tracking-widest text-white leading-none">ECSU 2.0</div>
            <div className="text-white/25 text-[9px] tracking-widest">СИСТЕМА УПРАВЛЕНИЯ</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.12)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] font-mono text-green-400">{timeStr}</span>
          </div>
          <button onClick={() => navigate("/egsu/dashboard")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
            style={{ background: "rgba(0,255,135,0.1)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.2)" }}>
            Центр управления →
          </button>
        </div>
      </nav>

      <main className="flex-1 pt-16 px-4 md:px-8 pb-10 max-w-6xl mx-auto w-full">

        {/* ПРИВЕТСТВИЕ */}
        <div className="py-10 text-center">
          <div className="text-white/30 text-sm font-mono mb-2">{dateStr}</div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-1">
            {greeting}, <span style={{ color: "#00ff87" }}>Владимир</span>
          </h1>
          <p className="text-white/30 text-sm mt-2">ECSU 2.0 · Единая Централизованная Система Управления · Николаев В.В.</p>
        </div>

        {/* СТАТУС СИСТЕМЫ */}
        <div className="mb-8 p-5 rounded-2xl"
          style={{ background: "rgba(0,255,135,0.03)", border: "1px solid rgba(0,255,135,0.1)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Activity" size={15} style={{ color: "#00ff87" }} />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#00ff87" }}>Статус всех систем</span>
            <span className="ml-auto text-[10px] text-white/20 font-mono">обновлено только что</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {SYSTEM_STATUS.map(s => (
              <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: s.ok ? "rgba(0,255,135,0.04)" : "rgba(244,63,94,0.07)", border: `1px solid ${s.ok ? "rgba(0,255,135,0.12)" : "rgba(244,63,94,0.2)"}` }}>
                <span className={`w-2 h-2 rounded-full ${s.ok ? "bg-green-400" : "bg-red-400"}`}
                  style={{ boxShadow: s.ok ? "0 0 6px #00ff87" : "0 0 6px #f43f5e" }} />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white/80 truncate">{s.label}</div>
                  <div className="text-[10px] text-white/30 truncate">{s.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* БЫСТРЫЕ ДЕЙСТВИЯ */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Zap" size={14} style={{ color: "#f59e0b" }} />
            <span className="text-xs font-bold tracking-widest uppercase text-white/40">Быстрые действия</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map(qa => (
              <button key={qa.label} onClick={() => navigate(qa.path)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-95"
                style={{ background: `${qa.color}10`, border: `1px solid ${qa.color}25`, color: qa.color }}>
                <Icon name={qa.icon as "Zap"} size={16} />
                <span className="text-xs font-semibold leading-tight">{qa.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* МОДУЛИ СИСТЕМЫ */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Grid3x3" size={14} style={{ color: "#a855f7" }} />
            <span className="text-xs font-bold tracking-widest uppercase text-white/40">Все модули</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {MODULES.map(mod => (
              <button
                key={mod.key}
                onClick={() => navigate(mod.path)}
                onMouseEnter={() => setActiveModule(mod.key)}
                onMouseLeave={() => setActiveModule(null)}
                className="flex flex-col items-start gap-3 p-4 rounded-2xl text-left transition-all duration-200 hover:scale-[1.02] active:scale-95"
                style={{
                  background: activeModule === mod.key ? `${mod.color}12` : "rgba(255,255,255,0.02)",
                  border: `1px solid ${activeModule === mod.key ? mod.color + "35" : "rgba(255,255,255,0.06)"}`,
                }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${mod.color}15` }}>
                  <Icon name={mod.icon as "Zap"} size={18} style={{ color: mod.color }} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white/80 leading-tight mb-0.5">{mod.label}</div>
                  <div className="text-[10px] text-white/30 leading-tight">{mod.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="text-center py-4 text-[10px] text-white/15"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        ECSU 2.0 · © 2026 Николаев Владимир Владимирович · Все права защищены
      </footer>
    </div>
  );
}
