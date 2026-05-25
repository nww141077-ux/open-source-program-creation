import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const INCIDENTS_URL =
  "https://functions.poehali.dev/df1d9dd9-c455-479d-807f-b25e000928ff";

const SEV_COLOR: Record<string, string> = {
  critical: "#e94560",
  high: "#f59e0b",
  medium: "#a78bfa",
  low: "#94a3b8",
};

const SEV_LABEL: Record<string, string> = {
  critical: "Критический",
  high: "Высокий",
  medium: "Средний",
  low: "Минимальный",
};

const TYPE_LABEL: Record<string, string> = {
  cyber: "Кибератака",
  ecology: "Экология",
  military: "Военный",
  economic: "Экономический",
  political: "Политический",
  system_critical: "Системный",
  humanitarian: "Гуманитарный",
};

const COUNTRY_XY: Record<string, [number, number]> = {
  Russia: [68, 25], "Russian Federation": [68, 25],
  China: [75, 36], "United States": [20, 36], USA: [20, 36],
  India: [68, 46], Brazil: [35, 60], Global: [50, 50],
  Japan: [82, 34], Germany: [50, 28], France: [48, 30],
  "United Kingdom": [46, 26], Ukraine: [55, 28], Iran: [60, 38],
  Syria: [57, 38], Pakistan: [65, 40], Turkey: [56, 33],
  "North Korea": [80, 32], "South Korea": [81, 34],
  Australia: [80, 66], Canada: [22, 23], Mexico: [18, 43],
  Indonesia: [78, 54], Philippines: [82, 48], Thailand: [76, 46],
  Spain: [46, 34], Italy: [51, 33], Poland: [52, 27],
  Nigeria: [50, 50], Egypt: [56, 41], "South Africa": [55, 70],
};

function getXY(country: string): [number, number] {
  if (COUNTRY_XY[country]) return COUNTRY_XY[country];
  const u = country.toUpperCase();
  if (u.includes("CHINA")) return [75, 36];
  if (u.includes("RUSSIA")) return [68, 25];
  if (u.includes("INDIA")) return [68, 46];
  if (u.includes("JAPAN")) return [82, 34];
  if (u.includes("AFRICA")) return [52, 55];
  return [25 + Math.random() * 50, 25 + Math.random() * 40];
}

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

interface MapDot {
  x: number;
  y: number;
  severity: string;
}

