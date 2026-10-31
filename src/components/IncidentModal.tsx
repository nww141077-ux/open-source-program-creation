import { useState } from "react";
import Icon from "@/components/ui/icon";

interface Incident {
  id: string;
  type: string;
  title: string;
  country: string;
  status: string;
  severity: string;
  date: string;
  responsible: string;
  ai: number;
}

interface Action {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  autoApply: boolean;
  legalBasis: string;
}

const RECOMMENDATIONS: Record<string, Action[]> = {
  ecology: [
    {
      id: "notify_authorities",
      label: "Уведомить природоохранные органы",
      description: "Автоматически сформировать и отправить официальное уведомление в местные экологические ведомства",
      icon: "Bell",
      color: "#00ff87",
      autoApply: true,
      legalBasis: "Конвенция о биологическом разнообразии, ст. 14",
    },
    {
      id: "create_report",
      label: "Сформировать доказательный отчёт",
      description: "Собрать все данные инцидента в структурированный отчёт для передачи в расследование",
      icon: "FileText",
      color: "#a855f7",
      autoApply: true,
      legalBasis: "Процедурные нормы ЕЦСУ, раздел 3.2",
    },
    {
      id: "monitor",
      label: "Установить мониторинг зоны",
      description: "Активировать усиленный режим наблюдения за указанным регионом через спутниковые данные",
      icon: "Satellite",
      color: "#3b82f6",
      autoApply: true,
      legalBasis: "Протокол ЕЦСУ по мониторингу, п. 7",
    },
    {
      id: "alert_ngos",
      label: "Оповестить НКО в регионе",
      description: "Направить публичное оповещение экологическим организациям в стране инцидента",
      icon: "Users",
      color: "#f59e0b",
      autoApply: false,
      legalBasis: "Орхусская конвенция об участии общественности",
    },
  ],
  water: [
    {
      id: "water_sample",
      label: "Запросить пробы воды",
      description: "Инициировать официальный запрос на независимое лабораторное исследование воды",
      icon: "Droplets",
      color: "#3b82f6",
      autoApply: true,
      legalBasis: "Водная рамочная директива ЕС / ЮНЕП протокол",
    },
    {
      id: "downstream_alert",
      label: "Оповестить население вниз по течению",
      description: "Автоматически разослать предупреждение населённым пунктам ниже по течению реки",
      icon: "AlertTriangle",
      color: "#f43f5e",
      autoApply: true,
      legalBasis: "Протокол защиты населения ЕЦСУ, ст. 8",
    },
    {
      id: "pollution_source",
      label: "Установить источник загрязнения",
      description: "Запустить алгоритм трассировки загрязнения для определения виновной стороны",
      icon: "Search",
      color: "#a855f7",
      autoApply: true,
      legalBasis: "Принцип загрязнитель платит (ОЭСР)",
    },
    {
      id: "media_release",
      label: "Публичный пресс-релиз",
      description: "Подготовить официальный пресс-релиз ЕЦСУ для открытого информирования общества",
      icon: "Newspaper",
      color: "#00ff87",
      autoApply: false,
      legalBasis: "Принцип прозрачности, Орхусская конвенция",
    },
  ],
  air: [
    {
      id: "air_quality",
      label: "Активировать датчики качества воздуха",
      description: "Подключить сеть атмосферных сенсоров в регионе для точных замеров загрязнения",
      icon: "Wind",
      color: "#f59e0b",
      autoApply: true,
      legalBasis: "Директива о качестве воздуха 2008/50/EC",
    },
    {
      id: "health_alert",
      label: "Медицинское оповещение",
      description: "Направить рекомендации по безопасности для населения затронутых районов",
      icon: "Heart",
      color: "#f43f5e",
      autoApply: true,
      legalBasis: "Протокол охраны здоровья ВОЗ / ЕЦСУ",
    },
    {
      id: "source_inspection",
      label: "Инициировать инспекцию источника",
      description: "Направить официальный запрос на внеплановую проверку предполагаемого источника выброса",
      icon: "ClipboardCheck",
      color: "#3b82f6",
      autoApply: false,
      legalBasis: "IPPC директива, Киотский протокол",
    },
  ],
  cyber: [
    {
      id: "isolate_threat",
      label: "Изолировать угрозу",
      description: "Рекомендовать ответственным службам немедленную изоляцию скомпрометированных систем",
      icon: "Shield",
      color: "#f43f5e",
      autoApply: true,
      legalBasis: "Директива NIS2 ЕС, Будапештская конвенция",
    },
    {
      id: "trace_attack",
      label: "Запустить трассировку атаки",
      description: "Активировать протокол анализа сетевого трафика для отслеживания источника атаки",
      icon: "Network",
      color: "#a855f7",
      autoApply: true,
      legalBasis: "Протокол кибербезопасности ЕЦСУ, раздел 5",
    },
    {
      id: "cert_notify",
      label: "Уведомить CERT страны",
      description: "Направить официальное уведомление национальному центру реагирования на киберинциденты",
      icon: "Send",
      color: "#3b82f6",
      autoApply: true,
      legalBasis: "Международный стандарт ISO/IEC 27035",
    },
    {
      id: "backup_verify",
      label: "Проверка резервных копий",
      description: "Запросить у ответственной стороны верификацию целостности резервных данных",
      icon: "Database",
      color: "#00ff87",
      autoApply: false,
      legalBasis: "NIST Cybersecurity Framework",
    },
  ],
};

