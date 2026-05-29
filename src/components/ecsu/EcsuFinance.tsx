import Icon from "@/components/ui/icon";
import { useState } from "react";

/* ── Типы ── */
type SideTab = "overview" | "accounts" | "cards" | "transactions" | "rules";

interface Account {
  id: string;
  name: string;
  type: string;
  number: string;
  bik: string;
  iban: string;
  currency: string;
  balance: number;
}

const EMPTY_FORM = {
  name: "",
  type: "bank",
  number: "",
  bik: "",
  iban: "",
  currency: "RUB",
};

/* ── Платёжные системы (статичные карточки) ── */
const PAYMENT_SYSTEMS = [
  {
    id: "webmoney",
    name: "WebMoney",
    sub: "Кошелёк WMZ",
    balance: "0.00 WMZ",
    wmid: "289034386471.27",
    icon: "Wallet",
    gradient: "linear-gradient(135deg,#1a3d2e 0%,#0f2a1e 100%)",
    accent: "#00c896",
    status: "online",
    actions: ["Пополнить кошелёк"],
  },
  {
    id: "qiwi",
    name: "QIWI Кошелёк",
    sub: "Россия · Казахстан",
    balance: "0 ₽",
    icon: "Zap",
    gradient: "linear-gradient(135deg,#3d2200 0%,#2a1800 100%)",
    accent: "#f59e0b",
    status: "online",
    actions: ["Пополнить"],
  },
  {
    id: "wmoney",
    name: "WMoney",
    sub: "Личный кошелёк",
    balance: "0 ₽",
    icon: "CreditCard",
    gradient: "linear-gradient(135deg,#3d3000 0%,#2a2000 100%)",
    accent: "#fbbf24",
    status: "offline",
    actions: ["Подключить"],
  },
  {
    id: "sbp",
    name: "Быстрые платежи",
    sub: "СБП",
    balance: "0 ₽",
    icon: "Bolt",
    gradient: "linear-gradient(135deg,#1a2a4a 0%,#0f1e3a 100%)",
    accent: "#3b82f6",
    status: "online",
    actions: ["Настроить"],
  },
  {
    id: "shopclub",
    name: "Shop Club",
    sub: "Магазин",
    balance: "0 ₽",
    icon: "ShoppingBag",
    gradient: "linear-gradient(135deg,#1e2533 0%,#141b28 100%)",
    accent: "#94a3b8",
    status: "offline",
    actions: ["Подключить"],
  },
  {
    id: "yoomoney",
    name: "ЮMoney",
    sub: "Яндекс Деньги",
    balance: "0 ₽",
    icon: "Landmark",
    gradient: "linear-gradient(135deg,#2a1a4a 0%,#1e1035 100%)",
    accent: "#a78bfa",
    status: "online",
    actions: ["Пополнить"],
  },
];

const SIDE_TABS: { id: SideTab; label: string; icon: string }[] = [
  { id: "overview", label: "Обзор", icon: "LayoutDashboard" },
  { id: "accounts", label: "Счета", icon: "Building2" },
  { id: "cards", label: "Карты", icon: "CreditCard" },
  { id: "transactions", label: "Транзакции", icon: "ArrowLeftRight" },
  { id: "rules", label: "Распределения", icon: "GitBranch" },
];

