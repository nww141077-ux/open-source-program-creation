import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const AI_API = "https://functions.poehali.dev/daefa87e-0693-4de5-9191-bbc918e1d241";
const SMS_API = "https://functions.poehali.dev/65523c0c-db23-4d8b-9c7e-6bae200b3318";
const GATEWAY_API = "https://functions.poehali.dev/417cb87f-8717-4563-a698-6e3f5bb17500";

const OWNER = {
  name: "Николаев Владимир Владимирович",
  address: "Российская Федерация",
  system: "ЕЦСУ 2.0 (Единая Центральная Система Управления)",
  status: "гражданское лицо, автор системы ЕЦСУ 2.0",
};

// Правовые нормы по типу нарушения
const LAW_NORMS: Record<string, { norm: string; desc: string; inaction?: string }[]> = {
  ecology: [
    { norm: "ФЗ №7 «Об охране окружающей среды», ст.34, 77", desc: "Требование устранения ущерба окружающей среде" },
    { norm: "КоАП РФ ст. 8.1–8.3", desc: "Административная ответственность за экологические нарушения" },
    { norm: "Орхусская конвенция, ст. 9", desc: "Право на доступ к правосудию по экологическим вопросам" },
    { inaction: "При бездействии: ст. 5.59 КоАП РФ — нарушение порядка рассмотрения обращений" },
  ],
  cyber: [
    { norm: "УК РФ ст. 272–274", desc: "Неправомерный доступ, вредоносное ПО, нарушение работы ЭВМ" },
    { norm: "ФЗ №149 «Об информации», ст. 17", desc: "Ответственность за нарушения в сфере информации" },
    { norm: "Будапештская конвенция о киберпреступности", desc: "Международные нормы кибербезопасности" },
    { inaction: "При бездействии: ст. 293 УК РФ — халатность должностного лица" },
  ],
  human_rights: [
    { norm: "Конституция РФ, ст. 2, 17–64", desc: "Основные права и свободы человека" },
    { norm: "ФЗ №59 «О порядке рассмотрения обращений граждан»", desc: "30-дневный срок рассмотрения" },
    { norm: "ЕКПЧ (Европейская конвенция о правах человека)", desc: "Международная защита прав" },
    { inaction: "При бездействии: ст. 315 УК РФ — неисполнение решений суда и органов власти" },
  ],
  corruption: [
    { norm: "ФЗ №273 «О противодействии коррупции»", desc: "Обязанность сообщать о коррупции" },
    { norm: "УК РФ ст. 290, 291, 285", desc: "Взятка, превышение полномочий" },
    { norm: "Конвенция ООН против коррупции (UNCAC)", desc: "Международные антикоррупционные нормы" },
    { inaction: "При бездействии: ФЗ №59, ст. 5 — должностные лица несут ответственность" },
  ],
  emergency: [
    { norm: "ФЗ №68 «О защите населения от ЧС»", desc: "Обязанности органов при ЧС" },
    { norm: "ФЗ №69 «О пожарной безопасности»", desc: "Права граждан при пожаре" },
    { norm: "КоАП РФ ст. 20.6", desc: "Нарушение требований режима ЧС" },
    { inaction: "При бездействии: ст. 293 УК РФ — халатность, повлёкшая тяжкие последствия" },
  ],
  default: [
    { norm: "ФЗ №59 «О порядке рассмотрения обращений граждан РФ»", desc: "30 дней на ответ, ответственность за бездействие" },
    { norm: "Конституция РФ ст. 33", desc: "Право граждан на обращение в органы власти" },
    { norm: "КоАП РФ ст. 5.59", desc: "Штраф 5000–10000 руб. за нарушение порядка рассмотрения" },
    { inaction: "При бездействии: ст. 315 УК РФ, жалоба в прокуратуру" },
  ],
};

