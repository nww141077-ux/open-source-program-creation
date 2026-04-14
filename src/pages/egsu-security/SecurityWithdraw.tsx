import Icon from "@/components/ui/icon";

const G = (s: string) => `linear-gradient(135deg, ${s})`;

type Account = { id: number; owner_name: string; account_number: string; label: string; bank_name: string; currency: string; balance: number; account_type: string };
type Withdrawal = { id: number; amount: number; currency: string; description: string; status: string; from_label: string; from_balance: number; to_label: string; to_number: string; to_account_details: Record<string,string>; confirmed_at: string; executed_at: string; created_at: string };
type Stats = { absorption_balance_usd: number; [key: string]: unknown };

type WForm = {
  to_account_id: string;
  amount: string;
  description: string;
  ext_owner: string;
  ext_bank: string;
  ext_account: string;
  ext_currency: string;
};

type Props = {
  stats: Stats | null;
  accounts: Account[];
  withdrawals: Withdrawal[];
  wMode: "internal" | "external";
  setWMode: (m: "internal" | "external") => void;
  wForm: WForm;
  setWForm: (f: WForm) => void;
  saving: boolean;
  onCreateWithdrawal: () => void;
  onAutoWithdraw: (toAccountId?: number, toDetails?: Record<string, string>) => void;
  onConfirm: (id: number) => void;
  onExecute: (id: number) => void;
  fmt: (n: number) => string;
};

