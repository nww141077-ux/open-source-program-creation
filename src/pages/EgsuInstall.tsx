import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { CORE_AUTHOR, CORE_META } from "@/core/author";

const APP_URL = window.location.origin;
const SCANNER_URL = "https://functions.poehali.dev/b3ae5ea9-0780-4337-b7b0-e19f144a63fb";

type Platform = "windows" | "android" | "ios" | "linux" | "mac";

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return "android";
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/win/.test(ua)) return "windows";
  if (/mac/.test(ua)) return "mac";
  return "linux";
}

const PLATFORM_STEPS: Record<Platform, { title: string; steps: string[] }> = {
  windows: {
    title: "Установка на Windows (Chrome / Edge)",
    steps: [
      "Откройте приложение в браузере Chrome или Edge",
      "Нажмите на иконку установки (⊕) в адресной строке справа",
      "Или: меню браузера → 'Приложения' → 'Установить сайт как приложение'",
      "Нажмите 'Установить' в появившемся диалоге",
      "Приложение появится на рабочем столе и в меню Пуск",
    ],
  },
  android: {
    title: "Установка на Android",
    steps: [
      "Откройте приложение в браузере Chrome",
      "Нажмите меню (⋮) в правом верхнем углу",
      "Выберите 'Добавить на главный экран' или 'Установить приложение'",
      "Подтвердите установку нажав 'Добавить'",
      "Иконка ЕЦСУ появится на главном экране",
    ],
  },
  ios: {
    title: "Установка на iPhone / iPad (Safari)",
    steps: [
      "Откройте приложение в браузере Safari",
      "Нажмите кнопку 'Поделиться' (квадрат со стрелкой вверх) внизу",
      "Прокрутите вниз и выберите 'На экран Домой'",
      "Нажмите 'Добавить' в правом верхнем углу",
      "Иконка ЕЦСУ появится на рабочем столе",
    ],
  },
  mac: {
    title: "Установка на macOS (Chrome / Safari)",
    steps: [
      "Откройте приложение в браузере Chrome",
      "Нажмите иконку установки (⊕) в адресной строке",
      "Или: меню Chrome → 'Сохранить и поделиться' → 'Установить как приложение'",
      "Нажмите 'Установить'",
      "Приложение откроется в отдельном окне и появится в Launchpad",
    ],
  },
  linux: {
    title: "Установка на Linux (Chrome / Chromium)",
    steps: [
      "Откройте приложение в браузере Chrome или Chromium",
      "Нажмите иконку установки (⊕) в адресной строке",
      "Нажмите 'Установить' в появившемся диалоге",
      "Приложение появится в меню приложений системы",
    ],
  },
};

