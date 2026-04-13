import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/15640332-461b-47d1-b024-8fa25fb344ef";
const G = (s: string) => `linear-gradient(135deg, ${s})`;

type SecurityEvent = {
  id: number; event_type: string; severity: string; ip_address: string;
  user_agent: string; endpoint: string; description: string;
  penalty_amount: number; is_blocked: boolean; geo_country: string; created_at: string;
};
type BlockedIP = { id: number; ip_address: string; reason: string; blocked_at: string; is_permanent: boolean };
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
  const [tab, setTab] = useState<"overview" | "events" | "blocked" | "manual">("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [blocked, setBlocked] = useState<BlockedIP[]>([]);
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const [manualForm, setManualForm] = useState({ event_type: "unauthorized_access", ip_address: "", description: "", amount: "" });
  const [reportForm, setReportForm] = useState({ event_type: "cyber_attack", ip_address: "", description: "", endpoint: "", geo_country: "" });
  const [showReport, setShowReport] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const load = async () => {
    const [s, e, b] = await Promise.all([
      fetch(API).then(r => r.json()).then(parse),
      fetch(`${API}/events`).then(r => r.json()).then(parse),
      fetch(`${API}/blocked`).then(r => r.json()).then(parse),
    ]);
    setStats(s as Stats);
    setEvents(Array.isArray(e) ? e : []);
    setBlocked(Array.isArray(b) ? b : []);
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
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

  return (
    <div className="min-h-screen font-body" style={{ background: "#060a12" }}>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-6 z-[100] px-4 py-3 rounded-xl text-sm font-semibold shadow-xl max-w-sm"
          style={{ background: "rgba(0,255,135,0.92)", color: "black" }}>{toast}</div>
      )}

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-3"
        style={{ background: "rgba(6,10,18,0.98)", borderBottom: "1px solid rgba(244,63,94,0.2)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/egsu/dashboard")} className="text-white/40 hover:text-white/70 transition-colors">
            <Icon name="ChevronLeft" size={16} />
          </button>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: G("#f43f5e, #f59e0b") }}>
            <Icon name="ShieldAlert" size={14} className="text-white" />
          </div>
          <div>
            <div className="font-display text-base font-bold text-white tracking-wide leading-none">РЕЖИМ ПОГЛОЩЕНИЯ</div>
            <div className="text-white/30 text-[10px]">ABSORPTION MODE · Защита системы</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {stats && (
            <div className="flex items-center gap-3">
              <div className="text-center hidden md:block">
                <div className={`font-bold text-sm transition-all ${pulse ? "scale-110" : ""}`} style={{ color: "#f59e0b" }}>
                  {fmt(stats.absorption_balance_usd)}
                </div>
                <div className="text-white/25 text-[9px]">Счёт поглощения</div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.3)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-red-400 text-xs font-bold tracking-widest">ACTIVE</span>
              </div>
            </div>
          )}
          <button onClick={() => setShowReport(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
            style={{ background: G("#f43f5e, #f59e0b"), color: "white" }}>
            <Icon name="AlertTriangle" size={13} />
            <span className="hidden md:inline">Зафиксировать атаку</span>
          </button>
        </div>
      </nav>

      <div className="pt-14 flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="fixed left-0 top-14 bottom-0 w-14 md:w-56 flex flex-col py-4 gap-1 px-2"
          style={{ background: "rgba(6,10,18,0.95)", borderRight: "1px solid rgba(244,63,94,0.1)" }}>
          {[
            { id: "overview", icon: "ShieldAlert", label: "Обзор" },
            { id: "events", icon: "Activity", label: `Журнал атак (${events.length})` },
            { id: "blocked", icon: "Ban", label: `Блок-лист (${blocked.length})` },
            { id: "manual", icon: "PlusCircle", label: "Ручное начисление" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left"
              style={{
                background: tab === t.id ? "rgba(244,63,94,0.12)" : "transparent",
                color: tab === t.id ? "#f43f5e" : "rgba(255,255,255,0.4)",
                border: tab === t.id ? "1px solid rgba(244,63,94,0.25)" : "1px solid transparent",
              }}>
              <Icon name={t.icon as "ShieldAlert"} size={16} />
              <span className="hidden md:block text-xs">{t.label}</span>
            </button>
          ))}

          {/* Уровень защиты */}
          <div className="hidden md:block mt-auto px-3 pb-4">
            <div className="p-3 rounded-xl" style={{ background: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.15)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Shield" size={14} className="text-red-400" />
                <span className="text-white/50 text-[10px] uppercase tracking-widest">Уровень защиты</span>
              </div>
              <div className="font-bold text-red-400 text-sm">МАКСИМАЛЬНЫЙ</div>
              <div className="text-white/30 text-[10px] mt-1">Обновление каждые 15с</div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 ml-14 md:ml-56 p-4 md:p-6">

          {loading && <div className="text-center py-20 text-white/30">Загружаю...</div>}

          {/* OVERVIEW */}
          {!loading && tab === "overview" && stats && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-white uppercase">Режим Поглощения</h1>
                <p className="text-white/30 text-sm mt-1">Все атаки монетизируются — средства зачисляются на счёт системы</p>
              </div>

              {/* Счёт поглощения — главный блок */}
              <div className="p-6 rounded-2xl relative overflow-hidden"
                style={{ background: "rgba(244,63,94,0.06)", border: "2px solid rgba(244,63,94,0.25)" }}>
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-5"
                  style={{ background: G("#f43f5e, #f59e0b"), transform: "translate(30%, -30%)" }} />
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name="Vault" size={16} className="text-red-400" />
                      <span className="text-white/40 text-xs uppercase tracking-widest">Счёт поглощения · EGSU-ABS-9999</span>
                    </div>
                    <div className="font-display text-4xl font-bold mt-2" style={{ color: "#f59e0b" }}>
                      {fmt(stats.absorption_balance_usd)}
                    </div>
                    <div className="text-white/40 text-sm mt-1">Накоплено штрафных начислений</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/30 text-xs mb-1">Всего штрафов</div>
                    <div className="font-bold text-xl" style={{ color: "#f43f5e" }}>{fmt(stats.total_penalties_usd)}</div>
                    <div className="mt-2 px-3 py-1 rounded-full text-xs font-bold"
                      style={{ background: "rgba(244,63,94,0.15)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.3)" }}>
                      ABSORPTION MODE ON
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4 relative z-10">
                  <div>
                    <div className="text-white/30 text-xs mb-0.5">Начальный баланс</div>
                    <div className="font-bold text-white/60">$0.00</div>
                  </div>
                  <div>
                    <div className="text-white/30 text-xs mb-0.5">Все начисления — штрафы за атаки</div>
                    <div className="font-bold" style={{ color: "#00ff87" }}>+{fmt(stats.absorption_balance_usd)}</div>
                  </div>
                </div>
              </div>

              {/* KPI */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Всего угроз", val: stats.total_events, icon: "Activity", color: "#f43f5e" },
                  { label: "Заблокировано", val: stats.blocked_threats, icon: "ShieldOff", color: "#f59e0b" },
                  { label: "Критических", val: stats.critical_events, icon: "Zap", color: "#f43f5e" },
                  { label: "IP в блоклисте", val: stats.blocked_ips_count, icon: "Ban", color: "#a855f7" },
                ].map(k => (
                  <div key={k.label} className="p-4 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${k.color}20` }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${k.color}15` }}>
                      <Icon name={k.icon as "Activity"} size={16} style={{ color: k.color }} />
                    </div>
                    <div className="font-display text-3xl font-bold" style={{ color: k.color }}>{k.val}</div>
                    <div className="text-white/35 text-xs mt-0.5">{k.label}</div>
                  </div>
                ))}
              </div>

              {/* Тарифы штрафов */}
              <div className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h2 className="font-display text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Тарифная сетка штрафов</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(PENALTY_RATES).map(([type, rate]) => (
                    <div key={type} className="flex items-center justify-between px-3 py-2 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.03)" }}>
                      <div className="flex items-center gap-2">
                        <Icon name="AlertTriangle" size={13} className="text-red-400/60" />
                        <span className="text-white/60 text-xs">{EVENT_LABELS[type] ?? type}</span>
                      </div>
                      <span className="font-bold text-xs" style={{ color: "#f59e0b" }}>{fmt(rate)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-white/25 text-xs mt-3">* За повторные атаки с одного IP применяется коэффициент +50%. За 3+ атак — x2.</p>
              </div>

              {/* Топ типов атак */}
              {stats.top_attack_types.length > 0 && (
                <div className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h2 className="font-display text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Топ угроз</h2>
                  <div className="space-y-2">
                    {stats.top_attack_types.map((t, i) => {
                      const colors = ["#f43f5e","#f59e0b","#a855f7","#3b82f6","#00ff87"];
                      const c = colors[i];
                      const max = stats.top_attack_types[0].count;
                      return (
                        <div key={t.event_type}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-white/60">{EVENT_LABELS[t.event_type] ?? t.event_type}</span>
                            <span style={{ color: c }}>{t.count} атак</span>
                          </div>
                          <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${(t.count / max) * 100}%`, background: c }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Защита системы */}
              <div className="p-5 rounded-2xl" style={{ background: "rgba(0,255,135,0.04)", border: "1px solid rgba(0,255,135,0.15)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="Shield" size={18} className="text-green-400" />
                  <h2 className="font-display text-sm font-bold text-green-400 uppercase tracking-widest">Активная защита системы</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { icon: "Lock", label: "Защита данных", desc: "Правозащитное копирование заблокировано на уровне браузера" },
                    { icon: "EyeOff", label: "Антискрейпинг", desc: "Массовый парсинг данных фиксируется и монетизируется" },
                    { icon: "Ban", label: "Автоблокировка IP", desc: "Атакующий IP мгновенно вносится в блок-лист" },
                    { icon: "Vault", label: "Режим поглощения", desc: "Каждая атака = штраф на счёт EGSU-ABS-9999" },
                    { icon: "Database", label: "Шифрование БД", desc: "Данные хранятся в зашифрованной PostgreSQL-среде" },
                    { icon: "Network", label: "CORS-политика", desc: "Все API-запросы проходят проверку источника" },
                  ].map(item => (
                    <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ background: "rgba(0,255,135,0.05)" }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "rgba(0,255,135,0.15)" }}>
                        <Icon name={item.icon as "Lock"} size={14} className="text-green-400" />
                      </div>
                      <div>
                        <div className="text-white/80 text-sm font-semibold">{item.label}</div>
                        <div className="text-white/35 text-xs mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
        </main>
      </div>

      {/* Модал — зафиксировать атаку */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setShowReport(false)}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: "#0d1220", border: "1px solid rgba(244,63,94,0.3)" }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ background: "rgba(244,63,94,0.07)", borderBottom: "1px solid rgba(244,63,94,0.15)" }}>
              <div className="flex items-center gap-2">
                <Icon name="AlertTriangle" size={18} className="text-red-400" />
                <span className="text-white font-bold">Зафиксировать атаку</span>
              </div>
              <button onClick={() => setShowReport(false)} className="text-white/30 hover:text-white/70">
                <Icon name="X" size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Тип атаки</label>
                <select value={reportForm.event_type} onChange={e => setReportForm(f => ({ ...f, event_type: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {Object.entries(EVENT_LABELS).map(([k, v]) => (
                    <option key={k} value={k} style={{ background: "#0d1220" }}>{v} — {fmt(PENALTY_RATES[k] ?? 0)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">IP-адрес атакующего *</label>
                <input value={reportForm.ip_address} onChange={e => setReportForm(f => ({ ...f, ip_address: e.target.value }))}
                  placeholder="185.220.101.47"
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none font-mono"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Описание *</label>
                <textarea value={reportForm.description} onChange={e => setReportForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Что произошло..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Endpoint</label>
                  <input value={reportForm.endpoint} onChange={e => setReportForm(f => ({ ...f, endpoint: e.target.value }))}
                    placeholder="/egsu/dashboard"
                    className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Страна</label>
                  <input value={reportForm.geo_country} onChange={e => setReportForm(f => ({ ...f, geo_country: e.target.value }))}
                    placeholder="Россия / Unknown"
                    className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
              </div>
              <div className="p-3 rounded-xl flex items-center justify-between"
                style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <span className="text-white/50 text-sm">Штраф будет начислен:</span>
                <span className="font-bold" style={{ color: "#f59e0b" }}>{fmt(PENALTY_RATES[reportForm.event_type] ?? 0)}</span>
              </div>
              <button onClick={reportAttack} disabled={saving || !reportForm.ip_address || !reportForm.description}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-40"
                style={{ background: G("#f43f5e, #f59e0b"), color: "white" }}>
                {saving ? "Фиксирую..." : "Зафиксировать и начислить штраф"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