export default function SecurityWithdraw({
  stats, accounts, withdrawals,
  wMode, setWMode, wForm, setWForm,
  saving, onCreateWithdrawal, onAutoWithdraw, onConfirm, onExecute, fmt,
}: Props) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white uppercase">Вывод средств</h1>
        <p className="text-white/30 text-sm mt-1">Перевод со счёта Поглощения на ваш официальный счёт</p>
      </div>

      {/* АВТО-ВЫВОД */}
      {stats && stats.absorption_balance_usd > 0 && accounts.length > 0 && (
        <div className="mb-6 p-5 rounded-2xl"
          style={{ background: "rgba(0,255,135,0.06)", border: "2px solid rgba(0,255,135,0.25)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(0,255,135,0.15)" }}>
              <Icon name="Zap" size={18} style={{ color: "#00ff87" }} />
            </div>
            <div>
              <div className="text-white font-bold">Авто-вывод штрафов</div>
              <div className="text-white/40 text-xs">Мгновенный перевод всего баланса поглощения</div>
            </div>
            <div className="ml-auto font-bold text-lg" style={{ color: "#00ff87" }}>{fmt(stats.absorption_balance_usd)}</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {accounts.map(a => (
              <button key={a.id} onClick={() => onAutoWithdraw(a.id)}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 disabled:opacity-40"
                style={{ background: "rgba(0,255,135,0.15)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.3)" }}>
                <Icon name="ArrowDownToLine" size={14} />
                На: {a.label || a.owner_name}
              </button>
            ))}
          </div>
          <p className="text-white/25 text-xs mt-2">
            Средства мгновенно зачисляются без ожидания подтверждения
          </p>
        </div>
      )}

      {stats && (
        <div className="mb-6 p-5 rounded-2xl flex items-center justify-between"
          style={{ background: "rgba(245,158,11,0.08)", border: "2px solid rgba(245,158,11,0.25)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(245,158,11,0.15)" }}>
              <Icon name="Vault" size={18} style={{ color: "#f59e0b" }} />
            </div>
            <div>
              <div className="text-white/50 text-xs">Счёт поглощения · EGSU-ABS-9999</div>
              <div className="font-bold text-xl" style={{ color: "#f59e0b" }}>{fmt(stats.absorption_balance_usd)}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white/30 text-xs">Доступно к выводу</div>
            <div className="font-bold text-lg" style={{ color: "#00ff87" }}>{fmt(stats.absorption_balance_usd)}</div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl space-y-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="font-bold text-white mb-2">Новый вывод</div>

          <div>
            <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Счёт получателя</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "internal", label: "Внутренний счёт", icon: "Server" },
                { id: "external", label: "Внешний счёт", icon: "Building2" },
              ].map(m => (
                <button key={m.id} onClick={() => setWMode(m.id as "internal" | "external")}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all"
                  style={{
                    background: wMode === m.id ? "rgba(0,255,135,0.12)" : "rgba(255,255,255,0.04)",
                    color: wMode === m.id ? "#00ff87" : "rgba(255,255,255,0.4)",
                    border: `1px solid ${wMode === m.id ? "rgba(0,255,135,0.3)" : "rgba(255,255,255,0.08)"}`,
                  }}>
                  <Icon name={m.icon as "Server"} size={14} />
                  <span className="text-xs">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {wMode === "internal" ? (
            <div>
              <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Счёт назначения *</label>
              <select value={wForm.to_account_id} onChange={e => setWForm({ ...wForm, to_account_id: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <option value="" style={{ background: "#0d1220" }}>— выберите счёт —</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id} style={{ background: "#0d1220" }}>
                    {a.label || a.owner_name} · {a.account_number} · {new Intl.NumberFormat("ru-RU", { style: "currency", currency: a.currency, maximumFractionDigits: 0 }).format(a.balance)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Владелец счёта *</label>
                <input value={wForm.ext_owner} onChange={e => setWForm({ ...wForm, ext_owner: e.target.value })}
                  placeholder="Иван Иванов / ООО Компания"
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Банк / Платформа</label>
                <input value={wForm.ext_bank} onChange={e => setWForm({ ...wForm, ext_bank: e.target.value })}
                  placeholder="Сбербанк / SWIFT / Binance"
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Номер счёта / IBAN / Адрес кошелька *</label>
                <input value={wForm.ext_account} onChange={e => setWForm({ ...wForm, ext_account: e.target.value })}
                  placeholder="40817810... / GB29NWBK... / 0x..."
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm font-mono outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Валюта вывода</label>
                <select value={wForm.ext_currency} onChange={e => setWForm({ ...wForm, ext_currency: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {["USD","EUR","RUB","CNY","USDT","BTC","ETH"].map(c => (
                    <option key={c} value={c} style={{ background: "#0d1220" }}>{c}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Сумма (USD) *</label>
            <input value={wForm.amount} onChange={e => setWForm({ ...wForm, amount: e.target.value })}
              type="number" min="1" placeholder="1000"
              className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
            {stats && wForm.amount && parseFloat(wForm.amount) > stats.absorption_balance_usd && (
              <div className="text-red-400 text-xs mt-1">Превышает доступный баланс {fmt(stats.absorption_balance_usd)}</div>
            )}
          </div>

          <div>
            <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Назначение платежа</label>
            <input value={wForm.description} onChange={e => setWForm({ ...wForm, description: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>

          <button onClick={onCreateWithdrawal}
            disabled={saving || !wForm.amount || parseFloat(wForm.amount) <= 0 ||
              (wMode === "internal" && !wForm.to_account_id) ||
              (wMode === "external" && (!wForm.ext_owner || !wForm.ext_account))}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-40"
            style={{ background: G("#00ff87, #3b82f6"), color: "black" }}>
            {saving ? "Создаю заявку..." : "Создать заявку на вывод"}
          </button>
        </div>

        <div>
          <div className="font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="ClockArrowUp" size={16} className="text-white/40" />
            История выводов ({withdrawals.length})
          </div>
          <div className="space-y-3">
            {withdrawals.map(w => {
              const statusColors: Record<string, string> = { pending: "#f59e0b", confirmed: "#3b82f6", executed: "#00ff87", failed: "#f43f5e" };
              const statusLabels: Record<string, string> = { pending: "Ожидает", confirmed: "Подтверждена", executed: "Исполнена", failed: "Ошибка" };
              const sc = statusColors[w.status] ?? "#888";
              return (
                <div key={w.id} className="p-4 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${sc}20` }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">#{w.id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                          style={{ background: `${sc}18`, color: sc }}>
                          {statusLabels[w.status] ?? w.status}
                        </span>
                      </div>
                      <div className="text-white/40 text-xs mt-0.5">{w.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold" style={{ color: sc }}>{fmt(w.amount)}</div>
                      <div className="text-white/25 text-[10px]">{new Date(w.created_at).toLocaleDateString("ru-RU")}</div>
                    </div>
                  </div>
                  <div className="text-white/30 text-xs space-y-0.5">
                    <div>Со счёта: {w.from_label}</div>
                    {w.to_label
                      ? <div>На счёт: {w.to_label} ({w.to_number})</div>
                      : w.to_account_details && (
                        <div>На: {w.to_account_details.owner} · {w.to_account_details.bank} · {w.to_account_details.account}</div>
                      )
                    }
                  </div>
                  <div className="flex gap-2 mt-3">
                    {w.status === "pending" && (
                      <button onClick={() => onConfirm(w.id)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                        style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)" }}>
                        Подтвердить
                      </button>
                    )}
                    {w.status === "confirmed" && (
                      <button onClick={() => onExecute(w.id)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                        style={{ background: "rgba(0,255,135,0.15)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.3)" }}>
                        Исполнить перевод
                      </button>
                    )}
                    {w.status === "executed" && (
                      <div className="flex items-center gap-1 text-xs text-green-400/60">
                        <Icon name="CheckCircle" size={13} />
                        Исполнено {w.executed_at ? new Date(w.executed_at).toLocaleString("ru-RU") : ""}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {withdrawals.length === 0 && (
              <div className="text-center py-12 text-white/20">
                <Icon name="ArrowUpFromLine" size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Выводов ещё не было</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}