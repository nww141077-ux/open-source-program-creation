/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import IncidentModal from "@/components/IncidentModal";
import DashboardLayout from "./egsu-dashboard/DashboardLayout";
import DashboardOverview from "./egsu-dashboard/DashboardOverview";
import DashboardIncidents from "./egsu-dashboard/DashboardIncidents";
import PredictedTab from "./egsu-dashboard/PredictedTab";

const API = "https://functions.poehali.dev/c71047de-6e10-499a-aa1c-e9fdba33e7bd";

const DEMO_INCIDENTS = [
  { id: "INC-001", type: "ecology", title: "Незаконная вырубка леса", country: "Бразилия", status: "active", severity: "high", date: "12.04.2026", responsible: "ОГР-Экология", ai: 92 },
  { id: "INC-002", type: "water", title: "Загрязнение реки Рейн", country: "Германия", status: "investigating", severity: "medium", date: "11.04.2026", responsible: "ОГР-Водные ресурсы", ai: 87 },
  { id: "INC-003", type: "air", title: "Выброс CO₂ сверх нормы", country: "Китай", status: "resolved", severity: "high", date: "10.04.2026", responsible: "ОГР-Атмосфера", ai: 95 },
  { id: "INC-004", type: "ecology", title: "Браконьерство в заповеднике", country: "Кения", status: "active", severity: "medium", date: "09.04.2026", responsible: "ОГР-Экология", ai: 76 },
  { id: "INC-005", type: "cyber", title: "Кибератака на инфраструктуру", country: "Норвегия", status: "investigating", severity: "critical", date: "08.04.2026", responsible: "ОГР-Киберзащита", ai: 88 },
  { id: "INC-006", type: "water", title: "Нефтяной разлив", country: "Нигерия", status: "active", severity: "critical", date: "07.04.2026", responsible: "ОГР-Водные ресурсы", ai: 91 },
  { id: "INC-007", type: "air", title: "Лесные пожары", country: "Канада", status: "resolved", severity: "high", date: "06.04.2026", responsible: "ОГР-Атмосфера", ai: 83 },
  { id: "INC-008", type: "ecology", title: "Незаконный сброс отходов", country: "Индия", status: "active", severity: "medium", date: "05.04.2026", responsible: "ОГР-Экология", ai: 79 },
];

function normalizeIncident(raw: any) {
  return {
    id: raw.incident_code || raw.id,
    type: raw.type,
    title: raw.title,
    country: raw.country,
    status: raw.status === "verified" ? "active" : raw.status === "pending_verification" ? "investigating" : raw.status,
    severity: raw.severity,
    date: raw.created_at ? new Date(raw.created_at).toLocaleDateString("ru-RU") : "",
    responsible: raw.responsible_organ || "ОГР-Общий",
    ai: raw.ai_confidence || 0,
    actions: raw.actions || [],
    _raw: raw,
  };
}

type NavTab = "overview" | "incidents" | "predicted" | "ai" | "organs";

const AI_ALGORITHMS = [
  {
    name: "Классификатор инцидентов",
    accuracy: 78,
    status: "active",
    model: "CNN v2.1",
    processed: "12 847",
    latency: "120мс",
    icon: "ScanSearch",
    description: "Нейросеть на базе свёрточной сети (CNN), обученная распознавать тип и категорию инцидента по входящим данным. Автоматически определяет: экологический, кибер-, гуманитарный или другой тип угрозы и направляет на нужный орган.",
    functions: [
      "Автоматическая классификация по 12 категориям угроз",
      "Определение географической зоны инцидента",
      "Присвоение уровня приоритета (низкий / средний / высокий / критический)",
      "Маршрутизация на ответственный орган ЕЦСУ",
      "Дедупликация — объединение похожих инцидентов",
    ],
  },
  {
    name: "Детектор аномалий",
    accuracy: 84,
    status: "active",
    model: "LSTM v1.8",
    processed: "9 203",
    latency: "85мс",
    icon: "Activity",
    description: "Рекуррентная нейросеть (LSTM), которая непрерывно анализирует потоки данных с датчиков, спутников и агентов. Выявляет отклонения от нормы и предупреждает о надвигающихся угрозах до их эскалации.",
    functions: [
      "Мониторинг в реальном времени: 240+ потоков данных",
      "Обнаружение аномальных паттернов в экологических показателях",
      "Прогноз эскалации инцидента за 2–6 часов",
      "Детекция кибератак и подозрительной активности в сети",
      "Генерация предупреждений и тревог для операторов",
    ],
  },
  {
    name: "Генератор отчётов (NLP)",
    accuracy: 91,
    status: "active",
    model: "Transformer v3",
    processed: "4 512",
    latency: "210мс",
    icon: "FileText",
    description: "Языковая модель на базе архитектуры Transformer, которая автоматически формирует официальные отчёты, сводки и правовые заключения по инцидентам на русском и английском языках.",
    functions: [
      "Генерация структурированных отчётов по шаблонам ЕЦСУ",
      "Правовая квалификация нарушений по международным нормам",
      "Перевод технических данных в понятный язык",
      "Формирование рекомендаций для органов реагирования",
      "Поддержка 8 языков (включая русский, английский, французский)",
    ],
  },
];

