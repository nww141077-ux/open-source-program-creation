import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const OWNER = {
  name: "Николаев Владимир Владимирович",
  email: "nikolaevvladimir77@yandex.ru",
  system: "ECSU 2.0 — Единая Центральная Система Управления",
  status: "гражданское лицо, автор системы ECSU 2.0",
  address: "Российская Федерация",
};

const G = (s: string) => `linear-gradient(135deg, ${s})`;

type Capability = {
  id: string;
  category: string;
  icon: string;
  color: string;
  title: string;
  short: string;
  what: string;
  howHelps: string[];
  legalBasis: string[];
  forAgency: string[];
  evidence: string;
  module: string;
  status: "active" | "beta" | "development";
};

const CAPABILITIES: Capability[] = [
  {
    id: "incident-scanner",
    category: "Мониторинг и обнаружение",
    icon: "Radar",
    color: "#00ff87",
    title: "Автоматический сканер инцидентов",
    short: "Мониторинг открытых источников: GDACS, USGS, OpenAQ, ReliefWeb, CVE, EMSC",
    what: "Система автоматически сканирует международные базы данных катастроф, землетрясений, экологических нарушений, уязвимостей кибербезопасности и гуманитарных кризисов. Обновление в реальном времени каждые 30 минут.",
    howHelps: [
      "Предоставляет объективные данные из независимых международных источников",
      "Фиксирует временну́ю метку обнаружения инцидента — доказательство осведомлённости",
      "Формирует хронологию событий для приложения к обращению",
      "Верификация инцидента через несколько независимых источников повышает доверие органа",
    ],
    legalBasis: [
      "ФЗ №149 «Об информации» — данные из открытых источников",
      "ФЗ №7 ст. 11 — право граждан на получение экологической информации",
      "Орхусская конвенция ст. 5 — доступ к экологической информации",
    ],
    forAgency: [
      "МЧС — данные GDACS/EMSC об опасных природных явлениях",
      "Росприроднадзор — данные OpenAQ об уровне загрязнения воздуха",
      "ФСБ/ФСТЭК — данные CVE об уязвимостях в критической инфраструктуре",
      "МВД — верифицированные данные ReliefWeb о гуманитарных инцидентах",
    ],
    evidence: "Автоматически сформированная карточка инцидента с источником, датой, координатами и уровнем серьёзности. Подходит как приложение к обращению.",
    module: "incident-scanner",
    status: "active",
  },
  {
    id: "ai-legal",
    category: "Правовое содействие",
    icon: "Scale",
    color: "#a855f7",
    title: "ИИ-анализ правовой базы",
    short: "Автоматический подбор применимых норм закона, формирование официального текста обращения",
    what: "Искусственный интеллект анализирует описание инцидента и формирует полное юридически грамотное обращение в государственные органы. Подбирает нормы из КоАП, УК РФ, федеральных законов и международных конвенций. Указывает последствия бездействия органа.",
    howHelps: [
      "Составляет официальное обращение в деловом стиле с конкретными требованиями",
      "Указывает точные статьи законов — орган не может игнорировать конкретные нормы",
      "Формирует раздел «последствия бездействия» — ссылка на ст. 5.59 КоАП, ст. 293, 315 УК РФ",
      "Адаптирует текст под конкретный орган (прокуратура / следком / МЧС)",
    ],
    legalBasis: [
      "ФЗ №59 «О порядке рассмотрения обращений граждан РФ» — 30 дней на ответ",
      "Конституция РФ ст. 33 — право на обращение в государственные органы",
      "КоАП ст. 5.59 — штраф 5000–10000 руб. за нарушение порядка рассмотрения",
    ],
    forAgency: [
      "Прокуратура — полный правовой анализ с основаниями для проверки",
      "Следственный комитет — обоснование признаков состава преступления",
      "Уполномоченный по правам человека — анализ нарушений конституционных прав",
      "Антикоррупционные органы — нормы ФЗ №273 и UNCAC",
    ],
    evidence: "Сгенерированный текст обращения, готовый к подписи и отправке. Приложения: список применимых норм, источники данных об инциденте.",
    module: "egsu-ai",
    status: "active",
  },
  {
    id: "security-absorption",
    category: "Фиксация нарушений",
    icon: "ShieldAlert",
    color: "#f43f5e",
    title: "Модуль безопасности и режим поглощения",
    short: "Фиксация кибератак, несанкционированного доступа, блокировок системы с расчётом ущерба",
    what: "Автоматически регистрирует каждую попытку несанкционированного доступа к системе, кибератаки, DDoS, SQL-инъекции, блокировки. Определяет геолокацию, провайдера, ASN нарушителя. Рассчитывает размер ущерба по установленным тарифам. Все события сохраняются в неизменяемой базе данных.",
    howHelps: [
      "Создаёт криминалистически значимый журнал событий с временны́ми метками",
      "Идентифицирует провайдера и владельца канала атаки",
      "Автоматически рассчитывает размер материального ущерба",
      "Блокирует источники угроз и фиксирует факт блокировки",
    ],
    legalBasis: [
      "УК РФ ст. 272 — неправомерный доступ к компьютерной информации",
      "УК РФ ст. 273 — создание вредоносных программ",
      "УК РФ ст. 274 — нарушение правил эксплуатации ЭВМ",
      "ФЗ №149 ст. 17 — гражданская ответственность за нарушение в сфере информации",
      "Будапештская конвенция о киберпреступности (2001)",
    ],
    forAgency: [
      "ФСБ — журнал кибератак как доказательная база для расследования",
      "МВД — идентификация нарушителя по IP, провайдеру, ASN",
      "Прокуратура — расчёт ущерба для предъявления иска",
      "ФСТЭК — данные об угрозах информационной безопасности",
    ],
    evidence: "Экспортируемый журнал событий безопасности (JSON/CSV) с IP-адресами, провайдерами, типами атак, временны́ми метками и расчётом ущерба.",
    module: "security",
    status: "active",
  },
  {
    id: "finance-tracking",
    category: "Финансовая прозрачность",
    icon: "Wallet",
    color: "#f59e0b",
    title: "Финансовый модуль и счёт поглощения",
    short: "Учёт штрафов, транзакций, баланса счёта поглощения с полной историей",
    what: "Система ведёт прозрачный учёт всех финансовых операций: начисленных штрафов за нарушения, движений по счёту поглощения. Вся история хранится в базе данных с возможностью экспорта.",
    howHelps: [
      "Документирует финансовый ущерб от действий нарушителей",
      "Формирует реестр требований о возмещении с суммами и основаниями",
      "Обеспечивает прозрачность для финансового мониторинга",
      "Данные о транзакциях подтверждают факты нарушений с денежным измерением",
    ],
    legalBasis: [
      "ГК РФ ст. 15 — возмещение убытков",
      "ГК РФ ст. 1064 — общие основания ответственности за причинение вреда",
      "УК РФ ст. 159 — мошенничество (при соответствующих обстоятельствах)",
      "ФЗ №115 «О противодействии легализации (отмыванию) доходов»",
    ],
    forAgency: [
      "Прокуратура — финансовое обоснование ущерба для иска",
      "Следственный комитет — доказательства материального вреда",
      "Росфинмониторинг — данные о движении средств",
      "Суд — точный расчёт исковых требований",
    ],
    evidence: "Выгрузка финансовых транзакций с датами, суммами, основаниями и статусами операций.",
    module: "finance",
    status: "active",
  },
  {
    id: "sms-notifications",
    category: "Коммуникация",
    icon: "MessageSquare",
    color: "#3b82f6",
    title: "SMS-уведомления и мониторинг каналов связи",
    short: "Отправка уведомлений в государственные органы, мониторинг ответов",
    what: "Система может направлять SMS-уведомления с кратким описанием инцидента в органы власти и на телефоны доверия. Ведёт журнал отправок и статусов доставки.",
    howHelps: [
      "Фиксирует факт и время уведомления органа о происходящем",
      "Создаёт документальный след — орган был уведомлён официально",
      "Журнал доставки подтверждает, что уведомление получено",
      "Ускоряет реагирование при ЧС — параллельная отправка нескольким органам",
    ],
    legalBasis: [
      "ФЗ №59 ст. 4 — право на получение ответа по существу",
      "ФЗ №68 ст. 14 — обязанность информирования при ЧС",
      "КоАП ст. 5.59 — ответственность за неполучение/игнорирование обращений",
    ],
    forAgency: [
      "МЧС — немедленное уведомление при обнаружении ЧС",
      "МВД — фиксация факта обращения с временно́й меткой",
      "Прокуратура — подтверждение, что орган был уведомлён",
      "Уполномоченный по правам человека — документирование обращений",
    ],
    evidence: "Журнал отправленных SMS-уведомлений с временны́ми метками, номерами получателей и статусами доставки.",
    module: "sms-monitor",
    status: "active",
  },
  {
    id: "gateway-api",
    category: "Регистрация и учёт",
    icon: "Database",
    color: "#06b6d4",
    title: "Публичный реестр обращений и инцидентов",
    short: "Централизованная база данных зарегистрированных обращений, инцидентов и статусов рассмотрения",
    what: "Каждое обращение получает уникальный код регистрации (APL-XXXXXX). База данных инцидентов общедоступна через API. Все данные хранятся с временны́ми метками и невозможностью ретроспективного изменения.",
    howHelps: [
      "Присваивает обращению уникальный трекинговый код",
      "Обеспечивает публичную проверяемость — факт инцидента зафиксирован открыто",
      "Международный доступ к данным через открытый API",
      "Автоматическая эскалация при отсутствии ответа в 30 дней",
    ],
    legalBasis: [
      "ФЗ №59 — обращения граждан подлежат регистрации",
      "ФЗ №149 ст. 8 — право на получение информации",
      "Конвенция ООН по транснациональной организованной преступности",
    ],
    forAgency: [
      "Любой орган — публичная верификация факта обращения по коду",
      "Прокуратура — системный учёт нарушений в конкретном регионе",
      "Международные организации — доступ через открытый API",
      "СМИ и общественность — публичный реестр инцидентов",
    ],
    evidence: "Карточка инцидента с кодом, датой, типом, статусом верификации и историей изменений.",
    module: "gateway",
    status: "active",
  },
  {
    id: "legal-base",
    category: "Правовая база",
    icon: "BookOpen",
    color: "#10b981",
    title: "База правовых норм и судебной практики",
    short: "Структурированная база данных законов, конвенций, прецедентов по категориям инцидентов",
    what: "Полная правовая база: УК РФ, КоАП, федеральные законы, международные конвенции и договоры, которые можно применить при конкретном типе нарушения. Регулярно обновляется.",
    howHelps: [
      "Мгновенный подбор применимых норм по типу нарушения",
      "Ссылки на международные нормы усиливают позицию гражданина",
      "Готовые формулировки требований для каждого типа обращения",
      "Указание на международные обязательства РФ при бездействии органов",
    ],
    legalBasis: [
      "Конституция РФ — основа всех правовых требований",
      "Международные договоры РФ — обязательны к исполнению (ст. 15 Конституции)",
      "Пакт ООН о гражданских и политических правах",
    ],
    forAgency: [
      "Прокуратура — точные ссылки на нормы для проверки",
      "Суд — правовое обоснование для иска",
      "Следственный комитет — квалификация состава",
      "Уполномоченный по правам человека — международные стандарты защиты",
    ],
    evidence: "Список применимых правовых норм с цитатами и последствиями их нарушения — приложение к обращению.",
    module: "legal-base",
    status: "active",
  },
  {
    id: "voice-control",
    category: "Доступность",
    icon: "Mic",
    color: "#8b5cf6",
    title: "Голосовое управление системой",
    short: "Речевой интерфейс для управления дашбордом и фиксации инцидентов",
    what: "Модуль Яндекс SpeechKit позволяет управлять системой голосом — фиксировать инциденты, выбирать разделы, получать данные. Полезен при экстренных ситуациях, когда нет возможности работать руками.",
    howHelps: [
      "Фиксация инцидента голосом в экстренной ситуации",
      "Доступность для людей с ограниченными возможностями",
      "Быстрый ввод данных при стрессовых обстоятельствах",
      "Озвучивание информации о правах и порядке действий",
    ],
    legalBasis: [
      "ФЗ №181 «О социальной защите инвалидов» — доступность государственных сервисов",
      "Конституция РФ ст. 39 — социальная защита",
    ],
    forAgency: [
      "Уполномоченный по правам инвалидов — доступность системы",
      "Минцифры — соответствие стандартам доступности",
    ],
    evidence: "Аудиозапись и транскрипция голосового сообщения об инциденте.",
    module: "egsu-voice",
    status: "beta",
  },
  {
    id: "export-package",
    category: "Документооборот",
    icon: "Package",
    color: "#ec4899",
    title: "Генератор официальных документов и дистрибутивов",
    short: "Автоматическая подготовка пакета документов: обращения, лицензии, отчёты",
    what: "Система автоматически формирует полный пакет документов для обращения в органы: официальные письма, отчёты об инцидентах, перечень доказательств, приложения. Документы соответствуют требованиям делопроизводства.",
    howHelps: [
      "Формирует документы в официально-деловом стиле, принятом органами власти",
      "Комплектует полный пакет — орган не может вернуть по причине неполноты",
      "Создаёт ZIP-архив для передачи через электронную приёмную или email",
      "Сохраняет копию в системе как доказательство факта обращения",
    ],
    legalBasis: [
      "ФЗ №59 — требования к форме обращения",
      "ГОСТ Р 7.0.97-2016 — оформление организационно-распорядительных документов",
      "ФЗ №63 «Об электронной подписи» — электронный документооборот",
    ],
    forAgency: [
      "Любой орган — готовый пакет документов в установленном формате",
      "Суд — оформленные документы для иска",
      "Прокуратура — отчёт с доказательной базой",
      "Международные организации — документы на русском/английском языке",
    ],
    evidence: "ZIP-архив с setup.py, README, лицензией, скриптами и полным комплектом документов.",
    module: "export-manager",
    status: "active",
  },
];

