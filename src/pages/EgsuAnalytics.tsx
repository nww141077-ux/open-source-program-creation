import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/e610af8a-f8c5-4c04-8d9b-092391fb0c70";
const G = (s: string) => `linear-gradient(135deg, ${s})`;

type AnalyticsData = {
  finance: { total_balance_usd: number; total_income_usd: number; total_outcome_usd: number; net_usd: number; absorption_balance: number };
  security: { total_events: number; total_penalties_usd: number; blocked_ips: number };
  charts: {
    daily_finance: { date: string; income: number; outcome: number }[];
    daily_attacks: { date: string; events: number; penalties: number }[];
    accounts_distribution: { label: string; balance: number; currency: string }[];
    top_transactions: { tx_type: string; amount: number; currency: string; description: string; created_at: string; account: string }[];
    attack_types: { type: string; count: number; penalty: number }[];
  };
};
type Snapshot = { id: number; date: string; total_balance: number; total_income: number; total_outcome: number; absorption: number; sec_events: number; penalties: number; accounts: number; created_at: string };

function parse(d: unknown) {
  if (typeof d === "string") { try { return JSON.parse(d); } catch { return d; } }
  return d;
}

function fmt(n: number, cur = "USD") {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);
}

const ATTACK_LABELS: Record<string, string> = {
  unauthorized_access: "Несанкц. вход", cyber_attack: "Кибератака", brute_force: "Брутфорс",
  data_scraping: "Скрейпинг", ddos: "DDoS", sql_injection: "SQL-инъекция",
  xss_attempt: "XSS", port_scan: "Сканирование", api_abuse: "API-злоупотребление", unauthorized_copy: "Копирование",
};

function MiniBar({ data, height = 60, colorKey }: { data: number[]; height?: number; colorKey: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm transition-all"
          style={{ height: `${(v / max) * 100}%`, minHeight: 2, background: colorKey, opacity: 0.7 + (i / data.length) * 0.3 }} />
      ))}
    </div>
  );
}

