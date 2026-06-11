import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const MODULES_CIVIL = [
  {
    id: "complaints", icon: "FileText", color: "#6366f1",
    title: "Обращения в ведомства",
    desc: "МЧС, МВД, Прокуратура, ФСБ, международные органы",
    laws: ["Конституция РФ ст. 33", "ФЗ №59"],
    route: null,
    badge: null,
  },
  {
    id: "incidents", icon: "Target", color: "#10b981",
    title: "Фиксация инцидентов",
    desc: "Экология, кибератаки, права человека — с доказательной базой",
    laws: ["ФЗ №7", "Орхусская конвенция", "ФЗ №149"],
    route: null,
    badge: null,
  },
  {
    id: "violations", icon: "Search", color: "#f59e0b",
    title: "Запрос вознаграждения",
    desc: "За выявление коррупции, экологических нарушений, кибератак",
    laws: ["ФЗ №273 «о противодействии коррупции»"],
    route: "/ecsu/report",
    badge: null,
  },
  {
    id: "emergency", icon: "Phone", color: "#ef4444",
    title: "Экстренные службы",
    desc: "112, МЧС, МВД, скорая — прямые контакты работают сейчас",
    laws: ["ФЗ №68 «О защите населения от ЧС»"],
    route: null,
    badge: null,
  },
  {
    id: "legal", icon: "Scale", color: "#a855f7",
    title: "Правовая база",
    desc: "УК РФ, КоАП, конституционные права, международные конвенции",
    laws: ["Конституция РФ", "международные договоры РФ"],
    route: "/ecsu/legal",
    badge: null,
  },
  {
    id: "organs", icon: "Building2", color: "#00c896",
    title: "Органы системы ECSU",
    desc: "10 органов ECSU принимают и направляют обращения в госведомства",
    laws: ["Конституция РФ ст. 33", "ФЗ №59"],
    route: null,
    badge: "НОВОЕ",
  },
  {
    id: "anon", icon: "EyeOff", color: "#ec4899",
    title: "ВИП-анонимный канал",
    desc: "Конфиденциальная жалоба для судей, прокуроров, журналистов, граждан",
    laws: ["ФЗ №273 ст. 9", "Закон о СМИ ст. 41", "УК РФ ст. 306"],
    route: null,
    badge: "ВИП",
  },
];

const QUICK_ACTIONS = [
  { label: "Органы ECSU", icon: "Building2", color: "#00c896", bg: "rgba(0,200,150,0.15)", route: null },
  { label: "Анонимная жалоба", icon: "EyeOff", color: "#a855f7", bg: "rgba(168,85,247,0.15)", route: null },
  { label: "Обращение в орган", icon: "FileText", color: "#6366f1", bg: "rgba(99,102,241,0.15)", route: null },
  { label: "Экстренные службы", icon: "Phone", color: "#ef4444", bg: "rgba(239,68,68,0.15)", route: null },
];

const SYSTEM_STATUS = [
  { label: "Ядро ECSU", status: "Онлайн", statusColor: "#00c896", detail: "v2.0 · активно" },
  { label: "База данных", status: "Онлайн", statusColor: "#00c896", detail: "PostgreSQL · онлайн" },
  { label: "ЦПВОА", status: "Не настроен", statusColor: "#f59e0b", detail: "настройка активна" },
  { label: "Безопасность", status: "Онлайн", statusColor: "#00c896", detail: "все системы работают" },
  { label: "Серверы (Ковчег)", status: "Онлайн", statusColor: "#00c896", detail: "3/3 узла в сети" },
  { label: "ВИП-канал", status: "Онлайн", statusColor: "#00c896", detail: "анонимность активна" },
];

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : "Добрый вечер";
}

