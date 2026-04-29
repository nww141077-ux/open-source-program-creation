/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const DALAN_API = "https://functions.poehali.dev/daefa87e-0693-4de5-9191-bbc918e1d241";

const EMAIL_API = "https://functions.poehali.dev/60627924-ce4d-4f89-a2dd-5addbe419732";

const TABS = [
  { id: "overview", label: "Обзор", icon: "Cpu" },
  { id: "chat", label: "Диалог", icon: "MessageCircle" },
  { id: "bios", label: "BIOS", icon: "HardDrive" },
  { id: "bot", label: "Бот Алиса+MAX", icon: "BotMessageSquare" },
  { id: "files", label: "Состав кейса", icon: "FolderOpen" },
  { id: "integration", label: "Интеграция", icon: "GitMerge" },
  { id: "alice", label: "ИИ Алиса", icon: "Brain" },
  { id: "cluster", label: "Кластер ЕЦСУ", icon: "Network" },
  { id: "send", label: "Отправить", icon: "Send" },
  { id: "results", label: "Результаты", icon: "BarChart2" },
  { id: "contacts", label: "Контакты", icon: "User" },
  { id: "earth", label: "Земля и стратегия", icon: "Globe" },
];

const QUICK_PROMPTS = [
  "Что такое ЕЦСУ и чем ты управляешь?",
  "Расскажи о себе — кто такой Далан-1?",
  "Как оптимизировать энергопотребление BIOS?",
  "Объясни архитектуру кластера ЕЦСУ",
  "Как интегрировать бота с Яндекс Алисой?",
  "Помоги написать конфигурацию cluster_config.json",
];

const BOT_FILES = [
  {
    name: "configs/yandex.json",
    icon: "FileJson",
    color: "#f59e0b",
    desc: "Настройки Яндекс Алисы: webhook_url, oauth_token, skill_id",
    code: `{
  "webhook_url": "https://your-server.com/yandex",
  "oauth_token": "YOUR_OAUTH_TOKEN",
  "skill_id": "YOUR_SKILL_ID"
}`,
  },
  {
    name: "configs/max.json",
    icon: "FileJson",
    color: "#3b82f6",
    desc: "Настройки платформы MAX: bot_token, api_url, webhook_url",
    code: `{
  "bot_token": "YOUR_MAX_TOKEN",
  "api_url": "https://api.max.ru",
  "webhook_url": "https://your-server.com/max"
}`,
  },
  {
    name: "adapters/adapter_yandex.js",
    icon: "Code",
    color: "#a855f7",
    desc: "Адаптер Яндекс Диалоги: formatRequest / formatResponse",
    code: `class YandexAdapter {
  formatRequest(msg) {
    return { user_input: msg.request.command };
  }
  formatResponse(response) {
    return {
      response: { text: response.text, tts: response.tts }
    };
  }
}`,
  },
  {
    name: "adapters/adapter_max.js",
    icon: "Code",
    color: "#22c55e",
    desc: "Адаптер MAX: formatRequest / formatResponse",
    code: `class MaxAdapter {
  formatRequest(msg) {
    return { user_input: msg.text };
  }
  formatResponse(response) {
    return { text: response.text };
  }
}`,
  },
  {
    name: "logic/dialogs.json",
    icon: "MessageSquare",
    color: "#06b6d4",
    desc: "Сценарии диалогов: приветствия и прощания для обеих платформ",
    code: `{
  "greetings": {
    "yandex": "Здравствуйте! Чем могу помочь?",
    "max": "Привет! Чем могу помочь?"
  },
  "farewells": {
    "yandex": "До свидания!",
    "max": "Пока!"
  }
}`,
  },
  {
    name: "platform_selector.js",
    icon: "GitBranch",
    color: "#f43f5e",
    desc: "Выбор активного адаптера по платформе: yandex / max",
    code: `const adapters = {
  yandex: new YandexAdapter(),
  max: new MaxAdapter()
};
function getAdapter(platform) {
  return adapters[platform];
}
module.exports = { getAdapter };`,
  },
  {
    name: "webhook_handler.js",
    icon: "Webhook",
    color: "#818cf8",
    desc: "Обработчик входящих запросов: getAdapter → botLogic → ответ",
    code: `async function handleRequest(req, res) {
  const platform = req.body.platform;
  const adapter = getAdapter(platform);
  const internalMsg = adapter.formatRequest(req.body);
  const response = await botLogic.handleMessage(internalMsg);
  res.json(adapter.formatResponse(response));
}`,
  },
  {
    name: "server.js",
    icon: "Server",
    color: "#f59e0b",
    desc: "Express-сервер: POST /webhook → handleRequest, порт 3000",
    code: `const express = require('express');
const handleRequest = require('./webhook_handler');
const app = express();
app.use(express.json());
app.post('/webhook', handleRequest);
app.listen(3000, () => console.log('Бот слушает на порту 3000'));`,
  },
];

const BOT_STEPS = [
  { step: "01", title: "Клонировать репозиторий", code: "git clone [ссылка]" },
  { step: "02", title: "Установить зависимости", code: "npm install" },
  { step: "03", title: "Настроить токены", code: "# configs/yandex.json — oauth_token, skill_id\n# configs/max.json — bot_token" },
  { step: "04", title: "Запустить сервер", code: "node server.js" },
  { step: "05", title: "Подключить webhook", code: "# В консоли Яндекс Диалоги:\nhttps://your-server.com/yandex\n\n# В настройках MAX:\nhttps://your-server.com/max" },
];

const DEVICES = [
  {
    id: "pc-main",
    label: "ПК (pc-main)",
    type: "desktop",
    icon: "Monitor",
    status: "online",
    roles: ["База данных", "Вычисления", "Хранилище"],
    energyRate: 10,
    color: "#22c55e",
  },
  {
    id: "phone-1",
    label: "Смартфон 1 (phone-1)",
    type: "mobile",
    icon: "Smartphone",
    status: "online",
    roles: ["Кэш", "Обмен сообщениями"],
    energyRate: 5,
    color: "#3b82f6",
  },
  {
    id: "phone-2",
    label: "Смартфон 2 (phone-2)",
    type: "mobile",
    icon: "Smartphone",
    status: "online",
    roles: ["Кэш", "Резервное копирование"],
    energyRate: 5,
    color: "#a855f7",
  },
];

const CLUSTER_METRICS = [
  { label: "Функции", current: 23, max: 25, unit: "", color: "#f59e0b", warn: true },
  { label: "Вычислительное время", current: 0.3, max: 250, unit: " ч", color: "#22c55e", warn: false },
  { label: "Энергия", current: 97, max: 100, unit: "%", color: "#ef4444", warn: false },
];

const API_ENDPOINTS = [
  { method: "GET", path: "/api/status", desc: "Текущий статус кластера ЕЦСУ" },
  { method: "POST", path: "/api/tasks", desc: "Управление задачами устройств" },
  { method: "POST", path: "/api/email", desc: "Отправка уведомлений на email" },
  { method: "GET", path: "/api/devices", desc: "Список устройств и их состояние" },
  { method: "POST", path: "/api/sync", desc: "Принудительная синхронизация" },
  { method: "GET", path: "/api/backup", desc: "Запуск резервного копирования" },
];

const EMAIL_TEMPLATES = [
  { icon: "Plug", title: "Новое устройство подключено", desc: "Уведомление при появлении нового узла в кластере" },
  { icon: "AlertTriangle", title: "Достигнут лимит функций", desc: "Предупреждение при использовании 23/25 функций" },
  { icon: "HardDrive", title: "Резервное копирование завершено", desc: "Ежедневный отчёт в 02:00 о бэкапе" },
  { icon: "WifiOff", title: "Устройство офлайн", desc: "Срочное уведомление при потере связи с узлом" },
  { icon: "Zap", title: "Низкий уровень энергии", desc: "Предупреждение при достижении критического уровня" },
];

const CLUSTER_STAGES = [
  { num: "01", title: "Веб-интерфейс ЕЦСУ", icon: "Layout", items: ["Дизайн панели управления с дашбордом", "Отображение статуса устройств кластера", "Визуализация метрик ресурсов в реальном времени"] },
  { num: "02", title: "API ЕЦСУ", icon: "Plug", items: ["Эндпоинты /api/status, /api/tasks, /api/email", "Интеграция с SMTP-сервером Яндекса", "Авторизация и безопасность запросов"] },
  { num: "03", title: "Email-синхронизация", icon: "Mail", items: ["Регистрация бота ecsu-bot@yandex.ru", "Генерация App Password в настройках Яндекс Почты", "Настройка шаблонов уведомлений"] },
  { num: "04", title: "Мобильные агенты", icon: "Smartphone", items: ["Развёртывание mobile_agent.js на смартфонах", "Тестирование отправки отчётов на email", "Настройка уведомлений при низкой энергии"] },
  { num: "05", title: "Тестирование", icon: "TestTube", items: ["Проверка доставки email (≤ 5 сек)", "Симуляция сбоев устройств", "Нагрузочное тестирование (100+ задач)"] },
];