export default function EgsuAnalytics() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"overview" | "finance" | "security" | "export" | "snapshots">("overview");
  const EMPTY_DATA: AnalyticsData = {
    finance: { total_balance_usd: 0, total_income_usd: 0, total_outcome_usd: 0, net_usd: 0, absorption_balance: 0 },
    security: { total_events: 0, total_penalties_usd: 0, blocked_ips: 0 },
    charts: { daily_finance: [], daily_attacks: [], accounts_distribution: [], top_transactions: [], attack_types: [] },
  };

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [snapping, setSnapping] = useState(false);
  const [toast, setToast] = useState("");
  const [exportData, setExportData] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const sf = (url: string) => fetch(url).then(r => r.json()).then(parse).catch(() => null);

  const load = async () => {
    setLoading(true);
    try {
      const [a, s] = await Promise.all([
        sf(`${API}/analytics`),
        sf(`${API}/analytics/snapshots`),
      ]);
      if (a) setData({ ...EMPTY_DATA, ...(a as AnalyticsData), finance: { ...EMPTY_DATA.finance, ...(a as AnalyticsData).finance }, security: { ...EMPTY_DATA.security, ...(a as AnalyticsData).security }, charts: { ...EMPTY_DATA.charts, ...(a as AnalyticsData).charts } });
      setSnapshots(Array.isArray(s) ? s : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const doExport = async () => {
    setExporting(true);
    const r = await fetch(`${API}/analytics/export`).then(r => r.json()).then(parse);
    const str = JSON.stringify(r, null, 2);
    setExportData(str);
    setExporting(false);
    setTab("export");
    showToast("✓ Данные экспортированы");
  };

  const downloadJson = () => {
    if (!exportData) return;
    const blob = new Blob([exportData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `egsu-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const createSnapshot = async () => {
    setSnapping(true);
    const r = await fetch(`${API}/analytics/snapshot`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const d = parse(await r.json()) as { id: number; message: string };
    setSnapping(false);
    showToast(`✓ Снапшот #${d.id} создан`);
    load();
  };

  return (
    <div className="min-h-screen font-body" style={{ background: "#060a12" }}>
      {toast && (
        <div className="fixed top-20 right-6 z-[100] px-4 py-3 rounded-xl text-sm font-semibold shadow-xl"
          style={{ background: "rgba(0,255,135,0.92)", color: "black" }}>{toast}</div>
      )}

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-3"
        style={{ background: "rgba(6,10,18,0.98)", borderBottom: "1px solid rgba(59,130,246,0.2)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/egsu/dashboard")} className="text-white/40 hover:text-white/70 transition-colors">
            <Icon name="ChevronLeft" size={16} />
          </button>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: G("#3b82f6, #a855f7") }}>
            <Icon name="BarChart3" size={14} className="text-white" />
          </div>
          <div>
            <div className="font-display text-base font-bold text-white tracking-wide leading-none">АНАЛИТИКА И ОТЧЁТЫ</div>
            <div className="text-white/30 text-[10px]">ECSU 2.0 · Business Intelligence</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={createSnapshot} disabled={snapping}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 disabled:opacity-40"
            style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }}>
            <Icon name="Camera" size={13} />
            <span className="hidden md:inline">{snapping ? "..." : "Снапшот"}</span>
          </button>
          <button onClick={doExport} disabled={exporting}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 disabled:opacity-40"
            style={{ background: G("#3b82f6,#a855f7"), color: "white" }}>
            <Icon name="Download" size={13} />
            <span className="hidden md:inline">{exporting ? "Экспорт..." : "Экспорт"}</span>
          </button>
        </div>
      </nav>

      <div className="pt-14 flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="fixed left-0 top-14 bottom-0 w-14 md:w-56 flex flex-col py-4 gap-1 px-2"
          style={{ background: "rgba(6,10,18,0.95)", borderRight: "1px solid rgba(59,130,246,0.1)" }}>
          {[
            { id: "overview", icon: "LayoutDashboard", label: "Сводка" },
            { id: "finance", icon: "Wallet", label: "Финансы" },
            { id: "security", icon: "ShieldAlert", label: "Безопасность" },
            { id: "snapshots", icon: "History", label: `Снапшоты (${snapshots.length})` },
            { id: "export", icon: "FileJson", label: "Экспорт данных" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left"
              style={{
                background: tab === t.id ? "rgba(59,130,246,0.12)" : "transparent",
                color: tab === t.id ? "#3b82f6" : "rgba(255,255,255,0.4)",
                border: tab === t.id ? "1px solid rgba(59,130,246,0.25)" : "1px solid transparent",
              }}>
              <Icon name={t.icon as "LayoutDashboard"} size={16} />
              <span className="hidden md:block text-xs">{t.label}</span>
            </button>
          ))}
        </aside>

        <main className="flex-1 ml-14 md:ml-56 p-4 md:p-6">
          {loading && <div className="text-center py-20 text-white/30">Загружаю...</div>}

          {/* OVERVIEW */}
          {!loading && tab === "overview" && data && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-white uppercase">Сводка аналитики</h1>
                <p className="text-white/30 text-sm mt-1">Актуальные показатели ECSU 2.0</p>
              </div>

              {/* Финансовые KPI */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { label: "Общий баланс", val: fmt(data.finance.total_balance_usd), color: "#3b82f6", icon: "DollarSign" },
                  { label: "Всего доходов", val: fmt(data.finance.total_income_usd), color: "#00ff87", icon: "TrendingUp" },
                  { label: "Всего расходов", val: fmt(data.finance.total_outcome_usd), color: "#f43f5e", icon: "TrendingDown" },
                  { label: "Чистый доход", val: fmt(data.finance.net_usd), color: data.finance.net_usd >= 0 ? "#00ff87" : "#f43f5e", icon: "Activity" },
                  { label: "Счёт поглощения", val: fmt(data.finance.absorption_balance), color: "#f59e0b", icon: "Vault" },
                ].map(k => (
                  <div key={k.label} className="p-4 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${k.color}20` }}>
                    <Icon name={k.icon as "DollarSign"} size={16} className="mb-2" style={{ color: k.color }} />
                    <div className="font-bold text-lg" style={{ color: k.color }}>{k.val}</div>
                    <div className="text-white/30 text-xs mt-0.5">{k.label}</div>
                  </div>
                ))}
              </div>

              {/* Графики */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Доходы/расходы */}
                <div className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="font-display text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Финансовая динамика (30 дней)</div>
                  {data.charts.daily_finance.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-end gap-0.5 h-16">
                        {data.charts.daily_finance.map((d, i) => {
                          const maxVal = Math.max(...data.charts.daily_finance.map(x => Math.max(x.income, x.outcome)), 1);
                          return (
                            <div key={i} className="flex-1 flex flex-col justify-end gap-0.5">
                              <div className="rounded-sm" style={{ height: `${(d.income / maxVal) * 56}px`, background: "#00ff87", opacity: 0.7 }} />
                              <div className="rounded-sm" style={{ height: `${(d.outcome / maxVal) * 56}px`, background: "#f43f5e", opacity: 0.7 }} />
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm" style={{ background: "#00ff87" }} /><span className="text-white/40">Доходы</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm" style={{ background: "#f43f5e" }} /><span className="text-white/40">Расходы</span></div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-white/20 text-sm">Данных за 30 дней нет</div>
                  )}
                </div>

                {/* Распределение по счетам */}
                <div className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="font-display text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Распределение по счетам</div>
                  <div className="space-y-3">
                    {data.charts.accounts_distribution.map((a, i) => {
                      const colors = ["#3b82f6", "#00ff87", "#a855f7", "#f59e0b", "#f43f5e"];
                      const total = data.charts.accounts_distribution.reduce((s, x) => s + (x.currency === "USD" ? x.balance : 0), 1);
                      const pct = a.currency === "USD" ? Math.round((a.balance / total) * 100) : 0;
                      return (
                        <div key={a.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-white/60">{a.label}</span>
                            <span style={{ color: colors[i % colors.length] }}>
                              {new Intl.NumberFormat("ru-RU", { style: "currency", currency: a.currency, maximumFractionDigits: 0 }).format(a.balance)}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Безопасность + Топ атак */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl" style={{ background: "rgba(244,63,94,0.04)", border: "1px solid rgba(244,63,94,0.15)" }}>
                  <div className="font-display text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Безопасность</div>
                  <div className="space-y-3">
                    {[
                      { label: "Всего событий", val: data.security.total_events, color: "#f43f5e" },
                      { label: "Штрафов собрано", val: fmt(data.security.total_penalties_usd), color: "#f59e0b" },
                      { label: "IP заблокировано", val: data.security.blocked_ips, color: "#a855f7" },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <span className="text-white/50 text-sm">{item.label}</span>
                        <span className="font-bold text-sm" style={{ color: item.color }}>{item.val}</span>
                      </div>
                    ))}
                  </div>
                  {data.charts.daily_attacks.length > 0 && (
                    <div className="mt-4">
                      <div className="text-white/30 text-xs mb-2">Атаки за 30 дней</div>
                      <MiniBar data={data.charts.daily_attacks.map(d => d.events)} colorKey="#f43f5e" />
                    </div>
                  )}
                </div>

                <div className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="font-display text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Типы атак</div>
                  <div className="space-y-2">
                    {data.charts.attack_types.map((a, i) => {
                      const max = data.charts.attack_types[0]?.count || 1;
                      return (
                        <div key={a.type}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-white/60">{ATTACK_LABELS[a.type] ?? a.type}</span>
                            <span className="text-red-400">{a.count} · {fmt(a.penalty)}</span>
                          </div>
                          <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                            <div className="h-1 rounded-full" style={{ width: `${(a.count / max) * 100}%`, background: `hsl(${220 + i * 30},70%,60%)` }} />
                          </div>
                        </div>
                      );
                    })}
                    {data.charts.attack_types.length === 0 && <div className="text-white/20 text-sm text-center py-4">Атак не зафиксировано</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FINANCE TAB */}
          {!loading && tab === "finance" && data && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-white uppercase">Финансовая аналитика</h1>
              </div>
              {/* Топ транзакций */}
              <div className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="font-display text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Топ транзакций по сумме</div>
                <div className="space-y-2">
                  {data.charts.top_transactions.map((t, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.03)" }}>
                      <div className="text-white/20 text-sm font-bold w-6">#{i+1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white/70 text-sm truncate">{t.description || "—"}</div>
                        <div className="text-white/30 text-xs">{t.account} · {new Date(t.created_at).toLocaleDateString("ru-RU")}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-sm" style={{ color: t.tx_type === "income" ? "#00ff87" : "#f43f5e" }}>
                          {t.tx_type === "income" ? "+" : "-"}{fmt(t.amount, t.currency)}
                        </div>
                        <div className="text-white/25 text-[10px]">{t.tx_type === "income" ? "доход" : "расход"}</div>
                      </div>
                    </div>
                  ))}
                  {data.charts.top_transactions.length === 0 && <div className="text-white/20 text-sm text-center py-6">Транзакций нет</div>}
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {!loading && tab === "security" && data && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-white uppercase">Аналитика безопасности</h1>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Всего инцидентов", val: data.security.total_events, color: "#f43f5e", icon: "AlertTriangle" },
                  { label: "Штрафов USD", val: fmt(data.security.total_penalties_usd), color: "#f59e0b", icon: "DollarSign" },
                  { label: "Заблокировано IP", val: data.security.blocked_ips, color: "#a855f7", icon: "Ban" },
                ].map(k => (
                  <div key={k.label} className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${k.color}20` }}>
                    <Icon name={k.icon as "AlertTriangle"} size={20} className="mb-2" style={{ color: k.color }} />
                    <div className="font-display text-2xl font-bold" style={{ color: k.color }}>{k.val}</div>
                    <div className="text-white/30 text-xs mt-0.5">{k.label}</div>
                  </div>
                ))}
              </div>
              <div className="p-5 rounded-2xl" style={{ background: "rgba(244,63,94,0.04)", border: "1px solid rgba(244,63,94,0.15)" }}>
                <div className="font-display text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Детализация по типам атак</div>
                <div className="space-y-3">
                  {data.charts.attack_types.map((a, i) => {
                    const colors = ["#f43f5e","#f59e0b","#a855f7","#3b82f6","#00ff87"];
                    return (
                      <div key={a.type} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: colors[i % 5] }} />
                        <div className="flex-1">
                          <div className="text-white/70 text-sm">{ATTACK_LABELS[a.type] ?? a.type}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm" style={{ color: colors[i % 5] }}>{a.count} атак</div>
                          <div className="text-white/30 text-xs">штрафов: {fmt(a.penalty)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SNAPSHOTS */}
          {!loading && tab === "snapshots" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="font-display text-2xl font-bold text-white uppercase">История снапшотов</h1>
                  <p className="text-white/30 text-sm mt-1">Архив состояния системы</p>
                </div>
                <button onClick={createSnapshot} disabled={snapping}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                  style={{ background: G("#a855f7,#3b82f6"), color: "white" }}>
                  <Icon name="Camera" size={15} />
                  {snapping ? "Создаю..." : "Новый снапшот"}
                </button>
              </div>
              <div className="space-y-3">
                {snapshots.map(s => (
                  <div key={s.id} className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">Снапшот #{s.id}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7" }}>
                            {s.date}
                          </span>
                        </div>
                        <div className="text-white/30 text-xs mt-0.5">{new Date(s.created_at).toLocaleString("ru-RU")}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "Баланс", val: fmt(s.total_balance), color: "#3b82f6" },
                        { label: "Доходы", val: fmt(s.total_income), color: "#00ff87" },
                        { label: "Поглощение", val: fmt(s.absorption), color: "#f59e0b" },
                        { label: "Инциденты", val: s.sec_events, color: "#f43f5e" },
                      ].map(item => (
                        <div key={item.label} className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                          <div className="font-bold text-sm" style={{ color: item.color }}>{item.val}</div>
                          <div className="text-white/25 text-xs">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {snapshots.length === 0 && (
                  <div className="text-center py-16 text-white/25">
                    <Icon name="History" size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Снапшотов нет — создайте первый</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EXPORT */}
          {!loading && tab === "export" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="font-display text-2xl font-bold text-white uppercase">Экспорт данных</h1>
                  <p className="text-white/30 text-sm mt-1">Выгрузка всей информации системы</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={doExport} disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                    style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)" }}>
                    <Icon name="RefreshCw" size={14} />
                    {exporting ? "Загружаю..." : "Обновить"}
                  </button>
                  {exportData && (
                    <button onClick={downloadJson}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                      style={{ background: G("#3b82f6,#a855f7"), color: "white" }}>
                      <Icon name="Download" size={14} />
                      Скачать JSON
                    </button>
                  )}
                </div>
              </div>
              {exportData ? (
                <div className="p-4 rounded-2xl" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(59,130,246,0.2)" }}>
                  <pre className="text-green-400 text-xs overflow-auto max-h-[60vh] font-mono leading-relaxed">
                    {exportData.slice(0, 8000)}{exportData.length > 8000 ? "\n...[обрезано для отображения, файл полный]" : ""}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-20">
                  <Icon name="FileJson" size={48} className="mx-auto mb-4 text-blue-400/30" />
                  <p className="text-white/30 text-sm mb-4">Нажмите «Экспорт» в шапке для загрузки данных</p>
                  <button onClick={doExport} disabled={exporting}
                    className="px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
                    style={{ background: G("#3b82f6,#a855f7"), color: "white" }}>
                    {exporting ? "Загружаю..." : "Экспортировать все данные"}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}