const ORGANS = [
  {
    name: "Глобальный совет безопасности (ГСБ)", members: 45, color: "#a855f7", icon: "Shield",
    desc: "Стратегическое планирование, утверждение бюджета",
    description: "Высший орган ЕЦСУ, определяющий стратегию глобальной безопасности. Принимает решения о крупных операциях, утверждает бюджет системы и координирует действия всех подразделений в чрезвычайных ситуациях планетарного масштаба.",
    location: "Женева, Швейцария",
    founded: "2021",
    functions: [
      "Утверждение стратегических планов реагирования",
      "Распределение бюджета между органами ЕЦСУ",
      "Принятие решений о применении СБР",
      "Ратификация международных соглашений",
      "Надзор за соблюдением Устава ЕЦСУ",
    ],
    stats: [{ label: "Заседаний/год", value: "48" }, { label: "Резолюций", value: "312" }, { label: "Стран-членов", value: "195" }],
  },
  {
    name: "Международный суд справедливости (МС)", members: 15, color: "#3b82f6", icon: "Scale",
    desc: "Рассмотрение дел о нарушениях международного права",
    description: "Независимый судебный орган ЕЦСУ, рассматривающий дела о грубых нарушениях международного права, экологических преступлениях и злоупотреблениях властью. Решения обязательны к исполнению для всех членов системы.",
    location: "Гаага, Нидерланды",
    founded: "2021",
    functions: [
      "Рассмотрение межгосударственных споров",
      "Вынесение приговоров по экологическим преступлениям",
      "Наложение санкций на нарушителей",
      "Толкование норм международного права ЕЦСУ",
      "Апелляционное рассмотрение решений ОГР",
    ],
    stats: [{ label: "Дел рассмотрено", value: "847" }, { label: "Приговоров", value: "203" }, { label: "Санкций", value: "91" }],
  },
  {
    name: "Оперативная группа расследования (ОГР)", members: 120, color: "#f59e0b", icon: "Search",
    desc: "Фиксация фактов, сбор доказательств, расследования",
    description: "Специализированные следственные группы, действующие на местах инцидентов. Собирают доказательную базу, опрашивают свидетелей, берут пробы и передают материалы в МС ЕЦСУ для судебного разбирательства.",
    location: "Полевые миссии по всему миру",
    founded: "2021",
    functions: [
      "Выезд на место инцидента в течение 24 часов",
      "Сбор физических и цифровых доказательств",
      "Взаимодействие с местными властями и НКО",
      "Формирование официальных протоколов расследования",
      "Защита свидетелей и информаторов",
    ],
    stats: [{ label: "Расследований", value: "2 341" }, { label: "Активных миссий", value: "34" }, { label: "Стран присутствия", value: "87" }],
  },
  {
    name: "Силы быстрого реагирования (СБР)", members: 5000, color: "#f43f5e", icon: "Zap",
    desc: "Пресечение нарушений, защита гражданского населения",
    description: "Международные силы немедленного реагирования, действующие по мандату ГСБ. Развёртываются в зонах активных экологических катастроф, гуманитарных кризисов и кибератак на критическую инфраструктуру.",
    location: "Базы на 6 континентах",
    founded: "2022",
    functions: [
      "Развёртывание в зонах кризиса за 6–72 часа",
      "Защита гражданского населения в зонах катастроф",
      "Ликвидация последствий экологических аварий",
      "Обеспечение безопасности следственных миссий ОГР",
      "Кибернетическая защита критической инфраструктуры",
    ],
    stats: [{ label: "Операций", value: "156" }, { label: "Время реакции", value: "6ч" }, { label: "Баз", value: "24" }],
  },
  {
    name: "Межпарламентский совет (МПСТУ)", members: 94, color: "#00ff87", icon: "Users",
    desc: "Мониторинг технологической устойчивости",
    description: "Парламентский орган надзора, представляющий законодательные ассамблеи стран-членов. Обеспечивает демократический контроль над деятельностью ЕЦСУ, утверждает поправки к Уставу и защищает суверенные интересы государств.",
    location: "Страсбург, Франция",
    founded: "2021",
    functions: [
      "Парламентский контроль над бюджетом ЕЦСУ",
      "Ратификация поправок к Уставу",
      "Мониторинг соблюдения прав государств-членов",
      "Публичные слушания по деятельности органов",
      "Разработка рекомендаций по технологической политике",
    ],
    stats: [{ label: "Стран", value: "94" }, { label: "Заседаний", value: "36" }, { label: "Законопроектов", value: "128" }],
  },
  {
    name: "Комиссия по этике и науке (КЭН)", members: 24, color: "#06b6d4", icon: "Microscope",
    desc: "Оценка угроз, разработка стандартов ИИ",
    description: "Экспертный орган, объединяющий ведущих учёных, этиков и технических специалистов. Оценивает риски применения новых технологий, разрабатывает стандарты ИИ-алгоритмов ЕЦСУ и проводит независимый аудит алгоритмических систем.",
    location: "Цюрих, Швейцария",
    founded: "2022",
    functions: [
      "Независимый аудит ИИ-алгоритмов ЕЦСУ",
      "Разработка этических стандартов применения технологий",
      "Оценка рисков новых инструментов мониторинга",
      "Консультирование ГСБ по научным вопросам",
      "Публикация открытых научных отчётов",
    ],
    stats: [{ label: "Аудитов ИИ", value: "47" }, { label: "Стандартов", value: "23" }, { label: "Публикаций", value: "312" }],
  },
];