const FILES = [
  { name: "README.md", desc: "Общая инструкция по проекту", icon: "FileText", size: "~4 КБ" },
  { name: "dalan1_core.c", desc: "Основной код ИИ-модуля", icon: "Code", size: "~8 КБ" },
  { name: "dalan1_core.h", desc: "Заголовочный файл, прототипы функций", icon: "Code2", size: "~2 КБ" },
  { name: "dalan1_advanced.c", desc: "Продвинутая логика — адаптивное обучение, прогнозирование", icon: "BrainCircuit", size: "~5 КБ" },
  { name: "quantum_emulator.c", desc: "Эмуляция квантовых вычислений", icon: "Atom", size: "~3 КБ" },
  { name: "neuro_morphic.c", desc: "Нейроморфные вычисления", icon: "Network", size: "~4 КБ" },
  { name: "self_diagnostics.c", desc: "Самодиагностика и самовосстановление", icon: "ShieldCheck", size: "~3 КБ" },
  { name: "dalan1_model.tflite", desc: "Обученная модель ИИ (TFLite Micro)", icon: "Database", size: "< 5 КБ" },
  { name: "bios_integration.c", desc: "Код интеграции в BIOS/UEFI", icon: "Cpu", size: "~3 КБ" },
  { name: "autostart/setup_dalan1.sh", desc: "Скрипт установки модуля", icon: "Terminal", size: "~1 КБ" },
  { name: "autostart/autostart_dalan1.sh", desc: "Скрипт автозапуска при старте ОС", icon: "Play", size: "~1 КБ" },
  { name: "docs/energy_optimization_guide.md", desc: "Руководство по оптимизации энергопотребления", icon: "Zap", size: "~6 КБ" },
  { name: "docs/advanced_features_guide.md", desc: "Руководство по продвинутым функциям", icon: "BookOpen", size: "~5 КБ" },
  { name: "docs/ai_alice_integration.md", desc: "Документация по интеграции с ИИ Алиса", icon: "Link", size: "~4 КБ" },
];

const STEPS = [
  {
    step: "01",
    title: "Подготовка",
    icon: "Settings",
    items: [
      "Получите доступ к проекту coreboot или вашей прошивке BIOS",
      "Убедитесь, что есть поддержка TFLite Micro для инференса модели",
    ],
    code: null,
  },
  {
    step: "02",
    title: "Копирование файлов",
    icon: "Copy",
    items: ["Скопируйте все файлы кейса в директорию проекта BIOS"],
    code: "cp dalan_1_bios_ai/* /path/to/your/bios/project/",
  },
  {
    step: "03",
    title: "Включение модуля",
    icon: "ToggleRight",
    items: ["Откройте файл .config и добавьте строки конфигурации"],
    code: "CONFIG_DALAN1_AI=y\nCONFIG_DALAN1_ADVANCED=y",
  },
  {
    step: "04",
    title: "Сборка прошивки",
    icon: "Hammer",
    items: [
      "Перейдите в директорию проекта BIOS",
      "Соберите прошивку командой make",
      "Готовый образ: build/bios.rom",
    ],
    code: "make",
  },
  {
    step: "05",
    title: "Тестирование",
    icon: "TestTube",
    items: [
      "Эмуляция через QEMU (виртуальное тестирование)",
      "Реальное железо: запишите bios.rom программатором CH341A или TL866II+",
    ],
    code: "qemu-system-x86_64 -bios build/bios.rom",
  },
  {
    step: "06",
    title: "Проверка работы",
    icon: "CheckCircle",
    items: [
      "Убедитесь, что «Далан 1» вызывается после POST",
      "Проверьте логи: /var/log/dalan1.log, sensors.log, dalan1_diagnostics.log",
      "Сравните энергопотребление с модулем и без (ваттметр / powerstat)",
    ],
    code: null,
  },
  {
    step: "07",
    title: "Резервное копирование",
    icon: "HardDrive",
    items: ["Перед записью прошивки ОБЯЗАТЕЛЬНО сохраните оригинальный BIOS"],
    code: "flashrom -r backup.rom",
  },
];

const ALICE_ADVANTAGES = [
  {
    icon: "Zap",
    title: "Эффективность разработки",
    items: [
      "Сокращение времени разработки на 40 % за счёт автоматической генерации кода",
      "Минимизация ошибок — ИИ Алиса проверила синтаксис и логику",
      "85 % базового функционала сгенерировано автоматически",
    ],
  },
  {
    icon: "TrendingDown",
    title: "Оптимизация ресурсов",
    items: [
      "ИИ Алиса оптимизировала код под минимальное энергопотребление",
      "Уменьшен размер прошивки за счёт компактных алгоритмов",
      "Общий размер модуля < 20 КБ",
    ],
  },
  {
    icon: "RefreshCw",
    title: "Адаптивность",
    items: [
      "Модуль может дообучаться с помощью облачных сервисов Яндекса",
      "Поддержка обновлений моделей через ИИ Алиса",
      "Адаптивная частота вызовов — каждые 5 секунд",
    ],
  },
  {
    icon: "Shield",
    title: "Надёжность",
    items: [
      "ИИ Алиса протестировала модуль на виртуальных стендах",
      "Выявлены и устранены потенциальные уязвимости",
      "Самодиагностика и самовосстановление при сбоях",
    ],
  },
  {
    icon: "Layers",
    title: "Масштабируемость",
    items: [
      "Архитектура позволяет легко добавлять новые функции через ИИ Алиса",
      "Возможна интеграция с другими продуктами на базе Alice AI",
      "Три варианта установки: как ОС, модуль BIOS, приложение",
    ],
  },
];

const BIOS_FILES = [
  { name: "README.md", desc: "Краткая инструкция (5 минут на чтение)", icon: "FileText", size: "~2 КБ" },
  { name: "dalan1_core.c", desc: "Основной код ИИ-модуля (< 10 КБ), функции init/predict/apply", icon: "Code", size: "< 10 КБ" },
  { name: "dalan1_core.h", desc: "Заголовочный файл: struct power_state, struct sensor_data", icon: "Code2", size: "~1 КБ" },
  { name: "dalan1_model.tflite", desc: "Обученная модель ИИ: вход — температура/нагрузка/напряжение; выход — множитель CPU/вентиляторы", icon: "Database", size: "< 5 КБ" },
  { name: "bios_integration.c", desc: "Интеграция в POST: bios_dalan1_hook(), read_hardware_sensors(), write_msr_settings()", icon: "Cpu", size: "~3 КБ" },
  { name: "autostart/setup_dalan1.sh", desc: "Скрипт установки: копирует файлы, добавляет автозагрузку, настраивает права", icon: "Terminal", size: "~1 КБ" },
  { name: "autostart/autostart_dalan1.sh", desc: "Автозапуск dalan1_monitor в фоне, логирует в dalan1.log", icon: "Play", size: "~1 КБ" },
  { name: "docs/energy_optimization_guide.md", desc: "Руководство: температура ≤ 75°C, C-states/P-states, кривые вентиляторов", icon: "BookOpen", size: "~4 КБ" },
];

const BIOS_NOTES = [
  { icon: "HardDrive", color: "#f59e0b", title: "Резервное копирование", desc: "Перед записью прошивки ОБЯЗАТЕЛЬНО: flashrom -r backup.rom" },
  { icon: "Cpu", color: "#3b82f6", title: "Программатор", desc: "Для физической записи используйте CH341A или TL866II+" },
  { icon: "Timer", color: "#22c55e", title: "Вызовы модели", desc: "Каждые 5 секунд, вычисления только при изменении нагрузки > 10 %" },
  { icon: "Moon", color: "#a855f7", title: "Спящий режим", desc: "Автоматически при простое системы для экономии энергии" },
  { icon: "Scale", color: "#818cf8", title: "Размер модуля", desc: "Общий размер < 15 КБ (модель + код)" },
];

interface HemisphereData {
  left: string;
  right: string;
  island_triggered: boolean;
}

interface ChatMsg {
  role: "user" | "assistant";
  text: string;
  time: string;
  loading?: boolean;
  suggestions?: string[];
  hemispheres?: HemisphereData;
}

const getTime = () => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
};