/* ── Видео-модалка ── */
const VideoModal = ({
  incident,
  onClose,
}: {
  incident: Incident;
  onClose: () => void;
}) => {
  const [videoSearch, setVideoSearch] = useState(
    incident.title + " " + incident.country
  );
  const [activeSource, setActiveSource] = useState<
    "youtube" | "yandex" | "google"
  >("youtube");

  const sources = [
    { id: "youtube", label: "YouTube", icon: "Play", color: "#e94560" },
    { id: "yandex", label: "Яндекс.Видео", icon: "Search", color: "#f59e0b" },
    { id: "google", label: "Google Video", icon: "Globe", color: "#60a5fa" },
  ] as const;

  const urls = {
    youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(videoSearch)}`,
    yandex: `https://yandex.ru/video/search?text=${encodeURIComponent(videoSearch)}`,
    google: `https://www.google.com/search?q=${encodeURIComponent(videoSearch)}&tbm=vid`,
  };

  const embedUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(videoSearch)}&autoplay=1`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#0d1225] border border-blue-900/40 rounded-2xl w-full max-w-3xl mx-4 shadow-2xl flex flex-col"
        style={{ maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-3 border-b border-blue-900/30">
          <div className="w-8 h-8 bg-[#e94560]/20 rounded-lg flex items-center justify-center">
            <Icon name="Play" size={16} className="text-[#e94560]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-bold">Видео по инциденту</div>
            <div className="text-gray-500 text-xs truncate">{incident.title}</div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-400 transition-colors p-1"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="flex gap-2 px-5 py-3 border-b border-blue-900/20">
          <input
            value={videoSearch}
            onChange={(e) => setVideoSearch(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && window.open(urls[activeSource], "_blank")
            }
            className="flex-1 bg-[#060d1f] border border-blue-900/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-700"
            placeholder="Поисковый запрос..."
          />
          <button
            onClick={() => window.open(urls[activeSource], "_blank")}
            className="px-4 py-2 bg-[#e94560] hover:bg-[#c73350] text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Icon name="ExternalLink" size={14} />
            Открыть
          </button>
        </div>

        <div className="flex gap-2 px-5 py-2 border-b border-blue-900/20">
          {sources.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSource(s.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
              style={
                activeSource === s.id
                  ? {
                      background: s.color + "22",
                      borderColor: s.color + "66",
                      color: s.color,
                    }
                  : {
                      background: "transparent",
                      borderColor: "#1e3a5f",
                      color: "#6b7280",
                    }
              }
            >
              <Icon name={s.icon} size={12} />
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex-1 p-4">
          {activeSource === "youtube" ? (
            <div
              className="relative w-full rounded-xl overflow-hidden bg-black"
              style={{ paddingBottom: "56.25%", height: 0 }}
            >
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
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background:
                    sources.find((s) => s.id === activeSource)?.color + "22",
                }}
              >
                <Icon
                  name="ExternalLink"
                  size={28}
                  style={{
                    color: sources.find((s) => s.id === activeSource)?.color,
                  }}
                />
              </div>
              <div className="text-center">
                <div className="text-white font-medium mb-1">
                  Поиск через{" "}
                  {sources.find((s) => s.id === activeSource)?.label}
                </div>
                <div className="text-gray-500 text-sm mb-4">
                  Нажми кнопку чтобы открыть в браузере
                </div>
                <button
                  onClick={() => window.open(urls[activeSource], "_blank")}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{
                    background: sources.find((s) => s.id === activeSource)?.color,
                  }}
                >
                  Открыть{" "}
                  {sources.find((s) => s.id === activeSource)?.label}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Главный компонент ── */
type SevTab = "all" | "critical" | "high" | "medium" | "low";
type TimeFilter = "all" | "24h" | "week";

const EcsuIncidents = () => {
  const [sevTab, setSevTab] = useState<SevTab>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Incident | null>(null);
  const [videoIncident, setVideoIncident] = useState<Incident | null>(null);
  const [mapDots, setMapDots] = useState<MapDot[]>([]);

  useEffect(() => {
    fetch(`${INCIDENTS_URL}?action=stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const sevParam = sevTab === "all" ? "" : sevTab;
    fetch(
      `${INCIDENTS_URL}?action=list&severity=${sevParam}&limit=200`
    )
      .then((r) => r.json())
      .then((data) => {
        const incs: Incident[] = data.incidents || [];
        setIncidents(incs);

        const byCountry: Record<string, string> = {};
        incs.forEach((inc) => {
          if (!byCountry[inc.country]) byCountry[inc.country] = inc.severity;
          const order = ["critical", "high", "medium", "low"];
          if (
            order.indexOf(inc.severity) <
            order.indexOf(byCountry[inc.country])
          )
            byCountry[inc.country] = inc.severity;
        });
        setMapDots(
          Object.entries(byCountry).map(([country, severity]) => {
            const [x, y] = getXY(country);
            return { x, y, severity };
          })
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sevTab]);

  const now = Date.now();
  const filtered = incidents.filter((inc) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !inc.title.toLowerCase().includes(q) &&
        !inc.country.toLowerCase().includes(q) &&
        !inc.type.toLowerCase().includes(q)
      )
        return false;
    }
    if (timeFilter === "24h") {
      const d = new Date(inc.created_at).getTime();
      if (now - d > 86400000) return false;
    }
    if (timeFilter === "week") {
      const d = new Date(inc.created_at).getTime();
      if (now - d > 7 * 86400000) return false;
    }
    return true;
  });

  const sevTabs: { id: SevTab; label: string; count?: number; color?: string }[] = [
    { id: "all", label: "Все", count: stats?.total },
    { id: "critical", label: "Критические", count: stats?.critical, color: "#e94560" },
    { id: "high", label: "Высокие", count: stats?.high, color: "#f59e0b" },
    { id: "medium", label: "Средние", count: stats?.medium, color: "#a78bfa" },
    { id: "low", label: "Низкие", count: stats?.low, color: "#94a3b8" },
  ];

  return (
    <div className="p-6 text-white" style={{ background: "#080c1a", minHeight: "100%" }}>

      {/* Заголовок */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold">ИНЦИДЕНТЫ · МЕЖДУНАРОДНАЯ БАЗА</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Реальные данные ЕЦСУ · {stats?.countries ?? "..."} стран · обновлено из БД
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
          </span>
          <span className="text-green-400 text-xs font-mono font-bold">LIVE</span>
        </div>
      </div>

      {/* Карточки статистики */}
      {stats && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: "Всего", value: stats.total, color: "#60a5fa", icon: "Globe" },
            { label: "Критических", value: stats.critical, color: "#e94560", icon: "AlertOctagon" },
            { label: "Активных", value: stats.active, color: "#f59e0b", icon: "Activity" },
            { label: "Решено", value: stats.resolved, color: "#00c896", icon: "CheckCircle" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-4 border border-blue-900/30"
              style={{ background: "#0d1225" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon name={s.icon} size={16} style={{ color: s.color }} />
              </div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Карта */}
      <div
        className="rounded-2xl border border-blue-900/30 mb-5 overflow-hidden"
        style={{ background: "#0d1225" }}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-blue-900/30">
          <Icon name="Map" size={13} className="text-blue-400" />
          <span className="text-white text-xs font-bold uppercase tracking-widest">Карта инцидентов</span>
          <span className="ml-2 bg-blue-900/40 text-blue-400 text-[10px] px-2 py-0.5 rounded-full">
            {mapDots.length} точек
          </span>
        </div>
        <div
          className="relative mx-4 my-4 rounded-xl overflow-hidden"
          style={{ height: 180, background: "#060d1f" }}
        >
          <svg className="absolute inset-0 w-full h-full opacity-10">
            {[...Array(7)].map((_, i) => (
              <line key={`h${i}`} x1="0" y1={`${i * 17}%`} x2="100%" y2={`${i * 17}%`}
                stroke="#60a5fa" strokeWidth="0.5" />
            ))}
            {[...Array(10)].map((_, i) => (
              <line key={`v${i}`} x1={`${i * 11}%`} y1="0" x2={`${i * 11}%`} y2="100%"
                stroke="#60a5fa" strokeWidth="0.5" />
            ))}
          </svg>
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 80">
            <ellipse cx="65" cy="30" rx="27" ry="13" fill="#1e3a5f" />
            <ellipse cx="20" cy="28" rx="12" ry="11" fill="#1e3a5f" />
            <ellipse cx="30" cy="58" rx="7" ry="12" fill="#1e3a5f" />
            <ellipse cx="52" cy="53" rx="8" ry="13" fill="#1e3a5f" />
            <ellipse cx="80" cy="63" rx="6" ry="5" fill="#1e3a5f" />
          </svg>
          {mapDots.slice(0, 30).map((dot, i) => {
            const col = SEV_COLOR[dot.severity] || "#94a3b8";
            const sz = dot.severity === "critical" ? 8 : dot.severity === "high" ? 7 : 5;
            return (
              <div
                key={i}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
              >
                <div
                  className="rounded-full animate-pulse"
                  style={{ width: sz, height: sz, background: col, boxShadow: `0 0 ${sz + 4}px ${col}` }}
                />
              </div>
            );
          })}
          <div className="absolute bottom-2 left-3 flex gap-3">
            {[["#e94560", "Крит."], ["#f59e0b", "Выс."], ["#a78bfa", "Ср."], ["#94a3b8", "Низ."]].map(
              ([c, l]) => (
                <div key={l} className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                  <span className="text-[9px] text-gray-500">{l}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Фильтры — время */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(
          [
            { id: "all", label: "Показать все" },
            { id: "24h", label: "Последние 24ч" },
            { id: "week", label: "Неделя" },
          ] as { id: TimeFilter; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTimeFilter(t.id)}
            className="px-4 py-2 rounded-lg text-xs font-medium border transition-all"
            style={
              timeFilter === t.id
                ? { background: "#1d4ed8", borderColor: "#3b82f688", color: "#fff" }
                : { background: "#0d1225", borderColor: "#1e3a5f", color: "#6b7280" }
            }
          >
            {t.label}
          </button>
        ))}

        <div className="ml-auto">
          <div
            className="flex items-center gap-2 rounded-lg border border-blue-900/30 px-3 py-2"
            style={{ background: "#0d1225" }}
          >
            <Icon name="Search" size={13} className="text-gray-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по стране, типу..."
              className="bg-transparent text-white text-sm focus:outline-none placeholder-gray-700 w-44"
            />
          </div>
        </div>
      </div>

      {/* Фильтры по severity */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {sevTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSevTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all"
            style={
              sevTab === t.id
                ? {
                    background: (t.color || "#3b82f6") + "22",
                    borderColor: (t.color || "#3b82f6") + "55",
                    color: t.color || "#fff",
                  }
                : { background: "#0d1225", borderColor: "#1e3a5f", color: "#6b7280" }
            }
          >
            {t.color && (
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: t.color }}
              />
            )}
            {t.label}
            {t.count !== undefined && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/10">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Список инцидентов */}
      <div
        className="rounded-2xl border border-blue-900/30 overflow-hidden"
        style={{ background: "#0d1225" }}
      >
        {loading ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">
            Загрузка из базы данных...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-600">Инцидентов не найдено</div>
        ) : (
          <div className="divide-y divide-blue-900/20 max-h-[560px] overflow-y-auto">
            {filtered.map((inc) => {
              const col = SEV_COLOR[inc.severity] || "#94a3b8";
              const label = SEV_LABEL[inc.severity] || inc.severity;
              const isOpen = selected?.id === inc.id;
              const date = inc.created_at?.slice(0, 10) || "—";
              return (
                <div key={inc.id}>
                  <div
                    onClick={() => setSelected(isOpen ? null : inc)}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-blue-900/10 cursor-pointer transition-colors"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        background: col,
                        boxShadow: `0 0 5px ${col}`,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">
                        {inc.title}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Icon name="Globe" size={11} />
                          {inc.country}
                        </span>
                        {inc.location && inc.location !== inc.country && (
                          <span className="text-gray-600">{inc.location}</span>
                        )}
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px]"
                          style={{ background: "#1e3a5f", color: "#60a5fa" }}
                        >
                          {TYPE_LABEL[inc.type] || inc.type}
                        </span>
                        {inc.ai_confidence > 0 && (
                          <span style={{ color: "#FFD700" }}>
                            AI: {inc.ai_confidence}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-xs px-2.5 py-0.5 rounded-full border font-semibold"
                        style={{
                          background: col + "18",
                          borderColor: col + "44",
                          color: col,
                        }}
                      >
                        {label}
                      </span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={
                          inc.status === "resolved"
                            ? { background: "#00c89618", color: "#00c896" }
                            : { background: "#f59e0b18", color: "#f59e0b" }
                        }
                      >
                        {inc.status === "resolved" ? "решён" : "активен"}
                      </span>
                      <span className="text-gray-700 text-xs">{date}</span>
                      <Icon
                        name={isOpen ? "ChevronUp" : "ChevronDown"}
                        size={14}
                        className="text-gray-600"
                      />
                    </div>
                  </div>

                  {isOpen && (
                    <div
                      className="px-5 pb-4 pt-1 border-t border-blue-900/20"
                      style={{ background: "#080c1a" }}
                    >
                      <div className="pl-5 border-l-2 border-blue-600/30 space-y-2">
                        {inc.description && (
                          <p className="text-gray-400 text-xs leading-relaxed">
                            {inc.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                          {inc.has_photo && (
                            <span className="text-green-400">Фото</span>
                          )}
                          {inc.has_official_source && (
                            <span className="text-blue-400">Офиц. источник</span>
                          )}
                          {inc.code && <span>#{inc.code}</span>}
                          {inc.location && (
                            <span className="flex items-center gap-1">
                              <Icon name="MapPin" size={10} />
                              {inc.location}
                            </span>
                          )}
                        </div>
                        <div
                          className="flex gap-2 mt-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setVideoIncident(inc)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
                            style={{
                              background: "#e9456018",
                              borderColor: "#e9456044",
                              color: "#e94560",
                            }}
                          >
                            <Icon name="Play" size={12} />
                            Найти видео
                          </button>
                          <button
                            onClick={() =>
                              window.open(
                                `https://www.google.com/search?q=${encodeURIComponent(
                                  inc.title + " " + inc.country
                                )}`,
                                "_blank"
                              )
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
                            style={{
                              background: "#60a5fa10",
                              borderColor: "#60a5fa30",
                              color: "#60a5fa",
                            }}
                          >
                            <Icon name="Search" size={12} />
                            Поиск в сети
                          </button>
                        </div>
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
        <VideoModal
          incident={videoIncident}
          onClose={() => setVideoIncident(null)}
        />
      )}
    </div>
  );
};

export default EcsuIncidents;
