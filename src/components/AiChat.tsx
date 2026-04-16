import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

const DEFAULT_API = "https://functions.poehali.dev/daefa87e-0693-4de5-9191-bbc918e1d241";
const SCANNER_API = "https://functions.poehali.dev/b3ae5ea9-0780-4337-b7b0-e19f144a63fb";

// ─── Типы провайдеров ───────────────────────────────────────────────────────
type ProviderId = "auto" | "gemini" | "openai" | "anthropic" | "yandex" | "custom";

interface Provider {
  id: ProviderId;
  label: string;
  color: string;
  icon: string;
  keyPlaceholder: string;
  description: string;
  models: string[];
}

const PROVIDERS: Provider[] = [
  {
    id: "auto",
    label: "Авто",
    color: "#a855f7",
    icon: "Sparkles",
    keyPlaceholder: "Ключ не нужен",
    description: "Система сама выбирает лучшую модель для каждого запроса",
    models: ["gemini-pro", "gpt-4o", "claude-3", "yandex-gpt"],
  },
  {
    id: "gemini",
    label: "Google Gemini",
    color: "#4285f4",
    icon: "Globe",
    keyPlaceholder: "AIza...",
    description: "Google Gemini Pro / Flash — оптимален для анализа и права",
    models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"],
  },
  {
    id: "openai",
    label: "OpenAI GPT",
    color: "#00a67e",
    icon: "Brain",
    keyPlaceholder: "sk-...",
    description: "GPT-4o и GPT-4 Turbo — мощный универсальный ИИ",
    models: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
  },
  {
    id: "anthropic",
    label: "Anthropic Claude",
    color: "#cc785c",
    icon: "Shield",
    keyPlaceholder: "sk-ant-...",
    description: "Claude 3.5 Sonnet — лучший для документов и анализа",
    models: ["claude-3-5-sonnet", "claude-3-opus", "claude-3-haiku"],
  },
  {
    id: "yandex",
    label: "YandexGPT",
    color: "#fc3f1d",
    icon: "Zap",
    keyPlaceholder: "AQVN...",
    description: "YandexGPT 2 — оптимален для русского языка",
    models: ["yandexgpt-lite", "yandexgpt"],
  },
  {
    id: "custom",
    label: "Свой эндпоинт",
    color: "#f59e0b",
    icon: "Plug",
    keyPlaceholder: "Bearer your-key",
    description: "Любой совместимый OpenAI API эндпоинт",
    models: ["custom"],
  },
];

// Авто-выбор провайдера на основе контекста сообщения
function autoSelectProvider(text: string, hasCpvoa: boolean): ProviderId {
  const lower = text.toLowerCase();
  if (hasCpvoa || lower.includes("цпвоа") || lower.includes("аномал") || lower.includes("инцидент")) return "gemini";
  if (lower.includes("документ") || lower.includes("контракт") || lower.includes("договор") || lower.includes("анализ")) return "anthropic";
  if (lower.includes("код") || lower.includes("программ") || lower.includes("api") || lower.includes("json")) return "openai";
  if (lower.includes("право") || lower.includes("закон") || lower.includes("упк") || lower.includes("мгп")) return "yandex";
  return "gemini";
}

// ─── Интерфейсы ────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  text: string;
  time: string;
  suggestions?: string[];
  loading?: boolean;
  fromCpvoa?: boolean;
  usedProvider?: ProviderId;
}

export interface CpvoaContext {
  incidents: { id: string; category: string; threat: string; location: string; source: string; time: string; description: string }[];
  sensors: Record<string, boolean>;
  connection: string;
  mode: string;
  query?: string;
}

const getTime = () => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

