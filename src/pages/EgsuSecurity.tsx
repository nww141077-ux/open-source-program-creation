import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import SecurityLayout from "./egsu-security/SecurityLayout";
import SecurityOverview from "./egsu-security/SecurityOverview";
import SecurityWithdraw from "./egsu-security/SecurityWithdraw";

const API = "https://functions.poehali.dev/15640332-461b-47d1-b024-8fa25fb344ef";
const FINANCE_API = "https://functions.poehali.dev/e610af8a-f8c5-4c04-8d9b-092391fb0c70";
const ABSORPTION_ACC_ID = 5;
const G = (s: string) => `linear-gradient(135deg, ${s})`;

type SecurityEvent = {
  id: number; event_type: string; severity: string; ip_address: string;
  user_agent: string; endpoint: string; description: string;
  penalty_amount: number; is_blocked: boolean; geo_country: string; created_at: string;
};
type BlockedIP = { id: number; ip_address: string; reason: string; blocked_at: string; is_permanent: boolean };
type Account = { id: number; owner_name: string; account_number: string; label: string; bank_name: string; currency: string; balance: number; account_type: string };
type Withdrawal = { id: number; amount: number; currency: string; description: string; status: string; from_label: string; from_balance: number; to_label: string; to_number: string; to_account_details: Record<string,string>; confirmed_at: string; executed_at: string; created_at: string };
type Stats = {
  mode: string; absorption_balance_usd: number; total_events: number;
  blocked_threats: number; critical_events: number; total_penalties_usd: number;
  blocked_ips_count: number; top_attack_types: { event_type: string; count: number }[];
  protection_level: string;
};

const SEV_COLORS: Record<string, string> = { critical: "#f43f5e", high: "#f59e0b", medium: "#3b82f6", low: "#a855f7" };
const SEV_LABELS: Record<string, string> = { critical: "КРИТИЧЕСКАЯ", high: "ВЫСОКАЯ", medium: "СРЕДНЯЯ", low: "НИЗКАЯ" };

const EVENT_LABELS: Record<string, string> = {
  unauthorized_access: "Несанкционированный вход",
  cyber_attack: "Кибератака",
  brute_force: "Брутфорс",
  data_scraping: "Копирование данных",
  ddos: "DDoS-атака",
  sql_injection: "SQL-инъекция",
  xss_attempt: "XSS-атака",
  port_scan: "Сканирование портов",
  api_abuse: "Злоупотребление API",
  unauthorized_copy: "Несанкционированное копирование",
};

const PENALTY_RATES: Record<string, number> = {
  unauthorized_access: 500, cyber_attack: 2500, brute_force: 750,
  data_scraping: 250, ddos: 5000, sql_injection: 1000,
  xss_attempt: 300, port_scan: 100, api_abuse: 200, unauthorized_copy: 1500,
};

function parse(d: unknown) {
  if (typeof d === "string") { try { return JSON.parse(d); } catch { return d; } }
  return d;
}

