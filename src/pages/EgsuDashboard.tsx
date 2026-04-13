/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import IncidentModal from "@/components/IncidentModal";
import AiChat from "@/components/AiChat";

const API = "https://functions.poehali.dev/c71047de-6e10-499a-aa1c-e9fdba33e7bd";

// Демо-инциденты — показываются пока база пустая
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

const WEEKLY = [
  { day: "Пн", count: 12 },
  { day: "Вт", count: 19 },
  { day: "Ср", count: 8 },
  { day: "Чт", count: 24 },
  { day: "Пт", count: 16 },
  { day: "Сб", count: 9 },
  { day: "Вс", count: 14 },
];

const BY_TYPE = [
  { type: "Экология", count: 45, color: "#00ff87" },
  { type: "Вода", count: 28, color: "#3b82f6" },
  { type: "Воздух", count: 19, color: "#f59e0b" },
  { type: "Кибер", count: 8, color: "#f43f5e" },
];

const TYPE_COLORS: Record<string, string> = { ecology: "#00ff87", water: "#3b82f6", air: "#f59e0b", cyber: "#f43f5e" };
const TYPE_LABELS: Record<string, string> = { ecology: "Экология", water: "Вода", air: "Воздух", cyber: "Кибер" };
const STATUS_COLORS: Record<string, string> = { active: "#f43f5e", investigating: "#f59e0b", resolved: "#00ff87" };
const STATUS_LABELS: Record<string, string> = { active: "Активен", investigating: "Расследование", resolved: "Решён" };
const SEVERITY_COLORS: Record<string, string> = { critical: "#f43f5e", high: "#f59e0b", medium: "#3b82f6" };
const SEVERITY_LABELS: Record<string, string> = { critical: "Критический", high: "Высокий", medium: "Средний" };

const maxCount = Math.max(...WEEKLY.map(w => w.count));
const total = BY_TYPE.reduce((a, b) => a + b.count, 0);

type NavTab = "overview" | "incidents" | "predicted" | "ai" | "organs";

const PREDICTED_INCIDENTS = [
  {
    id: "PRD-001", type: "ecology", title: "Возможная вырубка леса в бассейне Амазонки", country: "Бразилия",
    probability: 87, severity: "high", horizon: "7 дней", source: "Спутниковые данные + тренд",
    signals: ["Рост активности лесозаготовительной техники", "Снижение индекса NDVI на 12%", "Исторический паттерн апрель–май"],
    response: "Направить запрос в ОГР-Экология, уведомить МС ЕЦСУ",
  },
  {
    id: "PRD-002", type: "cyber", title: "Кибератака на энергосистему ЕС", country: "Германия / Польша",
    probability: 74, severity: "critical", horizon: "3 дня", source: "Threat Intelligence + аномалии трафика",
    signals: ["Рост сканирований портов АСУ ТП на 340%", "Известная группировка активизировалась", "Аналог атаки 2022 года"],
    response: "Предупредить ОГР-Киберзащита, рекомендовать изоляцию сегментов сети",
  },
  {
    id: "PRD-003", type: "water", title: "Загрязнение водоёма промышленными стоками", country: "Индия",
    probability: 91, severity: "high", horizon: "24 часа", source: "IoT-датчики + жалобы населения",
    signals: ["pH воды упал до 4.2 (норма 6.5–8.5)", "Запах серы зафиксирован 3 датчиками", "Завод работает в сверхурочном режиме"],
    response: "Экстренный мониторинг ОГР-Водные ресурсы, запрос документов у предприятия",
  },
  {
    id: "PRD-004", type: "air", title: "Превышение CO₂ в промышленном регионе", country: "Китай",
    probability: 68, severity: "medium", horizon: "14 дней", source: "Прогноз погоды + данные выбросов",
    signals: ["Штиль ожидается 5–10 дней", "Выбросы выше нормы на 28% последние 2 недели", "Аналогичный эпизод был в 2024 году"],
    response: "Предупредить местные органы, подготовить рекомендации по ограничению выбросов",
  },
  {
    id: "PRD-005", type: "ecology", title: "Браконьерство в сезон миграции", country: "Кения / Танзания",
    probability: 82, severity: "medium", horizon: "10 дней", source: "Сезонный анализ + агентурные данные",
    signals: ["Сезон миграции гну начинается", "Активность браконьерских групп возросла", "Слабый контроль на границе"],
    response: "Усилить патрулирование ОГР-Экология, координация с местными властями",
  },
];

