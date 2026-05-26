import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const INCIDENTS_URL = "https://functions.poehali.dev/df1d9dd9-c455-479d-807f-b25e000928ff";

const severityConfig = {
  critical: { label: "Критический", color: "#e94560", bg: "bg-[#e94560]/10 border-[#e94560]/30", dot: "bg-[#e94560]" },
  high:     { label: "Высокий",     color: "#f59e0b", bg: "bg-[#f59e0b]/10 border-[#f59e0b]/30", dot: "bg-[#f59e0b]" },
  medium:   { label: "Средний",     color: "#a78bfa", bg: "bg-[#a78bfa]/10 border-[#a78bfa]/30", dot: "bg-[#a78bfa]" },
  low:      { label: "Минимальный", color: "#94a3b8", bg: "bg-[#94a3b8]/10 border-[#94a3b8]/30", dot: "bg-[#94a3b8]" },
};

const typeLabel: Record<string, string> = {
  cyber: "Кибератака",
  ecology: "Экология",
  military: "Военный",
  economic: "Экономический",
  political: "Политический",
  system_critical: "Системный",
  humanitarian: "Гуманитарный",
};

interface Incident {
  id: number;
  code: string;
  type: string;
  title: string;
  description: string;
  country: string;
  location: string;
  severity: string;
  status: string;
  ai_confidence: number;
  created_at: string;
  has_photo: boolean;
  has_video: boolean;
  has_official_source: boolean;
}

interface Stats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  resolved: number;
  active: number;
  countries: number;
}

