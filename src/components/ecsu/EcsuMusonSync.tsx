import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const SYNC_URL = "https://functions.poehali.dev/7bb30a16-64ef-48af-ae2a-132fc94893cd";
const LOCAL_AGENT = "http://localhost:7749";
const POLL_INTERVAL = 15000;

interface DiskD {
  total_gb?: number;
  used_gb?: number;
  free_gb?: number;
  percent?: number;
  error?: string;
}

interface Agent {
  agent_id: string;
  hostname: string;
  os: string;
  cpu_percent: number;
  ram_percent: number;
  ram_total_gb: number;
  disk_d: DiskD;
  muson_files: { name: string; path: string; size_kb: number; modified: string; extension: string }[];
  muson_count: number;
  last_seen: string;
  last_seen_sec: number;
  started_at: string;
  status: "online" | "offline";
}

const Bar = ({ value, color }: { value: number; color: string }) => (
  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
    <div
      className="h-full rounded-full transition-all duration-700"
      style={{ width: `${Math.min(value, 100)}%`, background: color }}
    />
  </div>
);

const EcsuMusonSync = ({ onClose }: { onClose: () => void }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [localOnline, setLocalOnline] = useState<boolean | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [fileSearch, setFileSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [lastPoll, setLastPoll] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAgents = async () => {
    try {
      const r = await fetch(SYNC_URL);
      const data = await r.json();
      setAgents(data.agents || []);
      setLastPoll(new Date());
      if (!selectedAgent && (data.agents || []).length > 0) {
        setSelectedAgent(data.agents[0]);
      } else if (selectedAgent) {
        const updated = (data.agents || []).find((a: Agent) => a.agent_id === selectedAgent.agent_id);
        if (updated) setSelectedAgent(updated);
      }
    } catch {
      // нет связи с сервером
    }
    setLoading(false);
  };

  const checkLocal = async () => {
    try {
      const r = await fetch(`${LOCAL_AGENT}/ping`, { signal: AbortSignal.timeout(2000) });
      const d = await r.json();
      setLocalOnline(!!d.pong);
    } catch {
      setLocalOnline(false);
    }
  };

  const forceSyncLocal = async () => {
    setSyncing(true);
    try {
      await fetch(`${LOCAL_AGENT}/sync`, { method: "POST", signal: AbortSignal.timeout(5000) });
      await new Promise(r => setTimeout(r, 1500));
      await fetchAgents();
    } catch {
      // агент недоступен
    }
    setSyncing(false);
  };

  const openMusonFolder = async () => {
    try {
      await fetch(`${LOCAL_AGENT}/muson/open`, { method: "POST", signal: AbortSignal.timeout(3000) });
    } catch {
      alert("Агент не запущен. Запусти ЗАПУСК.bat на ПК.");
    }
  };

  useEffect(() => {
    fetchAgents();
    checkLocal();
    timerRef.current = setInterval(() => {
      fetchAgents();
      checkLocal();
    }, POLL_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const onlineAgents = agents.filter(a => a.status === "online");
  const offlineAgents = agents.filter(a => a.status === "offline");

  const filteredFiles = (selectedAgent?.muson_files || []).filter(f =>
    !fileSearch || f.name.toLowerCase().includes(fileSearch.toLowerCase())
  );

  const extIcon = (ext: string) => {
    if ([".mp4", ".avi", ".mkv"].includes(ext)) return "Play";
    if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext)) return "Image";
    if ([".pdf"].includes(ext)) return "FileText";
    if ([".zip", ".rar", ".7z"].includes(ext)) return "Archive";
    if ([".exe", ".bat"].includes(ext)) return "Terminal";
    return "File";
  };

  const formatSize = (kb: number) =>
    kb > 1024 ? `${(kb / 1024).toFixed(1)} МБ` : `${kb.toFixed(0)} КБ`;

  const timeSince = (sec: number) => {
    if (sec < 60) return `${sec}с назад`;
    if (sec < 3600) return `${Math.floor(sec / 60)}м назад`;
    return `${Math.floor(sec / 3600)}ч назад`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="bg-[#0d1225] border border-blue-900/40 rounded-2xl w-full max-w-4xl mx-4 shadow-2xl flex flex-col" style={{ maxHeight: "88vh" }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-blue-900/30 bg-gradient-to-r from-blue-900/20 to-transparent rounded-t-2xl">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
            <Icon name="CloudCog" size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="text-white font-bold text-base">Мусон-Агент · Синхронизация ПК</div>
            <div className="flex items-center gap-3 text-xs mt-0.5">
              <span className="flex items-center gap-1" style={{ color: onlineAgents.length > 0 ? "#34d399" : "#6b7280" }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ background: onlineAgents.length > 0 ? "#34d399" : "#6b7280" }} />
                {onlineAgents.length > 0 ? `${onlineAgents.length} ПК онлайн` : "Нет подключённых ПК"}
              </span>
              <span className="flex items-center gap-1" style={{ color: localOnline ? "#60a5fa" : "#6b7280" }}>
                <Icon name="Laptop" size={10} />
                {localOnline === null ? "Проверка..." : localOnline ? "Агент активен" : "Агент не запущен"}
              </span>
              {lastPoll && <span className="text-gray-600">Обновлено: {lastPoll.toLocaleTimeString()}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={forceSyncLocal}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs rounded-lg hover:bg-blue-600/30 transition-colors disabled:opacity-50"
            >
              <Icon name={syncing ? "Loader" : "RefreshCw"} size={12} className={syncing ? "animate-spin" : ""} />
              Синхронизировать
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-red-400 transition-colors p-1">
              <Icon name="X" size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* Левая колонка — список агентов */}
          <div className="w-64 border-r border-blue-900/20 flex flex-col shrink-0">
            <div className="px-3 py-2 border-b border-blue-900/20">
              <div className="text-gray-500 text-xs font-medium uppercase tracking-wide">Подключённые ПК</div>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {loading ? (
                <div className="px-3 py-4 text-gray-600 text-xs animate-pulse">Поиск агентов...</div>
              ) : agents.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <Icon name="Laptop" size={28} className="text-gray-700 mx-auto mb-2" />
                  <div className="text-gray-600 text-xs">Нет подключённых ПК</div>
                  <div className="text-gray-700 text-xs mt-1">Запусти агент на ПК</div>
                </div>
              ) : (
                <>
                  {onlineAgents.map(a => (
                    <button
                      key={a.agent_id}
                      onClick={() => setSelectedAgent(a)}
                      className={`w-full text-left px-3 py-2.5 transition-all ${selectedAgent?.agent_id === a.agent_id ? "bg-blue-900/20 border-l-2 border-blue-400" : "hover:bg-white/5 border-l-2 border-transparent"}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shrink-0" />
                        <span className="text-white text-sm font-medium truncate">{a.hostname}</span>
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5 pl-4">{timeSince(a.last_seen_sec)}</div>
                    </button>
                  ))}
                  {offlineAgents.map(a => (
                    <button
                      key={a.agent_id}
                      onClick={() => setSelectedAgent(a)}
                      className={`w-full text-left px-3 py-2.5 opacity-50 transition-all ${selectedAgent?.agent_id === a.agent_id ? "bg-white/5 border-l-2 border-gray-600" : "hover:bg-white/5 border-l-2 border-transparent"}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-gray-600 rounded-full shrink-0" />
                        <span className="text-gray-400 text-sm truncate">{a.hostname}</span>
                      </div>
                      <div className="text-gray-600 text-xs mt-0.5 pl-4">Офлайн · {timeSince(a.last_seen_sec)}</div>
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Инструкция */}
            <div className="border-t border-blue-900/20 p-3">
              <div className="text-gray-600 text-xs font-medium mb-2">Как подключить ПК:</div>
              <div className="space-y-1 text-gray-700 text-xs">
                <div>1. Скачай агент (раздел Загрузчик)</div>
                <div>2. Запусти <span className="text-blue-400 font-mono">ЗАПУСК.bat</span></div>
                <div>3. ПК появится здесь автоматически</div>
              </div>
            </div>
          </div>

          {/* Правая часть — детали агента */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!selectedAgent ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-900/20 flex items-center justify-center">
                  <Icon name="CloudCog" size={30} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-white font-medium mb-1">Выбери ПК из списка</div>
                  <div className="text-gray-500 text-sm">Или подключи новый — запусти агент на своём компьютере</div>
                </div>
              </div>
            ) : (
              <>
                {/* Статус ПК */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <Icon name="Monitor" size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <div className="text-white font-bold">{selectedAgent.hostname}</div>
                      <div className="text-gray-500 text-xs">{selectedAgent.os} · ID: {selectedAgent.agent_id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border"
                      style={selectedAgent.status === "online"
                        ? { background: "#34d39922", borderColor: "#34d39966", color: "#34d399" }
                        : { background: "#6b728022", borderColor: "#6b728066", color: "#9ca3af" }
                      }
                    >
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: selectedAgent.status === "online" ? "#34d399" : "#6b7280" }} />
                      {selectedAgent.status === "online" ? "Онлайн" : "Офлайн"}
                    </span>
                    <button
                      onClick={openMusonFolder}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs rounded-lg hover:bg-blue-600/30 transition-colors"
                    >
                      <Icon name="FolderOpen" size={12} />
                      Открыть Мусон
                    </button>
                  </div>
                </div>

                {/* Ресурсы ПК */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#1a1a2e] rounded-xl p-3 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-500 text-xs">CPU</span>
                      <span className="text-white text-sm font-bold">{selectedAgent.cpu_percent?.toFixed(0)}%</span>
                    </div>
                    <Bar value={selectedAgent.cpu_percent} color={selectedAgent.cpu_percent > 80 ? "#e94560" : selectedAgent.cpu_percent > 50 ? "#f59e0b" : "#34d399"} />
                  </div>
                  <div className="bg-[#1a1a2e] rounded-xl p-3 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-500 text-xs">RAM</span>
                      <span className="text-white text-sm font-bold">{selectedAgent.ram_percent?.toFixed(0)}%</span>
                    </div>
                    <Bar value={selectedAgent.ram_percent} color={selectedAgent.ram_percent > 85 ? "#e94560" : "#60a5fa"} />
                    <div className="text-gray-600 text-xs mt-1">{selectedAgent.ram_total_gb} ГБ</div>
                  </div>
                  <div className="bg-[#1a1a2e] rounded-xl p-3 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-500 text-xs">Диск D</span>
                      <span className="text-white text-sm font-bold">
                        {selectedAgent.disk_d?.error ? "—" : `${selectedAgent.disk_d?.percent?.toFixed(0)}%`}
                      </span>
                    </div>
                    {selectedAgent.disk_d?.error ? (
                      <div className="text-gray-600 text-xs">{selectedAgent.disk_d.error}</div>
                    ) : (
                      <>
                        <Bar value={selectedAgent.disk_d?.percent || 0} color="#a78bfa" />
                        <div className="text-gray-600 text-xs mt-1">
                          Свободно: {selectedAgent.disk_d?.free_gb} ГБ
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Папка Мусон */}
                <div className="bg-[#1a1a2e] rounded-xl border border-white/5">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <Icon name="FolderOpen" size={16} className="text-blue-400" />
                      <span className="text-white text-sm font-medium">D:\Мусон</span>
                      <span className="text-gray-500 text-xs bg-white/5 px-2 py-0.5 rounded-full">{selectedAgent.muson_count} файлов</span>
                    </div>
                    <input
                      value={fileSearch}
                      onChange={e => setFileSearch(e.target.value)}
                      placeholder="Поиск файла..."
                      className="bg-[#0d1225] border border-white/10 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500 placeholder-gray-700 w-40"
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-white/5">
                    {filteredFiles.length === 0 ? (
                      <div className="px-4 py-6 text-center text-gray-600 text-sm">
                        {selectedAgent.muson_count === 0 ? "Папка D:\\Мусон пуста" : "Файлы не найдены"}
                      </div>
                    ) : filteredFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors">
                        <Icon name={extIcon(f.extension)} size={14} className="text-gray-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-xs font-medium truncate">{f.name}</div>
                          <div className="text-gray-600 text-xs">{f.path !== f.name ? f.path : ""}</div>
                        </div>
                        <div className="text-gray-600 text-xs shrink-0">{formatSize(f.size_kb)}</div>
                        <div className="text-gray-700 text-xs shrink-0">{f.modified?.slice(0, 10)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Последняя синхронизация */}
                <div className="flex items-center justify-between text-xs text-gray-600 px-1">
                  <span>Последняя синхронизация: {timeSince(selectedAgent.last_seen_sec)}</span>
                  <span>Авто-обновление каждые 15 сек</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcsuMusonSync;
