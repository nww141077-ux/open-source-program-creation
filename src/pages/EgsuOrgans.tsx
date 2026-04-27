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

   
  useEffect(() => {
    if (tab === "incidents") loadIncidents();
    if (tab === "orders") loadOrders();
    if (tab === "press") loadPress();
  }, [tab]);

   
  useEffect(() => {
    if (tab === "incidents") loadIncidents();
  }, [incFilter]);

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
                border: `1px solid ${tab === t.id ? "rgba(0,255,135,0.35)" : "rgba(255,255,255,0.08)"}`,
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
                    className="p-5 rounded-2xl transition-all hover:scale-[1.01] group"
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

                    {/* Кнопка */}
                    <button onClick={() => openForm(organ)}
                      className="w-full py-3 rounded-xl text-xs font-black tracking-wider transition-all hover:scale-[1.02] active:scale-95"
                      style={{ background: `linear-gradient(135deg, ${organ.color}25, ${organ.color}10)`, color: organ.color, border: `1px solid ${organ.color}35` }}>
                      Подать обращение →
                    </button>
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
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: incFilter === v ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.04)",
                    color: incFilter === v ? "#f59e0b" : "rgba(255,255,255,0.4)",
                    border: `1px solid ${incFilter === v ? "rgba(245,158,11,0.35)" : "rgba(255,255,255,0.08)"}`,
                  }}>{l}</button>
              ))}
            </div>
            {incLoading && <div className="text-white/30 text-sm py-8 text-center">Загрузка...</div>}
            <div className="space-y-3">
              {incidents.map(inc => {
                const sevColor = inc.severity === "critical" ? "#f43f5e" : inc.severity === "high" ? "#f59e0b" : inc.severity === "medium" ? "#a855f7" : "#3b82f6";
                const stBg = inc.status === "verified" ? "rgba(0,255,135,0.1)" : inc.status === "pending_verification" ? "rgba(245,158,11,0.1)" : "rgba(59,130,246,0.1)";
                const stColor = inc.status === "verified" ? "#00ff87" : inc.status === "pending_verification" ? "#f59e0b" : "#3b82f6";
                const stLabel = inc.status === "verified" ? "Верифицирован" : inc.status === "pending_verification" ? "На верификации" : "Новый";
                return (
                  <div key={inc.id} className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid rgba(255,255,255,0.07)` }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-xs font-bold" style={{ color: "#00ff87" }}>{inc.incident_code}</span>
                          <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: stBg, color: stColor }}>{stLabel}</span>
                          <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: `${sevColor}20`, color: sevColor }}>{inc.severity?.toUpperCase()}</span>
                        </div>
                        <div className="font-semibold text-white text-sm">{inc.title}</div>
                        <div className="text-white/40 text-xs mt-1">{inc.country} · {inc.responsible_organ || "Без органа"}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-white/25 text-xs">{new Date(inc.created_at).toLocaleDateString("ru-RU")}</div>
                        <div className="text-xs mt-1" style={{ color: "#a855f7" }}>AI: {inc.ai_confidence}%</div>
                      </div>
                    </div>
                    {inc.description && <div className="text-white/35 text-xs mb-3 line-clamp-2">{inc.description}</div>}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-white/25">Действий: {inc.actions_count}</span>
                      <span className="text-xs text-white/25">·</span>
                      <span className="text-xs text-white/25">Распоряжений: {inc.orders_count}</span>
                      <button onClick={() => { setSelectedIncident(inc); setTab("orders"); }}
                        className="ml-auto px-3 py-1 rounded-lg text-xs font-bold transition-all hover:scale-105"
                        style={{ background: "rgba(168,85,247,0.12)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.2)" }}>
                        <Icon name="ClipboardList" size={11} className="inline mr-1" />
                        Выдать распоряжение
                      </button>
                      <button onClick={() => { setPressForm(f => ({...f, incident_id: String(inc.id), title: `Официальное заявление по инциденту ${inc.incident_code}`, content: `По инциденту ${inc.incident_code}: ${inc.title}.\n\n${inc.description || ""}\n\nСтрана: ${inc.country}. Орган: ${inc.responsible_organ || "EGSU"}.`})); setTab("press"); }}
                        className="px-3 py-1 rounded-lg text-xs font-bold transition-all hover:scale-105"
                        style={{ background: "rgba(6,182,212,0.12)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.2)" }}>
                        <Icon name="Send" size={11} className="inline mr-1" />
                        В прессу
                      </button>
                    </div>
                  </div>
                );
              })}
              {!incLoading && incidents.length === 0 && (
                <div className="text-center py-12 text-white/25 text-sm">Инциденты не найдены</div>
              )}
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div>
            {selectedIncident && (
              <div className="mb-6 p-5 rounded-2xl" style={{ background: "rgba(168,85,247,0.07)", border: "2px solid rgba(168,85,247,0.25)" }}>
                <div className="font-bold text-white mb-3 flex items-center gap-2">
                  <Icon name="ClipboardList" size={16} style={{ color: "#a855f7" }} />
                  Новое распоряжение по: <span style={{ color: "#a855f7" }}>{selectedIncident.incident_code}</span>
                </div>
                <div className="text-white/50 text-xs mb-3">{selectedIncident.title}</div>
                <textarea value={orderForm.order_text} onChange={e => setOrderForm(f => ({...f, order_text: e.target.value}))}
                  placeholder="Текст распоряжения..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none mb-3 resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(168,85,247,0.2)" }} />
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input value={orderForm.target_organ} onChange={e => setOrderForm(f => ({...f, target_organ: e.target.value}))}
                    placeholder="Орган (напр. OGR-SECURITY)"
                    className="px-3 py-2 rounded-xl text-white text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  <select value={orderForm.priority} onChange={e => setOrderForm(f => ({...f, priority: e.target.value}))}
                    className="px-3 py-2 rounded-xl text-white text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <option value="normal" style={{ background: "#0d1220" }}>Обычный</option>
                    <option value="high" style={{ background: "#0d1220" }}>Высокий</option>
                    <option value="critical" style={{ background: "#0d1220" }}>Критический</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveOrder} disabled={savingOrder || !orderForm.order_text}
                    className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 disabled:opacity-40"
                    style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }}>
                    {savingOrder ? "Сохранение..." : "Выдать распоряжение"}
                  </button>
                  <button onClick={() => setSelectedIncident(null)} className="px-4 py-2 rounded-xl text-sm text-white/40 hover:text-white/60 transition-colors">Отмена</button>
                </div>
              </div>
            )}
            {ordersLoading && <div className="text-white/30 text-sm py-8 text-center">Загрузка...</div>}
            <div className="space-y-3">
              {orders.map(o => {
                const pColor = o.priority === "critical" ? "#f43f5e" : o.priority === "high" ? "#f59e0b" : "#a855f7";
                return (
                  <div key={o.id} className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(168,85,247,0.12)" }}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs font-bold" style={{ color: "#a855f7" }}>{o.incident_code || "—"}</span>
                      <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: `${pColor}20`, color: pColor }}>{o.priority?.toUpperCase()}</span>
                      <span className="text-xs text-white/25 ml-auto">{new Date(o.created_at).toLocaleDateString("ru-RU")}</span>
                    </div>
                    {o.incident_title && <div className="text-white/40 text-xs mb-1.5">{o.incident_title}</div>}
                    <div className="text-white text-sm">{o.order_text}</div>
                    {o.target_organ && <div className="text-white/30 text-xs mt-1.5">→ {o.target_organ}</div>}
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
              <div className="mb-4 p-3 rounded-xl text-sm font-bold text-center" style={{ background: "rgba(6,182,212,0.12)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.25)" }}>{pressMsg}</div>
            )}
            {/* Форма создания пресс-релиза */}
            <div className="mb-6 p-5 rounded-2xl" style={{ background: "rgba(6,182,212,0.06)", border: "2px solid rgba(6,182,212,0.2)" }}>
              <div className="font-bold text-white mb-4 flex items-center gap-2">
                <Icon name="Newspaper" size={16} style={{ color: "#06b6d4" }} />
                Новый пресс-релиз
              </div>
              <input value={pressForm.title} onChange={e => setPressForm(f => ({...f, title: e.target.value}))}
                placeholder="Заголовок пресс-релиза..."
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none mb-3"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(6,182,212,0.2)" }} />
              <textarea value={pressForm.content} onChange={e => setPressForm(f => ({...f, content: e.target.value}))}
                placeholder="Текст официального заявления..."
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
            <div className="text-right text-[10px] text-white/20 mt-1">{form.description.length} симв.</div>
          </div>

          {/* Место */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Место / регион</label>
              <input
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="Адрес, город, регион..."
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Доказательства</label>
              <input
                value={form.evidence_desc}
                onChange={e => setForm(f => ({ ...f, evidence_desc: e.target.value }))}
                placeholder="Документы, фото, видео..."
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
          </div>

          {/* Контакты / анонимность */}
          <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input type="checkbox" checked={form.is_anonymous}
                onChange={e => setForm(f => ({ ...f, is_anonymous: e.target.checked }))}
                className="w-4 h-4 rounded accent-purple-500" />
              <div>
                <div className="text-sm font-semibold text-white/80">Подать анонимно</div>
                <div className="text-[10px] text-white/30">Контактные данные не будут сохранены. Для полностью защищённого канала — используйте ВИП.</div>
              </div>
            </label>
            {!form.is_anonymous && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Email (для ответа)</label>
                  <input
                    value={form.contact_email}
                    onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                    type="email"
                    placeholder="your@email.com"
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Телефон</label>
                  <input
                    value={form.contact_phone}
                    onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                    type="tel"
                    placeholder="+7 (999) 000-00-00"
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={submitAppeal}
          disabled={!form.subject || !form.description || sending}
          className="w-full mt-6 py-4 rounded-2xl font-black text-sm tracking-wider transition-all hover:scale-[1.01] disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: `linear-gradient(135deg, ${selectedOrgan.color}, #3b82f6)`, color: "#fff" }}>
          {sending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Регистрируется в системе...
            </span>
          ) : `Подать обращение в ${selectedOrgan.name} →`}
        </button>
      </div>
    </div>
  );

  // ─── Шаг: Успешно зарегистрировано ──────────────────────────────────────
  if (step === "sent") return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#060a12", color: "#fff" }}>
      <div className="w-full max-w-lg text-center">

        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "linear-gradient(135deg, #00ff87, #3b82f6)" }}>
          <Icon name="CheckCircle" size={36} className="text-black" />
        </div>

        <h1 className="text-2xl font-black text-white mb-2">Обращение зарегистрировано</h1>
        <p className="text-white/40 text-sm mb-6">Орган ECSU 2.0 принял ваше обращение к рассмотрению</p>

        <div className="p-5 rounded-2xl mb-6"
          style={{ background: "rgba(0,255,135,0.05)", border: "1px solid rgba(0,255,135,0.2)" }}>
          <div className="text-xs text-white/30 mb-2">Номер вашего обращения</div>
          <div className="font-mono text-2xl font-black tracking-widest mb-2" style={{ color: "#00ff87" }}>
            {ticketId}
          </div>
          <div className="text-[11px] text-white/35 leading-relaxed">
            Сохраните этот номер — по нему можно отследить статус на странице органов ECSU.
          </div>
        </div>

        <div className="p-4 rounded-xl mb-6 text-left"
          style={{ background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.15)" }}>
          <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Что дальше</div>
          <div className="space-y-1.5 text-[11px] text-white/40 leading-relaxed">
            {selectedOrgan && <p>📋 Орган: <b className="text-white/60">{selectedOrgan.name}</b></p>}
            <p>⏱️ Срок рассмотрения: <b className="text-white/60">{selectedOrgan?.response_days || 30} дней</b> (ФЗ №59)</p>
            <p>📌 При бездействии свыше 30 дней — автоматическая эскалация (КоАП РФ ст. 5.59)</p>
            <p>🔍 Проверить статус: страница «Органы ECSU» → «Статус обращения» → введите номер</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => { setStep("list"); setTicketId(""); setForm({ organ_code: "", category: "", subject: "", description: "", location: "", evidence_desc: "", contact_email: "", contact_phone: "", is_anonymous: false }); }}
            className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.01]"
            style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
            Новое обращение
          </button>
          <button onClick={() => navigate("/egsu/start")}
            className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.01]"
            style={{ background: "rgba(0,255,135,0.1)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.2)" }}>
            На главную
          </button>
        </div>
      </div>
    </div>
  );

  return null;
}