const PRED_TYPE_COLORS: Record<string, string> = { ecology: "#00ff87", water: "#3b82f6", air: "#f59e0b", cyber: "#f43f5e" };
const PRED_TYPE_LABELS: Record<string, string> = { ecology: "Экология", water: "Вода", air: "Воздух", cyber: "Кибер" };
const PRED_SEV_COLORS: Record<string, string> = { critical: "#f43f5e", high: "#f59e0b", medium: "#3b82f6" };
const PRED_SEV_LABELS: Record<string, string> = { critical: "Критический", high: "Высокий", medium: "Средний" };

type PredIncident = typeof PREDICTED_INCIDENTS[0];

function PredictedTab() {
  const [selected, setSelected] = useState<PredIncident | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: "", country: "", type: "ecology", severity: "medium", horizon: "", probability: "70", signals: "", response: "" });
  const [custom, setCustom] = useState<PredIncident[]>([]);
  const [reacted, setReacted] = useState<Set<string>>(new Set());

  const all = [...PREDICTED_INCIDENTS, ...custom];

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const newInc: PredIncident = {
      id: `PRD-C${custom.length + 1}`.padEnd(7, "0"),
      type: form.type,
      title: form.title,
      country: form.country,
      probability: Number(form.probability),
      severity: form.severity,
      horizon: form.horizon,
      source: "Создан вручную оператором",
      signals: form.signals.split("\n").filter(Boolean),
      response: form.response,
    };
    setCustom(prev => [newInc, ...prev]);
    setCreateOpen(false);
    setForm({ title: "", country: "", type: "ecology", severity: "medium", horizon: "", probability: "70", signals: "", response: "" });
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-white uppercase">Предполагаемые инциденты</h1>
          <p className="text-white/30 text-sm mt-0.5">ИИ-прогнозы угроз · Ранее предупреждение · Реагирование</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-black transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
          <Icon name="Plus" size={15} />
          Добавить прогноз
        </button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Всего прогнозов", value: all.length, color: "#a855f7", icon: "BrainCircuit" },
          { label: "Критические", value: all.filter(i => i.severity === "critical").length, color: "#f43f5e", icon: "AlertOctagon" },
          { label: "Среднее P(%)", value: Math.round(all.reduce((s, i) => s + i.probability, 0) / all.length) + "%", color: "#f59e0b", icon: "TrendingUp" },
          { label: "Отработано", value: reacted.size, color: "#00ff87", icon: "CheckCircle" },
        ].map(k => (
          <div key={k.label} className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${k.color}20` }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon name={k.icon as any} size={15} style={{ color: k.color }} />
              <span className="text-white/30 text-xs">{k.label}</span>
            </div>
            <div className="font-display text-2xl font-bold" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Список */}
      <div className="space-y-3">
        {all.map(inc => (
          <div key={inc.id}
            className="rounded-2xl p-4 cursor-pointer transition-all"
            style={{
              background: selected?.id === inc.id ? `${PRED_SEV_COLORS[inc.severity]}08` : "rgba(255,255,255,0.03)",
              border: `1px solid ${selected?.id === inc.id ? PRED_SEV_COLORS[inc.severity] + "40" : "rgba(255,255,255,0.06)"}`,
            }}
            onClick={() => setSelected(selected?.id === inc.id ? null : inc)}>
            <div className="flex items-start gap-4">
              {/* Вероятность */}
              <div className="flex flex-col items-center shrink-0 w-14">
                <div className="text-2xl font-bold leading-none" style={{ color: inc.probability >= 85 ? "#f43f5e" : inc.probability >= 70 ? "#f59e0b" : "#3b82f6" }}>
                  {inc.probability}%
                </div>
                <div className="text-[9px] text-white/30 uppercase mt-0.5">вероятность</div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: `${PRED_TYPE_COLORS[inc.type]}15`, color: PRED_TYPE_COLORS[inc.type] }}>
                    {PRED_TYPE_LABELS[inc.type]}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: `${PRED_SEV_COLORS[inc.severity]}15`, color: PRED_SEV_COLORS[inc.severity] }}>
                    {PRED_SEV_LABELS[inc.severity]}
                  </span>
                  <span className="text-xs text-white/30">⏱ {inc.horizon}</span>
                  <span className="text-xs text-white/20">{inc.id}</span>
                </div>
                <div className="text-white font-semibold text-sm">{inc.title}</div>
                <div className="text-white/40 text-xs mt-0.5">{inc.country} · {inc.source}</div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {reacted.has(inc.id)
                  ? <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: "rgba(0,255,135,0.12)", color: "#00ff87" }}>✓ Отработан</span>
                  : <button
                      onClick={e => { e.stopPropagation(); setReacted(prev => new Set([...prev, inc.id])); }}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold text-black transition-all hover:scale-105"
                      style={{ background: "linear-gradient(135deg, #f43f5e, #f59e0b)" }}>
                      Реагировать
                    </button>
                }
                <Icon name={selected?.id === inc.id ? "ChevronUp" : "ChevronDown"} size={14} className="text-white/30" />
              </div>
            </div>

            {/* Детали */}
            {selected?.id === inc.id && (
              <div className="mt-4 pt-4 grid md:grid-cols-2 gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Сигналы тревоги</div>
                  <div className="space-y-1.5">
                    {inc.signals.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                        <span style={{ color: "#f59e0b" }}>▲</span>{s}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-3" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
                  <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Рекомендуемые меры</div>
                  <div className="text-xs text-white/70 leading-relaxed">{inc.response}</div>
                  {!reacted.has(inc.id) && (
                    <button
                      onClick={() => setReacted(prev => new Set([...prev, inc.id]))}
                      className="mt-3 w-full py-2 rounded-lg text-xs font-semibold text-black transition-all hover:scale-105"
                      style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
                      Применить меры реагирования
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Модал создания */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: "#0d1321", border: "1px solid rgba(168,85,247,0.3)" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="font-display text-lg font-bold text-white">Новый прогноз инцидента</div>
              <button onClick={() => setCreateOpen(false)} className="text-white/40 hover:text-white/70">
                <Icon name="X" size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Название угрозы *</label>
                <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Например: Возможный разлив нефти..."
                  className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Страна / Регион *</label>
                  <input required value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                    placeholder="Россия, ЕС..."
                    className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Горизонт (срок)</label>
                  <input value={form.horizon} onChange={e => setForm(p => ({ ...p, horizon: e.target.value }))}
                    placeholder="7 дней, 24 часа..."
                    className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Тип</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <option value="ecology">Экология</option>
                    <option value="water">Вода</option>
                    <option value="air">Воздух</option>
                    <option value="cyber">Кибер</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Угроза</label>
                  <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <option value="critical">Критический</option>
                    <option value="high">Высокий</option>
                    <option value="medium">Средний</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Вероятность %</label>
                  <input type="number" min="1" max="99" value={form.probability}
                    onChange={e => setForm(p => ({ ...p, probability: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Сигналы тревоги (каждый с новой строки)</label>
                <textarea value={form.signals} onChange={e => setForm(p => ({ ...p, signals: e.target.value }))}
                  rows={3} placeholder={"Рост активности...\nАномалия датчиков..."}
                  className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-white/20 outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Рекомендуемые меры реагирования</label>
                <textarea value={form.response} onChange={e => setForm(p => ({ ...p, response: e.target.value }))}
                  rows={2} placeholder="Направить запрос в ОГР..."
                  className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-white/20 outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setCreateOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/50 transition-all"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                  Отмена
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-black transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
                  Создать прогноз
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EgsuDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [dbIncidents, setDbIncidents] = useState<any[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);

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
  const filtered = statusFilter === "all" ? INCIDENTS : INCIDENTS.filter((i: any) => i.status === statusFilter);

  return (
    <div className="min-h-screen font-body" style={{ background: "#060a12" }}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-3"
        style={{ background: "rgba(6,10,18,0.97)", borderBottom: "1px solid rgba(168,85,247,0.15)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/egsu")} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
            <Icon name="ChevronLeft" size={16} />
          </button>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
            <Icon name="LayoutDashboard" size={14} className="text-white" />
          </div>
          <div>
            <div className="font-display text-base font-bold text-white tracking-wide leading-none">ДАШБОРД КООРДИНАТОРА</div>
            <div className="text-white/30 text-[10px]">ЕЦСУ 2.0 · Аналитика</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/egsu/docs")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
            style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }}>
            <Icon name="FileText" size={14} />
            <span className="hidden md:block">Документы</span>
          </button>
          <button onClick={() => navigate("/egsu/report")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-black transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #f43f5e, #f59e0b)" }}>
            <Icon name="Plus" size={14} />
            <span className="hidden md:block">Новый инцидент</span>
          </button>
        </div>
      </nav>

      <div className="pt-14 flex">
        {/* SIDEBAR */}
        <aside className="fixed left-0 top-14 bottom-0 w-14 md:w-52 flex flex-col py-4 gap-1 px-2"
          style={{ background: "rgba(6,10,18,0.95)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
          {([
            { key: "overview", icon: "BarChart3", label: "Обзор" },
            { key: "incidents", icon: "AlertTriangle", label: "Инциденты" },
            { key: "predicted", icon: "BrainCircuit", label: "Прогнозы" },
            { key: "ai", icon: "Cpu", label: "ИИ-аналитика" },
            { key: "organs", icon: "Network", label: "Органы ЕЦСУ" },
          ] as { key: NavTab; icon: string; label: string }[]).map((item) => (
            <button key={item.key} onClick={() => setActiveTab(item.key)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left"
              style={{
                background: activeTab === item.key ? "rgba(168,85,247,0.12)" : "transparent",
                color: activeTab === item.key ? "#a855f7" : "rgba(255,255,255,0.4)",
                border: activeTab === item.key ? "1px solid rgba(168,85,247,0.25)" : "1px solid transparent",
              }}>
              <Icon name={item.icon as any} size={17} />
              <span className="hidden md:block">{item.label}</span>
            </button>
          ))}
        </aside>

        {/* MAIN */}
        <main className="flex-1 ml-14 md:ml-52 p-4 md:p-6">

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-5 animate-fade-up">
              <div>
                <h1 className="font-display text-2xl font-bold text-white uppercase">Обзор системы</h1>
                <p className="text-white/30 text-sm mt-0.5">Апрель 2026 · Все регионы</p>
              </div>

              {/* KPI */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Всего инцидентов", value: "1 247", delta: "+12%", icon: "AlertTriangle", color: "#f43f5e" },
                  { label: "Решено", value: "893", delta: "+8%", icon: "CheckCircle", color: "#00ff87" },
                  { label: "Активных", value: "241", delta: "-3%", icon: "Activity", color: "#f59e0b" },
                  { label: "Стран-участниц", value: "47", delta: "+2", icon: "Globe", color: "#a855f7" },
                ].map((kpi) => (
                  <div key={kpi.label} className="p-4 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${kpi.color}20` }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: `${kpi.color}15` }}>
                        <Icon name={kpi.icon as any} size={16} style={{ color: kpi.color }} />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: kpi.delta.startsWith("+") ? "#00ff87" : "#f43f5e" }}>
                        {kpi.delta}
                      </span>
                    </div>
                    <div className="font-display text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
                    <div className="text-white/40 text-xs mt-0.5">{kpi.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-4">
                {/* Weekly chart */}
                <div className="lg:col-span-2 p-5 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h3 className="font-display text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Инциденты за неделю</h3>
                  <div className="flex items-end gap-3 h-28">
                    {WEEKLY.map((w) => (
                      <div key={w.day} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-white/40 text-[10px]">{w.count}</span>
                        <div className="w-full rounded-t-md transition-all"
                          style={{ height: `${(w.count / maxCount) * 96}px`, background: "linear-gradient(to top, #a855f7, #3b82f6)" }} />
                        <span className="text-white/30 text-[10px]">{w.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* By type */}
                <div className="p-5 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h3 className="font-display text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">По типам</h3>
                  <div className="space-y-3">
                    {BY_TYPE.map((item) => (
                      <div key={item.type}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/60">{item.type}</span>
                          <span style={{ color: item.color }}>{item.count} ({Math.round(item.count / total * 100)}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${item.count / total * 100}%`, background: item.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent */}
              <div className="rounded-2xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <h3 className="font-display text-sm font-semibold text-white/70 uppercase tracking-wider">Последние инциденты</h3>
                  <button onClick={() => setActiveTab("incidents")} className="text-xs text-white/30 hover:text-white/60 transition-colors">Все →</button>
                </div>
                {INCIDENTS.slice(0, 4).map((inc) => (
                  <div key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className="flex items-center gap-4 px-5 py-3 cursor-pointer transition-colors"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(168,85,247,0.07)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[inc.status] }} />
                    <span className="text-white/30 text-xs w-20 shrink-0">{inc.id}</span>
                    <span className="text-white/80 text-sm flex-1 truncate">{inc.title}</span>
                    <span className="text-white/30 text-xs hidden md:block">{inc.country}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: `${STATUS_COLORS[inc.status]}15`, color: STATUS_COLORS[inc.status] }}>
                      {STATUS_LABELS[inc.status]}
                    </span>
                    <Icon name="ChevronRight" size={12} className="text-purple-400 opacity-50 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* INCIDENTS */}
          {activeTab === "incidents" && (
            <div className="space-y-4 animate-fade-up">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-2xl font-bold text-white uppercase">Инциденты</h1>
                  <p className="text-white/30 text-sm mt-0.5">{INCIDENTS.length} записей</p>
                </div>
                <div className="flex gap-2">
                  {["all", "active", "investigating", "resolved"].map((s) => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: statusFilter === s ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.04)",
                        color: statusFilter === s ? "#a855f7" : "rgba(255,255,255,0.4)",
                        border: statusFilter === s ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent",
                      }}>
                      {s === "all" ? "Все" : STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        {["№", "Тип", "Инцидент", "Страна", "Угроза", "Статус", "ИИ %", "Ответственный"].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-white/30 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((inc) => (
                        <tr key={inc.id}
                          onClick={() => setSelectedIncident(inc)}
                          className="transition-colors cursor-pointer"
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(168,85,247,0.07)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          <td className="px-4 py-3 text-white/30 text-xs">{inc.id}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: `${TYPE_COLORS[inc.type]}15`, color: TYPE_COLORS[inc.type] }}>
                              {TYPE_LABELS[inc.type]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-white/80 whitespace-nowrap">{inc.title}</td>
                          <td className="px-4 py-3 text-white/50 whitespace-nowrap">{inc.country}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold" style={{ color: SEVERITY_COLORS[inc.severity] }}>
                              {SEVERITY_LABELS[inc.severity]}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: `${STATUS_COLORS[inc.status]}15`, color: STATUS_COLORS[inc.status] }}>
                              {STATUS_LABELS[inc.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span style={{ color: inc.ai >= 85 ? "#00ff87" : inc.ai >= 75 ? "#f59e0b" : "#f43f5e" }}
                              className="text-sm font-semibold">{inc.ai}%</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-white/40 text-xs whitespace-nowrap">{inc.responsible}</span>
                              <Icon name="ChevronRight" size={12} className="text-purple-400 opacity-60" />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PREDICTED */}
          {activeTab === "predicted" && (
            <PredictedTab />
          )}

          {/* AI */}
          {activeTab === "ai" && (
            <div className="space-y-5 animate-fade-up">
              <div>
                <h1 className="font-display text-2xl font-bold text-white uppercase">ИИ-аналитика</h1>
                <p className="text-white/30 text-sm mt-0.5">Состояние алгоритмов · Открытый код</p>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { name: "Классификатор инцидентов", accuracy: 78, status: "active", model: "CNN v2.1", processed: "12 847" },
                  { name: "Детектор аномалий", accuracy: 84, status: "active", model: "LSTM v1.8", processed: "9 203" },
                  { name: "Генератор отчётов (NLP)", accuracy: 91, status: "active", model: "Transformer v3", processed: "4 512" },
                ].map((ai) => (
                  <div key={ai.name} className="p-5 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(168,85,247,0.15)" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#00ff87" }} />
                      <span className="text-white/60 text-xs font-semibold uppercase">{ai.status}</span>
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
                  </div>
                ))}
              </div>
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
                {[
                  { name: "Глобальный совет безопасности (ГСБ)", members: 45, color: "#a855f7", icon: "Shield", desc: "Стратегическое планирование, утверждение бюджета" },
                  { name: "Международный суд справедливости (МС)", members: 15, color: "#3b82f6", icon: "Scale", desc: "Рассмотрение дел о нарушениях международного права" },
                  { name: "Оперативная группа расследования (ОГР)", members: 120, color: "#f59e0b", icon: "Search", desc: "Фиксация фактов, сбор доказательств, расследования" },
                  { name: "Силы быстрого реагирования (СБР)", members: 5000, color: "#f43f5e", icon: "Zap", desc: "Пресечение нарушений, защита гражданского населения" },
                  { name: "Межпарламентский совет (МПСТУ)", members: 94, color: "#00ff87", icon: "Users", desc: "Мониторинг технологической устойчивости" },
                  { name: "Комиссия по этике и науке (КЭН)", members: 24, color: "#06b6d4", icon: "Microscope", desc: "Оценка угроз, разработка стандартов ИИ" },
                ].map((org) => (
                  <div key={org.name} className="p-5 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${org.color}20` }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: `${org.color}15` }}>
                        <Icon name={org.icon as any} size={18} style={{ color: org.color }} />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm leading-tight">{org.name}</h3>
                        <span className="text-xs" style={{ color: org.color }}>{org.members} участников</span>
                      </div>
                    </div>
                    <p className="text-white/40 text-xs">{org.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 text-center space-y-1">
            <p className="text-white/15 text-[10px]">© 13 апреля 2026 · ЕЦСУ 2.0 · Все права защищены</p>
            <p className="text-white/10 text-[10px]">Правообладатель и контрольный пакет акций: Николаев Владимир Владимирович</p>
            <p className="text-white/10 text-[10px]">Разработка: Poehali.dev · Партнёрская программа ЕЦСУ</p>
          </div>
        </main>
      </div>

      {/* AI Chat button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110"
          style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)", boxShadow: "0 0 24px rgba(168,85,247,0.5)" }}>
          <Icon name="Bot" size={24} className="text-white" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 animate-pulse" style={{ borderColor: "#060a12" }} />
        </button>
      )}

      {/* AI Chat panel */}
      {chatOpen && <AiChat onClose={() => setChatOpen(false)} />}

      {/* Incident detail modal */}
      {selectedIncident && (
        <IncidentModal incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
      )}
    </div>
  );
}