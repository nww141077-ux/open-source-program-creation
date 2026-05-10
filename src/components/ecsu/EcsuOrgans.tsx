import { useState } from "react";
import Icon from "@/components/ui/icon";

const regionalOrgans = [
  { name: "Центральный штаб ЕЦСУ", region: "Москва", status: "active", head: "Николаев В.В.", units: 12, incidents: 3, desc: "Главный координационный центр ЕЦСУ. Управляет всеми региональными подразделениями и стратегическими операциями на территории России.", contact: "+7 (495) 000-00-01", created: "2024-01-15" },
  { name: "Северо-Западный узел", region: "Санкт-Петербург", status: "active", head: "Петров А.С.", units: 8, incidents: 1, desc: "Координация операций в Северо-Западном федеральном округе. Взаимодействие с балтийскими партнёрами ЕЦСУ.", contact: "+7 (812) 000-00-02", created: "2024-02-10" },
  { name: "Южный оперативный центр", region: "Краснодар", status: "active", head: "Иванова М.Р.", units: 6, incidents: 2, desc: "Мониторинг обстановки на юге России и Черноморском регионе. Координация с международными структурами.", contact: "+7 (861) 000-00-03", created: "2024-03-05" },
  { name: "Приволжский координатор", region: "Казань", status: "active", head: "Смирнов К.Д.", units: 7, incidents: 0, desc: "Управление инцидентами в Приволжском ФО. Охватывает 14 регионов, взаимодействует с промышленными объектами.", contact: "+7 (843) 000-00-04", created: "2024-02-20" },
  { name: "Уральский узел", region: "Екатеринбург", status: "maintenance", head: "Козлов П.В.", units: 5, incidents: 1, desc: "Техническое обслуживание основных систем. Плановая модернизация оборудования до 20.05.2026.", contact: "+7 (343) 000-00-05", created: "2024-04-01" },
  { name: "Сибирский центр", region: "Новосибирск", status: "active", head: "Волков Д.А.", units: 9, incidents: 0, desc: "Крупнейший узел по территориальному охвату. Мониторинг Сибирского и частично Дальневосточного ФО.", contact: "+7 (383) 000-00-06", created: "2024-01-28" },
  { name: "Дальневосточный штаб", region: "Владивосток", status: "active", head: "Морозов Е.И.", units: 4, incidents: 1, desc: "Восточная граница ЕЦСУ. Координация с азиатскими партнёрами, морской мониторинг.", contact: "+7 (423) 000-00-07", created: "2024-05-12" },
  { name: "Северо-Кавказский узел", region: "Ставрополь", status: "alert", head: "Громов В.С.", units: 6, incidents: 4, desc: "РЕЖИМ ТРЕВОГИ: Зафиксировано 4 активных инцидента. Усиленное дежурство, все силы приведены в готовность.", contact: "+7 (865) 000-00-08", created: "2024-03-18" },
];

const internationalOrgans = [
  { name: "Глобальный совет безопасности (ГСБ)", members: 45, color: "#60a5fa", icon: "Shield", desc: "Стратегическое планирование, утверждение бюджета", details: "Высший орган управления ECSU. Собирается ежеквартально для утверждения стратегических решений, бюджета и международных соглашений. Представители 45 государств-членов.", chair: "Николаев В.В.", founded: "2024-04-13", meetings: "Ежеквартально" },
  { name: "Международный суд справедливости (МС)", members: 15, color: "#a78bfa", icon: "Scale", desc: "Рассмотрение дел о нарушениях международного права", details: "Независимый судебный орган ECSU. Рассматривает дела о нарушениях Хартии ECSU, вынесении санкций и международных спорах в зоне ответственности системы.", chair: "Де Ла Вега М.", founded: "2024-04-13", meetings: "По запросу" },
  { name: "Оперативная группа расследования (ОГР)", members: 120, color: "#f59e0b", icon: "Search", desc: "Фиксация фактов, сбор доказательств, расследования", details: "Полевая структура ECSU. Специалисты по криминалистике, разведке и документированию инцидентов. Работает в режиме 24/7 во всех зонах активности.", chair: "Редфилд Т.", founded: "2024-05-01", meetings: "Постоянно" },
  { name: "Силы быстрого реагирования (СБР)", members: 5000, color: "#e94560", icon: "Zap", desc: "Пресечение нарушений, защита гражданского населения", details: "Оперативные силы ECSU. Развёртывание в течение 6 часов в любой точке зоны ответственности. Специализированные подразделения: антикризисные, медицинские, технические.", chair: "Генерал Ивашов С.", founded: "2024-06-01", meetings: "Ежемесячно" },
  { name: "Межпарламентский совет (МПСТУ)", members: 84, color: "#34d399", icon: "Users", desc: "Мониторинг технологической устойчивости", details: "Законодательный орган наблюдения ECSU. Представители парламентов государств-членов. Контроль за соблюдением обязательств и технологической повесткой.", chair: "Фон Байер К.", founded: "2024-04-20", meetings: "Полугодовые" },
  { name: "Комиссия по этике и науке (КЭН)", members: 24, color: "#f97316", icon: "Microscope", desc: "Оценка угроз, разработка стандартов ИИ", details: "Экспертная комиссия ECSU по вопросам этики ИИ и научных разработок. Разрабатывает стандарты применения технологий в зонах конфликтов и чрезвычайных ситуаций.", chair: "Профессор Ли Цин", founded: "2024-07-01", meetings: "Ежемесячно" },
];

