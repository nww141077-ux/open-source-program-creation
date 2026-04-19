import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { CORE_AUTHOR, CORE_META, CORE_ARCH } from "@/core/author";

const TODAY = new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
const TODAY_ISO = new Date().toISOString().split("T")[0];

const MODULES = [
  { name: "egsu-incidents", label: "Модуль управления инцидентами", lang: "Python 3.11 / TypeScript" },
  { name: "security", label: "Модуль безопасности и режима поглощения", lang: "Python 3.11" },
  { name: "finance", label: "Финансовый модуль и токен-система", lang: "Python 3.11 / TypeScript" },
  { name: "egsu-ai", label: "ИИ-ассистент (мультипровайдер)", lang: "Python 3.11" },
  { name: "egsu-voice", label: "Голосовой модуль (STT/TTS)", lang: "Python 3.11" },
  { name: "legal-base", label: "Правовая база и юридический анализ", lang: "Python 3.11 / TypeScript" },
  { name: "my-model", label: "Персональная ИИ-модель (дообучение)", lang: "Python 3.11" },
  { name: "covenant", label: "Завет — директива высшего приоритета", lang: "Python 3.11 / TypeScript" },
  { name: "ai-sync", label: "ИИ-синхронизация и фонд развития", lang: "Python 3.11 / TypeScript" },
  { name: "incident-scanner", label: "Автосканер открытых источников", lang: "Python 3.11" },
  { name: "scheduler", label: "Планировщик задач", lang: "Python 3.11" },
  { name: "gateway", label: "Публичный API-шлюз", lang: "Python 3.11" },
  { name: "ark-admin", label: "Ковчег — инфраструктурное управление", lang: "Python 3.11 / TypeScript" },
];

type DocKey = "zayavka" | "opisanie" | "referat" | "dogovor" | "spravka";

