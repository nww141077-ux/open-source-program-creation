import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/e610af8a-f8c5-4c04-8d9b-092391fb0c70";
const G = (s: string) => `linear-gradient(135deg, ${s})`;

type Account = {
  id: number; owner_name: string; account_type: string; account_number: string;
  bank_name: string; currency: string; label: string; is_active: boolean;
  is_primary: boolean; distribution_percent: number; balance: number;
  created_at: string; cards_count: number;
};
type Card = {
  id: number; account_id: number; card_holder: string; card_last4: string;
  card_type: string; expiry_month: number; expiry_year: number;
  is_active: boolean; created_at: string; account_label: string; bank_name: string;
};
type Transaction = {
  id: number; account_id: number; tx_type: string; amount: number;
  currency: string; description: string; source: string; status: string;
  created_at: string; account_label: string;
};
type Rule = {
  id: number; name: string; account_id: number; percent: number;
  description: string; is_active: boolean; account_label: string; currency: string;
};

const TYPE_ICONS: Record<string, string> = { bank: "Building2", card: "CreditCard", crypto: "Coins", system: "Server" };
const TYPE_LABELS: Record<string, string> = { bank: "Банковский счёт", card: "Карточный счёт", crypto: "Крипто-кошелёк", system: "Системный счёт" };
const TYPE_COLORS: Record<string, string> = { bank: "#3b82f6", card: "#a855f7", crypto: "#f59e0b", system: "#00ff87" };
const CARD_COLORS: Record<string, string> = { visa: "#1a56db", mastercard: "#f43f5e", mir: "#00aa44", crypto: "#f59e0b" };
const TX_COLORS: Record<string, string> = { income: "#00ff87", outcome: "#f43f5e", distribution: "#a855f7", transfer: "#3b82f6" };
const TX_LABELS: Record<string, string> = { income: "Поступление", outcome: "Расход", distribution: "Распределение", transfer: "Перевод" };
const TX_ICONS: Record<string, string> = { income: "ArrowDownLeft", outcome: "ArrowUpRight", distribution: "GitFork", transfer: "ArrowLeftRight" };

function parse(d: unknown) {
  if (typeof d === "string") { try { return JSON.parse(d); } catch { return d; } }
  return d;
}

function fmt(n: number, cur = "USD") {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);
}

