import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

const DEFAULT_API = "https://functions.poehali.dev/daefa87e-0693-4de5-9191-bbc918e1d241";
const SCANNER_API = "https://functions.poehali.dev/b3ae5ea9-0780-4337-b7b0-e19f144a63fb";

// ─── Типы провайдеров ───────────────────────────────────────────────────────
type ProviderId = "auto" | "gemini" | "openai" | "anthropic" | "yandex" | "groq" | "custom";
// "auto" оставлен только для обратной совместимости с localStorage, реально всегда маппится на "yandex"

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
    id: "groq",
    label: "Groq (Llama 3)",
    color: "#00c8a0",
    icon: "Zap",
    keyPlaceholder: "gsk_...",
    description: "Groq — бесплатный быстрый провайдер на базе Llama 3",
    models: ["llama3-8b-8192", "llama3-70b-8192", "mixtral-8x7b-32768"],
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
// Приоритет: yandex (есть ключ) → groq (бесплатный резерв)
function autoSelectProvider(text: string, hasCpvoa: boolean): ProviderId {
  const lower = text.toLowerCase();
  if (hasCpvoa || lower.includes("цпвоа") || lower.includes("аномал") || lower.includes("инцидент")) return "yandex";
  if (lower.includes("документ") || lower.includes("контракт") || lower.includes("договор") || lower.includes("анализ")) return "yandex";
  if (lower.includes("код") || lower.includes("программ") || lower.includes("api") || lower.includes("json")) return "yandex";
  if (lower.includes("право") || lower.includes("закон") || lower.includes("упк") || lower.includes("мгп")) return "yandex";
  return "yandex";
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
  webSearchUsed?: boolean;
  legalDbUsed?: boolean;
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
  { label: "🌐 ECSU", color: "#a855f7", items: ["Критические инциденты", "Что умеет ECSU?", "Статистика системы"] },
  { label: "📡 ЦПВОА", color: "#4CAF50", items: ["Что такое ЦПВОА?", "Как анализировать аномалии?", "Режимы мониторинга"] },
  { label: "🔍 Анализ", color: "#f59e0b", items: ["Объясни МГП", "Международное право", "Нефтяной разлив Нигерия"] },
];

const CPVOA_QUICK = [
  "ЦПВОА: объясни критический инцидент",
  "ЦПВОА: дай рекомендации по реагированию",
  "ЦПВОА: правовая квалификация аномалий",
  "ЦПВОА: что делать при обнаружении сигнала?",
];

// ─── Бесплатные открытые серверы ──────────────────────────────────────────
interface OpenServer {
  id: string;
  name: string;
  url: string;
  model: string;
  description: string;
  icon: string;
  color: string;
  free: true;
}

interface PaidServer {
  id: string;
  name: string;
  url: string;
  model: string;
  description: string;
  icon: string;
  color: string;
  free: false;
  price: string;
  signupUrl: string;
}

type AiServer = OpenServer | PaidServer;

const FREE_SERVERS: OpenServer[] = [
  {
    id: "ollama-local",
    name: "Ollama (локальный)",
    url: "http://localhost:11434/v1/chat/completions",
    model: "llama3",
    description: "Локальный LLM на вашем ПК — полностью бесплатно",
    icon: "Server",
    color: "#00c8a0",
    free: true,
  },
  {
    id: "lmstudio-local",
    name: "LM Studio (локальный)",
    url: "http://localhost:1234/v1/chat/completions",
    model: "local-model",
    description: "LM Studio с любой GGUF-моделью",
    icon: "Cpu",
    color: "#6366f1",
    free: true,
  },
  {
    id: "together-free",
    name: "Together AI (бесплатный)",
    url: "https://api.together.xyz/v1/chat/completions",
    model: "mistralai/Mistral-7B-Instruct-v0.2",
    description: "Mistral 7B через Together AI — $1 кредит при регистрации",
    icon: "Globe",
    color: "#0ea5e9",
    free: true,
  },
  {
    id: "groq-free",
    name: "Groq (бесплатный)",
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama3-8b-8192",
    description: "Llama 3 8B — бесплатный уровень, нужен API ключ",
    icon: "Zap",
    color: "#f59e0b",
    free: true,
  },
  {
    id: "openrouter-free",
    name: "OpenRouter (бесплатные модели)",
    url: "https://openrouter.ai/api/v1/chat/completions",
    model: "mistralai/mistral-7b-instruct:free",
    description: "Бесплатные модели через OpenRouter (Mistral, Llama и др.)",
    icon: "Network",
    color: "#8b5cf6",
    free: true,
  },
];