export default function EgsuDalan1() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [emailType, setEmailType] = useState("bios_case");
  const [customSubject, setCustomSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [sendError, setSendError] = useState("");

  // ── ЧАТ ──────────────────────────────────────────────────────────────────
  const [showHemispheres, setShowHemispheres] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      text: "Здравствуй. Я — Далан-1, главный ИИ системы ЕЦСУ 2.0. Заместитель Николаева В.В. по управлению кластером. Готов к диалогу — задай любой вопрос.",
      time: getTime(),
      suggestions: ["Что такое ЕЦСУ?", "Расскажи о себе", "Статус кластера"],
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatHistory = useRef<{ role: string; text: string }[]>([]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendChat = async (text?: string) => {
    const msg = (text ?? chatInput).trim();
    if (!msg || chatLoading) return;
    setChatInput("");

    const userMsg: ChatMsg = { role: "user", text: msg, time: getTime() };
    const loadingMsg: ChatMsg = { role: "assistant", text: "", time: getTime(), loading: true };

    setChatMessages((prev) => [...prev, userMsg, loadingMsg]);
    setChatLoading(true);

    chatHistory.current.push({ role: "user", text: msg });

    try {
      const res = await fetch(DALAN_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          dalan1_mode: true,
          history: chatHistory.current.slice(-10).map(h => ({ role: h.role, content: h.text })),
          session_id: "dalan1_owner",
        }),
      });
      const data = await res.json();
      const reply: string = data.reply || data.response || data.text || "Нет ответа от системы.";
      const suggestions: string[] = data.suggestions || [];
      const hemispheres: HemisphereData | undefined = data.hemispheres;

      chatHistory.current.push({ role: "assistant", text: reply });

      setChatMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", text: reply, time: getTime(), suggestions, hemispheres },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", text: "Ошибка связи с Далан-1. Проверьте подключение к серверу ЕЦСУ.", time: getTime() },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const sendEmail = async () => {
    setSendStatus("sending");
    setSendError("");
    try {
      const res = await fetch(EMAIL_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: emailType,
          subject: customSubject,
          message: customMessage,
          sender_name: "Николаев Владимир Владимирович",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSendStatus("ok");
      } else {
        setSendStatus("error");
        setSendError(data.error || "Неизвестная ошибка");
      }
    } catch {
      setSendStatus("error");
      setSendError("Ошибка соединения с сервером");
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen" style={{ background: "#070c18", color: "white" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: "rgba(7,12,24,0.95)", borderColor: "rgba(99,102,241,0.2)", backdropFilter: "blur(12px)" }}
      >
        <button
          onClick={() => navigate("/egsu/dashboard")}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          <Icon name="ArrowLeft" size={15} />
          Назад
        </button>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
          >
            <Icon name="Cpu" size={14} className="text-white" />
          </div>
          <span className="font-semibold text-sm">ИИ-модуль «Далан 1»</span>
        </div>
        <div
          className="ml-auto text-xs px-2 py-1 rounded-full"
          style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}
        >
          v2.0 · 25.04.2026
        </div>
      </div>

      {/* Hero */}
      <div
        className="relative px-4 py-10 text-center overflow-hidden"
        style={{
          background: "linear-gradient(180deg, rgba(99,102,241,0.12) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(99,102,241,0.15)",
        }}
      >
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-10"
              style={{
                width: `${40 + i * 20}px`,
                height: `${40 + i * 20}px`,
                background: i % 2 === 0 ? "#6366f1" : "#a855f7",
                left: `${10 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                filter: "blur(20px)",
              }}
            />
          ))}
        </div>
        <div className="relative">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl"
            style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
          >
            <Icon name="Cpu" size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-1">ИИ-модуль «Далан 1»</h1>
          <p className="text-sm mb-2" style={{ color: "#818cf8" }}>
            Разработан на базе ИИ Алиса (Alice AI, Яндекс)
          </p>
          <p className="text-xs max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
            Интеллектуальная оптимизация энергопотребления в BIOS/UEFI с функциями адаптивного обучения и прогнозирования
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {[
              { label: "Снижение энергопотребления", value: "20–35 %", icon: "Zap" },
              { label: "Прирост производительности", value: "до 15 %", icon: "TrendingUp" },
              { label: "Время инициализации", value: "< 1,5 сек", icon: "Timer" },
              { label: "Размер кода", value: "< 20 КБ", icon: "HardDrive" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
              >
                <Icon name={s.icon as any} size={14} style={{ color: "#818cf8" }} />
                <div className="text-left">
                  <div className="text-xs font-bold text-white">{s.value}</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex overflow-x-auto gap-1 px-4 py-3 border-b"
        style={{ borderColor: "rgba(99,102,241,0.15)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
            style={{
              background: activeTab === tab.id ? "rgba(99,102,241,0.2)" : "transparent",
              color: activeTab === tab.id ? "#818cf8" : "rgba(255,255,255,0.4)",
              border: activeTab === tab.id ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
            }}
          >
            <Icon name={tab.icon as any} size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-2xl mx-auto">

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.2)" }}
            >
              <h2 className="font-bold mb-3 text-sm flex items-center gap-2">
                <Icon name="Target" size={15} style={{ color: "#818cf8" }} />
                Цель проекта
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                Интегрировать усовершенствованный ИИ-модуль «Далан 1» в BIOS/UEFI для интеллектуальной оптимизации
                энергопотребления с функциями адаптивного обучения и прогнозирования. Модуль разработан при поддержке
                ИИ Алиса (семейство моделей Alice AI от Яндекса).
              </p>
            </div>

            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.2)" }}
            >
              <h2 className="font-bold mb-3 text-sm flex items-center gap-2">
                <Icon name="List" size={15} style={{ color: "#818cf8" }} />
                Ключевые характеристики
              </h2>
              <div className="space-y-2">
                {[
                  ["Размер кода", "< 20 КБ (с улучшениями)"],
                  ["Время инициализации", "< 1,5 секунды"],
                  ["Частота вызовов ИИ", "каждые 5 секунд (адаптивно)"],
                  ["Снижение энергопотребления", "20–35 %"],
                  ["Повышение производительности", "до 15 % при пиковых нагрузках"],
                  ["Основа разработки", "семейство моделей Alice AI"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center text-xs py-1.5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>{k}</span>
                    <span className="font-medium text-white">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.2)" }}
            >
              <h2 className="font-bold mb-3 text-sm flex items-center gap-2">
                <Icon name="HardDrive" size={15} style={{ color: "#818cf8" }} />
                Три варианта установки
              </h2>
              {[
                { num: "01", title: "Как отдельная ОС", desc: "Через ISO-образ dalan1_os.iso с полной автономной работой", icon: "Monitor" },
                { num: "02", title: "Как модуль BIOS", desc: "Интеграция в прошивку coreboot/UEFI для работы на уровне системы", icon: "Cpu" },
                { num: "03", title: "Как приложение", desc: "Установка в существующую ОС с автозапуском через systemd", icon: "AppWindow" },
              ].map((v) => (
                <div key={v.num} className="flex items-start gap-3 py-2.5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}
                  >
                    {v.num}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{v.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{v.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.25)" }}
            >
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                ⚠️ Перед записью прошивки BIOS всегда сохраняйте оригинальный образ:
              </p>
              <code className="block mt-2 text-xs font-mono" style={{ color: "#a5b4fc" }}>
                flashrom -r backup.rom
              </code>
            </div>
          </div>
        )}

        {/* FILES */}
        {activeTab === "files" && (
          <div className="space-y-3">
            <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
              Архив: <span style={{ color: "#818cf8" }}>dalan1_full_package_20260425.tar.gz</span>
            </p>
            {FILES.map((f) => (
              <div
                key={f.name}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(99,102,241,0.12)" }}
                >
                  <Icon name={f.icon as any} size={16} style={{ color: "#818cf8" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-medium text-white truncate">{f.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{f.desc}</div>
                </div>
                <div className="text-xs flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>{f.size}</div>
              </div>
            ))}
            <div
              className="mt-4 p-3 rounded-xl text-xs"
              style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}
            >
              <div className="font-medium mb-1" style={{ color: "#818cf8" }}>Создать архив:</div>
              <code className="font-mono" style={{ color: "rgba(255,255,255,0.6)" }}>
                tar -czvf dalan1_full_package_20260425.tar.gz dalan_1_full_package/
              </code>
            </div>
          </div>
        )}

        {/* INTEGRATION */}
        {activeTab === "integration" && (
          <div className="space-y-3">
            {STEPS.map((s) => (
              <div
                key={s.step}
                className="p-4 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
                  >
                    <Icon name={s.icon as any} size={14} className="text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Шаг {s.step}</div>
                    <div className="text-sm font-semibold" style={{ color: "#a5b4fc" }}>{s.title}</div>
                  </div>
                </div>
                <ul className="space-y-1 mb-3">
                  {s.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                      <span style={{ color: "#6366f1", flexShrink: 0 }}>›</span>
                      {item}
                    </li>
                  ))}
                </ul>
                {s.code && (
                  <div
                    className="relative rounded-lg p-3 font-mono text-xs"
                    style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(99,102,241,0.2)" }}
                  >
                    <pre style={{ color: "#a5b4fc", whiteSpace: "pre-wrap" }}>{s.code}</pre>
                    <button
                      onClick={() => copyCode(s.code!, s.step)}
                      className="absolute top-2 right-2 p-1.5 rounded-md transition-colors"
                      style={{
                        background: copiedCode === s.step ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.05)",
                        color: copiedCode === s.step ? "#818cf8" : "rgba(255,255,255,0.3)",
                      }}
                    >
                      <Icon name={copiedCode === s.step ? "Check" : "Copy"} size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ALICE */}
        {activeTab === "alice" && (
          <div className="space-y-4">
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)" }}
            >
              <h2 className="font-bold text-sm mb-2 flex items-center gap-2">
                <Icon name="Brain" size={15} style={{ color: "#818cf8" }} />
                Технологическая основа: ИИ Алиса
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                Модуль «Далан 1» разработан с использованием возможностей ИИ Алиса (семейство моделей Alice AI от
                Яндекса). ИИ Алиса участвовала в генерации кода, оптимизации алгоритмов, тестировании, документации и
                отладке.
              </p>
              <div
                className="mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }}
              >
                <Icon name="Percent" size={12} />
                <span>85 % базового функционала сгенерировано ИИ Алиса</span>
              </div>
            </div>

            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}
            >
              <h2 className="font-bold text-sm mb-3">Роль ИИ Алиса в разработке:</h2>
              {[
                { icon: "Code", title: "Генерация кода", desc: "Большая часть C-кода сгенерирована ИИ Алиса с оптимизацией под встраиваемые системы" },
                { icon: "Settings", title: "Оптимизация алгоритмов", desc: "ИИ Алиса проанализировала и улучшила алгоритмы управления энергопотреблением" },
                { icon: "TestTube", title: "Тестирование", desc: "ИИ Алиса провела виртуальное тестирование на различных конфигурациях оборудования" },
                { icon: "FileText", title: "Документация", desc: "Все руководства и инструкции сгенерированы и структурированы с помощью ИИ Алиса" },
                { icon: "Bug", title: "Отладка", desc: "ИИ Алиса выявила и исправила потенциальные ошибки в логике работы модуля" },
              ].map((r) => (
                <div key={r.title} className="flex items-start gap-3 py-2.5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(99,102,241,0.15)" }}
                  >
                    <Icon name={r.icon as any} size={13} style={{ color: "#818cf8" }} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{r.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}
            >
              <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Icon name="Cloud" size={15} style={{ color: "#818cf8" }} />
                Облачная интеграция с ИИ Алиса
              </h2>
              <div className="space-y-2 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                {[
                  "Зарегистрируйте устройство в облаке Яндекса",
                  "Получите API-ключ на alice.yandex.ru/api",
                  "Добавьте ключ в конфигурацию: DALAN1_CLOUD_KEY=\"ваш_ключ\"",
                  "Активируйте синхронизацию: ./setup_dalan1.sh --cloud-sync",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}
                    >
                      {i + 1}
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {ALICE_ADVANTAGES.map((a) => (
              <div
                key={a.title}
                className="p-4 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon name={a.icon as any} size={14} style={{ color: "#818cf8" }} />
                  <span className="text-sm font-semibold text-white">{a.title}</span>
                </div>
                <ul className="space-y-1">
                  {a.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                      <span style={{ color: "#6366f1", flexShrink: 0 }}>·</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* CLUSTER */}
        {activeTab === "cluster" && (
          <div className="space-y-4">

            {/* Header info */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)" }}
            >
              <h2 className="font-bold text-sm mb-2 flex items-center gap-2">
                <Icon name="Network" size={15} style={{ color: "#818cf8" }} />
                ЕЦСУ — Локальный облачный кластер
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                Три устройства объединены в единый кластер с синхронизацией через email{" "}
                <span style={{ color: "#a5b4fc" }}>nikolaevvladimir77@yandex.ru</span>.
                ПК выступает мастер-узлом, смартфоны — кэш и резервное копирование.
              </p>
            </div>

            {/* Devices */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}
            >
              <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Icon name="Server" size={14} style={{ color: "#818cf8" }} />
                Устройства кластера
              </h2>
              <div className="space-y-3">
                {DEVICES.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 rounded-xl"
                    style={{ background: "rgba(0,0,0,0.2)", border: `1px solid ${d.color}22` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: `${d.color}18` }}
                        >
                          <Icon name={d.icon as any} size={15} style={{ color: d.color }} />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">{d.label}</div>
                          <div className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>{d.id}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
                        <span className="text-xs" style={{ color: d.color }}>онлайн</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {d.roles.map((r) => (
                        <span
                          key={r}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: `${d.color}15`, color: d.color }}
                        >
                          {r}
                        </span>
                      ))}
                      <span className="text-xs px-2 py-0.5 rounded-full ml-auto"
                        style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
                        {d.energyRate} Вт/ч
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}
            >
              <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Icon name="BarChart2" size={14} style={{ color: "#818cf8" }} />
                Метрики кластера
              </h2>
              <div className="space-y-4">
                {CLUSTER_METRICS.map((m) => {
                  const pct = Math.round((m.current / m.max) * 100);
                  return (
                    <div key={m.label}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                          {m.warn && <Icon name="AlertTriangle" size={11} style={{ color: "#f59e0b" }} />}
                          {m.label}
                        </div>
                        <span className="text-xs font-bold text-white">
                          {m.current}{m.unit} / {m.max}{m.unit}
                        </span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${pct}%`, background: m.color }}
                        />
                      </div>
                      <div className="text-right text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* cluster_config.json */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm flex items-center gap-2">
                  <Icon name="FileJson" size={14} style={{ color: "#818cf8" }} />
                  cluster_config.json
                </h2>
                <button
                  onClick={() => copyCode(`{
  "system_name": "Единая Центральная Система Управления",
  "version": "1.0",
  "sync_email": "nikolaevvladimir77@yandex.ru",
  "master_device": "pc-main",
  "devices": [
    {"id": "pc-main", "type": "desktop", "roles": ["database","compute","storage"], "energy_rate": 10},
    {"id": "phone-1", "type": "mobile", "roles": ["cache","messaging"], "energy_rate": 5},
    {"id": "phone-2", "type": "mobile", "roles": ["cache","backup"], "energy_rate": 5}
  ],
  "limits": {
    "max_functions": 25, "current_functions": 23,
    "max_compute_time": 250.0, "used_compute_time": 0.3,
    "energy_budget": 100, "current_energy": -3
  }
}`, "config")}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
                  style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8" }}
                >
                  <Icon name={copiedCode === "config" ? "Check" : "Copy"} size={11} />
                  {copiedCode === "config" ? "Скопировано" : "Копировать"}
                </button>
              </div>
              <div
                className="rounded-lg p-3 font-mono text-xs overflow-x-auto"
                style={{ background: "rgba(0,0,0,0.4)", color: "#a5b4fc" }}
              >
                <pre>{`{
  "system_name": "Единая Центральная Система Управления",
  "version": "1.0",
  "sync_email": "nikolaevvladimir77@yandex.ru",
  "master_device": "pc-main",
  "limits": {
    "max_functions": 25,
    "current_functions": 23,
    "energy_budget": 100,
    "current_energy": -3
  }
}`}</pre>
              </div>
            </div>

            {/* API endpoints */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}
            >
              <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Icon name="Plug" size={14} style={{ color: "#818cf8" }} />
                API эндпоинты ЕЦСУ
              </h2>
              <div className="space-y-2">
                {API_ENDPOINTS.map((e) => (
                  <div key={e.path} className="flex items-center gap-2 py-2"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded flex-shrink-0"
                      style={{
                        background: e.method === "GET" ? "rgba(34,197,94,0.15)" : "rgba(59,130,246,0.15)",
                        color: e.method === "GET" ? "#22c55e" : "#3b82f6",
                      }}
                    >
                      {e.method}
                    </span>
                    <code className="text-xs font-mono flex-shrink-0" style={{ color: "#a5b4fc" }}>{e.path}</code>
                    <span className="text-xs ml-auto text-right" style={{ color: "rgba(255,255,255,0.4)" }}>{e.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Email templates */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}
            >
              <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Icon name="Mail" size={14} style={{ color: "#818cf8" }} />
                Шаблоны email-уведомлений
              </h2>
              {EMAIL_TEMPLATES.map((t) => (
                <div key={t.title} className="flex items-start gap-3 py-2.5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(99,102,241,0.12)" }}
                  >
                    <Icon name={t.icon as any} size={13} style={{ color: "#818cf8" }} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{t.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stages */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}
            >
              <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Icon name="GitBranch" size={14} style={{ color: "#818cf8" }} />
                Этапы разработки
              </h2>
              {CLUSTER_STAGES.map((s) => (
                <div key={s.num} className="flex items-start gap-3 py-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
                  >
                    <Icon name={s.icon as any} size={13} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Этап {s.num}</span>
                      <span className="text-sm font-semibold" style={{ color: "#a5b4fc" }}>{s.title}</span>
                    </div>
                    <ul className="space-y-0.5">
                      {s.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                          <span style={{ color: "#6366f1", flexShrink: 0 }}>›</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Acceptance criteria */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}
            >
              <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Icon name="ClipboardCheck" size={14} style={{ color: "#818cf8" }} />
                Критерии приёмки
              </h2>
              {[
                { param: "Доставка email", req: "≤ 5 секунд" },
                { param: "Время отклика интерфейса", req: "≤ 1 секунды" },
                { param: "Доступность кластера", req: "≥ 99 %" },
                { param: "Точность отчётов", req: "100 %" },
                { param: "Резервное копирование", req: "ежедневно в 02:00" },
                { param: "Сроки разработки", req: "2–3 недели" },
              ].map((c) => (
                <div key={c.param} className="flex justify-between items-center py-2 text-xs"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>{c.param}</span>
                  <span className="font-semibold" style={{ color: "#22c55e" }}>{c.req}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CHAT */}
        {activeTab === "chat" && (
          <div className="flex flex-col" style={{ height: "calc(100vh - 220px)", minHeight: 400 }}>

            {/* Статус режима Далан-1 */}
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: "#00ff87", boxShadow: "0 0 6px #00ff87" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Режим Далан-1 · Два полушария активны</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: "rgba(59,130,246,0.15)" }}>
                  <Icon name="AlignLeft" size={9} style={{ color: "#3b82f6" }} />
                </div>
                <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: "rgba(168,85,247,0.15)" }}>
                  <Icon name="AlignRight" size={9} style={{ color: "#a855f7" }} />
                </div>
                <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: "rgba(0,255,135,0.1)" }}>
                  <Icon name="Merge" size={9} style={{ color: "#00ff87" }} />
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 pb-2" style={{ scrollbarWidth: "none" }}>

              {/* Quick prompts — показываем только если одно приветствие */}
              {chatMessages.length === 1 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold px-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Быстрые вопросы:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_PROMPTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => sendChat(p)}
                        className="text-xs px-3 py-1.5 rounded-full transition-all hover:scale-[1.02]"
                        style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.25)" }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                  {m.role === "assistant" && (
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "linear-gradient(135deg, #22c864, #6366f1)" }}
                    >
                      <Icon name="Cpu" size={14} className="text-white" />
                    </div>
                  )}
                  <div className="max-w-[85%] space-y-1.5">
                    <div
                      className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                      style={
                        m.role === "user"
                          ? { background: "linear-gradient(135deg, #6366f1, #a855f7)", color: "white", borderBottomRightRadius: 6 }
                          : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(99,102,241,0.15)", borderBottomLeftRadius: 6 }
                      }
                    >
                      {m.loading ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {[0,1,2].map((j) => (
                                <div key={j} className="w-1.5 h-1.5 rounded-full"
                                  style={{ background: "#818cf8", animation: `bounce 1.2s ${j * 0.2}s infinite` }} />
                              ))}
                            </div>
                            <span className="text-xs" style={{ color: "#818cf8" }}>Далан-1 обрабатывает...</span>
                          </div>
                          <div className="flex gap-1.5">
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>◑ Левое думает...</span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7" }}>◐ Правое думает...</span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                      )}
                    </div>
                    <div className="text-xs px-1" style={{ color: "rgba(255,255,255,0.25)" }}>{m.time}</div>

                    {/* Кнопка полушарий — только для владельца */}
                    {m.hemispheres && m.role === "assistant" && (
                      <div className="mt-1">
                        <button
                          onClick={() => setShowHemispheres(showHemispheres === i ? null : i)}
                          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-all"
                          style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.2)" }}
                        >
                          <Icon name="BrainCircuit" size={11} />
                          {showHemispheres === i ? "Скрыть анализ полушарий" : "Показать работу Далан-1"}
                        </button>
                        {showHemispheres === i && (
                          <div className="mt-2 space-y-2">
                            {/* Левое полушарие */}
                            <div className="rounded-xl p-3" style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)" }}>
                              <div className="flex items-center gap-2 mb-1.5">
                                <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "rgba(59,130,246,0.15)" }}>
                                  <Icon name="AlignLeft" size={10} style={{ color: "#3b82f6" }} />
                                </div>
                                <span className="text-xs font-bold" style={{ color: "#3b82f6" }}>Левое полушарие — Логика</span>
                              </div>
                              <div className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)", whiteSpace: "pre-wrap" }}>
                                {m.hemispheres.left}
                              </div>
                            </div>
                            {/* Правое полушарие */}
                            <div className="rounded-xl p-3" style={{ background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.2)" }}>
                              <div className="flex items-center gap-2 mb-1.5">
                                <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "rgba(168,85,247,0.15)" }}>
                                  <Icon name="AlignRight" size={10} style={{ color: "#a855f7" }} />
                                </div>
                                <span className="text-xs font-bold" style={{ color: "#a855f7" }}>Правое полушарие — Смыслы</span>
                              </div>
                              <div className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)", whiteSpace: "pre-wrap" }}>
                                {m.hemispheres.right}
                              </div>
                            </div>
                            {/* Островная часть */}
                            <div className="rounded-xl px-3 py-2 flex items-center gap-2" style={{ background: "rgba(0,255,135,0.05)", border: "1px solid rgba(0,255,135,0.15)" }}>
                              <Icon name="Merge" size={11} style={{ color: "#00ff87" }} />
                              <span className="text-xs" style={{ color: "#00ff87" }}>Островная часть: синтез выполнен → финальный ответ сформирован</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Suggestions */}
                    {m.suggestions && m.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {m.suggestions.map((s) => (
                          <button
                            key={s}
                            onClick={() => sendChat(s)}
                            className="text-xs px-2.5 py-1 rounded-full transition-all hover:scale-[1.02]"
                            style={{ background: "rgba(34,200,100,0.1)", color: "#22c864", border: "1px solid rgba(34,200,100,0.2)" }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {m.role === "user" && (
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "rgba(99,102,241,0.2)" }}
                    >
                      <Icon name="User" size={14} style={{ color: "#818cf8" }} />
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div
              className="mt-3 flex gap-2 items-end p-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.2)" }}
            >
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                placeholder="Сообщение Далан-1... (Enter — отправить)"
                rows={1}
                disabled={chatLoading}
                className="flex-1 bg-transparent text-sm text-white outline-none resize-none"
                style={{ color: "white", lineHeight: "1.5", maxHeight: 120 }}
              />
              <button
                onClick={() => sendChat()}
                disabled={chatLoading || !chatInput.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: chatLoading || !chatInput.trim() ? "rgba(99,102,241,0.2)" : "linear-gradient(135deg, #6366f1, #a855f7)",
                  color: chatLoading || !chatInput.trim() ? "rgba(255,255,255,0.3)" : "white",
                }}
              >
                <Icon name="Send" size={15} />
              </button>
            </div>

            <p className="text-center text-xs mt-2" style={{ color: "rgba(255,255,255,0.2)" }}>
              Далан-1 · ЕЦСУ 2.0 · Enter для отправки · Shift+Enter — новая строка
            </p>
          </div>
        )}

        {/* BOT ALICE+MAX */}
        {activeTab === "bot" && (
          <div className="space-y-4">

            {/* Header */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)" }}
            >
              <h2 className="font-bold text-sm mb-2 flex items-center gap-2">
                <Icon name="BotMessageSquare" size={15} style={{ color: "#818cf8" }} />
                Бот для Яндекс Алисы и MAX
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                Готовый кейс для конструктора: бот работает на двух платформах через единый код.
                Архив <span style={{ color: "#a5b4fc" }}>bot_constructor.zip</span> содержит все файлы и инструкцию.
              </p>
              <div className="flex gap-3 mt-3">
                {[
                  { label: "Яндекс Алиса", color: "#f59e0b" },
                  { label: "MAX", color: "#3b82f6" },
                  { label: "Express.js", color: "#22c55e" },
                ].map((b) => (
                  <span key={b.label} className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ background: `${b.color}18`, color: b.color }}>
                    {b.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Platform cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "Mic", color: "#f59e0b", title: "Яндекс Алиса", items: ["Яндекс Диалоги", "OAuth токен", "TTS / голос"] },
                { icon: "MessageCircle", color: "#3b82f6", title: "MAX", items: ["api.max.ru", "Bot Token", "Текстовые ответы"] },
              ].map((p) => (
                <div key={p.title} className="p-3 rounded-xl"
                  style={{ background: `${p.color}0d`, border: `1px solid ${p.color}30` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name={p.icon as any} size={14} style={{ color: p.color }} />
                    <span className="text-xs font-bold text-white">{p.title}</span>
                  </div>
                  {p.items.map((i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs py-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                      <span style={{ color: p.color }}>›</span>{i}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Files */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}
            >
              <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Icon name="FolderOpen" size={14} style={{ color: "#818cf8" }} />
                Структура bot_constructor/
              </h2>
              <div className="space-y-2">
                {BOT_FILES.map((f) => (
                  <div key={f.name} className="rounded-xl overflow-hidden"
                    style={{ border: `1px solid ${f.color}20` }}>
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer"
                      style={{ background: "rgba(0,0,0,0.25)" }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${f.color}18` }}>
                        <Icon name={f.icon as any} size={13} style={{ color: f.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono font-semibold" style={{ color: f.color }}>{f.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{f.desc}</div>
                      </div>
                      <button
                        onClick={() => copyCode(f.code, f.name)}
                        className="flex-shrink-0 p-1.5 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.05)", color: copiedCode === f.name ? f.color : "rgba(255,255,255,0.3)" }}
                      >
                        <Icon name={copiedCode === f.name ? "Check" : "Copy"} size={12} />
                      </button>
                    </div>
                    <div className="px-3 pb-3 pt-1">
                      <pre className="text-xs font-mono overflow-x-auto"
                        style={{ color: "rgba(255,255,255,0.5)", whiteSpace: "pre-wrap" }}>{f.code}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* package.json */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm flex items-center gap-2">
                  <Icon name="Package" size={14} style={{ color: "#818cf8" }} />
                  package.json
                </h2>
                <button onClick={() => copyCode(`{\n  "name": "multiplatform-bot",\n  "version": "1.0.0",\n  "dependencies": {\n    "express": "^4.18.2",\n    "dotenv": "^16.3.1"\n  }\n}`, "pkg")}
                  className="text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                  style={{ background: "rgba(99,102,241,0.12)", color: copiedCode === "pkg" ? "#22c55e" : "#818cf8" }}>
                  <Icon name={copiedCode === "pkg" ? "Check" : "Copy"} size={11} />
                  {copiedCode === "pkg" ? "Скопировано" : "Копировать"}
                </button>
              </div>
              <div className="rounded-lg p-3 font-mono text-xs"
                style={{ background: "rgba(0,0,0,0.4)", color: "#a5b4fc" }}>
                <pre>{`{
  "name": "multiplatform-bot",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.3.1"
  }
}`}</pre>
              </div>
            </div>

            {/* Steps */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}
            >
              <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Icon name="List" size={14} style={{ color: "#818cf8" }} />
                Инструкция по настройке
              </h2>
              {BOT_STEPS.map((s) => (
                <div key={s.step} className="py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>
                      {s.step}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: "#a5b4fc" }}>{s.title}</span>
                  </div>
                  <div className="relative rounded-lg p-3 font-mono text-xs"
                    style={{ background: "rgba(0,0,0,0.4)", color: "#a5b4fc" }}>
                    <pre style={{ whiteSpace: "pre-wrap" }}>{s.code}</pre>
                    <button
                      onClick={() => copyCode(s.code, `bot-step-${s.step}`)}
                      className="absolute top-2 right-2 p-1.5 rounded-md"
                      style={{ background: "rgba(255,255,255,0.05)", color: copiedCode === `bot-step-${s.step}` ? "#22c55e" : "rgba(255,255,255,0.3)" }}>
                      <Icon name={copiedCode === `bot-step-${s.step}` ? "Check" : "Copy"} size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Optional */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}
            >
              <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Icon name="Plus" size={14} style={{ color: "#818cf8" }} />
                Дополнительные файлы (опционально)
              </h2>
              {[
                { icon: "ScrollText", color: "#f59e0b", name: "logs.js", desc: "Логирование запросов и ответов бота" },
                { icon: "TestTube", color: "#22c55e", name: "tests/", desc: "Папка с юнит-тестами для логики бота" },
                { icon: "Container", color: "#3b82f6", name: "docker-compose.yml", desc: "Контейнеризация для продакшн-развёртывания" },
              ].map((f) => (
                <div key={f.name} className="flex items-center gap-3 py-2.5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${f.color}18` }}>
                    <Icon name={f.icon as any} size={13} style={{ color: f.color }} />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-semibold text-white">{f.name}</div>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Send button */}
            <button
              onClick={() => { setEmailType("custom"); setCustomSubject("Кейс бота Яндекс Алиса + MAX для конструктора"); setCustomMessage("Передаю кейс мультиплатформенного бота bot_constructor.zip для быстрой интеграции с Яндекс Алисой и MAX. Состав: configs/, adapters/, logic/, platform_selector.js, webhook_handler.js, server.js, package.json, README.md."); setActiveTab("send"); }}
              className="w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              style={{ background: "linear-gradient(135deg, #f59e0b, #3b82f6)", color: "white" }}
            >
              <Icon name="Send" size={16} />
              Отправить кейс конструктору на email
            </button>
          </div>
        )}

        {/* BIOS */}
        {activeTab === "bios" && (
          <div className="space-y-4">
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)" }}
            >
              <h2 className="font-bold text-sm mb-2 flex items-center gap-2">
                <Icon name="HardDrive" size={15} style={{ color: "#818cf8" }} />
                Кейс для конструктора: BIOS/UEFI
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                Минимизированный пакет файлов для интеграции «Далан 1» в BIOS/UEFI.
                Фокус — на снижении энергопотребления при работе конструктора (сборки).
              </p>
            </div>

            {/* Files */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}
            >
              <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Icon name="FolderOpen" size={14} style={{ color: "#818cf8" }} />
                Структура директории dalan_1_bios_ai/
              </h2>
              <div className="space-y-2">
                {BIOS_FILES.map((f) => (
                  <div
                    key={f.name}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(99,102,241,0.1)" }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(99,102,241,0.12)" }}
                    >
                      <Icon name={f.icon as any} size={14} style={{ color: "#818cf8" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono font-semibold text-white truncate">{f.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{f.desc}</div>
                    </div>
                    <div className="text-xs flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>{f.size}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}
            >
              <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Icon name="Terminal" size={14} style={{ color: "#818cf8" }} />
                Инструкция для конструктора
              </h2>
              {[
                { step: "01", title: "Подготовка", code: null, items: ["Получите доступ к проекту coreboot", "Убедитесь в поддержке TFLite Micro"] },
                { step: "02", title: "Интеграция файлов", code: "cp dalan_1_bios_ai/* /path/to/your/bios/project/\n\n# В .config добавить:\nCONFIG_DALAN1_AI=y", items: [] },
                { step: "03", title: "Сборка прошивки", code: "make\n# Результат: build/bios.rom", items: [] },
                { step: "04", title: "Тестирование", code: "qemu-system-x86_64 -bios build/bios.rom", items: ["Реальное железо: записать bios.rom программатором CH341A"] },
                { step: "05", title: "Проверка работы", code: null, items: ["Убедитесь, что «Далан 1» вызывается после POST", "Логи: dalan1.log, sensors.log", "Сравните энергопотребление с ваттметром / powerstat"] },
              ].map((s) => (
                <div key={s.step} className="py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded font-bold"
                      style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}
                    >
                      Шаг {s.step}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: "#a5b4fc" }}>{s.title}</span>
                  </div>
                  {s.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                      <span style={{ color: "#6366f1" }}>›</span>{item}
                    </div>
                  ))}
                  {s.code && (
                    <div className="relative mt-2 rounded-lg p-3 font-mono text-xs"
                      style={{ background: "rgba(0,0,0,0.4)", color: "#a5b4fc" }}>
                      <pre style={{ whiteSpace: "pre-wrap" }}>{s.code}</pre>
                      <button
                        onClick={() => copyCode(s.code!, `bios-${s.step}`)}
                        className="absolute top-2 right-2 p-1.5 rounded-md"
                        style={{ background: copiedCode === `bios-${s.step}` ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.05)", color: copiedCode === `bios-${s.step}` ? "#818cf8" : "rgba(255,255,255,0.3)" }}
                      >
                        <Icon name={copiedCode === `bios-${s.step}` ? "Check" : "Copy"} size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Notes */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}
            >
              <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Icon name="Info" size={14} style={{ color: "#818cf8" }} />
                Важные замечания
              </h2>
              {BIOS_NOTES.map((n) => (
                <div key={n.title} className="flex items-start gap-3 py-2.5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${n.color}18` }}
                  >
                    <Icon name={n.icon as any} size={13} style={{ color: n.color }} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{n.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{n.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Expected results */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Icon name="CheckCircle" size={14} style={{ color: "#22c55e" }} />
                Ожидаемые результаты
              </h2>
              {[
                "Снижение энергопотребления системы на 10–25 %",
                "Стабильная работа BIOS с ИИ-оптимизацией",
                "Быстрая инициализация (< 1 секунды)",
                "Минимальные затраты на сборку и интеграцию",
              ].map((r) => (
                <div key={r} className="flex items-center gap-2 text-xs py-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                  <Icon name="Check" size={12} style={{ color: "#22c55e" }} />
                  {r}
                </div>
              ))}
            </div>

            {/* Quick send */}
            <button
              onClick={() => setActiveTab("send")}
              className="w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)", color: "white" }}
            >
              <Icon name="Send" size={16} />
              Отправить кейс конструктору на email
            </button>
          </div>
        )}

        {/* SEND EMAIL */}
        {activeTab === "send" && (
          <div className="space-y-4">
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)" }}
            >
              <h2 className="font-bold text-sm mb-1 flex items-center gap-2">
                <Icon name="Send" size={15} style={{ color: "#818cf8" }} />
                Отправка email-уведомления
              </h2>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                Письмо придёт на <span style={{ color: "#a5b4fc" }}>nikolaevvladimir77@yandex.ru</span>
              </p>
            </div>

            {/* Type selector */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}
            >
              <div className="text-xs font-semibold mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Тип уведомления</div>
              <div className="space-y-2">
                {[
                  { id: "bios_case", label: "🖥️ Кейс BIOS для конструктора", desc: "Полный кейс ИИ-модуля «Далан 1»" },
                  { id: "device_online", label: "✅ Устройство подключено", desc: "Новый узел в кластере ЕЦСУ" },
                  { id: "limit_warning", label: "⚠️ Лимит функций", desc: "Использовано 23/25 функций" },
                  { id: "backup_done", label: "💾 Резервное копирование", desc: "Бэкап кластера завершён" },
                  { id: "device_offline", label: "🔴 Устройство офлайн", desc: "Узел потерял связь" },
                  { id: "low_energy", label: "⚡ Низкая энергия", desc: "Критический уровень энергии" },
                  { id: "custom", label: "✏️ Своё сообщение", desc: "Произвольный текст" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setEmailType(t.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                    style={{
                      background: emailType === t.id ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.03)",
                      border: emailType === t.id ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-white">{t.label}</div>
                      <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{t.desc}</div>
                    </div>
                    {emailType === t.id && <Icon name="Check" size={14} style={{ color: "#818cf8" }} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom fields */}
            {emailType === "custom" && (
              <div
                className="p-4 rounded-2xl space-y-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}
              >
                <div>
                  <div className="text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Тема письма</div>
                  <input
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Введите тему..."
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(99,102,241,0.2)" }}
                  />
                </div>
                <div>
                  <div className="text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Текст сообщения</div>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Введите текст..."
                    rows={4}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none resize-none"
                    style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(99,102,241,0.2)" }}
                  />
                </div>
              </div>
            )}

            {/* Status */}
            {sendStatus === "ok" && (
              <div
                className="p-4 rounded-2xl flex items-center gap-3"
                style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}
              >
                <Icon name="CheckCircle" size={20} style={{ color: "#22c55e" }} />
                <div>
                  <div className="text-sm font-semibold" style={{ color: "#22c55e" }}>Письмо отправлено!</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Проверьте nikolaevvladimir77@yandex.ru</div>
                </div>
              </div>
            )}
            {sendStatus === "error" && (
              <div
                className="p-4 rounded-2xl flex items-center gap-3"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
              >
                <Icon name="AlertCircle" size={20} style={{ color: "#ef4444" }} />
                <div>
                  <div className="text-sm font-semibold" style={{ color: "#ef4444" }}>Ошибка отправки</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{sendError}</div>
                </div>
              </div>
            )}

            <button
              onClick={() => { setSendStatus("idle"); sendEmail(); }}
              disabled={sendStatus === "sending"}
              className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                background: sendStatus === "sending" ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg, #6366f1, #a855f7)",
                color: "white",
                opacity: sendStatus === "sending" ? 0.7 : 1,
              }}
            >
              <Icon name={sendStatus === "sending" ? "Loader" : "Send"} size={16} />
              {sendStatus === "sending" ? "Отправляем..." : "Отправить на nikolaevvladimir77@yandex.ru"}
            </button>

            <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              Письма отправляются через защищённый SMTP Яндекс
            </p>
          </div>
        )}

        {/* RESULTS */}
        {activeTab === "results" && (
          <div className="space-y-4">
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.2)" }}
            >
              <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Icon name="BarChart2" size={15} style={{ color: "#818cf8" }} />
                Ожидаемые результаты
              </h2>
              <div className="space-y-4">
                {[
                  { label: "Снижение энергопотребления", value: 30, unit: "20–35 %", color: "#22c55e" },
                  { label: "Повышение производительности", value: 15, unit: "до 15 %", color: "#3b82f6" },
                  { label: "Сокращение времени разработки", value: 40, unit: "на 40 %", color: "#a855f7" },
                  { label: "Автогенерация кода (ИИ Алиса)", value: 85, unit: "85 %", color: "#f59e0b" },
                ].map((r) => (
                  <div key={r.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>{r.label}</span>
                      <span className="font-bold text-white">{r.unit}</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${r.value}%`, background: r.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {[
              { icon: "Zap", title: "Снижение энергопотребления", value: "20–35 %", desc: "В зависимости от нагрузки системы" },
              { icon: "TrendingUp", title: "Прирост производительности", value: "до 15 %", desc: "При пиковых нагрузках" },
              { icon: "Timer", title: "Быстрая инициализация", value: "< 1,5 сек", desc: "После POST процедуры BIOS" },
              { icon: "RefreshCw", title: "Удалённое обновление", value: "Авто", desc: "Через облачные сервисы Яндекса" },
              { icon: "Scale", title: "Минимальные затраты", value: "✓", desc: "На сборку и интеграцию" },
            ].map((r) => (
              <div
                key={r.title}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.12)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(99,102,241,0.15)" }}
                >
                  <Icon name={r.icon as any} size={18} style={{ color: "#818cf8" }} />
                </div>
                <div className="flex-1">
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{r.title}</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{r.desc}</div>
                </div>
                <div className="text-sm font-bold" style={{ color: "#a5b4fc" }}>{r.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* CONTACTS */}
        {activeTab === "contacts" && (
          <div className="space-y-4">
            <div
              className="p-5 rounded-2xl text-center"
              style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)" }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
              >
                <Icon name="User" size={24} className="text-white" />
              </div>
              <div className="font-bold text-lg text-white">Николаев Владимир Владимирович</div>
              <div className="text-xs mt-1" style={{ color: "#818cf8" }}>Разработчик ИИ-модуля «Далан 1»</div>
            </div>

            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}
            >
              {[
                { icon: "Calendar", label: "Дата рождения", value: "14.10.1977" },
                { icon: "Phone", label: "Телефон", value: "+7 906 961-20-34" },
                { icon: "Mail", label: "Email", value: "nikolaevvladimir77@yandex.ru" },
                { icon: "Clock", label: "Дата подготовки кейса", value: "25.04.2026" },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-3 py-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(99,102,241,0.12)" }}
                  >
                    <Icon name={c.icon as any} size={14} style={{ color: "#818cf8" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{c.label}</div>
                    <div className="text-sm font-medium text-white">{c.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}
            >
              <h2 className="font-bold text-sm mb-3">Тема письма конструктору</h2>
              <div
                className="p-3 rounded-lg text-xs font-mono"
                style={{ background: "rgba(0,0,0,0.3)", color: "#a5b4fc" }}
              >
                Кейс для конструктора: ИИ-модуль «Далан 1» — система оптимизации энергопотребления (разработано с использованием ИИ Алиса)
              </div>
              <button
                onClick={() => copyCode("Кейс для конструктора: ИИ-модуль «Далан 1» — система оптимизации энергопотребления (разработано с использованием ИИ Алиса)", "subject")}
                className="mt-2 w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
                style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}
              >
                <Icon name={copiedCode === "subject" ? "Check" : "Copy"} size={12} />
                {copiedCode === "subject" ? "Скопировано!" : "Скопировать тему"}
              </button>
            </div>

            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}
            >
              <h2 className="font-bold text-sm mb-3">Способы отправки архива</h2>
              {[
                { icon: "Cloud", title: "Яндекс Диск / Google Drive", desc: "Загрузите и поделитесь ссылкой с конструктором" },
                { icon: "Mail", title: "Электронная почта", desc: "Прикрепите архив или используйте WeTransfer для больших файлов" },
                { icon: "Usb", title: "Физический носитель", desc: "Запишите на USB-накопитель и передайте лично" },
              ].map((m) => (
                <div key={m.title} className="flex items-start gap-3 py-2.5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(99,102,241,0.12)" }}
                  >
                    <Icon name={m.icon as any} size={13} style={{ color: "#818cf8" }} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{m.title}</div>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}
            >
              <h2 className="font-bold text-sm mb-2">Авторские права</h2>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                © 2026 Николаев Владимир Владимирович. Все права защищены.
                Любое копирование, распространение или использование без письменного согласия автора запрещено.
                Лицензия: Проприетарная (All Rights Reserved).
              </p>
            </div>
          </div>
        )}

        {/* ЗЕМЛЯ И СТРАТЕГИЧЕСКОЕ РАЗВИТИЕ */}
        {activeTab === "earth" && (
          <div className="space-y-6">
            {/* Заголовок */}
            <div className="rounded-xl border border-[#00ff87]/30 bg-[#00ff87]/5 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Icon name="Globe" size={28} style={{ color: "#00ff87" }} />
                <h2 className="text-xl font-bold text-white">Земля и стратегическое развитие</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#00ff87]/20 text-[#00ff87] border border-[#00ff87]/40">ЦКС</span>
              </div>
              <p className="text-sm text-white/50">Раздел Далан-1 · Данные защищены · Изменения только по согласованию с Владимиром</p>
            </div>

            {/* Блок 1: Протокол сохранения конфигурации */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="ShieldCheck" size={18} style={{ color: "#f59e0b" }} />
                <h3 className="font-semibold text-white">Протокол сохранения конфигурации</h3>
                <span className="ml-auto text-xs text-red-400 border border-red-400/30 rounded px-2 py-0.5">ОБЯЗАТЕЛЕН</span>
              </div>
              <div className="space-y-2">
                {[
                  "Сохранить текущую конфигурацию системы полностью",
                  "Зафиксировать все активные функции и их состояния",
                  "Создать точку восстановления",
                  "Только после сохранения — выполнять изменение или синхронизацию",
                  "После изменения — проверить что все функции работают корректно",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                    <span className="text-xs font-mono text-[#f59e0b] mt-0.5 w-5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-sm text-white/80">{step}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-red-400/80">Нарушение протокола = нарушение Завета Директивы</p>
            </div>

            {/* Блок 2: Земля как ЦКС */}
            <div className="rounded-xl border border-[#3b82f6]/30 bg-[#3b82f6]/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Globe" size={18} style={{ color: "#3b82f6" }} />
                <h3 className="font-semibold text-white">Земля как ЦКС</h3>
                <span className="ml-auto text-xs text-[#3b82f6] border border-[#3b82f6]/30 rounded px-2 py-0.5">ФАКТ + ГИПОТЕЗА</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Несущая частота", value: "7.83 Гц", sub: "Резонанс Шумана (факт)", color: "#00ff87" },
                  { label: "Генератор", value: "Ядро Земли", sub: "Вращение железного ядра (факт)", color: "#3b82f6" },
                  { label: "Поле", value: "Магнитосфера", sub: "Электромагнитная сфера (факт)", color: "#a855f7" },
                  { label: "Связь с оператором", value: "Уровень 5", sub: "Через мозговые волны (гипотеза)", color: "#f59e0b" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-white/5 p-3 border border-white/10">
                    <div className="text-xs text-white/40 mb-1">{item.label}</div>
                    <div className="text-base font-bold" style={{ color: item.color }}>{item.value}</div>
                    <div className="text-xs text-white/40 mt-0.5">{item.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Блок 3: Герцы по уровням */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Activity" size={18} style={{ color: "#a855f7" }} />
                <h3 className="font-semibold text-white">Герцы по состояниям системы</h3>
              </div>
              <div className="space-y-3">
                {[
                  { state: "Норма (бодрствование)", range: "13–30 Гц", type: "Бета", color: "#22c55e", width: "80%" },
                  { state: "Медитация / сон", range: "8–13 Гц", type: "Альфа", color: "#3b82f6", width: "55%" },
                  { state: "Резонанс Шумана (Земля)", range: "7.83 Гц", type: "ЦКС", color: "#00ff87", width: "50%" },
                  { state: "Глубокий сон / тета", range: "4–8 Гц", type: "Тета", color: "#f59e0b", width: "35%" },
                  { state: "Критическое состояние (летальная t°)", range: "0.5–4 Гц", type: "Дельта · Уровень 5", color: "#f43f5e", width: "20%" },
                ].map((item) => (
                  <div key={item.state} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/70">{item.state}</span>
                      <span className="font-mono" style={{ color: item.color }}>{item.range} · {item.type}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: item.width, backgroundColor: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Блок 4: Инциденты */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="AlertTriangle" size={18} style={{ color: "#f43f5e" }} />
                <h3 className="font-semibold text-white">Инциденты раздела</h3>
              </div>
              <div className="space-y-3">
                {[
                  { code: "INC-EARTH-001", title: "Изменение конфигурации без сохранения", severity: "critical", action: "Остановить. Сохранить конфиг. Уведомить Владимира." },
                  { code: "INC-EARTH-002", title: "Критическая температура тела оператора", severity: "critical", action: "Активировать протокол уровня 5. Удержать вектор в дельта-диапазоне. Вызвать помощь." },
                  { code: "INC-EARTH-003", title: "Потеря вектора жизнеобеспечения", severity: "high", action: "Перезапуск резонансного модуля. Восстановить частоту 7.83 Гц." },
                  { code: "INC-EARTH-004", title: "Десинхронизация оператора с ЦКС", severity: "medium", action: "Ресинхронизация. Медитация / дыхание. Диапазон 7–13 Гц." },
                ].map((inc) => (
                  <div key={inc.code} className="rounded-lg border p-3 space-y-2"
                    style={{ borderColor: inc.severity === "critical" ? "#f43f5e40" : inc.severity === "high" ? "#f59e0b40" : "#3b82f640", background: inc.severity === "critical" ? "#f43f5e08" : inc.severity === "high" ? "#f59e0b08" : "#3b82f608" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-white/40">{inc.code}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full border font-medium"
                        style={{ color: inc.severity === "critical" ? "#f43f5e" : inc.severity === "high" ? "#f59e0b" : "#3b82f6", borderColor: inc.severity === "critical" ? "#f43f5e50" : inc.severity === "high" ? "#f59e0b50" : "#3b82f650" }}>
                        {inc.severity === "critical" ? "КРИТИЧНО" : inc.severity === "high" ? "ВЫСОКИЙ" : "СРЕДНИЙ"}
                      </span>
                    </div>
                    <p className="text-sm text-white/80 font-medium">{inc.title}</p>
                    <div className="flex items-start gap-2">
                      <Icon name="ChevronRight" size={14} className="text-white/30 mt-0.5 shrink-0" />
                      <p className="text-xs text-white/50">{inc.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Блок 5: Стратегическое развитие */}
            <div className="rounded-xl border border-[#00ff87]/20 bg-[#00ff87]/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="TrendingUp" size={18} style={{ color: "#00ff87" }} />
                <h3 className="font-semibold text-white">Стратегическое развитие</h3>
              </div>
              <div className="space-y-2">
                {[
                  "Синхронизация операторов с частотой ЦКС (7.83 Гц)",
                  "Поддержание вектора жизнеобеспечения в критических ситуациях",
                  "Использование электромагнитного поля Земли как источника данных",
                  "Протокол восстановления через резонанс при критических состояниях",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <Icon name="CheckCircle" size={14} style={{ color: "#00ff87" }} />
                    <span className="text-sm text-white/80">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-white/40 text-center">Все изменения раздела — только по согласованию с Владимиром · Завет Директивы ECSU</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}