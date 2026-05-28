import { useState } from "react";
import { Bell, LayoutDashboard, Link2, User, Plus, TrendingUp, Activity, Clock, Zap } from "lucide-react";

const flows = [
  {
    id: 1,
    name: "CRM → Slack уведомления",
    from: "Salesforce",
    to: "Slack",
    time: "2 мин назад",
    runs: "1 247 запусков",
    status: "active",
  },
  {
    id: 2,
    name: "Оплата → База данных",
    from: "Stripe",
    to: "PostgreSQL",
    time: "5 мин назад",
    runs: "892 запусков",
    status: "active",
  },
  {
    id: 3,
    name: "Git push → Деплой",
    from: "GitHub",
    to: "AWS",
    time: "1 час назад",
    runs: "341 запусков",
    status: "error",
  },
  {
    id: 4,
    name: "Заказы → Telegram бот",
    from: "Stripe",
    to: "Telegram",
    time: "1 мин назад",
    runs: "2 103 запусков",
    status: "active",
  },
  {
    id: 5,
    name: "Аналитика → Отчёты",
    from: "Google",
    to: "Salesforce",
    time: "3 дня назад",
    runs: "88 запусков",
    status: "paused",
  },
];

const statusLabel: Record<string, { text: string; color: string; dot: string }> = {
  active: { text: "Активен", color: "text-green-400", dot: "bg-green-400" },
  error: { text: "Ошибка", color: "text-red-400", dot: "bg-red-500" },
  paused: { text: "Пауза", color: "text-yellow-400", dot: "bg-yellow-400" },
};

export default function NexaflowDashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex">
      {/* Sidebar */}
      <div className="w-14 bg-[#0f1117] border-r border-white/10 flex flex-col items-center py-4 gap-6">
        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
          <Zap size={16} className="text-black" />
        </div>
        <nav className="flex flex-col gap-4 mt-4">
          <button
            onClick={() => setActiveNav("dashboard")}
            className={`p-2 rounded-lg transition-colors ${activeNav === "dashboard" ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}
          >
            <LayoutDashboard size={20} />
          </button>
          <button
            onClick={() => setActiveNav("flows")}
            className={`p-2 rounded-lg transition-colors ${activeNav === "flows" ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}
          >
            <Link2 size={20} />
          </button>
          <button
            onClick={() => setActiveNav("profile")}
            className={`p-2 rounded-lg transition-colors ${activeNav === "profile" ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}
          >
            <User size={20} />
          </button>
        </nav>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-500 rounded-md flex items-center justify-center">
              <Zap size={14} className="text-black" />
            </div>
            <span className="font-bold text-white tracking-wide">NEXAFLOW</span>
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-semibold">APP</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-gray-400 hover:text-white">
              <Bell size={18} />
            </button>
            <button className="text-sm text-gray-400 hover:text-white border border-white/10 px-3 py-1 rounded-lg">
              → На сайт
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-6 py-6 overflow-auto">
          {/* Welcome */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">ДОБРО ПОЖАЛОВАТЬ, АЛЕКСЕЙ!</h1>
            <p className="text-gray-400 text-sm mt-1">Всё работает штатно · четверг, 28 мая</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-[#1a1d27] rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={16} className="text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-400">1,247</div>
              <div className="text-gray-400 text-xs mt-1">Активных потоков</div>
            </div>
            <div className="bg-[#1a1d27] rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded-full border-2 border-purple-400 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                </div>
              </div>
              <div className="text-2xl font-bold text-purple-400">99.9%</div>
              <div className="text-gray-400 text-xs mt-1">Uptime</div>
            </div>
            <div className="bg-[#1a1d27] rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-cyan-400">&lt; 48мс</div>
              <div className="text-gray-400 text-xs mt-1">Задержка API</div>
            </div>
            <div className="bg-[#1a1d27] rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-orange-400" />
              </div>
              <div className="text-2xl font-bold text-orange-400">10.2M</div>
              <div className="text-gray-400 text-xs mt-1">Запросов сегодня</div>
            </div>
          </div>

          {/* Flows */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold tracking-widest text-white uppercase">Потоки данных</h2>
              <button className="flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-black text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
                <Plus size={14} />
                Новый поток
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {flows.map((flow) => {
                const s = statusLabel[flow.status];
                return (
                  <div
                    key={flow.id}
                    className="bg-[#1a1d27] border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between hover:border-white/20 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${s.dot} flex-shrink-0`} />
                      <div>
                        <div className="text-sm font-medium text-white">{flow.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {flow.from} → {flow.to} · {flow.time}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="text-xs text-gray-400">{flow.runs}</div>
                      <div className={`text-xs font-semibold ${s.color}`}>{s.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
