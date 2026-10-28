import Icon from "@/components/ui/icon";

const organs = [
  { name: "Центральный штаб ЕЦСУ", region: "Москва", status: "active", head: "Николаев В.В.", units: 12, incidents: 3 },
  { name: "Северо-Западный узел", region: "Санкт-Петербург", status: "active", head: "Петров А.С.", units: 8, incidents: 1 },
  { name: "Южный оперативный центр", region: "Краснодар", status: "active", head: "Иванова М.Р.", units: 6, incidents: 2 },
  { name: "Приволжский координатор", region: "Казань", status: "active", head: "Смирнов К.Д.", units: 7, incidents: 0 },
  { name: "Уральский узел", region: "Екатеринбург", status: "maintenance", head: "Козлов П.В.", units: 5, incidents: 1 },
  { name: "Сибирский центр", region: "Новосибирск", status: "active", head: "Волков Д.А.", units: 9, incidents: 0 },
  { name: "Дальневосточный штаб", region: "Владивосток", status: "active", head: "Морозов Е.И.", units: 4, incidents: 1 },
  { name: "Северо-Кавказский узел", region: "Ставрополь", status: "alert", head: "Громов В.С.", units: 6, incidents: 4 },
];

const statusColor = { active: "#00c896", maintenance: "#f59e0b", alert: "#e94560" };
const statusLabel = { active: "Активен", maintenance: "Техобслуживание", alert: "Тревога" };

const EcsuOrgans = () => (
  <div className="p-6">
    <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
      <Icon name="Network" size={20} className="text-blue-400" />
      Органы ECSU
    </h2>
    <p className="text-gray-500 text-sm mb-6">Структурные подразделения системы · {organs.length} узлов</p>

    <div className="grid grid-cols-2 gap-3">
      {organs.map((org) => (
        <div key={org.name} className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4 hover:border-blue-700/40 transition-colors">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="text-white font-semibold text-sm">{org.name}</div>
              <div className="text-gray-500 text-xs">{org.region}</div>
            </div>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ml-2"
              style={{ color: statusColor[org.status as keyof typeof statusColor], background: statusColor[org.status as keyof typeof statusColor] + "15", border: `1px solid ${statusColor[org.status as keyof typeof statusColor]}30` }}
            >
              {statusLabel[org.status as keyof typeof statusLabel]}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
            <span className="flex items-center gap-1"><Icon name="User" size={11} /> {org.head}</span>
            <span className="flex items-center gap-1"><Icon name="Users" size={11} /> {org.units} ед.</span>
            {org.incidents > 0 && (
              <span className="flex items-center gap-1 text-[#e94560]"><Icon name="AlertCircle" size={11} /> {org.incidents}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default EcsuOrgans;
