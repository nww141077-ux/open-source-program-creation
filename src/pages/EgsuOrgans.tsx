/**
 * ECSU 2.0 — Органы системы для обращений граждан
 * Внутренние органы ECSU 2.0, уполномоченные принимать, регистрировать
 * и передавать обращения граждан в профильные государственные ведомства РФ.
 *
 * Правовая основа:
 * — Конституция РФ ст. 33 (право на обращение)
 * — ФЗ №59 «О порядке рассмотрения обращений граждан» (30 дней на ответ)
 * — ФЗ №273 «О противодействии коррупции» (обязанность сообщать)
 *
 * Владелец: Николаев Владимир Владимирович
 * © 2026 Все права защищены
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const ORGANS_API = "https://functions.poehali.dev/e47c4dc6-578b-4069-8827-85cba5b8d930";

// ─── Типы ─────────────────────────────────────────────────────────────────────
interface Organ {
  id: number;
  code: string;
  name: string;
  full_name: string;
  category: string;
  description: string;
  competence: string;
  contact_internal: string;
  response_days: number;
  icon: string;
  color: string;
  sort_order: number;
}

interface Incident { id: number; incident_code: string; type: string; title: string; description: string; country: string; severity: string; status: string; verification_score: number; responsible_organ: string; ai_confidence: number; created_at: string; actions_count: number; orders_count: number; }
interface OwnerOrder { id: number; incident_code: string; order_text: string; target_organ: string; priority: string; status: string; created_at: string; incident_title: string; }
interface PressRelease { id: number; incident_code: string; title: string; content: string; channel: string; status: string; published_at: string; created_at: string; incident_title: string; incident_type: string; severity: string; }

interface Member { id: number; organ_code: string; full_name: string; role: string; position: string; is_owner: boolean; status: string; joined_at: string; }
interface DialogMessage { id: number; organ_code: string; author_name: string; author_role: string; is_owner: boolean; message: string; msg_type: string; created_at: string; }
interface ExternalContact { id: number; agency_name: string; agency_short: string; country: string; category: string; address: string; phone: string; email: string; website: string; reception_info: string; online_form_url: string; notes: string; }

type AppealStep = "list" | "form" | "sent";

interface AppealForm {
  organ_code: string;
  category: string;
  subject: string;
  description: string;
  location: string;
  evidence_desc: string;
  contact_email: string;
  contact_phone: string;
  is_anonymous: boolean;
}

// ─── Статичные данные (фолбэк если API недоступен) ───────────────────────────
const FALLBACK_ORGANS: Organ[] = [
  { id: 1, code: "OGR-GENERAL",   name: "Главный орган ECSU",                icon: "LayoutDashboard", color: "#00ff87", category: "general",    response_days: 30, sort_order: 1, description: "Принимает все обращения, распределяет по профильным органам", full_name: "Главный орган реагирования ECSU 2.0", competence: "Все категории обращений граждан", contact_internal: "ECSU-MAIN" },
  { id: 2, code: "OGR-ECOLOGY",   name: "Орган экологии ECSU",               icon: "Leaf",            color: "#10b981", category: "ecology",    response_days: 30, sort_order: 2, description: "Рассматривает обращения по загрязнению, вырубке, ущербу природе", full_name: "Орган мониторинга экологических нарушений ECSU 2.0", competence: "Экологические нарушения, ФЗ №7, Орхусская конвенция", contact_internal: "ECSU-ECO" },
  { id: 3, code: "OGR-CYBER",     name: "Орган киберзащиты ECSU",            icon: "Monitor",         color: "#2196F3", category: "cyber",      response_days: 15, sort_order: 3, description: "Фиксирует кибератаки, утечки данных, вредоносное ПО", full_name: "Орган реагирования на кибератаки ECSU 2.0", competence: "УК РФ ст. 272–274, ФЗ №149", contact_internal: "ECSU-CYBER" },
  { id: 4, code: "OGR-RIGHTS",    name: "Орган прав человека ECSU",          icon: "Heart",           color: "#ec4899", category: "rights",     response_days: 30, sort_order: 4, description: "Рассматривает нарушения прав, дискриминацию, произвол", full_name: "Орган защиты прав и свобод граждан ECSU 2.0", competence: "Конституция РФ ст. 17–64, ЕКПЧ, ФЗ №59", contact_internal: "ECSU-RIGHTS" },
  { id: 5, code: "OGR-ANTI-CORR", name: "Антикоррупционный орган ECSU",      icon: "ShieldOff",       color: "#f59e0b", category: "corruption", response_days: 15, sort_order: 5, description: "Принимает сообщения о взятках, превышении полномочий", full_name: "Орган противодействия коррупции ECSU 2.0", competence: "ФЗ №273, УК РФ ст. 290–291, 285", contact_internal: "ECSU-ACORR" },
  { id: 6, code: "OGR-SECURITY",  name: "Орган безопасности ECSU",           icon: "Shield",          color: "#a855f7", category: "security",   response_days: 7,  sort_order: 6, description: "Угрозы жизни, слежка, незаконные задержания, нарушения", full_name: "Орган физической и информационной безопасности ECSU 2.0", competence: "УК РФ ст. 286, 302; ФЗ «О полиции»", contact_internal: "ECSU-SEC" },
  { id: 7, code: "OGR-FINANCE",   name: "Финансовый орган ECSU",             icon: "TrendingDown",    color: "#f59e0b", category: "finance",    response_days: 30, sort_order: 7, description: "Финансовые махинации, мошенничество, незаконные операции", full_name: "Орган мониторинга финансовых нарушений ECSU 2.0", competence: "УК РФ ст. 159, 172, 174; ФЗ №115", contact_internal: "ECSU-FIN" },
  { id: 8, code: "OGR-EMERGENCY", name: "Орган ЧС ECSU",                     icon: "AlertTriangle",   color: "#f43f5e", category: "emergency",  response_days: 3,  sort_order: 8, description: "Техногенные и природные катастрофы, угрозы жизни", full_name: "Орган чрезвычайного реагирования ECSU 2.0", competence: "ФЗ №68, ФЗ №69, КоАП РФ ст. 20.6", contact_internal: "ECSU-EMER" },
  { id: 9, code: "OGR-LEGAL",     name: "Правовой орган ECSU",               icon: "Scale",           color: "#3b82f6", category: "legal",      response_days: 30, sort_order: 9, description: "Правовые консультации, помощь в составлении обращений", full_name: "Орган правовой поддержки граждан ECSU 2.0", competence: "Конституция РФ; ФЗ №59; международные конвенции", contact_internal: "ECSU-LEGAL" },
  { id: 10, code: "OGR-MEDIA",    name: "Медиа и информационный орган ECSU", icon: "Newspaper",       color: "#06b6d4", category: "media",      response_days: 30, sort_order: 10, description: "Цензура, блокировки, нарушения свободы слова, давление на СМИ", full_name: "Орган информационной свободы и защиты журналистов ECSU 2.0", competence: "Закон о СМИ ст. 41; Конституция РФ ст. 29", contact_internal: "ECSU-MEDIA" },
];

const CATEGORY_LABELS: Record<string, string> = {
  general: "Общие",
  ecology: "Экология",
  cyber: "Кибербезопасность",
  rights: "Права человека",
  corruption: "Антикоррупция",
  security: "Безопасность",
  finance: "Финансы",
  emergency: "ЧС",
  legal: "Правовые",
  media: "СМИ и информация",
};

// ─── Главная страница ─────────────────────────────────────────────────────────
export default function EgsuOrgans() {
  const navigate = useNavigate();
  const [step, setStep] = useState<AppealStep>("list");
  const [organs, setOrgans] = useState<Organ[]>(FALLBACK_ORGANS);
  const [loading, setLoading] = useState(true);
  const [selectedOrgan, setSelectedOrgan] = useState<Organ | null>(null);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [ticketId, setTicketId] = useState("");
  const [sending, setSending] = useState(false);
  const [trackTicket, setTrackTicket] = useState("");
  const [trackResult, setTrackResult] = useState<{status: string; subject: string; created_at: string; organ_code: string} | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [showTrack, setShowTrack] = useState(false);

  const [tab, setTab] = useState<"organs"|"incidents"|"orders"|"press">("organs");

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incLoading, setIncLoading] = useState(false);
  const [incFilter, setIncFilter] = useState<"all"|"suspected"|"verified">("all");
  const [orders, setOrders] = useState<OwnerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [pressReleases, setPressReleases] = useState<PressRelease[]>([]);
  const [pressLoading, setPressLoading] = useState(false);
  const [pressForm, setPressForm] = useState({ incident_id: "", title: "", content: "", channel: "public" });
  const [selectedIncident, setSelectedIncident] = useState<Incident|null>(null);
  const [orderForm, setOrderForm] = useState({ order_text: "", target_organ: "", priority: "normal" });
  const [savingOrder, setSavingOrder] = useState(false);
  const [savingPress, setSavingPress] = useState(false);
  const [publishingPress, setPublishingPress] = useState<number|null>(null);
  const [pressMsg, setPressMsg] = useState("");

  // --- Новые state для детального просмотра органа ---
  const [openOrgan, setOpenOrgan] = useState<Organ|null>(null);
  const [organTab, setOrganTab] = useState<"organ-info"|"organ-members"|"organ-chat"|"organ-contacts">("organ-info");
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberForm, setMemberForm] = useState({ full_name: "", role: "Участник", position: "" });
  const [savingMember, setSavingMember] = useState(false);
  const [dialogMessages, setDialogMessages] = useState<DialogMessage[]>([]);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [externalContacts, setExternalContacts] = useState<ExternalContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactFilter, setContactFilter] = useState("");

  const [receptionModal, setReceptionModal] = useState(false);
  const [receptionContact, setReceptionContact] = useState<ExternalContact|null>(null);
  const [receptionForm, setReceptionForm] = useState({ subject: "", message_text: "" });
  const [sendingReception, setSendingReception] = useState(false);
  const [receptionLog, setReceptionLog] = useState<{id:number; agency_name:string; subject:string; created_at:string}[]>([]);

  const [form, setForm] = useState<AppealForm>({
    organ_code: "",
    category: "",
    subject: "",
    description: "",
    location: "",
    evidence_desc: "",
    contact_email: "",
    contact_phone: "",
    is_anonymous: false,
  });

  // Загрузка органов из API
  useEffect(() => {
    fetch(ORGANS_API + "/")
      .then(r => r.json())
      .then(data => {
        const d = typeof data === "string" ? JSON.parse(data) : data;
        if (d.organs && d.organs.length > 0) setOrgans(d.organs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function loadIncidents() {
    setIncLoading(true);
    try {
      const url = incFilter === "all" ? `${ORGANS_API}/incidents` : `${ORGANS_API}/incidents?type=${incFilter}`;
      const r = await fetch(url);
      const d = await r.json();
      const p = typeof d === "string" ? JSON.parse(d) : d;
      setIncidents(p.incidents || []);
    } catch (_e) { /* ignore */ } finally { setIncLoading(false); }
  }

  async function loadOrders() {
    setOrdersLoading(true);
    try {
      const r = await fetch(`${ORGANS_API}/orders`);
      const d = await r.json();
      const p = typeof d === "string" ? JSON.parse(d) : d;
      setOrders(p.orders || []);
    } catch (_e) { /* ignore */ } finally { setOrdersLoading(false); }
  }

  async function loadPress() {
    setPressLoading(true);
    try {
      const r = await fetch(`${ORGANS_API}/press`);
      const d = await r.json();
      const p = typeof d === "string" ? JSON.parse(d) : d;
      setPressReleases(p.releases || []);
    } catch (_e) { /* ignore */ } finally { setPressLoading(false); }
  }

  async function saveOrder() {
    if (!orderForm.order_text || !selectedIncident) return;
    setSavingOrder(true);
    try {
      await fetch(`${ORGANS_API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incident_id: selectedIncident.id, order_text: orderForm.order_text, target_organ: orderForm.target_organ, priority: orderForm.priority })
      });
      setOrderForm({ order_text: "", target_organ: "", priority: "normal" });
      setSelectedIncident(null);
      loadOrders();
    } catch (_e) { /* ignore */ } finally { setSavingOrder(false); }
  }

  async function savePress() {
    if (!pressForm.title || !pressForm.content) return;
    setSavingPress(true);
    try {
      await fetch(`${ORGANS_API}/press`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pressForm)
      });
      setPressForm({ incident_id: "", title: "", content: "", channel: "public" });
      loadPress();
      setPressMsg("Пресс-релиз создан");
      setTimeout(() => setPressMsg(""), 3000);
    } catch (_e) { /* ignore */ } finally { setSavingPress(false); }
  }

  async function publishPress(id: number, channels: string[]) {
    setPublishingPress(id);
    try {
      await fetch(`${ORGANS_API}/press/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ press_id: id, channels })
      });
      loadPress();
      setPressMsg(`Опубликовано в ${channels.length} каналах`);
      setTimeout(() => setPressMsg(""), 4000);
    } catch (_e) { /* ignore */ } finally { setPublishingPress(null); }
  }

  // --- Функции загрузки данных органа ---
  async function loadMembers(organCode: string) {
    setMembersLoading(true);
    try {
      const r = await fetch(`${ORGANS_API}/members?organ=${encodeURIComponent(organCode)}`);
      const d = await r.json();
      const p = typeof d === "string" ? JSON.parse(d) : d;
      setMembers(p.members || []);
    } catch (_e) { /* ignore */ } finally { setMembersLoading(false); }
  }

  async function loadDialog(organCode: string) {
    setDialogLoading(true);
    try {
      const r = await fetch(`${ORGANS_API}/dialog?organ=${encodeURIComponent(organCode)}`);
      const d = await r.json();
      const p = typeof d === "string" ? JSON.parse(d) : d;
      setDialogMessages(p.messages || []);
    } catch (_e) { /* ignore */ } finally { setDialogLoading(false); }
  }

  async function loadExternalContacts() {
    setContactsLoading(true);
    try {
      const r = await fetch(`${ORGANS_API}/external-contacts`);
      const d = await r.json();
      const p = typeof d === "string" ? JSON.parse(d) : d;
      setExternalContacts(p.contacts || []);
    } catch (_e) { /* ignore */ } finally { setContactsLoading(false); }
  }

  async function addMember() {
    if (!memberForm.full_name || !openOrgan) return;
    setSavingMember(true);
    try {
      await fetch(`${ORGANS_API}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organ_code: openOrgan.code, ...memberForm })
      });
      setMemberForm({ full_name: "", role: "Участник", position: "" });
      loadMembers(openOrgan.code);
    } catch (_e) { /* ignore */ } finally { setSavingMember(false); }
  }

  async function sendToReception() {
    if (!receptionContact || !receptionForm.message_text || !openOrgan) return;
    setSendingReception(true);
    try {
      const r = await fetch(`${ORGANS_API}/reception-forward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organ_code: openOrgan.code,
          external_contact_id: receptionContact.id,
          agency_name: receptionContact.agency_name,
          subject: receptionForm.subject,
          message_text: receptionForm.message_text,
          url_used: receptionContact.online_form_url || receptionContact.website,
        })
      });
      const d = await r.json();
      const parsed = typeof d === "string" ? JSON.parse(d) : d;
      setReceptionModal(false);
      setReceptionForm({ subject: "", message_text: "" });
      setReceptionContact(null);
      loadDialog(openOrgan.code);
      alert(`✓ ${parsed.message || "Запрос направлен"}`);
    } catch (_e) { /* ignore */ } finally { setSendingReception(false); }
  }

  async function sendChatMessage() {
    if (!chatMsg.trim() || !openOrgan) return;
    setSendingChat(true);
    try {
      await fetch(`${ORGANS_API}/dialog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organ_code: openOrgan.code,
          author_name: "Николаев Владимир Владимирович",
          author_role: "Владелец системы",
          is_owner: true,
          message: chatMsg.trim(),
          msg_type: "message"
        })
      });
      setChatMsg("");
      loadDialog(openOrgan.code);
    } catch (_e) { /* ignore */ } finally { setSendingChat(false); }
  }

  useEffect(() => {
    if (tab === "incidents") loadIncidents();
    if (tab === "orders") loadOrders();
    if (tab === "press") loadPress();
  }, [tab]);

  useEffect(() => {
    if (tab === "incidents") loadIncidents();
  }, [incFilter]);

  // --- useEffect для openOrgan ---
  useEffect(() => {
    if (openOrgan) {
      if (organTab === "organ-members") loadMembers(openOrgan.code);
      if (organTab === "organ-chat") { loadDialog(openOrgan.code); loadExternalContacts(); }
      if (organTab === "organ-contacts") loadExternalContacts();
    }
  }, [openOrgan, organTab]);

  function openForm(organ: Organ) {
    setSelectedOrgan(organ);
    setForm(f => ({ ...f, organ_code: organ.code, category: organ.category }));
    setStep("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitAppeal() {
    if (!form.subject || !form.description || !form.organ_code) return;
    setSending(true);
    try {
      const resp = await fetch(ORGANS_API + "/appeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await resp.json();
      const d = typeof data === "string" ? JSON.parse(data) : data;
      setTicketId(d.ticket_id || `ECSU-LOCAL-${Date.now().toString(36).toUpperCase().slice(-6)}`);
      setStep("sent");
    } catch {
      setTicketId(`ECSU-OFFLINE-${Date.now().toString(36).toUpperCase().slice(-6)}`);
      setStep("sent");
    } finally {
      setSending(false);
    }
  }

  async function trackAppeal() {
    if (!trackTicket.trim()) return;
    setTrackLoading(true);
    try {
      const resp = await fetch(`${ORGANS_API}/appeal?ticket_id=${encodeURIComponent(trackTicket.trim())}`);
      const data = await resp.json();
      const d = typeof data === "string" ? JSON.parse(data) : data;
      if (d.appeal) setTrackResult(d.appeal);
      else setTrackResult(null);
    } catch {
      setTrackResult(null);
    } finally {
      setTrackLoading(false);
    }
  }

  const filteredOrgans = filterCat === "all" ? organs : organs.filter(o => o.category === filterCat);
  const categories = ["all", ...Array.from(new Set(organs.map(o => o.category)))];

  const statusLabel: Record<string, { label: string; color: string }> = {
    new:         { label: "Новое",           color: "#3b82f6" },
    in_review:   { label: "На рассмотрении", color: "#f59e0b" },
    forwarded:   { label: "Перенаправлено",  color: "#a855f7" },
    resolved:    { label: "Решено",          color: "#00ff87" },
    rejected:    { label: "Отклонено",       color: "#f43f5e" },
    escalated:   { label: "Эскалировано",    color: "#f43f5e" },
  };

  // ─── Шаг: Список органов ─────────────────────────────────────────────────
  if (step === "list") return (
    <div className="min-h-screen flex flex-col" style={{ background: "#060a12", color: "#fff" }}>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3"
        style={{ background: "rgba(6,10,18,0.97)", borderBottom: "1px solid rgba(0,255,135,0.1)", backdropFilter: "blur(16px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/egsu/start")} className="text-white/30 hover:text-white/60 transition-colors">
            <Icon name="ChevronLeft" size={18} />
          </button>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #00ff87, #3b82f6)" }}>
            <Icon name="Building2" size={16} className="text-black" />
          </div>
          <div>
            <div className="font-black text-sm tracking-wider text-white leading-none">ОРГАНЫ ECSU</div>
            <div className="text-white/25 text-[9px] tracking-widest">ПРИЁМ ОБРАЩЕНИЙ ГРАЖДАН · ECSU 2.0</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowTrack(v => !v)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
            style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.25)" }}>
            <Icon name="Search" size={12} className="inline mr-1" />
            Статус обращения
          </button>
          <button onClick={() => navigate("/egsu/join")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
            style={{ background: "rgba(0,255,135,0.08)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.2)" }}>
            <Icon name="UserPlus" size={12} className="inline mr-1" />
            Вступить
          </button>
          <button onClick={() => navigate("/egsu/vip")}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
            style={{ background: "rgba(168,85,247,0.12)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.25)" }}>
            🔒 ВИП-анонимно
          </button>
        </div>
      </nav>

      <main className="flex-1 pt-16 px-4 md:px-8 pb-12 max-w-5xl mx-auto w-full">

        {/* Заголовок */}
        <div className="py-8">
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2">
            Органы системы <span style={{ color: "#00ff87" }}>ECSU 2.0</span>
          </h1>
          <p className="text-white/40 text-sm leading-relaxed max-w-2xl">
            Внутренние уполномоченные органы ECSU принимают обращения граждан, регистрируют их
            и направляют в профильные государственные ведомства РФ. Основание: <b className="text-white/60">Конституция РФ ст. 33, ФЗ №59</b>.
          </p>
        </div>

        {/* Tab Nav */}
        <div className="flex gap-2 flex-wrap mb-6 mt-2">
          {[
            { id: "organs", label: "Органы", icon: "Building2" },
            { id: "incidents", label: "Инциденты", icon: "AlertTriangle" },
            { id: "orders", label: "Мои распоряжения", icon: "ClipboardList" },
            { id: "press", label: "Пресса", icon: "Newspaper" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
              style={{
                background: tab === t.id ? "rgba(0,255,135,0.15)" : "rgba(255,255,255,0.04)",
                color: tab === t.id ? "#00ff87" : "rgba(255,255,255,0.4)",
                border: `1px solid ${tab === t.id ? "rgba(0,255,135,0.3)" : "rgba(255,255,255,0.07)"}`,
              }}>
              <Icon name={t.icon as "Building2"} size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Трекинг обращения */}
        {showTrack && (
          <div className="mb-6 p-5 rounded-2xl"
            style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="Search" size={14} style={{ color: "#3b82f6" }} />
              <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Проверить статус обращения</span>
            </div>
            <div className="flex gap-2">
              <input
                value={trackTicket}
                onChange={e => setTrackTicket(e.target.value)}
                placeholder="Введите номер обращения (ECSU-XXX-XXXXXX)"
                className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                onKeyDown={e => e.key === "Enter" && trackAppeal()}
              />
              <button onClick={trackAppeal} disabled={trackLoading}
                className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: "rgba(59,130,246,0.2)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)" }}>
                {trackLoading ? "..." : "Найти"}
              </button>
            </div>
            {trackResult && (
              <div className="mt-3 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-white/50">{trackTicket}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: `${(statusLabel[trackResult.status] || statusLabel.new).color}18`, color: (statusLabel[trackResult.status] || statusLabel.new).color }}>
                    {(statusLabel[trackResult.status] || { label: trackResult.status }).label}
                  </span>
                </div>
                <div className="text-sm text-white/80 font-semibold">{trackResult.subject}</div>
                <div className="text-[10px] text-white/30 mt-1">
                  {trackResult.organ_code} · {new Date(trackResult.created_at).toLocaleDateString("ru-RU")}
                </div>
              </div>
            )}
            {trackResult === null && trackTicket && !trackLoading && (
              <div className="mt-2 text-xs text-red-400">Обращение не найдено. Проверьте номер.</div>
            )}
          </div>
        )}

        {tab === "organs" && (
          <>
            {/* Правовая база */}
            <div className="mb-6 p-4 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-3"
              style={{ background: "rgba(0,255,135,0.03)", border: "1px solid rgba(0,255,135,0.08)" }}>
              {[
                { icon: "FileText", label: "ФЗ №59", note: "30 дней на ответ" },
                { icon: "Scale",    label: "Конст. РФ ст. 33", note: "Право на обращение" },
                { icon: "Shield",   label: "ФЗ №273", note: "Антикоррупция" },
                { icon: "Lock",     label: "Анонимность", note: "По запросу заявителя" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <Icon name={item.icon as "Zap"} size={14} style={{ color: "#00ff87" }} />
                  <div>
                    <div className="text-xs font-bold text-white/70">{item.label}</div>
                    <div className="text-[10px] text-white/30">{item.note}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Фильтр по категориям */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilterCat(cat)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: filterCat === cat ? "rgba(0,255,135,0.12)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${filterCat === cat ? "rgba(0,255,135,0.3)" : "rgba(255,255,255,0.06)"}`,
                    color: filterCat === cat ? "#00ff87" : "rgba(255,255,255,0.4)",
                  }}>
                  {cat === "all" ? "Все органы" : CATEGORY_LABELS[cat] || cat}
                </button>
              ))}
            </div>

            {/* Список органов */}
            {loading ? (
              <div className="text-center py-16 text-white/30 text-sm">Загрузка органов...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOrgans.map(organ => (
                  <div key={organ.id}
                    onClick={() => setOpenOrgan(organ)}
                    className="p-5 rounded-2xl transition-all hover:scale-[1.01] group cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.06)` }}>

                    {/* Шапка */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${organ.color}15` }}>
                        <Icon name={organ.icon as "Zap"} size={20} style={{ color: organ.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-sm font-black text-white/90">{organ.name}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                            style={{ background: `${organ.color}12`, color: organ.color }}>
                            {organ.code}
                          </span>
                        </div>
                        <div className="text-[10px] text-white/30">{organ.full_name}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[9px] text-white/25">Срок ответа</div>
                        <div className="text-xs font-black" style={{ color: organ.response_days <= 7 ? "#f43f5e" : organ.response_days <= 15 ? "#f59e0b" : "#00ff87" }}>
                          {organ.response_days} дн.
                        </div>
                      </div>
                    </div>

                    {/* Описание */}
                    <p className="text-xs text-white/45 leading-relaxed mb-3">{organ.description}</p>

                    {/* Компетенция */}
                    <div className="px-3 py-2 rounded-lg mb-4"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="text-[9px] text-white/25 uppercase tracking-wider mb-0.5">Компетенция</div>
                      <div className="text-[11px] text-white/50 font-mono leading-relaxed">{organ.competence}</div>
                    </div>

                    {/* Нижняя строка: бейдж + кнопка */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-1 rounded-lg font-semibold"
                        style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <Icon name="Eye" size={10} className="inline mr-1" />
                        Открыть
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); openForm(organ); }}
                        className="flex-1 py-3 rounded-xl text-xs font-black tracking-wider transition-all hover:scale-[1.02] active:scale-95"
                        style={{ background: `linear-gradient(135deg, ${organ.color}25, ${organ.color}10)`, color: organ.color, border: `1px solid ${organ.color}35` }}>
                        Подать обращение →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Дисклеймер */}
            <div className="mt-8 p-4 rounded-xl text-[11px] text-white/25 leading-relaxed"
              style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)" }}>
              Органы ECSU 2.0 являются структурными подразделениями гражданской инициативы «ECSU 2.0» (Николаев В.В.).
              Система не является государственным органом. Все поступающие обращения регистрируются, анализируются
              ИИ-системой и перенаправляются в профильные государственные ведомства РФ и международные органы
              в соответствии с ФЗ №59 и иными нормами действующего законодательства.
              Для конфиденциальных обращений используйте <button onClick={() => navigate("/egsu/vip")} className="underline text-white/40 hover:text-white/60">ВИП-анонимный канал</button>.
            </div>
          </>
        )}

        {tab === "incidents" && (
          <div>
            <div className="flex gap-2 mb-5 flex-wrap">
              {[["all","Все"],["suspected","Предполагаемые"],["verified","Верифицированные"]].map(([v,l]) => (
                <button key={v} onClick={() => setIncFilter(v as typeof incFilter)}
                  className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: incFilter === v ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.04)",
                    color: incFilter === v ? "#f59e0b" : "rgba(255,255,255,0.4)",
                    border: `1px solid ${incFilter === v ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.07)"}`,
                  }}>{l}</button>
              ))}
              <button onClick={loadIncidents} className="ml-auto px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <Icon name="RefreshCw" size={13} />
              </button>
            </div>

            {/* Форма нового инцидента */}
            {selectedIncident && (
              <div className="mb-6 p-5 rounded-2xl" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Распоряжение по: {selectedIncident.title}</span>
                  <button onClick={() => setSelectedIncident(null)} className="text-white/25 hover:text-white/50"><Icon name="X" size={14} /></button>
                </div>
                <textarea value={orderForm.order_text} onChange={e => setOrderForm(f => ({...f, order_text: e.target.value}))}
                  placeholder="Текст распоряжения..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none resize-none mb-3"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(245,158,11,0.2)" }} />
                <div className="flex gap-3 mb-3">
                  <input value={orderForm.target_organ} onChange={e => setOrderForm(f => ({...f, target_organ: e.target.value}))}
                    placeholder="Целевой орган (код)"
                    className="flex-1 px-3 py-2 rounded-xl text-white text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  <select value={orderForm.priority} onChange={e => setOrderForm(f => ({...f, priority: e.target.value}))}
                    className="flex-1 px-3 py-2 rounded-xl text-white text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <option value="low" style={{ background: "#0d1220" }}>Низкий</option>
                    <option value="normal" style={{ background: "#0d1220" }}>Обычный</option>
                    <option value="high" style={{ background: "#0d1220" }}>Высокий</option>
                    <option value="critical" style={{ background: "#0d1220" }}>Критический</option>
                  </select>
                </div>
                <button onClick={saveOrder} disabled={savingOrder || !orderForm.order_text}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 disabled:opacity-40"
                  style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>
                  {savingOrder ? "Сохранение..." : "Создать распоряжение"}
                </button>
              </div>
            )}

            {incLoading && <div className="text-white/30 text-sm py-8 text-center">Загрузка инцидентов...</div>}
            <div className="space-y-3">
              {incidents.map(inc => {
                const sevColor: Record<string,string> = { low: "#10b981", medium: "#f59e0b", high: "#f97316", critical: "#f43f5e" };
                const sc = sevColor[inc.severity] || "#ffffff";
                return (
                  <div key={inc.id} className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.06)` }}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-xs font-bold" style={{ color: "#f59e0b" }}>{inc.incident_code}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: `${sc}15`, color: sc }}>{inc.severity}</span>
                          <span className="text-[10px] text-white/25">{inc.type}</span>
                        </div>
                        <div className="font-semibold text-white text-sm mb-1">{inc.title}</div>
                        <div className="text-white/35 text-xs mb-2 line-clamp-2">{inc.description}</div>
                        <div className="flex items-center gap-3 text-[10px] text-white/25">
                          <span>{inc.country}</span>
                          <span>AI: {Math.round(inc.ai_confidence * 100)}%</span>
                          <span>{inc.actions_count} действий</span>
                          <span>{new Date(inc.created_at).toLocaleDateString("ru-RU")}</span>
                        </div>
                      </div>
                      <button onClick={() => setSelectedIncident(inc)}
                        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                        style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                        + Распоряжение
                      </button>
                    </div>
                  </div>
                );
              })}
              {!incLoading && incidents.length === 0 && <div className="text-center py-12 text-white/25 text-sm">Инцидентов не обнаружено</div>}
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-bold text-white/60">Распоряжения владельца системы</span>
              <button onClick={loadOrders} className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
                style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <Icon name="RefreshCw" size={13} />
              </button>
            </div>
            {ordersLoading && <div className="text-white/30 text-sm py-8 text-center">Загрузка...</div>}
            <div className="space-y-3">
              {orders.map(ord => {
                const prColor: Record<string,string> = { low: "#10b981", normal: "#3b82f6", high: "#f59e0b", critical: "#f43f5e" };
                const pc = prColor[ord.priority] || "#ffffff";
                const stColor: Record<string,string> = { pending: "#f59e0b", executed: "#00ff87", cancelled: "#f43f5e" };
                const sc = stColor[ord.status] || "#ffffff";
                return (
                  <div key={ord.id} className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {ord.incident_code && <span className="font-mono text-xs font-bold" style={{ color: "#f59e0b" }}>{ord.incident_code}</span>}
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: `${pc}15`, color: pc }}>{ord.priority}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: `${sc}15`, color: sc }}>{ord.status}</span>
                        </div>
                        {ord.incident_title && <div className="text-white/35 text-xs mb-1">{ord.incident_title}</div>}
                        <div className="text-white/80 text-sm">{ord.order_text}</div>
                        {ord.target_organ && <div className="text-white/30 text-xs mt-1">Орган: {ord.target_organ}</div>}
                      </div>
                      <div className="text-white/25 text-xs shrink-0">{new Date(ord.created_at).toLocaleDateString("ru-RU")}</div>
                    </div>
                  </div>
                );
              })}
              {!ordersLoading && orders.length === 0 && <div className="text-center py-12 text-white/25 text-sm">Распоряжений пока нет</div>}
            </div>
          </div>
        )}

        {tab === "press" && (
          <div>
            {pressMsg && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm font-bold text-center"
                style={{ background: "rgba(0,255,135,0.1)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.2)" }}>
                {pressMsg}
              </div>
            )}

            {/* Форма нового пресс-релиза */}
            <div className="mb-6 p-5 rounded-2xl" style={{ background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.15)" }}>
              <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Новый пресс-релиз</div>
              <input value={pressForm.title} onChange={e => setPressForm(f => ({...f, title: e.target.value}))}
                placeholder="Заголовок пресс-релиза..."
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none mb-3"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(6,182,212,0.2)" }} />
              <textarea value={pressForm.content} onChange={e => setPressForm(f => ({...f, content: e.target.value}))}
                placeholder="Текст пресс-релиза..."
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none mb-3 resize-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(6,182,212,0.2)" }} />
              <div className="flex gap-3 mb-3">
                <input value={pressForm.incident_id} onChange={e => setPressForm(f => ({...f, incident_id: e.target.value}))}
                  placeholder="ID инцидента (необязательно)"
                  className="flex-1 px-3 py-2 rounded-xl text-white text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                <select value={pressForm.channel} onChange={e => setPressForm(f => ({...f, channel: e.target.value}))}
                  className="flex-1 px-3 py-2 rounded-xl text-white text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <option value="public" style={{ background: "#0d1220" }}>Публичный канал</option>
                  <option value="official" style={{ background: "#0d1220" }}>Официальный сайт</option>
                  <option value="telegram" style={{ background: "#0d1220" }}>Telegram-канал</option>
                  <option value="media" style={{ background: "#0d1220" }}>Международные СМИ</option>
                </select>
              </div>
              <button onClick={savePress} disabled={savingPress || !pressForm.title || !pressForm.content}
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 disabled:opacity-40"
                style={{ background: "rgba(6,182,212,0.15)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.3)" }}>
                {savingPress ? "Создание..." : "Создать пресс-релиз"}
              </button>
            </div>

            {/* Список пресс-релизов */}
            {pressLoading && <div className="text-white/30 text-sm py-8 text-center">Загрузка...</div>}
            <div className="space-y-3">
              {pressReleases.map(pr => (
                <div key={pr.id} className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${pr.status === "published" ? "rgba(0,255,135,0.15)" : "rgba(6,182,212,0.12)"}` }}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {pr.incident_code && <span className="font-mono text-xs font-bold" style={{ color: "#06b6d4" }}>{pr.incident_code}</span>}
                        <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: pr.status === "published" ? "rgba(0,255,135,0.12)" : "rgba(245,158,11,0.12)", color: pr.status === "published" ? "#00ff87" : "#f59e0b" }}>
                          {pr.status === "published" ? "Опубликован" : "Черновик"}
                        </span>
                      </div>
                      <div className="font-semibold text-white text-sm">{pr.title}</div>
                      {pr.incident_title && <div className="text-white/35 text-xs mt-0.5">{pr.incident_title}</div>}
                      <div className="text-white/25 text-xs mt-1 line-clamp-2">{pr.content}</div>
                    </div>
                    <div className="text-right shrink-0 text-xs text-white/25">
                      {new Date(pr.created_at).toLocaleDateString("ru-RU")}
                      {pr.published_at && <div style={{ color: "#00ff87" }}>Опубл.: {new Date(pr.published_at).toLocaleDateString("ru-RU")}</div>}
                    </div>
                  </div>
                  {pr.status !== "published" && (
                    <div className="flex gap-2 flex-wrap mt-3">
                      {["Официальный сайт EGSU","Telegram-канал EGSU","Пресс-служба EGSU","Международные СМИ"].map(ch => (
                        <button key={ch} onClick={() => publishPress(pr.id, [ch])} disabled={publishingPress === pr.id}
                          className="px-3 py-1 rounded-lg text-xs font-bold transition-all hover:scale-105 disabled:opacity-40"
                          style={{ background: "rgba(0,255,135,0.08)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.2)" }}>
                          <Icon name="Send" size={11} className="inline mr-1" />
                          {ch}
                        </button>
                      ))}
                      <button onClick={() => publishPress(pr.id, ["Официальный сайт EGSU","Telegram-канал EGSU","Пресс-служба EGSU","Международные СМИ"])} disabled={publishingPress === pr.id}
                        className="px-3 py-1 rounded-lg text-xs font-bold transition-all hover:scale-105 disabled:opacity-40"
                        style={{ background: "rgba(0,255,135,0.15)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.35)" }}>
                        <Icon name="Radio" size={11} className="inline mr-1" />
                        Все каналы
                      </button>
                    </div>
                  )}
                  {pr.status === "published" && (
                    <div className="mt-2 text-xs" style={{ color: "#00ff87" }}>
                      <Icon name="CheckCircle" size={12} className="inline mr-1" />
                      Опубликовано в: {pr.channel}
                    </div>
                  )}
                </div>
              ))}
              {!pressLoading && pressReleases.length === 0 && <div className="text-center py-12 text-white/25 text-sm">Пресс-релизов пока нет</div>}
            </div>
          </div>
        )}

        {/* Модальное окно детального просмотра органа */}
        {openOrgan && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
            <div className="w-full md:max-w-2xl max-h-[92vh] flex flex-col rounded-t-3xl md:rounded-3xl overflow-hidden"
              style={{ background: "#0d1220", border: "1px solid rgba(0,255,135,0.15)" }}>

              {/* Шапка */}
              <div className="flex items-center gap-3 px-5 py-4 shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: `${openOrgan.color}20`, border: `1px solid ${openOrgan.color}40` }}>
                  <Icon name={openOrgan.icon as "Shield"} size={18} style={{ color: openOrgan.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-sm truncate">{openOrgan.name}</div>
                  <div className="text-white/35 text-xs truncate">{openOrgan.code} · Гражданская позиция</div>
                </div>
                <button onClick={() => setOpenOrgan(null)} className="text-white/30 hover:text-white/70 transition-colors shrink-0">
                  <Icon name="X" size={20} />
                </button>
              </div>

              {/* Вкладки органа */}
              <div className="flex border-b shrink-0 overflow-x-auto"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                {[
                  { id: "organ-info", label: "Инфо", icon: "Info" },
                  { id: "organ-members", label: "Персонал", icon: "Users" },
                  { id: "organ-chat", label: "Диалог", icon: "MessageCircle" },
                  { id: "organ-contacts", label: "Внешние контакты", icon: "Globe" },
                ].map(t => (
                  <button key={t.id} onClick={() => setOrganTab(t.id as typeof organTab)}
                    className="flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors"
                    style={{
                      color: organTab === t.id ? "#00ff87" : "rgba(255,255,255,0.3)",
                      borderBottom: `2px solid ${organTab === t.id ? "#00ff87" : "transparent"}`,
                    }}>
                    <Icon name={t.icon as "Info"} size={13} />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Контент */}
              <div className="flex-1 overflow-y-auto p-5">

                {/* Инфо */}
                {organTab === "organ-info" && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="text-white/40 text-xs mb-1">Полное название</div>
                      <div className="text-white text-sm font-semibold">{openOrgan.full_name}</div>
                    </div>
                    <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="text-white/40 text-xs mb-1">Описание</div>
                      <div className="text-white/70 text-sm">{openOrgan.description}</div>
                    </div>
                    <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="text-white/40 text-xs mb-1">Компетенция</div>
                      <div className="text-white/70 text-sm">{openOrgan.competence}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-2xl text-center" style={{ background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.15)" }}>
                        <div className="font-bold text-2xl" style={{ color: "#00ff87" }}>{openOrgan.response_days}</div>
                        <div className="text-white/40 text-xs mt-1">дней на ответ</div>
                      </div>
                      <div className="p-4 rounded-2xl text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div className="font-bold text-sm text-white">{openOrgan.contact_internal}</div>
                        <div className="text-white/40 text-xs mt-1">внутренний код</div>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl text-xs text-center" style={{ background: "rgba(245,158,11,0.07)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.15)" }}>
                      Все органы работают на гражданской позиции. Легализация в процессе.
                    </div>
                    <button onClick={() => { setOpenOrgan(null); openForm(openOrgan); }}
                      className="w-full py-3 rounded-2xl font-bold text-sm text-white transition-all hover:scale-[1.02]"
                      style={{ background: `linear-gradient(135deg, ${openOrgan.color}40, ${openOrgan.color}20)`, border: `1px solid ${openOrgan.color}40`, color: openOrgan.color }}>
                      <Icon name="Send" size={14} className="inline mr-2" />
                      Подать обращение в этот орган
                    </button>
                  </div>
                )}

                {/* Персонал */}
                {organTab === "organ-members" && (
                  <div className="space-y-4">
                    {/* Форма добавления */}
                    <div className="p-4 rounded-2xl" style={{ background: "rgba(0,255,135,0.05)", border: "1px solid rgba(0,255,135,0.15)" }}>
                      <div className="text-white/60 text-xs font-semibold mb-3 uppercase tracking-wide">Добавить участника</div>
                      <input value={memberForm.full_name} onChange={e => setMemberForm(f => ({...f, full_name: e.target.value}))}
                        placeholder="ФИО участника"
                        className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none mb-2"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <input value={memberForm.role} onChange={e => setMemberForm(f => ({...f, role: e.target.value}))}
                          placeholder="Роль"
                          className="px-3 py-2 rounded-xl text-white text-sm outline-none"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                        <input value={memberForm.position} onChange={e => setMemberForm(f => ({...f, position: e.target.value}))}
                          placeholder="Должность"
                          className="px-3 py-2 rounded-xl text-white text-sm outline-none"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                      </div>
                      <button onClick={addMember} disabled={savingMember || !memberForm.full_name}
                        className="w-full py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                        style={{ background: "rgba(0,255,135,0.12)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.25)" }}>
                        {savingMember ? "Добавляется..." : "+ Добавить"}
                      </button>
                    </div>
                    {/* Список участников */}
                    {membersLoading && <div className="text-white/30 text-sm text-center py-6">Загрузка...</div>}
                    <div className="space-y-2">
                      {members.map(m => (
                        <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl"
                          style={{ background: m.is_owner ? "rgba(168,85,247,0.07)" : "rgba(255,255,255,0.03)", border: `1px solid ${m.is_owner ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.06)"}` }}>
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm"
                            style={{ background: m.is_owner ? "rgba(168,85,247,0.2)" : "rgba(0,255,135,0.1)", color: m.is_owner ? "#a855f7" : "#00ff87" }}>
                            {m.full_name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white text-sm truncate">{m.full_name}</div>
                            <div className="text-white/40 text-xs">{m.role}{m.position ? ` · ${m.position}` : ""}</div>
                          </div>
                          {m.is_owner && <span className="text-xs px-2 py-0.5 rounded-lg font-bold shrink-0" style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7" }}>Владелец</span>}
                        </div>
                      ))}
                      {!membersLoading && members.length === 0 && <div className="text-white/25 text-sm text-center py-8">Персонал не добавлен</div>}
                    </div>
                  </div>
                )}

                {/* Диалог / Чат */}
                {organTab === "organ-chat" && (
                  <div className="flex flex-col h-full" style={{ minHeight: "400px" }}>
                    <div className="mb-3 p-3 rounded-xl text-xs" style={{ background: "rgba(59,130,246,0.07)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.15)" }}>
                      Диалог ведётся с гражданской позиции. Запросы и предложения могут направляться во внешние органы.
                    </div>
                    {/* Сообщения */}
                    <div className="flex-1 overflow-y-auto space-y-3 mb-4" style={{ maxHeight: "350px" }}>
                      {dialogLoading && <div className="text-white/30 text-sm text-center py-6">Загрузка...</div>}
                      {dialogMessages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.is_owner ? "justify-end" : "justify-start"}`}>
                          <div className="max-w-[80%]">
                            <div className={`text-xs mb-1 ${msg.is_owner ? "text-right" : ""}`}
                              style={{ color: msg.is_owner ? "#a855f7" : "#00ff87" }}>
                              {msg.author_name} · {msg.author_role}
                            </div>
                            <div className="px-4 py-2.5 rounded-2xl text-sm text-white"
                              style={{ background: msg.is_owner ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.06)", border: `1px solid ${msg.is_owner ? "rgba(168,85,247,0.25)" : "rgba(255,255,255,0.08)"}` }}>
                              {msg.message}
                            </div>
                            <div className={`text-white/20 text-xs mt-1 ${msg.is_owner ? "text-right" : ""}`}>
                              {new Date(msg.created_at).toLocaleString("ru-RU", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })}
                            </div>
                          </div>
                        </div>
                      ))}
                      {!dialogLoading && dialogMessages.length === 0 && (
                        <div className="text-white/25 text-sm text-center py-8">Начните диалог</div>
                      )}
                    </div>
                    {/* Кнопка направить запрос в ведомство */}
                    <div className="mb-3 shrink-0">
                      <div className="text-white/30 text-xs mb-2 font-semibold uppercase tracking-wide">Направить запрос во внешнее ведомство</div>
                      <div className="flex flex-wrap gap-2">
                        {externalContacts.slice(0, 6).map(c => {
                          const catColor: Record<string,string> = { law_enforcement: "#f59e0b", security: "#a855f7", defense: "#f43f5e", justice: "#3b82f6", international: "#06b6d4", intelligence: "#ec4899", rights: "#10b981", diplomacy: "#00ff87" };
                          const color = catColor[c.category] || "#ffffff";
                          return (
                            <button key={c.id}
                              onClick={() => { setReceptionContact(c); setReceptionModal(true); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                              style={{ background: `${color}10`, color, border: `1px solid ${color}25` }}>
                              <Icon name="Send" size={10} />
                              {c.agency_short || c.agency_name.slice(0, 12)}
                            </button>
                          );
                        })}
                        {externalContacts.length > 6 && (
                          <button onClick={() => setOrganTab("organ-contacts")}
                            className="px-3 py-1.5 rounded-xl text-xs transition-all"
                            style={{ color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.08)" }}>
                            +{externalContacts.length - 6} ещё
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Ввод */}
                    <div className="flex gap-2 shrink-0">
                      <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChatMessage()}
                        placeholder="Сообщение, запрос или предложение..."
                        className="flex-1 px-4 py-2.5 rounded-2xl text-white text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                      <button onClick={sendChatMessage} disabled={sendingChat || !chatMsg.trim()}
                        className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40 shrink-0"
                        style={{ background: "rgba(0,255,135,0.15)", border: "1px solid rgba(0,255,135,0.3)" }}>
                        <Icon name="Send" size={16} style={{ color: "#00ff87" }} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Внешние контакты */}
                {organTab === "organ-contacts" && (
                  <div>
                    <div className="mb-3 p-3 rounded-xl text-xs" style={{ background: "rgba(6,182,212,0.07)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.15)" }}>
                      Реальные контакты государственных органов и международных организаций для направления запросов и рекомендаций с гражданской позиции.
                    </div>
                    <input value={contactFilter} onChange={e => setContactFilter(e.target.value)}
                      placeholder="Поиск по названию или стране..."
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none mb-4"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    {contactsLoading && <div className="text-white/30 text-sm text-center py-6">Загрузка...</div>}
                    <div className="space-y-3">
                      {externalContacts
                        .filter(c => !contactFilter || c.agency_name.toLowerCase().includes(contactFilter.toLowerCase()) || c.country.toLowerCase().includes(contactFilter.toLowerCase()) || (c.agency_short || "").toLowerCase().includes(contactFilter.toLowerCase()))
                        .map(c => {
                          const catColor: Record<string,string> = { law_enforcement: "#f59e0b", security: "#a855f7", defense: "#f43f5e", justice: "#3b82f6", international: "#06b6d4", intelligence: "#ec4899", rights: "#10b981", diplomacy: "#00ff87" };
                          const color = catColor[c.category] || "#ffffff";
                          return (
                            <div key={c.id} className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                              <div className="flex items-start gap-3 mb-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs"
                                  style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                                  {c.agency_short ? c.agency_short.slice(0,3) : c.agency_name.slice(0,2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-white text-sm">{c.agency_name}</div>
                                  <div className="text-white/40 text-xs">{c.country}</div>
                                </div>
                              </div>
                              {c.address && <div className="text-white/40 text-xs mb-2"><Icon name="MapPin" size={11} className="inline mr-1" />{c.address}</div>}
                              <div className="flex flex-wrap gap-2">
                                {c.phone && (
                                  <a href={`tel:${c.phone}`} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                                    style={{ background: "rgba(0,255,135,0.08)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.2)" }}>
                                    <Icon name="Phone" size={11} />
                                    {c.phone}
                                  </a>
                                )}
                                {c.email && (
                                  <a href={`mailto:${c.email}`} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                                    style={{ background: "rgba(59,130,246,0.08)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}>
                                    <Icon name="Mail" size={11} />
                                    {c.email}
                                  </a>
                                )}
                                {c.website && (
                                  <a href={c.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                                    style={{ background: "rgba(168,85,247,0.08)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.2)" }}>
                                    <Icon name="Globe" size={11} />
                                    Сайт
                                  </a>
                                )}
                                {c.online_form_url && (
                                  <a href={c.online_form_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                                    style={{ background: "rgba(6,182,212,0.08)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.2)" }}>
                                    <Icon name="Send" size={11} />
                                    Интернет-приёмная
                                  </a>
                                )}
                              </div>
                              {c.reception_info && <div className="mt-2 text-white/30 text-xs">{c.reception_info}</div>}
                            </div>
                          );
                        })}
                      {!contactsLoading && externalContacts.filter(c => !contactFilter || c.agency_name.toLowerCase().includes(contactFilter.toLowerCase()) || c.country.toLowerCase().includes(contactFilter.toLowerCase()) || (c.agency_short || "").toLowerCase().includes(contactFilter.toLowerCase())).length === 0 && (
                        <div className="text-white/25 text-sm text-center py-8">
                          {contactFilter ? "Ничего не найдено" : "Внешние контакты не загружены"}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Модальное окно — отправить в интернет-приёмную */}
              {receptionModal && receptionContact && (
                <div className="absolute inset-0 z-10 flex items-end justify-center"
                  style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
                  <div className="w-full rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto"
                    style={{ background: "#0d1220", border: "1px solid rgba(0,255,135,0.15)" }}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-white font-bold text-sm">{receptionContact.agency_name}</div>
                        <div className="text-white/40 text-xs mt-0.5">Направить официальный запрос</div>
                      </div>
                      <button onClick={() => setReceptionModal(false)} className="text-white/30 hover:text-white/70">
                        <Icon name="X" size={18} />
                      </button>
                    </div>
                    {receptionContact.reception_info && (
                      <div className="mb-3 px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(6,182,212,0.07)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.15)" }}>
                        {receptionContact.reception_info}
                      </div>
                    )}
                    <input value={receptionForm.subject} onChange={e => setReceptionForm(f => ({...f, subject: e.target.value}))}
                      placeholder="Тема обращения"
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none mb-3"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    <textarea value={receptionForm.message_text} onChange={e => setReceptionForm(f => ({...f, message_text: e.target.value}))}
                      placeholder="Текст обращения, запроса или рекомендации от органов EGSU..."
                      rows={6}
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none mb-3 resize-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    <div className="flex gap-2">
                      {receptionContact.online_form_url && (
                        <a href={receptionContact.online_form_url} target="_blank" rel="noopener noreferrer"
                          className="flex-1 py-2.5 rounded-xl text-xs font-bold text-center transition-all"
                          style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.25)" }}>
                          <Icon name="ExternalLink" size={12} className="inline mr-1" />
                          Открыть приёмную
                        </a>
                      )}
                      <button onClick={sendToReception} disabled={sendingReception || !receptionForm.message_text}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                        style={{ background: "rgba(0,255,135,0.12)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.25)" }}>
                        {sendingReception ? "Отправка..." : "Зарегистрировать запрос"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      <footer className="text-center py-4 text-[10px] text-white/15"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        ECSU 2.0 — Органы системы · © 2026 Николаев Владимир Владимирович
      </footer>
    </div>
  );

  // ─── Шаг: Форма обращения ────────────────────────────────────────────────
  if (step === "form" && selectedOrgan) return (
    <div className="min-h-screen" style={{ background: "#060a12", color: "#fff" }}>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-5 py-3"
        style={{ background: "rgba(6,10,18,0.97)", borderBottom: `1px solid ${selectedOrgan.color}20`, backdropFilter: "blur(16px)" }}>
        <button onClick={() => setStep("list")} className="text-white/30 hover:text-white/60 transition-colors">
          <Icon name="ChevronLeft" size={18} />
        </button>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${selectedOrgan.color}20` }}>
          <Icon name={selectedOrgan.icon as "Zap"} size={16} style={{ color: selectedOrgan.color }} />
        </div>
        <div>
          <div className="font-black text-sm text-white leading-none">{selectedOrgan.name}</div>
          <div className="text-[9px] text-white/25 tracking-widest">ПОДАЧА ОБРАЩЕНИЯ</div>
        </div>
      </nav>

      <div className="pt-20 pb-12 px-4 max-w-2xl mx-auto">

        {/* Карточка органа */}
        <div className="p-4 rounded-2xl mb-6"
          style={{ background: `${selectedOrgan.color}08`, border: `1px solid ${selectedOrgan.color}25` }}>
          <div className="text-xs text-white/50 mb-1">{selectedOrgan.full_name}</div>
          <div className="text-[11px] font-mono" style={{ color: selectedOrgan.color }}>
            Срок ответа: {selectedOrgan.response_days} дн. · Компетенция: {selectedOrgan.competence}
          </div>
        </div>

        <div className="space-y-4">

          {/* Тема */}
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Тема обращения *</label>
            <input
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="Кратко опишите суть обращения..."
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          {/* Описание */}
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Подробное описание *</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={5}
              placeholder="Опишите ситуацию максимально подробно: что произошло, когда, кто виновен, какой ущерб нанесён..."
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          {/* Место */}
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Место / Адрес</label>
            <input
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Город, адрес или регион (необязательно)"
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          {/* Доказательства */}
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Доказательства</label>
            <textarea
              value={form.evidence_desc}
              onChange={e => setForm(f => ({ ...f, evidence_desc: e.target.value }))}
              rows={2}
              placeholder="Опишите имеющиеся доказательства: фото, видео, документы, свидетели..."
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          {/* Контакты */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Email</label>
              <input
                value={form.contact_email}
                onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                placeholder="your@email.com"
                type="email"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Телефон</label>
              <input
                value={form.contact_phone}
                onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                placeholder="+7 (999) 000-00-00"
                type="tel"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
          </div>

          {/* Анонимность */}
          <label className="flex items-center gap-3 p-4 rounded-xl cursor-pointer"
            style={{ background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.15)" }}>
            <input
              type="checkbox"
              checked={form.is_anonymous}
              onChange={e => setForm(f => ({ ...f, is_anonymous: e.target.checked }))}
              className="w-4 h-4 accent-purple-500"
            />
            <div>
              <div className="text-sm font-bold text-white/80">Анонимное обращение</div>
              <div className="text-[11px] text-white/35">Ваши контактные данные не будут переданы третьим лицам</div>
            </div>
          </label>

          {/* Дисклеймер */}
          <div className="p-3 rounded-lg text-[11px] text-white/25 leading-relaxed"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            Направляя обращение, вы действуете на основании <b className="text-white/40">Конституции РФ ст. 33</b> и <b className="text-white/40">ФЗ №59</b>.
            Обращение будет зарегистрировано и передано в профильный государственный орган в течение 30 дней.
          </div>

          {/* Кнопка отправки */}
          <button
            onClick={submitAppeal}
            disabled={sending || !form.subject || !form.description}
            className="w-full py-4 rounded-2xl font-black text-sm tracking-wider transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: sending ? "rgba(0,255,135,0.1)" : `linear-gradient(135deg, ${selectedOrgan.color}35, ${selectedOrgan.color}15)`,
              color: selectedOrgan.color,
              border: `1px solid ${selectedOrgan.color}40`,
            }}
          >
            {sending ? (
              <span className="flex items-center justify-center gap-2">
                <Icon name="Loader" size={16} className="animate-spin" />
                Отправка обращения...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Icon name="Send" size={16} />
                Подать официальное обращение
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Шаг: Подтверждение ──────────────────────────────────────────────────
  if (step === "sent") return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#060a12", color: "#fff" }}>
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
          style={{ background: "rgba(0,255,135,0.1)", border: "1px solid rgba(0,255,135,0.3)" }}>
          <Icon name="CheckCircle" size={40} style={{ color: "#00ff87" }} />
        </div>
        <h2 className="text-2xl font-black text-white mb-3">Обращение зарегистрировано</h2>
        <p className="text-white/40 text-sm mb-6 leading-relaxed">
          Ваше обращение принято системой ECSU 2.0 и поставлено в очередь на обработку.
          Срок рассмотрения — до {selectedOrgan?.response_days || 30} дней.
        </p>

        <div className="p-4 rounded-2xl mb-6" style={{ background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.2)" }}>
          <div className="text-white/40 text-xs mb-2 uppercase tracking-wider">Номер обращения</div>
          <div className="text-xl font-black tracking-wider" style={{ color: "#00ff87" }}>{ticketId}</div>
          <div className="text-white/30 text-xs mt-2">Сохраните номер для отслеживания статуса</div>
        </div>

        <div className="space-y-3">
          <button onClick={() => { setStep("list"); setForm({ organ_code: "", category: "", subject: "", description: "", location: "", evidence_desc: "", contact_email: "", contact_phone: "", is_anonymous: false }); }}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.01]"
            style={{ background: "rgba(0,255,135,0.1)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.2)" }}>
            Вернуться к органам
          </button>
          <button onClick={() => navigate("/egsu/start")}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.01]"
            style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
            На главную ECSU
          </button>
        </div>
      </div>
    </div>
  );

  return null;
}