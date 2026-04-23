import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/e5c4bdb8-7609-4caf-85b4-6c8e2c676c7a";

// ─── Типы ─────────────────────────────────────────────────────────────────────
interface Claim {
  id: number;
  claimant_name: string;
  claimant_email: string | null;
  claimant_phone: string | null;
  violation_type: string;
  violation_description: string;
  legal_basis: string | null;
  claimed_amount: number | null;
  evidence_description: string | null;
  incident_id: number | null;
  status: string;
  penalty_charged: number | null;
  absorption_account_id: number | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

type StatusKey = "new" | "review" | "accepted" | "rejected" | "paid";
type FilterStatus = "all" | StatusKey;

// ─── Справочники ──────────────────────────────────────────────────────────────
const VIOLATION_TYPES: { value: string; label: string; icon: string; penalty: number }[] = [
  { value: "unauthorized_actions", label: "Самоуправство / незаконные действия", icon: "Gavel",         penalty: 50000  },
  { value: "data_theft",           label: "Кража данных / информации",           icon: "Database",      penalty: 100000 },
  { value: "environmental",        label: "Экологический ущерб",                 icon: "Leaf",          penalty: 75000  },
  { value: "harassment",           label: "Преследование / угрозы",              icon: "UserX",         penalty: 30000  },
  { value: "fraud",                label: "Мошенничество",                       icon: "AlertOctagon",  penalty: 80000  },
  { value: "rights_violation",     label: "Нарушение прав человека",             icon: "Shield",        penalty: 40000  },
  { value: "other",                label: "Иное нарушение",                      icon: "HelpCircle",    penalty: 25000  },
];

const VT_MAP = Object.fromEntries(VIOLATION_TYPES.map(v => [v.value, v]));

const STATUS_CFG: Record<StatusKey, { label: string; color: string; bg: string }> = {
  new:      { label: "Новый",          color: "#3b82f6", bg: "rgba(59,130,246,0.12)"  },
  review:   { label: "Рассматривается",color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  accepted: { label: "Принят",         color: "#00c864", bg: "rgba(0,200,100,0.12)"   },
  rejected: { label: "Отклонён",       color: "#f43f5e", bg: "rgba(244,63,94,0.12)"   },
  paid:     { label: "Оплачен",        color: "#a855f7", bg: "rgba(168,85,247,0.12)"  },
};

const FILTER_TABS: { key: FilterStatus; label: string; icon: string }[] = [
  { key: "all",      label: "Все",            icon: "List"         },
  { key: "new",      label: "Новые",          icon: "FilePlus"     },
  { key: "review",   label: "На рассмотрении",icon: "Eye"          },
  { key: "accepted", label: "Принятые",       icon: "CheckCircle"  },
  { key: "rejected", label: "Отклонённые",    icon: "XCircle"      },
  { key: "paid",     label: "Оплаченные",     icon: "BadgeCheck"   },
];

const EMPTY_FORM = {
  claimant_name: "",
  claimant_email: "",
  claimant_phone: "",
  violation_type: "unauthorized_actions",
  violation_description: "",
  legal_basis: "",
  claimed_amount: "",
  evidence_description: "",
};

// ─── Утилиты ──────────────────────────────────────────────────────────────────
function parse(d: unknown) {
  if (typeof d === "string") { try { return JSON.parse(d); } catch { return d; } }
  return d;
}

function fmtRub(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(s: string) {
  try { return new Date(s).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }); }
  catch { return s; }
}

// ─── Вспом. компоненты ────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status as StatusKey] ?? { label: status, color: "#94a3b8", bg: "rgba(148,163,184,0.12)" };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, letterSpacing: "0.3px" }}>
      {cfg.label}
    </span>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}25`, borderRadius: 12, padding: "16px 20px", flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={16} color={color} />
        </div>
        <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: color, letterSpacing: "-0.5px" }}>{value}</div>
    </div>
  );
}

// ─── Главный компонент ────────────────────────────────────────────────────────
export default function EgsuCivilClaims() {
  const navigate = useNavigate();

  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [lastResult, setLastResult] = useState<{ penalty: number; id: number } | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 4000); };

  // ── Загрузка ───────────────────────────────────────────────────────────────
  const load = async (status?: string) => {
    setLoading(true);
    try {
      const url = status && status !== "all" ? `${API}?status=${status}` : API;
      const data = await fetch(url).then(r => r.json()).then(parse).catch(() => []);
      setClaims(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(filterStatus); }, [filterStatus]);

  // ── Подать иск ────────────────────────────────────────────────────────────
  const submit = async () => {
    if (!form.claimant_name.trim())          { showToast("Введите имя заявителя"); return; }
    if (!form.violation_type)                { showToast("Выберите тип нарушения"); return; }
    if (!form.violation_description.trim())  { showToast("Опишите нарушение"); return; }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        claimant_name: form.claimant_name.trim(),
        violation_type: form.violation_type,
        violation_description: form.violation_description.trim(),
      };
      if (form.claimant_email.trim())       payload.claimant_email       = form.claimant_email.trim();
      if (form.claimant_phone.trim())       payload.claimant_phone       = form.claimant_phone.trim();
      if (form.legal_basis.trim())          payload.legal_basis          = form.legal_basis.trim();
      if (form.evidence_description.trim()) payload.evidence_description = form.evidence_description.trim();
      if (form.claimed_amount)              payload.claimed_amount       = parseFloat(form.claimed_amount);

      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = parse(await r.json()) as Claim & { message?: string };

      if (d?.id) {
        setLastResult({ penalty: d.penalty_charged ?? 0, id: d.id });
        setShowForm(false);
        setForm({ ...EMPTY_FORM });
        showToast(`✓ Иск #${d.id} принят. Штраф ${fmtRub(d.penalty_charged)} начислен.`);
        await load(filterStatus);
      } else {
        showToast("✗ Ошибка при подаче иска");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Статистика ────────────────────────────────────────────────────────────
  // Для статистики всегда берём все иски (при filterStatus !== all — догружаем отдельно)
  const totalPenalty  = claims.reduce((s, c) => s + (c.penalty_charged ?? 0), 0);
  const countReview   = claims.filter(c => c.status === "review").length;
  const countAccepted = claims.filter(c => c.status === "accepted").length;
  const countAll      = claims.length;

  // ── Предполагаемый штраф для текущего типа в форме ────────────────────────
  const expectedPenalty = VT_MAP[form.violation_type]?.penalty ?? 25000;

  // ─── Рендер ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e2e8f0", fontFamily: "Inter, sans-serif" }}>

      {/* ШАПКА */}
      <div style={{
        background: "rgba(10,10,15,0.96)",
        borderBottom: "1px solid rgba(0,200,100,0.18)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 8, padding: "6px 12px", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, transition: "background 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
          >
            <Icon name="ArrowLeft" size={15} /> Назад
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #00c864, #00a050)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="Scale" size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9", letterSpacing: "-0.3px" }}>Гражданские иски</div>
              <div style={{ fontSize: 11, color: "#00c864", marginTop: -1 }}>ECSU 2.0 · Режим Поглощения</div>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Индикатор */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: "rgba(0,200,100,0.10)", border: "1px solid rgba(0,200,100,0.25)" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00c864", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#00c864", letterSpacing: "0.5px" }}>ABSORPTION ACTIVE</span>
          </div>

          <button
            onClick={() => { setShowForm(true); setLastResult(null); }}
            style={{ background: "linear-gradient(135deg, #00c864, #00a050)", border: "none", borderRadius: 8, padding: "8px 18px", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, transition: "opacity 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            <Icon name="FilePlus" size={15} /> Подать иск
          </button>
        </div>
      </div>

      {/* КОНТЕНТ */}
      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "28px 24px" }}>

        {/* Результат последнего поданного иска */}
        {lastResult && (
          <div style={{ background: "rgba(0,200,100,0.07)", border: "1px solid rgba(0,200,100,0.30)", borderRadius: 12, padding: "14px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
            <Icon name="CheckCircle" size={20} color="#00c864" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#00c864" }}>Иск #{lastResult.id} успешно подан</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                Штраф {fmtRub(lastResult.penalty)} автоматически начислен на счёт Absorption Fund
              </div>
            </div>
            <button onClick={() => setLastResult(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#475569", cursor: "pointer" }}>
              <Icon name="X" size={16} />
            </button>
          </div>
        )}

        {/* Статистика */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
          <StatCard icon="FileText"    label="Всего исков"      value={countAll}          color="#3b82f6" />
          <StatCard icon="Eye"         label="Рассматривается"  value={countReview}        color="#f59e0b" />
          <StatCard icon="CheckCircle" label="Принято"          value={countAccepted}      color="#00c864" />
          <StatCard icon="TrendingUp"  label="Взыскано штрафов" value={fmtRub(totalPenalty)} color="#a855f7" />
        </div>

        {/* Фильтры по статусу */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          {FILTER_TABS.map(f => {
            const active = filterStatus === f.key;
            const cfg = f.key !== "all" ? STATUS_CFG[f.key as StatusKey] : null;
            const activeColor = cfg?.color ?? "#00c864";
            return (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  border: `1px solid ${active ? activeColor + "60" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 8, padding: "6px 14px",
                  background: active ? `${activeColor}18` : "rgba(255,255,255,0.03)",
                  color: active ? activeColor : "#64748b",
                  cursor: "pointer", fontSize: 12, fontWeight: active ? 700 : 400,
                  transition: "all 0.15s",
                }}
              >
                <Icon name={f.icon} size={12} />
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Список исков */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#475569", fontSize: 13 }}>
            <Icon name="Loader" size={28} color="#334155" style={{ display: "block", margin: "0 auto 10px" }} />
            Загрузка...
          </div>
        ) : claims.length === 0 ? (
          <div style={{ textAlign: "center", padding: "70px 0", color: "#475569" }}>
            <Icon name="Scale" size={44} color="#1e293b" style={{ display: "block", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Исков не найдено</div>
            <div style={{ fontSize: 13 }}>Подайте первый иск, нажав «Подать иск»</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {claims.map(claim => {
              const vt = VT_MAP[claim.violation_type];
              const expanded = expandedId === claim.id;
              return (
                <div
                  key={claim.id}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 12, overflow: "hidden",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(0,200,100,0.20)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
                >
                  {/* Основная строка */}
                  <div
                    style={{ padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}
                    onClick={() => setExpandedId(expanded ? null : claim.id)}
                  >
                    {/* Тип нарушения — иконка */}
                    <div style={{ width: 38, height: 38, borderRadius: 9, background: "rgba(0,200,100,0.08)", border: "1px solid rgba(0,200,100,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name={vt?.icon ?? "FileText"} size={16} color="#00c864" />
                    </div>

                    {/* Истец + тип */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{claim.claimant_name}</span>
                        <StatusBadge status={claim.status} />
                        <span style={{ fontSize: 11, color: "#475569" }}>#{claim.id}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {vt?.label ?? claim.violation_type}
                      </div>
                    </div>

                    {/* Суммы */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      {claim.claimed_amount != null && (
                        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>
                          Требование: <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{fmtRub(claim.claimed_amount)}</span>
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        Штраф: <span style={{ color: "#a855f7", fontWeight: 700 }}>{fmtRub(claim.penalty_charged)}</span>
                      </div>
                    </div>

                    {/* Дата */}
                    <div style={{ fontSize: 11, color: "#334155", flexShrink: 0, textAlign: "right", minWidth: 90 }}>
                      {fmtDate(claim.created_at)}
                    </div>

                    {/* Chevron */}
                    <Icon name={expanded ? "ChevronUp" : "ChevronDown"} size={16} color="#475569" style={{ flexShrink: 0 }} />
                  </div>

                  {/* Раскрытая детализация */}
                  {expanded && (
                    <div style={{ padding: "0 18px 18px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, paddingTop: 14 }}>

                        <div>
                          <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Описание нарушения</div>
                          <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>{claim.violation_description || "—"}</div>
                        </div>

                        {claim.legal_basis && (
                          <div>
                            <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Правовое основание</div>
                            <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>{claim.legal_basis}</div>
                          </div>
                        )}

                        {claim.evidence_description && (
                          <div>
                            <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Доказательства</div>
                            <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>{claim.evidence_description}</div>
                          </div>
                        )}

                        <div>
                          <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Контакты</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            {claim.claimant_email && <div>{claim.claimant_email}</div>}
                            {claim.claimant_phone && <div>{claim.claimant_phone}</div>}
                            {!claim.claimant_email && !claim.claimant_phone && "—"}
                          </div>
                        </div>

                        {claim.resolution_notes && (
                          <div style={{ gridColumn: "1 / -1" }}>
                            <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Решение / Примечания</div>
                            <div style={{ fontSize: 13, color: "#00c864", lineHeight: 1.5, background: "rgba(0,200,100,0.06)", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(0,200,100,0.15)" }}>
                              {claim.resolution_notes}
                            </div>
                          </div>
                        )}

                      </div>

                      {/* Absorption Fund */}
                      <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.18)", display: "flex", alignItems: "center", gap: 8 }}>
                        <Icon name="Zap" size={14} color="#a855f7" />
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>
                          Штраф <strong style={{ color: "#a855f7" }}>{fmtRub(claim.penalty_charged)}</strong> начислен на Absorption Fund (счёт #{claim.absorption_account_id ?? 5})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* МОДАЛЬНАЯ ФОРМА ПОДАЧИ ИСКА */}
      {showForm && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}
        >
          <div style={{ width: "100%", maxWidth: 560, background: "#0f1117", border: "1px solid rgba(0,200,100,0.25)", borderRadius: 16, overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>

            {/* Шапка модала */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,200,100,0.05)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name="Scale" size={18} color="#00c864" />
                <span style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>Подача гражданского иска</span>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer" }}>
                <Icon name="X" size={20} />
              </button>
            </div>

            {/* Тело формы */}
            <div style={{ overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Имя */}
              <div>
                <label style={lbl}>Имя заявителя *</label>
                <input
                  value={form.claimant_name}
                  onChange={e => setForm(f => ({ ...f, claimant_name: e.target.value }))}
                  placeholder="Иванов Иван Иванович"
                  style={inp}
                />
              </div>

              {/* Email + Телефон */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>Email</label>
                  <input value={form.claimant_email} onChange={e => setForm(f => ({ ...f, claimant_email: e.target.value }))} placeholder="example@mail.ru" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Телефон</label>
                  <input value={form.claimant_phone} onChange={e => setForm(f => ({ ...f, claimant_phone: e.target.value }))} placeholder="+7 900 000-00-00" style={inp} />
                </div>
              </div>

              {/* Тип нарушения */}
              <div>
                <label style={lbl}>Тип нарушения *</label>
                <select
                  value={form.violation_type}
                  onChange={e => setForm(f => ({ ...f, violation_type: e.target.value }))}
                  style={{ ...inp, cursor: "pointer" }}
                >
                  {VIOLATION_TYPES.map(v => (
                    <option key={v.value} value={v.value} style={{ background: "#0f1117" }}>{v.label}</option>
                  ))}
                </select>
                {/* Ожидаемый штраф */}
                <div style={{ marginTop: 6, padding: "7px 12px", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.20)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Штраф по данному типу:</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#a855f7" }}>{fmtRub(expectedPenalty)}</span>
                </div>
              </div>

              {/* Описание нарушения */}
              <div>
                <label style={lbl}>Описание нарушения *</label>
                <textarea
                  value={form.violation_description}
                  onChange={e => setForm(f => ({ ...f, violation_description: e.target.value }))}
                  placeholder="Подробно опишите суть нарушения..."
                  rows={4}
                  style={{ ...inp, resize: "vertical" }}
                />
              </div>

              {/* Правовое основание */}
              <div>
                <label style={lbl}>Правовое основание (опционально)</label>
                <textarea
                  value={form.legal_basis}
                  onChange={e => setForm(f => ({ ...f, legal_basis: e.target.value }))}
                  placeholder="Например: ФЗ №149, УК РФ ст. 272, ГК РФ ст. 1064..."
                  rows={2}
                  style={{ ...inp, resize: "vertical" }}
                />
              </div>

              {/* Сумма иска */}
              <div>
                <label style={lbl}>Сумма иска, ₽ (опционально)</label>
                <input
                  type="number"
                  min="0"
                  value={form.claimed_amount}
                  onChange={e => setForm(f => ({ ...f, claimed_amount: e.target.value }))}
                  placeholder="0"
                  style={inp}
                />
              </div>

              {/* Доказательства */}
              <div>
                <label style={lbl}>Описание доказательств (опционально)</label>
                <textarea
                  value={form.evidence_description}
                  onChange={e => setForm(f => ({ ...f, evidence_description: e.target.value }))}
                  placeholder="Скриншоты, свидетели, документы..."
                  rows={2}
                  style={{ ...inp, resize: "vertical" }}
                />
              </div>
            </div>

            {/* Подвал формы */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 10, flexShrink: 0 }}>
              <button
                onClick={() => setShowForm(false)}
                style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 8, padding: "10px", color: "#94a3b8", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
              >
                Отмена
              </button>
              <button
                onClick={submit}
                disabled={saving}
                style={{ flex: 2, background: saving ? "rgba(0,200,100,0.35)" : "linear-gradient(135deg, #00c864, #00a050)", border: "none", borderRadius: 8, padding: "10px", color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <Icon name={saving ? "Loader" : "Send"} size={15} />
                {saving ? "Подаю иск..." : `Подать иск — штраф ${fmtRub(expectedPenalty)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ТОСТ */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          background: toast.startsWith("✓") ? "linear-gradient(135deg,#052b16,#093d22)" : "linear-gradient(135deg,#2b0505,#3d0909)",
          border: `1px solid ${toast.startsWith("✓") ? "rgba(0,200,100,0.40)" : "rgba(244,63,94,0.40)"}`,
          borderRadius: 12, padding: "12px 20px",
          color: "#e2e8f0", fontSize: 13, fontWeight: 500,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", gap: 8,
          animation: "fadeIn 0.3s ease", maxWidth: 380,
        }}>
          <Icon name={toast.startsWith("✓") ? "CheckCircle" : "AlertCircle"} size={15} color={toast.startsWith("✓") ? "#00c864" : "#f43f5e"} />
          {toast}
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #334155; }
        select option { background: #0f1117; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,200,100,0.20); border-radius: 3px; }
      `}</style>
    </div>
  );
}

// ─── Стили инпутов ────────────────────────────────────────────────────────────
const lbl: React.CSSProperties = {
  display: "block", marginBottom: 6,
  fontSize: 11, color: "#475569",
  textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600,
};

const inp: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 8, padding: "9px 12px",
  color: "#e2e8f0", fontSize: 13, outline: "none",
  fontFamily: "inherit",
};