const VideoModal = ({ incident, onClose }: { incident: Incident; onClose: () => void }) => {
  const [videoSearch, setVideoSearch] = useState(incident.title + " " + incident.country);
  const [activeSource, setActiveSource] = useState<"youtube" | "yandex" | "google">("youtube");

  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(videoSearch)}`;
  const yandexUrl = `https://yandex.ru/video/search?text=${encodeURIComponent(videoSearch)}`;
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(videoSearch)}&tbm=vid`;

  const embedUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(videoSearch)}&autoplay=1`;

  const sources = [
    { id: "youtube", label: "YouTube", icon: "Play", color: "#e94560" },
    { id: "yandex", label: "Яндекс.Видео", icon: "Search", color: "#f59e0b" },
    { id: "google", label: "Google Video", icon: "Globe", color: "#60a5fa" },
  ] as const;

  const openExternal = () => {
    const urls = { youtube: youtubeUrl, yandex: yandexUrl, google: googleUrl };
    window.open(urls[activeSource], "_blank");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#0d1225] border border-blue-900/40 rounded-2xl w-full max-w-3xl mx-4 shadow-2xl flex flex-col"
        style={{ maxHeight: "85vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-blue-900/30">
          <div className="w-8 h-8 bg-[#e94560]/20 rounded-lg flex items-center justify-center">
            <Icon name="Play" size={16} className="text-[#e94560]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-bold truncate">Видео по инциденту</div>
            <div className="text-gray-500 text-xs truncate">{incident.title}</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-red-400 transition-colors p-1">
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Search bar */}
        <div className="flex gap-2 px-5 py-3 border-b border-blue-900/20">
          <input
            value={videoSearch}
            onChange={e => setVideoSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && openExternal()}
            className="flex-1 bg-[#060d1f] border border-blue-900/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-700"
            placeholder="Поисковый запрос..."
          />
          <button
            onClick={openExternal}
            className="px-4 py-2 bg-[#e94560] hover:bg-[#c73350] text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Icon name="ExternalLink" size={14} />
            Открыть
          </button>
        </div>

        {/* Source tabs */}
        <div className="flex gap-2 px-5 py-2 border-b border-blue-900/20">
          {sources.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSource(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                activeSource === s.id
                  ? "border-opacity-50 text-white"
                  : "bg-transparent border-white/5 text-gray-500 hover:text-gray-300"
              }`}
              style={activeSource === s.id ? { background: s.color + "22", borderColor: s.color + "66", color: s.color } : {}}
            >
              <Icon name={s.icon} size={12} />
              {s.label}
            </button>
          ))}
        </div>

        {/* YouTube embed */}
        <div className="flex-1 p-4">
          {activeSource === "youtube" ? (
            <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: "56.25%", height: 0 }}>
              <iframe
                key={videoSearch}
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Видео по инциденту"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-10">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{
                background: sources.find(s => s.id === activeSource)?.color + "22"
              }}>
                <Icon name="ExternalLink" size={28} style={{ color: sources.find(s => s.id === activeSource)?.color }} />
              </div>
              <div className="text-center">
                <div className="text-white font-medium mb-1">
                  Поиск через {sources.find(s => s.id === activeSource)?.label}
                </div>
                <div className="text-gray-500 text-sm mb-4">Нажми кнопку чтобы открыть в браузере</div>
                <button
                  onClick={openExternal}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                  style={{ background: sources.find(s => s.id === activeSource)?.color }}
                >
                  Открыть {sources.find(s => s.id === activeSource)?.label}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EcsuIncidents = () => {
  const [activeTab, setActiveTab] = useState<"all" | "critical" | "medium" | "low">("all");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Incident | null>(null);
  const [videoIncident, setVideoIncident] = useState<Incident | null>(null);

  useEffect(() => {
    fetch(`${INCIDENTS_URL}?action=stats`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const sev = activeTab === "all" ? "" : activeTab === "medium" ? "medium&severity=high" : activeTab;
    fetch(`${INCIDENTS_URL}?action=list&severity=${activeTab === "all" ? "" : activeTab}&limit=100`)
      .then(r => r.json())
      .then(data => {
        setIncidents(data.incidents || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeTab]);

  const filtered = incidents.filter(inc => {
    if (!search) return true;
    const q = search.toLowerCase();
    return inc.title.toLowerCase().includes(q) ||
           inc.country.toLowerCase().includes(q) ||
           inc.type.toLowerCase().includes(q);
  });

  const tabs = [
    { id: "all",      label: "Все",         count: stats?.total },
    { id: "critical", label: "Критические", count: stats?.critical, color: "#e94560" },
    { id: "medium",   label: "Средние",     count: (stats?.medium || 0) + (stats?.high || 0), color: "#a78bfa" },
    { id: "low",      label: "Минимальные", count: stats?.low, color: "#94a3b8" },
  ] as const;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">ИНЦИДЕНТЫ · МЕЖДУНАРОДНАЯ БАЗА</h2>
          <p className="text-gray-500 text-sm mt-0.5">Реальные данные ЕЦСУ · {stats?.countries ?? "..."} стран · обновлено из БД</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-xs">LIVE</span>
        </div>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: "Всего", value: stats.total, color: "#60a5fa", icon: "Globe" },
            { label: "Критических", value: stats.critical, color: "#e94560", icon: "AlertOctagon" },
            { label: "Активных", value: stats.active, color: "#f59e0b", icon: "Activity" },
            { label: "Решено", value: stats.resolved, color: "#00c896", icon: "CheckCircle" },
          ].map(s => (
            <div key={s.label} className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <Icon name={s.icon} size={16} style={{ color: s.color }} />
              </div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Табы по уровню */}
      <div className="flex gap-2 mb-4">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
              activeTab === t.id
                ? "bg-blue-600/20 border-blue-500/50 text-white"
                : "bg-[#0d1225] border-blue-900/30 text-gray-400 hover:text-white"
            }`}
          >
            {t.color && <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />}
            {t.label}
            {t.count !== undefined && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/10">{t.count}</span>
            )}
          </button>
        ))}

        <div className="ml-auto">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по стране, типу..."
            className="bg-[#060d1f] border border-blue-900/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-700 w-56"
          />
        </div>
      </div>

      {/* Список */}
      <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">Загрузка из базы данных...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-600">Инцидентов не найдено</div>
        ) : (
          <div className="divide-y divide-blue-900/20 max-h-[520px] overflow-y-auto">
            {filtered.map(inc => {
              const sev = severityConfig[inc.severity as keyof typeof severityConfig] || severityConfig.low;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelected(selected?.id === inc.id ? null : inc)}
                  className="px-5 py-3 hover:bg-blue-900/10 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${sev.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{inc.title}</div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Icon name="Globe" size={11} />
                          {inc.country}
                        </span>
                        <span className="bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded">
                          {typeLabel[inc.type] || inc.type}
                        </span>
                        {inc.ai_confidence > 0 && (
                          <span className="text-[#FFD700]">AI: {inc.ai_confidence}%</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${sev.bg}`} style={{ color: sev.color }}>
                        {sev.label}
                      </span>
                      <span className="text-gray-700 text-xs">{inc.created_at?.slice(0, 10)}</span>
                    </div>
                  </div>

                  {selected?.id === inc.id && (
                    <div className="mt-3 pl-5 border-l-2 border-blue-600/40 space-y-2">
                      {inc.description && (
                        <p className="text-gray-400 text-xs leading-relaxed">{inc.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                        {inc.has_photo && <span className="text-green-400">📷 Фото</span>}
                        {inc.has_official_source && <span className="text-blue-400">✓ Офиц. источник</span>}
                        <span>#{inc.code}</span>
                      </div>
                      <div className="flex gap-2 mt-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setVideoIncident(inc)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e94560]/20 border border-[#e94560]/30 text-[#e94560] text-xs rounded-lg hover:bg-[#e94560]/30 transition-colors font-medium"
                        >
                          <Icon name="Play" size={12} />
                          Найти видео
                        </button>
                        <button
                          onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(inc.title + " " + inc.country)}`, "_blank")}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#60a5fa]/10 border border-[#60a5fa]/20 text-[#60a5fa] text-xs rounded-lg hover:bg-[#60a5fa]/20 transition-colors"
                        >
                          <Icon name="Search" size={12} />
                          Поиск в сети
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {videoIncident && (
        <VideoModal incident={videoIncident} onClose={() => setVideoIncident(null)} />
      )}
    </div>
  );
};

export default EcsuIncidents;