function fmt(n: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function EgsuSecurity() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"overview" | "events" | "blocked" | "withdraw" | "manual">("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [blocked, setBlocked] = useState<BlockedIP[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const [manualForm, setManualForm] = useState({ event_type: "unauthorized_access", ip_address: "", description: "", amount: "" });
  const [reportForm, setReportForm] = useState({ event_type: "cyber_attack", ip_address: "", description: "", endpoint: "", geo_country: "" });
  const [showReport, setShowReport] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [wMode, setWMode] = useState<"internal" | "external">("internal");
  const [wForm, setWForm] = useState({
    to_account_id: "",
    amount: "",
    description: "Вывод штрафных средств — Режим Поглощения",
    ext_owner: "", ext_bank: "", ext_account: "", ext_currency: "USD",
  });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 4000); };

  const sf = (url: string) => fetch(url).then(r => r.json()).then(parse).catch(() => null);

  const load = async () => {
    try {
      const [s, e, b, w, a] = await Promise.all([
        sf(API), sf(`${API}/events`), sf(`${API}/blocked`),
        sf(`${FINANCE_API}/withdrawals`), sf(`${FINANCE_API}/accounts`),
      ]);
      if (s) setStats(s as Stats);
      setEvents(Array.isArray(e) ? e : []);
      setBlocked(Array.isArray(b) ? b : []);
      setWithdrawals(Array.isArray(w) ? w : []);
      setAccounts(Array.isArray(a) ? a.filter((acc: Account) => acc.id !== ABSORPTION_ACC_ID) : []);
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    } catch { /* тихая ошибка */ }
  };

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
    intervalRef.current = setInterval(load, 15000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const reportAttack = async () => {
    if (!reportForm.ip_address || !reportForm.description) return;
    setSaving(true);
    const r = await fetch(`${API}/report`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(reportForm) });
    const d = parse(await r.json()) as { penalty_charged_usd: number; message: string };
    setSaving(false);
    setShowReport(false);
    setReportForm({ event_type: "cyber_attack", ip_address: "", description: "", endpoint: "", geo_country: "" });
    showToast(`✓ ${d.message}`);
    load();
  };

  const manualCharge = async () => {
    if (!manualForm.description || !manualForm.amount) return;
    setSaving(true);
    const r = await fetch(`${API}/manual`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...manualForm, amount: parseFloat(manualForm.amount) }) });
    const d = parse(await r.json()) as { message: string };
    setSaving(false);
    setManualForm({ event_type: "unauthorized_access", ip_address: "", description: "", amount: "" });
    showToast(`✓ ${d.message}`);
    load();
  };

  const createWithdrawal = async () => {
    if (!wForm.amount || parseFloat(wForm.amount) <= 0) return;
    if (wMode === "internal" && !wForm.to_account_id) return;
    if (wMode === "external" && (!wForm.ext_owner || !wForm.ext_account)) return;
    setSaving(true);
    const payload: Record<string, unknown> = {
      from_account_id: ABSORPTION_ACC_ID,
      amount: parseFloat(wForm.amount),
      currency: "USD",
      description: wForm.description,
    };
    if (wMode === "internal") {
      payload.to_account_id = parseInt(wForm.to_account_id);
    } else {
      payload.to_account_details = {
        owner: wForm.ext_owner,
        bank: wForm.ext_bank,
        account: wForm.ext_account,
        currency: wForm.ext_currency,
        type: "external",
      };
    }
    const r = await fetch(`${FINANCE_API}/withdrawals`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = parse(await r.json()) as { id?: number; message: string; error?: string };
    setSaving(false);
    if (d.id) {
      showToast(`✓ Заявка #${d.id} создана. Нажмите «Подтвердить» для исполнения.`);
      setWForm({ to_account_id: "", amount: "", description: "Вывод штрафных средств — Режим Поглощения", ext_owner: "", ext_bank: "", ext_account: "", ext_currency: "USD" });
      load();
    } else {
      showToast(`✗ ${d.error || d.message}`);
    }
  };

  const autoWithdraw = async (toAccountId?: number, toDetails?: Record<string, string>) => {
    setSaving(true);
    const payload: Record<string, unknown> = {
      from_account_id: ABSORPTION_ACC_ID,
      description: "Авто-вывод штрафных начислений — Режим Поглощения",
    };
    if (toAccountId) payload.to_account_id = toAccountId;
    if (toDetails) payload.to_account_details = toDetails;
    const r = await fetch(`${FINANCE_API}/auto-withdraw`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = parse(await r.json()) as { status: string; amount_usd?: number; message: string; error?: string };
    setSaving(false);
    if (d.error) { showToast(`✗ ${d.error}`); return; }
    showToast(`✓ ${d.message}`);
    load();
  };

  const confirmWithdrawal = async (id: number) => {
    const r = await fetch(`${FINANCE_API}/withdrawals/${id}/confirm`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const d = parse(await r.json()) as { message: string; error?: string };
    if (d.error) { showToast(`✗ ${d.error}`); return; }
    showToast(`✓ ${d.message}`);
    load();
  };

  const executeWithdrawal = async (id: number) => {
    const r = await fetch(`${FINANCE_API}/withdrawals/${id}/execute`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const d = parse(await r.json()) as { message: string; error?: string; amount?: number };
    if (d.error) { showToast(`✗ ${d.error}`); return; }
    showToast(`✓ ${d.message}`);
    load();
  };

  void navigate;

  return (
    <SecurityLayout
      tab={tab} setTab={setTab}
      pulse={pulse}
      absorptionBalance={stats ? stats.absorption_balance_usd : null}
      eventsCount={events.length}
      blockedCount={blocked.length}
      showReport={showReport} setShowReport={setShowReport}
      saving={saving}
      reportForm={reportForm} setReportForm={setReportForm}
      onReportAttack={reportAttack}
      toast={toast}
      penaltyRates={PENALTY_RATES}
      eventLabels={EVENT_LABELS}
      fmt={fmt}
    >
      {loading && <div className="text-center py-20 text-white/30">Загружаю...</div>}

      {/* OVERVIEW */}
      {!loading && tab === "overview" && stats && (
        <SecurityOverview
          stats={stats}
          fmt={fmt}
          eventLabels={EVENT_LABELS}
          penaltyRates={PENALTY_RATES}
        />
      )}

      {/* EVENTS */}
      {!loading && tab === "events" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-white uppercase">Журнал атак</h1>
              <p className="text-white/30 text-sm mt-1">{events.length} зафиксированных угроз</p>
            </div>
            <button onClick={() => setShowReport(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
              style={{ background: G("#f43f5e, #f59e0b"), color: "white" }}>
              <Icon name="Plus" size={15} />Зафиксировать
            </button>
          </div>
          <div className="space-y-2">
            {events.map(e => (
              <div key={e.id} className="p-4 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${SEV_COLORS[e.severity] ?? "#fff"}18` }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${SEV_COLORS[e.severity] ?? "#fff"}15` }}>
                    <Icon name="AlertTriangle" size={16} style={{ color: SEV_COLORS[e.severity] ?? "#fff" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-sm">{EVENT_LABELS[e.event_type] ?? e.event_type}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                        style={{ background: `${SEV_COLORS[e.severity]}20`, color: SEV_COLORS[e.severity] }}>
                        {SEV_LABELS[e.severity]}
                      </span>
                      {e.is_blocked && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                          style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7" }}>ЗАБЛОКИРОВАН</span>
                      )}
                    </div>
                    <div className="text-white/45 text-xs mt-1">{e.description}</div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="font-mono text-[10px] text-white/30">{e.ip_address}</span>
                      {e.geo_country && <span className="text-white/25 text-[10px]">{e.geo_country}</span>}
                      <span className="text-white/25 text-[10px]">{new Date(e.created_at).toLocaleString("ru-RU")}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold" style={{ color: "#f59e0b" }}>+{fmt(e.penalty_amount)}</div>
                    <div className="text-white/25 text-[10px]">штраф</div>
                  </div>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-center py-20 text-white/25">
                <Icon name="ShieldCheck" size={40} className="mx-auto mb-3 opacity-30" />
                <p>Атак не зафиксировано</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BLOCKED IPs */}
      {!loading && tab === "blocked" && (
        <div>
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-white uppercase">Блок-лист IP</h1>
            <p className="text-white/30 text-sm mt-1">{blocked.length} заблокированных адресов</p>
          </div>
          <div className="space-y-2">
            {blocked.map(b => (
              <div key={b.id} className="flex items-center gap-4 p-4 rounded-2xl"
                style={{ background: "rgba(244,63,94,0.04)", border: "1px solid rgba(244,63,94,0.15)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(244,63,94,0.15)" }}>
                  <Icon name="Ban" size={16} className="text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-white font-bold">{b.ip_address}</div>
                  <div className="text-white/40 text-xs mt-0.5">{b.reason}</div>
                </div>
                <div className="text-right shrink-0">
                  {b.is_permanent
                    ? <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(244,63,94,0.2)", color: "#f43f5e" }}>ПЕРМАНЕНТНО</span>
                    : <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>ВРЕМЕННО</span>
                  }
                  <div className="text-white/25 text-[10px] mt-0.5">{new Date(b.blocked_at).toLocaleDateString("ru-RU")}</div>
                </div>
              </div>
            ))}
            {blocked.length === 0 && <div className="text-center py-16 text-white/25">Блок-лист пуст</div>}
          </div>
        </div>
      )}

      {/* WITHDRAW */}
      {!loading && tab === "withdraw" && (
        <SecurityWithdraw
          stats={stats}
          accounts={accounts}
          withdrawals={withdrawals}
          wMode={wMode}
          setWMode={setWMode}
          wForm={wForm}
          setWForm={setWForm}
          saving={saving}
          onCreateWithdrawal={createWithdrawal}
          onAutoWithdraw={autoWithdraw}
          onConfirm={confirmWithdrawal}
          onExecute={executeWithdrawal}
          fmt={fmt}
        />
      )}

      {/* MANUAL */}
      {!loading && tab === "manual" && (
        <div className="max-w-lg">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-white uppercase">Ручное начисление</h1>
            <p className="text-white/30 text-sm mt-1">Зачислить штраф на счёт EGSU-ABS-9999 вручную</p>
          </div>
          <div className="p-6 rounded-2xl space-y-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div>
              <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Тип нарушения</label>
              <select value={manualForm.event_type} onChange={e => setManualForm(f => ({ ...f, event_type: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {Object.entries(EVENT_LABELS).map(([k, v]) => (
                  <option key={k} value={k} style={{ background: "#0d1220" }}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">IP-адрес</label>
              <input value={manualForm.ip_address} onChange={e => setManualForm(f => ({ ...f, ip_address: e.target.value }))}
                placeholder="192.168.1.1 / manual"
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none font-mono"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
            </div>
            <div>
              <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Описание *</label>
              <textarea value={manualForm.description} onChange={e => setManualForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Описание нарушения"
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none resize-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
            </div>
            <div>
              <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Сумма штрафа (USD) *</label>
              <input value={manualForm.amount} onChange={e => setManualForm(f => ({ ...f, amount: e.target.value }))}
                type="number" min="1" placeholder={`${PENALTY_RATES[manualForm.event_type] ?? 500}`}
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              <div className="text-white/25 text-xs mt-1">Базовый тариф: {fmt(PENALTY_RATES[manualForm.event_type] ?? 500)}</div>
            </div>
            <button onClick={manualCharge} disabled={saving || !manualForm.description || !manualForm.amount}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-40"
              style={{ background: G("#f43f5e, #f59e0b"), color: "white" }}>
              {saving ? "Зачисляю..." : `Зачислить на счёт поглощения`}
            </button>
          </div>
        </div>
      )}
    </SecurityLayout>
  );
}