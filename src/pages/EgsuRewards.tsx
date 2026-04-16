import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const GATEWAY = "https://functions.poehali.dev/417cb87f-8717-4563-a698-6e3f5bb17500";
const SMS_API = "https://functions.poehali.dev/65523c0c-db23-4d8b-9c7e-6bae200b3318";
const FINANCE_API = "https://functions.poehali.dev/e610af8a-f8c5-4c04-8d9b-092391fb0c70";

const OWNER = { name: "Николаев Владимир Владимирович", system: "ЕЦСУ 2.0" };

type RewardType = {
  id: number; code: string; name_ru: string; description: string;
  legal_basis: string; min_amount_rub: number; max_amount_rub: number;
  percentage_of_damage: number; conditions: string; payer: string;
};

type Country = {
  id: number; code: string; name_ru: string; region: string;
  contact_ministry: string; contact_email: string; contact_phone: string;
  appeal_url: string; legal_basis: string;
};

function parse(d: unknown) {
  if (typeof d === "string") { try { return JSON.parse(d); } catch { return d; } }
  return d;
}

const fmt = (n: number) => n ? new Intl.NumberFormat("ru-RU").format(n) + " ₽" : "—";

export default function EgsuRewards() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"rewards" | "request" | "countries" | "monitor">("rewards");
  const [rewards, setRewards] = useState<RewardType[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [monitorResult, setMonitorResult] = useState<{
    inaction_detected: boolean; inaction_days: number; corruption_suspected: boolean;
    penalty_recommended_rub: number; escalation_report: string; sms_to_oversight: { agency: string; status: string }[];
  } | null>(null);
  const [monitoring, setMonitoring] = useState(false);

  const [reqForm, setReqForm] = useState({
    reward_type: "corruption_whistleblower",
    incident_id: "",
    bank_name: "",
    bank_account: "",
    bank_bik: "",
    card_number: "",
    amount_requested_rub: "",
    legal_basis: "",
    phone: "",
  });
  const [monForm, setMonForm] = useState({
    agency_id: "mvd",
    agency_name: "МВД России",
    incident_type: "default",
    inaction_days: "35",
  });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 4000); };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${GATEWAY}/rewards`).then(r => r.json()).then(parse),
      fetch(`${GATEWAY}/countries`).then(r => r.json()).then(parse),
    ]).then(([r, c]) => {
      setRewards((r as { reward_types: RewardType[] }).reward_types || []);
      setCountries((c as { countries: Country[] }).countries || []);
    }).finally(() => setLoading(false));
  }, []);

  const submitRequest = async () => {
    if (!reqForm.bank_account && !reqForm.card_number) {
      showToast("✗ Укажите счёт или карту для получения выплаты");
      return;
    }
    try {
      const r = await fetch(`${GATEWAY}/reward-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reward_type: reqForm.reward_type,
          incident_id: reqForm.incident_id ? parseInt(reqForm.incident_id) : null,
          bank_name: reqForm.bank_name,
          bank_account: reqForm.bank_account,
          bank_bik: reqForm.bank_bik,
          card_number: reqForm.card_number,
          amount_requested_rub: parseFloat(reqForm.amount_requested_rub) || null,
          legal_basis: reqForm.legal_basis,
        }),
      });
      const d = parse(await r.json()) as { request_id?: number; message?: string; error?: string };
      if (d.request_id) {
        showToast(`✓ Заявка #${d.request_id} создана. ${d.message}`);
        if (reqForm.phone) {
          await fetch(`${SMS_API}/reward-sms`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: reqForm.phone, reward_type: reqForm.reward_type, amount: reqForm.amount_requested_rub }),
          });
        }
      } else {
        showToast(`✗ ${d.error || "Ошибка"}`);
      }
    } catch {
      showToast("✗ Ошибка отправки");
    }
  };

  const runMonitor = async () => {
    setMonitoring(true);
    try {
      const r = await fetch(`${SMS_API}/check-inaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agency_id: monForm.agency_id,
          agency_name: monForm.agency_name,
          incident_type: monForm.incident_type,
        }),
      });
      const d = parse(await r.json());
      setMonitorResult(d as typeof monitorResult);
    } catch {
      showToast("✗ Ошибка мониторинга");
    }
    setMonitoring(false);
  };

  const G = (s: string) => `linear-gradient(135deg, ${s})`;

  return (
    <div style={{ minHeight: "100vh", background: "#060a12", color: "#e0e8ff", fontFamily: "monospace" }}>
      {toast && (
        <div style={{ position: "fixed", top: 80, right: 20, zIndex: 100, background: toast.startsWith("✓") ? "rgba(34,197,94,0.95)" : "rgba(244,63,94,0.95)", color: "#fff", padding: "12px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13, maxWidth: 380 }}>
          {toast}
        </div>
      )}

      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(6,10,18,0.98)", borderBottom: "1px solid rgba(0,255,135,0.2)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate("/egsu/dashboard")} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer" }}>
          <Icon name="ChevronLeft" size={18} />
        </button>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: G("#00ff87, #3b82f6"), display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="Coins" size={16} style={{ color: "#000" }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: 2, color: "#fff" }}>ВОЗНАГРАЖДЕНИЯ И МОНИТОРИНГ</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>ЕЦСУ 2.0 · Содействие · Законодательная база РФ</div>
        </div>
      </nav>

      <div style={{ paddingTop: 64, maxWidth: 900, margin: "0 auto", padding: "72px 16px 40px" }}>

        {/* Табы */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { id: "rewards", label: "💰 Вознаграждения", color: "#00ff87" },
            { id: "request", label: "📋 Подать заявку", color: "#3b82f6" },
            { id: "countries", label: "🌍 Страны-участницы", color: "#a855f7" },
            { id: "monitor", label: "⚡ Мониторинг бездействия", color: "#f43f5e" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              style={{ background: tab === t.id ? `${t.color}20` : "rgba(255,255,255,0.03)", border: `1px solid ${tab === t.id ? t.color + "60" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "8px 16px", color: tab === t.id ? t.color : "rgba(255,255,255,0.4)", cursor: "pointer", fontWeight: tab === t.id ? 700 : 400, fontSize: 13 }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading && <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>Загружаю...</div>}

        {/* ВОЗНАГРАЖДЕНИЯ */}
        {!loading && tab === "rewards" && (
          <div>
            <div style={{ background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.2)", borderRadius: 12, padding: 16, marginBottom: 24, fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.6)" }}>
              <div style={{ fontWeight: 700, color: "#00ff87", marginBottom: 8 }}>Правовая основа получения вознаграждений</div>
              Согласно законодательству РФ, граждане имеют право на вознаграждение за содействие в выявлении коррупции, экологических нарушений, киберугроз.
              Выплаты производятся соответствующими государственными органами после подтверждения фактов.
              Заявки подаются через ЕЦСУ 2.0 от имени <strong style={{ color: "#e0e8ff" }}>{OWNER.name}</strong>.
            </div>
            <div style={{ display: "grid", gap: 16 }}>
              {rewards.map(r => (
                <div key={r.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,255,135,0.15)", borderRadius: 14, padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", flex: 1 }}>{r.name_ru}</div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                      {r.min_amount_rub > 0 && <div style={{ fontSize: 13, color: "#00ff87", fontWeight: 700 }}>от {fmt(r.min_amount_rub)}</div>}
                      {r.max_amount_rub && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>до {fmt(r.max_amount_rub)}</div>}
                      {r.percentage_of_damage && <div style={{ fontSize: 12, color: "#f59e0b" }}>{r.percentage_of_damage}% от ущерба</div>}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>{r.description}</div>
                  <div style={{ fontSize: 11, color: "#a855f7", marginBottom: 6 }}>Основание: {r.legal_basis}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Условия: {r.conditions}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Выплачивает: <span style={{ color: "#60a5fa" }}>{r.payer}</span></div>
                    <button onClick={() => { setTab("request"); setReqForm(f => ({ ...f, reward_type: r.code, legal_basis: r.legal_basis })); }}
                      style={{ background: "rgba(0,255,135,0.15)", border: "1px solid rgba(0,255,135,0.3)", borderRadius: 8, padding: "6px 14px", color: "#00ff87", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      Подать заявку →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ЗАЯВКА */}
        {tab === "request" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Заявка на вознаграждение</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 20 }}>Заявитель: {OWNER.name} · {OWNER.system}</p>

            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Тип вознаграждения</label>
                <select value={reqForm.reward_type} onChange={e => setReqForm(f => ({ ...f, reward_type: e.target.value }))}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none" }}>
                  {rewards.map(r => (
                    <option key={r.code} value={r.code} style={{ background: "#0d1b2e" }}>{r.name_ru}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Сумма (руб.)</label>
                  <input value={reqForm.amount_requested_rub} onChange={e => setReqForm(f => ({ ...f, amount_requested_rub: e.target.value }))}
                    type="number" placeholder="0"
                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>ID инцидента (опц.)</label>
                  <input value={reqForm.incident_id} onChange={e => setReqForm(f => ({ ...f, incident_id: e.target.value }))}
                    placeholder="Номер инцидента..."
                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none" }} />
                </div>
              </div>

              <div style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, color: "#60a5fa", fontWeight: 700, marginBottom: 10 }}>Банковские реквизиты для получения выплаты</div>
                <div style={{ display: "grid", gap: 10 }}>
                  <input value={reqForm.bank_name} onChange={e => setReqForm(f => ({ ...f, bank_name: e.target.value }))}
                    placeholder="Название банка (напр. Сбербанк)"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none" }} />
                  <input value={reqForm.bank_account} onChange={e => setReqForm(f => ({ ...f, bank_account: e.target.value }))}
                    placeholder="Номер счёта (20 цифр)"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none" }} />
                  <input value={reqForm.bank_bik} onChange={e => setReqForm(f => ({ ...f, bank_bik: e.target.value }))}
                    placeholder="БИК банка (9 цифр)"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none" }} />
                  <input value={reqForm.card_number} onChange={e => setReqForm(f => ({ ...f, card_number: e.target.value }))}
                    placeholder="Или номер карты (16 цифр)"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none" }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Телефон для SMS-уведомления (опц.)</label>
                <input value={reqForm.phone} onChange={e => setReqForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+79001234567"
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none" }} />
              </div>

              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Правовое основание</label>
                <input value={reqForm.legal_basis} onChange={e => setReqForm(f => ({ ...f, legal_basis: e.target.value }))}
                  placeholder="ФЗ №273 / ФЗ №59 / иное..."
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none" }} />
              </div>

              <div style={{ padding: 12, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
                Заявка будет направлена в соответствующий государственный орган от имени {OWNER.name}, {OWNER.system}. Реквизиты хранятся в зашифрованном виде и используются только для перевода вознаграждения.
              </div>

              <button onClick={submitRequest}
                style={{ width: "100%", padding: 14, background: G("#00ff87, #3b82f6"), border: "none", borderRadius: 10, color: "#000", fontWeight: 900, fontSize: 15, cursor: "pointer", letterSpacing: 1 }}>
                Подать заявку на вознаграждение
              </button>
            </div>
          </div>
        )}

        {/* СТРАНЫ */}
        {!loading && tab === "countries" && (
          <div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>
              Обращения от ЕЦСУ 2.0 могут быть направлены в ведомства следующих стран и международных организаций:
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {countries.map(c => (
                <div key={c.code} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(168,85,247,0.15)", borderRadius: 12, padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", flex: 1 }}>{c.name_ru}</div>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }}>{c.region}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Орган: {c.contact_ministry}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {c.contact_email && (
                      <a href={`mailto:${c.contact_email}?subject=Обращение ЕЦСУ 2.0&body=От: Николаев В.В., ЕЦСУ 2.0%0A%0A`}
                        style={{ fontSize: 12, color: "#60a5fa", textDecoration: "none", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 6, padding: "4px 10px" }}>
                        ✉ {c.contact_email}
                      </a>
                    )}
                    {c.contact_phone && (
                      <a href={`tel:${c.contact_phone}`}
                        style={{ fontSize: 12, color: "#22c55e", textDecoration: "none", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 6, padding: "4px 10px" }}>
                        📞 {c.contact_phone}
                      </a>
                    )}
                    {c.appeal_url && (
                      <a href={c.appeal_url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12, color: "#a855f7", textDecoration: "none", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 6, padding: "4px 10px" }}>
                        🌐 Приёмная
                      </a>
                    )}
                  </div>
                  {c.legal_basis && (
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 8 }}>Основание: {c.legal_basis}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* МОНИТОРИНГ БЕЗДЕЙСТВИЯ */}
        {tab === "monitor" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 6 }}>ИИ-мониторинг бездействия</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 20 }}>ИИ анализирует бездействие ведомств, определяет признаки коррупции и направляет отчёт в надзорные органы</p>

            <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 6, textTransform: "uppercase" }}>Ведомство</label>
                  <select value={monForm.agency_id} onChange={e => {
                    const labels: Record<string,string> = {mvd:"МВД России",prosecutor:"Генеральная прокуратура",mchs:"МЧС России",fsb:"ФСБ России",rosprirodnadzor:"Росприроднадзор"};
                    setMonForm(f => ({ ...f, agency_id: e.target.value, agency_name: labels[e.target.value] || e.target.value }));
                  }}
                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none" }}>
                    <option value="mvd" style={{ background: "#0d1b2e" }}>МВД России</option>
                    <option value="prosecutor" style={{ background: "#0d1b2e" }}>Генеральная прокуратура</option>
                    <option value="mchs" style={{ background: "#0d1b2e" }}>МЧС России</option>
                    <option value="fsb" style={{ background: "#0d1b2e" }}>ФСБ России</option>
                    <option value="rosprirodnadzor" style={{ background: "#0d1b2e" }}>Росприроднадзор</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 6, textTransform: "uppercase" }}>Тип инцидента</label>
                  <select value={monForm.incident_type} onChange={e => setMonForm(f => ({ ...f, incident_type: e.target.value }))}
                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none" }}>
                    <option value="default" style={{ background: "#0d1b2e" }}>Общее нарушение</option>
                    <option value="cyber" style={{ background: "#0d1b2e" }}>Кибератака</option>
                    <option value="ecology" style={{ background: "#0d1b2e" }}>Экология</option>
                    <option value="human_rights" style={{ background: "#0d1b2e" }}>Права человека</option>
                    <option value="corruption" style={{ background: "#0d1b2e" }}>Коррупция</option>
                    <option value="emergency" style={{ background: "#0d1b2e" }}>ЧС</option>
                  </select>
                </div>
              </div>

              <button onClick={runMonitor} disabled={monitoring}
                style={{ padding: 14, background: monitoring ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #f43f5e, #f59e0b)", border: "none", borderRadius: 10, color: monitoring ? "rgba(255,255,255,0.4)" : "#fff", fontWeight: 700, fontSize: 14, cursor: monitoring ? "wait" : "pointer" }}>
                {monitoring ? "ИИ анализирует..." : "⚡ Запустить ИИ-анализ бездействия"}
              </button>
            </div>

            {monitorResult && (
              <div style={{ display: "grid", gap: 14 }}>
                {/* Статус */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div style={{ padding: 14, background: monitorResult.inaction_detected ? "rgba(244,63,94,0.1)" : "rgba(34,197,94,0.1)", border: `1px solid ${monitorResult.inaction_detected ? "rgba(244,63,94,0.3)" : "rgba(34,197,94,0.3)"}`, borderRadius: 10, textAlign: "center" }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{monitorResult.inaction_detected ? "⚠️" : "✅"}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: monitorResult.inaction_detected ? "#f43f5e" : "#22c55e" }}>{monitorResult.inaction_detected ? "БЕЗДЕЙСТВИЕ" : "В НОРМЕ"}</div>
                  </div>
                  <div style={{ padding: 14, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#f59e0b" }}>{monitorResult.inaction_days}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>дней без ответа</div>
                  </div>
                  <div style={{ padding: 14, background: monitorResult.corruption_suspected ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${monitorResult.corruption_suspected ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, textAlign: "center" }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{monitorResult.corruption_suspected ? "🚨" : "—"}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: monitorResult.corruption_suspected ? "#a855f7" : "rgba(255,255,255,0.3)" }}>{monitorResult.corruption_suspected ? "КОРРУПЦИЯ?" : "Нет признаков"}</div>
                  </div>
                </div>

                {/* Штраф */}
                {monitorResult.penalty_recommended_rub > 0 && (
                  <div style={{ padding: 14, background: "rgba(0,255,135,0.08)", border: "1px solid rgba(0,255,135,0.3)", borderRadius: 10 }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Рекомендуемый штраф</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#00ff87" }}>{new Intl.NumberFormat("ru-RU").format(monitorResult.penalty_recommended_rub)} ₽</div>
                  </div>
                )}

                {/* SMS в надзоры */}
                {monitorResult.sms_to_oversight.length > 0 && (
                  <div style={{ padding: 14, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa", marginBottom: 8 }}>SMS направлены в надзорные органы:</div>
                    {monitorResult.sms_to_oversight.map((s, i) => (
                      <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>
                        • {s.agency} — <span style={{ color: s.status === "sent" ? "#22c55e" : "#f59e0b" }}>{s.status}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Отчёт */}
                <div style={{ padding: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Отчёт для надзорных органов</div>
                  <pre style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", whiteSpace: "pre-wrap", lineHeight: 1.7, fontFamily: "monospace" }}>
                    {monitorResult.escalation_report}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
