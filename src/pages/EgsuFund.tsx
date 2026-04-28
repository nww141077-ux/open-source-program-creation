/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const FINANCE_API = "https://functions.poehali.dev/e610af8a-f8c5-4c04-8d9b-092391fb0c70";

const SOURCE_TYPES = [
  { code: "grant", label: "Грант", color: "#10b981", icon: "Award" },
  { code: "partner", label: "Партнёрский взнос", color: "#3b82f6", icon: "Handshake" },
  { code: "subscription", label: "Подписка пользователей", color: "#a855f7", icon: "Users" },
  { code: "own", label: "Собственные средства", color: "#f59e0b", icon: "Wallet" },
  { code: "donation", label: "Пожертвование", color: "#ec4899", icon: "Heart" },
  { code: "other", label: "Прочее", color: "#6b7280", icon: "MoreHorizontal" },
];

const EXPENSE_CATEGORIES = [
  { code: "ai_api", label: "Оплата ИИ-API", color: "#a855f7", icon: "Brain" },
  { code: "datasets", label: "Датасеты", color: "#3b82f6", icon: "Database" },
  { code: "compute", label: "Вычисления", color: "#06b6d4", icon: "Server" },
  { code: "research", label: "Исследования", color: "#10b981", icon: "FlaskConical" },
  { code: "development", label: "Разработка", color: "#f59e0b", icon: "Code2" },
  { code: "legal", label: "Юридическое", color: "#ec4899", icon: "Scale" },
  { code: "other", label: "Прочее", color: "#6b7280", icon: "MoreHorizontal" },
];

const TAX_MODES = [
  { code: "ndfl", label: "НДФЛ (13%)", default_rate: 13 },
  { code: "usn", label: "УСН (6%)", default_rate: 6 },
  { code: "self_employed_fl", label: "Самозанятый — физлица (4%)", default_rate: 4 },
  { code: "self_employed_ul", label: "Самозанятый — юрлица (6%)", default_rate: 6 },
  { code: "custom", label: "Иная ставка", default_rate: 0 },
];

const MOY_NALOG_STEPS = [
  {
    n: "1", title: "Скачайте приложение «Мой налог»",
    desc: "Официальное приложение ФНС России для самозанятых. Доступно в App Store и Google Play.",
    links: [
      { label: "App Store (iPhone)", url: "https://apps.apple.com/ru/app/мой-налог/id1437518854", icon: "Smartphone" },
      { label: "Google Play (Android)", url: "https://play.google.com/store/apps/details?id=com.gnivts.selfemployed", icon: "Smartphone" },
      { label: "Веб-версия ФНС", url: "https://lknpd.nalog.ru", icon: "Globe" },
    ],
    color: "#3b82f6",
  },
  {
    n: "2", title: "Зарегистрируйтесь как самозанятый",
    desc: "Через приложение по паспорту или через Госуслуги. Регистрация занимает 3–5 минут. ИНН не нужен отдельно — система найдёт автоматически.",
    links: [
      { label: "Госуслуги — регистрация самозанятого", url: "https://www.gosuslugi.ru/self-employed", icon: "FileText" },
    ],
    color: "#10b981",
  },
  {
    n: "3", title: "Привяжите деятельность ECSU",
    desc: "При регистрации укажите вид деятельности: «Консультационные услуги», «Разработка программного обеспечения» или «Научно-исследовательская деятельность».",
    links: [],
    color: "#a855f7",
  },
  {
    n: "4", title: "Формируйте чеки на поступления",
    desc: "Каждое поступление в Фонд ДАЛАН оформляйте чеком в «Мой налог». Налог 4% (от физлиц) или 6% (от юрлиц и ИП) — вместо НДФЛ 13%.",
    links: [],
    color: "#f59e0b",
  },
  {
    n: "5", title: "Внесите ИНН в систему EGSU",
    desc: "После регистрации внесите ваш ИНН в настройки фонда для корректного расчёта налогов.",
    links: [],
    color: "#06b6d4",
  },
];

const ECSU_ACTIVITIES = [
  { code: "software", label: "Разработка ПО и ИИ-систем", rate_fl: 4, rate_ul: 6 },
  { code: "consulting", label: "Консультационные услуги", rate_fl: 4, rate_ul: 6 },
  { code: "research", label: "Научно-исследовательская деятельность", rate_fl: 4, rate_ul: 6 },
  { code: "analytics", label: "Аналитические услуги", rate_fl: 4, rate_ul: 6 },
  { code: "education", label: "Образовательные услуги", rate_fl: 4, rate_ul: 6 },
];