const CATEGORIES = [...new Set(CAPABILITIES.map(c => c.category))];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "Активно", color: "#22c55e" },
  beta: { label: "Бета", color: "#f59e0b" },
  development: { label: "В разработке", color: "#6b7280" },
};

const AGENCIES_FULL = [
  { name: "Генеральная прокуратура РФ", url: "https://epp.genproc.gov.ru/web/gprf/internet-reception", icon: "Shield", color: "#f43f5e" },
  { name: "Следственный комитет РФ", url: "https://sledcom.ru/reception", icon: "Search", color: "#f59e0b" },
  { name: "МЧС России", url: "https://mchs.gov.ru/ministry/feedback", icon: "Flame", color: "#ef4444" },
  { name: "МВД России", url: "https://mvd.ru/request_main", icon: "ShieldCheck", color: "#3b82f6" },
  { name: "ФСБ России", url: "https://www.fsb.ru/fsb/reception.htm", icon: "Eye", color: "#6366f1" },
  { name: "Росприроднадзор", url: "https://rpn.gov.ru/contacts/appeals/", icon: "Leaf", color: "#10b981" },
  { name: "Уполн. по правам человека", url: "https://ombudsmanrf.org/reception/online_reception", icon: "Users", color: "#a855f7" },
  { name: "Счётная палата РФ", url: "https://ach.gov.ru/appeals", icon: "BarChart3", color: "#06b6d4" },
];

