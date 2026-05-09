import { useState } from "react";
import Icon from "@/components/ui/icon";

const INCIDENTS = [
  { id: 1247, region: "Центральный", type: "Кибератака", level: "critical", status: "active", date: "09.05.2026 14:23", desc: "Попытка несанкционированного доступа к базе данных ЕЦСУ" },
  { id: 1246, region: "Приволжский", type: "Утечка данных", level: "high", status: "resolved", date: "09.05.2026 13:55", desc: "Выявлена и устранена утечка персональных данных" },
  { id: 1245, region: "Северо-Кавказский", type: "Системный сбой", level: "critical", status: "active", date: "09.05.2026 12:44", desc: "Отказ узла связи, дублирующий канал активирован" },
  { id: 1244, region: "Уральский", type: "Мониторинг", level: "medium", status: "pending", date: "09.05.2026 11:20", desc: "Превышение порогового значения нагрузки на сервер" },
  { id: 1243, region: "Сибирский", type: "Физическая угроза", level: "low", status: "resolved", date: "09.05.2026 10:05", desc: "Несанкционированный доступ к серверному помещению" },
  { id: 1242, region: "Дальневосточный", type: "Кибератака", level: "high", status: "active", date: "08.05.2026 23:15", desc: "DDoS-атака на внешний шлюз" },
  { id: 1241, region: "Северо-Западный", type: "Утечка данных", level: "medium", status: "resolved", date: "08.05.2026 18:30", desc: "Обнаружен несанкционированный экспорт данных" },
  { id: 1240, region: "Южный", type: "Системный сбой", level: "high", status: "pending", date: "08.05.2026 15:00", desc: "Частичный отказ системы мониторинга" },
];

const levelColor = { critical: "#e94560", high: "#f59e0b", medium: "#a78bfa", low: "#94a3b8" };
const levelLabel = { critical: "Критический", high: "Высокий", medium: "Средний", low: "Низкий" };
const statusLabel = { active: "Активен", resolved: "Решён", pending: "В работе" };
const statusColor = { active: "#e94560", resolved: "#00c896", pending: "#f59e0b" };

const EcsuIncidents = () => {
  const [filter, setFilter] = useState<"all" | "active" | "resolved" | "pending">("all");
  const [search, setSearch] = useState("");

  const filtered = INCIDENTS.filter((inc) => {
    if (filter !== "all" && inc.status !== filter) return false;
    if (search && !inc.region.toLowerCase().includes(search.toLowerCase()) && !inc.type.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Icon name="AlertTriangle" size={20} className="text-[#f59e0b]" />
            Инциденты
          </h2>
          <p className="text-gray-500 text-sm">Реестр инцидентов системы ЕЦСУ</p>
        </div>
        <div className="bg-[#e94560]/10 border border-[#e94560]/30 text-[#e94560] px-3 py-1.5 rounded-lg text-sm font-bold">
          241 активных
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по региону или типу..."
          className="flex-1 bg-[#0d1225] border border-blue-900/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600"
        />
        {(["all", "active", "resolved", "pending"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? "bg-blue-600 text-white" : "bg-[#0d1225] text-gray-400 hover:text-white border border-blue-900/30"
            }`}
          >
            {f === "all" ? "Все" : f === "active" ? "Активные" : f === "resolved" ? "Решённые" : "В работе"}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((inc) => (
          <div key={inc.id} className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4 hover:border-blue-700/50 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-bold text-sm">#{inc.id}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: levelColor[inc.level as keyof typeof levelColor], background: levelColor[inc.level as keyof typeof levelColor] + "20", border: `1px solid ${levelColor[inc.level as keyof typeof levelColor]}40` }}>
                    {levelLabel[inc.level as keyof typeof levelLabel]}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: statusColor[inc.status as keyof typeof statusColor], background: statusColor[inc.status as keyof typeof statusColor] + "15" }}>
                    {statusLabel[inc.status as keyof typeof statusLabel]}
                  </span>
                </div>
                <div className="text-gray-300 text-sm">{inc.type} · {inc.region}</div>
                <div className="text-gray-500 text-xs mt-1">{inc.desc}</div>
              </div>
              <div className="text-gray-600 text-xs shrink-0">{inc.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EcsuIncidents;