type Tab = "overview" | "income" | "withdrawals" | "expenses" | "tax" | "settings";

interface Summary {
  total_income: number; total_taxes_paid: number; total_net: number;
  owner_share_total: number; dev_share_total: number;
  total_withdrawn: number; total_expenses: number;
  balance_owner: number; balance_dev: number;
  pending_withdrawals: number; pending_expenses: number;
}

interface Config {
  fund_name: string; fund_status: string; founder: string; jurisdiction: string;
  tax_mode: string; tax_rate_percent: number;
  owner_share_percent: number; dev_share_percent: number;
  owner_card_last4: string | null; owner_bank: string | null; description: string;
}

interface Income {
  id: number; source_type: string; source_name: string; amount: number;
  description: string; status: string; created_at: string;
  tax_amount?: number; net_amount?: number; owner_amount?: number; dev_amount?: number;
}

interface Withdrawal {
  id: number; withdrawal_type: string; amount: number; destination: string;
  description: string; status: string; requested_at: string; notes: string;
}

interface Expense {
  id: number; category: string; item_name: string; amount: number;
  description: string; status: string; created_at: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(n);
}

export default function EgsuFund() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [income, setIncome] = useState<Income[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  // Формы
  const [incomeForm, setIncomeForm] = useState({ source_type: "grant", source_name: "", amount: "", description: "" });
  const [wdForm, setWdForm] = useState({ amount: "", destination: "", description: "" });
  const [expForm, setExpForm] = useState({ category: "ai_api", item_name: "", amount: "", description: "" });
  const [cfgForm, setCfgForm] = useState<Partial<Config>>({});

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  async function safeGet(url: string) {
    try {
      const r = await fetch(url);
      const d = await r.json();
      return typeof d === "string" ? JSON.parse(d) : d;
    } catch { return null; }
  }

  async function load() {
    setLoading(true);
    const d = await safeGet(`${FINANCE_API}/fund`);
    if (d) {
      setSummary(d.summary);
      setConfig(d.config);
      setCfgForm(d.config || {});
    }
    setLoading(false);
  }

  async function loadIncome() {
    const d = await safeGet(`${FINANCE_API}/fund/income`);
    if (d) setIncome(d.income || []);
  }

  async function loadWithdrawals() {
    const d = await safeGet(`${FINANCE_API}/fund/withdrawals`);
    if (d) setWithdrawals(d.withdrawals || []);
  }

  async function loadExpenses() {
    const d = await safeGet(`${FINANCE_API}/fund/expenses`);
    if (d) setExpenses(d.expenses || []);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (tab === "income") loadIncome();
    if (tab === "withdrawals") loadWithdrawals();
    if (tab === "expenses") loadExpenses();
  }, [tab]);

  async function addIncome() {
    if (!incomeForm.source_name || !incomeForm.amount) return;
    setSaving(true);
    try {
      const r = await fetch(`${FINANCE_API}/fund/income`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...incomeForm, amount: parseFloat(incomeForm.amount) })
      });
      const d = await r.json();
      const p = typeof d === "string" ? JSON.parse(d) : d;
      showToast(`✓ Поступление зарегистрировано. Налог: ${fmt(p.distribution?.tax || 0)} ₽, Вам: ${fmt(p.distribution?.owner || 0)} ₽`);
      setIncomeForm({ source_type: "grant", source_name: "", amount: "", description: "" });
      loadIncome(); load();
    } catch (_e) { console.error(_e); } finally { setSaving(false); }
  }

  async function addWithdrawal() {
    if (!wdForm.amount) return;
    setSaving(true);
    try {
      await fetch(`${FINANCE_API}/fund/withdrawals`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...wdForm, amount: parseFloat(wdForm.amount), withdrawal_type: "owner" })
      });
      showToast("✓ Заявка на вывод создана. Ожидает вашего подтверждения.");
      setWdForm({ amount: "", destination: "", description: "" });
      loadWithdrawals(); load();
    } catch (_e) { console.error(_e); } finally { setSaving(false); }
  }

  async function approveWithdrawal(id: number, status: "approved" | "rejected") {
    await fetch(`${FINANCE_API}/fund/withdrawals`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    showToast(status === "approved" ? "✓ Вывод подтверждён" : "Вывод отклонён");
    loadWithdrawals(); load();
  }

  async function addExpense() {
    if (!expForm.item_name || !expForm.amount) return;
    setSaving(true);
    try {
      await fetch(`${FINANCE_API}/fund/expenses`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...expForm, amount: parseFloat(expForm.amount) })
      });
      showToast("✓ Расход зарегистрирован. Ожидает подтверждения.");
      setExpForm({ category: "ai_api", item_name: "", amount: "", description: "" });
      loadExpenses(); load();
    } catch (_e) { console.error(_e); } finally { setSaving(false); }
  }

  async function approveExpense(id: number, status: "approved" | "rejected") {
    await fetch(`${FINANCE_API}/fund/expenses`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    showToast(status === "approved" ? "✓ Расход утверждён" : "Расход отклонён");
    loadExpenses(); load();
  }

  async function saveConfig() {
    setSaving(true);
    try {
      await fetch(`${FINANCE_API}/fund`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfgForm)
      });
      showToast("✓ Настройки фонда сохранены");
      load();
    } catch (_e) { console.error(_e); } finally { setSaving(false); }
  }

  const [taxCalcAmount, setTaxCalcAmount] = useState("");
  const [taxCalcType, setTaxCalcType] = useState<"fl" | "ul">("fl");

  const TABS: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: "overview", label: "Обзор", icon: "LayoutDashboard" },
    { id: "income", label: "Поступления", icon: "TrendingUp" },
    { id: "withdrawals", label: "Выводы", icon: "CreditCard", badge: summary?.pending_withdrawals },
    { id: "expenses", label: "Расходы", icon: "Receipt", badge: summary?.pending_expenses },
    { id: "tax", label: "Мой налог", icon: "FileCheck" },
    { id: "settings", label: "Настройки", icon: "Settings" },
  ];

  return (
    <div className="min-h-screen font-body" style={{ background: "#060a12" }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl"
          style={{ background: "rgba(0,255,135,0.12)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.3)" }}>
          {toast}
        </div>
      )}

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 md:px-8 py-3"
        style={{ background: "rgba(6,10,18,0.97)", borderBottom: "1px solid rgba(16,185,129,0.15)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/egsu")} className="text-white/40 hover:text-white/70 transition-colors">
            <Icon name="ChevronLeft" size={16} />
          </button>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)" }}>
            <Icon name="Landmark" size={14} className="text-black" />
          </div>
          <div>
            <div className="font-display text-base font-bold text-white tracking-wide leading-none">
              {config?.fund_name || "ФОНД ДАЛАН"}
            </div>
            <div className="text-white/30 text-[10px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#f59e0b" }} />
              Экспериментальный проект · В разработке
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(summary?.pending_withdrawals ?? 0) + (summary?.pending_expenses ?? 0) > 0 && (
            <div className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
              {(summary?.pending_withdrawals ?? 0) + (summary?.pending_expenses ?? 0)} ожид.
            </div>
          )}
        </div>
      </nav>

      <div className="pt-16 pb-8">
        {/* Предупреждение об эксперименте */}
        <div className="mx-4 md:mx-8 mt-4 mb-2 px-4 py-3 rounded-2xl text-xs flex items-start gap-2"
          style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" }}>
          <Icon name="FlaskConical" size={14} className="shrink-0 mt-0.5" />
          <span>
            <strong>Экспериментальный проект в стадии разработки.</strong> Учёт носит информационный характер.
            Реальные выплаты осуществляются вне системы через официальные банковские каналы.
            Все операции требуют ручного подтверждения.
          </span>
        </div>

        {/* Вкладки */}
        <div className="flex gap-1 px-4 md:px-8 mt-4 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all relative shrink-0"
              style={tab === t.id
                ? { background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }
                : { background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Icon name={t.icon as any} size={13} />
              {t.label}
              {t.badge ? (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{ background: "#f59e0b", color: "#000" }}>{t.badge}</span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="px-4 md:px-8 mt-5 max-w-4xl">
          {loading && <div className="text-white/30 text-center py-12">Загрузка...</div>}

          {/* ОБЗОР */}
          {!loading && tab === "overview" && summary && (
            <div className="space-y-4">
              {/* Карточки */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Всего поступило", value: `${fmt(summary.total_income)} ₽`, color: "#10b981", icon: "TrendingUp" },
                  { label: "Уплачено налогов", value: `${fmt(summary.total_taxes_paid)} ₽`, color: "#f59e0b", icon: "Receipt" },
                  { label: "Ваш остаток (51%)", value: `${fmt(summary.balance_owner)} ₽`, color: "#00ff87", icon: "Wallet" },
                  { label: "На разработку (49%)", value: `${fmt(summary.balance_dev)} ₽`, color: "#3b82f6", icon: "Code2" },
                ].map(c => (
                  <div key={c.label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name={c.icon as any} size={14} style={{ color: c.color }} />
                      <span className="text-white/40 text-xs">{c.label}</span>
                    </div>
                    <div className="text-xl font-bold" style={{ color: c.color }}>{c.value}</div>
                  </div>
                ))}
              </div>

              {/* Схема распределения */}
              <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="text-white/50 text-xs uppercase tracking-widest mb-4">Схема распределения</div>
                <div className="flex items-center gap-2 text-sm text-white/70 mb-3">
                  <span className="font-bold text-white">100% поступление</span>
                  <Icon name="ArrowRight" size={14} />
                  <span style={{ color: "#f59e0b" }}>− {config?.tax_rate_percent ?? 13}% налог ({TAX_MODES.find(t => t.code === config?.tax_mode)?.label || "НДФЛ"})</span>
                  <Icon name="ArrowRight" size={14} />
                  <span style={{ color: "#00ff87" }}>Чистые средства</span>
                </div>
                <div className="h-6 rounded-xl overflow-hidden flex mb-3">
                  <div style={{ width: `${config?.tax_rate_percent ?? 13}%`, background: "#f59e0b" }} className="flex items-center justify-center text-[10px] font-bold text-black">
                    {config?.tax_rate_percent ?? 13}%
                  </div>
                  <div style={{ width: `${((100 - (config?.tax_rate_percent ?? 13)) * (config?.owner_share_percent ?? 51) / 100).toFixed(1)}%`, background: "#00ff87" }}
                    className="flex items-center justify-center text-[10px] font-bold text-black">
                    {((100 - (config?.tax_rate_percent ?? 13)) * (config?.owner_share_percent ?? 51) / 100).toFixed(0)}%
                  </div>
                  <div style={{ flex: 1, background: "#3b82f6" }} className="flex items-center justify-center text-[10px] font-bold text-white">
                    {((100 - (config?.tax_rate_percent ?? 13)) * (config?.dev_share_percent ?? 49) / 100).toFixed(0)}%
                  </div>
                </div>
                <div className="flex gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "#f59e0b" }} />Налог</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "#00ff87" }} />Николаев В.В. ({config?.owner_share_percent ?? 51}%)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "#3b82f6" }} />Разработка ({config?.dev_share_percent ?? 49}%)</span>
                </div>
              </div>

              {/* Ожидающие действия */}
              {((summary.pending_withdrawals ?? 0) + (summary.pending_expenses ?? 0)) > 0 && (
                <div className="rounded-2xl p-4" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <div className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                    <Icon name="AlertCircle" size={16} style={{ color: "#f59e0b" }} />
                    Ожидают вашего подтверждения
                  </div>
                  <div className="flex gap-3 text-xs">
                    {summary.pending_withdrawals > 0 && (
                      <button onClick={() => setTab("withdrawals")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all"
                        style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                        <Icon name="CreditCard" size={11} />
                        {summary.pending_withdrawals} вывода
                      </button>
                    )}
                    {summary.pending_expenses > 0 && (
                      <button onClick={() => setTab("expenses")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all"
                        style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                        <Icon name="Receipt" size={11} />
                        {summary.pending_expenses} расхода
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Инфо о фонде */}
              {config && (
                <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="text-white/30 text-xs uppercase tracking-widest mb-3">О фонде</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      ["Учредитель", config.founder],
                      ["Юрисдикция", config.jurisdiction],
                      ["Налоговый режим", TAX_MODES.find(t => t.code === config.tax_mode)?.label || config.tax_mode],
                      ["Статус", "Экспериментальный / В разработке"],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div className="text-white/30">{k}</div>
                        <div className="text-white/70 font-medium">{v}</div>
                      </div>
                    ))}
                  </div>
                  {config.description && (
                    <div className="mt-3 text-white/40 text-xs leading-relaxed">{config.description}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ПОСТУПЛЕНИЯ */}
          {tab === "income" && (
            <div className="space-y-4">
              <div className="rounded-2xl p-4" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <div className="text-white/50 text-xs uppercase tracking-widest mb-3">Зарегистрировать поступление</div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {SOURCE_TYPES.map(s => (
                    <button key={s.code} onClick={() => setIncomeForm(f => ({ ...f, source_type: s.code }))}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all"
                      style={{
                        background: incomeForm.source_type === s.code ? `${s.color}15` : "rgba(255,255,255,0.03)",
                        border: `1px solid ${incomeForm.source_type === s.code ? s.color + "40" : "rgba(255,255,255,0.07)"}`,
                        color: incomeForm.source_type === s.code ? s.color : "rgba(255,255,255,0.4)",
                      }}>
                      <Icon name={s.icon as any} size={12} />
                      {s.label}
                    </button>
                  ))}
                </div>
                <input value={incomeForm.source_name} onChange={e => setIncomeForm(f => ({ ...f, source_name: e.target.value }))}
                  placeholder="Источник (название гранта, партнёра...)"
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none mb-2"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                <div className="flex gap-2 mb-2">
                  <input value={incomeForm.amount} onChange={e => setIncomeForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="Сумма (₽)" type="number"
                    className="flex-1 px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  <input value={incomeForm.description} onChange={e => setIncomeForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Комментарий"
                    className="flex-1 px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
                {incomeForm.amount && parseFloat(incomeForm.amount) > 0 && config && (
                  <div className="mb-2 px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)" }}>
                    Налог ({config.tax_rate_percent}%): <strong style={{ color: "#f59e0b" }}>{fmt(parseFloat(incomeForm.amount) * config.tax_rate_percent / 100)} ₽</strong>
                    &nbsp;→&nbsp; Вам (51%): <strong style={{ color: "#00ff87" }}>{fmt((parseFloat(incomeForm.amount) * (1 - config.tax_rate_percent / 100)) * 0.51)} ₽</strong>
                    &nbsp;→&nbsp; Разработка: <strong style={{ color: "#3b82f6" }}>{fmt((parseFloat(incomeForm.amount) * (1 - config.tax_rate_percent / 100)) * 0.49)} ₽</strong>
                  </div>
                )}
                <button onClick={addIncome} disabled={saving || !incomeForm.source_name || !incomeForm.amount}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                  style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
                  {saving ? "Сохранение..." : "Зарегистрировать поступление"}
                </button>
              </div>

              <div className="space-y-2">
                {income.length === 0 && <div className="text-white/25 text-center py-8 text-sm">Поступлений пока нет</div>}
                {income.map(item => {
                  const src = SOURCE_TYPES.find(s => s.code === item.source_type);
                  return (
                    <div key={item.id} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${src?.color || "#6b7280"}15` }}>
                            <Icon name={(src?.icon || "Circle") as any} size={14} style={{ color: src?.color || "#6b7280" }} />
                          </div>
                          <div>
                            <div className="text-white font-semibold text-sm">{item.source_name}</div>
                            <div className="text-white/30 text-xs">{src?.label} · {new Date(item.created_at).toLocaleDateString("ru-RU")}</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-white font-bold">{fmt(item.amount)} ₽</div>
                          {item.owner_amount && <div className="text-xs" style={{ color: "#00ff87" }}>Вам: {fmt(item.owner_amount)} ₽</div>}
                        </div>
                      </div>
                      {item.tax_amount && (
                        <div className="mt-2 flex gap-3 text-xs text-white/40">
                          <span>Налог: <span style={{ color: "#f59e0b" }}>{fmt(item.tax_amount)} ₽</span></span>
                          <span>Чистые: <span className="text-white/60">{fmt(item.net_amount || 0)} ₽</span></span>
                          <span>На разработку: <span style={{ color: "#3b82f6" }}>{fmt(item.dev_amount || 0)} ₽</span></span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ВЫВОДЫ */}
          {tab === "withdrawals" && (
            <div className="space-y-4">
              <div className="rounded-2xl p-4" style={{ background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.2)" }}>
                <div className="text-white/50 text-xs uppercase tracking-widest mb-3">Заявка на личный вывод (51%)</div>
                {summary && <div className="mb-3 text-xs px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)" }}>
                  Доступно к выводу: <strong style={{ color: "#00ff87" }}>{fmt(summary.balance_owner)} ₽</strong>
                </div>}
                <input value={wdForm.amount} onChange={e => setWdForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="Сумма (₽)" type="number"
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none mb-2"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                <input value={wdForm.destination} onChange={e => setWdForm(f => ({ ...f, destination: e.target.value }))}
                  placeholder="Банк / реквизиты (информационно)"
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none mb-2"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                <input value={wdForm.description} onChange={e => setWdForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Назначение платежа"
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none mb-3"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                <button onClick={addWithdrawal} disabled={saving || !wdForm.amount}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                  style={{ background: "rgba(0,255,135,0.12)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.25)" }}>
                  Создать заявку на вывод
                </button>
              </div>

              <div className="space-y-2">
                {withdrawals.length === 0 && <div className="text-white/25 text-center py-8 text-sm">Заявок на вывод нет</div>}
                {withdrawals.map(w => {
                  const statusColor: Record<string, string> = { pending: "#f59e0b", approved: "#00ff87", rejected: "#f43f5e" };
                  const statusLabel: Record<string, string> = { pending: "Ожидает подтверждения", approved: "Подтверждено", rejected: "Отклонено" };
                  return (
                    <div key={w.id} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-white font-bold text-lg">{fmt(w.amount)} ₽</div>
                          <div className="text-white/40 text-xs mt-0.5">{w.destination || "Реквизиты не указаны"}</div>
                          {w.description && <div className="text-white/30 text-xs">{w.description}</div>}
                          <div className="text-white/20 text-xs mt-1">{new Date(w.requested_at).toLocaleDateString("ru-RU")}</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl text-xs font-bold shrink-0"
                          style={{ background: `${statusColor[w.status] || "#6b7280"}15`, color: statusColor[w.status] || "#6b7280" }}>
                          {statusLabel[w.status] || w.status}
                        </span>
                      </div>
                      {w.status === "pending" && (
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => approveWithdrawal(w.id, "approved")}
                            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                            style={{ background: "rgba(0,255,135,0.1)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.2)" }}>
                            Подтвердить вывод
                          </button>
                          <button onClick={() => approveWithdrawal(w.id, "rejected")}
                            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                            style={{ background: "rgba(244,63,94,0.08)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.2)" }}>
                            Отклонить
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* РАСХОДЫ */}
          {tab === "expenses" && (
            <div className="space-y-4">
              <div className="rounded-2xl p-4" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)" }}>
                <div className="text-white/50 text-xs uppercase tracking-widest mb-3">Зарегистрировать расход (49% на разработку)</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                  {EXPENSE_CATEGORIES.map(c => (
                    <button key={c.code} onClick={() => setExpForm(f => ({ ...f, category: c.code }))}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all"
                      style={{
                        background: expForm.category === c.code ? `${c.color}15` : "rgba(255,255,255,0.03)",
                        border: `1px solid ${expForm.category === c.code ? c.color + "40" : "rgba(255,255,255,0.07)"}`,
                        color: expForm.category === c.code ? c.color : "rgba(255,255,255,0.4)",
                      }}>
                      <Icon name={c.icon as any} size={12} />
                      {c.label}
                    </button>
                  ))}
                </div>
                <input value={expForm.item_name} onChange={e => setExpForm(f => ({ ...f, item_name: e.target.value }))}
                  placeholder="Название (OpenAI API, датасет, сервер...)"
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none mb-2"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                <div className="flex gap-2 mb-3">
                  <input value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="Сумма (₽)" type="number"
                    className="flex-1 px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  <input value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Описание"
                    className="flex-1 px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
                <button onClick={addExpense} disabled={saving || !expForm.item_name || !expForm.amount}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                  style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.25)" }}>
                  Зарегистрировать расход
                </button>
              </div>

              <div className="space-y-2">
                {expenses.length === 0 && <div className="text-white/25 text-center py-8 text-sm">Расходов пока нет</div>}
                {expenses.map(e => {
                  const cat = EXPENSE_CATEGORIES.find(c => c.code === e.category);
                  const statusColor: Record<string, string> = { pending: "#f59e0b", approved: "#00ff87", rejected: "#f43f5e" };
                  return (
                    <div key={e.id} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${cat?.color || "#6b7280"}15` }}>
                            <Icon name={(cat?.icon || "Circle") as any} size={14} style={{ color: cat?.color || "#6b7280" }} />
                          </div>
                          <div>
                            <div className="text-white font-semibold text-sm">{e.item_name}</div>
                            <div className="text-white/30 text-xs">{cat?.label} · {new Date(e.created_at).toLocaleDateString("ru-RU")}</div>
                            {e.description && <div className="text-white/25 text-xs">{e.description}</div>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-white font-bold">{fmt(e.amount)} ₽</div>
                          <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: `${statusColor[e.status] || "#6b7280"}15`, color: statusColor[e.status] || "#6b7280" }}>
                            {e.status === "pending" ? "Ожидает" : e.status === "approved" ? "Утверждён" : "Отклонён"}
                          </span>
                        </div>
                      </div>
                      {e.status === "pending" && (
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => approveExpense(e.id, "approved")}
                            className="flex-1 py-2 rounded-xl text-xs font-bold"
                            style={{ background: "rgba(0,255,135,0.1)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.2)" }}>
                            Утвердить расход
                          </button>
                          <button onClick={() => approveExpense(e.id, "rejected")}
                            className="flex-1 py-2 rounded-xl text-xs font-bold"
                            style={{ background: "rgba(244,63,94,0.08)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.2)" }}>
                            Отклонить
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* МОЙ НАЛОГ */}
          {tab === "tax" && (
            <div className="space-y-4">
              {/* Шапка */}
              <div className="rounded-2xl p-5" style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.15)" }}>
                    <Icon name="FileCheck" size={20} style={{ color: "#3b82f6" }} />
                  </div>
                  <div>
                    <div className="text-white font-bold text-base">Приложение «Мой налог» — ФНС России</div>
                    <div className="text-white/40 text-xs">Официальный режим самозанятого · НПД</div>
                  </div>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">
                  Самозанятость — самый простой способ легально получать доход от деятельности ECSU.
                  Налог всего <strong className="text-white">4%</strong> (от физлиц) или <strong className="text-white">6%</strong> (от юрлиц/ИП) вместо НДФЛ 13%.
                  Регистрация онлайн за 5 минут, без ИП и бухгалтера.
                </p>
              </div>

              {/* Калькулятор налога */}
              <div className="rounded-2xl p-4" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <div className="text-white/50 text-xs uppercase tracking-widest mb-3">Калькулятор налога самозанятого</div>
                <div className="flex gap-2 mb-3">
                  {[{id: "fl" as const, label: "От физлиц (4%)"}, {id: "ul" as const, label: "От юрлиц (6%)"}].map(t => (
                    <button key={t.id} onClick={() => setTaxCalcType(t.id)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: taxCalcType === t.id ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${taxCalcType === t.id ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.08)"}`,
                        color: taxCalcType === t.id ? "#10b981" : "rgba(255,255,255,0.4)",
                      }}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <input value={taxCalcAmount} onChange={e => setTaxCalcAmount(e.target.value)}
                  placeholder="Введите сумму поступления (₽)" type="number"
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none mb-3"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                {taxCalcAmount && parseFloat(taxCalcAmount) > 0 && (() => {
                  const amount = parseFloat(taxCalcAmount);
                  const rate = taxCalcType === "fl" ? 4 : 6;
                  const tax = amount * rate / 100;
                  const net = amount - tax;
                  const owner = net * 0.51;
                  const dev = net * 0.49;
                  return (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "Поступление", value: `${fmt(amount)} ₽`, color: "#ffffff" },
                          { label: `Налог НПД (${rate}%)`, value: `${fmt(tax)} ₽`, color: "#f59e0b" },
                          { label: "Чистыми", value: `${fmt(net)} ₽`, color: "#10b981" },
                          { label: "Вам (51%)", value: `${fmt(owner)} ₽`, color: "#00ff87" },
                        ].map(c => (
                          <div key={c.label} className="px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <div className="text-white/40 text-xs">{c.label}</div>
                            <div className="font-bold text-sm mt-0.5" style={{ color: c.color }}>{c.value}</div>
                          </div>
                        ))}
                      </div>
                      <div className="px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(59,130,246,0.07)", color: "rgba(255,255,255,0.5)" }}>
                        На разработку (49%): <strong style={{ color: "#3b82f6" }}>{fmt(dev)} ₽</strong>
                        &nbsp;·&nbsp; Экономия vs НДФЛ: <strong style={{ color: "#10b981" }}>+{fmt(amount * 0.13 - tax)} ₽</strong>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Пошаговая инструкция */}
              <div className="space-y-3">
                <div className="text-white/40 text-xs uppercase tracking-widest">Пошаговая инструкция</div>
                {MOY_NALOG_STEPS.map(step => (
                  <div key={step.n} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                        style={{ background: `${step.color}20`, color: step.color }}>
                        {step.n}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-sm mb-1">{step.title}</div>
                        <div className="text-white/50 text-xs leading-relaxed mb-2">{step.desc}</div>
                        {step.links.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {step.links.map(link => (
                              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                                style={{ background: `${step.color}12`, color: step.color, border: `1px solid ${step.color}25` }}>
                                <Icon name={link.icon as any} size={11} />
                                {link.label}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Виды деятельности ECSU */}
              <div className="rounded-2xl p-4" style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)" }}>
                <div className="text-white/50 text-xs uppercase tracking-widest mb-3">Виды деятельности ECSU для самозанятого</div>
                <div className="space-y-2">
                  {ECSU_ACTIVITIES.map(act => (
                    <div key={act.code} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <span className="text-white/70 text-sm">{act.label}</span>
                      <div className="flex gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
                          Физлица {act.rate_fl}%
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold" style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6" }}>
                          Юрлица {act.rate_ul}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Быстрые ссылки */}
              <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-white/40 text-xs uppercase tracking-widest mb-3">Официальные ресурсы</div>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: "Личный кабинет самозанятого — ФНС", url: "https://lknpd.nalog.ru", icon: "Building2", color: "#3b82f6" },
                    { label: "Госуслуги — стать самозанятым", url: "https://www.gosuslugi.ru/self-employed", icon: "FileText", color: "#10b981" },
                    { label: "ФНС — о налоге на профдоход", url: "https://npd.nalog.ru", icon: "BookOpen", color: "#a855f7" },
                    { label: "Банк России — о самозанятости", url: "https://www.cbr.ru/self-employed", icon: "Landmark", color: "#f59e0b" },
                  ].map(link => (
                    <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:scale-[1.01]"
                      style={{ background: `${link.color}08`, border: `1px solid ${link.color}20` }}>
                      <Icon name={link.icon as any} size={16} style={{ color: link.color }} />
                      <span className="text-white/70 text-sm flex-1">{link.label}</span>
                      <Icon name="ExternalLink" size={13} style={{ color: "rgba(255,255,255,0.2)" }} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* НАСТРОЙКИ */}
          {tab === "settings" && (
            <div className="space-y-4">
              <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="text-white/50 text-xs uppercase tracking-widest mb-4">Параметры фонда</div>
                <div className="space-y-3">
                  <div>
                    <label className="text-white/40 text-xs mb-1 block">Название фонда</label>
                    <input value={cfgForm.fund_name || ""} onChange={e => setCfgForm(f => ({ ...f, fund_name: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs mb-1 block">Налоговый режим</label>
                    <div className="flex gap-2">
                      {TAX_MODES.map(t => (
                        <button key={t.code} onClick={() => setCfgForm(f => ({ ...f, tax_mode: t.code, tax_rate_percent: t.default_rate || f.tax_rate_percent }))}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                          style={{
                            background: cfgForm.tax_mode === t.code ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${cfgForm.tax_mode === t.code ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.07)"}`,
                            color: cfgForm.tax_mode === t.code ? "#f59e0b" : "rgba(255,255,255,0.4)",
                          }}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-white/40 text-xs mb-1 block">Ставка налога %</label>
                      <input value={cfgForm.tax_rate_percent ?? ""} type="number"
                        onChange={e => setCfgForm(f => ({ ...f, tax_rate_percent: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                    <div>
                      <label className="text-white/40 text-xs mb-1 block">Доля владельца %</label>
                      <input value={cfgForm.owner_share_percent ?? ""} type="number"
                        onChange={e => setCfgForm(f => ({ ...f, owner_share_percent: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                    <div>
                      <label className="text-white/40 text-xs mb-1 block">Доля разработки %</label>
                      <input value={cfgForm.dev_share_percent ?? ""} type="number"
                        onChange={e => setCfgForm(f => ({ ...f, dev_share_percent: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs mb-1 block">Банк для вывода (информационно)</label>
                    <input value={cfgForm.owner_bank || ""} onChange={e => setCfgForm(f => ({ ...f, owner_bank: e.target.value }))}
                      placeholder="Сбербанк / Тинькофф / ВТБ..."
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                  <button onClick={saveConfig} disabled={saving}
                    className="w-full py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-40"
                    style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>
                    {saving ? "Сохранение..." : "Сохранить настройки"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}