export default function EgsuCapabilities() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Capability | null>(null);
  const [filter, setFilter] = useState("all");
  const [tab, setTab] = useState<"capabilities" | "agencies" | "howto">("capabilities");

  const filtered = filter === "all"
    ? CAPABILITIES
    : CAPABILITIES.filter(c => c.category === filter);

  return (
    <div style={{ minHeight: "100vh", background: "#060a12", color: "#e0e8ff", fontFamily: "'Golos Text', monospace" }}>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(6,10,18,0.98)", borderBottom: "1px solid rgba(0,255,135,0.15)", backdropFilter: "blur(20px)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate("/egsu/dashboard")} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer" }}>
          <Icon name="ChevronLeft" size={18} />
        </button>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: G("#00ff87, #3b82f6"), display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="Zap" size={16} style={{ color: "#000" }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: 2, color: "#fff" }}>ВОЗМОЖНОСТИ СИСТЕМЫ</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>ECSU 2.0 · Ресурсы · Инструменты содействия органам власти</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => navigate("/egsu/appeal")}
            style={{ padding: "8px 14px", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, color: "#a855f7", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            Подать обращение →
          </button>
        </div>
      </nav>

      <div style={{ paddingTop: 72, maxWidth: 1100, margin: "0 auto", padding: "72px 16px 60px" }}>

        {/* Заголовок */}
        <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 11, color: "#00ff87", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>
            ECSU 2.0 · ГРАЖДАНСКАЯ ИНИЦИАТИВА
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 12, lineHeight: 1.2 }}>
            Ресурсы системы для содействия<br />надзорным органам
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.8, maxWidth: 720 }}>
            ECSU 2.0 — гражданская система мониторинга и правового содействия. На базовом гражданском уровне система
            располагает следующими инструментами, которые могут быть применены при обращении в государственные,
            надзорные и правоохранительные органы.
          </p>
          <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { icon: "Server", label: "9 активных модулей", color: "#00ff87" },
              { icon: "Database", label: "PostgreSQL база данных", color: "#3b82f6" },
              { icon: "Globe", label: "Открытый API", color: "#a855f7" },
              { icon: "Shield", label: "Фиксация нарушений 24/7", color: "#f43f5e" },
              { icon: "FileText", label: "Генерация документов", color: "#f59e0b" },
              { icon: "Brain", label: "ИИ-правовой анализ", color: "#ec4899" },
            ].map(b => (
              <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: `${b.color}10`, border: `1px solid ${b.color}25`, borderRadius: 20, fontSize: 12, color: b.color }}>
                <Icon name={b.icon as "Server"} size={13} />
                {b.label}
              </div>
            ))}
          </div>
        </div>

        {/* Основные табы */}
        <div style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0 }}>
          {([
            { id: "capabilities", label: "Возможности и ресурсы", icon: "Zap" },
            { id: "agencies", label: "Органы и ссылки", icon: "Building2" },
            { id: "howto", label: "Как применить", icon: "BookOpen" },
          ] as { id: typeof tab; label: string; icon: string }[]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: "10px 18px", background: "none", border: "none", borderBottom: `2px solid ${tab === t.id ? "#00ff87" : "transparent"}`, color: tab === t.id ? "#00ff87" : "rgba(255,255,255,0.35)", cursor: "pointer", fontWeight: tab === t.id ? 700 : 400, fontSize: 13, display: "flex", alignItems: "center", gap: 7, transition: "all 0.2s" }}>
              <Icon name={t.icon as "Zap"} size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══ ТАБ: ВОЗМОЖНОСТИ ═══ */}
        {tab === "capabilities" && (
          <div>
            {/* Фильтр по категориям */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
              <button onClick={() => setFilter("all")}
                style={{ padding: "6px 14px", background: filter === "all" ? "rgba(0,255,135,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${filter === "all" ? "rgba(0,255,135,0.35)" : "rgba(255,255,255,0.08)"}`, borderRadius: 20, color: filter === "all" ? "#00ff87" : "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 12, fontWeight: filter === "all" ? 700 : 400 }}>
                Все ({CAPABILITIES.length})
              </button>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setFilter(cat)}
                  style={{ padding: "6px 14px", background: filter === cat ? "rgba(0,255,135,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${filter === cat ? "rgba(0,255,135,0.25)" : "rgba(255,255,255,0.08)"}`, borderRadius: 20, color: filter === cat ? "#00ff87" : "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 12 }}>
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "repeat(auto-fill, minmax(320px, 1fr))", gap: 16, alignItems: "start" }}>
              {/* Карточки */}
              <div style={{ display: "grid", gap: 14 }}>
                {filtered.map(cap => (
                  <div key={cap.id} onClick={() => setSelected(selected?.id === cap.id ? null : cap)}
                    style={{ background: selected?.id === cap.id ? `${cap.color}10` : "rgba(255,255,255,0.02)", border: `1px solid ${selected?.id === cap.id ? cap.color + "40" : "rgba(255,255,255,0.07)"}`, borderRadius: 14, padding: 18, cursor: "pointer", transition: "all 0.2s" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${cap.color}15`, border: `1px solid ${cap.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon name={cap.icon as "Radar"} size={20} style={{ color: cap.color }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{cap.title}</div>
                          <div style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: `${STATUS_LABELS[cap.status].color}15`, color: STATUS_LABELS[cap.status].color, fontWeight: 700 }}>
                            {STATUS_LABELS[cap.status].label}
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>{cap.category}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{cap.short}</div>
                      </div>
                    </div>
                    {selected?.id === cap.id && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${cap.color}20` }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {cap.forAgency.slice(0, 2).map(ag => (
                            <div key={ag} style={{ fontSize: 11, padding: "3px 8px", background: `${cap.color}10`, color: cap.color, borderRadius: 6 }}>
                              {ag.split(" — ")[0]}
                            </div>
                          ))}
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>→ подробнее</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Детали выбранного */}
              {selected && (
                <div style={{ background: `${selected.color}08`, border: `1px solid ${selected.color}25`, borderRadius: 16, padding: 24, position: "sticky", top: 80 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: `${selected.color}15`, border: `1px solid ${selected.color}35`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name={selected.icon as "Radar"} size={24} style={{ color: selected.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{selected.title}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{selected.category}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: 20 }}>{selected.what}</div>

                  <Section color={selected.color} title="Как помогает органам" icon="CheckCircle">
                    {selected.howHelps.map((h, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 6, lineHeight: 1.5 }}>
                        <span style={{ color: selected.color, flexShrink: 0 }}>▸</span> {h}
                      </div>
                    ))}
                  </Section>

                  <Section color={selected.color} title="Применимые правовые нормы" icon="Scale">
                    {selected.legalBasis.map((l, i) => (
                      <div key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 5, paddingLeft: 10, borderLeft: `2px solid ${selected.color}50` }}>{l}</div>
                    ))}
                  </Section>

                  <Section color={selected.color} title="Какому органу передаётся" icon="Building2">
                    {selected.forAgency.map((a, i) => (
                      <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 5, display: "flex", gap: 8 }}>
                        <span style={{ color: selected.color, flexShrink: 0 }}>→</span> {a}
                      </div>
                    ))}
                  </Section>

                  <div style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${selected.color}20`, borderRadius: 10, padding: 14, marginTop: 16 }}>
                    <div style={{ fontSize: 11, color: selected.color, fontWeight: 700, marginBottom: 6 }}>📎 Доказательная ценность</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{selected.evidence}</div>
                  </div>

                  <button onClick={() => navigate("/egsu/appeal")}
                    style={{ marginTop: 16, width: "100%", padding: 12, background: G(`${selected.color}, ${selected.color}99`), border: "none", borderRadius: 10, color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    Использовать в обращении →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ ТАБ: ОРГАНЫ ═══ */}
        {tab === "agencies" && (
          <div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24, lineHeight: 1.7 }}>
              Ниже перечислены государственные и надзорные органы, в которые система может направлять обращения,
              данные и уведомления. Все ссылки ведут на официальные электронные приёмные.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginBottom: 32 }}>
              {AGENCIES_FULL.map(ag => (
                <a key={ag.name} href={ag.url} target="_blank" rel="noopener noreferrer"
                  style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${ag.color}20`, borderRadius: 14, padding: 18, textDecoration: "none", display: "flex", alignItems: "center", gap: 14, transition: "all 0.2s" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${ag.color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={ag.icon as "Shield"} size={20} style={{ color: ag.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{ag.name}</div>
                    <div style={{ fontSize: 11, color: ag.color }}>Электронная приёмная →</div>
                  </div>
                </a>
              ))}
            </div>

            {/* Таблица соответствия: инструмент → орган */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Соответствие инструментов системы и органов власти</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      <th style={{ textAlign: "left", padding: "8px 12px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Инструмент ECSU</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Основной орган</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Что передаётся</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { tool: "Сканер инцидентов", agency: "МЧС, Росприроднадзор, ФСБ", what: "Карточка инцидента из международных баз" },
                      { tool: "ИИ-правовой анализ", agency: "Прокуратура, СК, Омбудсмен", what: "Официальное обращение с нормами права" },
                      { tool: "Модуль безопасности", agency: "ФСБ, МВД, ФСТЭК", what: "Журнал кибератак с идентификацией нарушителя" },
                      { tool: "Финансовый учёт", agency: "Прокуратура, СК, Росфинмониторинг", what: "Расчёт ущерба и реестр требований" },
                      { tool: "SMS-уведомления", agency: "МЧС, МВД, Прокуратура", what: "Подтверждение факта уведомления с меткой" },
                      { tool: "Реестр обращений", agency: "Любой орган, международные орг.", what: "Трекинговый код и история обращения" },
                      { tool: "Правовая база", agency: "Суд, Прокуратура, СК", what: "Применимые нормы с цитатами" },
                      { tool: "Генератор документов", agency: "Любой орган", what: "Полный пакет документов в едином архиве" },
                    ].map((r, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "10px 12px", color: "#00ff87", fontWeight: 600 }}>{r.tool}</td>
                        <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.7)" }}>{r.agency}</td>
                        <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.45)" }}>{r.what}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══ ТАБ: КАК ПРИМЕНИТЬ ═══ */}
        {tab === "howto" && (
          <div style={{ display: "grid", gap: 20 }}>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, background: "rgba(0,255,135,0.04)", border: "1px solid rgba(0,255,135,0.12)", borderRadius: 12, padding: 18 }}>
              <strong style={{ color: "#00ff87" }}>Важно:</strong> Система ECSU 2.0 действует как инструмент гражданского содействия на основании
              Конституции РФ (ст. 33), ФЗ №59 и международных конвенций. Все возможности системы применяются
              от имени гражданина — автора системы <strong style={{ color: "#e0e8ff" }}>{OWNER.name}</strong>.
            </div>

            {[
              {
                step: "01",
                color: "#00ff87",
                title: "Зафиксировать инцидент",
                desc: "Подайте инцидент через раздел «Новый инцидент». Система автоматически присвоит код, зафиксирует дату/время, запустит верификацию через международные источники.",
                tools: ["Сканер инцидентов", "Реестр обращений"],
                result: "Верифицированная карточка инцидента с кодом и временной меткой",
                action: "/egsu/report",
                actionLabel: "Подать инцидент",
              },
              {
                step: "02",
                color: "#a855f7",
                title: "Сформировать правовое обоснование",
                desc: "ИИ-помощник системы анализирует тип нарушения и автоматически подбирает применимые нормы из УК РФ, КоАП, федеральных законов и международных конвенций.",
                tools: ["ИИ-правовой анализ", "База правовых норм"],
                result: "Список норм права с цитатами и последствиями бездействия органа",
                action: "/egsu/legal",
                actionLabel: "Правовая база",
              },
              {
                step: "03",
                color: "#3b82f6",
                title: "Составить официальное обращение",
                desc: "На основе данных инцидента и правового анализа ИИ составляет официальное обращение в государственный орган в деловом стиле с конкретными требованиями.",
                tools: ["ИИ-правовой анализ", "Генератор документов"],
                result: "Готовый текст обращения, адаптированный под конкретный орган",
                action: "/egsu/appeal",
                actionLabel: "Составить обращение",
              },
              {
                step: "04",
                color: "#f59e0b",
                title: "Приложить доказательства",
                desc: "К обращению прикладываются данные из других модулей системы: журнал кибератак, данные сканера из международных источников, финансовый расчёт ущерба.",
                tools: ["Модуль безопасности", "Финансовый учёт", "Сканер инцидентов"],
                result: "Пакет приложений: JSON-выгрузки, карточки инцидентов, расчёты",
                action: "/egsu/security",
                actionLabel: "Модуль безопасности",
              },
              {
                step: "05",
                color: "#f43f5e",
                title: "Упаковать и отправить",
                desc: "Генератор документов собирает полный пакет в ZIP-архив. SMS-модуль может направить уведомление в орган с кодом трекинга для подтверждения факта обращения.",
                tools: ["Генератор документов", "SMS-уведомления"],
                result: "ZIP-архив с полным комплектом + подтверждение отправки",
                action: "/egsu/export",
                actionLabel: "Экспорт документов",
              },
              {
                step: "06",
                color: "#ec4899",
                title: "Мониторинг и эскалация",
                desc: "Система отслеживает 30-дневный срок ответа (ФЗ №59). При бездействии органа готовит обращение в прокуратуру со ссылкой на ст. 5.59 КоАП (штраф 5000–10000 руб.).",
                tools: ["Реестр обращений", "ИИ-правовой анализ"],
                result: "Автоматическое уведомление об истечении срока и проект жалобы",
                action: "/egsu/notifications",
                actionLabel: "Уведомления",
              },
            ].map(s => (
              <div key={s.step} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${s.color}20`, borderRadius: 14, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: `${s.color}30`, letterSpacing: -2, flexShrink: 0, lineHeight: 1 }}>{s.step}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 14 }}>{s.desc}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                      {s.tools.map(t => (
                        <div key={t} style={{ fontSize: 11, padding: "3px 10px", background: `${s.color}10`, border: `1px solid ${s.color}25`, borderRadius: 20, color: s.color }}>
                          {t}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                        <span style={{ color: s.color }}>✓</span> {s.result}
                      </div>
                      <button onClick={() => navigate(s.action)}
                        style={{ padding: "7px 14px", background: `${s.color}12`, border: `1px solid ${s.color}30`, borderRadius: 8, color: s.color, cursor: "pointer", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {s.actionLabel} →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Правовые основания системы */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20, marginTop: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Правовые основания деятельности системы на гражданском уровне</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                {[
                  { norm: "Конституция РФ, ст. 33", desc: "Право граждан на обращение в государственные органы", color: "#00ff87" },
                  { norm: "ФЗ №59 (2006)", desc: "Порядок рассмотрения обращений граждан — 30 дней на ответ", color: "#3b82f6" },
                  { norm: "Конституция РФ, ст. 29", desc: "Свобода сбора, хранения и распространения информации", color: "#a855f7" },
                  { norm: "ФЗ №149 «Об информации»", desc: "Право на доступ к информации и её распространение", color: "#f59e0b" },
                  { norm: "ГК РФ, ст. 150–152", desc: "Защита чести, деловой репутации, нематериальных благ", color: "#f43f5e" },
                  { norm: "Конвенция ООН (UNCAC)", desc: "Международные антикоррупционные механизмы содействия", color: "#ec4899" },
                  { norm: "Орхусская конвенция", desc: "Доступ к правосудию по экологическим вопросам", color: "#10b981" },
                  { norm: "Будапештская конвенция", desc: "Международное сотрудничество по киберпреступлениям", color: "#06b6d4" },
                ].map(n => (
                  <div key={n.norm} style={{ padding: 14, background: `${n.color}07`, border: `1px solid ${n.color}20`, borderRadius: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: n.color, marginBottom: 5 }}>{n.norm}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{n.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Подвал */}
        <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", lineHeight: 1.7 }}>
            {OWNER.system}<br />
            Автор: {OWNER.name} · <a href={`mailto:${OWNER.email}`} style={{ color: "#00ff87", textDecoration: "none" }}>{OWNER.email}</a><br />
            Гражданская инициатива · © 2024 · Все права защищены
          </div>
          <button onClick={() => navigate("/egsu/appeal")}
            style={{ padding: "10px 20px", background: G("#00ff87, #3b82f6"), border: "none", borderRadius: 10, color: "#000", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            Подать обращение в орган →
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ color, title, icon, children }: { color: string; title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <Icon name={icon as "CheckCircle"} size={14} style={{ color }} />
        <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 1 }}>{title}</div>
      </div>
      {children}
    </div>
  );
}
