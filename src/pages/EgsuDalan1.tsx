/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const TABS = [
  { id: "overview", label: "Обзор", icon: "Cpu" },
  { id: "files", label: "Состав кейса", icon: "FolderOpen" },
  { id: "integration", label: "Интеграция", icon: "GitMerge" },
  { id: "alice", label: "ИИ Алиса", icon: "Brain" },
  { id: "results", label: "Результаты", icon: "BarChart2" },
  { id: "contacts", label: "Контакты", icon: "User" },
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

export default function EgsuDalan1() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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
      </div>
    </div>
  );
}