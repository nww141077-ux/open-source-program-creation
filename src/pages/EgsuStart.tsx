import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const MODULES = [
  { path: "/egsu/dashboard",     icon: "LayoutDashboard", label: "Центр управления",    color: "#00ff87",  desc: "Все данные системы",            key: "dash" },
  { path: "/egsu/cpvoa",         icon: "Radar",           label: "ЦПВОА",               color: "#2196F3",  desc: "Карта инцидентов и мониторинг", key: "cpvoa" },
  { path: "/egsu/security",      icon: "Shield",          label: "Безопасность",         color: "#a855f7",  desc: "Защита и доступы",              key: "sec" },
  { path: "/egsu/finance",       icon: "Wallet",          label: "Финансы",              color: "#f59e0b",  desc: "Счета и платежи",               key: "fin" },
  { path: "/egsu/analytics",     icon: "BarChart3",       label: "Аналитика",            color: "#3b82f6",  desc: "Статистика и отчёты",           key: "an" },
  { path: "/egsu/emergency",     icon: "AlertTriangle",   label: "Экстренные протоколы", color: "#f43f5e",  desc: "Кризисные сценарии",            key: "em" },
  { path: "/egsu/docs",          icon: "FileText",        label: "Документы",            color: "#10b981",  desc: "Правовая база и файлы",         key: "docs" },
  { path: "/egsu/ark",           icon: "Server",          label: "Ковчег",               color: "#8b5cf6",  desc: "Серверная инфраструктура",      key: "ark" },
  { path: "/egsu/migration",     icon: "Navigation",      label: "Эмиграция",            color: "#ec4899",  desc: "Система перемещения",           key: "mig" },
  { path: "/egsu/export",        icon: "Download",        label: "Экспорт",              color: "#06b6d4",  desc: "Упаковка и резервирование",     key: "exp" },
  { path: "/egsu/owner",         icon: "Crown",           label: "Настройки владельца",  color: "#eab308",  desc: "Профиль и права",               key: "own" },
  { path: "/egsu/api",           icon: "Code2",           label: "API-менеджер",         color: "#64748b",  desc: "Интеграции и ключи",            key: "api" },
  { path: "/egsu/graphium",      icon: "BookOpen",        label: "Графиум",              color: "#a855f7",  desc: "Личный блокнот и заметки",      key: "graphium" },
  { path: "/egsu/civil-claims",  icon: "Scale",           label: "Гражданские иски",     color: "#00c864",  desc: "Иски и режим поглощения",       key: "civil" },
  { path: "/egsu/fund",          icon: "Landmark",        label: "Фонд ДАЛАН",           color: "#10b981",  desc: "Развитие ECSU · Учёт средств",  key: "fund" },
];

const CITIZEN_TOOLS = [
  {
    path: "/egsu/appeal",
    icon: "FileText",
    color: "#a855f7",
    label: "Обращения в ведомства",
    desc: "МЧС, МВД, Прокуратура, ФСБ, международные органы",
    law: "Конституция РФ ст. 33; ФЗ №59",
    badge: null,
  },
  {
    path: "/egsu/cpvoa",
    icon: "Radar",
    color: "#2196F3",
    label: "Фиксация инцидентов",
    desc: "Экология, кибератаки, права человека — с доказательной базой",
    law: "ФЗ №7; Орхусская конвенция; ФЗ №149",
    badge: null,
  },
  {
    path: "/egsu/rewards",
    icon: "Coins",
    color: "#00ff87",
    label: "Запрос вознаграждения",
    desc: "За выявление коррупции, экологических нарушений, киберугроз",
    law: "ФЗ №273 «О противодействии коррупции»",
    badge: null,
  },
  {
    path: "/egsu/emergency",
    icon: "PhoneCall",
    color: "#f43f5e",
    label: "Экстренные службы",
    desc: "112, МЧС, МВД, скорая — прямые контакты работают офлайн",
    law: "ФЗ №68 «О защите населения от ЧС»",
    badge: null,
  },
  {
    path: "/egsu/legal",
    icon: "Scale",
    color: "#f59e0b",
    label: "Правовая база",
    desc: "УК РФ, КоАП, конституционные права, международные конвенции",
    law: "Конституция РФ; международные договоры РФ",
    badge: null,
  },
  {
    path: "/egsu/organs",
    icon: "Building2",
    color: "#00ff87",
    label: "Органы системы ECSU",
    desc: "10 органов ECSU принимают и направляют обращения в госведомства",
    law: "Конституция РФ ст. 33; ФЗ №59",
    badge: "НОВОЕ",
  },
  {
    path: "/egsu/vip",
    icon: "ShieldCheck",
    color: "#a855f7",
    label: "ВИП-анонимный канал",
    desc: "Конфиденциальная жалоба для судей, прокуроров, журналистов, граждан",
    law: "ФЗ №273 ст. 9; Закон о СМИ ст. 41; УК РФ ст. 306",
    badge: "ВИП",
  },
];