function PrintDoc({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", color: "#000", borderRadius: 12, padding: "40px 48px", marginBottom: 20, fontFamily: "Times New Roman, serif", fontSize: 14, lineHeight: 1.8, boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>ФЕДЕРАЛЬНАЯ СЛУЖБА ПО ИНТЕЛЛЕКТУАЛЬНОЙ СОБСТВЕННОСТИ</div>
        <div style={{ fontSize: 11, color: "#555", marginBottom: 16 }}>(Роспатент)</div>
        <div style={{ fontSize: 16, fontWeight: 700, textTransform: "uppercase", borderTop: "2px solid #000", borderBottom: "2px solid #000", padding: "8px 0", marginBottom: 4 }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <span style={{ fontWeight: 700 }}>{label}: </span>
      <span style={{ borderBottom: "1px solid #000", paddingBottom: 1 }}>{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 18, marginBottom: 10 }}>
      <div style={{ fontWeight: 700, textDecoration: "underline", marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}

export default function EgsuRospatent() {
  const nav = useNavigate();
  const [activeDoc, setActiveDoc] = useState<DocKey>("zayavka");
  const [printing, setPrinting] = useState(false);

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 300);
  };

  const docs: { key: DocKey; label: string; icon: string; desc: string }[] = [
    { key: "zayavka", label: "Заявление о регистрации", icon: "FileText", desc: "Форма заявки в Роспатент" },
    { key: "opisanie", label: "Описание программы", icon: "BookOpen", desc: "Техническое описание ПО" },
    { key: "referat", label: "Реферат", icon: "AlignLeft", desc: "Краткое описание (до 700 знаков)" },
    { key: "dogovor", label: "Лицензионный договор", icon: "Scale", desc: "Права и условия использования" },
    { key: "spravka", label: "Справка об авторстве", icon: "Award", desc: "Подтверждение авторских прав" },
  ];

  // ── Что не хватает для подачи ──────────────────────────────────
  const missingData = [
    { field: "Адрес регистрации", status: "missing", hint: "Внесите адрес прописки автора" },
    { field: "Паспортные данные (серия, №, кем выдан)", status: "missing", hint: "Необходимы для формы Роспатента" },
    { field: "СНИЛС", status: "missing", hint: "Для физического лица обязателен" },
    { field: "ИНН", status: "missing", hint: "Идентификационный номер налогоплательщика" },
    { field: "Адрес для переписки", status: "missing", hint: "Куда Роспатент отправит свидетельство" },
    { field: "Телефон", status: "missing", hint: "Контактный номер для Роспатента" },
    { field: "Дата создания (точная)", status: "partial", hint: "Указан год 2026 — уточните день и месяц" },
    { field: "Полное название системы", status: "ok", hint: "" },
    { field: "ФИО автора", status: "ok", hint: "" },
    { field: "Email автора", status: "ok", hint: "" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#060a12", color: "#e0e0e0", fontFamily: "Arial, sans-serif" }}>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(6,10,18,0.98)", borderBottom: "1px solid rgba(168,85,247,0.2)", backdropFilter: "blur(20px)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => nav("/egsu/owner")} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer" }}>
          <Icon name="ArrowLeft" size={20} />
        </button>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#a855f7,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="Award" size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>Роспатент — Регистрация ПО</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>Пакет документов для регистрации ЕЦСУ 2.0</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={handlePrint} disabled={printing}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#a855f7,#3b82f6)", border: "none", borderRadius: 8, padding: "8px 16px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            <Icon name="Printer" size={14} />
            {printing ? "Подготовка..." : "Распечатать"}
          </button>
        </div>
      </nav>

      <div style={{ display: "flex", maxWidth: 1200, margin: "0 auto", padding: "20px 20px" }}>

        {/* Сайдбар */}
        <aside style={{ width: 240, flexShrink: 0, marginRight: 24 }}>

          {/* Чеклист — что нужно внести */}
          <div style={{ background: "#111827", border: "1px solid #374151", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="AlertTriangle" size={13} color="#f59e0b" />
              Что нужно внести
            </div>
            {missingData.map((item) => (
              <div key={item.field} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 8, fontSize: 11 }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                  background: item.status === "ok" ? "#00ff87" : item.status === "partial" ? "#f59e0b" : "#f43f5e",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {item.status === "ok" ? "✓" : item.status === "partial" ? "~" : "!"}
                </div>
                <div>
                  <div style={{ color: item.status === "ok" ? "#9ca3af" : "#e0e0e0", fontWeight: item.status === "ok" ? 400 : 600 }}>{item.field}</div>
                  {item.hint && <div style={{ color: "#4b5563", fontSize: 10 }}>{item.hint}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Навигация по документам */}
          <div style={{ background: "#111827", border: "1px solid #374151", borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 10, color: "#4b5563", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Документы</div>
            {docs.map(d => (
              <button key={d.key} onClick={() => setActiveDoc(d.key)}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: activeDoc === d.key ? "rgba(168,85,247,0.12)" : "transparent",
                  border: activeDoc === d.key ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent",
                  borderRadius: 8, padding: "8px 10px", cursor: "pointer", marginBottom: 4, textAlign: "left" }}>
                <Icon name={d.icon as "FileText"} size={14} color={activeDoc === d.key ? "#a855f7" : "#4b5563"} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: activeDoc === d.key ? 700 : 400, color: activeDoc === d.key ? "#a855f7" : "#9ca3af" }}>{d.label}</div>
                  <div style={{ fontSize: 10, color: "#4b5563" }}>{d.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Куда подавать */}
          <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 12, padding: 14, marginTop: 14, fontSize: 11 }}>
            <div style={{ color: "#3b82f6", fontWeight: 700, marginBottom: 6 }}>Как подать в Роспатент</div>
            <div style={{ color: "#6b7280", lineHeight: 1.6 }}>
              1. Портал: <span style={{ color: "#60a5fa" }}>new.fips.ru</span><br />
              2. Госпошлина: 4 500 ₽<br />
              3. Форма: РП-ПрЭВМ<br />
              4. Срок рассмотрения: 2 месяца<br />
              5. Депонирование кода — не обязательно
            </div>
          </div>
        </aside>

        {/* Документ */}
        <main style={{ flex: 1, minWidth: 0 }}>

          {/* ЗАЯВЛЕНИЕ */}
          {activeDoc === "zayavka" && (
            <PrintDoc title="Заявление о государственной регистрации программы для ЭВМ">
              <div style={{ fontSize: 12, color: "#555", textAlign: "right", marginBottom: 16 }}>
                Форма РП-ПрЭВМ · {TODAY}
              </div>
              <Section title="1. Заявитель (автор)">
                <Field label="Фамилия, имя, отчество" value={CORE_AUTHOR.fullName} />
                <Field label="Дата рождения" value={CORE_AUTHOR.birthDate} />
                <Field label="Гражданство" value="Российская Федерация" />
                <Field label="Адрес регистрации" value="_________________________ [внесите адрес]" />
                <Field label="Паспорт (серия, номер)" value="_________________________ [внесите данные]" />
                <Field label="СНИЛС" value="_________________________ [внесите]" />
                <Field label="ИНН" value="_________________________ [внесите]" />
                <Field label="Телефон" value="_________________________ [внесите]" />
                <Field label="Адрес для переписки" value="_________________________ [внесите]" />
                <Field label="Email" value={CORE_META.email} />
              </Section>
              <Section title="2. Сведения о программе для ЭВМ">
                <Field label="Полное название" value={`${CORE_META.fullName} (${CORE_META.appName})`} />
                <Field label="Краткое название" value={CORE_META.appNameRu} />
                <Field label="Год создания" value={CORE_AUTHOR.createdAt} />
                <Field label="Дата создания" value={`______________ ${CORE_AUTHOR.createdAt} [уточните]`} />
                <Field label="Язык программирования" value="Python 3.11, TypeScript, React" />
                <Field label="Тип ПО" value="Веб-приложение (SPA) + облачные функции" />
                <Field label="Вид ЭВМ" value="Серверы облачных вычислений, персональные компьютеры, мобильные устройства" />
                <Field label="ОС" value="Linux (облако), Windows / macOS / iOS / Android (клиент)" />
              </Section>
              <Section title="3. Исключительное право">
                <Field label="Правообладатель" value={CORE_AUTHOR.fullName} />
                <Field label="Основание возникновения права" value="Создание произведения (ст. 1295 ГК РФ)" />
                <Field label="Тип лицензии" value="Проприетарная (All Rights Reserved)" />
              </Section>
              <Section title="4. Перечень депонируемых материалов">
                <div>— Настоящее заявление (1 экз.)<br />
                — Реферат программы (1 экз.)<br />
                — Описание программы (1 экз.)<br />
                — Документ об уплате госпошлины (квитанция)</div>
              </Section>
              <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <div>
                  <div style={{ marginBottom: 30 }}>Подпись заявителя: _______________________</div>
                  <div>{CORE_AUTHOR.fullName}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div>Дата: {TODAY}</div>
                </div>
              </div>
            </PrintDoc>
          )}

          {/* ОПИСАНИЕ */}
          {activeDoc === "opisanie" && (
            <PrintDoc title="Описание программы для ЭВМ">
              <Section title="1. Наименование программы">
                <p>{CORE_META.fullName} ({CORE_META.appName}) — {CORE_META.description}.</p>
              </Section>
              <Section title="2. Область применения">
                <p>Программа предназначена для использования в сферах государственного управления, мониторинга инцидентов, правового анализа, финансового контроля и координации экстренного реагирования. Применяется органами управления, юридическими службами, аналитическими центрами и частными лицами.</p>
              </Section>
              <Section title="3. Функциональное назначение">
                <p>Программа реализует следующие функции:</p>
                <ul style={{ marginTop: 6, paddingLeft: 20 }}>
                  <li>Мониторинг и классификация инцидентов в реальном времени</li>
                  <li>Автоматическое сканирование открытых источников (GDACS, USGS, WHO, CVE и др.)</li>
                  <li>ИИ-анализ с использованием нескольких моделей (Gemini, GPT-4, Claude, YandexGPT)</li>
                  <li>Правовой анализ с опорой на законодательную базу и Конституцию РФ</li>
                  <li>Голосовое управление (STT/TTS) на базе Яндекс SpeechKit</li>
                  <li>Финансовый модуль с токен-системой и фондом развития</li>
                  <li>Система безопасности с режимом поглощения и защитой от вторжений</li>
                  <li>Персональная ИИ-модель с возможностью дообучения</li>
                  <li>Система Завет — директива высшего приоритета для ИИ-решений</li>
                  <li>Инфраструктурное управление (Ковчег) с мониторингом серверов</li>
                  <li>Публичный API-шлюз для интеграции с внешними системами</li>
                  <li>Экспорт данных и документации</li>
                </ul>
              </Section>
              <Section title="4. Технические характеристики">
                <Field label="Архитектура" value="SPA (Single Page Application) + Cloud Functions + PostgreSQL" />
                <Field label="Фронтенд" value="React 18, TypeScript 5, Vite, Tailwind CSS" />
                <Field label="Бэкенд" value="Python 3.11, облачные функции (бессерверная архитектура)" />
                <Field label="База данных" value="PostgreSQL" />
                <Field label="Защита данных" value={CORE_ARCH.dataProtection} />
                <Field label="Версия ядра" value={CORE_ARCH.kernel} />
                <Field label="Версия программы" value={CORE_AUTHOR.version} />
              </Section>
              <Section title="5. Состав программы (модули)">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 6 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #000" }}>
                      <th style={{ textAlign: "left", padding: "4px 8px" }}>№</th>
                      <th style={{ textAlign: "left", padding: "4px 8px" }}>Модуль</th>
                      <th style={{ textAlign: "left", padding: "4px 8px" }}>Назначение</th>
                      <th style={{ textAlign: "left", padding: "4px 8px" }}>Язык</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map((m, i) => (
                      <tr key={m.name} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "4px 8px" }}>{i + 1}</td>
                        <td style={{ padding: "4px 8px", fontFamily: "monospace", fontSize: 11 }}>{m.name}</td>
                        <td style={{ padding: "4px 8px" }}>{m.label}</td>
                        <td style={{ padding: "4px 8px", fontSize: 11 }}>{m.lang}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
              <Section title="6. Ограничения и требования">
                <p>Для работы программы необходимы: браузер с поддержкой JavaScript ES2020+, доступ к сети Интернет, учётная запись пользователя. Хранение данных осуществляется в облачной СУБД PostgreSQL. Программа функционирует на стороне сервера в среде облачных функций.</p>
              </Section>
              <div style={{ marginTop: 32, fontSize: 13 }}>
                <div style={{ marginBottom: 30 }}>Автор: {CORE_AUTHOR.fullName}</div>
                <div>Подпись: _______________________   Дата: {TODAY}</div>
              </div>
            </PrintDoc>
          )}

          {/* РЕФЕРАТ */}
          {activeDoc === "referat" && (
            <PrintDoc title="Реферат программы для ЭВМ">
              <Section title="Наименование">
                <p style={{ fontWeight: 700 }}>{CORE_META.fullName} ({CORE_META.appName})</p>
              </Section>
              <Section title="Реферат">
                <p style={{ textAlign: "justify" }}>
                  Программа «{CORE_META.fullName}» ({CORE_META.appNameRu}, версия {CORE_AUTHOR.version}) представляет собой веб-приложение для мониторинга инцидентов, правового анализа и координации экстренного реагирования. Система реализована на языках Python 3.11 и TypeScript с использованием фреймворков React и Vite. Функциональность включает: автоматическое сканирование открытых источников, многомодельный ИИ-анализ, голосовое управление, финансовый учёт, правовую базу, персональную ИИ-модель с возможностью дообучения, систему директив (Завет), инфраструктурное управление и публичный API. Архитектура — бессерверная (облачные функции) с базой данных PostgreSQL. Защита данных — AES-256 + HTTPS.
                </p>
              </Section>
              <Section title="Тип ЭВМ">
                <p>Серверы облачных вычислений, персональные компьютеры, мобильные устройства (кросс-платформенная веб-среда).</p>
              </Section>
              <Section title="Объём программы">
                <Field label="Исходный код" value="более 20 модулей, свыше 15 000 строк кода" />
                <Field label="Дата создания" value={`${CORE_AUTHOR.createdAt} год`} />
              </Section>
              <Section title="Автор">
                <Field label="ФИО" value={CORE_AUTHOR.fullName} />
                <Field label="Email" value={CORE_META.email} />
                <Field label="Copyright" value={CORE_AUTHOR.copyright} />
              </Section>
              <div style={{ marginTop: 24, fontSize: 12, color: "#555", borderTop: "1px solid #ccc", paddingTop: 12 }}>
                Объём реферата: ~700 знаков с пробелами (соответствует требованиям Роспатента)
              </div>
            </PrintDoc>
          )}

          {/* ЛИЦЕНЗИОННЫЙ ДОГОВОР */}
          {activeDoc === "dogovor" && (
            <PrintDoc title="Лицензионный договор о предоставлении права использования программы для ЭВМ">
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 13 }}>г. _____________, «____» _____________ {CORE_AUTHOR.createdAt} г.</div>
              </div>
              <p><strong>{CORE_AUTHOR.fullName}</strong>, дата рождения {CORE_AUTHOR.birthDate}, именуемый в дальнейшем <strong>«Лицензиар»</strong>, с одной стороны, и</p>
              <p>_________________________ [наименование/ФИО лицензиата], именуемый в дальнейшем <strong>«Лицензиат»</strong>, с другой стороны,</p>
              <p>заключили настоящий договор о нижеследующем:</p>
              <Section title="1. Предмет договора">
                <p>1.1. Лицензиар предоставляет Лицензиату право использования программы для ЭВМ <strong>«{CORE_META.fullName}» ({CORE_META.appName})</strong>, версия {CORE_AUTHOR.version}, на условиях простой (неисключительной) лицензии.</p>
                <p>1.2. Свидетельство о государственной регистрации: № ________________ (после регистрации в Роспатенте).</p>
              </Section>
              <Section title="2. Права и ограничения">
                <p>2.1. Лицензиат вправе использовать Программу исключительно в целях, предусмотренных настоящим договором.</p>
                <p>2.2. Лицензиат не вправе: передавать права третьим лицам; декомпилировать исходный код; использовать Программу в коммерческих целях без письменного согласия Лицензиара.</p>
                <p>2.3. Все имущественные права на Программу сохраняются за Лицензиаром.</p>
              </Section>
              <Section title="3. Авторское право">
                <p>{CORE_AUTHOR.copyright}</p>
                <p>Программа охраняется законодательством об авторском праве РФ (часть четвёртая Гражданского кодекса РФ).</p>
              </Section>
              <Section title="4. Срок действия договора">
                <p>4.1. Договор вступает в силу с момента подписания и действует в течение срока охраны авторского права.</p>
              </Section>
              <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Лицензиар:</div>
                  <div>{CORE_AUTHOR.fullName}</div>
                  <div style={{ marginTop: 20 }}>Подпись: _______________________</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>Лицензиат:</div>
                  <div>_______________________</div>
                  <div style={{ marginTop: 20 }}>Подпись: _______________________</div>
                </div>
              </div>
            </PrintDoc>
          )}

          {/* СПРАВКА ОБ АВТОРСТВЕ */}
          {activeDoc === "spravka" && (
            <PrintDoc title="Справка об авторстве программы для ЭВМ">
              <div style={{ textAlign: "center", marginBottom: 20, fontSize: 13, color: "#555" }}>
                Дата составления: {TODAY}
              </div>
              <p>Настоящая справка подтверждает, что программа для ЭВМ <strong>«{CORE_META.fullName}»</strong> ({CORE_META.appNameRu}, {CORE_META.fullNameEn}), версия <strong>{CORE_AUTHOR.version}</strong>, создана исключительно:</p>
              <Section title="Автор">
                <Field label="ФИО" value={CORE_AUTHOR.fullName} />
                <Field label="Дата рождения" value={CORE_AUTHOR.birthDate} />
                <Field label="Гражданство" value="Российская Федерация" />
                <Field label="Email" value={CORE_META.email} />
                <Field label="Паспорт" value="_________________________ [внесите данные]" />
                <Field label="СНИЛС" value="_________________________ [внесите]" />
              </Section>
              <Section title="Сведения о программе">
                <Field label="Наименование" value={CORE_META.fullName} />
                <Field label="Сокращение" value={CORE_META.appName} />
                <Field label="Описание" value={CORE_META.description} />
                <Field label="Год создания" value={CORE_AUTHOR.createdAt} />
                <Field label="Версия" value={CORE_AUTHOR.version} />
                <Field label="Версия ядра" value={CORE_ARCH.kernel} />
                <Field label="Язык разработки" value="Python 3.11, TypeScript, React 18" />
                <Field label="Лицензия" value={`${CORE_AUTHOR.license} · ${CORE_AUTHOR.copyright}`} />
              </Section>
              <Section title="Правовая основа">
                <p>Авторское право возникло в момент создания Программы на основании ст. 1255, 1257, 1259 Гражданского кодекса Российской Федерации. Программа для ЭВМ является объектом авторского права и охраняется как литературное произведение (ст. 1261 ГК РФ).</p>
                <p>Государственная регистрация осуществляется в соответствии со ст. 1262 ГК РФ и Административным регламентом Роспатента.</p>
              </Section>
              <Section title="Уникальные технические решения">
                <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                  <li>Система Завет — оригинальная директива высшего приоритета для ИИ, опирающаяся на четырёхступенчатую цепочку: Закон → Инстинкт → Конституция → Геном планеты</li>
                  <li>Многомодельный ИИ-ассистент с совместным принятием решений владельцем и ИИ-заместителем</li>
                  <li>Режим поглощения — оригинальный механизм ответного реагирования</li>
                  <li>Персональная ИИ-модель с дообучением на данных системы</li>
                  <li>Фонд развития ИИ — автоматическое отчисление 10% токенов</li>
                </ul>
              </Section>
              <div style={{ marginTop: 32, fontSize: 13 }}>
                <p>Настоящая справка составлена мной лично и соответствует действительности.</p>
                <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div>Автор: {CORE_AUTHOR.fullName}</div>
                    <div style={{ marginTop: 16 }}>Подпись: _______________________</div>
                  </div>
                  <div style={{ textAlign: "right" }}>Дата: {TODAY}</div>
                </div>
              </div>
            </PrintDoc>
          )}

          {/* Инструкция по госпошлине */}
          <div style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 12, padding: 18, fontSize: 13, lineHeight: 1.7 }}>
            <div style={{ color: "#3b82f6", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="Info" size={14} color="#3b82f6" /> Порядок подачи в Роспатент
            </div>
            <div style={{ color: "#6b7280" }}>
              <b style={{ color: "#9ca3af" }}>Шаг 1.</b> Заполните поля отмеченные <span style={{ color: "#f43f5e" }}>красным</span> в чеклисте (паспорт, СНИЛС, ИНН, адрес).<br />
              <b style={{ color: "#9ca3af" }}>Шаг 2.</b> Оплатите госпошлину <b style={{ color: "#fff" }}>4 500 ₽</b> — реквизиты на сайте <span style={{ color: "#60a5fa" }}>new.fips.ru</span>.<br />
              <b style={{ color: "#9ca3af" }}>Шаг 3.</b> Распечатайте все 5 документов, подпишите каждый.<br />
              <b style={{ color: "#9ca3af" }}>Шаг 4.</b> Подайте онлайн через <span style={{ color: "#60a5fa" }}>new.fips.ru</span> или почтой в Роспатент: 123995, Москва, Бережковская наб., д. 30, корп. 1.<br />
              <b style={{ color: "#9ca3af" }}>Шаг 5.</b> Через ~2 месяца вы получите <b style={{ color: "#00ff87" }}>Свидетельство о регистрации программы для ЭВМ</b>.
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @media print {
          nav, aside, .no-print { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
