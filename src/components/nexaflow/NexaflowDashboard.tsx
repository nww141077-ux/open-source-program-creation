import { useState } from "react";
import {
  Bell, LayoutDashboard, Link2, User, Plus, Activity, Clock, Zap,
  Trash2, X, CheckCircle, AlertCircle, PauseCircle, LogOut
} from "lucide-react";

type FlowStatus = "active" | "error" | "paused";

interface Flow {
  id: number;
  name: string;
  from: string;
  to: string;
  status: FlowStatus;
  createdAt: string;
}

const statusLabel: Record<FlowStatus, { text: string; color: string; dot: string; icon: React.ReactNode }> = {
  active: { text: "Активен", color: "text-green-400", dot: "bg-green-400", icon: <CheckCircle size={14} className="text-green-400" /> },
  error: { text: "Ошибка", color: "text-red-400", dot: "bg-red-500", icon: <AlertCircle size={14} className="text-red-400" /> },
  paused: { text: "Пауза", color: "text-yellow-400", dot: "bg-yellow-400", icon: <PauseCircle size={14} className="text-yellow-400" /> },
};

interface Props {
  onLogout: () => void;
}

export default function NexaflowDashboard({ onLogout }: Props) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [flows, setFlows] = useState<Flow[]>([]);
  const [showAddFlow, setShowAddFlow] = useState(false);
  const [newFlow, setNewFlow] = useState({ name: "", from: "", to: "", status: "active" as FlowStatus });
  const [nextId, setNextId] = useState(1);

  const today = new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
  const activeCount = flows.filter(f => f.status === "active").length;

  const addFlow = () => {
    if (!newFlow.name.trim()) return;
    const now = new Date().toLocaleString("ru-RU");
    setFlows(prev => [...prev, { ...newFlow, id: nextId, createdAt: now }]);
    setNextId(n => n + 1);
    setNewFlow({ name: "", from: "", to: "", status: "active" });
    setShowAddFlow(false);
  };

  const deleteFlow = (id: number) => {
    setFlows(prev => prev.filter(f => f.id !== id));
  };

  const toggleStatus = (id: number) => {
    setFlows(prev => prev.map(f => {
      if (f.id !== id) return f;
      const next: FlowStatus = f.status === "active" ? "paused" : f.status === "paused" ? "active" : "active";
      return { ...f, status: next };
    }));
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex">
      {/* Sidebar */}
      <div className="w-14 bg-[#0f1117] border-r border-white/10 flex flex-col items-center py-4 gap-6">
        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
          <Zap size={16} className="text-black" />
        </div>
        <nav className="flex flex-col gap-4 mt-4">
          {[
            { id: "dashboard", icon: <LayoutDashboard size={20} /> },
            { id: "flows", icon: <Link2 size={20} /> },
            { id: "profile", icon: <User size={20} /> },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`p-2 rounded-lg transition-colors ${activeNav === item.id ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}
            >
              {item.icon}
            </button>
          ))}
        </nav>
        <div className="mt-auto">
          <button onClick={onLogout} className="p-2 text-gray-600 hover:text-red-400 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-500 rounded-md flex items-center justify-center">
              <Zap size={14} className="text-black" />
            </div>
            <span className="font-bold text-white tracking-wide">NEXAFLOW</span>
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-semibold">APP</span>
          </div>
          <button className="text-gray-400 hover:text-white">
            <Bell size={18} />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 px-5 py-6 overflow-auto">

          {/* DASHBOARD TAB */}
          {activeNav === "dashboard" && (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white">ДОБРО ПОЖАЛОВАТЬ, ВЛАДИМИР!</h1>
                <p className="text-gray-400 text-sm mt-1">
                  {flows.length === 0 ? "Потоков пока нет · " : `${activeCount} активных · `}{today}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-[#1a1d27] rounded-xl p-4 border border-white/5">
                  <Activity size={16} className="text-green-400 mb-2" />
                  <div className="text-2xl font-bold text-green-400">{flows.length}</div>
                  <div className="text-gray-400 text-xs mt-1">Всего потоков</div>
                </div>
                <div className="bg-[#1a1d27] rounded-xl p-4 border border-white/5">
                  <CheckCircle size={16} className="text-purple-400 mb-2" />
                  <div className="text-2xl font-bold text-purple-400">{activeCount}</div>
                  <div className="text-gray-400 text-xs mt-1">Активных</div>
                </div>
                <div className="bg-[#1a1d27] rounded-xl p-4 border border-white/5">
                  <AlertCircle size={16} className="text-red-400 mb-2" />
                  <div className="text-2xl font-bold text-red-400">{flows.filter(f => f.status === "error").length}</div>
                  <div className="text-gray-400 text-xs mt-1">С ошибкой</div>
                </div>
                <div className="bg-[#1a1d27] rounded-xl p-4 border border-white/5">
                  <Clock size={16} className="text-yellow-400 mb-2" />
                  <div className="text-2xl font-bold text-yellow-400">{flows.filter(f => f.status === "paused").length}</div>
                  <div className="text-gray-400 text-xs mt-1">На паузе</div>
                </div>
              </div>

              {flows.length === 0 ? (
                <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-8 text-center">
                  <Link2 size={32} className="text-gray-600 mx-auto mb-3" />
                  <div className="text-gray-400 text-sm">Потоков пока нет</div>
                  <div className="text-gray-600 text-xs mt-1">Перейди во вкладку «Потоки» чтобы создать первый</div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {flows.slice(-3).reverse().map(flow => {
                    const s = statusLabel[flow.status];
                    return (
                      <div key={flow.id} className="bg-[#1a1d27] border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${s.dot} flex-shrink-0`} />
                          <div>
                            <div className="text-sm font-medium text-white">{flow.name}</div>
                            {(flow.from || flow.to) && (
                              <div className="text-xs text-gray-500 mt-0.5">{flow.from}{flow.from && flow.to ? " → " : ""}{flow.to}</div>
                            )}
                          </div>
                        </div>
                        <div className={`text-xs font-semibold ${s.color}`}>{s.text}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* FLOWS TAB */}
          {activeNav === "flows" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Потоки данных</h2>
                <button
                  onClick={() => setShowAddFlow(true)}
                  className="flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-black text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                >
                  <Plus size={14} />
                  Новый поток
                </button>
              </div>

              {/* Add flow modal */}
              {showAddFlow && (
                <div className="bg-[#1a1d27] border border-green-500/30 rounded-xl p-5 mb-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-white font-semibold">Новый поток</div>
                    <button onClick={() => setShowAddFlow(false)} className="text-gray-500 hover:text-white">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="Название потока *"
                      value={newFlow.name}
                      onChange={e => setNewFlow(p => ({ ...p, name: e.target.value }))}
                      className="bg-[#0f1117] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500/50 placeholder-gray-600"
                    />
                    <input
                      type="text"
                      placeholder="Источник (например: Telegram)"
                      value={newFlow.from}
                      onChange={e => setNewFlow(p => ({ ...p, from: e.target.value }))}
                      className="bg-[#0f1117] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500/50 placeholder-gray-600"
                    />
                    <input
                      type="text"
                      placeholder="Назначение (например: Google Sheets)"
                      value={newFlow.to}
                      onChange={e => setNewFlow(p => ({ ...p, to: e.target.value }))}
                      className="bg-[#0f1117] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500/50 placeholder-gray-600"
                    />
                    <select
                      value={newFlow.status}
                      onChange={e => setNewFlow(p => ({ ...p, status: e.target.value as FlowStatus }))}
                      className="bg-[#0f1117] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500/50"
                    >
                      <option value="active">Активен</option>
                      <option value="paused">Пауза</option>
                      <option value="error">Ошибка</option>
                    </select>
                    <button
                      onClick={addFlow}
                      disabled={!newFlow.name.trim()}
                      className="bg-green-500 hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold py-2.5 rounded-lg transition-colors text-sm"
                    >
                      Создать поток
                    </button>
                  </div>
                </div>
              )}

              {flows.length === 0 ? (
                <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-10 text-center">
                  <Link2 size={36} className="text-gray-700 mx-auto mb-3" />
                  <div className="text-gray-400">Потоков пока нет</div>
                  <div className="text-gray-600 text-xs mt-1">Нажми «Новый поток» чтобы создать первый</div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {flows.map(flow => {
                    const s = statusLabel[flow.status];
                    return (
                      <div key={flow.id} className="bg-[#1a1d27] border border-white/5 rounded-xl px-4 py-3 hover:border-white/20 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-2 h-2 rounded-full ${s.dot} flex-shrink-0`} />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-white truncate">{flow.name}</div>
                              {(flow.from || flow.to) && (
                                <div className="text-xs text-gray-500 mt-0.5 truncate">
                                  {flow.from}{flow.from && flow.to ? " → " : ""}{flow.to}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            <button
                              onClick={() => toggleStatus(flow.id)}
                              className={`text-xs font-semibold ${s.color} hover:opacity-70 transition-opacity`}
                            >
                              {s.text}
                            </button>
                            <button
                              onClick={() => deleteFlow(flow.id)}
                              className="text-gray-600 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 mt-2">Создан: {flow.createdAt}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* PROFILE TAB */}
          {activeNav === "profile" && (
            <>
              <h2 className="text-lg font-bold text-white mb-6">Профиль</h2>
              <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-5 mb-4">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center justify-center">
                    <span className="text-green-400 font-bold text-xl">В</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold text-lg">Владимир</div>
                    <div className="text-gray-500 text-xs">Владелец · NEXAFLOW</div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-400 text-sm">Роль</span>
                    <span className="text-green-400 text-sm font-semibold">Владелец</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-400 text-sm">Потоков создано</span>
                    <span className="text-white text-sm">{flows.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400 text-sm">Активных потоков</span>
                    <span className="text-white text-sm">{activeCount}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                Выйти из аккаунта
              </button>
            </>
          )}

        </main>
      </div>
    </div>
  );
}