const AGENCIES_SHORT = [
  { id: "mchs", name: "МЧС России", email: "info@mchs.gov.ru", phone: "112", category: "emergency" },
  { id: "mvd", name: "МВД (Полиция)", email: "mvd@mvd.ru", phone: "102", category: "law" },
  { id: "prosecutor", name: "Генпрокуратура РФ", email: "genproc@genproc.gov.ru", phone: "8-800-250-77-55", category: "law" },
  { id: "skrf", name: "Следственный комитет", email: "priemnaya@sledcom.ru", phone: "8-800-100-12-60", category: "law" },
  { id: "fsb", name: "ФСБ России", email: "fsb@fsb.ru", phone: "8-800-224-22-22", category: "security" },
  { id: "rosprirodnadzor", name: "Росприроднадзор", email: "rpn@rpn.gov.ru", phone: "8-800-200-34-60", category: "ecology" },
  { id: "rospotrebnadzor", name: "Роспотребнадзор", email: "rpn@gsen.ru", phone: "8-800-555-49-43", category: "health" },
  { id: "rostechnadzor", name: "Ростехнадзор", email: "rtn@gosnadzor.ru", phone: "8-800-100-80-40", category: "tech" },
];

const INCIDENT_TYPES = [
  { id: "ecology", label: "Экологическое нарушение", icon: "Leaf" },
  { id: "cyber", label: "Кибератака / вторжение", icon: "ShieldAlert" },
  { id: "human_rights", label: "Нарушение прав человека", icon: "Users" },
  { id: "corruption", label: "Коррупция / превышение полномочий", icon: "Scale" },
  { id: "emergency", label: "Чрезвычайная ситуация", icon: "Flame" },
  { id: "default", label: "Иное нарушение", icon: "AlertTriangle" },
];

