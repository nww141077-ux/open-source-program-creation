import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

// ─── ТИПЫ ──────────────────────────────────────────────────────────────────
interface Message { role: "user" | "assistant"; content: string; rating?: 1 | -1; }
interface KnowledgeItem { id: string; question: string; answer: string; source: "manual" | "web" | "doc"; createdAt: string; }
interface TrainingFeedback { msgIdx: number; rating: 1 | -1; comment: string; }
interface UploadedDoc { id: string; name: string; content: string; size: string; uploadedAt: string; }
interface SearchResult { title: string; url: string; snippet: string; savedAt: string; }

// ─── ХРАНИЛИЩЕ ─────────────────────────────────────────────────────────────
const SK = {
  settings:  "ac_lm_settings",
  knowledge: "ac_knowledge",
  docs:      "ac_docs",
  search:    "ac_search",
  feedback:  "ac_feedback",
  history:   "ac_history",
};
function lsGet<T>(key: string, def: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : def; }
  catch { return def; }
}
function lsSet(key: string, val: unknown) { localStorage.setItem(key, JSON.stringify(val)); }

// ─── LM STUDIO CLIENT ───────────────────────────────────────────────────────
interface LMSettings { host: string; port: string; model: string; temperature: number; maxTokens: number; systemPrompt: string; }
const DEFAULT_SETTINGS: LMSettings = {
  host: "localhost", port: "1234", model: "default",
  temperature: 0.7, maxTokens: 2048,
  systemPrompt: "Ты — умный ИИ-конструктор приложений и сайтов. Отвечай на русском языке. Помогай создавать код, UI-компоненты, архитектуру приложений. Используй свои знания и базу знаний пользователя для точных ответов.",
};

