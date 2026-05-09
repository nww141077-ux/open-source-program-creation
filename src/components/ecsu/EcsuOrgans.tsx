import { useState } from "react";
import Icon from "@/components/ui/icon";

const regionalOrgans = [
  { name: "Центральный штаб ЕЦСУ", region: "Москва", status: "active", head: "Николаев В.В.", units: 12, incidents: 3 },
  { name: "Северо-Западный узел", region: "Санкт-Петербург", status: "active", head: "Петров А.С.", units: 8, incidents: 1 },
  { name: "Южный оперативный центр", region: "Краснодар", status: "active", head: "Иванова М.Р.", units: 6, incidents: 2 },
  { name: "Приволжский координатор", region: "Казань", status: "active", head: "Смирнов К.Д.", units: 7, incidents: 0 },
  { name: "Уральский узел", region: "Екатеринбург", status: "maintenance", head: "Козлов П.В.", units: 5, incidents: 1 },
  { name: "Сибирский центр", region: "Новосибирск", status: "active", head: "Волков Д.А.", units: 9, incidents: 0 },
  { name: "Дальневосточный штаб", region: "Владивосток", status: "active", head: "Морозов Е.И.", units: 4, incidents: 1 },
  { name: "Северо-Кавказский узел", region: "Ставрополь", status: "alert", head: "Громов В.С.", units: 6, incidents: 4 },
];

const internationalOrgans = [
  { name: "Глобальный совет безопасности (ГСБ)", members: 45, color: "#60a5fa", icon: "Shield", desc: "Стратегическое планирование, утверждение бюджета" },
  { name: "Международный суд справедливости (МС)", members: 15, color: "#a78bfa", icon: "Scale", desc: "Рассмотрение дел о нарушениях международного права" },
  { name: "Оперативная группа расследования (ОГР)", members: 120, color: "#f59e0b", icon: "Search", desc: "Фиксация фактов, сбор доказательств, расследования" },
  { name: "Силы быстрого реагирования (СБР)", members: 5000, color: "#e94560", icon: "Zap", desc: "Пресечение нарушений, защита гражданского населения" },
  { name: "Межпарламентский совет (МПСТУ)", members: 84, color: "#34d399", icon: "Users", desc: "Мониторинг технологической устойчивости" },
  { name: "Комиссия по этике и науке (КЭН)", members: 24, color: "#f97316", icon: "Microscope", desc: "Оценка угроз, разработка стандартов ИИ" },
];

const statusColor = { active: "#00c896", maintenance: "#f59e0b", alert: "#e94560" };
const statusLabel = { active: "Активен", maintenance: "Техобслуживание", alert: "Тревога" };

const EcsuOrgans = () => {
  const [tab, setTab] = useState<"regional" | "international">("international");

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
        <Icon name="Network" size={20} className="text-blue-400" />
        Органы ECSU
      </h2>
      <p className="text-gray-500 text-sm mb-4">Структура системы управления</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { id: "international", label: "Международные органы", icon: "Globe" },
          { id: "regional", label: "Региональные узлы", icon: "MapPin" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as "regional" | "international")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-blue-600 text-white"
                : "bg-[#0d1225] text-gray-400 hover:text-white border border-blue-900/30"
            }`}
          >
            <Icon name={t.icon} size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "international" && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {internationalOrgans.map((org) => (
              <div key={org.name} className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4 hover:border-blue-700/50 transition-colors">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: org.color + "20" }}>
                    <Icon name={org.icon} size={18} style={{ color: org.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-semibold text-sm leading-tight">{org.name}</div>
                    <div className="font-bold text-sm mt-0.5" style={{ color: org.color }}>{org.members.toLocaleString()} участников</div>
                  </div>
                </div>
                <div className="text-gray-500 text-xs">{org.desc}</div>
              </div>
            ))}
          </div>
          <div className="text-center text-gray-700 text-xs mt-6 space-y-1">
            <div>© 13 апреля 2026 · ECSU 2.0 · Все права защищены</div>
            <div>Правообладатель и контрольный пакет акций: Николаев Владимир Владимирович</div>
            <div>Разработчик: Poehali.dev · Партнёрская программа ЕЦСУ</div>
          </div>
        </>
      )}

      {tab === "regional" && (
        <div className="grid grid-cols-2 gap-3">
          {regionalOrgans.map((org) => (
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
      )}
    </div>
  );
};

export default EcsuOrgans;