export default function EgsuAppeal() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [incidentType, setIncidentType] = useState("");
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
  const [form, setForm] = useState({
    incident_title: "",
    incident_description: "",
    incident_location: "",
    incident_date: new Date().toISOString().slice(0, 10),
    recommendations: "",
  });
  const [generatedText, setGeneratedText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sent, setSent] = useState<string[]>([]);

  const norms = LAW_NORMS[incidentType] || LAW_NORMS["default"];

  const toggleAgency = (id: string) => {
    setSelectedAgencies(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const generateAppeal = async () => {
    if (!form.incident_description) return;
    setGenerating(true);
    const normsText = norms.filter(n => n.norm).map(n => `${n.norm}: ${n.desc}`).join("; ");
    const prompt = `Составь официальное обращение гражданина в государственный орган по следующей ситуации:

Заявитель: ${OWNER.name}, ${OWNER.status}
Система: ${OWNER.system}

Тип нарушения: ${INCIDENT_TYPES.find(t => t.id === incidentType)?.label || "нарушение"}
Заголовок: ${form.incident_title}
Описание: ${form.incident_description}
Место: ${form.incident_location}
Дата: ${form.incident_date}

Применимые нормы: ${normsText}

Требования к тексту:
- Официально-деловой стиль
- Указать кто обращается и от какой системы
- Описать суть нарушения
- Указать применимые нормы закона
- Сформулировать конкретные требования к органу
- Указать последствия бездействия со ссылкой на законы
- Указать что система находится в стадии разработки как гражданская инициатива
- Длина: 400-600 слов
- В конце подпись: ${OWNER.name}, ${OWNER.system}`;

    try {
      const resp = await fetch(AI_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, session_id: "appeal_gen", history: [], provider: "auto" }),
      });
      const data = await resp.json();
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      setGeneratedText(parsed.reply || "Ошибка генерации. Попробуйте снова.");
    } catch {
      setGeneratedText(`ОБРАЩЕНИЕ

Кому: Руководителю ведомства
От: ${OWNER.name}, ${OWNER.status}
Система: ${OWNER.system}

Дата: ${form.incident_date}

Тема: ${form.incident_title || "Сообщение о нарушении"}

Настоящим сообщаю о следующем нарушении:

${form.incident_description}

Место: ${form.incident_location}

На основании: ${norms.filter(n => n.norm).map(n => n.norm).join(", ")} — прошу провести проверку и принять меры.

При бездействии ведомства буду вынужден обратиться в вышестоящие органы и прокуратуру (${norms.find(n => n.inaction)?.inaction}).

С уважением,
${OWNER.name}
Автор системы ${OWNER.system}`);
    }
    setGenerating(false);
    setStep(3);
  };

  const sendByEmail = async (agencyId: string) => {
    const agency = AGENCIES_SHORT.find(a => a.id === agencyId);
    if (!agency) return;
    const subject = encodeURIComponent(`Обращение граждан РФ: ${form.incident_title || "Уведомление о нарушении"}`);
    const body = encodeURIComponent(generatedText);
    window.open(`mailto:${agency.email}?subject=${subject}&body=${body}`);
    setSent(prev => [...prev, agencyId]);

    // Регистрируем в gateway и запускаем SMS-мониторинг
    try {
      await fetch(GATEWAY_API + "/appeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_type: incidentType || "default",
          title: form.incident_title,
          description: form.incident_description.slice(0, 500),
          country: "RUS",
        }),
      });
      await fetch(SMS_API + "/notify-agencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agency_ids: [agencyId],
          message: `ЕЦСУ 2.0: Обращение направлено. ${form.incident_title || "Уведомление о нарушении"}. От: ${OWNER.name}`,
          incident_type: incidentType || "default",
        }),
      });
    } catch {
      // Тихая ошибка — email уже отправлен
    }
  };

  const copyText = () => {
    navigator.clipboard.writeText(generatedText);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060a12", color: "#e0e8ff", fontFamily: "monospace" }}>
      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(6,10,18,0.98)", borderBottom: "1px solid rgba(168,85,247,0.25)", backdropFilter: "blur(20px)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate("/egsu/emergency")} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer" }}>
          <Icon name="ChevronLeft" size={18} />
        </button>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #a855f7, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="FileText" size={16} style={{ color: "#fff" }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: 2, color: "#fff" }}>ОБРАЩЕНИЯ В ВЕДОМСТВА</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>ИИ-генерация · Правовые нормы · ЕЦСУ 2.0</div>
        </div>
        {/* Шаги */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${step >= s ? "#a855f7" : "rgba(255,255,255,0.15)"}`, background: step > s ? "#a855f7" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: step >= s ? "#fff" : "rgba(255,255,255,0.3)" }}>
              {step > s ? "✓" : s}
            </div>
          ))}
        </div>
      </nav>

      <div style={{ paddingTop: 64, maxWidth: 720, margin: "0 auto", padding: "72px 16px 40px" }}>

        {/* ШАГ 1: Тип инцидента + описание */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Шаг 1 — Описание ситуации</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 20 }}>ИИ сформирует официальное обращение на основе ваших данных</p>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Тип нарушения</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {INCIDENT_TYPES.map(t => (
                  <button key={t.id} onClick={() => setIncidentType(t.id)}
                    style={{ background: incidentType === t.id ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.03)", border: `1px solid ${incidentType === t.id ? "rgba(168,85,247,0.5)" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "10px 14px", color: incidentType === t.id ? "#a855f7" : "rgba(255,255,255,0.5)", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: incidentType === t.id ? 700 : 400 }}>
                    <Icon name={t.icon as "Leaf"} size={14} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Заголовок обращения</label>
                <input value={form.incident_title} onChange={e => setForm(f => ({...f, incident_title: e.target.value}))}
                  placeholder="Кратко опишите суть..."
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Подробное описание *</label>
                <textarea value={form.incident_description} onChange={e => setForm(f => ({...f, incident_description: e.target.value}))}
                  placeholder="Опишите нарушение подробно: что произошло, когда, кто виновен, какой ущерб..."
                  rows={5}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none", resize: "vertical" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Место</label>
                  <input value={form.incident_location} onChange={e => setForm(f => ({...f, incident_location: e.target.value}))}
                    placeholder="Адрес / регион..."
                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Дата</label>
                  <input type="date" value={form.incident_date} onChange={e => setForm(f => ({...f, incident_date: e.target.value}))}
                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none" }} />
                </div>
              </div>
            </div>

            {/* Нормы права */}
            {incidentType && (
              <div style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 10, padding: 14, marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: "#a855f7", fontWeight: 700, marginBottom: 8 }}>Применимые нормы законодательства</div>
                {norms.map((n, i) => (
                  <div key={i} style={{ fontSize: 12, color: n.inaction ? "rgba(245,158,11,0.8)" : "rgba(255,255,255,0.6)", marginBottom: 5, paddingLeft: 8, borderLeft: `2px solid ${n.inaction ? "#f59e0b" : "#a855f7"}` }}>
                    {n.norm && <span style={{ fontWeight: 600, color: "#e0e8ff" }}>{n.norm}</span>}
                    {n.norm && " — "}{n.desc || n.inaction}
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setStep(2)} disabled={!form.incident_description}
              style={{ width: "100%", padding: 14, background: form.incident_description ? "linear-gradient(135deg, #a855f7, #3b82f6)" : "rgba(255,255,255,0.05)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 15, cursor: form.incident_description ? "pointer" : "not-allowed", opacity: form.incident_description ? 1 : 0.5 }}>
              Далее — выбрать ведомства →
            </button>
          </div>
        )}

        {/* ШАГ 2: Выбор ведомств */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Шаг 2 — Куда направить</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 20 }}>Выберите ведомства для отправки обращения</p>
            <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
              {AGENCIES_SHORT.map(a => (
                <div key={a.id}
                  onClick={() => toggleAgency(a.id)}
                  style={{ background: selectedAgencies.includes(a.id) ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${selectedAgencies.includes(a.id) ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${selectedAgencies.includes(a.id) ? "#a855f7" : "rgba(255,255,255,0.2)"}`, background: selectedAgencies.includes(a.id) ? "#a855f7" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {selectedAgencies.includes(a.id) && <span style={{ fontSize: 10, color: "#fff" }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{a.email}</div>
                  </div>
                  <a href={`tel:${a.phone}`} onClick={e => e.stopPropagation()}
                    style={{ color: "#22c55e", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>{a.phone}</a>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 14 }}>← Назад</button>
              <button onClick={generateAppeal} disabled={selectedAgencies.length === 0 || generating}
                style={{ flex: 2, padding: 12, background: selectedAgencies.length > 0 ? "linear-gradient(135deg, #a855f7, #3b82f6)" : "rgba(255,255,255,0.05)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14, cursor: selectedAgencies.length > 0 ? "pointer" : "not-allowed", opacity: selectedAgencies.length > 0 ? 1 : 0.5 }}>
                {generating ? "ИИ составляет обращение..." : "Сгенерировать обращение →"}
              </button>
            </div>
          </div>
        )}

        {/* ШАГ 3: Результат и отправка */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Шаг 3 — Обращение готово</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 16 }}>Составлено ИИ-администратором ЕЦСУ с применением норм законодательства</p>

            {/* Текст обращения */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 16, marginBottom: 16, maxHeight: 300, overflowY: "auto", whiteSpace: "pre-wrap", fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.8 }}>
              {generatedText}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <button onClick={copyText} style={{ flex: 1, padding: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Icon name="Copy" size={14} /> Копировать
              </button>
              <button onClick={() => { setStep(1); setGeneratedText(""); setSent([]); }} style={{ flex: 1, padding: 10, background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, color: "#a855f7", cursor: "pointer", fontSize: 13 }}>
                Новое обращение
              </button>
            </div>

            {/* Отправка по ведомствам */}
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>Отправить в выбранные ведомства</div>
            <div style={{ display: "grid", gap: 8 }}>
              {selectedAgencies.map(id => {
                const agency = AGENCIES_SHORT.find(a => a.id === id);
                if (!agency) return null;
                const isSent = sent.includes(id);
                return (
                  <div key={id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: isSent ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${isSent ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: isSent ? "#22c55e" : "#fff" }}>{agency.name}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{agency.email}</div>
                    </div>
                    <button onClick={() => sendByEmail(id)}
                      style={{ background: isSent ? "rgba(34,197,94,0.2)" : "rgba(168,85,247,0.2)", border: `1px solid ${isSent ? "rgba(34,197,94,0.4)" : "rgba(168,85,247,0.4)"}`, borderRadius: 8, padding: "8px 14px", color: isSent ? "#22c55e" : "#a855f7", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      {isSent ? "✓ Отправлено" : "📧 Email"}
                    </button>
                    <a href={`tel:${agency.phone}`}
                      style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "8px 12px", color: "#22c55e", fontWeight: 700, fontSize: 12, textDecoration: "none" }}>
                      📞
                    </a>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 20, padding: 14, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
              <strong style={{ color: "#f59e0b" }}>Важно:</strong> Система ЕЦСУ 2.0 находится в стадии разработки как гражданская инициатива. Обращения направляются от имени гражданина РФ — {OWNER.name}. Согласно ФЗ №59, ведомства обязаны ответить в течение 30 дней. При бездействии — жалоба в прокуратуру (ст. 5.59 КоАП РФ).
            </div>
          </div>
        )}
      </div>
    </div>
  );
}