function getDateStr() {
  return new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function EcsuOverview() {
  const navigate = useNavigate();
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );
  const [activeTab, setActiveTab] = useState<"civil" | "modules">("civil");

  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">

      {/* Дата и приветствие */}
      <div className="text-center mb-5">
        <div className="text-white/40 text-xs mb-2">{getDateStr()}</div>
        <h1 className="text-2xl font-bold text-white mb-1">
          {getGreeting()}, <span style={{ color: "#00c896" }}>Владимир</span>
        </h1>
        <p className="text-white/40 text-xs">
          ECSU 2.0 · Единая Централизованная Система Управления · Николаев В.В.
        </p>
      </div>

      {/* ВИП Анонимный канал — баннер */}
      <div
        className="mb-5 p-4 rounded-2xl flex items-start gap-3 cursor-pointer active:opacity-80 transition-opacity"
        style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", border: "1px solid rgba(99,102,241,0.4)" }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: "rgba(99,102,241,0.3)" }}>
          <Icon name="ShieldCheck" size={18} className="text-indigo-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-white font-bold text-sm">ВИП Анонимный Канал</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/30 text-purple-300">ВИП</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-500/20 text-green-400">ЗАЩИЩЕНО</span>
          </div>
          <p className="text-indigo-300 text-xs leading-relaxed mb-2">
            Для судей, прокуроров, следователей, журналистов и граждан — анонимная подача жалобы. Личность скрыта даже от владельца системы. Раскрытие только по решению суда.
          </p>
          <div className="flex gap-3 flex-wrap text-[10px] text-indigo-400/70">
            <span>§ ФЗ №273 ст. 9</span>
            <span>§ Закон о СМИ ст. 41</span>
            <span>§ УК РФ ст. 306 — ответственность за ложный донос</span>
          </div>
        </div>
        <Icon name="ChevronRight" size={16} className="text-indigo-400 shrink-0 mt-1" />
      </div>

      {/* Быстрые действия */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-yellow-400 text-xs">⚡</span>
          <span className="text-white/50 text-[11px] font-bold uppercase tracking-widest">Быстрые действия</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_ACTIONS.map(a => (
            <button
              key={a.label}
              onClick={() => a.route ? navigate(a.route) : undefined}
              className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
              style={{ background: a.bg, color: a.color, border: `1px solid ${a.color}30` }}
            >
              <Icon name={a.icon as "Phone"} size={14} />
              <span className="text-xs">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Статус систем */}
      <div className="mb-5 p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-xs">⚡</span>
            <span className="text-white/50 text-[11px] font-bold uppercase tracking-widest">Статус систем</span>
          </div>
          <span className="font-mono text-white/30 text-xs">{time}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SYSTEM_STATUS.map(s => (
            <div key={s.label} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.statusColor }} />
                <span className="text-white/70 text-[11px] font-semibold truncate">{s.label}</span>
              </div>
              <div className="text-[11px] font-bold" style={{ color: s.statusColor }}>{s.status}</div>
              <div className="text-white/25 text-[10px] mt-0.5">{s.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Вкладки */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("civil")}
          className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
          style={{
            background: activeTab === "civil" ? "rgba(0,200,150,0.15)" : "rgba(255,255,255,0.04)",
            color: activeTab === "civil" ? "#00c896" : "rgba(255,255,255,0.4)",
            border: activeTab === "civil" ? "1px solid rgba(0,200,150,0.3)" : "1px solid rgba(255,255,255,0.06)",
          }}
        >
          Гражданские инструменты
        </button>
        <button
          onClick={() => setActiveTab("modules")}
          className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
          style={{
            background: activeTab === "modules" ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
            color: activeTab === "modules" ? "#818cf8" : "rgba(255,255,255,0.4)",
            border: activeTab === "modules" ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.06)",
          }}
        >
          Модули системы
        </button>
      </div>

      {/* Заголовок секции */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-yellow-400 text-xs">🔒</span>
        <span className="text-white/50 text-[11px] font-bold uppercase tracking-widest">
          Доступно каждому гражданину — на основании законов РФ
        </span>
      </div>

      {/* Карточки модулей */}
      <div className="space-y-3 mb-6">
        {MODULES_CIVIL.map(m => (
          <div
            key={m.id}
            onClick={() => m.route && navigate(m.route)}
            className="p-4 rounded-2xl flex items-start gap-3 transition-all active:scale-[0.98]"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid rgba(255,255,255,0.07)`,
              cursor: m.route ? "pointer" : "default",
            }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: m.color + "20" }}>
              <Icon name={m.icon as "Phone"} size={17} style={{ color: m.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-white font-semibold text-sm">{m.title}</span>
                {m.badge && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                    style={{
                      background: m.badge === "ВИП" ? "rgba(168,85,247,0.3)" : "rgba(0,200,150,0.2)",
                      color: m.badge === "ВИП" ? "#c084fc" : "#00c896",
                    }}
                  >
                    {m.badge}
                  </span>
                )}
              </div>
              <p className="text-white/50 text-xs leading-relaxed mb-2">{m.desc}</p>
              <div className="flex gap-2 flex-wrap">
                {m.laws.map(law => (
                  <span key={law} className="text-[10px] px-2 py-0.5 rounded"
                    style={{ background: m.color + "15", color: m.color + "cc" }}>
                    § {law}
                  </span>
                ))}
              </div>
            </div>
            <Icon name="ChevronRight" size={14} className="text-white/20 shrink-0 mt-1" />
          </div>
        ))}
      </div>

      {/* Футер */}
      <div className="mt-4 p-4 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <p className="text-white/20 text-[10px] leading-relaxed mb-2">
          Правовая основа системы ECSU 2.0: Все инструменты работают в рамках действующего законодательства РФ и международных конвенций. Система не является органом власти и не заменяет официальные обращения — она помогает их составить и направить. Пользователь несёт ответственность за достоверность сведений (УК РФ ст. 306). Владелец системы: Николаев Владимир Владимирович, nikolaevvladimir77@yandex.ru
        </p>
        <div className="text-white/15 text-[10px]">ECSU 2.0 © 2026 Николаев Владимир Владимирович · Все права защищены</div>
      </div>
    </div>
  );
}
