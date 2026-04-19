/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Icon from "@/components/ui/icon";

const INTEGRATIONS = [
  { name: "Salesforce", icon: "Cloud", color: "#00a1e0", status: "active", flows: 12 },
  { name: "Slack", icon: "MessageSquare", color: "#9b59b6", status: "active", flows: 8 },
  { name: "Google", icon: "Globe", color: "#4285f4", status: "paused", flows: 5 },
  { name: "Stripe", icon: "CreditCard", color: "#635bff", status: "active", flows: 3 },
  { name: "PostgreSQL", icon: "Database", color: "#336791", status: "active", flows: 21 },
  { name: "AWS", icon: "Server", color: "#ff9900", status: "error", flows: 2 },
  { name: "GitHub", icon: "Code2", color: "#3fb950", status: "active", flows: 9 },
  { name: "Telegram", icon: "Send", color: "#0088cc", status: "paused", flows: 4 },
];

const FLOWS = [
  { name: "CRM → Slack уведомления", from: "Salesforce", to: "Slack", status: "active", runs: 1247, lastRun: "2 мин назад" },
  { name: "Оплата → База данных", from: "Stripe", to: "PostgreSQL", status: "active", runs: 892, lastRun: "5 мин назад" },
  { name: "Git push → Деплой", from: "GitHub", to: "AWS", status: "error", runs: 341, lastRun: "1 час назад" },
  { name: "Заказы → Telegram бот", from: "Stripe", to: "Telegram", status: "active", runs: 2103, lastRun: "1 мин назад" },
  { name: "Аналитика → Отчёты", from: "Google", to: "Salesforce", status: "paused", runs: 88, lastRun: "3 дня назад" },
];

const STATS = [
  { value: "1,247", label: "Активных потоков", icon: "Activity", color: "#00ff87" },
  { value: "99.9%", label: "Uptime", icon: "ShieldCheck", color: "#a855f7" },
  { value: "< 48мс", label: "Задержка API", icon: "Timer", color: "#3b82f6" },
  { value: "10.2M", label: "Запросов сегодня", icon: "TrendingUp", color: "#f59e0b" },
];

const STATUS_COLORS: Record<string, string> = {
  active: "#00ff87",
  paused: "#f59e0b",
  error: "#f43f5e",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Активен",
  paused: "Пауза",
  error: "Ошибка",
};

const AVAILABLE = [
  { name: "HubSpot", icon: "BarChart3", color: "#ff7a59" },
  { name: "Notion", icon: "FileText", color: "#ffffff" },
  { name: "Airtable", icon: "Table", color: "#18bfff" },
  { name: "Zapier", icon: "Zap", color: "#ff4a00" },
  { name: "Shopify", icon: "ShoppingBag", color: "#96bf48" },
  { name: "Jira", icon: "Layers", color: "#0052cc" },
];