export default function EgsuFinance() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"overview" | "accounts" | "cards" | "transactions" | "rules">("overview");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [stats, setStats] = useState<{ accounts: number; cards: number; total_income_usd: number; total_outcome_usd: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<"account" | "card" | "transaction" | "rule" | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  // Forms
  const [accForm, setAccForm] = useState({ owner_name: "", account_type: "bank", account_number: "", bank_name: "", currency: "RUB", label: "", distribution_percent: "0" });
  const [cardForm, setCardForm] = useState({ account_id: "", card_holder: "", card_last4: "", card_type: "visa", expiry_month: "", expiry_year: "" });
  const [txForm, setTxForm] = useState({ account_id: "", tx_type: "income", amount: "", currency: "RUB", description: "", source: "" });
  const [ruleForm, setRuleForm] = useState({ name: "", account_id: "", percent: "", description: "" });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const load = async () => {
    setLoading(true);
    const [s, a, c, t, r] = await Promise.all([
      fetch(API).then(r => r.json()).then(parse),
      fetch(`${API}/accounts`).then(r => r.json()).then(parse),
      fetch(`${API}/cards`).then(r => r.json()).then(parse),
      fetch(`${API}/transactions`).then(r => r.json()).then(parse),
      fetch(`${API}/rules`).then(r => r.json()).then(parse),
    ]);
    setStats(s);
    setAccounts(Array.isArray(a) ? a : []);
    setCards(Array.isArray(c) ? c : []);
    setTransactions(Array.isArray(t) ? t : []);
    setRules(Array.isArray(r) ? r : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveAccount = async () => {
    if (!accForm.owner_name.trim()) return;
    setSaving(true);
    const r = await fetch(`${API}/accounts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...accForm, distribution_percent: parseFloat(accForm.distribution_percent) || 0 }) });
    const d = parse(await r.json());
    setSaving(false);
    if (d.id) { showToast("Счёт добавлен"); setModal(null); setAccForm({ owner_name: "", account_type: "bank", account_number: "", bank_name: "", currency: "RUB", label: "", distribution_percent: "0" }); load(); }
    else showToast("Ошибка: " + (d.error || ""));
  };

  const saveCard = async () => {
    if (!cardForm.account_id || !cardForm.card_holder || cardForm.card_last4.length !== 4) return;
    setSaving(true);
    const r = await fetch(`${API}/cards`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...cardForm, account_id: parseInt(cardForm.account_id), expiry_month: parseInt(cardForm.expiry_month) || null, expiry_year: parseInt(cardForm.expiry_year) || null }) });
    const d = parse(await r.json());
    setSaving(false);
    if (d.id) { showToast("Карта добавлена"); setModal(null); setCardForm({ account_id: "", card_holder: "", card_last4: "", card_type: "visa", expiry_month: "", expiry_year: "" }); load(); }
    else showToast("Ошибка: " + (d.error || ""));
  };

  const saveTx = async () => {
    if (!txForm.account_id || !txForm.amount) return;
    setSaving(true);
    const r = await fetch(`${API}/transactions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...txForm, account_id: parseInt(txForm.account_id), amount: parseFloat(txForm.amount) }) });
    const d = parse(await r.json());
    setSaving(false);
    if (d.id) { showToast("Транзакция записана"); setModal(null); setTxForm({ account_id: "", tx_type: "income", amount: "", currency: "RUB", description: "", source: "" }); load(); }
    else showToast("Ошибка: " + (d.error || ""));
  };

  const saveRule = async () => {
    if (!ruleForm.name || !ruleForm.account_id || !ruleForm.percent) return;
    setSaving(true);
    const r = await fetch(`${API}/rules`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...ruleForm, account_id: parseInt(ruleForm.account_id), percent: parseFloat(ruleForm.percent) }) });
    const d = parse(await r.json());
    setSaving(false);
    if (d.id) { showToast("Правило добавлено"); setModal(null); setRuleForm({ name: "", account_id: "", percent: "", description: "" }); load(); }
    else showToast("Ошибка: " + (d.error || ""));
  };

  const totalDistrib = rules.filter(r => r.is_active).reduce((s, r) => s + r.percent, 0);

  return (
    <div className="min-h-screen font-body" style={{ background: "#060a12" }}>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-6 z-[100] px-4 py-3 rounded-xl text-sm font-semibold shadow-xl animate-fade-up"
          style={{ background: toast.startsWith("Ошибка") ? "rgba(244,63,94,0.9)" : "rgba(0,255,135,0.9)", color: "black" }}>
          {toast}
        </div>
      )}

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-3"
        style={{ background: "rgba(6,10,18,0.97)", borderBottom: "1px solid rgba(0,255,135,0.15)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/egsu/dashboard")} className="text-white/40 hover:text-white/70 transition-colors">
            <Icon name="ChevronLeft" size={16} />
          </button>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: G("#00ff87, #3b82f6") }}>
            <Icon name="Wallet" size={14} className="text-black" />
          </div>
          <div>
            <div className="font-display text-base font-bold text-white tracking-wide leading-none">ФИНАНСЫ ЕЦСУ</div>
            <div className="text-white/30 text-[10px]">Счета · Карты · Распределение</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stats && (
            <div className="hidden md:flex items-center gap-4 mr-2">
              <div className="text-center">
                <div className="text-sm font-bold text-green-400">{fmt(stats.total_income_usd)}</div>
                <div className="text-white/25 text-[9px]">Поступило</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-red-400">{fmt(stats.total_outcome_usd)}</div>
                <div className="text-white/25 text-[9px]">Выбыло</div>
              </div>
            </div>
          )}
          <button onClick={() => setModal("transaction")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
            style={{ background: G("#00ff87, #3b82f6"), color: "black" }}>
            <Icon name="Plus" size={13} />
            <span className="hidden md:inline">Транзакция</span>
          </button>
        </div>
      </nav>

      <div className="pt-14 flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="fixed left-0 top-14 bottom-0 w-14 md:w-56 flex flex-col py-4 gap-1 px-2 overflow-y-auto"
          style={{ background: "rgba(6,10,18,0.95)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
          {[
            { id: "overview", icon: "LayoutDashboard", label: "Обзор" },
            { id: "accounts", icon: "Building2", label: `Счета (${accounts.length})` },
            { id: "cards", icon: "CreditCard", label: `Карты (${cards.length})` },
            { id: "transactions", icon: "ArrowLeftRight", label: "Транзакции" },
            { id: "rules", icon: "GitFork", label: "Распределение" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left"
              style={{
                background: tab === t.id ? "rgba(0,255,135,0.1)" : "transparent",
                color: tab === t.id ? "#00ff87" : "rgba(255,255,255,0.4)",
                border: tab === t.id ? "1px solid rgba(0,255,135,0.2)" : "1px solid transparent",
              }}>
              <Icon name={t.icon as "Wallet"} size={16} />
              <span className="hidden md:block">{t.label}</span>
            </button>
          ))}

          <div className="hidden md:block mt-auto px-3 pb-2">
            <div className="pt-4 border-t border-white/5 space-y-1">
              <button onClick={() => setModal("account")}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}>
                <Icon name="PlusCircle" size={13} />Добавить счёт
              </button>
              <button onClick={() => setModal("card")}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                style={{ background: "rgba(168,85,247,0.12)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.2)" }}>
                <Icon name="PlusCircle" size={13} />Добавить карту
              </button>
              <button onClick={() => setModal("rule")}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                style={{ background: "rgba(0,255,135,0.08)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.15)" }}>
                <Icon name="PlusCircle" size={13} />Правило
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 ml-14 md:ml-56 p-4 md:p-6">

          {loading && <div className="text-center py-20 text-white/30">Загружаю...</div>}

          {/* OVERVIEW */}
          {!loading && tab === "overview" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-white uppercase">Финансовый обзор</h1>
                <p className="text-white/30 text-sm mt-1">Апрель 2026 · Все счета</p>
              </div>

              {/* KPI */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Счетов", val: accounts.length, icon: "Building2", color: "#3b82f6" },
                  { label: "Карт", val: cards.length, icon: "CreditCard", color: "#a855f7" },
                  { label: "Транзакций", val: transactions.length, icon: "ArrowLeftRight", color: "#f59e0b" },
                  { label: "Правил", val: rules.length, icon: "GitFork", color: "#00ff87" },
                ].map(k => (
                  <div key={k.label} className="p-4 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${k.color}20` }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${k.color}15` }}>
                      <Icon name={k.icon as "Wallet"} size={16} style={{ color: k.color }} />
                    </div>
                    <div className="font-display text-3xl font-bold" style={{ color: k.color }}>{k.val}</div>
                    <div className="text-white/40 text-xs mt-0.5">{k.label}</div>
                  </div>
                ))}
              </div>

              {/* Балансы счетов */}
              <div>
                <h2 className="font-display text-sm font-bold text-white/50 uppercase tracking-widest mb-3">Балансы счетов</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {accounts.map(a => (
                    <div key={a.id} className="p-4 rounded-2xl flex items-center gap-4"
                      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${TYPE_COLORS[a.account_type] ?? "#fff"}18` }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${TYPE_COLORS[a.account_type] ?? "#fff"}18` }}>
                        <Icon name={TYPE_ICONS[a.account_type] as "Wallet"} size={18} style={{ color: TYPE_COLORS[a.account_type] ?? "#fff" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-sm truncate">{a.label || a.owner_name}</div>
                        <div className="text-white/35 text-xs">{a.bank_name} · {a.account_number}</div>
                        {a.is_primary && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(0,255,135,0.15)", color: "#00ff87" }}>Основной</span>}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-sm" style={{ color: TYPE_COLORS[a.account_type] ?? "#fff" }}>{fmt(a.balance, a.currency)}</div>
                        <div className="text-white/30 text-[10px]">{a.distribution_percent}% распред.</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* График распределения */}
              {rules.length > 0 && (
                <div className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h2 className="font-display text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Распределение поступлений</h2>
                  <div className="space-y-3">
                    {rules.filter(r => r.is_active).map((r, i) => {
                      const colors = ["#00ff87","#3b82f6","#f59e0b","#a855f7","#f43f5e"];
                      const c = colors[i % colors.length];
                      return (
                        <div key={r.id}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-white/60">{r.name}</span>
                            <span style={{ color: c }}>{r.percent}%</span>
                          </div>
                          <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <div className="h-2 rounded-full transition-all" style={{ width: `${r.percent}%`, background: c }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 text-right text-xs" style={{ color: totalDistrib === 100 ? "#00ff87" : "#f59e0b" }}>
                    Итого: {totalDistrib}% {totalDistrib !== 100 && `— расхождение ${100 - totalDistrib}%`}
                  </div>
                </div>
              )}

              {/* Последние транзакции */}
              <div>
                <h2 className="font-display text-sm font-bold text-white/50 uppercase tracking-widest mb-3">Последние операции</h2>
                <div className="space-y-2">
                  {transactions.slice(0, 6).map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${TX_COLORS[t.tx_type] ?? "#fff"}15` }}>
                        <Icon name={TX_ICONS[t.tx_type] as "Wallet"} size={15} style={{ color: TX_COLORS[t.tx_type] }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white/80 text-sm truncate">{t.description}</div>
                        <div className="text-white/30 text-xs">{t.account_label} · {t.source}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-semibold text-sm" style={{ color: TX_COLORS[t.tx_type] }}>
                          {t.tx_type === "outcome" ? "-" : "+"}{fmt(t.amount, t.currency)}
                        </div>
                        <div className="text-white/25 text-[10px]">{new Date(t.created_at).toLocaleDateString("ru-RU")}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ACCOUNTS */}
          {!loading && tab === "accounts" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="font-display text-2xl font-bold text-white uppercase">Счета</h1>
                  <p className="text-white/30 text-sm mt-1">{accounts.length} активных счетов</p>
                </div>
                <button onClick={() => setModal("account")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                  style={{ background: G("#3b82f6, #a855f7"), color: "white" }}>
                  <Icon name="Plus" size={15} />Добавить счёт
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accounts.map(a => (
                  <div key={a.id} className="p-5 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${TYPE_COLORS[a.account_type] ?? "#fff"}20` }}>
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${TYPE_COLORS[a.account_type]}20` }}>
                        <Icon name={TYPE_ICONS[a.account_type] as "Wallet"} size={22} style={{ color: TYPE_COLORS[a.account_type] }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-bold">{a.label || a.owner_name}</div>
                        <div className="text-white/40 text-xs mt-0.5">{a.owner_name}</div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{ background: `${TYPE_COLORS[a.account_type]}15`, color: TYPE_COLORS[a.account_type] }}>
                            {TYPE_LABELS[a.account_type] ?? a.account_type}
                          </span>
                          {a.is_primary && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(0,255,135,0.15)", color: "#00ff87" }}>Основной</span>}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.2)" }}>
                        <div className="text-white/30 text-[10px] mb-0.5">Баланс</div>
                        <div className="font-bold text-sm" style={{ color: TYPE_COLORS[a.account_type] }}>{fmt(a.balance, a.currency)}</div>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.2)" }}>
                        <div className="text-white/30 text-[10px] mb-0.5">Распределение</div>
                        <div className="font-bold text-sm text-white">{a.distribution_percent}%</div>
                      </div>
                    </div>
                    <div className="text-white/30 text-xs space-y-0.5">
                      {a.account_number && <div>№ {a.account_number}</div>}
                      {a.bank_name && <div>{a.bank_name}</div>}
                      <div>{a.cards_count} привязанных карт</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CARDS */}
          {!loading && tab === "cards" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="font-display text-2xl font-bold text-white uppercase">Карты</h1>
                  <p className="text-white/30 text-sm mt-1">{cards.length} привязанных карт</p>
                </div>
                <button onClick={() => setModal("card")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                  style={{ background: G("#a855f7, #3b82f6"), color: "white" }}>
                  <Icon name="Plus" size={15} />Добавить карту
                </button>
              </div>
              {cards.length === 0 ? (
                <div className="text-center py-20">
                  <Icon name="CreditCard" size={40} className="mx-auto mb-3 text-white/20" />
                  <p className="text-white/30">Карты не добавлены</p>
                  <button onClick={() => setModal("card")} className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                    style={{ background: G("#a855f7, #3b82f6"), color: "white" }}>Добавить карту</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cards.map(c => (
                    <div key={c.id} className="rounded-2xl overflow-hidden">
                      {/* Card visual */}
                      <div className="p-5 relative" style={{ background: G(`${CARD_COLORS[c.card_type] ?? "#1a56db"}, ${CARD_COLORS[c.card_type] ?? "#1a56db"}88`), minHeight: 120 }}>
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
                          style={{ background: "white", transform: "translate(30%, -30%)" }} />
                        <div className="flex justify-between items-start mb-6">
                          <div className="text-white/60 text-xs uppercase tracking-widest">{c.card_type.toUpperCase()}</div>
                          <Icon name="CreditCard" size={20} className="text-white/60" />
                        </div>
                        <div className="font-mono text-white text-lg tracking-widest">•••• •••• •••• {c.card_last4}</div>
                        <div className="flex justify-between mt-3">
                          <div>
                            <div className="text-white/50 text-[10px]">ДЕРЖАТЕЛЬ</div>
                            <div className="text-white text-sm font-semibold">{c.card_holder}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-white/50 text-[10px]">СРОК</div>
                            <div className="text-white text-sm">{c.expiry_month && c.expiry_year ? `${String(c.expiry_month).padStart(2,"0")}/${String(c.expiry_year).slice(-2)}` : "—"}</div>
                          </div>
                        </div>
                      </div>
                      <div className="p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="text-white/40 text-xs">{c.account_label} · {c.bank_name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TRANSACTIONS */}
          {!loading && tab === "transactions" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="font-display text-2xl font-bold text-white uppercase">Транзакции</h1>
                  <p className="text-white/30 text-sm mt-1">{transactions.length} операций</p>
                </div>
                <button onClick={() => setModal("transaction")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                  style={{ background: G("#00ff87, #3b82f6"), color: "black" }}>
                  <Icon name="Plus" size={15} />Добавить
                </button>
              </div>
              <div className="space-y-2">
                {transactions.map(t => (
                  <div key={t.id} className="flex items-center gap-4 p-4 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${TX_COLORS[t.tx_type]}15` }}>
                      <Icon name={TX_ICONS[t.tx_type] as "Wallet"} size={18} style={{ color: TX_COLORS[t.tx_type] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white/80 text-sm font-medium">{t.description || "—"}</div>
                      <div className="text-white/30 text-xs mt-0.5">{t.account_label} · {t.source}</div>
                    </div>
                    <div className="shrink-0 text-center hidden md:block">
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${TX_COLORS[t.tx_type]}15`, color: TX_COLORS[t.tx_type] }}>
                        {TX_LABELS[t.tx_type] ?? t.tx_type}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-sm" style={{ color: TX_COLORS[t.tx_type] }}>
                        {t.tx_type === "outcome" ? "−" : "+"}{fmt(t.amount, t.currency)}
                      </div>
                      <div className="text-white/25 text-[10px]">{new Date(t.created_at).toLocaleDateString("ru-RU")}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RULES */}
          {!loading && tab === "rules" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="font-display text-2xl font-bold text-white uppercase">Правила распределения</h1>
                  <p className="text-white/30 text-sm mt-1">Автоматическое распределение поступлений по счетам</p>
                </div>
                <button onClick={() => setModal("rule")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                  style={{ background: G("#00ff87, #3b82f6"), color: "black" }}>
                  <Icon name="Plus" size={15} />Добавить правило
                </button>
              </div>

              <div className="mb-4 p-4 rounded-2xl flex items-center justify-between"
                style={{ background: totalDistrib === 100 ? "rgba(0,255,135,0.07)" : "rgba(245,158,11,0.07)", border: `1px solid ${totalDistrib === 100 ? "rgba(0,255,135,0.2)" : "rgba(245,158,11,0.2)"}` }}>
                <div className="flex items-center gap-2">
                  <Icon name={totalDistrib === 100 ? "CheckCircle" : "AlertCircle"} size={18} style={{ color: totalDistrib === 100 ? "#00ff87" : "#f59e0b" }} />
                  <span className="text-sm font-semibold" style={{ color: totalDistrib === 100 ? "#00ff87" : "#f59e0b" }}>
                    {totalDistrib === 100 ? "Распределение сбалансировано — 100%" : `Суммарно: ${totalDistrib}% — расхождение ${Math.abs(100 - totalDistrib)}%`}
                  </span>
                </div>
                <div className="text-white/30 text-xs">{rules.length} правил</div>
              </div>

              <div className="space-y-3">
                {rules.map((r, i) => {
                  const colors = ["#00ff87","#3b82f6","#f59e0b","#a855f7","#f43f5e"];
                  const c = colors[i % colors.length];
                  return (
                    <div key={r.id} className="p-5 rounded-2xl"
                      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${c}18` }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg"
                          style={{ background: `${c}18`, color: c }}>{r.percent}%</div>
                        <div className="flex-1">
                          <div className="text-white font-semibold">{r.name}</div>
                          <div className="text-white/40 text-xs mt-0.5">{r.account_label} · {r.currency}</div>
                          {r.description && <div className="text-white/30 text-xs mt-1">{r.description}</div>}
                        </div>
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: r.is_active ? "#00ff87" : "#666" }} />
                      </div>
                      <div className="mt-3 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${r.percent}%`, background: c }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ─── MODALS ──────────────────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: "#0d1220", border: "1px solid rgba(255,255,255,0.12)" }}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2">
                <Icon name={modal === "account" ? "Building2" : modal === "card" ? "CreditCard" : modal === "transaction" ? "ArrowLeftRight" : "GitFork"} size={18} className="text-white/60" />
                <span className="text-white font-bold">
                  {modal === "account" ? "Добавить счёт" : modal === "card" ? "Добавить карту" : modal === "transaction" ? "Новая транзакция" : "Правило распределения"}
                </span>
              </div>
              <button onClick={() => setModal(null)} className="text-white/30 hover:text-white/70 transition-colors">
                <Icon name="X" size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* ADD ACCOUNT */}
              {modal === "account" && (
                <>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Тип счёта</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(TYPE_LABELS).map(([k, v]) => (
                        <button key={k} onClick={() => setAccForm(f => ({ ...f, account_type: k }))}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
                          style={{ background: accForm.account_type === k ? `${TYPE_COLORS[k]}20` : "rgba(255,255,255,0.04)", color: accForm.account_type === k ? TYPE_COLORS[k] : "rgba(255,255,255,0.4)", border: `1px solid ${accForm.account_type === k ? TYPE_COLORS[k] + "40" : "rgba(255,255,255,0.08)"}` }}>
                          <Icon name={TYPE_ICONS[k] as "Wallet"} size={14} />
                          <span className="text-xs">{v}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {[
                    { key: "owner_name", label: "Владелец / Название *", ph: "Иван Иванов / ООО Компания" },
                    { key: "label", label: "Метка (для отображения)", ph: "Основной счёт" },
                    { key: "bank_name", label: "Банк / Платформа", ph: "Сбербанк / Binance" },
                    { key: "account_number", label: "Номер счёта / IBAN / Адрес", ph: "40817810..." },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">{f.label}</label>
                      <input value={(accForm as Record<string,string>)[f.key]} onChange={e => setAccForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.ph}
                        className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Валюта</label>
                      <select value={accForm.currency} onChange={e => setAccForm(f => ({ ...f, currency: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        {["RUB","USD","EUR","CNY","BTC","ETH","USDT"].map(c => <option key={c} value={c} style={{ background: "#0d1220" }}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">% распределения</label>
                      <input value={accForm.distribution_percent} onChange={e => setAccForm(f => ({ ...f, distribution_percent: e.target.value }))}
                        type="number" min="0" max="100" placeholder="0"
                        className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                  </div>
                  <button onClick={saveAccount} disabled={saving || !accForm.owner_name.trim()}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-40"
                    style={{ background: G("#3b82f6, #a855f7"), color: "white" }}>
                    {saving ? "Сохраняю..." : "Добавить счёт"}
                  </button>
                </>
              )}

              {/* ADD CARD */}
              {modal === "card" && (
                <>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Счёт *</label>
                    <select value={cardForm.account_id} onChange={e => setCardForm(f => ({ ...f, account_id: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <option value="" style={{ background: "#0d1220" }}>— выберите счёт —</option>
                      {accounts.map(a => <option key={a.id} value={a.id} style={{ background: "#0d1220" }}>{a.label || a.owner_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Тип карты</label>
                    <div className="flex gap-2">
                      {["visa","mastercard","mir","crypto"].map(ct => (
                        <button key={ct} onClick={() => setCardForm(f => ({ ...f, card_type: ct }))}
                          className="flex-1 py-2 rounded-xl text-xs font-bold transition-all uppercase"
                          style={{ background: cardForm.card_type === ct ? `${CARD_COLORS[ct]}30` : "rgba(255,255,255,0.04)", color: cardForm.card_type === ct ? CARD_COLORS[ct] : "rgba(255,255,255,0.3)", border: `1px solid ${cardForm.card_type === ct ? CARD_COLORS[ct] + "50" : "rgba(255,255,255,0.08)"}` }}>
                          {ct}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Имя держателя *</label>
                    <input value={cardForm.card_holder} onChange={e => setCardForm(f => ({ ...f, card_holder: e.target.value }))}
                      placeholder="IVAN IVANOV" className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none uppercase"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Последние 4 цифры *</label>
                    <input value={cardForm.card_last4} onChange={e => setCardForm(f => ({ ...f, card_last4: e.target.value.replace(/\D/g,"").slice(0,4) }))}
                      placeholder="1234" maxLength={4}
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none font-mono tracking-widest"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Месяц</label>
                      <input value={cardForm.expiry_month} onChange={e => setCardForm(f => ({ ...f, expiry_month: e.target.value }))}
                        type="number" min="1" max="12" placeholder="12"
                        className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                    <div>
                      <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Год</label>
                      <input value={cardForm.expiry_year} onChange={e => setCardForm(f => ({ ...f, expiry_year: e.target.value }))}
                        type="number" min="2024" max="2040" placeholder="2028"
                        className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                  </div>
                  <button onClick={saveCard} disabled={saving || !cardForm.account_id || !cardForm.card_holder || cardForm.card_last4.length !== 4}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-40"
                    style={{ background: G("#a855f7, #3b82f6"), color: "white" }}>
                    {saving ? "Сохраняю..." : "Добавить карту"}
                  </button>
                </>
              )}

              {/* ADD TRANSACTION */}
              {modal === "transaction" && (
                <>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Счёт *</label>
                    <select value={txForm.account_id} onChange={e => setTxForm(f => ({ ...f, account_id: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <option value="" style={{ background: "#0d1220" }}>— выберите счёт —</option>
                      {accounts.map(a => <option key={a.id} value={a.id} style={{ background: "#0d1220" }}>{a.label || a.owner_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Тип операции</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(TX_LABELS).map(([k, v]) => (
                        <button key={k} onClick={() => setTxForm(f => ({ ...f, tx_type: k }))}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all"
                          style={{ background: txForm.tx_type === k ? `${TX_COLORS[k]}20` : "rgba(255,255,255,0.04)", color: txForm.tx_type === k ? TX_COLORS[k] : "rgba(255,255,255,0.4)", border: `1px solid ${txForm.tx_type === k ? TX_COLORS[k] + "40" : "rgba(255,255,255,0.08)"}` }}>
                          <Icon name={TX_ICONS[k] as "Wallet"} size={13} />
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Сумма *</label>
                      <input value={txForm.amount} onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))}
                        type="number" min="0" placeholder="10000"
                        className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                    <div>
                      <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Валюта</label>
                      <select value={txForm.currency} onChange={e => setTxForm(f => ({ ...f, currency: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        {["RUB","USD","EUR","CNY","USDT"].map(c => <option key={c} value={c} style={{ background: "#0d1220" }}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Описание</label>
                    <input value={txForm.description} onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Назначение платежа"
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Источник / Плательщик</label>
                    <input value={txForm.source} onChange={e => setTxForm(f => ({ ...f, source: e.target.value }))}
                      placeholder="Название организации, системы"
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                  <button onClick={saveTx} disabled={saving || !txForm.account_id || !txForm.amount}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-40"
                    style={{ background: G("#00ff87, #3b82f6"), color: "black" }}>
                    {saving ? "Сохраняю..." : "Записать транзакцию"}
                  </button>
                </>
              )}

              {/* ADD RULE */}
              {modal === "rule" && (
                <>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Название правила *</label>
                    <input value={ruleForm.name} onChange={e => setRuleForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Резервный фонд"
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Счёт назначения *</label>
                    <select value={ruleForm.account_id} onChange={e => setRuleForm(f => ({ ...f, account_id: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <option value="" style={{ background: "#0d1220" }}>— выберите счёт —</option>
                      {accounts.map(a => <option key={a.id} value={a.id} style={{ background: "#0d1220" }}>{a.label || a.owner_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Процент от поступлений *</label>
                    <input value={ruleForm.percent} onChange={e => setRuleForm(f => ({ ...f, percent: e.target.value }))}
                      type="number" min="0" max="100" placeholder="20"
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    <div className="text-white/30 text-xs mt-1">Текущая сумма: {totalDistrib}% + {ruleForm.percent || 0}% = {totalDistrib + (parseFloat(ruleForm.percent) || 0)}%</div>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Описание</label>
                    <input value={ruleForm.description} onChange={e => setRuleForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Назначение правила"
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                  <button onClick={saveRule} disabled={saving || !ruleForm.name || !ruleForm.account_id || !ruleForm.percent}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-40"
                    style={{ background: G("#00ff87, #3b82f6"), color: "black" }}>
                    {saving ? "Сохраняю..." : "Добавить правило"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
