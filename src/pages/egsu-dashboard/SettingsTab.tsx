import { useState } from "react";
import Icon from "@/components/ui/icon";

const LANGUAGES = [
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
];

const NOTIFICATIONS = [
  { id: "push", label: "Push-уведомления в браузере", icon: "Bell", enabled: true },
  { id: "email", label: "Email-уведомления", icon: "Mail", enabled: true },
  { id: "critical", label: "SMS при критических инцидентах", icon: "MessageSquare", enabled: false },
  { id: "ai", label: "Уведомления от ИИ-алгоритмов", icon: "Cpu", enabled: true },
  { id: "reports", label: "Готовые отчёты (еженедельно)", icon: "FileText", enabled: true },
];

const FEEDBACK_CATEGORIES = ["Ошибка интерфейса", "Неверные данные", "Предложение по функции", "Вопрос по лицензии", "Другое"];

export default function SettingsTab() {
  const [theme, setTheme] = useState<"dark" | "purple" | "midnight">("dark");
  const [lang, setLang] = useState("ru");
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [feedbackCat, setFeedbackCat] = useState(FEEDBACK_CATEGORIES[0]);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [accentColor, setAccentColor] = useState("#a855f7");

  function toggleNotif(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n));
  }

  function handleExport() {
    setExportDone(true);
    setTimeout(() => setExportDone(false), 2000);
  }

  function sendFeedback(e: React.FormEvent) {
    e.preventDefault();
    setFeedbackSent(true);
    setTimeout(() => { setFeedbackSent(false); setFeedbackText(""); }, 2000);
  }

  const THEMES = [
    { id: "dark", label: "Тёмная", preview: ["#060a12", "#a855f7", "#3b82f6"] },
    { id: "purple", label: "Фиолетовая", preview: ["#0d0520", "#c084fc", "#7c3aed"] },
    { id: "midnight", label: "Полуночная", preview: ["#050d1a", "#00ff87", "#0ea5e9"] },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-bold text-white uppercase">Настройки системы</h1>
        <p className="text-white/30 text-sm mt-0.5">Интерфейс · Язык · Уведомления · Экспорт · Обратная связь</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Тема */}
        <div className="p-5 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(168,85,247,0.15)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Palette" size={16} style={{ color: "#a855f7" }} />
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Тема интерфейса</h3>
          </div>
          <div className="space-y-2 mb-4">
            {THEMES.map(t => (
              <button key={t.id} onClick={() => setTheme(t.id as typeof theme)}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
                style={{
                  background: theme === t.id ? "rgba(168,85,247,0.1)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${theme === t.id ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.06)"}`,
                }}>
                <div className="flex gap-1">
                  {t.preview.map((c, i) => (
                    <div key={i} className="w-4 h-4 rounded-full" style={{ background: c }} />
                  ))}
                </div>
                <span className="text-white/70 text-sm">{t.label}</span>
                {theme === t.id && <Icon name="Check" size={13} className="ml-auto" style={{ color: "#a855f7" }} />}
              </button>
            ))}
          </div>
          <div>
            <div className="text-white/40 text-xs mb-2">Акцентный цвет</div>
            <div className="flex gap-2">
              {["#a855f7", "#3b82f6", "#00ff87", "#f43f5e", "#f59e0b", "#06b6d4"].map(c => (
                <button key={c} onClick={() => setAccentColor(c)}
                  className="w-7 h-7 rounded-full transition-all hover:scale-110"
                  style={{ background: c, boxShadow: accentColor === c ? `0 0 10px ${c}` : "none", border: accentColor === c ? `2px solid white` : "2px solid transparent" }} />
              ))}
            </div>
          </div>
        </div>

        {/* Язык */}
        <div className="p-5 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(59,130,246,0.15)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Globe" size={16} style={{ color: "#3b82f6" }} />
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Язык интерфейса</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)}
                className="flex items-center gap-2 p-2.5 rounded-xl transition-all"
                style={{
                  background: lang === l.code ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${lang === l.code ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.06)"}`,
                }}>
                <span className="text-base">{l.flag}</span>
                <span className="text-sm" style={{ color: lang === l.code ? "#3b82f6" : "rgba(255,255,255,0.5)" }}>{l.label}</span>
                {lang === l.code && <Icon name="Check" size={12} className="ml-auto" style={{ color: "#3b82f6" }} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Уведомления */}
      <div className="p-5 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(245,158,11,0.12)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Bell" size={16} style={{ color: "#f59e0b" }} />
          <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Система уведомлений</h3>
        </div>
        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n.id} className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${n.enabled ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.05)"}` }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: n.enabled ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.04)" }}>
                  <Icon name={n.icon as "Bell"} size={15} style={{ color: n.enabled ? "#f59e0b" : "rgba(255,255,255,0.2)" }} />
                </div>
                <span className="text-sm" style={{ color: n.enabled ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.3)" }}>{n.label}</span>
              </div>
              <button onClick={() => toggleNotif(n.id)}
                className="w-10 h-5 rounded-full relative transition-all shrink-0"
                style={{ background: n.enabled ? "#f59e0b" : "rgba(255,255,255,0.1)" }}>
                <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow"
                  style={{ left: n.enabled ? "calc(100% - 18px)" : "2px" }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Экспорт / Импорт настроек */}
      <div className="p-5 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,255,135,0.1)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Download" size={16} style={{ color: "#00ff87" }} />
          <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Экспорт / Импорт настроек</h3>
        </div>
        <p className="text-white/40 text-xs mb-4">Сохраните профиль пользователя (тема, язык, уведомления, роли) в файл или восстановите из резервной копии.</p>
        <div className="flex gap-3 flex-wrap">
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{ background: exportDone ? "rgba(0,255,135,0.15)" : "rgba(0,255,135,0.08)", color: exportDone ? "#00ff87" : "#00ff87", border: "1px solid rgba(0,255,135,0.2)" }}>
            <Icon name={exportDone ? "Check" : "Download"} size={14} />
            {exportDone ? "Скачан settings.json" : "Экспортировать настройки"}
          </button>
          <label className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all hover:scale-105"
            style={{ background: "rgba(59,130,246,0.08)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}>
            <Icon name="Upload" size={14} />
            Импортировать из файла
            <input type="file" className="hidden" accept=".json" />
          </label>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{ background: "rgba(244,63,94,0.08)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.2)" }}>
            <Icon name="RotateCcw" size={14} />
            Сбросить на по умолчанию
          </button>
        </div>
      </div>

      {/* Справка */}
      <div className="p-5 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(168,85,247,0.1)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Icon name="BookOpen" size={16} style={{ color: "#a855f7" }} />
          <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Справка и подсказки</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {[
            { title: "Документация ЕЦСУ 2.0", desc: "Полное руководство по системе, API и модулям", icon: "FileText", color: "#a855f7" },
            { title: "Видеоинструкции", desc: "Обучающие видео по основным сценариям работы", icon: "Play", color: "#3b82f6" },
            { title: "Чат-бот поддержки", desc: "Интерактивные ответы на частые вопросы 24/7", icon: "Bot", color: "#00ff87" },
          ].map(h => (
            <button key={h.title} className="p-4 rounded-xl text-left transition-all hover:scale-[1.02]"
              style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${h.color}20` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                style={{ background: `${h.color}15` }}>
                <Icon name={h.icon as "FileText"} size={15} style={{ color: h.color }} />
              </div>
              <div className="text-white font-medium text-sm">{h.title}</div>
              <div className="text-white/30 text-xs mt-1">{h.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Обратная связь */}
      <div className="p-5 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(59,130,246,0.12)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Icon name="MessageCircle" size={16} style={{ color: "#3b82f6" }} />
          <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Обратная связь</h3>
        </div>
        <form onSubmit={sendFeedback} className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {FEEDBACK_CATEGORIES.map(cat => (
              <button type="button" key={cat} onClick={() => setFeedbackCat(cat)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: feedbackCat === cat ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)",
                  color: feedbackCat === cat ? "#3b82f6" : "rgba(255,255,255,0.35)",
                  border: `1px solid ${feedbackCat === cat ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.07)"}`,
                }}>
                {cat}
              </button>
            ))}
          </div>
          <textarea
            value={feedbackText}
            onChange={e => setFeedbackText(e.target.value)}
            placeholder="Опишите проблему или предложение подробно..."
            rows={4}
            className="w-full rounded-xl text-sm resize-none text-white/70 placeholder-white/20"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(59,130,246,0.15)", padding: "10px 12px", outline: "none" }}
          />
          <button type="submit"
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{
              background: feedbackSent ? "rgba(0,255,135,0.15)" : "linear-gradient(135deg, #3b82f6, #a855f7)",
              color: feedbackSent ? "#00ff87" : "white",
            }}>
            {feedbackSent ? "✓ Сообщение отправлено!" : "Отправить сообщение разработчикам"}
          </button>
        </form>
      </div>
    </div>
  );
}
