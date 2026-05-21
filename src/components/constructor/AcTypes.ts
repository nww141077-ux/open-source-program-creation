// ─── ТИПЫ ──────────────────────────────────────────────────────────────────
export interface Message { role: "user" | "assistant"; content: string; rating?: 1 | -1; }
export interface KnowledgeItem { id: string; question: string; answer: string; source: "manual" | "web" | "doc"; createdAt: string; }
export interface TrainingFeedback { msgIdx: number; rating: 1 | -1; comment: string; }
export interface UploadedDoc { id: string; name: string; content: string; size: string; uploadedAt: string; }
export interface SearchResult { title: string; url: string; snippet: string; savedAt: string; }
export interface LMSettings { host: string; port: string; model: string; temperature: number; maxTokens: number; systemPrompt: string; }

// ─── ХРАНИЛИЩЕ ─────────────────────────────────────────────────────────────
export const SK = {
  settings:  "ac_lm_settings",
  knowledge: "ac_knowledge",
  docs:      "ac_docs",
  search:    "ac_search",
  feedback:  "ac_feedback",
  history:   "ac_history",
};

export function lsGet<T>(key: string, def: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : def; }
  catch { return def; }
}

export function lsSet(key: string, val: unknown) { localStorage.setItem(key, JSON.stringify(val)); }

// ─── LM STUDIO DEFAULTS ─────────────────────────────────────────────────────
export const DEFAULT_SETTINGS: LMSettings = {
  host: "localhost", port: "1234", model: "default",
  temperature: 0.7, maxTokens: 2048,
  systemPrompt: "Ты — умный ИИ-конструктор приложений и сайтов. Отвечай на русском языке. Помогай создавать код, UI-компоненты, архитектуру приложений. Используй свои знания и базу знаний пользователя для точных ответов.",
};

// ─── LM STUDIO CLIENT ───────────────────────────────────────────────────────
export async function callLMStudio(
  messages: Message[],
  settings: LMSettings,
  knowledge: KnowledgeItem[],
  docs: UploadedDoc[]
): Promise<string> {
  const url = `http://${settings.host}:${settings.port}/v1/chat/completions`;

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
export const QUICK_PROMPTS = [
  { icon: "Code2",      label: "Создай React-компонент",   text: "Создай React-компонент: кнопка с иконкой и анимацией hover, стиль Tailwind CSS, TypeScript" },
  { icon: "Globe",      label: "Лендинг на HTML",          text: "Напиши готовый лендинг на HTML/CSS: тёмный стиль, секция hero, features, CTA-кнопка" },
  { icon: "Wand2",      label: "Архитектура приложения",   text: "Предложи архитектуру для веб-приложения: каталог товаров с корзиной и оплатой" },
  { icon: "Terminal",   label: "Python скрипт",            text: "Напиши Python скрипт для автоматизации: мониторинг папки и отправка уведомлений" },
  { icon: "Smartphone", label: "Мобильная страница",       text: "Создай мобильную страницу профиля пользователя: аватар, статистика, кнопки действий" },
  { icon: "Database",   label: "SQL схема БД",             text: "Создай SQL схему для интернет-магазина: товары, пользователи, заказы, отзывы" },
];
