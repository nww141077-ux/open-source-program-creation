/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const ORGANS_API = "https://functions.poehali.dev/e47c4dc6-578b-4069-8827-85cba5b8d930";

const REQUEST_TYPES = [
  { code: "organ_member", label: "Вступление в орган ECSU", desc: "Стать участником одного из органов системы", icon: "Users", color: "#a855f7" },
  { code: "country", label: "Представитель страны / организации", desc: "Официальное представительство страны или организации", icon: "Globe", color: "#3b82f6" },
  { code: "observer", label: "Статус наблюдателя", desc: "Наблюдение за деятельностью системы без права голоса", icon: "Eye", color: "#10b981" },
];

const ORGANS = [
  { code: "OGR-GENERAL", label: "Главный орган ECSU", color: "#00ff87" },
  { code: "OGR-ECOLOGY", label: "Орган экологии", color: "#10b981" },
  { code: "OGR-CYBER", label: "Орган киберзащиты", color: "#2196F3" },
  { code: "OGR-RIGHTS", label: "Орган прав человека", color: "#ec4899" },
  { code: "OGR-ANTI-CORR", label: "Антикоррупционный орган", color: "#f59e0b" },
  { code: "OGR-SECURITY", label: "Орган безопасности", color: "#a855f7" },
  { code: "OGR-FINANCE", label: "Финансовый орган", color: "#f59e0b" },
  { code: "OGR-EMERGENCY", label: "Орган ЧС и экстренного реагирования", color: "#f43f5e" },
  { code: "OGR-LEGAL", label: "Правовой орган", color: "#3b82f6" },
  { code: "OGR-MEDIA", label: "Медиа и информационный орган", color: "#06b6d4" },
];

interface JoinRequest {
  id: number;
  request_type: string;
  organ_code: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  organization: string | null;
  position: string | null;
  motivation: string | null;
  experience: string | null;
  status: string;
  owner_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

type ViewMode = "public" | "admin";

export default function EgsuJoin() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewMode>("public");
  const [step, setStep] = useState<"form" | "sent">("form");
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [noteInput, setNoteInput] = useState<Record<number, string>>({});

  const [form, setForm] = useState({
    request_type: "organ_member",
    organ_code: "",
    full_name: "",
    email: "",
    phone: "",
    country: "",
    organization: "",
    position: "",
    motivation: "",
    experience: "",
  });

