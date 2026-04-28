/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/e47c4dc6-578b-4069-8827-85cba5b8d930";

// ─── Услуги системы ──────────────────────────────────────────────────────────
const SERVICES = [
  {
    code: "legal_consult",
    name: "Правовая консультация",
    desc: "Анализ вашей ситуации по нормам РФ и международного права. Подготовка обращений, исков, жалоб.",
    price: 2500,
    price_label: "от 2 500 ₽",
    duration: "1–2 дня",
    icon: "Scale",
    color: "#3b82f6",
    tags: ["УК РФ", "ГПК", "ЕКПЧ", "МГП"],
  },
  {
    code: "incident_analysis",
    name: "Анализ инцидента ECSU",
    desc: "Профессиональный разбор экологического, кибер- или гуманитарного инцидента. Правовая квалификация, рекомендации.",
    price: 3500,
    price_label: "от 3 500 ₽",
    duration: "2–3 дня",
    icon: "SearchCheck",
    color: "#10b981",
    tags: ["Экология", "Кибербез", "Права"],
  },
  {
    code: "appeal_draft",
    name: "Составление обращения",
    desc: "Подготовка официального обращения в государственные органы, прокуратуру, международные организации.",
    price: 1500,
    price_label: "от 1 500 ₽",
    duration: "1 день",
    icon: "FileText",
    color: "#a855f7",
    tags: ["Прокуратура", "ООН", "ОБСЕ"],
  },
  {
    code: "dalan_access",
    name: "Доступ к Далан-1",
    desc: "Расширенный доступ к ИИ-ассистенту ECSU 2.0 с приоритетной обработкой запросов и углублённым анализом.",
    price: 990,
    price_label: "990 ₽ / мес",
    duration: "Ежемесячно",
    icon: "BrainCircuit",
    color: "#f59e0b",
    tags: ["ИИ", "Анализ", "Приоритет"],
  },
  {
    code: "ecsu_report",
    name: "Отчёт мониторинга ECSU",
    desc: "Подробный отчёт по результатам мониторинга открытых источников (GDACS, USGS, CVE, ReliefWeb) по заданной теме.",
    price: 4500,
    price_label: "от 4 500 ₽",
    duration: "3–5 дней",
    icon: "BarChart2",
    color: "#06b6d4",
    tags: ["GDACS", "CVE", "ReliefWeb"],
  },
  {
    code: "cyber_audit",
    name: "Кибераудит / ЦПВОА",
    desc: "Анализ киберугроз, аномалий в сети, выявление уязвимостей. Отчёт с рекомендациями по защите.",
    price: 7500,
    price_label: "от 7 500 ₽",
    duration: "5–7 дней",
    icon: "ShieldCheck",
    color: "#ec4899",
    tags: ["ЦПВОА", "Аномалии", "Уязвимости"],
  },
  {
    code: "genome_research",
    name: "Исследование геномных данных",
    desc: "Независимый анализ биомедицинских данных в интересах активного долголетия. Биологический суверенитет гарантирован.",
    price: 12000,
    price_label: "от 12 000 ₽",
    duration: "7–14 дней",
    icon: "Dna",
    color: "#00ff87",
    tags: ["Геном", "Долголетие", "Конфиденциально"],
  },
  {
    code: "ecsu_partner",
    name: "Партнёрство с ECSU",
    desc: "Официальное сотрудничество: размещение данных в системе, совместные исследования, представительство страны/организации.",
    price: 0,
    price_label: "Обсуждается",
    duration: "Индивидуально",
    icon: "Handshake",
    color: "#f59e0b",
    tags: ["Партнёрство", "B2B", "Представительство"],
  },
];

// Реквизиты для прямой оплаты
const REQUISITES = {
  sbp: "+7 (XXX) XXX-XX-XX",
  card: "Номер карты после регистрации самозанятого",
  comment: "ECSU — [название услуги] — [ваше имя]",
};

type View = "catalog" | "order" | "admin";

interface Order {
  id: number;
  service_code: string;
  service_name: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  message: string | null;
  amount_rub: number | null;
  status: string;
  owner_note: string | null;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  new:       { label: "Новая",       color: "#f59e0b" },
  contacted: { label: "На связи",    color: "#3b82f6" },
  paid:      { label: "Оплачена",    color: "#00ff87" },
  cancelled: { label: "Отменена",    color: "#f43f5e" },
};