type Tab = "dashboard" | "integrations" | "profile";

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [addModal, setAddModal] = useState(false);
  const [userName] = useState("Владимир");

  return (
    <div className="min-h-screen font-body" style={{ background: "var(--dark-bg)" }}>
      {/* TOP NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-3"
        style={{ background: "rgba(8,12,20,0.95)", borderBottom: "1px solid rgba(0,255,135,0.1)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #00ff87, #a855f7)" }}>
            <Icon name="Zap" size={14} className="text-black" />
          </div>
          <span className="font-display text-lg font-bold text-white tracking-wide">NEXAFLOW</span>
          <span className="ml-2 px-2 py-0.5 rounded text-xs font-semibold text-black" style={{ background: "#00ff87" }}>APP</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.05)" }}
            title="Уведомления"
          >
            <Icon name="Bell" size={16} className="text-white/60" />
          </button>
          <button
            onClick={() => window.location.href = "/"}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/60 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            ← На сайт
          </button>
        </div>
      </nav>

      <div className="flex pt-12">
        {/* SIDEBAR */}
        <aside className="fixed left-0 top-12 bottom-0 w-16 md:w-56 flex flex-col py-4 gap-1 px-2"
          style={{ background: "rgba(8,12,20,0.95)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          {([
            { key: "dashboard", icon: "LayoutDashboard", label: "Дашборд" },
            { key: "integrations", icon: "Link2", label: "Интеграции" },
            { key: "profile", icon: "User", label: "Профиль" },
          ] as { key: Tab; icon: string; label: string }[]).map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left"
              style={{
                background: tab === item.key ? "rgba(0,255,135,0.1)" : "transparent",
                color: tab === item.key ? "#00ff87" : "rgba(255,255,255,0.5)",
                border: tab === item.key ? "1px solid rgba(0,255,135,0.2)" : "1px solid transparent",
              }}
            >
              <Icon name={item.icon as any} size={18} />
              <span className="hidden md:block">{item.label}</span>
            </button>
          ))}
        </aside>

        {/* MAIN */}
        <main className="flex-1 ml-16 md:ml-56 p-4 md:p-6 min-h-screen">

          {/* DASHBOARD TAB */}
          {tab === "dashboard" && (
            <div className="space-y-6 animate-fade-up">
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase">
                  Добро пожаловать, {userName}!
                </h1>
                <p className="text-white/40 text-sm mt-1">Всё работает штатно · {new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</p>
              </div>

              {/* STATS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {STATS.map((stat) => (
                  <div key={stat.label} className="p-4 rounded-2xl"
                    style={{ background: "rgba(13,18,32,0.9)", border: `1px solid ${stat.color}20` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: `${stat.color}18` }}>
                        <Icon name={stat.icon as any} size={14} style={{ color: stat.color }} />
                      </div>
                    </div>
                    <div className="font-display text-xl md:text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="text-white/40 text-xs mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* FLOWS */}
              <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(13,18,32,0.9)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <h2 className="font-display text-base font-semibold text-white uppercase tracking-wide">Потоки данных</h2>
                  <button
                    onClick={() => setAddModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-black transition-all hover:scale-105"
                    style={{ background: "linear-gradient(135deg, #00ff87, #3b82f6)" }}>
                    <Icon name="Plus" size={12} />
                    Новый поток
                  </button>
                </div>
                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {FLOWS.map((flow) => (
                    <div key={flow.name} className="flex items-center gap-4 px-5 py-3 hover:bg-white/2 transition-colors group">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[flow.status] }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-white/90 text-sm font-medium truncate">{flow.name}</div>
                        <div className="text-white/30 text-xs mt-0.5">{flow.from} → {flow.to} · {flow.lastRun}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-white/60 text-xs">{flow.runs.toLocaleString()} запусков</div>
                        <div className="text-xs mt-0.5 font-medium" style={{ color: STATUS_COLORS[flow.status] }}>
                          {STATUS_LABELS[flow.status]}
                        </div>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                        style={{ color: "rgba(255,255,255,0.3)" }}>
                        <Icon name="Settings" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* INTEGRATIONS TAB */}
          {tab === "integrations" && (
            <div className="space-y-6 animate-fade-up">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase">Интеграции</h1>
                  <p className="text-white/40 text-sm mt-1">Управляйте подключёнными сервисами</p>
                </div>
                <button
                  onClick={() => setAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-black transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #00ff87, #3b82f6)" }}>
                  <Icon name="Plus" size={14} />
                  Добавить
                </button>
              </div>

              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-3 font-semibold">Подключённые</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {INTEGRATIONS.map((item) => (
                    <div key={item.name} className="flex items-center gap-4 p-4 rounded-2xl group cursor-pointer transition-all hover:scale-[1.01]"
                      style={{ background: "rgba(13,18,32,0.9)", border: `1px solid ${item.color}20` }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${item.color}18`, border: `1px solid ${item.color}30` }}>
                        <Icon name={item.icon as any} size={20} style={{ color: item.color }} />
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold text-sm">{item.name}</div>
                        <div className="text-white/40 text-xs">{item.flows} потоков</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${STATUS_COLORS[item.status]}18`, color: STATUS_COLORS[item.status] }}>
                          {STATUS_LABELS[item.status]}
                        </span>
                        <Icon name="ChevronRight" size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-3 font-semibold">Доступные для подключения</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {AVAILABLE.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => setAddModal(true)}
                      className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all hover:scale-[1.02]"
                      style={{ background: "rgba(13,18,32,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${item.color}15` }}>
                        <Icon name={item.icon as any} size={16} style={{ color: item.color }} />
                      </div>
                      <span className="text-white/60 text-sm font-medium">{item.name}</span>
                      <Icon name="Plus" size={12} className="ml-auto text-white/20" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PROFILE TAB */}
          {tab === "profile" && (
            <div className="space-y-6 animate-fade-up max-w-xl">
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase">Профиль</h1>
                <p className="text-white/40 text-sm mt-1">Настройки аккаунта</p>
              </div>

              <div className="p-6 rounded-2xl" style={{ background: "rgba(13,18,32,0.9)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-4 mb-6 pb-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-display text-2xl font-bold text-black"
                    style={{ background: "linear-gradient(135deg, #00ff87, #a855f7)" }}>
                    {userName[0]}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-lg">{userName} Иванов</div>
                    <div className="text-white/40 text-sm">admin@nexaflow.io</div>
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-xs font-semibold text-black" style={{ background: "#00ff87" }}>
                      Pro план
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "Имя", value: userName + " Иванов", icon: "User" },
                    { label: "Email", value: "admin@nexaflow.io", icon: "Mail" },
                    { label: "Организация", value: "NexaFlow Corp", icon: "Building2" },
                    { label: "Часовой пояс", value: "UTC+3, Москва", icon: "Clock" },
                  ].map((field) => (
                    <div key={field.label} className="flex items-center justify-between py-3"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div className="flex items-center gap-3">
                        <Icon name={field.icon as any} size={16} className="text-white/30" />
                        <div>
                          <div className="text-white/40 text-xs">{field.label}</div>
                          <div className="text-white/80 text-sm mt-0.5">{field.value}</div>
                        </div>
                      </div>
                      <button className="text-xs text-white/30 hover:text-white/60 transition-colors">Изменить</button>
                    </div>
                  ))}
                </div>

                <button className="mt-6 w-full py-3 rounded-xl font-semibold text-sm text-white/60 hover:text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  Сохранить изменения
                </button>
              </div>

              <div className="p-5 rounded-2xl" style={{ background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.15)" }}>
                <h3 className="text-white/80 font-semibold text-sm mb-1">Опасная зона</h3>
                <p className="text-white/30 text-xs mb-3">Удаление аккаунта необратимо</p>
                <button className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors hover:bg-red-500/20"
                  style={{ color: "#f43f5e", border: "1px solid rgba(244,63,94,0.3)" }}>
                  Удалить аккаунт
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ADD INTEGRATION MODAL */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)" }}
          onClick={() => setAddModal(false)}>
          <div className="w-full max-w-md p-6 rounded-2xl animate-fade-up"
            style={{ background: "#0d1220", border: "1px solid rgba(0,255,135,0.2)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-bold text-white uppercase">Новая интеграция</h3>
              <button onClick={() => setAddModal(false)} className="text-white/30 hover:text-white/60 transition-colors">
                <Icon name="X" size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-white/40 text-xs mb-1.5 block">Название потока</label>
                <input
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white bg-transparent outline-none"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}
                  placeholder="Например: CRM → Telegram"
                />
              </div>
              <div>
                <label className="text-white/40 text-xs mb-1.5 block">Откуда</label>
                <select className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", background: "#0d1220" }}>
                  {INTEGRATIONS.map((i) => <option key={i.name}>{i.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/40 text-xs mb-1.5 block">Куда</label>
                <select className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", background: "#0d1220" }}>
                  {INTEGRATIONS.map((i) => <option key={i.name}>{i.name}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={() => setAddModal(false)}
              className="mt-5 w-full py-3 rounded-xl font-semibold text-sm text-black transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #00ff87, #3b82f6)" }}>
              Создать поток
            </button>
          </div>
        </div>
      )}
    </div>
  );
}