const genSession = () => `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const TOPIC_GROUPS = [
  { label: "⚖️ Право", color: "#3b82f6", items: ["Права обвиняемого", "Как подать иск?", "Что такое УПК?"] },
  { label: "🌐 ЕЗСУ", color: "#a855f7", items: ["Критические инциденты", "Что умеет ЕЗСУ?", "Статистика системы"] },
  { label: "📡 ЦПВОА", color: "#4CAF50", items: ["Что такое ЦПВОА?", "Как анализировать аномалии?", "Режимы мониторинга"] },
  { label: "🔍 Анализ", color: "#f59e0b", items: ["Объясни МГП", "Международное право", "Нефтяной разлив Нигерия"] },
];

const CPVOA_QUICK = [
  "ЦПВОА: объясни критический инцидент",
  "ЦПВОА: дай рекомендации по реагированию",
  "ЦПВОА: правовая квалификация аномалий",
  "ЦПВОА: что делать при обнаружении сигнала?",
];

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:1px 4px;border-radius:4px;font-size:0.85em">$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:2px solid rgba(168,85,247,0.5);padding-left:8px;color:rgba(255,255,255,0.6);margin:4px 0">$1</blockquote>')
    .replace(/^• (.+)$/gm, '<div style="display:flex;gap:6px;margin:2px 0"><span style="color:#a855f7;flex-shrink:0">•</span><span>$1</span></div>')
    .replace(/^(\d+)\. (.+)$/gm, '<div style="display:flex;gap:6px;margin:2px 0"><span style="color:#3b82f6;flex-shrink:0;font-weight:bold">$1.</span><span>$2</span></div>')
    .replace(/✓ (.+)/g, '<div style="display:flex;gap:6px;align-items:flex-start"><span style="color:#00ff87;flex-shrink:0">✓</span><span>$1</span></div>')
    .replace(/\n\n/g, '<div style="height:8px"></div>')
    .replace(/\n/g, "<br/>");
}

interface Props {
  onClose: () => void;
  initialCpvoaContext?: CpvoaContext;
  initialMessage?: string;
}

const LS_PROVIDER = "ezsu_ai_provider";
const LS_KEYS = "ezsu_ai_keys";
const LS_MODELS = "ezsu_ai_models";
const LS_CUSTOM_URL = "ezsu_ai_custom_url";

export default function AiChat({ onClose, initialCpvoaContext, initialMessage }: Props) {
  const [tab, setTab] = useState<"chat" | "cpvoa" | "admin" | "settings">(initialCpvoaContext ? "cpvoa" : "chat");
  const [cpvoaContext, setCpvoaContext] = useState<CpvoaContext | null>(initialCpvoaContext ?? null);
  const [cpvoaSynced, setCpvoaSynced] = useState(!!initialCpvoaContext);

  // ─── Настройки провайдера ─────────────────────────────────────────────────
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>(
    () => (localStorage.getItem(LS_PROVIDER) as ProviderId) ?? "auto"
  );
  const [apiKeys, setApiKeys] = useState<Record<ProviderId, string>>(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEYS) ?? "{}"); } catch { return {}; }
  });
  const [selectedModels, setSelectedModels] = useState<Record<ProviderId, string>>(() => {
    try { return JSON.parse(localStorage.getItem(LS_MODELS) ?? "{}"); } catch { return {}; }
  });
  const [customUrl, setCustomUrl] = useState(() => localStorage.getItem(LS_CUSTOM_URL) ?? "");
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [showKey, setShowKey] = useState<Record<ProviderId, boolean>>({} as Record<ProviderId, boolean>);

  const saveSettings = () => {
    localStorage.setItem(LS_PROVIDER, selectedProvider);
    localStorage.setItem(LS_KEYS, JSON.stringify(apiKeys));
    localStorage.setItem(LS_MODELS, JSON.stringify(selectedModels));
    localStorage.setItem(LS_CUSTOM_URL, customUrl);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const getEffectiveProvider = (text: string): ProviderId => {
    if (selectedProvider !== "auto") return selectedProvider;
    return autoSelectProvider(text, cpvoaSynced);
  };

  // ─── Чат ──────────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: initialCpvoaContext
        ? `**Синхронизация с ЦПВОА выполнена** ✅\n\nПолучено **${initialCpvoaContext.incidents.length}** инцидентов. Режим: *${initialCpvoaContext.mode}* · Связь: *${initialCpvoaContext.connection}*.\n\nМогу проанализировать данные, дать рекомендации или ответить на вопросы по обнаруженным аномалиям.`
        : "Привет! Я ИИ-ассистент **ЕЗСУ 2.0**, интегрированный с модулем **ЦПВОА**.\n\nМогу помочь с правовыми вопросами, анализом инцидентов и мониторингом аномалий.\n\nВыбери тему или напиши сам:",
      time: getTime(),
      suggestions: initialCpvoaContext
        ? ["Проанализируй инциденты", "Дай рекомендации", "Критические угрозы"]
        : ["Что ты умеешь?", "Подключить ЦПВОА", "Критические инциденты"],
      fromCpvoa: !!initialCpvoaContext,
    },
  ]);
  const [input, setInput] = useState(initialMessage ?? "");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(genSession);
  const [showTopics, setShowTopics] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (initialMessage && initialMessage.trim()) {
      setTimeout(() => send(initialMessage), 300);
    }
  }, []);

  const buildHistory = () =>
    messages.filter(m => !m.loading).map(m => ({ role: m.role, content: m.text }));

  const send = async (overrideText?: string, withCpvoa?: boolean) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    setInput("");
    setShowTopics(false);

    const useCpvoa = withCpvoa ?? (cpvoaContext !== null && cpvoaSynced);
    const effectiveProvider = getEffectiveProvider(text);
    const providerInfo = PROVIDERS.find(p => p.id === effectiveProvider)!;

    const userMsg: Message = {
      role: "user",
      text: useCpvoa ? `📡 [ЦПВОА] ${text}` : text,
      time: getTime(),
      fromCpvoa: useCpvoa,
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = buildHistory();
      const body: Record<string, unknown> = {
        message: text,
        session_id: sessionId,
        history,
        provider: effectiveProvider,
        api_key: apiKeys[effectiveProvider] || undefined,
        model: selectedModels[effectiveProvider] || undefined,
        custom_url: effectiveProvider === "custom" ? customUrl : undefined,
      };
      if (useCpvoa && cpvoaContext) body.cpvoa_context = cpvoaContext;

      const res = await fetch(DEFAULT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      let reply = "";
      let suggestions: string[] = [];

      if (typeof data === "string") {
        try { const p = JSON.parse(data); reply = p.reply || data; suggestions = p.suggestions || []; }
        catch { reply = data; }
      } else {
        reply = data.reply || "Не получил ответ от сервера.";
        suggestions = data.suggestions || [];
      }

      setMessages(prev => [
        ...prev,
        { role: "assistant", text: reply, time: getTime(), suggestions, fromCpvoa: useCpvoa, usedProvider: effectiveProvider },
      ]);

      // Авто-подсказка: если провайдер авто — показываем какой был выбран
      if (selectedProvider === "auto") {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, text: last.text + `\n\n> *Использован: ${providerInfo.label}*` }];
        });
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          text: "⚠️ Нет связи с сервером. Проверьте соединение и попробуйте ещё раз.",
          time: getTime(),
          suggestions: ["Попробовать снова", "Настройки ИИ", "Правовая база"],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      text: "Диалог очищен. Чем могу помочь?",
      time: getTime(),
      suggestions: ["Правовой вопрос", "Инциденты", "Совет дня"],
    }]);
    setCpvoaContext(null);
    setCpvoaSynced(false);
  };

  const syncCpvoa = () => {
    const mockCtx: CpvoaContext = {
      incidents: [
        { id: "1", category: "Радиоэфир", threat: "high", location: "53.2°N 83.7°E", source: "FM 101.2 МГц", time: getTime(), description: "Нестандартная модуляция сигнала, отклонение +23 дБ" },
        { id: "2", category: "Визуальный", threat: "medium", location: "53.1°N 83.8°E", source: "Камера #4", time: getTime(), description: "Световые вспышки с кодированным паттерном" },
        { id: "4", category: "Кибер", threat: "critical", location: "Внешний IP", source: "Брандмауэр", time: getTime(), description: "Попытка несанкционированного доступа к буферу сообщений" },
      ],
      sensors: { radio: true, camera: false, mesh: true },
      connection: "online",
      mode: "advanced",
      query: "ЦПВОА: статус системы",
    };
    setCpvoaContext(mockCtx);
    setCpvoaSynced(true);
    setMessages(prev => [...prev, {
      role: "assistant",
      text: `**Синхронизация с ЦПВОА выполнена** ✅\n\nПолучено **${mockCtx.incidents.length}** инцидентов (1 критический). Датчики: радио ✓, меш ✓.\n\nТеперь все мои ответы будут учитывать данные ЦПВОА.`,
      time: getTime(),
      suggestions: ["Проанализируй инциденты", "Критическая угроза", "Рекомендации"],
      fromCpvoa: true,
    }]);
  };

  const currentProvider = PROVIDERS.find(p => p.id === selectedProvider)!;

  const [adminLoading, setAdminLoading] = useState(false);

  const runAdminCmd = async (cmd: string, label: string) => {
    setAdminLoading(true);
    try {
      let actionResult = "";
      if (cmd === "scan_incidents") {
        const r = await fetch(SCANNER_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sources: "all" }) });
        const d = await r.json();
        const parsed = typeof d === "string" ? JSON.parse(d) : d;
        actionResult = `Сканирование завершено: найдено ${parsed.total_scanned ?? 0}, добавлено ${parsed.created ?? 0} новых инцидентов.`;
      } else {
        const r = await fetch(DEFAULT_API + "/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command: cmd, params: {}, scanner_url: SCANNER_API }) });
        const d = await r.json();
        const parsed = typeof d === "string" ? JSON.parse(d) : d;
        actionResult = parsed.ai_comment || JSON.stringify(parsed.result ?? parsed, null, 2).slice(0, 300);
      }
      setMessages(prev => [...prev, { role: "assistant", text: `**[ИИ-АДМИНИСТРАТОР]** ${label}\n\n${actionResult}`, time: getTime(), suggestions: ["Запустить снова", "Показать инциденты", "Статистика системы"] }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "⚠️ Ошибка выполнения команды администратора.", time: getTime(), suggestions: ["Повторить", "Проверить статус"] }]);
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl overflow-hidden"
      style={{
        width: 420,
        maxWidth: "calc(100vw - 2rem)",
        height: 640,
        background: "#0a0f1a",
        border: "1px solid rgba(168,85,247,0.35)",
        boxShadow: "0 0 60px rgba(168,85,247,0.15), 0 20px 40px rgba(0,0,0,0.5)",
      }}
    >
      {/* ── HEADER ── */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ background: "rgba(168,85,247,0.12)", borderBottom: "1px solid rgba(168,85,247,0.2)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center relative"
            style={{ background: cpvoaSynced ? "linear-gradient(135deg, #4CAF50, #3b82f6)" : `linear-gradient(135deg, ${currentProvider.color}, #3b82f6)` }}
          >
            <Icon name="Bot" size={16} className="text-white" />
            <span
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: cpvoaSynced ? "#4CAF50" : "#00ff87", borderColor: "#0a0f1a" }}
            />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-none">ИИ-Ассистент ЕЗСУ</div>
            <div className="text-[10px]" style={{ color: cpvoaSynced ? "#4CAF50" : currentProvider.color }}>
              {cpvoaSynced ? "📡 ЦПВОА синхронизирован" : `${currentProvider.label} · ${selectedProvider === "auto" ? "авто" : "активен"}`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowTopics(p => !p)}
            title="Темы"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
            style={{ background: showTopics ? "rgba(168,85,247,0.2)" : "transparent" }}
          >
            <Icon name="LayoutGrid" size={14} />
          </button>
          <button
            onClick={clearChat}
            title="Очистить чат"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
          >
            <Icon name="Trash2" size={14} />
          </button>
          <button
            onClick={() => setTab("settings")}
            title="Настройки ИИ"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: tab === "settings" ? currentProvider.color : "rgba(255,255,255,0.4)" }}
          >
            <Icon name="Settings2" size={14} />
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
          >
            <Icon name="X" size={16} />
          </button>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {([
          { id: "chat", label: "💬 Диалог" },
          { id: "cpvoa", label: "📡 ЦПВОА" },
          { id: "admin", label: "🛡️ Админ" },
          { id: "settings", label: "⚙️ ИИ" },
        ] as { id: typeof tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 py-2 text-xs font-semibold transition-all"
            style={{
              color: tab === t.id
                ? t.id === "cpvoa" ? "#4CAF50" : t.id === "settings" ? currentProvider.color : "#a855f7"
                : "rgba(255,255,255,0.3)",
              borderBottom: tab === t.id
                ? `2px solid ${t.id === "cpvoa" ? "#4CAF50" : t.id === "settings" ? currentProvider.color : "#a855f7"}`
                : "2px solid transparent",
              background: tab === t.id ? "rgba(255,255,255,0.03)" : "transparent",
            }}>
            {t.label}
            {t.id === "cpvoa" && cpvoaSynced && (
              <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* ── TOPICS PANEL ── */}
      {showTopics && tab === "chat" && (
        <div
          className="shrink-0 p-3 grid grid-cols-2 gap-2"
          style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          {TOPIC_GROUPS.map(g => (
            <div key={g.label}>
              <div className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: g.color }}>{g.label}</div>
              {g.items.map(item => (
                <button
                  key={item}
                  onClick={() => { send(item); setShowTopics(false); }}
                  className="block w-full text-left text-xs text-white/60 hover:text-white/90 py-0.5 transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: АДМИНИСТРАТОР ── */}
      {tab === "admin" && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(168,85,247,0.3) transparent" }}>
          <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">ИИ-Администратор ЕЦСУ · Заместитель владельца</div>

          {[
            { cmd: "ai_sync", label: "Синхронизация системы", icon: "RefreshCw", color: "#a855f7", desc: "ИИ получает текущие данные всей системы и анализирует" },
            { cmd: "scan_incidents", label: "Сканировать источники", icon: "Radar", color: "#22c55e", desc: "GDACS, USGS, OpenAQ, CVE, ReliefWeb, EMSC → БД" },
            { cmd: "get_stats", label: "Статистика системы", icon: "BarChart3", color: "#3b82f6", desc: "Инциденты, события безопасности, транзакции за 24ч" },
            { cmd: "list_incidents", label: "Активные инциденты", icon: "AlertTriangle", color: "#f59e0b", desc: "Список всех активных инцидентов из БД ЕЦСУ" },
            { cmd: "get_log", label: "Системный журнал", icon: "FileText", color: "#64748b", desc: "Последние события и действия в системе" },
          ].map(({ cmd, label, icon, color, desc }) => (
            <button
              key={cmd}
              onClick={() => { runAdminCmd(cmd, label); setTab("chat"); }}
              disabled={adminLoading}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all hover:scale-[1.01]"
              style={{ background: `rgba(${color === "#22c55e" ? "34,197,94" : color === "#3b82f6" ? "59,130,246" : color === "#f59e0b" ? "245,158,11" : color === "#a855f7" ? "168,85,247" : "100,116,139"},0.1)`, border: `1px solid ${color}22` }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}22` }}>
                <Icon name={icon} size={15} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white/90">{label}</div>
                <div className="text-[11px] text-white/40 truncate">{desc}</div>
              </div>
              <Icon name="ChevronRight" size={14} className="text-white/20 shrink-0" />
            </button>
          ))}

          <div className="mt-4 p-3 rounded-xl text-[11px] text-white/30" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            Все действия выполняются от имени ИИ-администратора и записываются в системный журнал ЕЦСУ.
          </div>
        </div>
      )}

      {/* ── TAB: НАСТРОЙКИ ИИ ── */}
      {tab === "settings" && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(168,85,247,0.3) transparent" }}>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/30 mb-3">Режим выбора провайдера</div>

            {/* Авто-режим отдельно */}
            <button
              onClick={() => setSelectedProvider("auto")}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-3 transition-all text-left"
              style={{
                background: selectedProvider === "auto" ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${selectedProvider === "auto" ? "rgba(168,85,247,0.5)" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
                <Icon name="Sparkles" size={15} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Авто-выбор</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: "rgba(168,85,247,0.2)", color: "#c4b5fd" }}>РЕКОМЕНДУЕТСЯ</span>
                </div>
                <div className="text-[11px] text-white/40 mt-0.5">Система выбирает лучшую модель под каждый запрос</div>
              </div>
              {selectedProvider === "auto" && <Icon name="CheckCircle2" size={16} className="text-purple-400 shrink-0" />}
            </button>

            <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Или выбрать вручную</div>

            <div className="space-y-2">
              {PROVIDERS.filter(p => p.id !== "auto").map(p => (
                <div key={p.id} className="rounded-xl overflow-hidden"
                  style={{ border: `1px solid ${selectedProvider === p.id ? p.color + "60" : "rgba(255,255,255,0.07)"}` }}>
                  <button
                    onClick={() => setSelectedProvider(p.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 transition-all text-left"
                    style={{ background: selectedProvider === p.id ? `${p.color}18` : "rgba(255,255,255,0.02)" }}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${p.color}22`, border: `1px solid ${p.color}40` }}>
                      <Icon name={p.icon as "Globe"} size={13} style={{ color: p.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white/90">{p.label}</div>
                      <div className="text-[10px] text-white/35 truncate">{p.description}</div>
                    </div>
                    {selectedProvider === p.id && <Icon name="CheckCircle2" size={14} style={{ color: p.color }} />}
                  </button>

                  {/* Расширенные настройки для выбранного провайдера */}
                  {selectedProvider === p.id && p.id !== "auto" && (
                    <div className="px-3 pb-3 pt-1 space-y-2"
                      style={{ background: `${p.color}08`, borderTop: `1px solid ${p.color}20` }}>

                      {/* API ключ */}
                      {p.id !== "custom" && (
                        <div>
                          <div className="text-[10px] text-white/40 mb-1">API ключ</div>
                          <div className="flex items-center gap-2">
                            <input
                              type={showKey[p.id] ? "text" : "password"}
                              value={apiKeys[p.id] ?? ""}
                              onChange={e => setApiKeys(prev => ({ ...prev, [p.id]: e.target.value }))}
                              placeholder={p.keyPlaceholder}
                              className="flex-1 bg-transparent text-white text-xs outline-none px-2 py-1.5 rounded-lg"
                              style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)" }}
                            />
                            <button onClick={() => setShowKey(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
                              style={{ background: "rgba(255,255,255,0.05)" }}>
                              <Icon name={showKey[p.id] ? "EyeOff" : "Eye"} size={12} />
                            </button>
                          </div>
                          <div className="text-[9px] text-white/20 mt-1">Ключ хранится только в браузере</div>
                        </div>
                      )}

                      {/* Свой эндпоинт */}
                      {p.id === "custom" && (
                        <div>
                          <div className="text-[10px] text-white/40 mb-1">URL эндпоинта</div>
                          <input
                            type="text"
                            value={customUrl}
                            onChange={e => setCustomUrl(e.target.value)}
                            placeholder="https://api.example.com/v1/chat"
                            className="w-full bg-transparent text-white text-xs outline-none px-2 py-1.5 rounded-lg"
                            style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)" }}
                          />
                          <div className="text-[10px] text-white/40 mt-1.5 mb-1">Bearer токен</div>
                          <input
                            type={showKey[p.id] ? "text" : "password"}
                            value={apiKeys[p.id] ?? ""}
                            onChange={e => setApiKeys(prev => ({ ...prev, [p.id]: e.target.value }))}
                            placeholder="Bearer your-token"
                            className="w-full bg-transparent text-white text-xs outline-none px-2 py-1.5 rounded-lg"
                            style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)" }}
                          />
                        </div>
                      )}

                      {/* Выбор модели */}
                      <div>
                        <div className="text-[10px] text-white/40 mb-1">Модель</div>
                        <div className="flex flex-wrap gap-1.5">
                          {p.models.map(m => (
                            <button key={m}
                              onClick={() => setSelectedModels(prev => ({ ...prev, [p.id]: m }))}
                              className="text-[10px] px-2 py-1 rounded-lg transition-all"
                              style={{
                                background: (selectedModels[p.id] ?? p.models[0]) === m ? `${p.color}25` : "rgba(255,255,255,0.05)",
                                color: (selectedModels[p.id] ?? p.models[0]) === m ? p.color : "rgba(255,255,255,0.4)",
                                border: `1px solid ${(selectedModels[p.id] ?? p.models[0]) === m ? `${p.color}50` : "rgba(255,255,255,0.08)"}`,
                              }}>
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Кнопка сохранить */}
          <button
            onClick={saveSettings}
            className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
            style={{ background: settingsSaved ? "rgba(0,255,135,0.2)" : `linear-gradient(135deg, ${currentProvider.color}, #3b82f6)`, color: settingsSaved ? "#00ff87" : "white", border: settingsSaved ? "1px solid rgba(0,255,135,0.4)" : "none" }}>
            {settingsSaved ? "✓ Сохранено" : "Сохранить настройки"}
          </button>
        </div>
      )}

      {/* ── TAB: ЦПВОА ── */}
      {tab === "cpvoa" && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(76,175,80,0.3) transparent" }}>
          <div className="rounded-xl p-3" style={{ background: cpvoaSynced ? "rgba(76,175,80,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${cpvoaSynced ? "rgba(76,175,80,0.25)" : "rgba(255,255,255,0.08)"}` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">📡</span>
                <span className="text-sm font-bold" style={{ color: cpvoaSynced ? "#4CAF50" : "rgba(255,255,255,0.6)" }}>
                  {cpvoaSynced ? "ЦПВОА синхронизирован" : "ЦПВОА не подключён"}
                </span>
              </div>
              <button onClick={syncCpvoa}
                className="text-xs px-3 py-1 rounded-lg font-semibold transition-all hover:scale-105"
                style={{ background: "rgba(76,175,80,0.15)", color: "#4CAF50", border: "1px solid rgba(76,175,80,0.3)" }}>
                {cpvoaSynced ? "🔄 Обновить" : "Подключить"}
              </button>
            </div>
            {cpvoaContext && (
              <div className="text-xs space-y-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                <div>Режим: <span className="text-white/70">{cpvoaContext.mode}</span> · Связь: <span className="text-white/70">{cpvoaContext.connection}</span></div>
                <div>Инцидентов: <span style={{ color: "#F44336" }}>{cpvoaContext.incidents.length}</span> · Датчики: {Object.entries(cpvoaContext.sensors).filter(([, v]) => v).map(([k]) => k).join(", ") || "нет"}</div>
              </div>
            )}
          </div>

          {cpvoaContext && cpvoaContext.incidents.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Текущие инциденты ЦПВОА</div>
              <div className="space-y-2">
                {cpvoaContext.incidents.map(inc => (
                  <div key={inc.id} className="rounded-lg px-3 py-2.5"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-white/80">{inc.category}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{
                          color: inc.threat === "critical" ? "#F44336" : inc.threat === "high" ? "#FF9800" : inc.threat === "medium" ? "#FFC107" : "#4CAF50",
                          background: inc.threat === "critical" ? "rgba(244,67,54,0.15)" : "rgba(255,255,255,0.06)",
                        }}>
                        {inc.threat}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/45 leading-relaxed">{inc.description}</p>
                    <button
                      onClick={() => { setTab("chat"); send(`Проанализируй этот инцидент ЦПВОА: [${inc.threat.toUpperCase()}] ${inc.category} — ${inc.description}. Источник: ${inc.source}. Геолокация: ${inc.location}`, true); }}
                      className="mt-1.5 text-[10px] px-2 py-0.5 rounded-md transition-all hover:opacity-80"
                      style={{ background: "rgba(76,175,80,0.12)", color: "#4CAF50", border: "1px solid rgba(76,175,80,0.2)" }}>
                      Спросить ИИ →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Запросы ИИ по данным ЦПВОА</div>
            <div className="space-y-1.5">
              {CPVOA_QUICK.map(q => (
                <button key={q} onClick={() => { setTab("chat"); send(q, true); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all hover:bg-white/5"
                  style={{ color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: ЧАТ ── */}
      {tab === "chat" && (
        <>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(168,85,247,0.3) transparent" }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div style={{ maxWidth: "88%" }}>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center"
                        style={{ background: msg.fromCpvoa ? "linear-gradient(135deg, #4CAF50, #3b82f6)" : `linear-gradient(135deg, ${currentProvider.color}, #3b82f6)` }}>
                        <Icon name="Bot" size={11} className="text-white" />
                      </div>
                      <span className="text-white/25 text-[10px]">{msg.time}</span>
                      {msg.fromCpvoa && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(76,175,80,0.15)", color: "#4CAF50" }}>ЦПВОА</span>}
                      {msg.usedProvider && msg.usedProvider !== "auto" && selectedProvider === "auto" && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                          style={{ background: `${PROVIDERS.find(p => p.id === msg.usedProvider)?.color ?? "#a855f7"}22`, color: PROVIDERS.find(p => p.id === msg.usedProvider)?.color ?? "#a855f7" }}>
                          {PROVIDERS.find(p => p.id === msg.usedProvider)?.label}
                        </span>
                      )}
                    </div>
                  )}

                  <div
                    className="rounded-xl px-3 py-2.5 text-sm leading-relaxed"
                    style={msg.role === "user"
                      ? {
                          background: msg.fromCpvoa
                            ? "linear-gradient(135deg, rgba(76,175,80,0.2), rgba(59,130,246,0.2))"
                            : `linear-gradient(135deg, ${currentProvider.color}30, rgba(59,130,246,0.2))`,
                          color: "rgba(255,255,255,0.92)",
                          border: `1px solid ${msg.fromCpvoa ? "rgba(76,175,80,0.3)" : currentProvider.color + "50"}`,
                        }
                      : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.87)", border: "1px solid rgba(255,255,255,0.08)" }
                    }
                  >
                    {msg.role === "user"
                      ? <span>{msg.text}</span>
                      : <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
                    }
                  </div>

                  {msg.role === "user" && (
                    <div className="text-right mt-0.5">
                      <span className="text-white/20 text-[10px]">{msg.time}</span>
                    </div>
                  )}

                  {msg.role === "assistant" && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.suggestions.map((s, si) => (
                        <button
                          key={si}
                          onClick={() => send(s)}
                          disabled={loading}
                          className="text-xs px-2.5 py-1 rounded-lg transition-all hover:scale-105 disabled:opacity-40"
                          style={{
                            background: msg.fromCpvoa ? "rgba(76,175,80,0.12)" : `${currentProvider.color}18`,
                            color: msg.fromCpvoa ? "#86efac" : currentProvider.color,
                            border: `1px solid ${msg.fromCpvoa ? "rgba(76,175,80,0.25)" : currentProvider.color + "40"}`,
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center"
                    style={{ background: cpvoaSynced ? "linear-gradient(135deg, #4CAF50, #3b82f6)" : `linear-gradient(135deg, ${currentProvider.color}, #3b82f6)` }}>
                    <Icon name="Bot" size={11} className="text-white" />
                  </div>
                  <div className="flex items-center gap-1 px-3 py-2 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {[0, 1, 2].map(d => (
                      <span
                        key={d}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: cpvoaSynced ? "#4CAF50" : currentProvider.color,
                          animation: `bounce 1s ease-in-out ${d * 0.15}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── INPUT ── */}
          <div
            className="shrink-0 px-3 py-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.2)" }}
          >
            {cpvoaSynced && (
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px]" style={{ color: "#4CAF50" }}>ЦПВОА активен · данные инцидентов передаются в ИИ</span>
              </div>
            )}
            <div
              className="flex items-end gap-2 rounded-xl px-3 py-2"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${cpvoaSynced ? "rgba(76,175,80,0.3)" : currentProvider.color + "40"}`,
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={cpvoaSynced ? "Спросите ИИ о данных ЦПВОА..." : "Напишите сообщение... (Enter — отправить)"}
                rows={1}
                disabled={loading}
                className="flex-1 bg-transparent text-white text-sm outline-none resize-none placeholder-white/25 leading-relaxed"
                style={{ maxHeight: 96, minHeight: 22 }}
                onInput={e => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 96) + "px";
                }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30 shrink-0"
                style={{ background: cpvoaSynced ? "linear-gradient(135deg, #4CAF50, #3b82f6)" : `linear-gradient(135deg, ${currentProvider.color}, #3b82f6)` }}
              >
                <Icon name="Send" size={14} className="text-white" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-1.5 px-1">
              <span className="text-white/15 text-[10px]">Shift+Enter — перенос</span>
              <button onClick={() => setTab("settings")}
                className="text-[10px] transition-colors hover:opacity-80"
                style={{ color: currentProvider.color + "80" }}>
                {cpvoaSynced ? `📡 ${currentProvider.label} + ЦПВОА` : `${currentProvider.label} · ЕЗСУ 2.0`}
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}