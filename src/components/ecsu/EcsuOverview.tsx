import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const now = new Date();
const hour = now.getHours();
const greeting = hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";
const dateStr = now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const timeStr = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

const MODULES = [
  {
    id: "complaints", icon: "FileText", color: "#6366f1", bg: "#6366f110",
    title: "Обращения и жалобы",
    desc: "МЧС, МВД, Прокуратура, ФСБ, международные органы",
    badge: null,
    stats: [
      { label: "Статья ФЗ-59", val: "ФЗ-59/2024 ст. 3" },
      { label: "Закон СМИ", val: "Закон СМИ ст. 38" },
      { label: "Ответственность", val: "УК РФ ст. 330 — ответственность за отказ органа" },
    ],
    route: null,
  },
  {
    id: "finance", icon: "DollarSign", color: "#10b981", bg: "#10b98110",
    title: "Финансовые операции",
    desc: "Платежи, выплаты, права человека — с доказательной базой",
    badge: null,
    stats: [{ label: "Страховой счёт", val: "Страховой счёт: 43 ₽/л" }],
    route: "/ecsu/finance",
  },
  {
    id: "violations", icon: "AlertTriangle", color: "#f59e0b", bg: "#f59e0b10",
    title: "Выявление нарушений",
    desc: "За выявление коррупции, экологических нарушений, кибератак",
    badge: null,
    stats: [
      { label: "Статьи", val: "ФЗ-273 «О противодействии коррупции»" },
    ],
    route: "/ecsu/report",
  },
  {
    id: "emergency", icon: "Phone", color: "#ef4444", bg: "#ef444410",
    title: "Экстренные службы",
    desc: "112, МЧС, МВД, скорая — прямые контакты работают сейчас",
    badge: null,
    stats: [{ label: "Дежурство", val: "ФЗ-100 на дежурстве — 40+" }],
    route: null,
  },
  {
    id: "legal", icon: "Scale", color: "#a855f7", bg: "#a855f710",
    title: "Правовая база",
    desc: "УК РФ, КоАП, конституционные права, международные конвенции",
    badge: null,
    stats: [{ label: "Конституция РФ", val: "Конституция РФ ст. 2, Международные договоры РФ" }],
    route: "/ecsu/legal",
  },
  {
    id: "organs", icon: "Network", color: "#00c896", bg: "#00c89610",
    title: "Органы надзора ЕЦСУ",
    desc: "33 органа ЕЦСУ принимают и направляют обращения к государству",
    badge: "NEW",
    stats: [{ label: "Конституция", val: "Конституция РФ ст. 2, Конституция ст. 45, ФЗ ст. 45" }],
    route: null,
  },
  {
    id: "anon", icon: "EyeOff", color: "#ec4899", bg: "#ec489910",
    title: "НИП-анонимный канал",
    desc: "Конфиденциальная жалоба для судей, прокуроров, журналистов, граждан",
    badge: "NEW",
    stats: [
      { label: "УК РФ", val: "УК 2024 ст. 72; Закон о СМИ ст. 152; РФ УК ст. 286" },
    ],
    route: null,
  },
];

const QUICK_ACTIONS = [
  { label: "Органы ЕЦСУ", icon: "Network", color: "#00c896", bg: "rgba(0,200,150,0.12)", route: null },
  { label: "Анонимная жалоба", icon: "EyeOff", color: "#a855f7", bg: "rgba(168,85,247,0.12)", route: null },
  { label: "Обращение в орган", icon: "FileText", color: "#6366f1", bg: "rgba(99,102,241,0.12)", route: null },
  { label: "Экстренные службы", icon: "Phone", color: "#ef4444", bg: "rgba(239,68,68,0.12)", route: null },
];

const SYSTEM_STATUS = [
  { label: "Ядро ЕЦСУ", status: "Онлайн", statusColor: "#00c896", detail: "82% активно", icon: "Shield" },
  { label: "База данных", status: "Онлайн", statusColor: "#00c896", detail: "PostgreSQL · активно", icon: "Database" },
  { label: "ЦПВОА", status: "Не настроен", statusColor: "#f59e0b", detail: "настройка активна", icon: "Globe" },
  { label: "Безопасность", status: "Онлайн", statusColor: "#00c896", detail: "Все системы работают", icon: "Lock" },
  { label: "Сервером (Абонент)", status: "Онлайн", statusColor: "#00c896", detail: "3/5 узлов в сети", icon: "Server" },
  { label: "НИП-канал", status: "Недоступен", statusColor: "#ef4444", detail: "нет соединения", icon: "EyeOff" },
];