const SYSTEM_STATUS = [
  { label: "Ядро ECSU",        ok: true, note: "v2.0 · активно" },
  { label: "База данных",      ok: true, note: "PostgreSQL · онлайн" },
  { label: "ЦПВОА",            ok: true, note: "мониторинг активен" },
  { label: "Безопасность",     ok: true, note: "все системы работают" },
  { label: "Серверы (Ковчег)", ok: true, note: "3/3 узла в сети" },
  { label: "ВИП-канал",        ok: true, note: "анонимность активна" },
];

const QUICK_ACTIONS = [
  { label: "Органы ECSU",        path: "/egsu/organs",   icon: "Building2",     color: "#00ff87" },
  { label: "Анонимная жалоба",   path: "/egsu/vip",      icon: "ShieldCheck",   color: "#a855f7" },
  { label: "Обращение в орган",  path: "/egsu/appeal",   icon: "FileText",      color: "#10b981" },
  { label: "Экстренные службы",  path: "/egsu/emergency",icon: "PhoneCall",     color: "#f43f5e" },
];

export default function EgsuStart() {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [greeting, setGreeting] = useState("");
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [section, setSection] = useState<"owner" | "citizen">("citizen");

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 6)       setGreeting("Доброй ночи");
    else if (h < 12) setGreeting("Доброе утро");
    else if (h < 18) setGreeting("Добрый день");
    else             setGreeting("Добрый вечер");

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
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
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
          <button onClick={() => navigate("/egsu/vip")}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
            style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }}>
            🔒 ВИП-канал
          </button>
          <button onClick={() => navigate("/egsu/dashboard")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
            style={{ background: "rgba(0,255,135,0.1)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.2)" }}>
            Центр управления →
          </button>
        </div>
      </nav>

      <main className="flex-1 pt-16 px-4 md:px-8 pb-12 max-w-6xl mx-auto w-full">

        {/* ПРИВЕТСТВИЕ */}
        <div className="py-8 text-center">
          <div className="text-white/30 text-sm font-mono mb-2">{dateStr}</div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-1">
            {greeting}, <span style={{ color: "#00ff87" }}>Владимир</span>
          </h1>
          <p className="text-white/30 text-sm mt-2">ECSU 2.0 · Единая Централизованная Система Управления · Николаев В.В.</p>
        </div>

        {/* ВИП БАННЕР */}
        <button onClick={() => navigate("/egsu/vip")}
          className="w-full mb-6 p-5 rounded-2xl text-left transition-all hover:scale-[1.01] group"
          style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.12), rgba(59,130,246,0.08))", border: "1px solid rgba(168,85,247,0.3)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
                <Icon name="ShieldCheck" size={24} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-white text-sm">ВИП Анонимный Канал</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black text-black"
                    style={{ background: "#a855f7" }}>ВИП</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold"
                    style={{ background: "rgba(0,255,135,0.15)", color: "#00ff87" }}>ЗАЩИЩЕНО</span>
                </div>
                <p className="text-white/45 text-xs leading-relaxed">
                  Для судей, прокуроров, следователей, журналистов и граждан — анонимная подача жалобы.
                  Личность скрыта даже от владельца системы. Раскрытие только по решению суда.
                </p>
              </div>
            </div>
            <Icon name="ChevronRight" size={20} className="text-white/30 group-hover:text-white/60 transition-colors shrink-0 ml-4" />
          </div>
          <div className="flex items-center gap-4 mt-3 text-[10px] text-white/30">
            <span>📜 ФЗ №273 ст. 9</span>
            <span>📜 Закон о СМИ ст. 41</span>
            <span>📜 УК РФ ст. 306 — ответственность за ложный донос</span>
          </div>
        </button>

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

        {/* СТАТУС СИСТЕМЫ */}
        <div className="mb-8 p-5 rounded-2xl"
          style={{ background: "rgba(0,255,135,0.03)", border: "1px solid rgba(0,255,135,0.1)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Activity" size={15} style={{ color: "#00ff87" }} />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#00ff87" }}>Статус систем</span>
            <span className="ml-auto text-[10px] text-white/20 font-mono">{timeStr}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {SYSTEM_STATUS.map(s => (
              <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: s.ok ? "rgba(0,255,135,0.04)" : "rgba(244,63,94,0.07)", border: `1px solid ${s.ok ? "rgba(0,255,135,0.12)" : "rgba(244,63,94,0.2)"}` }}>
                <span className="w-2 h-2 rounded-full"
                  style={{ background: s.ok ? "#00ff87" : "#f43f5e", boxShadow: s.ok ? "0 0 6px #00ff87" : "0 0 6px #f43f5e" }} />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white/80 truncate">{s.label}</div>
                  <div className="text-[10px] text-white/30 truncate">{s.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ПЕРЕКЛЮЧАТЕЛЬ СЕКЦИЙ */}
        <div className="flex gap-2 mb-6 p-1 rounded-2xl w-fit"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={() => setSection("citizen")}
            className="px-5 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              background: section === "citizen" ? "rgba(0,255,135,0.12)" : "transparent",
              color: section === "citizen" ? "#00ff87" : "rgba(255,255,255,0.35)",
              border: section === "citizen" ? "1px solid rgba(0,255,135,0.25)" : "1px solid transparent",
            }}>
            Гражданские инструменты
          </button>
          <button onClick={() => setSection("owner")}
            className="px-5 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              background: section === "owner" ? "rgba(168,85,247,0.12)" : "transparent",
              color: section === "owner" ? "#a855f7" : "rgba(255,255,255,0.35)",
              border: section === "owner" ? "1px solid rgba(168,85,247,0.25)" : "1px solid transparent",
            }}>
            Модули системы
          </button>
        </div>

        {/* ГРАЖДАНСКИЕ ИНСТРУМЕНТЫ */}
        {section === "citizen" && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Users" size={14} style={{ color: "#00ff87" }} />
              <span className="text-xs font-bold tracking-widest uppercase text-white/40">
                Доступно каждому гражданину — на основании законов РФ
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CITIZEN_TOOLS.map(tool => (
                <button key={tool.path} onClick={() => navigate(tool.path)}
                  onMouseEnter={() => setActiveModule(tool.path)}
                  onMouseLeave={() => setActiveModule(null)}
                  className="flex items-start gap-4 p-5 rounded-2xl text-left transition-all hover:scale-[1.01]"
                  style={{
                    background: activeModule === tool.path ? `${tool.color}10` : "rgba(255,255,255,0.02)",
                    border: `1px solid ${activeModule === tool.path ? tool.color + "35" : "rgba(255,255,255,0.06)"}`,
                  }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${tool.color}15` }}>
                    <Icon name={tool.icon as "Zap"} size={20} style={{ color: tool.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-white/90">{tool.label}</span>
                      {tool.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black text-black"
                          style={{ background: tool.color }}>{tool.badge}</span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed mb-1.5">{tool.desc}</p>
                    <div className="text-[10px] font-mono" style={{ color: tool.color + "80" }}>
                      📜 {tool.law}
                    </div>
                  </div>
                  <Icon name="ChevronRight" size={14} className="text-white/20 shrink-0 mt-1" />
                </button>
              ))}
            </div>

            {/* Правовой дисклеймер */}
            <div className="mt-6 p-4 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-[10px] text-white/25 leading-relaxed">
                <span className="text-white/40 font-semibold">Правовая основа системы ECSU 2.0:</span> Все инструменты работают
                в рамках действующего законодательства РФ и международных конвенций. Система не является
                органом власти и не заменяет официальные обращения — она помогает их составить и направить.
                Пользователь несёт ответственность за достоверность сведений (УК РФ ст. 306).
                Владелец системы: Николаев Владимир Владимирович, nikolaevvladimir77@yandex.ru
              </div>
            </div>
          </div>
        )}

        {/* МОДУЛИ СИСТЕМЫ (владелец) */}
        {section === "owner" && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Grid3x3" size={14} style={{ color: "#a855f7" }} />
              <span className="text-xs font-bold tracking-widest uppercase text-white/40">Все модули ECSU 2.0</span>
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
        )}
      </main>

      {/* FOOTER */}
      <footer className="text-center py-4 text-[10px] text-white/15"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        ECSU 2.0 · © 2026 Николаев Владимир Владимирович · Все права защищены
      </footer>
    </div>
  );
}