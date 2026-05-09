import Icon from "@/components/ui/icon";

const licenses = [
  { name: "ECSU Core Engine", version: "2.4.1", status: "active", expires: "2027-12-31", seats: "∞", owner: "SYNERGON GLOBAL" },
  { name: "DALAN AI Module", version: "1.2.0", status: "active", expires: "2026-12-31", seats: "50", owner: "DALAN Systems" },
  { name: "Threat Analytics Pro", version: "3.1.5", status: "active", expires: "2026-09-15", seats: "25", owner: "ECSU Labs" },
  { name: "Global Incident DB", version: "1.0.0", status: "trial", expires: "2026-06-01", seats: "10", owner: "ECSU Labs" },
  { name: "Geo Mapping Engine", version: "2.0.3", status: "active", expires: "2027-03-20", seats: "∞", owner: "MapCore" },
];

const statusColor = { active: "#00c896", trial: "#f59e0b", expired: "#e94560" };
const statusLabel = { active: "Активна", trial: "Пробная", expired: "Истекла" };

const EcsuLicense = () => (
  <div className="p-6">
    <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
      <Icon name="BadgeCheck" size={20} className="text-blue-400" />
      Лицензия
    </h2>
    <p className="text-gray-500 text-sm mb-6">Управление лицензиями компонентов системы ЕЦСУ</p>

    <div className="grid grid-cols-3 gap-3 mb-6">
      {[
        { label: "Активных лицензий", value: "4", color: "#00c896", icon: "ShieldCheck" },
        { label: "Пробных", value: "1", color: "#f59e0b", icon: "Clock" },
        { label: "Истекает скоро", value: "2", color: "#e94560", icon: "AlertCircle" },
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
        <Icon name="List" size={15} className="text-blue-400" />
        Установленные лицензии
      </div>
      <div className="space-y-2">
        {licenses.map((l) => (
          <div key={l.name} className="flex items-center gap-3 bg-[#060d1f] rounded-lg p-3">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: statusColor[l.status as keyof typeof statusColor] }} />
            <div className="flex-1">
              <div className="text-white text-sm font-medium">{l.name}</div>
              <div className="text-gray-500 text-xs">{l.owner} · v{l.version}</div>
            </div>
            <div className="text-gray-500 text-xs shrink-0">{l.seats} мест</div>
            <div className="text-gray-500 text-xs shrink-0">до {l.expires}</div>
            <span className="text-xs font-bold px-2 py-0.5 rounded shrink-0"
              style={{ color: statusColor[l.status as keyof typeof statusColor], background: statusColor[l.status as keyof typeof statusColor] + "20" }}>
              {statusLabel[l.status as keyof typeof statusLabel]}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default EcsuLicense;
