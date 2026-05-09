import Icon from "@/components/ui/icon";

const bars = [65, 80, 45, 90, 70, 55, 85, 75, 60, 95, 50, 88];
const months = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

const predictions = [
  { label: "Вероятность инцидента (Центр)", value: 78, color: "#e94560" },
  { label: "Нагрузка на шлюзы", value: 62, color: "#f59e0b" },
  { label: "Эффективность DALAN", value: 94, color: "#00c896" },
  { label: "Готовность системы", value: 88, color: "#60a5fa" },
];

const EcsuAnalytics = () => (
  <div className="p-6">
    <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
      <Icon name="BarChart3" size={20} className="text-blue-400" />
      ИИ-аналитика
    </h2>
    <p className="text-gray-500 text-sm mb-6">Прогнозы и анализ системы ЕЦСУ · Powered by DALAN</p>

    <div className="grid grid-cols-2 gap-4 mb-6">
      {/* Bar chart */}
      <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
        <div className="text-white font-bold text-sm mb-4">Инциденты по месяцам (2026)</div>
        <div className="flex items-end gap-1.5 h-32">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t transition-all hover:opacity-80"
                style={{ height: `${h}%`, background: i === 3 ? "#e94560" : "#1e3a5f", border: i === 3 ? "1px solid #e94560" : "none" }}
              />
              <span className="text-[9px] text-gray-600">{months[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Predictions */}
      <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
        <div className="text-white font-bold text-sm mb-4">Прогнозы DALAN</div>
        <div className="space-y-3">
          {predictions.map((p) => (
            <div key={p.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">{p.label}</span>
                <span className="font-bold" style={{ color: p.color }}>{p.value}%</span>
              </div>
              <div className="bg-[#060d1f] rounded-full h-1.5">
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${p.value}%`, background: p.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* AI Report */}
    <div className="bg-[#0d1225] border border-[#FFD700]/20 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="Brain" size={16} className="text-[#FFD700]" />
        <span className="text-[#FFD700] font-bold text-sm">ОТЧЁТ DALAN · Сдвиг Николаева применён</span>
      </div>
      <div className="space-y-2 text-sm text-gray-300">
        <p>· Общая эффективность системы за апрель: <span className="text-[#00c896] font-bold">+110%</span> (коэф. Николаева ×1.1)</p>
        <p>· Критических инцидентов за период: <span className="text-[#e94560] font-bold">12</span> — все взяты в обработку</p>
        <p>· Оптимизация потоков данных через алгоритм DALAN: <span className="text-[#60a5fa] font-bold">экономия 18% ресурсов</span></p>
        <p>· Рекомендация: усилить мониторинг Северо-Кавказского и Центрального регионов</p>
      </div>
    </div>
  </div>
);

export default EcsuAnalytics;