async function callLMStudio(
  messages: Message[],
  settings: LMSettings,
  knowledge: KnowledgeItem[],
  docs: UploadedDoc[]
): Promise<string> {
  const url = `http://${settings.host}:${settings.port}/v1/chat/completions`;

  // Собираем контекст из базы знаний (RAG)
  let ragContext = "";
  if (knowledge.length > 0 || docs.length > 0) {
    const lastMsg = messages[messages.length - 1]?.content || "";
    const relevant = knowledge.filter(k =>
      k.question.toLowerCase().includes(lastMsg.toLowerCase().slice(0, 30)) ||
      k.answer.toLowerCase().includes(lastMsg.toLowerCase().slice(0, 30))
    ).slice(0, 3);

    const relevantDocs = docs.filter(d =>
      d.content.toLowerCase().includes(lastMsg.toLowerCase().slice(0, 20))
    ).slice(0, 2);

    if (relevant.length > 0) {
      ragContext += "\n\n[База знаний]\n" + relevant.map(k => `Q: ${k.question}\nA: ${k.answer}`).join("\n\n");
    }
    if (relevantDocs.length > 0) {
      ragContext += "\n\n[Документы пользователя]\n" + relevantDocs.map(d => `${d.name}:\n${d.content.slice(0, 500)}...`).join("\n\n");
    }
  }

  const systemContent = settings.systemPrompt + ragContext;

  const payload = {
    model: settings.model,
    messages: [
      { role: "system", content: systemContent },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ],
    temperature: settings.temperature,
    max_tokens: settings.maxTokens,
    stream: false,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`LM Studio: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Пустой ответ от модели";
}

// ─── БЫСТРЫЕ ВОПРОСЫ ───────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { icon: "Code2",      label: "Создай React-компонент",   text: "Создай React-компонент: кнопка с иконкой и анимацией hover, стиль Tailwind CSS, TypeScript" },
  { icon: "Globe",      label: "Лендинг на HTML",          text: "Напиши готовый лендинг на HTML/CSS: тёмный стиль, секция hero, features, CTA-кнопка" },
  { icon: "Wand2",      label: "Архитектура приложения",   text: "Предложи архитектуру для веб-приложения: каталог товаров с корзиной и оплатой" },
  { icon: "Terminal",   label: "Python скрипт",            text: "Напиши Python скрипт для автоматизации: мониторинг папки и отправка уведомлений" },
  { icon: "Smartphone", label: "Мобильная страница",       text: "Создай мобильную страницу профиля пользователя: аватар, статистика, кнопки действий" },
  { icon: "Database",   label: "SQL схема БД",             text: "Создай SQL схему для интернет-магазина: товары, пользователи, заказы, отзывы" },
];

// ─── ГЛАВНЫЙ КОМПОНЕНТ ─────────────────────────────────────────────────────
const AiConstructor = () => {
  const [tab, setTab] = useState<"chat" | "knowledge" | "docs" | "search" | "settings">("chat");
  const [settings, setSettings]   = useState<LMSettings>(() => lsGet(SK.settings, DEFAULT_SETTINGS));
  const [messages, setMessages]   = useState<Message[]>(() => lsGet(SK.history, []));
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>(() => lsGet(SK.knowledge, []));
  const [docs, setDocs]           = useState<UploadedDoc[]>(() => lsGet(SK.docs, []));
  const [searches, setSearches]   = useState<SearchResult[]>(() => lsGet(SK.search, []));

  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [connected, setConnected] = useState<boolean | null>(null);
  const [checking, setChecking]   = useState(false);

  // База знаний
  const [kq, setKq] = useState(""); const [ka, setKa] = useState("");
  // Документы
  const fileRef = useRef<HTMLInputElement>(null);
  // Поиск
  const [searchQ, setSearchQ] = useState("");
  const [searching, setSearching] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  // ── Сохранение ────────────────────────────────────────────────────────────
  const saveSettings = (s: LMSettings) => { setSettings(s); lsSet(SK.settings, s); };
  const saveMessages = (m: Message[]) => { setMessages(m); lsSet(SK.history, m); };
  const saveKnowledge = (k: KnowledgeItem[]) => { setKnowledge(k); lsSet(SK.knowledge, k); };
  const saveDocs = (d: UploadedDoc[]) => { setDocs(d); lsSet(SK.docs, d); };
  const saveSearches = (s: SearchResult[]) => { setSearches(s); lsSet(SK.search, s); };

  // ── Проверка LM Studio ─────────────────────────────────────────────────
  const checkConnection = async () => {
    setChecking(true); setConnected(null);
    try {
      const r = await fetch(`http://${settings.host}:${settings.port}/v1/models`, { signal: AbortSignal.timeout(3000) });
      setConnected(r.ok);
    } catch { setConnected(false); }
    setChecking(false);
  };

  // ── Отправка сообщения ─────────────────────────────────────────────────
  const send = async (text?: string) => {
    const t = (text || input).trim();
    if (!t || loading) return;
    setInput(""); setError("");

    const newMsgs: Message[] = [...messages, { role: "user", content: t }];
    saveMessages(newMsgs);
    setLoading(true);

    try {
      const reply = await callLMStudio(newMsgs, settings, knowledge, docs);
      saveMessages([...newMsgs, { role: "assistant", content: reply }]);
    } catch (e) {
      const err = e instanceof Error ? e.message : "Неизвестная ошибка";
      setError(err.includes("Failed to fetch") || err.includes("TypeError")
        ? "Не удалось подключиться к LM Studio. Убедитесь что LM Studio запущен и сервер активен (порт " + settings.port + ")"
        : "Ошибка: " + err);
    }
    setLoading(false);
  };

  // ── Оценка ответа ─────────────────────────────────────────────────────
  const rateMessage = (idx: number, rating: 1 | -1) => {
    const updated = messages.map((m, i) => i === idx ? { ...m, rating } : m);
    saveMessages(updated);
    const fb: TrainingFeedback[] = lsGet(SK.feedback, []);
    fb.push({ msgIdx: idx, rating, comment: "" });
    lsSet(SK.feedback, fb);
  };

  // ── База знаний ───────────────────────────────────────────────────────
  const addKnowledge = () => {
    if (!kq.trim() || !ka.trim()) return;
    const item: KnowledgeItem = {
      id: Date.now().toString(), question: kq.trim(), answer: ka.trim(),
      source: "manual", createdAt: new Date().toLocaleDateString("ru-RU"),
    };
    saveKnowledge([item, ...knowledge]);
    setKq(""); setKa("");
  };

  const deleteKnowledge = (id: string) => saveKnowledge(knowledge.filter(k => k.id !== id));

  // ── Загрузка документа ────────────────────────────────────────────────
  const uploadDoc = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      const doc: UploadedDoc = {
        id: Date.now().toString(), name: file.name,
        content: content.slice(0, 50000), // ограничение
        size: file.size > 1024 * 1024
          ? (file.size / 1024 / 1024).toFixed(1) + " МБ"
          : (file.size / 1024).toFixed(0) + " КБ",
        uploadedAt: new Date().toLocaleDateString("ru-RU"),
      };
      saveDocs([doc, ...docs]);
    };
    reader.readAsText(file, "utf-8");
  };

  // ── Интернет-поиск ────────────────────────────────────────────────────
  const doSearch = async () => {
    if (!searchQ.trim()) return;
    setSearching(true);
    // Открываем поиск в браузере + сохраняем как заметку
    const q = searchQ.trim();
    window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_blank");

    // Симулируем сохранение результата (в реальности нужен прокси или Electron)
    const result: SearchResult = {
      title: `Поиск: ${q}`,
      url: `https://www.google.com/search?q=${encodeURIComponent(q)}`,
      snippet: `Запрос выполнен ${new Date().toLocaleTimeString("ru-RU")}. Откройте ссылку и скопируйте нужное в базу знаний.`,
      savedAt: new Date().toLocaleTimeString("ru-RU"),
    };
    saveSearches([result, ...searches]);
    setSearching(false);
    setSearchQ("");
  };

  const addSearchToKnowledge = (s: SearchResult) => {
    const item: KnowledgeItem = {
      id: Date.now().toString(), question: s.title, answer: s.snippet,
      source: "web", createdAt: s.savedAt,
    };
    saveKnowledge([item, ...knowledge]);
  };

  const clearHistory = () => { if (confirm("Очистить историю чата?")) saveMessages([]); };

  // ─── РЕНДЕР ──────────────────────────────────────────────────────────────
  const TABS = [
    { id: "chat",      label: "Чат",          icon: "MessageSquare" },
    { id: "knowledge", label: "База знаний",   icon: "BookOpen"      },
    { id: "docs",      label: "Документы",     icon: "FileText"      },
    { id: "search",    label: "Веб-поиск",     icon: "Search"        },
    { id: "settings",  label: "Настройки",     icon: "Settings"      },
  ] as const;

  const connColor = connected === true ? "#34d399" : connected === false ? "#e94560" : "#94a3b8";

  return (
    <div className="flex flex-col h-full bg-[#080c1a] text-white">

      {/* ── ШАПКА ── */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-blue-900/20">
        <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-700 rounded-xl flex items-center justify-center">
          <Icon name="BrainCircuit" size={18} className="text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-sm">ИИ-Конструктор ЕЦСУ</div>
          <div className="text-gray-500 text-[10px] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: connColor }} />
            {connected === true ? "LM Studio подключён" : connected === false ? "LM Studio недоступен" : "LM Studio · локальный ИИ"}
          </div>
        </div>
        <div className="flex-1" />
        <button onClick={checkConnection} disabled={checking}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/30 border border-blue-700/30 text-blue-400 text-xs rounded-lg hover:bg-blue-900/50 transition-colors disabled:opacity-50">
          <Icon name={checking ? "Loader" : "Wifi"} size={12} className={checking ? "animate-spin" : ""} />
          {checking ? "Проверка..." : "Проверить связь"}
        </button>
      </div>

      {/* ── ВКЛАДКИ ── */}
      <div className="flex gap-1 px-4 pt-3 pb-0 border-b border-blue-900/10">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-all ${tab === t.id ? "text-purple-300 border-purple-500 bg-purple-900/10" : "text-gray-500 border-transparent hover:text-gray-300"}`}>
            <Icon name={t.icon} size={12} />
            {t.label}
            {t.id === "knowledge" && knowledge.length > 0 && (
              <span className="w-4 h-4 text-[9px] bg-purple-700 rounded-full flex items-center justify-center">{knowledge.length}</span>
            )}
            {t.id === "docs" && docs.length > 0 && (
              <span className="w-4 h-4 text-[9px] bg-blue-700 rounded-full flex items-center justify-center">{docs.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── ЧАТ ── */}
      {tab === "chat" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Быстрые промпты */}
          {messages.length === 0 && (
            <div className="p-4 grid grid-cols-3 gap-2">
              {QUICK_PROMPTS.map(p => (
                <button key={p.label} onClick={() => send(p.text)}
                  className="flex flex-col items-start gap-1.5 p-3 bg-[#0a0f1e] border border-blue-900/30 rounded-xl hover:border-purple-700/40 text-left transition-all group">
                  <Icon name={p.icon} size={14} className="text-purple-400 group-hover:text-purple-300" />
                  <span className="text-xs text-gray-400 group-hover:text-gray-200">{p.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Сообщения */}
          <div className="flex-1 overflow-auto px-4 py-3 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${m.role === "assistant" ? "bg-gradient-to-br from-purple-600 to-blue-700" : "bg-[#1e2d4a]"}`}>
                  <Icon name={m.role === "assistant" ? "BrainCircuit" : "User"} size={13} className="text-white" />
                </div>
                <div className="flex-1 max-w-[80%]">
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "assistant"
                      ? "bg-[#0d1225] border border-blue-900/30 text-gray-200"
                      : "bg-gradient-to-br from-purple-700 to-blue-700 text-white"
                  }`}>
                    {m.content}
                  </div>
                  {m.role === "assistant" && (
                    <div className="flex items-center gap-2 mt-1.5 pl-1">
                      <button onClick={() => navigator.clipboard.writeText(m.content)}
                        className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-400 transition-colors">
                        <Icon name="Copy" size={10} />
                        Копировать
                      </button>
                      <button onClick={() => rateMessage(i, 1)}
                        className={`text-[10px] flex items-center gap-0.5 transition-colors ${m.rating === 1 ? "text-green-400" : "text-gray-600 hover:text-green-400"}`}>
                        <Icon name="ThumbsUp" size={10} />
                        {m.rating === 1 ? "Хорошо" : ""}
                      </button>
                      <button onClick={() => rateMessage(i, -1)}
                        className={`text-[10px] flex items-center gap-0.5 transition-colors ${m.rating === -1 ? "text-red-400" : "text-gray-600 hover:text-red-400"}`}>
                        <Icon name="ThumbsDown" size={10} />
                        {m.rating === -1 ? "Плохо" : ""}
                      </button>
                      <button onClick={() => {
                        const kItem: KnowledgeItem = {
                          id: Date.now().toString(),
                          question: messages[i - 1]?.content || "Вопрос",
                          answer: m.content,
                          source: "manual",
                          createdAt: new Date().toLocaleDateString("ru-RU"),
                        };
                        saveKnowledge([kItem, ...knowledge]);
                      }} className="text-[10px] text-gray-600 hover:text-purple-400 transition-colors flex items-center gap-0.5">
                        <Icon name="BookmarkPlus" size={10} />
                        В базу знаний
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-blue-700 flex items-center justify-center">
                  <Icon name="BrainCircuit" size={13} className="text-white" />
                </div>
                <div className="bg-[#0d1225] border border-blue-900/30 px-4 py-3 rounded-2xl flex items-center gap-1.5">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                  <span className="text-gray-600 text-xs ml-2">LM Studio думает...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-3 text-sm text-red-300 flex items-start gap-2">
                <Icon name="AlertCircle" size={14} className="mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Ошибка подключения к LM Studio</div>
                  <div className="text-xs text-red-400">{error}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    Как запустить: откройте LM Studio → вкладка «Local Server» → нажмите «Start Server»
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Поле ввода */}
          <div className="px-4 pb-4 pt-2 border-t border-blue-900/10">
            {messages.length > 0 && (
              <button onClick={clearHistory} className="text-[10px] text-gray-700 hover:text-gray-500 mb-2 transition-colors">
                Очистить историю
              </button>
            )}
            <div className="flex gap-2">
              <textarea value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Опиши что нужно создать... (Enter — отправить, Shift+Enter — новая строка)"
                rows={2}
                className="flex-1 bg-[#0a0f1e] border border-blue-900/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none resize-none focus:border-purple-700/50" />
              <button onClick={() => send()} disabled={!input.trim() || loading}
                className="w-12 bg-gradient-to-br from-purple-600 to-blue-700 text-white rounded-xl flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity flex-shrink-0">
                <Icon name="Send" size={16} />
              </button>
            </div>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-700">
              <span className="flex items-center gap-1">
                <Icon name="BookOpen" size={9} />
                {knowledge.length} знаний в RAG
              </span>
              <span className="flex items-center gap-1">
                <Icon name="FileText" size={9} />
                {docs.length} документов
              </span>
              <span className="flex items-center gap-1" style={{ color: connColor }}>
                <Icon name="Cpu" size={9} />
                {settings.host}:{settings.port}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── БАЗА ЗНАНИЙ (RAG + Ручное) ── */}
      {tab === "knowledge" && (
        <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
          <div className="bg-[#0a0f1e] border border-purple-900/30 rounded-xl p-4">
            <div className="text-purple-300 text-xs font-semibold mb-3 flex items-center gap-2">
              <Icon name="Plus" size={12} />
              Добавить знание вручную
            </div>
            <input value={kq} onChange={e => setKq(e.target.value)} placeholder="Вопрос / тема"
              className="w-full bg-[#060b18] border border-purple-900/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none mb-2" />
            <textarea value={ka} onChange={e => setKa(e.target.value)} placeholder="Ответ / содержание"
              rows={4}
              className="w-full bg-[#060b18] border border-purple-900/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none resize-none mb-2" />
            <button onClick={addKnowledge} disabled={!kq.trim() || !ka.trim()}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold rounded-lg disabled:opacity-40 transition-colors">
              Добавить в базу
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {knowledge.length === 0 && (
              <div className="text-gray-600 text-sm text-center py-8">База знаний пуста — добавьте знания или загрузите документы</div>
            )}
            {knowledge.map(k => (
              <div key={k.id} className="bg-[#0a0f1e] border border-blue-900/20 rounded-xl p-3 flex gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${k.source === "manual" ? "bg-purple-900/30 text-purple-400" : k.source === "web" ? "bg-blue-900/30 text-blue-400" : "bg-green-900/30 text-green-400"}`}>
                      {k.source === "manual" ? "ручное" : k.source === "web" ? "веб" : "документ"}
                    </span>
                    <span className="text-gray-600 text-[9px]">{k.createdAt}</span>
                  </div>
                  <div className="text-white text-xs font-semibold mb-1">{k.question}</div>
                  <div className="text-gray-400 text-xs line-clamp-2">{k.answer}</div>
                </div>
                <button onClick={() => deleteKnowledge(k.id)}
                  className="text-gray-700 hover:text-red-400 transition-colors flex-shrink-0">
                  <Icon name="X" size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ДОКУМЕНТЫ (RAG из файлов) ── */}
      {tab === "docs" && (
        <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
          <div className="bg-[#0a0f1e] border border-blue-900/30 rounded-xl p-4">
            <div className="text-blue-300 text-xs font-semibold mb-2 flex items-center gap-2">
              <Icon name="Upload" size={12} />
              Загрузить документ
            </div>
            <div className="text-gray-500 text-xs mb-3">Поддерживаются: .txt, .md, .json, .py, .js, .ts, .html, .css, .csv</div>
            <input ref={fileRef} type="file" className="hidden"
              accept=".txt,.md,.json,.py,.js,.ts,.html,.css,.csv"
              onChange={e => { if (e.target.files?.[0]) uploadDoc(e.target.files[0]); }} />
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors">
              <Icon name="FolderOpen" size={13} />
              Выбрать файл
            </button>
            <div className="text-gray-700 text-[10px] mt-2">
              ИИ будет использовать содержимое документов при ответах (RAG)
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {docs.length === 0 && (
              <div className="text-gray-600 text-sm text-center py-8">Нет загруженных документов</div>
            )}
            {docs.map(d => (
              <div key={d.id} className="bg-[#0a0f1e] border border-blue-900/20 rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="FileText" size={15} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-semibold truncate">{d.name}</div>
                  <div className="text-gray-500 text-xs">{d.size} · загружен {d.uploadedAt}</div>
                  <div className="text-gray-700 text-[10px] mt-0.5 truncate">{d.content.slice(0, 80)}...</div>
                </div>
                <button onClick={() => saveDocs(docs.filter(dd => dd.id !== d.id))}
                  className="text-gray-700 hover:text-red-400 transition-colors">
                  <Icon name="Trash2" size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ВЕБ-ПОИСК ── */}
      {tab === "search" && (
        <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
          <div className="bg-[#0a0f1e] border border-blue-900/30 rounded-xl p-4">
            <div className="text-blue-300 text-xs font-semibold mb-3 flex items-center gap-2">
              <Icon name="Search" size={12} />
              Поиск в интернете
            </div>
            <div className="flex gap-2">
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") doSearch(); }}
                placeholder="Что искать?"
                className="flex-1 bg-[#060b18] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none" />
              <button onClick={doSearch} disabled={!searchQ.trim() || searching}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded-lg disabled:opacity-40 transition-colors">
                {searching ? "..." : "Найти"}
              </button>
            </div>
            <div className="text-gray-600 text-[10px] mt-2 flex items-center gap-1.5">
              <Icon name="Info" size={9} />
              Открывает Google-поиск и сохраняет запрос. Найденное можно добавить в базу знаний.
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {searches.length === 0 && (
              <div className="text-gray-600 text-sm text-center py-8">История поиска пуста</div>
            )}
            {searches.map((s, i) => (
              <div key={i} className="bg-[#0a0f1e] border border-blue-900/20 rounded-xl p-3 flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="Globe" size={13} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-semibold">{s.title}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{s.snippet}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <a href={s.url} target="_blank" rel="noreferrer"
                      className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                      <Icon name="ExternalLink" size={9} />
                      Открыть
                    </a>
                    <button onClick={() => addSearchToKnowledge(s)}
                      className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
                      <Icon name="BookmarkPlus" size={9} />
                      В базу знаний
                    </button>
                    <span className="text-gray-700 text-[9px]">{s.savedAt}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── НАСТРОЙКИ LM STUDIO ── */}
      {tab === "settings" && (
        <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">

          <div className="bg-blue-900/10 border border-blue-700/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Info" size={13} className="text-blue-400" />
              <span className="text-blue-300 text-sm font-semibold">Как подключить LM Studio</span>
            </div>
            <ol className="text-gray-400 text-xs space-y-1.5 list-decimal list-inside">
              <li>Скачай LM Studio: <span className="text-blue-400">lmstudio.ai</span></li>
              <li>Установи на ПК и запусти</li>
              <li>Скачай модель (рекомендую: Mistral 7B или LLaMA 3.1 8B)</li>
              <li>Перейди на вкладку <code className="text-green-400">Local Server</code></li>
              <li>Выбери модель и нажми <code className="text-green-400">Start Server</code></li>
              <li>Сервер запустится на порту 1234 по умолчанию</li>
            </ol>
          </div>

          <div className="bg-[#0a0f1e] border border-blue-900/30 rounded-xl p-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-500 text-[10px] uppercase mb-1.5 block">Хост</label>
                <input value={settings.host} onChange={e => saveSettings({ ...settings, host: e.target.value })}
                  className="w-full bg-[#060b18] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="text-gray-500 text-[10px] uppercase mb-1.5 block">Порт</label>
                <input value={settings.port} onChange={e => saveSettings({ ...settings, port: e.target.value })}
                  className="w-full bg-[#060b18] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white outline-none" />
              </div>
            </div>
            <div>
              <label className="text-gray-500 text-[10px] uppercase mb-1.5 block">Название модели (из LM Studio)</label>
              <input value={settings.model} onChange={e => saveSettings({ ...settings, model: e.target.value })}
                placeholder="default (или точное название из LM Studio)"
                className="w-full bg-[#060b18] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-500 text-[10px] uppercase mb-1.5 block">Temperature (0–1)</label>
                <input type="number" step="0.1" min="0" max="1" value={settings.temperature}
                  onChange={e => saveSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                  className="w-full bg-[#060b18] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="text-gray-500 text-[10px] uppercase mb-1.5 block">Max Tokens</label>
                <input type="number" step="256" min="256" max="8192" value={settings.maxTokens}
                  onChange={e => saveSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
                  className="w-full bg-[#060b18] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white outline-none" />
              </div>
            </div>
            <div>
              <label className="text-gray-500 text-[10px] uppercase mb-1.5 block">Системный промпт (личность ИИ)</label>
              <textarea value={settings.systemPrompt}
                onChange={e => saveSettings({ ...settings, systemPrompt: e.target.value })}
                rows={5}
                className="w-full bg-[#060b18] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={checkConnection}
                className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                <Icon name="Wifi" size={14} />
                Проверить подключение
              </button>
              <button onClick={() => saveSettings(DEFAULT_SETTINGS)}
                className="px-4 py-2.5 bg-gray-800 text-gray-400 text-sm rounded-lg hover:bg-gray-700 transition-colors">
                Сбросить
              </button>
            </div>
            {connected !== null && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${connected ? "bg-green-900/20 text-green-400" : "bg-red-900/20 text-red-400"}`}>
                <Icon name={connected ? "CheckCircle" : "XCircle"} size={14} />
                {connected ? "LM Studio доступен! Можно работать." : "LM Studio недоступен. Запустите сервер в LM Studio."}
              </div>
            )}
          </div>

          <div className="bg-[#0a0f1e] border border-purple-900/20 rounded-xl p-4">
            <div className="text-purple-300 text-xs font-semibold mb-3 flex items-center gap-2">
              <Icon name="Brain" size={12} />
              Статистика обучения
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Записей в базе", value: knowledge.length, color: "#a78bfa" },
                { label: "Документов",     value: docs.length,      color: "#60a5fa" },
                { label: "Поисков",        value: searches.length,  color: "#34d399" },
              ].map(s => (
                <div key={s.label} className="text-center bg-[#060b18] rounded-lg p-3">
                  <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-gray-600 text-[10px] mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-gray-700 text-[10px]">
              Все данные хранятся локально в браузере (localStorage). ИИ использует их в каждом ответе через RAG.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiConstructor;
