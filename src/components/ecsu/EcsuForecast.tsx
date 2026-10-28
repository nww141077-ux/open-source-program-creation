import Icon from "@/components/ui/icon";

const forecasts = [
  { region: "Тихоокеанский регион", type: "Сейсмическая активность", probability: 87, severity: "critical", date: "2026-05-12", trend: "up" },
  { region: "Центральная Азия", type: "Техногенная авария", probability: 64, severity: "high", date: "2026-05-15", trend: "up" },
  { region: "Западная Европа", type: "Кибератака инфраструктуры", probability: 72, severity: "high", date: "2026-05-11", trend: "stable" },
  { region: "Северная Африка", type: "Экологический кризис", probability: 53, severity: "medium", date: "2026-05-18", trend: "down" },
  { region: "Южная Азия", type: "Гидрологическая угроза", probability: 79, severity: "critical", date: "2026-05-13", trend: "up" },
  { region: "Латинская Америка", type: "Вулканическая активность", probability: 41, severity: "medium", date: "2026-05-20", trend: "stable" },
];

const severityColor = { critical: "#e94560", high: "#f59e0b", medium: "#a78bfa", low: "#94a3b8" };
const severityLabel = { critical: "Критический", high: "Высокий", medium: "Средний", low: "Низкий" };

const EcsuForecast = () => (
  <div className="p-6">
    <div className="flex items-center justify-between mb-1">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <Icon name="TrendingUp" size={20} className="text-blue-400" />
        Прогнозы
      </h2>
      <span className="text-xs text-green-400 flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
        ИИ-модель активна
      </span>
    </div>
    <p className="text-gray-500 text-sm mb-6">Прогнозирование угроз на основе исторических данных ЕЦСУ</p>

    <div className="grid grid-cols-3 gap-3 mb-6">
      {[
        { label: "Прогнозов активно", value: "6", color: "#60a5fa", icon: "Activity" },
        { label: "Точность модели", value: "91.4%", color: "#00c896", icon: "Target" },
        { label: "Горизонт прогноза", value: "14 дн.", color: "#f59e0b", icon: "Clock" },
      ].map(s => (
        <div key={s.label} className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4 text-center">
          <Icon name={s.icon} size={20} className="mx-auto mb-2" style={{ color: s.color }} />
          <div className="text-xl font-bold text-white">{s.value}</div>
          <div className="text-gray-500 text-xs mt-1">{s.label}</div>
        </div>
      ))}
    </div>

    <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
      <div className="text-white font-bold text-sm mb-3 flex items-center gap-2">
        <Icon name="AlertOctagon" size={15} className="text-[#f59e0b]" />
        Прогнозируемые угрозы
      </div>
      <div className="space-y-2">
        {forecasts.map((f) => (
          <div key={f.region} className="flex items-center gap-3 bg-[#060d1f] rounded-lg p-3">
            <div className="w-12 text-center shrink-0">
              <div className="text-white font-bold text-sm">{f.probability}%</div>
              <div className="text-gray-600 text-[9px]">вероят.</div>
            </div>
            <div className="w-2 h-8 rounded-full shrink-0" style={{ background: severityColor[f.severity as keyof typeof severityColor] + "40", border: `1px solid ${severityColor[f.severity as keyof typeof severityColor]}60` }} />
            <div className="flex-1">
              <div className="text-white text-sm font-medium">{f.type}</div>
              <div className="text-gray-500 text-xs">{f.region}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Icon
                name={f.trend === "up" ? "TrendingUp" : f.trend === "down" ? "TrendingDown" : "Minus"}
                size={14}
                style={{ color: f.trend === "up" ? "#e94560" : f.trend === "down" ? "#00c896" : "#94a3b8" }}
              />
              <span className="text-xs font-bold px-2 py-0.5 rounded"
                style={{ color: severityColor[f.severity as keyof typeof severityColor], background: severityColor[f.severity as keyof typeof severityColor] + "20" }}>
                {severityLabel[f.severity as keyof typeof severityLabel]}
              </span>
              <span className="text-gray-600 text-xs">{f.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default EcsuForecast;
