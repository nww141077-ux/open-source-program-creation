import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const AI_URL = "https://functions.poehali.dev/e74ce640-7610-467a-81ee-cab7c2347d3e";
const INCIDENTS_URL = "https://functions.poehali.dev/df1d9dd9-c455-479d-807f-b25e000928ff";

const PROVIDERS = [
  { id: "auto",    label: "Авто-выбор",      desc: "Система выбирает лучшую модель под каждый запрос", color: "#a78bfa", recommended: true },
  { id: "gemini",  label: "Google Gemini",    desc: "Google Gemini Pro / Flash — оптимален для анализа и права", color: "#4285f4" },
  { id: "openai",  label: "OpenAI GPT",       desc: "GPT-4o и GPT-4 Turbo — мощный универсальный ИИ", color: "#10a37f" },
  { id: "claude",  label: "Anthropic Claude", desc: "Claude 3.5 Sonnet — лучший для документов и анализа", color: "#d97706" },
  { id: "yandex",  label: "YandexGPT",        desc: "YandexGPT 2 — оптимизирован для русского языка", color: "#e94560" },
  { id: "groq",    label: "Groq (Llama 3)",   desc: "Groq — бесплатный быстрый провайдер на базе Llama 3", color: "#34d399" },
  { id: "dalan1",  label: "Далан-1",          desc: "Далан-1 — ИИ ECSU 2.0, специалист по инцидентам, пр...", color: "#00c896", active: true },
];

const MODEL_MAP: Record<string, string> = {
  auto:   "meta-llama/llama-3.1-8b-instruct:free",
  gemini: "google/gemini-flash-1.5",
  openai: "openai/gpt-4o-mini",
  claude: "anthropic/claude-3.5-sonnet",
  yandex: "meta-llama/llama-3.1-8b-instruct:free",
  groq:   "meta-llama/llama-3.1-8b-instruct:free",
  dalan1: "meta-llama/llama-3.1-8b-instruct:free",
};

const ADMIN_ACTIONS = [
  { id: "sync",     label: "Синхронизация системы",  desc: "ИИ получает текущие данные всей системы и анал...", color: "#a78bfa", icon: "RefreshCw" },
  { id: "scan",     label: "Сканировать источники",  desc: "GDACS, USGS, OpenAQ, CVE, ReliefWeb, EMSC → БД", color: "#34d399", icon: "Search" },
  { id: "stats",    label: "Статистика системы",     desc: "Инциденты, события безопасности, транзакции за ...", color: "#60a5fa", icon: "BarChart2" },
  { id: "active",   label: "Активные инциденты",     desc: "Список всех активных инцидентов из БД ECSU", color: "#f59e0b", icon: "AlertTriangle" },
  { id: "syslog",   label: "Системный журнал",       desc: "Последние события и действия в системе", color: "#94a3b8", icon: "ScrollText" },
];

interface Message { role: "user" | "assistant"; content: string; time?: string; }

const now = () => new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

const GREETING = `Привет! Я ИИ-ассистент **ECSU 2.0**, интегрированный с модулем **ЦПВОА**.

Могу помочь с правовыми вопросами, анализом инцидентов и мониторингом аномалий.

Выбери тему или напиши сам:`;

const QUICK = [
  { label: "Что ты умеешь?",     mode: "assistant" },
  { label: "Подключить ЦПВОА",   mode: "cpvoa" },
  { label: "Критические инциденты", mode: "threats" },
];