export default function EcsuOverview() {
  const navigate = useNavigate();
  const [time, setTime] = useState(timeStr);
  const [activeTab, setActiveTab] = useState<"civil" | "modules">("civil");

  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">

      {/* Приветствие */}
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
          {greeting}, <span style={{ color: "#00c896" }}>Владимир</span>
        </h1>
        <p className="text-gray-500 text-sm">
          ЕЦСУ 2.0 · Единая Централизованная Система Управления · Николаев В.В.
        </p>
      </div>

      {/* Анонимная жалоба — баннер */}
      <div className="mb-6 p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:opacity-90 transition-opacity relative"
        style={{ background: "linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)", border: "1px solid rgba(99,102,241,0.4)" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(99,102,241,0.3)" }}>
          <Icon name="EyeOff" size={20} className="text-indigo-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-white font-bold text-sm">НИП Анонимный Канал</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(99,102,241,0.3)", color: "#a5b4fc" }}>Засекречено</span>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>
          <p className="text-indigo-300 text-xs leading-relaxed">
            Для судей, прокуроров, следователей, журналистов и граждан — анонимная подача жалобы. Личность скрыта даже от владельца системы. Раскрытие только по решению суда.
          </p>
          <div className="flex gap-4 mt-2 text-[10px] text-indigo-400">
            <span>§ ФЗ-ЭКЗО ст. 3</span>
            <span>§ Закон СМИ ст. 42</span>
            <span>§ УК РФ ст. 304 — ответственность за отказ органа</span>
          </div>
        </div>
        <Icon name="ChevronRight" size={18} className="text-indigo-400 shrink-0" />
      </div>

      {/* Быстрые действия */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-yellow-400 text-sm">⚡</span>
          <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Быстрые действия</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {QUICK_ACTIONS.map(a => (
            <button key={a.label}
              onClick={() => a.route ? navigate(a.route) : undefined}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
              style={{ background: a.bg, color: a.color, border: `1px solid ${a.color}30` }}>
              <Icon name={a.icon as "Network"} size={15} />
              <span className="text-xs">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Статус систем */}
      <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-sm">⚡</span>
            <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Статус систем</span>
          </div>
          <span className="font-mono text-white/30 text-xs">{time}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {SYSTEM_STATUS.map(s => (
            <div key={s.label} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ background: s.statusColor }} />
                <span className="text-white/80 text-xs font-semibold">{s.label}</span>
              </div>
              <div className="text-xs font-bold mb-0.5" style={{ color: s.statusColor }}>{s.status}</div>
              <div className="text-white/30 text-[10px]">{s.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Вкладки */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab("civil")}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: activeTab === "civil" ? "rgba(0,200,150,0.15)" : "rgba(255,255,255,0.04)",
            color: activeTab === "civil" ? "#00c896" : "rgba(255,255,255,0.4)",
            border: activeTab === "civil" ? "1px solid rgba(0,200,150,0.3)" : "1px solid transparent",
          }}>
          Гражданские инструменты
        </button>
        <button onClick={() => setActiveTab("modules")}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: activeTab === "modules" ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
            color: activeTab === "modules" ? "#818cf8" : "rgba(255,255,255,0.4)",
            border: activeTab === "modules" ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
          }}>
          Модули системы
        </button>
      </div>

      {/* Карточки */}
      {activeTab === "civil" && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-yellow-400 text-sm">🔒</span>
            <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Доступно каждому гражданину — на основании законов РФ</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MODULES.map(m => (
              <button key={m.id}
                onClick={() => m.route ? navigate(m.route) : undefined}
                className="p-4 rounded-xl text-left transition-all hover:scale-[1.01] group"
                style={{ background: m.bg, border: `1px solid ${m.color}25` }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${m.color}20` }}>
                    <Icon name={m.icon as "FileText"} size={18} style={{ color: m.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white font-semibold text-sm">{m.title}</span>
                      {m.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                          style={{ background: `${m.color}25`, color: m.color }}>{m.badge}</span>
                      )}
                    </div>
                    <p className="text-white/45 text-xs leading-relaxed mb-2">{m.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {m.stats.map((st, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded"
                          style={{ background: "rgba(255,255,255,0.05)", color: m.color }}>
                          § {st.val}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-white/20 group-hover:text-white/50 transition-colors shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === "modules" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { icon: "LayoutDashboard", label: "Обзор системы", color: "#60a5fa", route: null },
            { icon: "AlertTriangle", label: "Инциденты", color: "#f43f5e", route: null },
            { icon: "BarChart3", label: "ИИ-аналитика", color: "#a855f7", route: null },
            { icon: "DollarSign", label: "Финансы", color: "#10b981", route: "/ecsu/finance" },
            { icon: "Network", label: "Органы ЕЦСУ", color: "#00c896", route: null },
            { icon: "Shield", label: "Безопасность", color: "#ef4444", route: "/ecsu/security" },
            { icon: "Scale", label: "Правовая база", color: "#a855f7", route: "/ecsu/legal" },
            { icon: "Bell", label: "Уведомления", color: "#f59e0b", route: "/ecsu/notifications" },
          ].map(m => (
            <button key={m.label}
              onClick={() => m.route ? navigate(m.route) : undefined}
              className="flex items-center gap-3 p-4 rounded-xl text-left transition-all hover:scale-[1.01]"
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${m.color}20` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${m.color}18` }}>
                <Icon name={m.icon as "Shield"} size={18} style={{ color: m.color }} />
              </div>
              <span className="text-white/80 font-semibold text-sm">{m.label}</span>
              <Icon name="ChevronRight" size={15} className="text-white/20 ml-auto" />
            </button>
          ))}
        </div>
      )}

      {/* Правовой футер */}
      <div className="mt-8 p-4 rounded-xl text-white/25 text-[10px] leading-relaxed"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
        Правовая основа системы ЕЦСУ 2.0: Все инструменты работают в рамках действующего законодательства РФ и международных конвенций. Система за является органов власти и не является официальным представителем госструктур.
        Правообладатель: Николаев Владимир Владимирович (УК РФ ст. 146, ГК РФ). Владелец системы: Николаев Владимир Владимирович.
        nikolaevvladimir77@yandex.ru
      </div>
      <div className="text-center text-white/20 text-[10px] mt-3">
        ЕЦСУ 2.0 · © 2026 Николаев Владимир Владимирович · Все права защищены.
      </div>
    </div>
  );
}