  function upd(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function submitForm() {
    if (!form.full_name.trim() || !form.email.trim()) return;
    setLoading(true);
    await fetch(`${ORGANS_API}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setStep("sent");
  }

  async function loadRequests() {
    setLoadingRequests(true);
    const res = await fetch(`${ORGANS_API}/join?status=${filterStatus}`);
    const data = await res.json();
    setRequests(data.requests || []);
    setLoadingRequests(false);
  }

  useEffect(() => {
    if (view === "admin") loadRequests();
  }, [view, filterStatus]);

  async function reviewRequest(id: number, status: "approved" | "rejected") {
    setActionLoading(id);
    await fetch(`${ORGANS_API}/join`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, owner_note: noteInput[id] || null }),
    });
    setActionLoading(null);
    loadRequests();
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen font-body" style={{ background: "#060a12" }}>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: "rgba(6,10,18,0.97)", borderBottom: "1px solid rgba(168,85,247,0.15)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/egsu/organs")} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
            <Icon name="ChevronLeft" size={16} />
          </button>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
            <Icon name="UserPlus" size={14} className="text-white" />
          </div>
          <span className="text-white font-semibold text-sm">ECSU 2.0 — Вступление в систему</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setView("public"); setStep("form"); }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: view === "public" ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.04)", color: view === "public" ? "#a855f7" : "rgba(255,255,255,0.4)", border: `1px solid ${view === "public" ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.08)"}` }}>
            Подать заявку
          </button>
          <button onClick={() => setView("admin")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: view === "admin" ? "rgba(0,255,135,0.1)" : "rgba(255,255,255,0.04)", color: view === "admin" ? "#00ff87" : "rgba(255,255,255,0.4)", border: `1px solid ${view === "admin" ? "rgba(0,255,135,0.25)" : "rgba(255,255,255,0.08)"}` }}>
            <Icon name="ShieldCheck" size={12} className="inline mr-1" />
            Владелец
          </button>
        </div>
      </nav>

      <div className="pt-20 px-4 pb-8 max-w-2xl mx-auto">
        {/* === ПУБЛИЧНАЯ ФОРМА === */}
        {view === "public" && step === "form" && (
          <div className="space-y-4">
            <div className="rounded-2xl p-5" style={{ background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.2)" }}>
              <div className="flex items-center gap-3 mb-2">
                <Icon name="UserPlus" size={20} style={{ color: "#a855f7" }} />
                <div>
                  <div className="text-white font-bold">Заявка на вступление в ECSU 2.0</div>
                  <div className="text-white/40 text-xs">Система в режиме разработки · Рассмотрение до 30 дней</div>
                </div>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">
                Система ECSU 2.0 находится в стадии создания. После подачи заявки вы получите уведомление на email о решении владельца системы.
              </p>
            </div>

            {/* Тип заявки */}
            <div className="space-y-2">
              <div className="text-white/40 text-xs uppercase tracking-widest">Тип участия</div>
              {REQUEST_TYPES.map(t => (
                <button key={t.code} onClick={() => upd("request_type", t.code)}
                  className="w-full flex items-start gap-3 p-3.5 rounded-xl text-left transition-all"
                  style={{ background: form.request_type === t.code ? `${t.color}10` : "rgba(255,255,255,0.03)", border: `1px solid ${form.request_type === t.code ? t.color + "30" : "rgba(255,255,255,0.07)"}` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${t.color}15` }}>
                    <Icon name={t.icon as any} size={16} style={{ color: t.color }} />
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold">{t.label}</div>
                    <div className="text-white/40 text-xs">{t.desc}</div>
                  </div>
                  {form.request_type === t.code && <Icon name="CheckCircle" size={16} style={{ color: t.color }} className="ml-auto shrink-0 mt-1" />}
                </button>
              ))}
            </div>

            {/* Орган (если organ_member) */}
            {form.request_type === "organ_member" && (
              <div className="space-y-2">
                <div className="text-white/40 text-xs uppercase tracking-widest">Выберите орган</div>
                <select value={form.organ_code} onChange={e => upd("organ_code", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <option value="">— Не выбрано —</option>
                  {ORGANS.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
                </select>
              </div>
            )}

            {/* Личные данные */}
            <div className="space-y-2">
              <div className="text-white/40 text-xs uppercase tracking-widest">Личные данные</div>
              {[
                { key: "full_name", label: "Полное имя *", ph: "Иванов Иван Иванович" },
                { key: "email", label: "Email *", ph: "ivan@example.com" },
                { key: "phone", label: "Телефон", ph: "+7 900 000-00-00" },
                { key: "country", label: "Страна", ph: "Россия" },
                { key: "organization", label: "Организация / учреждение", ph: "ООО Пример" },
                { key: "position", label: "Должность / роль", ph: "Директор, эксперт, волонтёр..." },
              ].map(f => (
                <input key={f.key} value={(form as any)[f.key]} onChange={e => upd(f.key, e.target.value)}
                  placeholder={f.ph}
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none placeholder:text-white/20"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
              ))}
            </div>

            {/* Мотивация */}
            <div className="space-y-2">
              <div className="text-white/40 text-xs uppercase tracking-widest">Мотивационное письмо</div>
              <textarea value={form.motivation} onChange={e => upd("motivation", e.target.value)}
                placeholder="Почему вы хотите вступить в систему ECSU 2.0? Чем вы можете быть полезны?"
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none placeholder:text-white/20 resize-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>

            <div className="space-y-2">
              <div className="text-white/40 text-xs uppercase tracking-widest">Опыт и компетенции</div>
              <textarea value={form.experience} onChange={e => upd("experience", e.target.value)}
                placeholder="Ваш опыт, образование, навыки..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none placeholder:text-white/20 resize-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>

            <button onClick={submitForm} disabled={loading || !form.full_name.trim() || !form.email.trim()}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)", color: "#fff" }}>
              {loading ? "Отправляем заявку..." : "Подать заявку на вступление"}
            </button>

            <div className="text-center text-white/30 text-xs">
              После отправки вы получите уведомление на email · Рассмотрение до 30 дней
            </div>
          </div>
        )}

        {/* === УСПЕХ === */}
        {view === "public" && step === "sent" && (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(0,255,135,0.1)", border: "1px solid rgba(0,255,135,0.3)" }}>
              <Icon name="CheckCircle" size={32} style={{ color: "#00ff87" }} />
            </div>
            <div className="text-white font-bold text-xl">Заявка принята</div>
            <div className="text-white/50 text-sm max-w-xs mx-auto leading-relaxed">
              Ваша заявка зарегистрирована в системе ECSU 2.0. Владелец системы получил уведомление на email. Вы получите ответ на указанный вами email после рассмотрения.
            </div>
            <div className="rounded-xl px-4 py-3 inline-block" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
              <div className="text-white/50 text-xs">Система в режиме разработки · © 2026 ECSU 2.0</div>
            </div>
            <button onClick={() => { setStep("form"); setForm({ request_type: "organ_member", organ_code: "", full_name: "", email: "", phone: "", country: "", organization: "", position: "", motivation: "", experience: "" }); }}
              className="block mx-auto text-white/40 text-sm hover:text-white/70 transition-colors">
              Подать ещё одну заявку
            </button>
          </div>
        )}

        {/* === ПАНЕЛЬ ВЛАДЕЛЬЦА === */}
        {view === "admin" && (
          <div className="space-y-4">
            <div className="rounded-2xl p-4" style={{ background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.2)" }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon name="ShieldCheck" size={18} style={{ color: "#00ff87" }} />
                <span className="text-white font-bold">Панель владельца — Управление заявками</span>
              </div>
              <div className="text-white/40 text-xs">Здесь отображаются все заявки на вступление. При одобрении участник автоматически добавляется в орган. На email заявителя отправляется уведомление.</div>
            </div>

            {/* Фильтры */}
            <div className="flex gap-2">
              {[
                { v: "pending", label: "Ожидают", color: "#f59e0b" },
                { v: "approved", label: "Одобрены", color: "#00ff87" },
                { v: "rejected", label: "Отклонены", color: "#f43f5e" },
                { v: "", label: "Все", color: "#a855f7" },
              ].map(s => (
                <button key={s.v} onClick={() => setFilterStatus(s.v)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: filterStatus === s.v ? `${s.color}15` : "rgba(255,255,255,0.03)", color: filterStatus === s.v ? s.color : "rgba(255,255,255,0.4)", border: `1px solid ${filterStatus === s.v ? s.color + "30" : "rgba(255,255,255,0.07)"}` }}>
                  {s.label}
                </button>
              ))}
            </div>

            {loadingRequests && <div className="text-center py-8 text-white/30">Загрузка...</div>}

            {!loadingRequests && requests.length === 0 && (
              <div className="text-center py-12 text-white/20">
                <Icon name="InboxIcon" size={32} className="mx-auto mb-3 opacity-30" />
                <div>Заявок нет</div>
              </div>
            )}

            {requests.map(req => {
              const rt = REQUEST_TYPES.find(t => t.code === req.request_type);
              const organ = ORGANS.find(o => o.code === req.organ_code);
              return (
                <div key={req.id} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-bold text-sm">#{req.id} · {req.full_name}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: req.status === "pending" ? "rgba(245,158,11,0.15)" : req.status === "approved" ? "rgba(0,255,135,0.1)" : "rgba(244,63,94,0.1)", color: req.status === "pending" ? "#f59e0b" : req.status === "approved" ? "#00ff87" : "#f43f5e" }}>
                          {req.status === "pending" ? "Ожидает" : req.status === "approved" ? "Одобрена" : "Отклонена"}
                        </span>
                      </div>
                      <div className="text-white/40 text-xs">{rt?.label}</div>
                      {organ && <div className="text-xs mt-0.5" style={{ color: organ.color }}>{organ.label}</div>}
                    </div>
                    <div className="text-white/30 text-xs shrink-0">{fmt(req.created_at)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { l: "Email", v: req.email },
                      { l: "Телефон", v: req.phone },
                      { l: "Страна", v: req.country },
                      { l: "Организация", v: req.organization },
                      { l: "Должность", v: req.position },
                    ].filter(x => x.v).map(x => (
                      <div key={x.l} className="px-2.5 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div className="text-white/30 text-xs">{x.l}</div>
                        <div className="text-white text-xs font-medium">{x.v}</div>
                      </div>
                    ))}
                  </div>

                  {req.motivation && (
                    <div className="mb-3 px-3 py-2.5 rounded-xl text-xs text-white/50 leading-relaxed" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="text-white/30 text-xs mb-1">Мотивация</div>
                      {req.motivation}
                    </div>
                  )}
                  {req.experience && (
                    <div className="mb-3 px-3 py-2.5 rounded-xl text-xs text-white/50 leading-relaxed" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="text-white/30 text-xs mb-1">Опыт</div>
                      {req.experience}
                    </div>
                  )}

                  {req.owner_note && (
                    <div className="mb-3 px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)", color: "#a855f7" }}>
                      Примечание: {req.owner_note}
                    </div>
                  )}

                  {req.status === "pending" && (
                    <div className="space-y-2">
                      <input value={noteInput[req.id] || ""} onChange={e => setNoteInput(n => ({ ...n, [req.id]: e.target.value }))}
                        placeholder="Примечание (необязательно)..."
                        className="w-full px-3 py-2 rounded-xl text-white text-xs outline-none placeholder:text-white/20"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }} />
                      <div className="flex gap-2">
                        <button onClick={() => reviewRequest(req.id, "approved")} disabled={actionLoading === req.id}
                          className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
                          style={{ background: "rgba(0,255,135,0.12)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.25)" }}>
                          {actionLoading === req.id ? "..." : "✅ Одобрить"}
                        </button>
                        <button onClick={() => reviewRequest(req.id, "rejected")} disabled={actionLoading === req.id}
                          className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
                          style={{ background: "rgba(244,63,94,0.08)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.2)" }}>
                          {actionLoading === req.id ? "..." : "❌ Отклонить"}
                        </button>
                      </div>
                    </div>
                  )}
                  {req.status !== "pending" && req.reviewed_at && (
                    <div className="text-white/20 text-xs">Рассмотрено: {fmt(req.reviewed_at)}</div>
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