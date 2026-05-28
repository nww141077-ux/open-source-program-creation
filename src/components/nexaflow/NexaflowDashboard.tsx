import { useState } from "react";
import {
  Bell, LayoutDashboard, Link2, User, Plus, Activity, Clock, Zap,
  Trash2, X, CheckCircle, AlertCircle, LogOut,
  Settings, Shield, Save, Eye, EyeOff
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

interface PlatformSettings {
  email: string;
  domain: string;
  serverUrl: string;
  apiKey: string;
  notifyEmail: boolean;
  notifyTelegram: boolean;
  telegramBot: string;
}

const statusMeta: Record<FlowStatus, { text: string; color: string; dot: string }> = {
  active: { text: "Активен", color: "text-green-400",  dot: "bg-green-400"  },
  error:  { text: "Ошибка",  color: "text-red-400",    dot: "bg-red-500"    },
  paused: { text: "Пауза",   color: "text-yellow-400", dot: "bg-yellow-400" },
};

const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!value)}
    className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${value ? "bg-green-500" : "bg-gray-700"}`}
  >
    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${value ? "left-5" : "left-0.5"}`} />
  </button>
);

interface Props { onLogout: () => void; }

export default function NexaflowDashboard({ onLogout }: Props) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [flows, setFlows] = useState<Flow[]>([]);
  const [showAddFlow, setShowAddFlow] = useState(false);
  const [newFlow, setNewFlow] = useState({ name: "", from: "", to: "", status: "active" as FlowStatus });
  const [nextId, setNextId] = useState(1);
  const [showApiKey, setShowApiKey] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [settings, setSettings] = useState<PlatformSettings>({
    email: "", domain: "", serverUrl: "", apiKey: "",
    notifyEmail: false, notifyTelegram: false, telegramBot: "",
  });

  const today = new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const activeCount = flows.filter(f => f.status === "active").length;

  const addFlow = () => {
    if (!newFlow.name.trim()) return;
    const now = new Date().toLocaleString("ru-RU");
    setFlows(prev => [...prev, { ...newFlow, id: nextId, createdAt: now }]);
    setNextId(n => n + 1);
    setNewFlow({ name: "", from: "", to: "", status: "active" });
    setShowAddFlow(false);
  };

  const deleteFlow = (id: number) => setFlows(prev => prev.filter(f => f.id !== id));

  const toggleFlowStatus = (id: number) => {
    setFlows(prev => prev.map(f => {
      if (f.id !== id) return f;
      return { ...f, status: f.status === "active" ? "paused" : "active" };
    }));
  };

  const saveSettings = () => {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const navItems = [
    { id: "dashboard", icon: <LayoutDashboard size={20} />, label: "Главная"    },
    { id: "flows",     icon: <Link2 size={20} />,           label: "Потоки"     },
    { id: "ecsu",      icon: <Shield size={20} />,          label: "ECSU"       },
    { id: "settings",  icon: <Settings size={20} />,        label: "Настройки"  },
    { id: "profile",   icon: <User size={20} />,            label: "Профиль"    },
  ];

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex">
      {/* Sidebar */}
      <div className="w-14 bg-[#0f1117] border-r border-white/10 flex flex-col items-center py-4">
        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mb-6">
          <Zap size={16} className="text-black" />
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveNav(item.id)} title={item.label}
              className={`p-2.5 rounded-lg transition-colors ${activeNav === item.id ? "bg-green-500/20 text-green-400" : "text-gray-500 hover:text-white"}`}>
              {item.icon}
            </button>
          ))}
        </nav>
        <button onClick={onLogout} title="Выйти" className="p-2 text-gray-600 hover:text-red-400 transition-colors mt-4">
          <LogOut size={18} />
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-500 rounded-md flex items-center justify-center">
              <Zap size={14} className="text-black" />
            </div>
            <span className="font-bold text-white tracking-wide">NEXAFLOW</span>
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-semibold">2026</span>
          </div>
          <button className="text-gray-400 hover:text-white"><Bell size={18} /></button>
        </header>

        <main className="flex-1 px-5 py-6 overflow-auto">

          {/* DASHBOARD */}
          {activeNav === "dashboard" && (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white">ДОБРО ПОЖАЛОВАТЬ, ВЛАДИМИР!</h1>
                <p className="text-gray-400 text-sm mt-1">{today}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { label: "Всего потоков",   value: flows.length,                                    color: "text-green-400",  icon: <Activity size={16} className="text-green-400 mb-2" />  },
                  { label: "Активных",         value: activeCount,                                     color: "text-purple-400", icon: <CheckCircle size={16} className="text-purple-400 mb-2" /> },
                  { label: "С ошибкой",        value: flows.filter(f => f.status === "error").length,  color: "text-red-400",    icon: <AlertCircle size={16} className="text-red-400 mb-2" />   },
                  { label: "На паузе",         value: flows.filter(f => f.status === "paused").length, color: "text-yellow-400", icon: <Clock size={16} className="text-yellow-400 mb-2" />      },
                ].map(s => (
                  <div key={s.label} className="bg-[#1a1d27] rounded-xl p-4 border border-white/5">
                    {s.icon}
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-gray-400 text-xs mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
              {flows.length === 0 ? (
                <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-8 text-center">
                  <Link2 size={32} className="text-gray-600 mx-auto mb-3" />
                  <div className="text-gray-400 text-sm">Потоков пока нет</div>
                  <div className="text-gray-600 text-xs mt-1">Перейди в «Потоки» чтобы создать первый</div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {flows.slice(-5).reverse().map(flow => {
                    const s = statusMeta[flow.status];
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

          {/* FLOWS */}
          {activeNav === "flows" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Потоки данных</h2>
                <button onClick={() => setShowAddFlow(true)}
                  className="flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-black text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
                  <Plus size={14} /> Новый поток
                </button>
              </div>

              {showAddFlow && (
                <div className="bg-[#1a1d27] border border-green-500/30 rounded-xl p-5 mb-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-white font-semibold">Новый поток</div>
                    <button onClick={() => setShowAddFlow(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {[
                      { ph: "Название потока *",                    key: "name" },
                      { ph: "Источник (например: Telegram)",        key: "from" },
                      { ph: "Назначение (например: Google Sheets)", key: "to"   },
                    ].map(({ ph, key }) => (
                      <input key={key} type="text" placeholder={ph}
                        value={newFlow[key as keyof typeof newFlow] as string}
                        onChange={e => setNewFlow(p => ({ ...p, [key]: e.target.value }))}
                        className="bg-[#0f1117] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500/50 placeholder-gray-600"
                      />
                    ))}
                    <select value={newFlow.status} onChange={e => setNewFlow(p => ({ ...p, status: e.target.value as FlowStatus }))}
                      className="bg-[#0f1117] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500/50">
                      <option value="active">Активен</option>
                      <option value="paused">Пауза</option>
                      <option value="error">Ошибка</option>
                    </select>
                    <button onClick={addFlow} disabled={!newFlow.name.trim()}
                      className="bg-green-500 hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold py-2.5 rounded-lg transition-colors text-sm">
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
                    const s = statusMeta[flow.status];
                    return (
                      <div key={flow.id} className="bg-[#1a1d27] border border-white/5 rounded-xl px-4 py-3 hover:border-white/20 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-2 h-2 rounded-full ${s.dot} flex-shrink-0`} />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-white truncate">{flow.name}</div>
                              {(flow.from || flow.to) && (
                                <div className="text-xs text-gray-500 mt-0.5 truncate">{flow.from}{flow.from && flow.to ? " → " : ""}{flow.to}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                            <button onClick={() => toggleFlowStatus(flow.id)} className={`text-xs font-semibold ${s.color} hover:opacity-70`}>{s.text}</button>
                            <button onClick={() => deleteFlow(flow.id)} className="text-gray-600 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 mt-2">{flow.createdAt}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ECSU */}
          {activeNav === "ecsu" && (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Shield size={20} className="text-green-400" /> ECSU — Система контроля
                </h2>
                <p className="text-gray-500 text-sm mt-1">Мониторинг платформы NEXAFLOW · 2026</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: "Статус системы",    value: "Онлайн",  color: "text-green-400",  dot: "bg-green-400"  },
                  { label: "Уровень защиты",    value: "Высокий", color: "text-blue-400",   dot: "bg-blue-400"   },
                  { label: "Активных угроз",    value: "0",       color: "text-yellow-400", dot: "bg-yellow-400" },
                  { label: "Версия платформы",  value: "1.0.0",   color: "text-purple-400", dot: "bg-purple-400" },
                ].map(s => (
                  <div key={s.label} className="bg-[#1a1d27] rounded-xl p-4 border border-white/5">
                    <div className={`w-2 h-2 rounded-full ${s.dot} mb-2`} />
                    <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-gray-400 text-xs mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-4 mb-4">
                <div className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                  <Shield size={15} className="text-green-400" /> Системный журнал
                </div>
                <div className="space-y-2">
                  {[
                    { msg: "Платформа запущена успешно",             level: "ok"   },
                    { msg: "Авторизован: Владимир (Владелец)",        level: "ok"   },
                    { msg: `Активных потоков: ${activeCount}`,        level: "info" },
                    { msg: "Угроз не обнаружено",                     level: "ok"   },
                  ].map((log, i) => (
                    <div key={i} className="flex items-center gap-3 bg-[#0f1117] rounded-lg px-3 py-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${log.level === "ok" ? "bg-green-400" : "bg-blue-400"}`} />
                      <span className="text-gray-500 text-xs w-16 flex-shrink-0">{new Date().toLocaleTimeString("ru-RU")}</span>
                      <span className="text-gray-300 text-xs">{log.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-4">
                <div className="text-white font-semibold text-sm mb-3">Информация о платформе</div>
                <div className="space-y-0 text-xs">
                  {[
                    ["Платформа",  "NEXAFLOW"],
                    ["Владелец",   "Владимир"],
                    ["Год",        "2026"],
                    ["Домен",      settings.domain    || "не указан"],
                    ["Email",      settings.email     || "не указан"],
                    ["Сервер",     settings.serverUrl || "не указан"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                      <span className="text-gray-500">{k}</span>
                      <span className="text-gray-300">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* SETTINGS */}
          {activeNav === "settings" && (
            <>
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Settings size={20} className="text-green-400" /> Настройки платформы
              </h2>
              <div className="space-y-4">
                {/* Владелец */}
                <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-4">
                  <div className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                    <User size={15} className="text-green-400" /> Данные владельца
                  </div>
                  <label className="text-gray-400 text-xs mb-1 block">Email</label>
                  <input type="email" placeholder="your@email.com" value={settings.email}
                    onChange={e => setSettings(p => ({ ...p, email: e.target.value }))}
                    className="w-full bg-[#0f1117] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500/50 placeholder-gray-600"
                  />
                </div>

                {/* Домен и сервер */}
                <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-4">
                  <div className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                    <Link2 size={15} className="text-green-400" /> Домен и сервер
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-gray-400 text-xs mb-1 block">Домен платформы</label>
                      <input type="text" placeholder="nexaflow.yourdomain.com" value={settings.domain}
                        onChange={e => setSettings(p => ({ ...p, domain: e.target.value }))}
                        className="w-full bg-[#0f1117] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500/50 placeholder-gray-600"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs mb-1 block">URL сервера</label>
                      <input type="text" placeholder="https://api.yourserver.com" value={settings.serverUrl}
                        onChange={e => setSettings(p => ({ ...p, serverUrl: e.target.value }))}
                        className="w-full bg-[#0f1117] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500/50 placeholder-gray-600"
                      />
                    </div>
                  </div>
                </div>

                {/* API ключи */}
                <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-4">
                  <div className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                    <Shield size={15} className="text-green-400" /> API ключи
                  </div>
                  <label className="text-gray-400 text-xs mb-1 block">Мастер API-ключ</label>
                  <div className="relative">
                    <input type={showApiKey ? "text" : "password"} placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                      value={settings.apiKey}
                      onChange={e => setSettings(p => ({ ...p, apiKey: e.target.value }))}
                      className="w-full bg-[#0f1117] border border-white/10 text-white rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-green-500/50 placeholder-gray-600"
                    />
                    <button onClick={() => setShowApiKey(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                      {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Уведомления */}
                <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-4">
                  <div className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                    <Bell size={15} className="text-green-400" /> Уведомления
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <div className="text-white text-sm">Email уведомления</div>
                        <div className="text-gray-500 text-xs">Алерты на почту</div>
                      </div>
                      <Toggle value={settings.notifyEmail} onChange={v => setSettings(p => ({ ...p, notifyEmail: v }))} />
                    </div>
                    <div className="flex items-center justify-between py-1 border-t border-white/5">
                      <div>
                        <div className="text-white text-sm">Telegram уведомления</div>
                        <div className="text-gray-500 text-xs">Отправлять в бота</div>
                      </div>
                      <Toggle value={settings.notifyTelegram} onChange={v => setSettings(p => ({ ...p, notifyTelegram: v }))} />
                    </div>
                    {settings.notifyTelegram && (
                      <input type="text" placeholder="@your_telegram_bot или chat_id"
                        value={settings.telegramBot}
                        onChange={e => setSettings(p => ({ ...p, telegramBot: e.target.value }))}
                        className="w-full bg-[#0f1117] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500/50 placeholder-gray-600"
                      />
                    )}
                  </div>
                </div>

                <button onClick={saveSettings}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                    settingsSaved ? "bg-green-600 text-white" : "bg-green-500 hover:bg-green-400 text-black"
                  }`}>
                  <Save size={16} />
                  {settingsSaved ? "Сохранено ✓" : "Сохранить настройки"}
                </button>
              </div>
            </>
          )}

          {/* PROFILE */}
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
                    <div className="text-gray-500 text-xs">Владелец · NEXAFLOW · 2026</div>
                  </div>
                </div>
                <div className="space-y-0">
                  {[
                    ["Роль",             "Владелец"],
                    ["Email",            settings.email     || "не указан"],
                    ["Домен",            settings.domain    || "не указан"],
                    ["Сервер",           settings.serverUrl || "не указан"],
                    ["Потоков создано",  String(flows.length)],
                    ["Активных потоков", String(activeCount)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
                      <span className="text-gray-400 text-sm">{k}</span>
                      <span className={`text-sm ${k === "Роль" ? "text-green-400 font-semibold" : "text-white"}`}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={onLogout}
                className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
                <LogOut size={16} /> Выйти из аккаунта
              </button>
            </>
          )}

        </main>
      </div>
    </div>
  );
}
