import { useState } from "react";
import Icon from "@/components/ui/icon";

const licenses = [
  { name: "ECSU Core Engine", version: "2.4.1", status: "active", expires: "2027-12-31", seats: "∞", owner: "SYNERGON GLOBAL", desc: "Основной движок системы ЕЦСУ. Обеспечивает работу всех модулей, API, базы данных и интеграций. Лицензия бессрочная для зарегистрированных операторов.", support: "Platinum", nextUpdate: "2026-06-01" },
  { name: "DALAN AI Module", version: "1.2.0", status: "active", expires: "2026-12-31", seats: "50", owner: "DALAN Systems", desc: "Модуль искусственного интеллекта DALAN. Аналитика, прогнозирование угроз, автоматизация решений. Ограничен 50 одновременными сессиями.", support: "Gold", nextUpdate: "2026-08-15" },
  { name: "Threat Analytics Pro", version: "3.1.5", status: "active", expires: "2026-09-15", seats: "25", owner: "ECSU Labs", desc: "Профессиональный модуль анализа угроз. Машинное обучение, корреляция инцидентов, предиктивная аналитика. Истекает через 4 месяца — рекомендуем продление.", support: "Silver", nextUpdate: "2026-07-01" },
  { name: "Global Incident DB", version: "1.0.0", status: "trial", expires: "2026-06-01", seats: "10", owner: "ECSU Labs", desc: "Пробная версия глобальной базы данных инцидентов. Доступ к архиву за 2 года. Ограничение: 10 пользователей, только чтение. Требует приобретения полной лицензии.", support: "Basic", nextUpdate: "N/A" },
  { name: "Geo Mapping Engine", version: "2.0.3", status: "active", expires: "2027-03-20", seats: "∞", owner: "MapCore", desc: "Движок геопространственного картографирования. Интерактивные карты инцидентов, тепловые карты угроз, маршруты реагирования. Неограниченное число пользователей.", support: "Gold", nextUpdate: "2026-09-01" },
];

const statusColor = { active: "#00c896", trial: "#f59e0b", expired: "#e94560" };
const statusLabel = { active: "Активна", trial: "Пробная", expired: "Истекла" };

const EcsuLicense = () => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
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
          {licenses.map((l) => {
            const isOpen = selected === l.name;
            const sc = statusColor[l.status as keyof typeof statusColor];
            return (
              <div key={l.name}>
                <div
                  onClick={() => setSelected(isOpen ? null : l.name)}
                  className="flex items-center gap-3 bg-[#060d1f] rounded-lg p-3 cursor-pointer hover:bg-blue-900/10 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: sc }} />
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">{l.name}</div>
                    <div className="text-gray-500 text-xs">{l.owner} · v{l.version}</div>
                  </div>
                  <div className="text-gray-500 text-xs shrink-0">{l.seats} мест</div>
                  <div className="text-gray-500 text-xs shrink-0">до {l.expires}</div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded shrink-0" style={{ color: sc, background: sc + "20" }}>
                    {statusLabel[l.status as keyof typeof statusLabel]}
                  </span>
                  <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={13} className="text-gray-600 shrink-0" />
                </div>
                {isOpen && (
                  <div className="bg-[#060d1f] border rounded-b-lg px-4 py-3 space-y-3 -mt-1" style={{ borderColor: sc + "30", borderTop: "none" }}>
                    <p className="text-gray-300 text-sm">{l.desc}</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-[#0d1225] rounded-lg p-2">
                        <div className="text-gray-500 text-xs">Поддержка</div>
                        <div className="text-white text-sm font-medium">{l.support}</div>
                      </div>
                      <div className="bg-[#0d1225] rounded-lg p-2">
                        <div className="text-gray-500 text-xs">Мест</div>
                        <div className="text-white text-sm font-medium">{l.seats}</div>
                      </div>
                      <div className="bg-[#0d1225] rounded-lg p-2">
                        <div className="text-gray-500 text-xs">Обновление</div>
                        <div className="text-white text-sm font-medium">{l.nextUpdate}</div>
                      </div>
                    </div>
                    {l.status === "trial" && (
                      <div className="bg-[#f59e0b10] border border-[#f59e0b30] rounded-lg p-3 flex items-center gap-2">
                        <Icon name="AlertCircle" size={14} className="text-[#f59e0b]" />
                        <span className="text-[#f59e0b] text-xs">Пробная версия истекает {l.expires}. Для продления обратитесь к администратору.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EcsuLicense;