export default function EgsuMonetize() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("catalog");
  const [selected, setSelected] = useState<typeof SERVICES[0] | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ new_count: 0, total_paid_rub: 0 });
  const [filterStatus, setFilterStatus] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [noteInput, setNoteInput] = useState<Record<number, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ client_name: "", client_email: "", client_phone: "", message: "" });

  function upd(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function submitOrder() {
    if (!selected || !form.client_name || !form.client_email) return;
    setSending(true);
    await fetch(`${API}/monetize/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_code: selected.code,
        service_name: selected.name,
        client_name: form.client_name,
        client_email: form.client_email,
        client_phone: form.client_phone || null,
        message: form.message || null,
        amount: selected.price || null,
      }),
    });
    setSending(false);
    setSent(true);
  }

  async function loadOrders() {
    setLoadingOrders(true);
    const url = filterStatus ? `${API}/monetize/orders?status=${filterStatus}` : `${API}/monetize/orders`;
    const res = await fetch(url);
    const data = await res.json();
    setOrders(data.orders || []);
    setStats({ new_count: data.new_count || 0, total_paid_rub: data.total_paid_rub || 0 });
    setLoadingOrders(false);
  }

  useEffect(() => { if (view === "admin") loadOrders(); }, [view, filterStatus]);

  async function updateStatus(id: number, status: string) {
    setActionLoading(id);
    await fetch(`${API}/monetize/order`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, owner_note: noteInput[id] || null }),
    });
    setActionLoading(null);
    loadOrders();
  }

  const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(n);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

  // Расчёт после налогов (самозанятый 6% от юрлиц / 4% от физлиц)
  const calcNet = (amount: number) => {
    const tax = amount * 0.06;
    const net = amount - tax;
    const owner = net * 0.51;
    return { tax, net, owner };
  };

  return (
    <div className="min-h-screen font-body" style={{ background: "#060a12" }}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: "rgba(6,10,18,0.97)", borderBottom: "1px solid rgba(0,255,135,0.12)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/egsu/start")} className="text-white/30 hover:text-white/60 transition-colors">
            <Icon name="ChevronLeft" size={16} />
          </button>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00ff87, #3b82f6)" }}>
            <Icon name="Banknote" size={14} className="text-black" />
          </div>
          <span className="text-white font-bold text-sm">ECSU — Монетизация</span>
          {stats.new_count > 0 && view !== "catalog" && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
              {stats.new_count} новых
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {(["catalog", "admin"] as View[]).map(v => (
            <button key={v} onClick={() => { setView(v); setSent(false); setSelected(null); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: view === v ? "rgba(0,255,135,0.1)" : "rgba(255,255,255,0.04)",
                color: view === v ? "#00ff87" : "rgba(255,255,255,0.4)",
                border: `1px solid ${view === v ? "rgba(0,255,135,0.25)" : "rgba(255,255,255,0.08)"}`,
              }}>
              {v === "catalog" ? "Услуги" : "Заявки"}
            </button>
          ))}
        </div>
      </nav>

      <div className="pt-20 px-4 pb-10 max-w-2xl mx-auto">

        {/* ═══ КАТАЛОГ УСЛУГ ═══ */}
        {view === "catalog" && !selected && (
          <div className="space-y-4">
            {/* Шапка */}
            <div className="rounded-2xl p-5" style={{ background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.15)" }}>
              <div className="flex items-center gap-3 mb-2">
                <Icon name="TrendingUp" size={20} style={{ color: "#00ff87" }} />
                <div>
                  <div className="text-white font-bold">ECSU 2.0 — Услуги и монетизация</div>
                  <div className="text-white/40 text-xs">Система в режиме разработки · Первые заявки принимаются</div>
                </div>
              </div>
              <p className="text-white/50 text-sm">
                Выберите услугу — оставьте заявку — получите ответ от Николаева В.В. в течение 24 часов.
                Оплата после подтверждения по реквизитам самозанятого.
              </p>
            </div>

            {/* Реквизиты */}
            <div className="rounded-2xl p-4" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
              <div className="text-white/40 text-xs uppercase tracking-widest mb-2">Порядок оплаты</div>
              <div className="space-y-1.5 text-sm">
                {[
                  { icon: "ListOrdered", text: "1. Оставьте заявку на нужную услугу" },
                  { icon: "Phone", text: "2. Владелец свяжется с вами в течение 24ч" },
                  { icon: "CreditCard", text: "3. Оплата по реквизитам самозанятого (СБП / карта)" },
                  { icon: "FileCheck", text: "4. Получаете чек и выполненную услугу" },
                ].map(r => (
                  <div key={r.text} className="flex items-center gap-2 text-white/60">
                    <Icon name={r.icon as any} size={13} style={{ color: "#3b82f6" }} />
                    {r.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Каталог */}
            <div className="grid grid-cols-1 gap-3">
              {SERVICES.map(s => {
                const net = s.price > 0 ? calcNet(s.price) : null;
                return (
                  <button key={s.code} onClick={() => { setSelected(s); setView("order"); setSent(false); setForm({ client_name: "", client_email: "", client_phone: "", message: "" }); }}
                    className="w-full text-left rounded-2xl p-4 transition-all hover:scale-[1.01]"
                    style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${s.color}20` }}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}15` }}>
                        <Icon name={s.icon as any} size={18} style={{ color: s.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-white font-bold text-sm">{s.name}</div>
                          <div className="shrink-0 text-right">
                            <div className="font-bold text-sm" style={{ color: s.color }}>{s.price_label}</div>
                            <div className="text-white/30 text-xs">{s.duration}</div>
                          </div>
                        </div>
                        <div className="text-white/50 text-xs mt-1 leading-relaxed">{s.desc}</div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {s.tags.map(t => (
                            <span key={t} className="px-2 py-0.5 rounded-full text-xs" style={{ background: `${s.color}10`, color: s.color }}>
                              {t}
                            </span>
                          ))}
                        </div>
                        {net && (
                          <div className="mt-2 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                            После налогов (6% НПД): вам ~{fmt(Math.round(net.owner))} ₽
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ ФОРМА ЗАЯВКИ ═══ */}
        {view === "order" && selected && !sent && (
          <div className="space-y-4">
            <button onClick={() => { setSelected(null); setView("catalog"); }} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm">
              <Icon name="ChevronLeft" size={15} /> Назад к услугам
            </button>

            <div className="rounded-2xl p-4" style={{ background: `${selected.color}08`, border: `1px solid ${selected.color}25` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${selected.color}15` }}>
                  <Icon name={selected.icon as any} size={18} style={{ color: selected.color }} />
                </div>
                <div>
                  <div className="text-white font-bold">{selected.name}</div>
                  <div className="font-bold" style={{ color: selected.color }}>{selected.price_label} · {selected.duration}</div>
                </div>
              </div>
            </div>

            {selected.price > 0 && (
              <div className="rounded-xl p-3" style={{ background: "rgba(0,255,135,0.05)", border: "1px solid rgba(0,255,135,0.12)" }}>
                <div className="text-white/40 text-xs mb-2">Расчёт после налогов (самозанятый 6% НПД)</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Стоимость", value: `${fmt(selected.price)} ₽`, color: "#fff" },
                    { label: "Налог (6%)", value: `${fmt(Math.round(selected.price * 0.06))} ₽`, color: "#f59e0b" },
                    { label: "Вам (51%)", value: `${fmt(Math.round(calcNet(selected.price).owner))} ₽`, color: "#00ff87" },
                  ].map(c => (
                    <div key={c.label} className="text-center px-2 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{c.label}</div>
                      <div className="font-bold text-sm mt-0.5" style={{ color: c.color }}>{c.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-white/40 text-xs uppercase tracking-widest">Ваши данные</div>
              {[
                { key: "client_name", label: "Полное имя *", ph: "Иванов Иван Иванович" },
                { key: "client_email", label: "Email для связи *", ph: "ivan@example.com" },
                { key: "client_phone", label: "Телефон (необязательно)", ph: "+7 900 000-00-00" },
              ].map(f => (
                <input key={f.key} value={(form as any)[f.key]} onChange={e => upd(f.key, e.target.value)}
                  placeholder={f.ph}
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none placeholder:text-white/20"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
              ))}
              <textarea value={form.message} onChange={e => upd("message", e.target.value)}
                placeholder="Опишите вашу задачу подробнее..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none placeholder:text-white/20 resize-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>

            <button onClick={submitOrder} disabled={sending || !form.client_name || !form.client_email}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
              style={{ background: `linear-gradient(135deg, ${selected.color}, #3b82f6)`, color: selected.color === "#00ff87" ? "#000" : "#fff" }}>
              {sending ? "Отправляем заявку..." : "Отправить заявку"}
            </button>
            <div className="text-center text-white/25 text-xs">Владелец свяжется с вами в течение 24 часов · Оплата после подтверждения</div>
          </div>
        )}

        {/* ═══ УСПЕХ ═══ */}
        {view === "order" && sent && (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(0,255,135,0.1)", border: "1px solid rgba(0,255,135,0.3)" }}>
              <Icon name="CheckCircle" size={32} style={{ color: "#00ff87" }} />
            </div>
            <div className="text-white font-bold text-xl">Заявка отправлена</div>
            <div className="text-white/50 text-sm max-w-xs mx-auto">
              Николаев Владимир Владимирович получил уведомление и свяжется с вами в течение 24 часов.
            </div>
            <button onClick={() => { setView("catalog"); setSelected(null); setSent(false); }}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{ background: "rgba(0,255,135,0.1)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.2)" }}>
              Вернуться к услугам
            </button>
          </div>
        )}

        {/* ═══ ПАНЕЛЬ ВЛАДЕЛЬЦА — ЗАЯВКИ ═══ */}
        {view === "admin" && (
          <div className="space-y-4">
            {/* Статистика */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <div className="text-3xl font-black" style={{ color: "#f59e0b" }}>{stats.new_count}</div>
                <div className="text-white/40 text-xs mt-1">Новых заявок</div>
              </div>
              <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.15)" }}>
                <div className="text-2xl font-black" style={{ color: "#00ff87" }}>{fmt(Math.round(stats.total_paid_rub))} ₽</div>
                <div className="text-white/40 text-xs mt-1">Получено (оплачено)</div>
              </div>
            </div>

            {/* Фильтры */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { v: "", label: "Все", color: "#a855f7" },
                { v: "new", label: "Новые", color: "#f59e0b" },
                { v: "contacted", label: "На связи", color: "#3b82f6" },
                { v: "paid", label: "Оплачены", color: "#00ff87" },
                { v: "cancelled", label: "Отменены", color: "#f43f5e" },
              ].map(s => (
                <button key={s.v} onClick={() => setFilterStatus(s.v)}
                  className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: filterStatus === s.v ? `${s.color}15` : "rgba(255,255,255,0.03)",
                    color: filterStatus === s.v ? s.color : "rgba(255,255,255,0.4)",
                    border: `1px solid ${filterStatus === s.v ? s.color + "30" : "rgba(255,255,255,0.07)"}`,
                  }}>
                  {s.label}
                </button>
              ))}
            </div>

            {loadingOrders && <div className="text-center py-8 text-white/30">Загрузка...</div>}

            {!loadingOrders && orders.length === 0 && (
              <div className="text-center py-12">
                <Icon name="Inbox" size={36} className="mx-auto mb-3 opacity-20" />
                <div className="text-white/20">Заявок нет</div>
              </div>
            )}

            {orders.map(o => {
              const svc = SERVICES.find(s => s.code === o.service_code);
              const st = STATUS_MAP[o.status] || { label: o.status, color: "#888" };
              return (
                <div key={o.id} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-bold text-sm">#{o.id} · {o.service_name}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: `${st.color}15`, color: st.color }}>
                          {st.label}
                        </span>
                      </div>
                      <div className="text-white/40 text-xs mt-0.5">{o.client_name}</div>
                    </div>
                    <div className="text-white/30 text-xs shrink-0">{fmtDate(o.created_at)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { l: "Email", v: o.client_email },
                      { l: "Телефон", v: o.client_phone },
                      { l: "Сумма", v: o.amount_rub ? `${fmt(o.amount_rub)} ₽` : null },
                      { l: "После налогов (вам)", v: o.amount_rub ? `~${fmt(Math.round(calcNet(o.amount_rub).owner))} ₽` : null },
                    ].filter(x => x.v).map(x => (
                      <div key={x.l} className="px-2.5 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div className="text-white/30 text-xs">{x.l}</div>
                        <div className="text-white text-xs font-medium">{x.v}</div>
                      </div>
                    ))}
                  </div>

                  {o.message && (
                    <div className="mb-3 px-3 py-2 rounded-xl text-xs text-white/50 leading-relaxed" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      {o.message}
                    </div>
                  )}

                  {svc && (
                    <div className="mb-3 flex items-center gap-2">
                      <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: `${svc.color}15` }}>
                        <Icon name={svc.icon as any} size={11} style={{ color: svc.color }} />
                      </div>
                      <span className="text-xs" style={{ color: svc.color }}>{svc.name}</span>
                    </div>
                  )}

                  {o.owner_note && (
                    <div className="mb-3 px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(168,85,247,0.08)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.15)" }}>
                      Заметка: {o.owner_note}
                    </div>
                  )}

                  {o.status !== "paid" && o.status !== "cancelled" && (
                    <div className="space-y-2">
                      <input value={noteInput[o.id] || ""} onChange={e => setNoteInput(n => ({ ...n, [o.id]: e.target.value }))}
                        placeholder="Заметка (необязательно)..."
                        className="w-full px-3 py-2 rounded-xl text-white text-xs outline-none placeholder:text-white/20"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }} />
                      <div className="flex gap-2 flex-wrap">
                        {o.status === "new" && (
                          <button onClick={() => updateStatus(o.id, "contacted")} disabled={actionLoading === o.id}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold disabled:opacity-40"
                            style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.25)" }}>
                            📞 На связи
                          </button>
                        )}
                        <button onClick={() => updateStatus(o.id, "paid")} disabled={actionLoading === o.id}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold disabled:opacity-40"
                          style={{ background: "rgba(0,255,135,0.1)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.2)" }}>
                          ✅ Оплачена
                        </button>
                        <button onClick={() => updateStatus(o.id, "cancelled")} disabled={actionLoading === o.id}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold disabled:opacity-40"
                          style={{ background: "rgba(244,63,94,0.08)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.2)" }}>
                          ❌ Отменить
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