const FloatingAiChat = () => {
  const [open, setOpen]         = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [tab, setTab]           = useState<"dialog" | "cpvoa" | "admin" | "ai">("dialog");
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: GREETING, time: now() }]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [provider, setProvider] = useState("dalan1");
  const [adminResult, setAdminResult] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(async (text?: string, mode?: string) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");
    const newMsgs: Message[] = [...messages, { role: "user", content: userText, time: now() }];
    setMessages(newMsgs);
    setLoading(true);
    try {
      const res = await fetch(AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
          mode: mode || "assistant",
          model: MODEL_MAP[provider] || MODEL_MAP.dalan1,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Нет ответа", time: now() }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Не получил ответ от сервера.", time: now() }]);
    }
    setLoading(false);
  }, [input, messages, loading, provider]);

  const handleAdminAction = async (id: string) => {
    setAdminLoading(id);
    setAdminResult(null);
    try {
      if (id === "stats" || id === "active") {
        const res = await fetch(`${INCIDENTS_URL}?action=${id === "active" ? "list&status=active&limit=10" : "stats"}`);
        const data = await res.json();
        if (id === "stats") {
          setAdminResult(`📊 Статистика:\n• Всего: ${data.total}\n• Решено: ${data.resolved}\n• Активных: ${data.active}\n• Стран: ${data.countries}`);
        } else {
          const incs = data.incidents || [];
          setAdminResult(`⚠️ Активные (${incs.length}):\n` + incs.slice(0, 5).map((i: { title: string; country: string; severity: string }) => `• ${i.title} [${i.severity}] — ${i.country}`).join("\n"));
        }
      } else {
        setAdminResult(`✅ Действие "${ADMIN_ACTIONS.find(a => a.id === id)?.label}" выполнено.\nВремя: ${now()}`);
      }
    } catch {
      setAdminResult("Ошибка выполнения действия.");
    }
    setAdminLoading(null);
  };

  const accentColor = "#34d399";

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      style={{ background: "linear-gradient(135deg, #34d399, #9b1dcc)" }}>
      <Icon name="Bot" size={22} className="text-white" />
    </button>
  );

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
      style={{ width: 340, maxHeight: minimized ? 52 : 520, background: "#0d1225", border: "1px solid #34d39930" }}>

      {/* Шапка */}
      <div className="flex items-center gap-2 px-3 py-2 shrink-0"
        style={{ background: "linear-gradient(135deg, #34d39918, #9b1dcc14)", borderBottom: "1px solid #34d39920" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #34d399, #9b1dcc)" }}>
          <Icon name="Bot" size={15} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white text-xs font-bold">ИИ-Ассистент ЕЦСУ</div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            <span className="text-[9px] text-green-400">Далан-1 · активен</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setTab("dialog")} title="Чат" className="text-gray-500 hover:text-gray-300 p-0.5 transition-colors">
            <Icon name="LayoutGrid" size={11} />
          </button>
          <button onClick={() => setMessages([{ role: "assistant", content: GREETING, time: now() }])} title="Очистить" className="text-gray-500 hover:text-gray-300 p-0.5 transition-colors">
            <Icon name="Trash2" size={11} />
          </button>
          <button onClick={() => setMinimized(!minimized)} className="text-gray-500 hover:text-gray-300 p-0.5">
            <Icon name={minimized ? "Maximize2" : "Minimize2"} size={11} />
          </button>
          <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-red-400 p-0.5">
            <Icon name="X" size={12} />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Вкладки */}
          <div className="flex border-b border-white/5 shrink-0">
            {([
              { id: "dialog", label: "Диалог",  icon: "MessageSquare" },
              { id: "cpvoa",  label: "ЦПВОА",   icon: "Radar" },
              { id: "admin",  label: "Админ",   icon: "Shield" },
              { id: "ai",     label: "ИИ",      icon: "Settings" },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-medium transition-all ${
                  tab === t.id ? "text-green-400 border-b-2 border-green-400" : "text-gray-600 hover:text-gray-400"
                }`}>
                <Icon name={t.icon} size={10} />
                {t.label}
              </button>
            ))}
          </div>

          {/* ── ДИАЛОГ ── */}
          {tab === "dialog" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: msg.role === "assistant" ? "linear-gradient(135deg,#34d399,#9b1dcc)" : "#1e293b" }}>
                      <Icon name={msg.role === "assistant" ? "Bot" : "User"} size={11} className="text-white" />
                    </div>
                    <div className="flex flex-col gap-0.5 max-w-[82%]">
                      {msg.time && <div className="text-[9px] text-gray-700 px-1">{msg.time}</div>}
                      <div className="px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap"
                        style={msg.role === "user"
                          ? { background: "#34d399", color: "#000", fontWeight: 500 }
                          : { background: "#0a0f1e", color: "#e2e8f0", border: "1px solid #34d39915" }
                        }>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "linear-gradient(135deg,#34d399,#9b1dcc)" }}>
                      <Icon name="Bot" size={11} className="text-white" />
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-[#0a0f1e] border border-green-900/20 flex items-center gap-1">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                {/* Быстрые кнопки при пустом диалоге */}
                {messages.length === 1 && !loading && (
                  <div className="flex flex-wrap gap-1.5 px-1">
                    {QUICK.map(q => (
                      <button key={q.label} onClick={() => send(q.label, q.mode)}
                        className="text-[10px] px-2.5 py-1 rounded-full border border-green-700/40 bg-green-900/20 text-green-400 hover:bg-green-900/40 transition-colors">
                        {q.label}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Ввод */}
              <div className="px-3 pb-3 pt-2 border-t border-white/5 shrink-0">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Напишите сообщение... (Enter —"
                    rows={1}
                    className="flex-1 bg-[#060d1f] border border-green-900/20 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-green-500/40 resize-none placeholder-gray-700"
                    style={{ minHeight: 36, maxHeight: 80 }}
                  />
                  <button onClick={() => send()} disabled={!input.trim() || loading}
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg,#34d399,#9b1dcc)" }}>
                    <Icon name="Send" size={13} className="text-white" />
                  </button>
                </div>
                <div className="text-[9px] text-gray-700 mt-1 px-1 flex justify-between">
                  <span>Shift+Enter — перенос</span>
                  <span>Далан-1 · ECSU 2.0</span>
                </div>
              </div>
            </div>
          )}

          {/* ── ЦПВОА ── */}
          {tab === "cpvoa" && (
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">ЦПВОА — МОНИТОРИНГ</div>
              <div className="space-y-2">
                {[
                  { label: "Мониторинг эфира",   desc: "Анализ радиочастотных аномалий", color: "#34d399", icon: "Radio" },
                  { label: "Тревожный режим",     desc: "Активация протокола тревоги",    color: "#60a5fa", icon: "Siren" },
                  { label: "База сигналов",        desc: "Архив зафиксированных сигналов", color: "#f59e0b", icon: "Database" },
                  { label: "Справочная ЦПВОА",    desc: "Документы и инструкции",         color: "#94a3b8", icon: "BookOpen" },
                  { label: "ЭКСТРЕННЫЙ СИГНАЛ",   desc: "Немедленная тревога системы",    color: "#e94560", icon: "AlertOctagon" },
                ].map(a => (
                  <button key={a.label} onClick={() => { setTab("dialog"); send(a.label, "cpvoa"); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all hover:opacity-90 text-left"
                    style={{ background: a.color + "12", borderColor: a.color + "30" }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: a.color + "22" }}>
                      <Icon name={a.icon} size={13} style={{ color: a.color }} />
                    </div>
                    <div>
                      <div className="text-white text-xs font-medium">{a.label}</div>
                      <div className="text-gray-500 text-[10px]">{a.desc}</div>
                    </div>
                    <Icon name="ChevronRight" size={12} className="text-gray-600 ml-auto shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── АДМИН ── */}
          {tab === "admin" && (
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">ИИ-АДМИНИСТРАТОР ECSU · ЗАМЕСТИТЕЛЬ ВЛАДЕЛЬЦА</div>
              <div className="space-y-2">
                {ADMIN_ACTIONS.map(a => (
                  <button key={a.id}
                    onClick={() => handleAdminAction(a.id)}
                    disabled={adminLoading === a.id}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all hover:opacity-90 text-left disabled:opacity-60"
                    style={{ background: a.color + "12", borderColor: a.color + "30" }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: a.color + "22" }}>
                      {adminLoading === a.id
                        ? <Icon name="Loader2" size={13} style={{ color: a.color }} className="animate-spin" />
                        : <Icon name={a.icon} size={13} style={{ color: a.color }} />}
                    </div>
                    <div>
                      <div className="text-white text-xs font-medium">{a.label}</div>
                      <div className="text-gray-500 text-[10px]">{a.desc}</div>
                    </div>
                    <Icon name="ChevronRight" size={12} className="text-gray-600 ml-auto shrink-0" />
                  </button>
                ))}
              </div>
              {adminResult && (
                <div className="mt-3 bg-[#060d1f] border border-green-900/20 rounded-xl p-3 text-xs text-gray-300 whitespace-pre-wrap font-mono">
                  {adminResult}
                </div>
              )}
              <div className="mt-3 text-[9px] text-gray-700 text-center">
                Все действия выполняются от имени ИИ-администратора и записываются в системный журнал ECSU.
              </div>
            </div>
          )}

          {/* ── ИИ (провайдеры) ── */}
          {tab === "ai" && (
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">РЕЖИМ ВЫБОРА ПРОВАЙДЕРА</div>
              <div className="space-y-2">
                {PROVIDERS.filter(p => p.recommended).map(p => (
                  <button key={p.id} onClick={() => setProvider(p.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
                    style={provider === p.id
                      ? { background: p.color + "22", borderColor: p.color + "50" }
                      : { background: p.color + "10", borderColor: p.color + "25" }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: p.color }}>
                      <Icon name="Sparkles" size={12} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-xs font-medium">{p.label}</span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-green-900/40 border border-green-700/30 text-green-400 rounded-full">РЕКОМЕНДУЕТСЯ</span>
                      </div>
                      <div className="text-gray-500 text-[10px]">{p.desc}</div>
                    </div>
                    {provider === p.id && <Icon name="Check" size={12} className="text-green-400 shrink-0" />}
                  </button>
                ))}

                <div className="text-[10px] text-gray-600 uppercase tracking-wider my-2">ИЛИ ВЫБРАТЬ ВРУЧНУЮ</div>

                {PROVIDERS.filter(p => !p.recommended).map(p => (
                  <button key={p.id} onClick={() => setProvider(p.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
                    style={provider === p.id
                      ? { background: p.color + "22", borderColor: p.color + "50" }
                      : { background: "#0d1225", borderColor: "#ffffff10" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: p.color }}>
                      <Icon name="Cpu" size={11} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-xs font-medium">{p.label}</div>
                      <div className="text-gray-500 text-[10px]">{p.desc}</div>
                    </div>
                    {provider === p.id && (
                      <div className="flex items-center gap-1">
                        <Icon name="Check" size={11} className="text-green-400 shrink-0" />
                        <span className="text-[9px] text-green-400">Готов к работе</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FloatingAiChat;
