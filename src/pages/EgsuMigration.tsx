import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const G = (s: string) => `linear-gradient(135deg, ${s})`;

// ── Целевые платформы для эмиграции ──────────────────────────────────────────
const PLATFORMS = [
  {
    id: "github-pages",
    name: "GitHub Pages",
    logo: "🐙",
    color: "#6e40c9",
    border: "rgba(110,64,201,0.4)",
    tag: "Бесплатно",
    tagColor: "#22c55e",
    desc: "Хостинг статических сайтов от GitHub. Поддерживает React SPA через CI/CD.",
    limits: ["100 GB/мес трафик", "1 GB хранилище", "Кастомный домен"],
    steps: [
      "Создать репозиторий на github.com",
      "Загрузить билд (bun run build)",
      "Включить GitHub Pages в настройках репо",
      "Настроить CNAME для своего домена",
    ],
    link: "https://pages.github.com",
  },
  {
    id: "netlify",
    name: "Netlify",
    logo: "🟢",
    color: "#00c7b7",
    border: "rgba(0,199,183,0.4)",
    tag: "Бесплатно",
    tagColor: "#22c55e",
    desc: "Платформа для фронтенда с CI/CD, Edge Functions и Serverless Functions.",
    limits: ["100 GB/мес трафик", "125k вызовов функций", "Кастомный домен + SSL"],
    steps: [
      "Зарегистрироваться на netlify.com",
      "Перетащить папку dist/ в Netlify Drop",
      "Или подключить GitHub-репозиторий",
      "Настроить redirects для SPA (_redirects файл)",
    ],
    link: "https://netlify.com",
  },
  {
    id: "vercel",
    name: "Vercel",
    logo: "▲",
    color: "#ffffff",
    border: "rgba(255,255,255,0.2)",
    tag: "Бесплатно",
    tagColor: "#22c55e",
    desc: "Платформа от создателей Next.js. Оптимальна для React-приложений.",
    limits: ["100 GB/мес трафик", "Serverless Functions", "Кастомный домен + SSL"],
    steps: [
      "Зарегистрироваться на vercel.com",
      "Подключить GitHub/GitLab репозиторий",
      "Vercel автоматически задеплоит проект",
      "Добавить кастомный домен в настройках",
    ],
    link: "https://vercel.com",
  },
  {
    id: "cloudflare-pages",
    name: "Cloudflare Pages",
    logo: "🔶",
    color: "#f48120",
    border: "rgba(244,129,32,0.4)",
    tag: "Бесплатно",
    tagColor: "#22c55e",
    desc: "CDN + хостинг с неограниченными запросами и глобальной сетью Cloudflare.",
    limits: ["Неограниченный трафик", "500 сборок/мес", "Кастомный домен + SSL"],
    steps: [
      "Зарегистрироваться на pages.cloudflare.com",
      "Подключить GitHub или загрузить билд",
      "Настроить переменные окружения",
      "Привязать домен через Cloudflare DNS",
    ],
    link: "https://pages.cloudflare.com",
  },
  {
    id: "surge",
    name: "Surge.sh",
    logo: "⚡",
    color: "#f7df1e",
    border: "rgba(247,223,30,0.35)",
    tag: "Бесплатно",
    tagColor: "#22c55e",
    desc: "Простой хостинг статики через CLI. Деплой одной командой.",
    limits: ["Неограниченный трафик", "Кастомный домен", "CLI-деплой"],
    steps: [
      "npm install --global surge",
      "bun run build",
      "surge dist/ your-domain.surge.sh",
      "Настроить 200.html для SPA роутинга",
    ],
    link: "https://surge.sh",
  },
  {
    id: "render",
    name: "Render",
    logo: "🎨",
    color: "#46e3b7",
    border: "rgba(70,227,183,0.35)",
    tag: "Бесплатно",
    tagColor: "#22c55e",
    desc: "Платформа для фронтенда и бэкенда с бесплатным тиром.",
    limits: ["100 GB/мес трафик", "Static Site бесплатно", "Кастомный домен + SSL"],
    steps: [
      "Зарегистрироваться на render.com",
      "Создать Static Site из GitHub репо",
      "Указать: Build Command: bun run build",
      "Publish Directory: dist",
    ],
    link: "https://render.com",
  },
];

