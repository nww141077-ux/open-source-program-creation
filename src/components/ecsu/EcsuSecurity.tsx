import Icon from "@/components/ui/icon";

const threats = [
  { id: "THR-001", type: "DDoS", source: "192.168.xxx.xxx", target: "Внешний шлюз", level: "critical", time: "14:31" },
  { id: "THR-002", type: "Brute Force", source: "103.xxx.xxx.xxx", target: "API авторизации", level: "high", time: "13:44" },
  { id: "THR-003", type: "SQL Injection", source: "45.xxx.xxx.xxx", target: "БД ЕЦСУ", level: "critical", time: "12:20" },
  { id: "THR-004", type: "Сканирование", source: "217.xxx.xxx.xxx", target: "Порты сервера", level: "medium", time: "11:05" },
  { id: "THR-005", type: "Фишинг", source: "Email", target: "Персонал", level: "low", time: "09:30" },
];

const levelColor = { critical: "#e94560", high: "#f59e0b", medium: "#a78bfa", low: "#94a3b8" };
const levelLabel = { critical: "Критический", high: "Высокий", medium: "Средний", low: "Низкий" };

const EcsuSecurity = () => (
  <div className="p-6">
    <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
      <Icon name="Shield" size={20} className="text-[#00c896]" />
      Безопасность
    </h2>
    <p className="text-gray-500 text-sm mb-6">Мониторинг угроз и защита системы ЕЦСУ</p>

    <div className="grid grid-cols-4 gap-3 mb-6">
      {[
        { label: "Заблокировано угроз", value: "1 847", color: "#00c896", icon: "ShieldCheck" },
        { label: "Активных атак", value: "3", color: "#e94560", icon: "ShieldAlert" },
        { label: "Уязвимостей", value: "12", color: "#f59e0b", icon: "ShieldX" },
        { label: "Уровень защиты", value: "94%", color: "#60a5fa", icon: "Shield" },
      ].map((s) => (
        <div key={s.label} className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-3 text-center">
          <Icon name={s.icon} size={20} className="mx-auto mb-2" style={{ color: s.color }} />
          <div className="text-xl font-bold text-white">{s.value}</div>
          <div className="text-gray-500 text-xs mt-1">{s.label}</div>
        </div>
      ))}
    </div>

    <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
      <div className="text-white font-bold text-sm mb-3 flex items-center gap-2">
        <Icon name="AlertOctagon" size={15} className="text-[#e94560]" />
        Активные угрозы
      </div>
      <div className="space-y-2">
        {threats.map((t) => (
          <div key={t.id} className="flex items-center gap-3 bg-[#060d1f] rounded-lg p-3">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: levelColor[t.level as keyof typeof levelColor] }} />
            <span className="text-gray-500 text-xs w-20 shrink-0">{t.id}</span>
            <span className="text-white text-sm font-medium w-28 shrink-0">{t.type}</span>
            <span className="text-gray-400 text-xs flex-1">{t.source} → {t.target}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: levelColor[t.level as keyof typeof levelColor], background: levelColor[t.level as keyof typeof levelColor] + "20" }}>
              {levelLabel[t.level as keyof typeof levelLabel]}
            </span>
            <span className="text-gray-600 text-xs w-10 text-right">{t.time}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default EcsuSecurity;