const PAID_SERVERS: PaidServer[] = [
  {
    id: "openai-paid",
    name: "OpenAI GPT-4o",
    url: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o",
    description: "Самая мощная модель OpenAI — ~$0.005 за 1K токенов",
    icon: "Brain",
    color: "#00a67e",
    free: false,
    price: "от $5/мес",
    signupUrl: "https://platform.openai.com",
  },
  {
    id: "anthropic-paid",
    name: "Anthropic Claude 3.5",
    url: "https://api.anthropic.com/v1/messages",
    model: "claude-3-5-sonnet-20241022",
    description: "Лучший для анализа документов и кода",
    icon: "Shield",
    color: "#cc785c",
    free: false,
    price: "от $3/мес",
    signupUrl: "https://console.anthropic.com",
  },
  {
    id: "mistral-paid",
    name: "Mistral Large",
    url: "https://api.mistral.ai/v1/chat/completions",
    model: "mistral-large-latest",
    description: "Европейская альтернатива — отличный баланс цена/качество",
    icon: "Flame",
    color: "#f97316",
    free: false,
    price: "от $2/мес",
    signupUrl: "https://console.mistral.ai",
  },
  {
    id: "cohere-paid",
    name: "Cohere Command R+",
    url: "https://api.cohere.ai/v1/chat",
    model: "command-r-plus",
    description: "Оптимизирован для RAG и корпоративных задач",
    icon: "Database",
    color: "#06b6d4",
    free: false,
    price: "от $1/мес",
    signupUrl: "https://dashboard.cohere.com",
  },
  {
    id: "deepseek-paid",
    name: "DeepSeek V3",
    url: "https://api.deepseek.com/v1/chat/completions",
    model: "deepseek-chat",
    description: "Мощная китайская модель — самые низкие цены",
    icon: "Search",
    color: "#3b82f6",
    free: false,
    price: "от $0.1/мес",
    signupUrl: "https://platform.deepseek.com",
  },
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

const LS_PROVIDER = "ecsu_ai_provider_v3"; // v3 — принудительный сброс кэша
const LS_KEYS = "ecsu_ai_keys_v3";
const LS_MODELS = "ecsu_ai_models_v3";
const LS_CUSTOM_URL = "ecsu_ai_custom_url_v3";

// Удаляем все старые ключи предыдущих версий
["ezsu_ai_provider","ezsu_ai_keys","ezsu_ai_models","ezsu_ai_custom_url",
 "ecsu_ai_provider","ecsu_ai_keys","ecsu_ai_models","ecsu_ai_custom_url",
 "ecsu_ai_provider_v2","ecsu_ai_keys_v2","ecsu_ai_models_v2","ecsu_ai_custom_url_v2",
].forEach(k => localStorage.removeItem(k));

// Устанавливаем yandex по умолчанию
if (!localStorage.getItem(LS_PROVIDER)) {
  localStorage.setItem(LS_PROVIDER, "yandex");
}

export default function AiChat({ onClose, initialCpvoaContext, initialMessage }: Props) {
  const [tab, setTab] = useState<"chat" | "cpvoa" | "admin" | "settings" | "servers">(initialCpvoaContext ? "cpvoa" : "chat");
  const [cpvoaContext, setCpvoaContext] = useState<CpvoaContext | null>(initialCpvoaContext ?? null);
  const [cpvoaSynced, setCpvoaSynced] = useState(!!initialCpvoaContext);

  // ─── Настройки провайдера ─────────────────────────────────────────────────
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>(
    () => (localStorage.getItem(LS_PROVIDER) as ProviderId) || "yandex"
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

  const getEffectiveProvider = (_text: string): ProviderId => {
    if (selectedProvider === "auto") return "yandex";
    return selectedProvider;
  };

  // ─── Чат ──────────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: initialCpvoaContext
        ? `**Синхронизация с ЦПВОА выполнена** ✅\n\nПолучено **${initialCpvoaContext.incidents.length}** инцидентов. Режим: *${initialCpvoaContext.mode}* · Связь: *${initialCpvoaContext.connection}*.\n\nМогу проанализировать данные, дать рекомендации или ответить на вопросы по обнаруженным аномалиям.`
        : "Привет! Я ИИ-ассистент **ECSU 2.0**, интегрированный с модулем **ЦПВОА**.\n\nМогу помочь с правовыми вопросами, анализом инцидентов и мониторингом аномалий.\n\nВыбери тему или напиши сам:",
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
    const providerInfo = PROVIDERS.find(p => p.id === effectiveProvider) ?? PROVIDERS.find(p => p.id === "yandex")!;

    const userMsg: Message = {
      role: "user",
      text: useCpvoa ? `📡 [ЦПВОА] ${text}` : text,
      time: getTime(),
      fromCpvoa: useCpvoa,
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

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

    // Функция одной попытки с таймаутом 25 сек
    const tryOnce = async () => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 25000);
      try {
        const res = await fetch(DEFAULT_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        return await res.json();
      } catch (e) {
        clearTimeout(timer);
        throw e;
      }
    };

    // До 3 попыток с паузой 2 сек
    let lastErr: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const data = await tryOnce();
        let reply = "";
        let suggestions: string[] = [];
        let webSearchUsed = false;
        let legalDbUsed = false;
        if (typeof data === "string") {
          try { const p = JSON.parse(data); reply = p.reply || data; suggestions = p.suggestions || []; webSearchUsed = !!p.web_search_used; legalDbUsed = !!p.legal_db_used; }
          catch { reply = data; }
        } else {
          reply = data.reply || "Не получил ответ от сервера.";
          suggestions = data.suggestions || [];
          webSearchUsed = !!data.web_search_used;
          legalDbUsed = !!data.legal_db_used;
        }
        setMessages(prev => [
          ...prev,
          { role: "assistant", text: reply, time: getTime(), suggestions, fromCpvoa: useCpvoa, usedProvider: effectiveProvider, webSearchUsed, legalDbUsed },
        ]);
        setLoading(false);
        return;
      } catch (e) {
        lastErr = e;
        if (attempt < 3) {
          // Показываем статус повтора
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.text.startsWith("🔄")) return prev;
            return [...prev, { role: "assistant", text: `🔄 Слабый сигнал, повтор ${attempt}/3...`, time: getTime() }];
          });
          await new Promise(r => setTimeout(r, 2000));
          // Убираем статус повтора
          setMessages(prev => prev.filter(m => !m.text.startsWith("🔄")));
        }
      }
    }

    // Все 3 попытки провалились — локальный ответ
    console.error("AI fetch failed after 3 attempts:", lastErr);
    const lower = text.toLowerCase();
    let offlineReply = "";
    let offlineSuggestions: string[] = [];
    if (lower.includes("привет") || lower.includes("здравств")) {
      offlineReply = "Привет! Я ИИ-ассистент **ECSU 2.0**.\n\nСейчас наблюдаются проблемы с соединением, но я могу помочь с базовыми вопросами в офлайн-режиме.";
      offlineSuggestions = ["Что ты умеешь?", "Правовые вопросы", "Попробовать снова"];
    } else if (lower.includes("право") || lower.includes("закон") || lower.includes("упк") || lower.includes("статья")) {
      offlineReply = "**Правовой офлайн-режим:**\n\n• УПК РФ регулирует уголовное судопроизводство\n• Ст. 46 УПК — права подозреваемого\n• Ст. 47 УПК — права обвиняемого\n• Ст. 51 Конституции — право не свидетельствовать против себя\n\n⚡ Для полного анализа нужно соединение с ИИ.";
      offlineSuggestions = ["Права обвиняемого", "Попробовать снова", "Ст. 51 Конституции"];
    } else if (lower.includes("инцидент") || lower.includes("угроз") || lower.includes("цпвоа")) {
      offlineReply = "**Офлайн-режим ЦПВОА:**\n\nДанные системы мониторинга доступны локально. Для анализа инцидентов через ИИ требуется подключение.\n\n• Просмотр инцидентов: вкладка «Инциденты»\n• Статус ЦПВОА: вкладка «ЦПВОА»";
      offlineSuggestions = ["Показать инциденты", "Статус системы", "Попробовать снова"];
    } else {
      offlineReply = "⚠️ **Нет связи с сервером ИИ** (3 попытки)\n\nЭто может быть вызвано:\n• Слабым интернет-сигналом\n• Временной недоступностью сервера\n\nПопробуйте через 1-2 минуты.";
      offlineSuggestions = ["Попробовать снова", "Правовые вопросы", "Инциденты системы"];
    }
    setMessages(prev => [
      ...prev,
      { role: "assistant", text: offlineReply, time: getTime(), suggestions: offlineSuggestions },
    ]);
    setLoading(false);
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

  // ─── Серверы ──────────────────────────────────────────────────────────────
  const [serverStatuses, setServerStatuses] = useState<Record<string, "checking" | "online" | "offline">>({});
  const [connectedServer, setConnectedServer] = useState<AiServer | null>(null);
  const [serverKeys, setServerKeys] = useState<Record<string, string>>({});
  const [serverKeyInput, setServerKeyInput] = useState<Record<string, string>>({});

  const checkServer = async (server: OpenServer | PaidServer) => {
    setServerStatuses(prev => ({ ...prev, [server.id]: "checking" }));
    try {
      const res = await fetch(server.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(serverKeys[server.id] ? { Authorization: `Bearer ${serverKeys[server.id]}` } : {}) },
        body: JSON.stringify({ model: server.model, messages: [{ role: "user", content: "hi" }], max_tokens: 5 }),
        signal: AbortSignal.timeout(5000),
      });
      setServerStatuses(prev => ({ ...prev, [server.id]: res.ok || res.status === 401 ? "online" : "offline" }));
      return res.ok || res.status === 401;
    } catch {
      setServerStatuses(prev => ({ ...prev, [server.id]: "offline" }));
      return false;
    }
  };

  const autoConnectFree = async () => {
    for (const server of FREE_SERVERS) {
      const ok = await checkServer(server);
      if (ok) {
        setConnectedServer(server);
        setCustomUrl(server.url);
        setSelectedProvider("custom");
        setSelectedModels(prev => ({ ...prev, custom: server.model }));
        setMessages(prev => [...prev, {
          role: "assistant",
          text: `✅ **Автоподключение выполнено!**\n\nПодключён к серверу **${server.name}**\nМодель: \`${server.model}\`\n\n${server.description}`,
          time: getTime(),
          suggestions: ["Проверь связь", "Что ты умеешь?", "Привет!"],
        }]);
        setTab("chat");
        return;
      }
    }
    setMessages(prev => [...prev, {
      role: "assistant",
      text: "⚠️ **Автоподключение не удалось**\n\nНи один из бесплатных серверов не доступен. Попробуйте:\n• Установить **Ollama** на свой ПК\n• Зарегистрироваться на **Groq** или **OpenRouter**\n• Использовать платный сервер",
      time: getTime(),
      suggestions: ["Открыть список серверов", "Попробовать снова"],
    }]);
    setTab("chat");
  };

  const connectServer = (server: AiServer) => {
    const key = serverKeys[server.id] || serverKeyInput[server.id] || "";
    if (!server.free && !key) return;
    if (key) setServerKeys(prev => ({ ...prev, [server.id]: key }));
    setConnectedServer(server);
    setCustomUrl(server.url);
    setSelectedProvider("custom");
    setSelectedModels(prev => ({ ...prev, custom: server.model }));
    if (key) setApiKeys(prev => ({ ...prev, custom: key }));
    setMessages(prev => [...prev, {
      role: "assistant",
      text: `✅ **Подключено к ${server.name}**\n\nМодель: \`${server.model}\`\n\n${server.description}`,
      time: getTime(),
      suggestions: ["Проверь связь", "Что ты умеешь?"],
    }]);
    setTab("chat");
  };

  // ─── Вставка из буфера ────────────────────────────────────────────────────
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setInput(prev => prev + text);
      inputRef.current?.focus();
    } catch {
      inputRef.current?.focus();
    }
  };

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
            <div className="text-white font-bold text-sm leading-none">ИИ-Ассистент ECSU</div>
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
            onClick={() => setTab("servers")}
            title="Серверы ИИ"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{
              background: tab === "servers" ? "rgba(0,200,160,0.2)" : connectedServer ? "rgba(0,200,160,0.1)" : "transparent",
              color: connectedServer ? "#00c8a0" : "rgba(255,255,255,0.4)",
            }}
          >
            <Icon name="Server" size={14} />
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
          <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">ИИ-Администратор ECSU · Заместитель владельца</div>

          {[
            { cmd: "ai_sync", label: "Синхронизация системы", icon: "RefreshCw", color: "#a855f7", desc: "ИИ получает текущие данные всей системы и анализирует" },
            { cmd: "scan_incidents", label: "Сканировать источники", icon: "Radar", color: "#22c55e", desc: "GDACS, USGS, OpenAQ, CVE, ReliefWeb, EMSC → БД" },
            { cmd: "get_stats", label: "Статистика системы", icon: "BarChart3", color: "#3b82f6", desc: "Инциденты, события безопасности, транзакции за 24ч" },
            { cmd: "list_incidents", label: "Активные инциденты", icon: "AlertTriangle", color: "#f59e0b", desc: "Список всех активных инцидентов из БД ECSU" },
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
            Все действия выполняются от имени ИИ-администратора и записываются в системный журнал ECSU.
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

      {/* ── TAB: СЕРВЕРЫ ── */}
      {tab === "servers" && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,200,160,0.3) transparent" }}>

          {/* Текущее подключение */}
          {connectedServer && (
            <div className="p-3 rounded-xl" style={{ background: "rgba(0,200,160,0.08)", border: "1px solid rgba(0,200,160,0.25)" }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-400">Подключено: {connectedServer.name}</span>
              </div>
              <div className="text-[10px] text-white/40">{connectedServer.model} · {connectedServer.url.replace("https://", "").split("/")[0]}</div>
            </div>
          )}

          {/* Автоподключение */}
          <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Автоподключение</div>
            <p className="text-xs text-white/45 mb-3">Система автоматически найдёт и подключится к первому доступному бесплатному серверу</p>
            <button
              onClick={autoConnectFree}
              className="w-full py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #00c8a0, #3b82f6)", color: "white" }}
            >
              <Icon name="Zap" size={13} className="inline mr-1.5" />
              Найти и подключиться автоматически
            </button>
          </div>

          {/* Бесплатные серверы */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">🆓 Бесплатные серверы</div>
            <div className="space-y-2">
              {FREE_SERVERS.map(server => {
                const status = serverStatuses[server.id];
                const isConnected = connectedServer?.id === server.id;
                return (
                  <div key={server.id} className="rounded-xl overflow-hidden"
                    style={{ border: `1px solid ${isConnected ? server.color + "60" : "rgba(255,255,255,0.07)"}`, background: isConnected ? `${server.color}10` : "rgba(255,255,255,0.02)" }}>
                    <div className="flex items-center gap-2.5 px-3 py-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${server.color}22`, border: `1px solid ${server.color}40` }}>
                        <Icon name={server.icon as "Server"} size={13} style={{ color: server.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-white/90">{server.name}</span>
                          {status === "checking" && <span className="text-[9px] text-white/40 animate-pulse">проверка...</span>}
                          {status === "online" && <span className="text-[9px] text-emerald-400">● онлайн</span>}
                          {status === "offline" && <span className="text-[9px] text-red-400">● офлайн</span>}
                        </div>
                        <div className="text-[10px] text-white/35 truncate">{server.description}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => checkServer(server)}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-white/25 hover:text-white/60 transition-colors"
                          style={{ background: "rgba(255,255,255,0.05)" }}>
                          <Icon name="RefreshCw" size={11} />
                        </button>
                        <button
                          onClick={() => connectServer(server)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:scale-105"
                          style={{
                            background: isConnected ? `${server.color}30` : `${server.color}20`,
                            color: server.color,
                            border: `1px solid ${server.color}40`,
                          }}>
                          {isConnected ? "✓" : "Подкл."}
                        </button>
                      </div>
                    </div>
                    {/* Поле ключа для серверов требующих ключ */}
                    {(server.id === "groq-free" || server.id === "openrouter-free" || server.id === "together-free") && (
                      <div className="px-3 pb-2.5 pt-0" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <input
                          type="password"
                          placeholder={`API ключ ${server.name} (необязательно для теста)`}
                          value={serverKeyInput[server.id] ?? ""}
                          onChange={e => setServerKeyInput(prev => ({ ...prev, [server.id]: e.target.value }))}
                          className="w-full bg-transparent text-white text-[10px] outline-none px-2 py-1.5 rounded-lg"
                          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)" }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Платные серверы */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">💳 Платные серверы (высокое качество)</div>
            <div className="space-y-2">
              {PAID_SERVERS.map(server => {
                const isConnected = connectedServer?.id === server.id;
                const key = serverKeyInput[server.id] ?? "";
                return (
                  <div key={server.id} className="rounded-xl overflow-hidden"
                    style={{ border: `1px solid ${isConnected ? server.color + "60" : "rgba(255,255,255,0.07)"}`, background: isConnected ? `${server.color}10` : "rgba(255,255,255,0.02)" }}>
                    <div className="flex items-center gap-2.5 px-3 py-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${server.color}22`, border: `1px solid ${server.color}40` }}>
                        <Icon name={server.icon as "Brain"} size={13} style={{ color: server.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-white/90">{server.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: `${server.color}20`, color: server.color }}>{server.price}</span>
                        </div>
                        <div className="text-[10px] text-white/35 truncate">{server.description}</div>
                      </div>
                      <a
                        href={server.signupUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 transition-colors shrink-0"
                        style={{ background: "rgba(255,255,255,0.05)" }}
                        title="Зарегистрироваться">
                        <Icon name="ExternalLink" size={11} />
                      </a>
                    </div>
                    <div className="px-3 pb-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          placeholder={`API ключ для ${server.name}...`}
                          value={key}
                          onChange={e => setServerKeyInput(prev => ({ ...prev, [server.id]: e.target.value }))}
                          className="flex-1 bg-transparent text-white text-[10px] outline-none px-2 py-1.5 rounded-lg"
                          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)" }}
                        />
                        <button
                          onClick={() => key && connectServer(server)}
                          disabled={!key}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:scale-105 disabled:opacity-30"
                          style={{ background: `linear-gradient(135deg, ${server.color}, #3b82f6)`, color: "white" }}>
                          {isConnected ? "✓ Активен" : "Подкл."}
                        </button>
                      </div>
                      {!key && <div className="text-[9px] text-white/25 mt-1">Введите API ключ для подключения · <a href={server.signupUrl} target="_blank" rel="noreferrer" className="underline" style={{ color: server.color }}>Получить ключ →</a></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-xl text-[10px] text-white/25" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            API ключи хранятся только в вашем браузере и не передаются на сервер ECSU.
          </div>
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
                      {msg.webSearchUsed && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5" style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}><span>🌐</span>Поиск</span>}
                      {msg.legalDbUsed && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc" }}>⚖️ Право</span>}
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
                onClick={pasteFromClipboard}
                title="Вставить из буфера обмена"
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110 shrink-0 text-white/30 hover:text-white/70"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <Icon name="Clipboard" size={13} />
              </button>
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
                {cpvoaSynced ? `📡 ${currentProvider.label} + ЦПВОА` : `${currentProvider.label} · ECSU 2.0`}
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