export default function EgsuInstall() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<Platform>(detectPlatform());
  const [copied, setCopied] = useState(false);
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [scanResult, setScanResult] = useState<{ created?: number; total_scanned?: number } | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    const prompt = deferredPrompt as Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> };
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setCanInstall(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(APP_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const runScan = async () => {
    setScanStatus("scanning");
    try {
      const resp = await fetch(SCANNER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources: "all" }),
      });
      const data = await resp.json();
      setScanResult(typeof data === "string" ? JSON.parse(data) : data);
      setScanStatus("done");
    } catch {
      setScanStatus("error");
    }
  };

  const steps = PLATFORM_STEPS[platform];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", color: "#e0e8ff", fontFamily: "monospace" }}>
      {/* Шапка */}
      <div style={{ background: "linear-gradient(135deg, #0d1b3e, #1a2d5a)", borderBottom: "1px solid #1e3a6e", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate("/egsu/dashboard")} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="ArrowLeft" size={18} />
          <span style={{ fontSize: 13 }}>Назад</span>
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
          <span style={{ fontSize: 12, color: "#94a3b8" }}>ЕЦСУ 2.0</span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px" }}>
        {/* Заголовок */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛡️</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#60a5fa", margin: "0 0 8px" }}>
            ЕЦСУ 2.0 — Установка
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>
            {CORE_META.appName} · Автор: {CORE_AUTHOR.fullName}
          </p>
        </div>

        {/* Блок ссылки */}
        <div style={{ background: "#0d1b3e", border: "1px solid #1e3a6e", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, color: "#93c5fd", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="Link" size={18} />
            Ссылка для пользователей
          </h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ flex: 1, background: "#060d1f", border: "1px solid #1e3a6e", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#60a5fa", wordBreak: "break-all" }}>
              {APP_URL}
            </div>
            <button
              onClick={copyLink}
              style={{ background: copied ? "#166534" : "#1e3a6e", border: "none", borderRadius: 8, padding: "10px 16px", color: "#fff", cursor: "pointer", whiteSpace: "nowrap", fontSize: 13, display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
            >
              <Icon name={copied ? "Check" : "Copy"} size={14} />
              {copied ? "Скопировано" : "Копировать"}
            </button>
          </div>
          <p style={{ color: "#64748b", fontSize: 12, margin: "8px 0 0" }}>
            Отправьте эту ссылку пользователям — они смогут открыть ЕЦСУ с любого устройства без регистрации
          </p>
        </div>

        {/* PWA установка */}
        {canInstall && (
          <div style={{ background: "linear-gradient(135deg, #1a2d5a, #0d1b3e)", border: "1px solid #2563eb", borderRadius: 12, padding: 20, marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 32 }}>📥</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: "#60a5fa", marginBottom: 4 }}>Установить как приложение</div>
              <div style={{ color: "#94a3b8", fontSize: 13 }}>Браузер поддерживает установку — нажмите кнопку для быстрой установки на ваше устройство</div>
            </div>
            <button
              onClick={handleInstall}
              style={{ background: "#2563eb", border: "none", borderRadius: 8, padding: "10px 20px", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 }}
            >
              Установить
            </button>
          </div>
        )}

        {/* Выбор платформы */}
        <div style={{ background: "#0d1b3e", border: "1px solid #1e3a6e", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, color: "#93c5fd", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="Monitor" size={18} />
            Инструкция по установке
          </h2>

          {/* Табы платформ */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {(["windows", "android", "ios", "mac", "linux"] as Platform[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                style={{ background: platform === p ? "#1e40af" : "#060d1f", border: `1px solid ${platform === p ? "#3b82f6" : "#1e3a6e"}`, borderRadius: 8, padding: "6px 14px", color: platform === p ? "#fff" : "#94a3b8", cursor: "pointer", fontSize: 12, textTransform: "capitalize" }}
              >
                {p === "windows" ? "🪟 Windows" : p === "android" ? "🤖 Android" : p === "ios" ? "🍎 iOS" : p === "mac" ? "🍏 macOS" : "🐧 Linux"}
              </button>
            ))}
          </div>

          <div style={{ background: "#060d1f", borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, color: "#60a5fa", marginBottom: 12, fontSize: 14 }}>{steps.title}</div>
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              {steps.steps.map((step, i) => (
                <li key={i} style={{ color: "#cbd5e1", fontSize: 13, marginBottom: 8, lineHeight: 1.6 }}>{step}</li>
              ))}
            </ol>
          </div>

          <div style={{ marginTop: 16, padding: 12, background: "#0f2744", borderRadius: 8, fontSize: 12, color: "#64748b", display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Icon name="Info" size={14} />
            <span>ЕЦСУ работает как PWA (Progressive Web App) — устанавливается с браузера без магазинов приложений. Работает офлайн и обновляется автоматически.</span>
          </div>
        </div>

        {/* Автосканирование */}
        <div style={{ background: "#0d1b3e", border: "1px solid #1e3a6e", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, color: "#93c5fd", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="Radar" size={18} />
            Автосканирование инцидентов
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 16px" }}>
            Запустить парсинг открытых источников (GDACS, USGS, OpenAQ, CVE, ReliefWeb, EMSC) и внести новые инциденты в базу ЕЦСУ
          </p>
          <button
            onClick={runScan}
            disabled={scanStatus === "scanning"}
            style={{ background: scanStatus === "done" ? "#166534" : scanStatus === "error" ? "#7f1d1d" : "#1e3a6e", border: "none", borderRadius: 8, padding: "10px 20px", color: "#fff", cursor: scanStatus === "scanning" ? "wait" : "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}
          >
            <Icon name={scanStatus === "scanning" ? "Loader" : scanStatus === "done" ? "CheckCircle" : "Search"} size={16} />
            {scanStatus === "idle" && "Запустить сканирование"}
            {scanStatus === "scanning" && "Сканирование..."}
            {scanStatus === "done" && `Готово — добавлено ${scanResult?.created ?? 0} инцидентов`}
            {scanStatus === "error" && "Ошибка — повторить"}
          </button>
          {scanResult && scanStatus === "done" && (
            <div style={{ marginTop: 12, padding: 12, background: "#060d1f", borderRadius: 8, fontSize: 12, color: "#94a3b8" }}>
              Проверено источников: {scanResult.total_scanned ?? "—"} · Новых инцидентов: {scanResult.created ?? 0}
            </div>
          )}
        </div>

        {/* Характеристики */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {[
            { icon: "Globe", label: "Кроссплатформенность", desc: "Windows, Android, iOS, Linux, macOS" },
            { icon: "Wifi", label: "Офлайн-режим", desc: "Работает без интернета (базовые функции)" },
            { icon: "RefreshCw", label: "Автообновление", desc: "Система обновляется автоматически" },
            { icon: "Shield", label: "Безопасность", desc: "HTTPS, шифрование, защита данных" },
          ].map(({ icon, label, desc }) => (
            <div key={label} style={{ background: "#0d1b3e", border: "1px solid #1e3a6e", borderRadius: 10, padding: 16 }}>
              <Icon name={icon} size={20} style={{ color: "#60a5fa", marginBottom: 8 }} />
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: "#e0e8ff" }}>{label}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{desc}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 32, color: "#334155", fontSize: 11 }}>
          {CORE_AUTHOR.copyright} · {CORE_META.appName}
        </div>
      </div>
    </div>
  );
}