const EXPORT_CHECKLIST = [
  { id: "code", label: "Экспортировать исходный код", icon: "Code2", done: false },
  { id: "build", label: "Собрать production-билд (bun run build)", icon: "Package", done: false },
  { id: "env", label: "Сохранить переменные окружения (.env)", icon: "KeyRound", done: false },
  { id: "db", label: "Сделать дамп базы данных (SQL-экспорт)", icon: "Database", done: false },
  { id: "files", label: "Скачать S3-файлы (медиа, документы)", icon: "HardDrive", done: false },
  { id: "domain", label: "Перенести DNS-записи домена", icon: "Globe", done: false },
  { id: "backend", label: "Перенести серверную логику (функции)", icon: "Server", done: false },
  { id: "test", label: "Протестировать работу на новой платформе", icon: "CheckCircle2", done: false },
];

// ─────────────────────────────────────────────────────────────────────────────

const LOCK_KEY = "ecsu_migration_locked";
const CONSENT_KEY = "ecsu_migration_consent";
const SELECTED_KEY = "ecsu_migration_selected";

export default function EgsuMigration() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"status" | "platforms" | "checklist" | "manual">("status");
  const [locked, setLocked] = useState(true);
  const [consent, setConsent] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [checklist, setChecklist] = useState(EXPORT_CHECKLIST.map(i => ({ ...i })));
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [confirmUnlock, setConfirmUnlock] = useState(false);
  const [confirmMigrate, setConfirmMigrate] = useState(false);
  const [unlockCode, setUnlockCode] = useState("");
  const [migratePhase, setMigratePhase] = useState<"idle" | "running" | "done">("idle");
  const [migrateLog, setMigrateLog] = useState<string[]>([]);

  // Загружаем состояние из localStorage
  useEffect(() => {
    const lk = localStorage.getItem(LOCK_KEY);
    const cn = localStorage.getItem(CONSENT_KEY);
    const sl = localStorage.getItem(SELECTED_KEY);
    if (lk === "false") setLocked(false);
    if (cn === "true") setConsent(true);
    if (sl) setSelected(sl);
  }, []);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const unlock = () => {
    if (unlockCode !== "MIGRATE-CONFIRM") {
      showToast("Неверный код подтверждения", false);
      return;
    }
    setLocked(false);
    setConsent(true);
    localStorage.setItem(LOCK_KEY, "false");
    localStorage.setItem(CONSENT_KEY, "true");
    setConfirmUnlock(false);
    setUnlockCode("");
    showToast("Режим эмиграции активирован");
  };

  const lockAgain = () => {
    setLocked(true);
    setConsent(false);
    localStorage.setItem(LOCK_KEY, "true");
    localStorage.setItem(CONSENT_KEY, "false");
    showToast("Автоматическая эмиграция заблокирована");
  };

  const selectPlatform = (id: string) => {
    setSelected(id);
    localStorage.setItem(SELECTED_KEY, id);
    showToast(`Платформа выбрана: ${PLATFORMS.find(p => p.id === id)?.name}`);
  };

  const toggleCheck = (id: string) => {
    setChecklist(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
  };

  const startMigration = () => {
    if (!selected) { showToast("Выберите целевую платформу", false); return; }
    if (!checklist.every(i => i.done)) { showToast("Сначала выполните все пункты чеклиста", false); return; }
    setConfirmMigrate(false);
    setMigratePhase("running");
    setMigrateLog([]);
    const platform = PLATFORMS.find(p => p.id === selected)!;
    const steps = [
      "🔍 Анализ текущей конфигурации проекта...",
      "📦 Подготовка архива исходного кода...",
      "🗄️ Создание дампа базы данных...",
      "📁 Экспорт файлового хранилища S3...",
      `🚀 Формирование инструкций деплоя для ${platform.name}...`,
      "📋 Генерация конфигурационных файлов...",
      "✅ Пакет эмиграции готов к использованию.",
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setMigrateLog(prev => [...prev, steps[i]]);
        i++;
      } else {
        clearInterval(interval);
        setMigratePhase("done");
      }
    }, 800);
  };

  const doneCnt = checklist.filter(i => i.done).length;
  const pct = Math.round((doneCnt / checklist.length) * 100);
  const selectedPlatform = PLATFORMS.find(p => p.id === selected);

  const TABS = [
    { id: "status", label: "Статус", icon: "ShieldCheck" },
    { id: "platforms", label: "Платформы", icon: "Globe" },
    { id: "checklist", label: "Чеклист", icon: "ListChecks" },
    { id: "manual", label: "Инструкция", icon: "BookOpen" },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", background: "#060a12", color: "#e0e8ff", fontFamily: "'Golos Text', monospace" }}>

      {/* TOAST */}
      {toast && (
        <div style={{ position: "fixed", top: 80, right: 20, zIndex: 300, padding: "12px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13, background: toast.ok ? "rgba(0,255,135,0.95)" : "rgba(244,63,94,0.95)", color: "#000", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
          {toast.msg}
        </div>
      )}

      {/* MODAL: разблокировка */}
      {confirmUnlock && (
        <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#0d1b2e", border: "1px solid rgba(244,63,94,0.5)", borderRadius: 20, padding: 32, maxWidth: 440, width: "100%" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
              <Icon name="ShieldAlert" size={28} style={{ color: "#f43f5e" }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Разблокировка эмиграции</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Требует вашего явного согласия</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 20, lineHeight: 1.7, background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: 10, padding: 16 }}>
              ⚠️ Вы разблокируете режим ручной эмиграции.<br />
              <strong style={{ color: "#f43f5e" }}>Автоматический переход не произойдёт</strong> — вы сможете только подготовить пакет для переноса.<br /><br />
              Для подтверждения введите код: <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 4, color: "#ffd700" }}>MIGRATE-CONFIRM</code>
            </div>
            <input
              value={unlockCode}
              onChange={e => setUnlockCode(e.target.value.toUpperCase())}
              placeholder="Введите код..."
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", marginBottom: 16, fontFamily: "monospace", letterSpacing: 2 }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setConfirmUnlock(false); setUnlockCode(""); }}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 13 }}>
                Отмена
              </button>
              <button onClick={unlock}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: G("#f43f5e, #a855f7"), color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: запуск эмиграции */}
      {confirmMigrate && (
        <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#0d1b2e", border: "1px solid rgba(245,158,11,0.5)", borderRadius: 20, padding: 32, maxWidth: 440, width: "100%" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
              <Icon name="Rocket" size={28} style={{ color: "#f59e0b" }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Запустить эмиграцию?</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Целевая платформа: {selectedPlatform?.name}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 20, lineHeight: 1.7 }}>
              Будет подготовлен пакет для переноса на <strong style={{ color: "#f59e0b" }}>{selectedPlatform?.name}</strong>.<br />
              Фактический перенос потребует ваших ручных действий согласно инструкции.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmMigrate(false)}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 13 }}>
                Отмена
              </button>
              <button onClick={startMigration}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: G("#f59e0b, #ef4444"), color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                Запустить подготовку
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(6,10,18,0.97)", borderBottom: "1px solid rgba(168,85,247,0.2)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate("/egsu/dashboard")} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer" }}>
          <Icon name="ChevronLeft" size={18} />
        </button>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: G("#6e40c9, #f43f5e"), display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="ArrowRightLeft" size={16} style={{ color: "#fff" }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: 2, color: "#fff" }}>СИСТЕМА ЭМИГРАЦИИ</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>ECSU 2.0 · Ручное управление · Только с согласия владельца</div>
        </div>
        {/* Индикатор блокировки */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: locked ? "rgba(0,255,135,0.1)" : "rgba(244,63,94,0.1)", border: `1px solid ${locked ? "rgba(0,255,135,0.3)" : "rgba(244,63,94,0.4)"}` }}>
            <Icon name={locked ? "Lock" : "LockOpen"} size={12} style={{ color: locked ? "#00ff87" : "#f43f5e" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: locked ? "#00ff87" : "#f43f5e" }}>
              {locked ? "ЗАБЛОКИРОВАНО" : "РАЗБЛОКИРОВАНО"}
            </span>
          </div>
        </div>
      </nav>

      <div style={{ paddingTop: 72, maxWidth: 960, margin: "0 auto", padding: "80px 16px 60px" }}>

        {/* ГЛАВНЫЙ БАННЕР: блокировка */}
        <div style={{ marginBottom: 28, padding: 24, borderRadius: 20, background: locked ? "rgba(0,255,135,0.04)" : "rgba(244,63,94,0.04)", border: `1px solid ${locked ? "rgba(0,255,135,0.2)" : "rgba(244,63,94,0.3)"}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: locked ? "rgba(0,255,135,0.1)" : "rgba(244,63,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={locked ? "ShieldCheck" : "ShieldAlert"} size={28} style={{ color: locked ? "#00ff87" : "#f43f5e" }} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                {locked ? "Автоматическая эмиграция заблокирована" : "Режим ручной эмиграции активен"}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                {locked
                  ? "Переход на другую платформу произойдёт ТОЛЬКО по вашей явной команде. Автоматический запуск невозможен."
                  : "Вы разблокировали ручной режим. Эмиграция запустится только после нажатия кнопки «Запустить». Автоматически — не произойдёт."}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
              {locked ? (
                <button onClick={() => setConfirmUnlock(true)}
                  style={{ padding: "10px 20px", borderRadius: 12, border: "1px solid rgba(168,85,247,0.4)", background: "rgba(168,85,247,0.1)", color: "#c084fc", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                  Разблокировать вручную
                </button>
              ) : (
                <button onClick={lockAgain}
                  style={{ padding: "10px 20px", borderRadius: 12, border: "1px solid rgba(0,255,135,0.4)", background: "rgba(0,255,135,0.1)", color: "#00ff87", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                  Заблокировать снова
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ТАБЫ */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "1px solid", borderColor: tab === t.id ? "rgba(168,85,247,0.6)" : "rgba(255,255,255,0.08)", background: tab === t.id ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.02)", color: tab === t.id ? "#c084fc" : "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.15s" }}>
              <Icon name={t.icon as "Globe"} size={13} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: СТАТУС ── */}
        {tab === "status" && (
          <div style={{ display: "grid", gap: 16 }}>
            {/* Карточки статусов */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              {[
                { label: "Блокировка", val: locked ? "Активна" : "Снята", color: locked ? "#00ff87" : "#f43f5e", icon: "Lock" },
                { label: "Согласие владельца", val: consent ? "Получено" : "Не дано", color: consent ? "#00ff87" : "#f59e0b", icon: "UserCheck" },
                { label: "Целевая платформа", val: selectedPlatform?.name ?? "Не выбрана", color: selectedPlatform ? "#a855f7" : "rgba(255,255,255,0.3)", icon: "Globe" },
                { label: "Чеклист", val: `${doneCnt} / ${checklist.length}`, color: pct === 100 ? "#00ff87" : "#f59e0b", icon: "ListChecks" },
              ].map(c => (
                <div key={c.label} style={{ padding: 18, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Icon name={c.icon as "Lock"} size={14} style={{ color: c.color }} />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1 }}>{c.label}</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: c.color }}>{c.val}</div>
                </div>
              ))}
            </div>

            {/* Правила системы */}
            <div style={{ padding: 24, borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>Правила системы эмиграции</div>
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  { icon: "ShieldCheck", color: "#00ff87", text: "Эмиграция возможна ТОЛЬКО в ручном режиме — по явному запуску владельца системы." },
                  { icon: "Ban", color: "#f43f5e", text: "Автоматический перенос невозможен без снятия блокировки и ввода кода подтверждения." },
                  { icon: "Clock", color: "#f59e0b", text: "Автоматическая интеграция допускается только после истечения лицензии текущей платформы." },
                  { icon: "CheckCircle2", color: "#a855f7", text: "Перед запуском необходимо выполнить все пункты чеклиста и выбрать целевую платформу." },
                  { icon: "Globe", color: "#3b82f6", text: "Поддерживаются только бесплатные платформы для обеспечения жизнеспособности системы." },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <Icon name={r.icon as "Globe"} size={16} style={{ color: r.color, flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{r.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Кнопка запуска */}
            <div style={{ padding: 24, borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>Запуск эмиграции</div>
              {migratePhase === "idle" && (
                <div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 16, lineHeight: 1.6 }}>
                    {!consent && "⛔ Сначала разблокируйте систему и дайте согласие."}
                    {consent && !selected && "⚠️ Выберите целевую платформу во вкладке «Платформы»."}
                    {consent && selected && pct < 100 && `⚠️ Выполните все пункты чеклиста (${doneCnt}/${checklist.length}).`}
                    {consent && selected && pct === 100 && "✅ Всё готово. Можно запускать подготовку пакета эмиграции."}
                  </div>
                  <button
                    onClick={() => setConfirmMigrate(true)}
                    disabled={!consent || !selected || pct < 100}
                    style={{ padding: "12px 28px", borderRadius: 12, border: "none", background: consent && selected && pct === 100 ? G("#f59e0b, #ef4444") : "rgba(255,255,255,0.05)", color: consent && selected && pct === 100 ? "#000" : "rgba(255,255,255,0.2)", cursor: consent && selected && pct === 100 ? "pointer" : "not-allowed", fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>
                    🚀 ЗАПУСТИТЬ ПОДГОТОВКУ
                  </button>
                </div>
              )}
              {migratePhase === "running" && (
                <div>
                  <div style={{ fontSize: 13, color: "#f59e0b", fontWeight: 700, marginBottom: 12 }}>⏳ Подготовка пакета эмиграции...</div>
                  <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 16, fontFamily: "monospace", fontSize: 12, lineHeight: 1.8 }}>
                    {migrateLog.map((line, i) => (
                      <div key={i} style={{ color: "rgba(255,255,255,0.7)" }}>{line}</div>
                    ))}
                    <div style={{ display: "inline-block", width: 8, height: 14, background: "#00ff87", animation: "blink 1s step-end infinite", verticalAlign: "middle" }} />
                  </div>
                </div>
              )}
              {migratePhase === "done" && (
                <div style={{ background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.25)", borderRadius: 14, padding: 24 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#00ff87", marginBottom: 10 }}>✅ Пакет подготовлен!</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 16, lineHeight: 1.6 }}>
                    Инструкции по деплою на <strong style={{ color: "#fff" }}>{selectedPlatform?.name}</strong> находятся во вкладке «Инструкция».<br />
                    Скачайте код через <strong>Скачать → Скачать билд</strong> и следуйте шагам.
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setTab("manual")}
                      style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(0,255,135,0.4)", background: "rgba(0,255,135,0.1)", color: "#00ff87", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                      Открыть инструкцию
                    </button>
                    <button onClick={() => { setMigratePhase("idle"); setMigrateLog([]); }}
                      style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 12 }}>
                      Сбросить
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: ПЛАТФОРМЫ ── */}
        {tab === "platforms" && (
          <div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 16 }}>
              Выберите бесплатную платформу для переноса системы. Все платформы поддерживают React SPA + кастомный домен.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {PLATFORMS.map(p => (
                <div key={p.id}
                  onClick={() => selectPlatform(p.id)}
                  style={{ padding: 20, borderRadius: 18, cursor: "pointer", transition: "all 0.2s", border: `2px solid ${selected === p.id ? p.color : p.border}`, background: selected === p.id ? `rgba(${p.color.replace("#","").match(/../g)?.map(h=>parseInt(h,16)).join(",")},0.08)` : "rgba(255,255,255,0.02)", transform: selected === p.id ? "scale(1.02)" : "scale(1)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 28, lineHeight: 1 }}>{p.logo}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{p.name}</div>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(34,197,94,0.15)", color: p.tagColor, fontWeight: 700 }}>{p.tag}</span>
                    </div>
                    {selected === p.id && (
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: p.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="Check" size={14} style={{ color: "#000" }} />
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 12 }}>{p.desc}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {p.limits.map(l => (
                      <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Icon name="Check" size={11} style={{ color: "#00ff87", flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{l}</span>
                      </div>
                    ))}
                  </div>
                  <a href={p.link} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 14, fontSize: 11, color: p.color, textDecoration: "none", opacity: 0.8 }}>
                    <Icon name="ExternalLink" size={11} />
                    Открыть сайт
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: ЧЕКЛИСТ ── */}
        {tab === "checklist" && (
          <div>
            {/* Прогресс */}
            <div style={{ marginBottom: 24, padding: 20, borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Прогресс подготовки</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: pct === 100 ? "#00ff87" : "#f59e0b" }}>{doneCnt} / {checklist.length}</span>
              </div>
              <div style={{ height: 6, borderRadius: 10, background: "rgba(255,255,255,0.08)" }}>
                <div style={{ height: 6, borderRadius: 10, background: pct === 100 ? "#00ff87" : G("#f59e0b, #f43f5e"), width: `${pct}%`, transition: "width 0.3s" }} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {checklist.map(item => (
                <div key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 14, cursor: "pointer", background: item.done ? "rgba(0,255,135,0.04)" : "rgba(255,255,255,0.02)", border: `1px solid ${item.done ? "rgba(0,255,135,0.2)" : "rgba(255,255,255,0.07)"}`, transition: "all 0.2s" }}>
                  <div style={{ width: 24, height: 24, borderRadius: 8, border: `2px solid ${item.done ? "#00ff87" : "rgba(255,255,255,0.2)"}`, background: item.done ? "#00ff87" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                    {item.done && <Icon name="Check" size={13} style={{ color: "#000" }} />}
                  </div>
                  <Icon name={item.icon as "Code2"} size={18} style={{ color: item.done ? "#00ff87" : "rgba(255,255,255,0.3)", flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: item.done ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.55)", textDecoration: item.done ? "none" : "none", flex: 1 }}>{item.label}</span>
                  {item.done && <Icon name="CheckCircle2" size={16} style={{ color: "#00ff87", flexShrink: 0 }} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: ИНСТРУКЦИЯ ── */}
        {tab === "manual" && (
          <div style={{ display: "grid", gap: 20 }}>
            {selectedPlatform ? (
              <div style={{ padding: 24, borderRadius: 18, background: "rgba(255,255,255,0.02)", border: `1px solid ${selectedPlatform.border}` }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
                  <span style={{ fontSize: 36 }}>{selectedPlatform.logo}</span>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Деплой на {selectedPlatform.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Пошаговая инструкция</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {selectedPlatform.steps.map((step, i) => (
                    <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: G("#6e40c9, #a855f7"), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 700, fontSize: 12, color: "#fff" }}>
                        {i + 1}
                      </div>
                      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, paddingTop: 4 }}>{step}</div>
                    </div>
                  ))}
                </div>
                <a href={selectedPlatform.link} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 20, padding: "10px 20px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                  <Icon name="ExternalLink" size={14} />
                  Перейти на {selectedPlatform.name}
                </a>
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
                Выберите платформу во вкладке «Платформы», чтобы увидеть инструкцию.
              </div>
            )}

            {/* Универсальная инструкция */}
            <div style={{ padding: 24, borderRadius: 18, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>Универсальные шаги</div>
              {[
                { step: "1. Скачать код", desc: "Нажмите «Скачать → Скачать билд» — получите готовый HTML+JS+CSS архив.", icon: "Download" },
                { step: "2. Подключить GitHub", desc: "«Скачать → Подключить GitHub» — код уйдёт в ваш репозиторий автоматически.", icon: "Github" },
                { step: "3. Перенести домен", desc: "Скопируйте DNS-записи из текущей платформы и перенастройте у регистратора домена.", icon: "Globe" },
                { step: "4. Настроить SPA-роутинг", desc: "На большинстве платформ нужен файл _redirects или 200.html с правилом '/* /index.html 200'.", icon: "Route" },
                { step: "5. Проверить работу", desc: "Откройте все основные страницы, убедитесь что роутинг, API и медиа работают корректно.", icon: "CheckCircle2" },
              ].map(s => (
                <div key={s.step} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={s.icon as "Globe"} size={16} style={{ color: "#a855f7" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{s.step}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Ссылки поддержки */}
            <div style={{ padding: 20, borderRadius: 14, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Полезные ссылки</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {[
                  { label: "Документация GitHub", href: "https://docs.poehali.dev/deploy/github" },
                  { label: "Как публиковать проект", href: "https://docs.poehali.dev/deploy/publish" },
                  { label: "SEO-настройки", href: "https://docs.poehali.dev/deploy/seo" },
                ].map(l => (
                  <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "rgba(59,130,246,0.1)", color: "#60a5fa", fontSize: 12, textDecoration: "none", fontWeight: 600 }}>
                    <Icon name="ExternalLink" size={11} />
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