const statusColor = { active: "#00c896", maintenance: "#f59e0b", alert: "#e94560" };
const statusLabel = { active: "Активен", maintenance: "Техобслуживание", alert: "Тревога" };

const EcsuOrgans = () => {
  const [tab, setTab] = useState<"regional" | "international">("international");
  const [selectedIntl, setSelectedIntl] = useState<string | null>(null);
  const [selectedRegional, setSelectedRegional] = useState<string | null>(null);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
        <Icon name="Network" size={20} className="text-blue-400" />
        Органы ECSU
      </h2>
      <p className="text-gray-500 text-sm mb-4">Структура системы управления</p>

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
            {internationalOrgans.map((org) => {
              const isOpen = selectedIntl === org.name;
              return (
                <div key={org.name}>
                  <div
                    onClick={() => setSelectedIntl(isOpen ? null : org.name)}
                    className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4 hover:border-blue-700/50 transition-colors cursor-pointer"
                    style={isOpen ? { borderColor: org.color + "60" } : {}}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: org.color + "20" }}>
                        <Icon name={org.icon} size={18} style={{ color: org.color }} />
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold text-sm leading-tight">{org.name}</div>
                        <div className="font-bold text-sm mt-0.5" style={{ color: org.color }}>{org.members.toLocaleString()} участников</div>
                      </div>
                      <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={14} className="text-gray-500 shrink-0 mt-1" />
                    </div>
                    <div className="text-gray-500 text-xs">{org.desc}</div>
                  </div>
                  {isOpen && (
                    <div className="bg-[#060d1f] border border-blue-900/20 rounded-xl p-4 mt-1 space-y-2" style={{ borderColor: org.color + "30" }}>
                      <p className="text-gray-300 text-sm">{org.details}</p>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="bg-[#0d1225] rounded-lg p-2">
                          <div className="text-gray-500 text-xs">Председатель</div>
                          <div className="text-white text-sm font-medium">{org.chair}</div>
                        </div>
                        <div className="bg-[#0d1225] rounded-lg p-2">
                          <div className="text-gray-500 text-xs">Заседания</div>
                          <div className="text-white text-sm font-medium">{org.meetings}</div>
                        </div>
                      </div>
                      <div className="text-gray-600 text-xs pt-1">Основан: {org.founded}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-center text-gray-700 text-xs mt-6 space-y-1">
            <div>© 13 апреля 2026 · ECSU 2.0 · Все права защищены</div>
            <div>Правообладатель и контрольный пакет акций: Николаев Владимир Владимирович</div>
            <div>Разработчик: Poehali.dev · Партнёрская программа ЕЦСУ</div>
          </div>
        </>
      )}

      {tab === "regional" && (
        <div className="space-y-2">
          {regionalOrgans.map((org) => {
            const isOpen = selectedRegional === org.name;
            const sc = statusColor[org.status as keyof typeof statusColor];
            return (
              <div key={org.name}>
                <div
                  onClick={() => setSelectedRegional(isOpen ? null : org.name)}
                  className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4 hover:border-blue-700/40 transition-colors cursor-pointer"
                  style={isOpen ? { borderColor: sc + "50" } : {}}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-white font-semibold text-sm">{org.name}</div>
                      <div className="text-gray-500 text-xs">{org.region}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ color: sc, background: sc + "15", border: `1px solid ${sc}30` }}
                      >
                        {statusLabel[org.status as keyof typeof statusLabel]}
                      </span>
                      <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={14} className="text-gray-500" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                    <span className="flex items-center gap-1"><Icon name="User" size={11} /> {org.head}</span>
                    <span className="flex items-center gap-1"><Icon name="Users" size={11} /> {org.units} ед.</span>
                    {org.incidents > 0 && (
                      <span className="flex items-center gap-1 text-[#e94560]"><Icon name="AlertCircle" size={11} /> {org.incidents} инц.</span>
                    )}
                  </div>
                </div>
                {isOpen && (
                  <div className="bg-[#060d1f] border border-blue-900/20 rounded-xl p-4 mt-1 space-y-3" style={{ borderColor: sc + "30" }}>
                    <p className="text-gray-300 text-sm">{org.desc}</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-[#0d1225] rounded-lg p-2">
                        <div className="text-gray-500 text-xs">Руководитель</div>
                        <div className="text-white text-sm font-medium">{org.head}</div>
                      </div>
                      <div className="bg-[#0d1225] rounded-lg p-2">
                        <div className="text-gray-500 text-xs">Единиц</div>
                        <div className="text-white text-sm font-medium">{org.units}</div>
                      </div>
                      <div className="bg-[#0d1225] rounded-lg p-2">
                        <div className="text-gray-500 text-xs">Инцидентов</div>
                        <div className="text-sm font-bold" style={{ color: org.incidents > 0 ? "#e94560" : "#00c896" }}>{org.incidents}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Icon name="Phone" size={11} />
                      <span>{org.contact}</span>
                      <span className="mx-2">·</span>
                      <Icon name="Calendar" size={11} />
                      <span>С {org.created}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EcsuOrgans;
