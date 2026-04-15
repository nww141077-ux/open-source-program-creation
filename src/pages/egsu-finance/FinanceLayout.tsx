import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const G = (s: string) => `linear-gradient(135deg, ${s})`;

type Tab = "overview" | "accounts" | "cards" | "transactions" | "rules";

type Account = { id: number; owner_name: string; account_type: string; account_number: string; bank_name: string; currency: string; label: string; is_active: boolean; is_primary: boolean; distribution_percent: number; balance: number; created_at: string; cards_count: number };

const TYPE_ICONS: Record<string, string> = { bank: "Building2", card: "CreditCard", crypto: "Coins", system: "Server" };
const TYPE_LABELS: Record<string, string> = { bank: "Банковский счёт", card: "Карточный счёт", crypto: "Крипто-кошелёк", system: "Системный счёт" };
const TYPE_COLORS: Record<string, string> = { bank: "#3b82f6", card: "#a855f7", crypto: "#f59e0b", system: "#00ff87" };
const CARD_COLORS: Record<string, string> = { visa: "#1a56db", mastercard: "#f43f5e", mir: "#00aa44", crypto: "#f59e0b" };
const TX_LABELS: Record<string, string> = { income: "Поступление", outcome: "Расход", distribution: "Распределение", transfer: "Перевод" };
const TX_COLORS: Record<string, string> = { income: "#00ff87", outcome: "#f43f5e", distribution: "#a855f7", transfer: "#3b82f6" };
const TX_ICONS: Record<string, string> = { income: "ArrowDownLeft", outcome: "ArrowUpRight", distribution: "GitFork", transfer: "ArrowLeftRight" };

type AccForm = { owner_name: string; account_type: string; account_number: string; bank_name: string; currency: string; label: string; distribution_percent: string };
type CardForm = { account_id: string; card_holder: string; card_last4: string; card_type: string; expiry_month: string; expiry_year: string };
type TxForm = { account_id: string; tx_type: string; amount: string; currency: string; description: string; source: string };
type RuleForm = { name: string; account_id: string; percent: string; description: string };

type Props = {
  tab: Tab;
  setTab: (t: Tab) => void;
  accounts: Account[];
  stats: { accounts: number; cards: number; total_income_usd: number; total_outcome_usd: number } | null;
  toast: string;
  modal: "account" | "card" | "transaction" | "rule" | null;
  setModal: (m: "account" | "card" | "transaction" | "rule" | null) => void;
  saving: boolean;
  accForm: AccForm; setAccForm: (f: AccForm) => void; saveAccount: () => void;
  cardForm: CardForm; setCardForm: (f: CardForm) => void; saveCard: () => void;
  txForm: TxForm; setTxForm: (f: TxForm) => void; saveTx: () => void;
  ruleForm: RuleForm; setRuleForm: (f: RuleForm) => void; saveRule: () => void;
  totalDistrib: number;
  fmt: (n: number, cur?: string) => string;
  children: React.ReactNode;
};

function fmt(n: number, cur = "USD") {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);
}