/* ── Компонент ── */
const EcsuFinance = () => {
  const [tab, setTab] = useState<SideTab>("overview");
  const [showModal, setShowModal] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [qiwiTab, setQiwiTab] = useState<"rub" | "pay" | "rub2">("rub");

  const addAccount = () => {
    if (!form.name) return;
    setAccounts((prev) => [
      ...prev,
      { ...form, id: Date.now().toString(), balance: 0 },
    ]);
    setForm(EMPTY_FORM);
    setShowModal(false);
  };

  /* ── Контент по вкладке ── */
  const renderContent = () => {
    if (tab === "accounts") {
      return (
        <div>
          <div className="text-white font-bold text-sm mb-4 uppercase tracking-widest">
            Счета
          </div>
          {accounts.length === 0 ? (
            <div className="bg-[#0d1225] border border-blue-900/30 rounded-2xl p-10 text-center">
              <Icon name="Building2" size={32} className="text-gray-700 mx-auto mb-3" />
              <div className="text-gray-500 text-sm">Нет добавленных счетов</div>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
                style={{ background: "#f59e0b" }}
              >
                Добавить счёт
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="bg-[#0d1225] border border-blue-900/30 rounded-2xl p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="Building2" size={16} className="text-blue-400" />
                    <span className="text-white font-semibold text-sm">{acc.name}</span>
                  </div>
                  <div className="text-gray-500 text-xs space-y-1">
                    <div>Тип: {acc.type}</div>
                    {acc.number && <div>Номер: {acc.number}</div>}
                    {acc.iban && <div>IBAN: {acc.iban}</div>}
                    {acc.bik && <div>БИК/SWIFT: {acc.bik}</div>}
                    <div>Валюта: {acc.currency}</div>
                  </div>
                  <div className="text-2xl font-bold text-white mt-3">
                    0 {acc.currency === "RUB" ? "₽" : acc.currency}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (tab === "cards") {
      return (
        <div>
          <div className="text-white font-bold text-sm mb-4 uppercase tracking-widest">Карты</div>
          <div className="bg-[#0d1225] border border-blue-900/30 rounded-2xl p-10 text-center">
            <Icon name="CreditCard" size={32} className="text-gray-700 mx-auto mb-3" />
            <div className="text-gray-500 text-sm">Нет привязанных карт</div>
          </div>
        </div>
      );
    }

    if (tab === "transactions") {
      return (
        <div>
          <div className="text-white font-bold text-sm mb-4 uppercase tracking-widest">
            Транзакции
          </div>
          <div className="bg-[#0d1225] border border-blue-900/30 rounded-2xl p-10 text-center">
            <Icon name="ArrowLeftRight" size={32} className="text-gray-700 mx-auto mb-3" />
            <div className="text-gray-500 text-sm">Нет операций</div>
          </div>
        </div>
      );
    }

    if (tab === "rules") {
      return (
        <div>
          <div className="text-white font-bold text-sm mb-4 uppercase tracking-widest">
            Распределения
          </div>
          <div className="bg-[#0d1225] border border-blue-900/30 rounded-2xl p-10 text-center">
            <Icon name="GitBranch" size={32} className="text-gray-700 mx-auto mb-3" />
            <div className="text-gray-500 text-sm">Нет правил распределения</div>
          </div>
        </div>
      );
    }

    /* ── ОБЗОР ── */
    return (
      <div>
        {/* Шапка раздела */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-white font-bold text-base">ФИНАНСОВЫЙ ОБЗОР</div>
            <div className="text-gray-500 text-xs mt-0.5">
              Апрель 2026 · Все счета
            </div>
          </div>
        </div>

        {/* Баннер-предупреждение */}
        <div
          className="rounded-2xl border border-orange-500/30 p-4 mb-5 flex gap-3"
          style={{ background: "#f59e0b0d" }}
        >
          <div className="mt-0.5 shrink-0">
            <Icon name="AlertCircle" size={18} className="text-orange-400" />
          </div>
          <div>
            <div className="text-orange-300 text-sm font-semibold mb-1">
              Добавьте реальные реквизиты для получения поступлений!
            </div>
            <div className="text-gray-400 text-xs leading-relaxed">
              У вас нет активных счетов с реквизитами. Нажмите «Добавить счёт» и заполните номер
              карты, БИК, IBAN или SWIFT — это необходимо для получения платежей в системе ЕЦСУ.
            </div>
          </div>
        </div>

        {/* 4 мини-карточки */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Счета", value: accounts.length, icon: "Building2", color: "#60a5fa" },
            { label: "Карт", value: 0, icon: "CreditCard", color: "#a78bfa" },
            { label: "Транзакций", value: 0, icon: "ArrowLeftRight", color: "#00c896" },
            { label: "Правил", value: 0, icon: "GitBranch", color: "#f59e0b" },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-2xl border border-blue-900/30 p-4 flex flex-col gap-2"
              style={{ background: "#0d1225" }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: c.color + "22" }}
              >
                <Icon name={c.icon} size={16} style={{ color: c.color }} />
              </div>
              <div className="text-2xl font-black text-white leading-none">{c.value}</div>
              <div className="text-gray-500 text-xs">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Балансы счетов / Платёжные системы */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Wallet" size={14} className="text-blue-400" />
            <span className="text-white text-xs font-bold uppercase tracking-widest">
              Платёжные системы
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {PAYMENT_SYSTEMS.map((ps) => (
              <div
                key={ps.id}
                className="rounded-2xl border overflow-hidden"
                style={{
                  background: ps.gradient,
                  borderColor: ps.accent + "33",
                }}
              >
                <div className="p-4">
                  {/* Заголовок карточки */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: ps.accent + "22" }}
                      >
                        <Icon name={ps.icon} size={18} style={{ color: ps.accent }} />
                      </div>
                      <div>
                        <div className="text-white text-sm font-bold leading-tight">
                          {ps.name}
                        </div>
                        <div className="text-gray-500 text-[11px]">{ps.sub}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          background:
                            ps.status === "online" ? "#00c896" : "#94a3b8",
                          boxShadow:
                            ps.status === "online"
                              ? "0 0 6px #00c896"
                              : "none",
                        }}
                      />
                      <span
                        className="text-[10px]"
                        style={{
                          color: ps.status === "online" ? "#00c896" : "#94a3b8",
                        }}
                      >
                        {ps.status === "online" ? "онлайн" : "офлайн"}
                      </span>
                    </div>
                  </div>

                  {/* WMID (только WebMoney) */}
                  {ps.id === "webmoney" && (
                    <div className="text-[10px] text-gray-600 mb-2">
                      WMID: {ps.wmid}
                    </div>
                  )}

                  {/* QIWI вкладки */}
                  {ps.id === "qiwi" && (
                    <div className="flex gap-1 mb-3">
                      {(
                        [
                          ["rub", "Рублёвый"],
                          ["pay", "Для оплаты"],
                          ["rub2", "в рублях"],
                        ] as [typeof qiwiTab, string][]
                      ).map(([id, label]) => (
                        <button
                          key={id}
                          onClick={() => setQiwiTab(id)}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-all"
                          style={
                            qiwiTab === id
                              ? {
                                  background: ps.accent + "33",
                                  borderColor: ps.accent + "66",
                                  color: ps.accent,
                                }
                              : {
                                  background: "transparent",
                                  borderColor: "#1e3a5f",
                                  color: "#6b7280",
                                }
                          }
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Баланс */}
                  <div
                    className="text-2xl font-black mb-3"
                    style={{ color: ps.accent }}
                  >
                    {ps.balance}
                  </div>

                  {/* Прогресс-бар (QIWI) */}
                  {ps.id === "qiwi" && (
                    <div className="mb-3">
                      <div
                        className="w-full rounded-full overflow-hidden"
                        style={{ height: 4, background: "#1e2a3a" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{ width: "0%", background: ps.accent }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Кнопки действий */}
                  <div className="flex gap-2">
                    {ps.actions.map((label) => (
                      <button
                        key={label}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-all hover:opacity-80"
                        style={{
                          background: ps.accent + "18",
                          borderColor: ps.accent + "44",
                          color: ps.accent,
                        }}
                      >
                        {label}
                      </button>
                    ))}
                    <button
                      className="w-8 h-8 rounded-xl flex items-center justify-center border transition-all hover:opacity-80 shrink-0"
                      style={{
                        background: ps.accent + "18",
                        borderColor: ps.accent + "44",
                        color: ps.accent,
                      }}
                    >
                      <Icon name="Plus" size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Последние операции */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Clock" size={14} className="text-blue-400" />
            <span className="text-white text-xs font-bold uppercase tracking-widest">
              Последние операции
            </span>
          </div>
          <div
            className="rounded-2xl border border-blue-900/30 p-10 text-center"
            style={{ background: "#0d1225" }}
          >
            <Icon name="Inbox" size={32} className="text-gray-700 mx-auto mb-3" />
            <div className="text-gray-500 text-sm">Нет операций</div>
            <div className="text-gray-700 text-xs mt-1">
              Операции появятся после добавления счёта с реквизитами
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="flex min-h-full text-white"
      style={{ background: "#080c1a" }}
    >
      {/* ── Левое меню ── */}
      <div
        className="w-48 shrink-0 flex flex-col border-r border-blue-900/30 py-5 px-3"
        style={{ background: "#0d1225" }}
      >
        {/* Заголовок */}
        <div className="px-2 mb-5">
          <div className="text-white font-black text-sm tracking-wide">
            ФИНАНСЫ ЕЦСУ
          </div>
          <div className="text-gray-600 text-[10px] mt-0.5">
            Счета · Карты · Транзакции
          </div>
        </div>

        {/* Вкладки */}
        <nav className="flex flex-col gap-0.5 flex-1">
          {SIDE_TABS.map((t) => {
            const active = tab === t.id;
            const count =
              t.id === "accounts"
                ? accounts.length
                : t.id === "cards" || t.id === "transactions" || t.id === "rules"
                ? 0
                : null;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                style={
                  active
                    ? { background: "#1d4ed820", color: "#60a5fa" }
                    : { background: "transparent", color: "#6b7280" }
                }
              >
                <Icon name={t.icon} size={15} />
                <span className="flex-1">{t.label}</span>
                {count !== null && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={
                      active
                        ? { background: "#3b82f630", color: "#60a5fa" }
                        : { background: "#1e2533", color: "#4b5563" }
                    }
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Нижние кнопки */}
        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-blue-900/30">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-80"
            style={{ background: "#00c896" }}
          >
            <Icon name="Plus" size={13} />
            Добавить счёт
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-80"
            style={{ background: "#3b82f6" }}
          >
            <Icon name="CreditCard" size={13} />
            Добавить карту
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80 border border-blue-900/30"
            style={{ background: "transparent", color: "#6b7280" }}
          >
            <Icon name="GitBranch" size={13} />
            Правила
          </button>
        </div>
      </div>

      {/* ── Правая область ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Топбар */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-900/30">
          <div className="flex items-center gap-2">
            <Icon name="DollarSign" size={18} className="text-green-400" />
            <span className="text-white font-bold text-base">Финансы ЕЦСУ</span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-80"
            style={{ background: "#f59e0b" }}
          >
            <Icon name="Plus" size={14} />
            Добавить счёт
          </button>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {renderContent()}
        </div>
      </div>

      {/* ── Модальное окно добавления счёта ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-lg mx-4 rounded-2xl border border-blue-900/40 shadow-2xl"
            style={{ background: "#0d1225" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Шапка */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-blue-900/30">
              <div className="w-9 h-9 bg-green-400/20 rounded-xl flex items-center justify-center">
                <Icon name="Plus" size={18} className="text-green-400" />
              </div>
              <div>
                <div className="text-white font-bold text-sm">Добавить счёт</div>
                <div className="text-gray-500 text-xs">Заполните реквизиты счёта</div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="ml-auto text-gray-500 hover:text-gray-300 transition-colors"
              >
                <Icon name="X" size={18} />
              </button>
            </div>

            {/* Форма */}
            <div className="px-6 py-5 space-y-4">
              {/* Название */}
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1.5">
                  Название счёта <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Например: Основной расчётный счёт"
                  className="w-full bg-[#060d1f] border border-blue-900/30 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Тип */}
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1.5">
                  Тип счёта
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-[#060d1f] border border-blue-900/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="bank">Банковский</option>
                  <option value="webmoney">WebMoney</option>
                  <option value="qiwi">QIWI</option>
                  <option value="yoomoney">ЮMoney</option>
                  <option value="crypto">Криптовалюта</option>
                </select>
              </div>

              {/* Номер карты/счёта */}
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1.5">
                  Номер карты / счёта
                </label>
                <input
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  placeholder="0000 0000 0000 0000"
                  className="w-full bg-[#060d1f] border border-blue-900/30 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* БИК / SWIFT */}
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1.5">
                  БИК / SWIFT
                </label>
                <input
                  value={form.bik}
                  onChange={(e) => setForm({ ...form, bik: e.target.value })}
                  placeholder="044525225 или SABRRUMMXXX"
                  className="w-full bg-[#060d1f] border border-blue-900/30 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* IBAN */}
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1.5">
                  IBAN
                </label>
                <input
                  value={form.iban}
                  onChange={(e) => setForm({ ...form, iban: e.target.value })}
                  placeholder="RU00 0000 0000 0000 0000 0000 000"
                  className="w-full bg-[#060d1f] border border-blue-900/30 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Валюта */}
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1.5">
                  Валюта
                </label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full bg-[#060d1f] border border-blue-900/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="RUB">RUB — Российский рубль</option>
                  <option value="USD">USD — Доллар США</option>
                  <option value="EUR">EUR — Евро</option>
                  <option value="WMZ">WMZ — WebMoney доллары</option>
                  <option value="BTC">BTC — Bitcoin</option>
                  <option value="USDT">USDT — Tether</option>
                </select>
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-blue-900/30 text-gray-400 hover:text-gray-200 transition-colors"
                style={{ background: "transparent" }}
              >
                Отмена
              </button>
              <button
                onClick={addAccount}
                disabled={!form.name}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#00c896" }}
              >
                Добавить счёт
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EcsuFinance;
