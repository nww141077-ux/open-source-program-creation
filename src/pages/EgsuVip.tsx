/**
 * ECSU 2.0 — ВИП Анонимный Портал
 * Защищённый канал для должностных лиц, судей, прокуроров, следователей,
 * журналистов и граждан, желающих подать конфиденциальное обращение/жалобу.
 *
 * Правовая основа:
 * — ФЗ №59 «О порядке рассмотрения обращений граждан»
 * — ФЗ №273 «О противодействии коррупции», ст. 9 (обязанность сообщать о коррупции)
 * — ФЗ №374-ФЗ (защита источников информации)
 * — Конституция РФ, ст. 23 (тайна переписки), ст. 29 (свобода информации)
 * — УК РФ ст. 306 — ответственность за заведомо ложный донос
 *
 * Владелец: Николаев Владимир Владимирович
 * © 2026 Все права защищены
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

// ─── Типы ─────────────────────────────────────────────────────────────────────
type VipCategory =
  | "corruption"       // коррупция
  | "abuse_of_power"   // превышение полномочий
  | "judicial"         // нарушения в судебной системе
  | "police"           // нарушения со стороны правоохранителей
  | "ecology"          // экологические преступления
  | "cyber"            // кибератаки на госсистемы
  | "financial"        // финансовые махинации
  | "human_rights"     // нарушения прав человека
  | "other";

type VipRole =
  | "judge"            // судья
  | "prosecutor"       // прокурор
  | "investigator"     // следователь
  | "journalist"       // журналист
  | "official"         // должностное лицо
  | "lawyer"           // адвокат
  | "citizen"          // гражданин
  | "whistleblower";   // разоблачитель (ст. 9 ФЗ-273)

type Step = "disclaimer" | "role" | "form" | "review" | "sent";

interface VipReport {
  id: string;
  role: VipRole;
  category: VipCategory;
  subject: string;          // против кого / чего
  subject_position: string; // должность фигуранта
  subject_org: string;      // организация
  description: string;
  evidence_desc: string;    // описание доказательств
  target_org: string;       // куда направить
  urgency: "normal" | "urgent" | "critical";
  created_at: string;
  hash: string;             // идентификатор для отслеживания без деанона
}

// ─── Константы ────────────────────────────────────────────────────────────────

const VIP_CATEGORIES: Record<VipCategory, { label: string; icon: string; color: string; law: string }> = {
  corruption:      { label: "Коррупция",                  icon: "Coins",         color: "#f59e0b", law: "ФЗ №273, УК РФ ст. 290–291" },
  abuse_of_power:  { label: "Превышение полномочий",      icon: "ShieldOff",     color: "#f43f5e", law: "УК РФ ст. 286, 285" },
  judicial:        { label: "Нарушения в суде",            icon: "Scale",         color: "#a855f7", law: "УК РФ ст. 305, 303, 294" },
  police:          { label: "Нарушения со стороны полиции",icon: "AlertOctagon",  color: "#ef4444", law: "УК РФ ст. 286, 302; ФЗ «О полиции»" },
  ecology:         { label: "Экологические преступления",  icon: "Leaf",          color: "#10b981", law: "ФЗ №7, УК РФ ст. 246–262" },
  cyber:           { label: "Кибератаки / утечки данных",  icon: "Monitor",       color: "#2196F3", law: "УК РФ ст. 272–274, ФЗ №149" },
  financial:       { label: "Финансовые махинации",        icon: "TrendingDown",  color: "#f59e0b", law: "УК РФ ст. 159, 172, 174" },
  human_rights:    { label: "Нарушения прав человека",     icon: "Heart",         color: "#ec4899", law: "Конституция РФ; ЕКПЧ" },
  other:           { label: "Иное нарушение закона",       icon: "FileWarning",   color: "#94a3b8", law: "Конституция РФ ст. 33; ФЗ №59" },
};

const VIP_ROLES: Record<VipRole, { label: string; icon: string; color: string; note: string }> = {
  judge:          { label: "Судья",              icon: "Scale",         color: "#a855f7", note: "Особая защита источника согласно ФЗ о статусе судей" },
  prosecutor:     { label: "Прокурор",           icon: "Shield",        color: "#f43f5e", note: "ФЗ о прокуратуре, ст. 40.4 — обязанность сообщать о нарушениях" },
  investigator:   { label: "Следователь / дознаватель", icon: "Search", color: "#3b82f6", note: "УПК РФ — независимость процессуальной деятельности" },
  journalist:     { label: "Журналист",          icon: "Newspaper",     color: "#06b6d4", note: "Закон РФ о СМИ, ст. 41 — тайна источника информации" },
  official:       { label: "Должностное лицо",   icon: "Briefcase",     color: "#eab308", note: "ФЗ №273 ст. 9 — ОБЯЗАННОСТЬ сообщать о коррупции" },
  lawyer:         { label: "Адвокат",            icon: "BookOpen",      color: "#10b981", note: "ФЗ «Об адвокатуре» — адвокатская тайна сохраняется" },
  citizen:        { label: "Гражданин РФ",        icon: "User",          color: "#00ff87", note: "Конституция РФ ст. 33 — право на обращение в органы власти" },
  whistleblower:  { label: "Разоблачитель (виссл-блоур)", icon: "Bell", color: "#f97316", note: "ФЗ №273 ст. 9 — защита лица, сообщившего о коррупции" },
};

// ─── Сгруппированные органы для выбора ───────────────────────────────────────
interface TargetGroup {
  label: string;
  color: string;
  orgs: string[];
}

const TARGET_GROUPS: TargetGroup[] = [
  {
    label: "🔷 Органы системы ECSU 2.0",
    color: "#00ff87",
    orgs: [
      "ECSU: Главный орган ECSU (все категории)",
      "ECSU: Антикоррупционный орган ECSU",
      "ECSU: Орган безопасности ECSU",
      "ECSU: Орган прав человека ECSU",
      "ECSU: Орган киберзащиты ECSU",
      "ECSU: Орган экологии ECSU",
      "ECSU: Орган ЧС ECSU",
      "ECSU: Правовой орган ECSU",
      "ECSU: Медиа и информационный орган ECSU",
      "ECSU: Финансовый орган ECSU",
    ],
  },
  {
    label: "🏛️ Федеральные органы РФ",
    color: "#a855f7",
    orgs: [
      "Генеральная прокуратура РФ",
      "Следственный комитет РФ",
      "ФСБ России — Управление собственной безопасности",
      "МВД России — Департамент собственной безопасности",
      "Счётная палата РФ",
      "Росфинмониторинг",
      "Роспотребнадзор",
      "Росприроднадзор",
      "Федеральная антимонопольная служба (ФАС)",
      "Уполномоченный по правам человека (Омбудсмен)",
      "Совет при Президенте РФ по правам человека (СПЧ)",
      "Конституционный суд РФ",
    ],
  },
  {
    label: "🌐 Международные органы",
    color: "#3b82f6",
    orgs: [
      "Европейский суд по правам человека (ЕСПЧ)",
      "GRECO (антикоррупционный орган Совета Европы)",
      "UNODC (ООН — наркотики и преступность)",
      "Transparency International",
      "Международный уголовный суд (МУС)",
      "Комитет ООН по правам человека",
    ],
  },
];

// Для совместимости — плоский список
const TARGET_ORGS = TARGET_GROUPS.flatMap(g => g.orgs);

// Генерация анонимного хэша-идентификатора
function generateAnonHash(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let hash = "VIP-";
  for (let i = 0; i < 12; i++) {
    if (i === 4 || i === 8) hash += "-";
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

// ─── Компонент ────────────────────────────────────────────────────────────────
export default function EgsuVip() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("disclaimer");
  const [role, setRole] = useState<VipRole | null>(null);
  const [category, setCategory] = useState<VipCategory | null>(null);
  const [subject, setSubject] = useState("");
  const [subjectPosition, setSubjectPosition] = useState("");
  const [subjectOrg, setSubjectOrg] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceDesc, setEvidenceDesc] = useState("");
  const [targetOrg, setTargetOrg] = useState("");
  const [customTarget, setCustomTarget] = useState("");
  const [urgency, setUrgency] = useState<"normal" | "urgent" | "critical">("normal");
  const [accepted, setAccepted] = useState(false);
  const [report, setReport] = useState<VipReport | null>(null);
  const [sending, setSending] = useState(false);
  const [anonHash] = useState(generateAnonHash);
  const [showLaw, setShowLaw] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [step]);

  function handleSubmit() {
    if (!role || !category || !subject || !description || !targetOrg) return;
    setSending(true);
    const newReport: VipReport = {
      id: anonHash,
      role,
      category,
      subject,
      subject_position: subjectPosition,
      subject_org: subjectOrg,
      description,
      evidence_desc: evidenceDesc,
      target_org: customTarget || targetOrg,
      urgency,
      created_at: new Date().toISOString(),
      hash: anonHash,
    };
    setTimeout(() => {
      setReport(newReport);
      setSending(false);
      setStep("sent");
    }, 2200);
  }

  const urgencyConfig = {
    normal:   { label: "Стандартный",  color: "#00ff87", note: "30 дней по ФЗ №59" },
    urgent:   { label: "Срочный",      color: "#f59e0b", note: "15 дней — угроза охраняемым правам" },
    critical: { label: "Критический",  color: "#f43f5e", note: "72 часа — угроза жизни / тяжкое преступление в процессе" },
  };

  // ─── Шаг 1: Дисклеймер ───────────────────────────────────────────────────
  if (step === "disclaimer") {
    return (
      <div ref={topRef} className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: "#060a12", color: "#fff" }}>
        <div className="w-full max-w-xl">

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
              <Icon name="ShieldCheck" size={32} className="text-white" />
            </div>
            <div className="text-xs font-mono tracking-widest text-white/30 mb-2">ECSU 2.0 · ВИП ПОРТАЛ</div>
            <h1 className="text-2xl font-black text-white mb-2">Защищённый анонимный канал</h1>
            <p className="text-white/40 text-sm leading-relaxed">
              Для судей, прокуроров, следователей, журналистов, должностных лиц и граждан,
              желающих конфиденциально сообщить о нарушениях закона
            </p>
          </div>

          {/* Правовая база */}
          <div className="p-4 rounded-2xl mb-4"
            style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.2)" }}>
            <button className="w-full flex items-center justify-between" onClick={() => setShowLaw(v => !v)}>
              <div className="flex items-center gap-2">
                <Icon name="BookOpen" size={15} style={{ color: "#a855f7" }} />
                <span className="text-xs font-bold text-white/70">Правовая основа системы</span>
              </div>
              <Icon name={showLaw ? "ChevronUp" : "ChevronDown"} size={14} className="text-white/30" />
            </button>
            {showLaw && (
              <div className="mt-3 space-y-2 text-[11px] text-white/50 leading-relaxed">
                <p>📜 <b className="text-white/70">Конституция РФ, ст. 23, 29, 33</b> — право на тайну переписки, свободу информации, обращения в органы власти</p>
                <p>📜 <b className="text-white/70">ФЗ №59</b> «О порядке рассмотрения обращений граждан» — обязанность органов рассматривать обращения</p>
                <p>📜 <b className="text-white/70">ФЗ №273, ст. 9</b> — обязанность сообщать о коррупции, защита лица, сообщившего о нарушении</p>
                <p>📜 <b className="text-white/70">Закон РФ о СМИ, ст. 41</b> — журналист обязан хранить тайну источника</p>
                <p>📜 <b className="text-white/70">ФЗ «О статусе судей», ст. 9</b> — неприкосновенность судьи</p>
                <p>📜 <b className="text-white/70">УК РФ ст. 306</b> — ответственность за заведомо ложный донос (для защиты фигурантов от клеветы)</p>
              </div>
            )}
          </div>

          {/* Как работает анонимность */}
          <div className="p-4 rounded-2xl mb-4"
            style={{ background: "rgba(0,255,135,0.04)", border: "1px solid rgba(0,255,135,0.12)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="Lock" size={14} style={{ color: "#00ff87" }} />
              <span className="text-xs font-bold" style={{ color: "#00ff87" }}>Как работает анонимность</span>
            </div>
            <div className="space-y-2 text-[11px] text-white/50 leading-relaxed">
              <p>🔒 Личные данные <b className="text-white/70">не запрашиваются и не хранятся</b></p>
              <p>🔒 Обращению присваивается <b className="text-white/70">анонимный хэш-код</b> — только по нему можно отследить статус</p>
              <p>🔒 Даже владелец системы <b className="text-white/70">не видит, кто подал обращение</b></p>
              <p>🔒 При официальном расследовании (по решению суда) раскрытие возможно только через <b className="text-white/70">судебный запрос</b></p>
              <p>⚠️ <b className="text-white/70">Вы несёте юридическую ответственность</b> за достоверность сведений (УК РФ ст. 306)</p>
            </div>
          </div>

          {/* Хэш */}
          <div className="p-3 rounded-xl mb-6 text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="text-[10px] text-white/30 mb-1">Ваш анонимный идентификатор обращения</div>
            <div className="font-mono text-lg font-black tracking-widest" style={{ color: "#00ff87" }}>{anonHash}</div>
            <div className="text-[10px] text-white/20 mt-1">Запомните или запишите — он нужен для отслеживания статуса</div>
          </div>

          {/* Согласие */}
          <label className="flex items-start gap-3 cursor-pointer mb-6">
            <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-purple-500" />
            <span className="text-xs text-white/50 leading-relaxed">
              Я подтверждаю, что сведения в обращении правдивы. Я понимаю, что несу ответственность
              по <b className="text-white/70">УК РФ ст. 306</b> за заведомо ложный донос.
              Я ознакомлен с условиями анонимности.
            </span>
          </label>

          <button
            disabled={!accepted}
            onClick={() => setStep("role")}
            className="w-full py-4 rounded-2xl font-black text-sm tracking-wider transition-all hover:scale-[1.02] disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: accepted ? "linear-gradient(135deg, #a855f7, #3b82f6)" : "rgba(255,255,255,0.05)", color: "#fff" }}>
            Продолжить → Выбрать роль
          </button>

          <button onClick={() => navigate("/egsu/start")} className="w-full mt-3 py-2 text-xs text-white/20 hover:text-white/40 transition-colors">
            ← Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  // ─── Шаг 2: Выбор роли ───────────────────────────────────────────────────
  if (step === "role") {
    return (
      <div ref={topRef} className="min-h-screen p-4 md:p-8" style={{ background: "#060a12", color: "#fff" }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => setStep("disclaimer")} className="text-white/30 hover:text-white/60 transition-colors">
              <Icon name="ChevronLeft" size={20} />
            </button>
            <div>
              <div className="text-xs text-white/30 font-mono">Шаг 1 из 3</div>
              <h2 className="text-lg font-black text-white">Ваша роль</h2>
            </div>
            <div className="ml-auto font-mono text-[10px] px-2 py-1 rounded-lg"
              style={{ background: "rgba(0,255,135,0.06)", color: "#00ff87" }}>{anonHash}</div>
          </div>

          <p className="text-white/30 text-xs mb-6">
            Роль влияет на правовой режим обращения и применяемые нормы защиты источника.
            Ваша реальная личность <b className="text-white/50">не запрашивается</b>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.entries(VIP_ROLES) as Array<[VipRole, typeof VIP_ROLES["judge"]]>).map(([key, cfg]) => (
              <button key={key} onClick={() => { setRole(key); setStep("form"); }}
                className="flex items-start gap-3 p-4 rounded-2xl text-left transition-all hover:scale-[1.01]"
                style={{
                  background: role === key ? `${cfg.color}15` : "rgba(255,255,255,0.02)",
                  border: `1px solid ${role === key ? cfg.color + "40" : "rgba(255,255,255,0.06)"}`,
                }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${cfg.color}15` }}>
                  <Icon name={cfg.icon as "Shield"} size={18} style={{ color: cfg.color }} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white/90">{cfg.label}</div>
                  <div className="text-[10px] text-white/35 mt-0.5 leading-snug">{cfg.note}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Шаг 3: Форма ────────────────────────────────────────────────────────
  if (step === "form") {
    const roleCfg = role ? VIP_ROLES[role] : null;
    return (
      <div ref={topRef} className="min-h-screen p-4 md:p-8" style={{ background: "#060a12", color: "#fff" }}>
        <div className="max-w-2xl mx-auto">

          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setStep("role")} className="text-white/30 hover:text-white/60 transition-colors">
              <Icon name="ChevronLeft" size={20} />
            </button>
            <div>
              <div className="text-xs text-white/30 font-mono">Шаг 2 из 3</div>
              <h2 className="text-lg font-black text-white">Детали обращения</h2>
            </div>
            <div className="ml-auto font-mono text-[10px] px-2 py-1 rounded-lg"
              style={{ background: "rgba(0,255,135,0.06)", color: "#00ff87" }}>{anonHash}</div>
          </div>

          {roleCfg && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-6"
              style={{ background: `${roleCfg.color}10`, border: `1px solid ${roleCfg.color}25` }}>
              <Icon name={roleCfg.icon as "Shield"} size={15} style={{ color: roleCfg.color }} />
              <span className="text-xs font-semibold" style={{ color: roleCfg.color }}>{roleCfg.label}</span>
              <span className="text-[10px] text-white/30 ml-1">{roleCfg.note}</span>
            </div>
          )}

          <div className="space-y-5">

            {/* Категория нарушения */}
            <div>
              <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wider">Категория нарушения *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.entries(VIP_CATEGORIES) as Array<[VipCategory, typeof VIP_CATEGORIES["corruption"]]>).map(([key, cfg]) => (
                  <button key={key} onClick={() => setCategory(key)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all"
                    style={{
                      background: category === key ? `${cfg.color}18` : "rgba(255,255,255,0.02)",
                      border: `1px solid ${category === key ? cfg.color + "50" : "rgba(255,255,255,0.06)"}`,
                      color: category === key ? cfg.color : "rgba(255,255,255,0.5)",
                    }}>
                    <Icon name={cfg.icon as "Shield"} size={13} />
                    <span className="leading-tight">{cfg.label}</span>
                  </button>
                ))}
              </div>
              {category && (
                <div className="mt-2 text-[10px] text-white/30 pl-1">
                  Правовая норма: {VIP_CATEGORIES[category].law}
                </div>
              )}
            </div>

            {/* Кто является предметом жалобы */}
            <div>
              <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wider">
                Фигурант (ФИО или описание) *
              </label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Например: Иванов И.И. или «начальник ГИБДД района N»"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wider">Должность</label>
                <input
                  value={subjectPosition}
                  onChange={e => setSubjectPosition(e.target.value)}
                  placeholder="Судья, прокурор, депутат..."
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wider">Организация</label>
                <input
                  value={subjectOrg}
                  onChange={e => setSubjectOrg(e.target.value)}
                  placeholder="Суд, ведомство, компания..."
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>
            </div>

            {/* Описание */}
            <div>
              <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wider">
                Описание нарушения *
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
                placeholder="Опишите нарушение максимально подробно: что произошло, когда, где, какие последствия. Укажите статью закона если знаете."
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none resize-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              <div className="text-[10px] text-white/20 mt-1 text-right">{description.length} симв.</div>
            </div>

            {/* Доказательства */}
            <div>
              <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wider">
                Имеющиеся доказательства
              </label>
              <textarea
                value={evidenceDesc}
                onChange={e => setEvidenceDesc(e.target.value)}
                rows={3}
                placeholder="Укажите что есть: документы, записи, переписка, свидетели, фото/видео. Физические материалы направьте отдельно."
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none resize-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>

            {/* Куда направить */}
            <div>
              <label className="block text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">
                Направить в орган *
              </label>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1 mb-2">
                {TARGET_GROUPS.map(group => (
                  <div key={group.label}>
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1"
                      style={{ color: group.color }}>
                      {group.label}
                    </div>
                    <div className="space-y-1">
                      {group.orgs.map(org => (
                        <button key={org} onClick={() => setTargetOrg(org)}
                          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-left text-xs transition-all"
                          style={{
                            background: targetOrg === org ? `${group.color}12` : "rgba(255,255,255,0.02)",
                            border: `1px solid ${targetOrg === org ? group.color + "45" : "rgba(255,255,255,0.05)"}`,
                            color: targetOrg === org ? group.color : "rgba(255,255,255,0.5)",
                          }}>
                          <Icon name={targetOrg === org ? "CheckCircle" : "Circle"} size={12} />
                          {org.replace(/^ECSU: /, "")}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <input
                value={customTarget}
                onChange={e => setCustomTarget(e.target.value)}
                placeholder="Или введите свой орган..."
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
            </div>

            {/* Срочность */}
            <div>
              <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wider">Степень срочности</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(urgencyConfig) as Array<[typeof urgency, typeof urgencyConfig["normal"]]>).map(([key, cfg]) => (
                  <button key={key} onClick={() => setUrgency(key)}
                    className="px-3 py-2.5 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: urgency === key ? `${cfg.color}15` : "rgba(255,255,255,0.02)",
                      border: `1px solid ${urgency === key ? cfg.color + "40" : "rgba(255,255,255,0.06)"}`,
                      color: urgency === key ? cfg.color : "rgba(255,255,255,0.35)",
                    }}>
                    <div>{cfg.label}</div>
                    <div className="text-[9px] font-normal mt-0.5 opacity-70">{cfg.note}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            disabled={!category || !subject || !description || (!targetOrg && !customTarget)}
            onClick={() => setStep("review")}
            className="w-full mt-8 py-4 rounded-2xl font-black text-sm tracking-wider transition-all hover:scale-[1.01] disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)", color: "#fff" }}>
            Проверить перед отправкой →
          </button>
        </div>
      </div>
    );
  }

  // ─── Шаг 4: Проверка ─────────────────────────────────────────────────────
  if (step === "review") {
    const catCfg = category ? VIP_CATEGORIES[category] : null;
    const roleCfg = role ? VIP_ROLES[role] : null;
    const finalTarget = customTarget || targetOrg;
    return (
      <div ref={topRef} className="min-h-screen p-4 md:p-8" style={{ background: "#060a12", color: "#fff" }}>
        <div className="max-w-2xl mx-auto">

          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setStep("form")} className="text-white/30 hover:text-white/60 transition-colors">
              <Icon name="ChevronLeft" size={20} />
            </button>
            <div>
              <div className="text-xs text-white/30 font-mono">Шаг 3 из 3 — Проверка</div>
              <h2 className="text-lg font-black text-white">Подтвердите обращение</h2>
            </div>
          </div>

          <div className="p-5 rounded-2xl mb-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>

            <div className="flex items-center justify-between mb-4 pb-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="font-mono text-lg font-black" style={{ color: "#00ff87" }}>{anonHash}</div>
              {catCfg && (
                <span className="px-2 py-1 rounded-lg text-xs font-bold"
                  style={{ background: `${catCfg.color}15`, color: catCfg.color, border: `1px solid ${catCfg.color}30` }}>
                  {catCfg.label}
                </span>
              )}
            </div>

            <div className="space-y-3 text-sm">
              {roleCfg && (
                <div className="flex gap-3">
                  <span className="text-white/30 w-28 shrink-0 text-xs">Роль</span>
                  <span className="text-white/80 font-semibold" style={{ color: roleCfg.color }}>{roleCfg.label}</span>
                </div>
              )}
              <div className="flex gap-3">
                <span className="text-white/30 w-28 shrink-0 text-xs">Фигурант</span>
                <span className="text-white/80">{subject}{subjectPosition && ` (${subjectPosition})`}{subjectOrg && `, ${subjectOrg}`}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-white/30 w-28 shrink-0 text-xs">Описание</span>
                <span className="text-white/70 text-xs leading-relaxed line-clamp-4">{description}</span>
              </div>
              {evidenceDesc && (
                <div className="flex gap-3">
                  <span className="text-white/30 w-28 shrink-0 text-xs">Доказательства</span>
                  <span className="text-white/60 text-xs">{evidenceDesc}</span>
                </div>
              )}
              <div className="flex gap-3">
                <span className="text-white/30 w-28 shrink-0 text-xs">Направить в</span>
                <span className="text-white/80 font-semibold text-xs">{finalTarget}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-white/30 w-28 shrink-0 text-xs">Срочность</span>
                <span className="font-bold text-xs" style={{ color: urgencyConfig[urgency].color }}>
                  {urgencyConfig[urgency].label} — {urgencyConfig[urgency].note}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl mb-6 text-[11px] leading-relaxed"
            style={{ background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.15)", color: "rgba(255,255,255,0.4)" }}>
            ⚠️ После отправки данные будут направлены в выбранный орган. Личность заявителя
            скрыта. Раскрытие возможно только по решению суда в рамках официального расследования.
            Вы несёте ответственность по УК РФ ст. 306 за ложный донос.
          </div>

          <button
            onClick={handleSubmit}
            disabled={sending}
            className="w-full py-4 rounded-2xl font-black text-sm tracking-wider transition-all hover:scale-[1.01] disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)", color: "#fff" }}>
            {sending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Защищённая передача...
              </span>
            ) : "✓ Отправить анонимное обращение"}
          </button>

          <button onClick={() => setStep("form")} className="w-full mt-3 py-2 text-xs text-white/20 hover:text-white/40 transition-colors">
            ← Вернуться к редактированию
          </button>
        </div>
      </div>
    );
  }

  // ─── Шаг 5: Успешно отправлено ───────────────────────────────────────────
  if (step === "sent" && report) {
    return (
      <div ref={topRef} className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: "#060a12", color: "#fff" }}>
        <div className="w-full max-w-lg text-center">

          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "linear-gradient(135deg, #00ff87, #3b82f6)" }}>
            <Icon name="ShieldCheck" size={36} className="text-black" />
          </div>

          <h1 className="text-2xl font-black text-white mb-2">Обращение зарегистрировано</h1>
          <p className="text-white/40 text-sm mb-6">
            Защищённый канал ECSU 2.0 · Анонимность сохранена
          </p>

          <div className="p-5 rounded-2xl mb-6"
            style={{ background: "rgba(0,255,135,0.05)", border: "1px solid rgba(0,255,135,0.2)" }}>
            <div className="text-xs text-white/30 mb-2">Идентификатор обращения</div>
            <div className="font-mono text-2xl font-black tracking-widest mb-3" style={{ color: "#00ff87" }}>
              {report.hash}
            </div>
            <div className="text-[11px] text-white/40 mb-4 leading-relaxed">
              Сохраните этот код. Только по нему вы сможете отследить статус обращения.
              Никакие данные о вас не хранятся.
            </div>
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="text-[9px] text-white/25 mb-0.5">НАПРАВЛЕНО В</div>
                <div className="text-xs text-white/70 font-semibold">{report.target_org}</div>
              </div>
              <div className="p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="text-[9px] text-white/25 mb-0.5">СРОЧНОСТЬ</div>
                <div className="text-xs font-bold" style={{ color: urgencyConfig[report.urgency].color }}>
                  {urgencyConfig[report.urgency].label}
                </div>
              </div>
              <div className="p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="text-[9px] text-white/25 mb-0.5">КАТЕГОРИЯ</div>
                <div className="text-xs text-white/70">{category ? VIP_CATEGORIES[category].label : ""}</div>
              </div>
              <div className="p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="text-[9px] text-white/25 mb-0.5">ЗАРЕГИСТРИРОВАНО</div>
                <div className="text-xs text-white/70 font-mono">
                  {new Date(report.created_at).toLocaleString("ru-RU")}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl mb-6 text-left"
            style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)" }}>
            <div className="text-xs font-bold text-white/50 mb-2 uppercase tracking-wider">Дальнейшие действия</div>
            <div className="space-y-1.5 text-[11px] text-white/40 leading-relaxed">
              <p>📋 Обращение направлено в: <b className="text-white/60">{report.target_org}</b></p>
              <p>⏱️ Срок рассмотрения: <b className="text-white/60">{urgencyConfig[report.urgency].note}</b></p>
              <p>📌 При бездействии более 30 дней — автоматическая эскалация в прокуратуру (КоАП РФ ст. 5.59)</p>
              <p>🔒 Ваша личность раскрывается <b className="text-white/60">только по решению суда</b> в рамках официального расследования</p>
            </div>
          </div>

          <button onClick={() => navigate("/egsu/start")}
            className="w-full py-3 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.01]"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
            ← На главную ECSU
          </button>
        </div>
      </div>
    );
  }

  return null;
}