export default function FinanceLayout({
  tab, setTab, accounts, stats, toast,
  modal, setModal, saving,
  accForm, setAccForm, saveAccount,
  cardForm, setCardForm, saveCard,
  txForm, setTxForm, saveTx,
  ruleForm, setRuleForm, saveRule,
  totalDistrib,
  children,
}: Props) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen font-body" style={{ background: "#060a12" }}>

      {toast && (
        <div className="fixed top-20 right-6 z-[100] px-4 py-3 rounded-xl text-sm font-semibold shadow-xl animate-fade-up"
          style={{ background: toast.startsWith("Ошибка") ? "rgba(244,63,94,0.9)" : "rgba(0,255,135,0.9)", color: "black" }}>
          {toast}
        </div>
      )}

      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-3"
        style={{ background: "rgba(6,10,18,0.97)", borderBottom: "1px solid rgba(0,255,135,0.15)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/ezsu/dashboard")} className="text-white/40 hover:text-white/70 transition-colors">
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
          <a
            href="https://m.dzen.ru/id/63dca6f0b2189a531c500a7b?donate=true"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "black", textDecoration: "none" }}>
            <Icon name="Heart" size={13} />
            <span className="hidden md:inline">Поддержать</span>
          </a>
          <button onClick={() => setModal("transaction")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
            style={{ background: G("#00ff87, #3b82f6"), color: "black" }}>
            <Icon name="Plus" size={13} />
            <span className="hidden md:inline">Транзакция</span>
          </button>
        </div>
      </nav>

      <div className="pt-14 flex min-h-screen">
        <aside className="fixed left-0 top-14 bottom-0 w-14 md:w-56 flex flex-col py-4 gap-1 px-2 overflow-y-auto"
          style={{ background: "rgba(6,10,18,0.95)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
          {[
            { id: "overview",      icon: "LayoutDashboard", label: "Обзор" },
            { id: "accounts",      icon: "Building2",       label: `Счета (${accounts.length})` },
            { id: "cards",         icon: "CreditCard",      label: `Карты` },
            { id: "transactions",  icon: "ArrowLeftRight",  label: "Транзакции" },
            { id: "rules",         icon: "GitFork",         label: "Распределение" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as Tab)}
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

        <main className="flex-1 ml-14 md:ml-56 p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* MODALS */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: "#0d1220", border: "1px solid rgba(255,255,255,0.12)" }}>

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
                        <button key={k} onClick={() => setAccForm({ ...accForm, account_type: k })}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
                          style={{ background: accForm.account_type === k ? `${TYPE_COLORS[k]}20` : "rgba(255,255,255,0.04)", color: accForm.account_type === k ? TYPE_COLORS[k] : "rgba(255,255,255,0.4)", border: `1px solid ${accForm.account_type === k ? TYPE_COLORS[k] + "40" : "rgba(255,255,255,0.08)"}` }}>
                          <Icon name={TYPE_ICONS[k] as "Wallet"} size={14} />
                          <span className="text-xs">{v}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {[
                    { key: "owner_name",     label: "Владелец / Название *",         ph: "Иван Иванов / ООО Компания" },
                    { key: "label",          label: "Метка (для отображения)",        ph: "Основной счёт" },
                    { key: "bank_name",      label: "Банк / Платформа",              ph: "Сбербанк / Binance" },
                    { key: "account_number", label: "Номер счёта / IBAN / Адрес",    ph: "40817810..." },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">{f.label}</label>
                      <input value={(accForm as Record<string,string>)[f.key]} onChange={e => setAccForm({ ...accForm, [f.key]: e.target.value })}
                        placeholder={f.ph}
                        className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Валюта</label>
                      <select value={accForm.currency} onChange={e => setAccForm({ ...accForm, currency: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        {["RUB","USD","EUR","CNY","BTC","ETH","USDT"].map(c => <option key={c} value={c} style={{ background: "#0d1220" }}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">% распределения</label>
                      <input value={accForm.distribution_percent} onChange={e => setAccForm({ ...accForm, distribution_percent: e.target.value })}
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
                    <select value={cardForm.account_id} onChange={e => setCardForm({ ...cardForm, account_id: e.target.value })}
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
                        <button key={ct} onClick={() => setCardForm({ ...cardForm, card_type: ct })}
                          className="flex-1 py-2 rounded-xl text-xs font-bold transition-all uppercase"
                          style={{ background: cardForm.card_type === ct ? `${CARD_COLORS[ct]}30` : "rgba(255,255,255,0.04)", color: cardForm.card_type === ct ? CARD_COLORS[ct] : "rgba(255,255,255,0.3)", border: `1px solid ${cardForm.card_type === ct ? CARD_COLORS[ct] + "50" : "rgba(255,255,255,0.08)"}` }}>
                          {ct}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Имя держателя *</label>
                    <input value={cardForm.card_holder} onChange={e => setCardForm({ ...cardForm, card_holder: e.target.value })}
                      placeholder="IVAN IVANOV" className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none uppercase"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Последние 4 цифры *</label>
                    <input value={cardForm.card_last4} onChange={e => setCardForm({ ...cardForm, card_last4: e.target.value.replace(/\D/g,"").slice(0,4) })}
                      placeholder="1234" maxLength={4}
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none font-mono tracking-widest"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Месяц</label>
                      <input value={cardForm.expiry_month} onChange={e => setCardForm({ ...cardForm, expiry_month: e.target.value })}
                        type="number" min="1" max="12" placeholder="12"
                        className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                    <div>
                      <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Год</label>
                      <input value={cardForm.expiry_year} onChange={e => setCardForm({ ...cardForm, expiry_year: e.target.value })}
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
                    <select value={txForm.account_id} onChange={e => setTxForm({ ...txForm, account_id: e.target.value })}
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
                        <button key={k} onClick={() => setTxForm({ ...txForm, tx_type: k })}
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
                      <input value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                        type="number" min="0" placeholder="10000"
                        className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                    <div>
                      <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Валюта</label>
                      <select value={txForm.currency} onChange={e => setTxForm({ ...txForm, currency: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        {["RUB","USD","EUR","CNY","USDT"].map(c => <option key={c} value={c} style={{ background: "#0d1220" }}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Описание</label>
                    <input value={txForm.description} onChange={e => setTxForm({ ...txForm, description: e.target.value })}
                      placeholder="Назначение платежа"
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Источник / Плательщик</label>
                    <input value={txForm.source} onChange={e => setTxForm({ ...txForm, source: e.target.value })}
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
                    <input value={ruleForm.name} onChange={e => setRuleForm({ ...ruleForm, name: e.target.value })}
                      placeholder="Резервный фонд"
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Счёт назначения *</label>
                    <select value={ruleForm.account_id} onChange={e => setRuleForm({ ...ruleForm, account_id: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <option value="" style={{ background: "#0d1220" }}>— выберите счёт —</option>
                      {accounts.map(a => <option key={a.id} value={a.id} style={{ background: "#0d1220" }}>{a.label || a.owner_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Процент от поступлений *</label>
                    <input value={ruleForm.percent} onChange={e => setRuleForm({ ...ruleForm, percent: e.target.value })}
                      type="number" min="0" max="100" placeholder="20"
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    <div className="text-white/30 text-xs mt-1">Текущая сумма: {totalDistrib}% + {ruleForm.percent || 0}% = {totalDistrib + (parseFloat(ruleForm.percent) || 0)}%</div>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Описание</label>
                    <input value={ruleForm.description} onChange={e => setRuleForm({ ...ruleForm, description: e.target.value })}
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