const STATUS_COLORS: Record<string, string> = { active: "#f43f5e", investigating: "#f59e0b", resolved: "#00ff87" };
const STATUS_LABELS: Record<string, string> = { active: "Активен", investigating: "Расследование", resolved: "Решён" };
const SEVERITY_COLORS: Record<string, string> = { critical: "#f43f5e", high: "#f59e0b", medium: "#3b82f6" };
const SEVERITY_LABELS: Record<string, string> = { critical: "Критический", high: "Высокий", medium: "Средний" };
const TYPE_LABELS: Record<string, string> = { ecology: "Экология", water: "Вода", air: "Воздух", cyber: "Кибер" };

interface Props {
  incident: Incident;
  onClose: () => void;
}

export default function IncidentModal({ incident, onClose }: Props) {
  const actions = RECOMMENDATIONS[incident.type] || [];
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState<string | null>(null);
  const [log, setLog] = useState<{ id: string; time: string; label: string }[]>([]);

  const autoActions = actions.filter(a => a.autoApply);

  const applyAction = (action: Action) => {
    if (applied.has(action.id) || applying) return;
    setApplying(action.id);
    setTimeout(() => {
      setApplied(prev => new Set([...prev, action.id]));
      setApplying(null);
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      setLog(prev => [{ id: action.id, time, label: action.label }, ...prev]);
    }, 1500);
  };

  const applyAll = () => {
    autoActions.forEach((action, i) => {
      setTimeout(() => applyAction(action), i * 600);
    });
  };

  const allAutoApplied = autoActions.every(a => applied.has(a.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: "#0d1220", border: "1px solid rgba(168,85,247,0.25)" }}>
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7" }}>{incident.id}</span>
              <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ background: `${STATUS_COLORS[incident.status]}20`, color: STATUS_COLORS[incident.status] }}>
                {STATUS_LABELS[incident.status]}
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ background: `${SEVERITY_COLORS[incident.severity]}20`, color: SEVERITY_COLORS[incident.severity] }}>
                {SEVERITY_LABELS[incident.severity]}
              </span>
            </div>
            <h2 className="text-white font-bold text-lg leading-tight">{incident.title}</h2>
            <div className="flex items-center gap-3 mt-1 text-white/40 text-xs">
              <span>{incident.country}</span>
              <span>·</span>
              <span>{TYPE_LABELS[incident.type]}</span>
              <span>·</span>
              <span>{incident.responsible}</span>
              <span>·</span>
              <span>ИИ: {incident.ai}%</span>
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors ml-4 mt-1">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Auto-apply banner */}
          {incident.status !== "resolved" && !allAutoApplied && (
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(0,255,135,0.07)", border: "1px solid rgba(0,255,135,0.2)" }}>
              <div className="flex items-center gap-2">
                <Icon name="Zap" size={16} style={{ color: "#00ff87" }} />
                <span className="text-sm text-white/80">Применить все разрешённые действия автоматически</span>
              </div>
              <button onClick={applyAll}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-black transition-all hover:scale-105"
                style={{ background: "#00ff87" }}>
                Применить все
              </button>
            </div>
          )}

          {/* Recommendations */}
          <div>
            <h3 className="text-white/50 text-xs uppercase tracking-wider font-semibold mb-3">Рекомендуемые действия</h3>
            <div className="space-y-2">
              {actions.map((action) => {
                const isApplied = applied.has(action.id);
                const isApplying = applying === action.id;
                return (
                  <div key={action.id} className="p-4 rounded-xl transition-all"
                    style={{
                      background: isApplied ? `${action.color}08` : "rgba(255,255,255,0.02)",
                      border: `1px solid ${isApplied ? action.color + "30" : "rgba(255,255,255,0.06)"}`,
                    }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: `${action.color}15` }}>
                          {isApplied
                            ? <Icon name="CheckCircle" size={16} style={{ color: action.color }} />
                            : <Icon name={action.icon} fallback="Zap" size={16} style={{ color: action.color }} />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white text-sm font-semibold">{action.label}</span>
                            {action.autoApply && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: "rgba(0,255,135,0.15)", color: "#00ff87" }}>АВТО</span>
                            )}
                            {isApplied && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${action.color}20`, color: action.color }}>ВЫПОЛНЕНО</span>
                            )}
                          </div>
                          <p className="text-white/40 text-xs mt-1 leading-relaxed">{action.description}</p>
                          <p className="text-white/25 text-[10px] mt-1">📜 {action.legalBasis}</p>
                        </div>
                      </div>
                      {!isApplied && incident.status !== "resolved" && (
                        <button
                          onClick={() => applyAction(action)}
                          disabled={!!applying}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 transition-all hover:scale-105 disabled:opacity-50"
                          style={{ background: `${action.color}20`, color: action.color, border: `1px solid ${action.color}40` }}>
                          {isApplying ? (
                            <span className="flex items-center gap-1">
                              <Icon name="Loader" size={12} className="animate-spin" />
                              ...
                            </span>
                          ) : "Применить"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action log */}
          {log.length > 0 && (
            <div>
              <h3 className="text-white/50 text-xs uppercase tracking-wider font-semibold mb-3">Журнал действий</h3>
              <div className="space-y-1.5">
                {log.map((entry, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs p-2 rounded-lg" style={{ background: "rgba(0,255,135,0.05)" }}>
                    <span className="text-white/30 font-mono">{entry.time}</span>
                    <Icon name="CheckCircle" size={12} style={{ color: "#00ff87" }} />
                    <span className="text-white/60">{entry.label}</span>
                    <span className="ml-auto text-white/20">системой ЕЦСУ</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legal disclaimer */}
          <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.15)" }}>
            <Icon name="Scale" size={14} style={{ color: "#a855f7" }} className="mt-0.5 flex-shrink-0" />
            <p className="text-white/40 text-xs leading-relaxed">
              Все автоматические действия выполняются строго в рамках международного права и публичных процедур.
              Принудительные меры требуют подтверждения уполномоченного координатора ЕЦСУ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}