export default function EgsuDashboard() {
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [dbIncidents, setDbIncidents] = useState<any[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);
  const [selectedAi, setSelectedAi] = useState<typeof AI_ALGORITHMS[0] | null>(null);
  const [selectedOrgan, setSelectedOrgan] = useState<typeof ORGANS[0] | null>(null);

  useEffect(() => {
    fetch(API)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setDbIncidents(data.map(normalizeIncident));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingDb(false));
  }, []);

  const INCIDENTS = dbIncidents.length > 0 ? dbIncidents : DEMO_INCIDENTS;

  void loadingDb;

  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      chatOpen={chatOpen}
      setChatOpen={setChatOpen}
    >
      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <DashboardOverview
          incidents={INCIDENTS}
          onShowAll={() => setActiveTab("incidents")}
          onSelectIncident={setSelectedIncident}
        />
      )}

      {/* INCIDENTS */}
      {activeTab === "incidents" && (
        <DashboardIncidents
          incidents={INCIDENTS}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onSelectIncident={setSelectedIncident}
        />
      )}

      {/* PREDICTED */}
      {activeTab === "predicted" && <PredictedTab />}

      {/* AI */}
      {activeTab === "ai" && (
        <div className="space-y-5 animate-fade-up">
          <div>
            <h1 className="font-display text-2xl font-bold text-white uppercase">ИИ-аналитика</h1>
            <p className="text-white/30 text-sm mt-0.5">Состояние алгоритмов · Открытый код</p>
          </div>
          <>
                <div className="grid md:grid-cols-3 gap-4">
                  {AI_ALGORITHMS.map((ai) => (
                    <button key={ai.name} onClick={() => setSelectedAi(ai)}
                      className="p-5 rounded-2xl text-left transition-all hover:scale-[1.02] cursor-pointer"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(168,85,247,0.15)" }}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#00ff87" }} />
                          <span className="text-white/60 text-xs font-semibold uppercase">{ai.status}</span>
                        </div>
                        <Icon name="Info" size={14} className="text-white/20" />
                      </div>
                      <h3 className="text-white font-semibold text-sm mb-1">{ai.name}</h3>
                      <p className="text-white/30 text-xs mb-4">{ai.model}</p>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-white/40">Точность</span>
                        <span style={{ color: ai.accuracy >= 85 ? "#00ff87" : "#f59e0b" }}>{ai.accuracy}%</span>
                      </div>
                      <div className="h-2 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-2 rounded-full" style={{ width: `${ai.accuracy}%`, background: "linear-gradient(to right, #a855f7, #3b82f6)" }} />
                      </div>
                      <div className="text-white/30 text-xs">Обработано: <span className="text-white/60">{ai.processed}</span></div>
                    </button>
                  ))}
                </div>

                {/* Модальное окно */}
                {selectedAi && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
                    onClick={() => setSelectedAi(null)}>
                    <div className="w-full max-w-md rounded-2xl p-6 relative"
                      style={{ background: "#0d1220", border: "1px solid rgba(168,85,247,0.35)", boxShadow: "0 0 60px rgba(168,85,247,0.15)" }}
                      onClick={e => e.stopPropagation()}>
                      {/* Заголовок */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
                            <Icon name={selectedAi.icon} size={18} className="text-white" />
                          </div>
                          <div>
                            <h2 className="text-white font-bold text-base leading-tight">{selectedAi.name}</h2>
                            <p className="text-white/30 text-xs mt-0.5">{selectedAi.model}</p>
                          </div>
                        </div>
                        <button onClick={() => setSelectedAi(null)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 transition-colors"
                          style={{ background: "rgba(255,255,255,0.05)" }}>
                          <Icon name="X" size={14} />
                        </button>
                      </div>

                      {/* Статус */}
                      <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl"
                        style={{ background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.12)" }}>
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#00ff87" }} />
                        <span className="text-xs font-semibold uppercase" style={{ color: "#00ff87" }}>ACTIVE — работает в штатном режиме</span>
                      </div>

                      {/* Описание */}
                      <p className="text-white/60 text-sm leading-relaxed mb-5">{selectedAi.description}</p>

                      {/* Метрики */}
                      <div className="grid grid-cols-3 gap-3 mb-5">
                        <div className="rounded-xl p-3 text-center"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <div className="text-lg font-bold" style={{ color: selectedAi.accuracy >= 85 ? "#00ff87" : "#f59e0b" }}>{selectedAi.accuracy}%</div>
                          <div className="text-white/30 text-[10px] mt-0.5">Точность</div>
                        </div>
                        <div className="rounded-xl p-3 text-center"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <div className="text-lg font-bold text-white">{selectedAi.processed}</div>
                          <div className="text-white/30 text-[10px] mt-0.5">Обработано</div>
                        </div>
                        <div className="rounded-xl p-3 text-center"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <div className="text-lg font-bold" style={{ color: "#3b82f6" }}>{selectedAi.latency}</div>
                          <div className="text-white/30 text-[10px] mt-0.5">Латентность</div>
                        </div>
                      </div>

                      {/* Функции */}
                      <div className="mb-4">
                        <h4 className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Основные функции</h4>
                        <div className="space-y-1.5">
                          {selectedAi.functions.map((fn) => (
                            <div key={fn} className="flex items-start gap-2 text-sm text-white/65">
                              <Icon name="Check" size={13} className="mt-0.5 shrink-0" style={{ color: "#a855f7" }} />
                              {fn}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Прогресс */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/30">Точность модели</span>
                          <span style={{ color: selectedAi.accuracy >= 85 ? "#00ff87" : "#f59e0b" }}>{selectedAi.accuracy}%</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-1.5 rounded-full transition-all" style={{ width: `${selectedAi.accuracy}%`, background: "linear-gradient(to right, #a855f7, #3b82f6)" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
          </>
          <div className="p-5 rounded-2xl" style={{ background: "rgba(0,255,135,0.04)", border: "1px solid rgba(0,255,135,0.1)" }}>
            <h3 className="font-display text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Принципы использования ИИ (ЕЦСУ 2.0)</h3>
            <div className="grid md:grid-cols-2 gap-2">
              {["Прозрачность: открытый исходный код алгоритмов", "Подотчётность: чёткая ответственность за ошибки", "Этика: запрет на слежку и дискриминацию", "Безопасность: многоуровневая защита данных", "Инклюзивность: поддержка разных языков", "Гибкость: возможность перехода на ручное управление"].map((p) => (
                <div key={p} className="flex items-start gap-2 text-xs text-white/50">
                  <Icon name="Check" size={12} style={{ color: "#00ff87" }} className="mt-0.5 shrink-0" />
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ORGANS */}
      {activeTab === "organs" && (
        <div className="space-y-5 animate-fade-up">
          <div>
            <h1 className="font-display text-2xl font-bold text-white uppercase">Органы ЕЦСУ</h1>
            <p className="text-white/30 text-sm mt-0.5">Структура системы управления</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {ORGANS.map((org) => (
              <button key={org.name} onClick={() => setSelectedOrgan(org)}
                className="p-5 rounded-2xl text-left transition-all hover:scale-[1.02] cursor-pointer w-full"
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${org.color}20` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `${org.color}15` }}>
                      <Icon name={org.icon as any} size={18} style={{ color: org.color }} />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm leading-tight">{org.name}</h3>
                      <span className="text-xs" style={{ color: org.color }}>{org.members} участников</span>
                    </div>
                  </div>
                  <Icon name="Info" size={14} className="text-white/20 shrink-0" />
                </div>
                <p className="text-white/40 text-xs">{org.desc}</p>
              </button>
            ))}
          </div>

          {/* Модальное окно органа */}
          {selectedOrgan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
              onClick={() => setSelectedOrgan(null)}>
              <div className="w-full max-w-md rounded-2xl p-6 relative overflow-y-auto max-h-[90vh]"
                style={{ background: "#0d1220", border: `1px solid ${selectedOrgan.color}40`, boxShadow: `0 0 60px ${selectedOrgan.color}20` }}
                onClick={e => e.stopPropagation()}>
                {/* Заголовок */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${selectedOrgan.color}20` }}>
                      <Icon name={selectedOrgan.icon as any} size={22} style={{ color: selectedOrgan.color }} />
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-sm leading-tight">{selectedOrgan.name}</h2>
                      <p className="text-white/30 text-xs mt-0.5">Основан в {selectedOrgan.founded} · {selectedOrgan.location}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedOrgan(null)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 transition-colors shrink-0 ml-2"
                    style={{ background: "rgba(255,255,255,0.05)" }}>
                    <Icon name="X" size={14} />
                  </button>
                </div>

                {/* Бейдж участников */}
                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl"
                  style={{ background: `${selectedOrgan.color}10`, border: `1px solid ${selectedOrgan.color}25` }}>
                  <Icon name="Users" size={13} style={{ color: selectedOrgan.color }} />
                  <span className="text-xs font-semibold" style={{ color: selectedOrgan.color }}>{selectedOrgan.members} участников · Действующий орган</span>
                </div>

                {/* Описание */}
                <p className="text-white/60 text-sm leading-relaxed mb-5">{selectedOrgan.description}</p>

                {/* Статистика */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {selectedOrgan.stats.map(s => (
                    <div key={s.label} className="rounded-xl p-3 text-center"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="text-base font-bold" style={{ color: selectedOrgan.color }}>{s.value}</div>
                      <div className="text-white/30 text-[10px] mt-0.5 leading-tight">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Функции */}
                <div>
                  <h4 className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Основные функции</h4>
                  <div className="space-y-1.5">
                    {selectedOrgan.functions.map(fn => (
                      <div key={fn} className="flex items-start gap-2 text-sm text-white/65">
                        <Icon name="Check" size={13} className="mt-0.5 shrink-0" style={{ color: selectedOrgan.color }} />
                        {fn}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Incident detail modal */}
      {selectedIncident && (
        <IncidentModal incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
      )}
    </DashboardLayout>
  );
}