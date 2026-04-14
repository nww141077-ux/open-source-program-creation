import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const INTEGRITY_CHECKS = [
  { module: "ядро системы (core.bin)", hash: "sha256:a3f4c8d2e1b7f9a6", status: "ok", size: "4.2 МБ" },
  { module: "ИИ-модуль классификации", hash: "sha256:7b2e5a1d9c3f8e04", status: "ok", size: "182 МБ" },
  { module: "ИИ-модуль детектора аномалий", hash: "sha256:d1a9b6c3f2e7a841", status: "ok", size: "94 МБ" },
  { module: "ИИ-генератор отчётов (NLP)", hash: "sha256:5e8f3c2a7b4d1e96", status: "ok", size: "340 МБ" },
  { module: "база данных инцидентов (db.enc)", hash: "sha256:9c4a7d2e5f1b3a87", status: "ok", size: "1.1 ГБ" },
  { module: "криптографические модули", hash: "sha256:2f7e1a4d8c3b6f05", status: "ok", size: "18 МБ" },
  { module: "конфигурация ролей (rbac.conf)", hash: "sha256:b6d3e9a1f4c2870e", status: "warn", size: "48 КБ" },
];

const BOOT_LOG = [
  { time: "08:00:00.001", level: "INFO", msg: "Загрузчик ЕЦСУ 2.0 v3.4.1 запущен" },
  { time: "08:00:00.045", level: "INFO", msg: "Проверка целостности системных файлов..." },
  { time: "08:00:00.312", level: "OK", msg: "Все 7 модулей прошли проверку хешей" },
  { time: "08:00:00.318", level: "WARN", msg: "rbac.conf: незначительное изменение (обновление конфигурации)" },
  { time: "08:00:00.820", level: "INFO", msg: "Инициализация AES-256-GCM и TLS 1.3..." },
  { time: "08:00:01.140", level: "OK", msg: "Криптографические ключи загружены успешно" },
  { time: "08:00:01.450", level: "INFO", msg: "Подключение к серверу лицензий license.ecsu.int..." },
  { time: "08:00:01.892", level: "OK", msg: "Лицензия ECSU-2026-PROF подтверждена (352 дня)" },
  { time: "08:00:02.100", level: "INFO", msg: "Диагностика окружения: ОС, зависимости, порты..." },
  { time: "08:00:02.340", level: "OK", msg: "Окружение совместимо. Все зависимости присутствуют" },
  { time: "08:00:02.450", level: "INFO", msg: "Проверка обновлений загрузчика..." },
  { time: "08:00:03.120", level: "OK", msg: "Загрузчик актуален (v3.4.1 — последняя версия)" },
  { time: "08:00:03.200", level: "INFO", msg: "Запуск основных модулей системы..." },
  { time: "08:00:04.800", level: "OK", msg: "Система ЕЦСУ 2.0 успешно запущена" },
];

const ENV_CHECKS = [
  { label: "Операционная система", value: "Ubuntu 22.04 LTS", status: "ok" },
  { label: "Версия Node.js", value: "v20.11.0", status: "ok" },
  { label: "Оперативная память", value: "14.2 ГБ / 32 ГБ", status: "ok" },
  { label: "Дисковое пространство", value: "478 ГБ / 2 ТБ", status: "ok" },
  { label: "Порт 443 (HTTPS)", value: "Открыт", status: "ok" },
  { label: "Порт 5432 (PostgreSQL)", value: "Открыт", status: "ok" },
  { label: "DNS-резолюция", value: "license.ecsu.int → 185.41.4.12", status: "ok" },
  { label: "SSL-сертификат", value: "Действителен до 01.04.2027", status: "ok" },
];

const LOG_COLORS: Record<string, string> = { INFO: "#3b82f6", OK: "#00ff87", WARN: "#f59e0b", ERROR: "#f43f5e" };

export default function LoaderTab() {
  const [safeMode, setSafeMode] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [logFilter, setLogFilter] = useState<"all" | "warn" | "ok">("all");
  const [simulateProgress, setSimulateProgress] = useState(false);
  const [progress, setProgress] = useState(100);

  function runDiagnostics() {
    setSimulateProgress(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(interval); setSimulateProgress(false); return 100; }
        return prev + 5;
      });
    }, 100);
  }

  useEffect(() => {
    if (!simulateProgress) setProgress(100);
  }, [simulateProgress]);

  const filteredLog = BOOT_LOG.filter(l => {
    if (logFilter === "warn") return l.level === "WARN" || l.level === "ERROR";
    if (logFilter === "ok") return l.level === "OK";
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-bold text-white uppercase">Загрузчик системы</h1>
        <p className="text-white/30 text-sm mt-0.5">Диагностика · Целостность · Журнал загрузки · Конфигурация</p>
      </div>

      {/* Статус загрузки */}
      <div className="p-5 rounded-2xl"
        style={{ background: "rgba(0,255,135,0.04)", border: "1px solid rgba(0,255,135,0.2)" }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(0,255,135,0.15)" }}>
              <Icon name="CheckCircle" size={24} style={{ color: "#00ff87" }} />
            </div>
            <div>
              <div className="text-white font-bold text-base">Система запущена штатно</div>
              <div className="text-white/40 text-xs">ЕЦСУ 2.0 Загрузчик v3.4.1 · Последний запуск сегодня в 08:00:04</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={runDiagnostics}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
              style={{ background: "rgba(0,255,135,0.1)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.2)" }}>
              {simulateProgress ? `Диагностика... ${progress}%` : "Запустить диагностику"}
            </button>
          </div>
        </div>
        {simulateProgress && (
          <div className="mt-4">
            <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-1.5 rounded-full transition-all" style={{ width: `${progress}%`, background: "linear-gradient(to right, #a855f7, #00ff87)" }} />
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Режим загрузки */}
        <div className="p-5 rounded-2xl space-y-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(168,85,247,0.15)" }}>
          <div className="flex items-center gap-2">
            <Icon name="Settings" size={16} style={{ color: "#a855f7" }} />
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Конфигурация загрузчика</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(168,85,247,0.1)" }}>
              <div>
                <div className="text-white text-sm font-medium">Безопасный режим</div>
                <div className="text-white/30 text-xs">Запуск с минимальным набором модулей при сбоях</div>
              </div>
              <button onClick={() => setSafeMode(!safeMode)}
                className="w-10 h-5 rounded-full relative transition-all shrink-0"
                style={{ background: safeMode ? "#a855f7" : "rgba(255,255,255,0.1)" }}>
                <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow"
                  style={{ left: safeMode ? "calc(100% - 18px)" : "2px" }} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,255,135,0.1)" }}>
              <div>
                <div className="text-white text-sm font-medium">Автообновление загрузчика</div>
                <div className="text-white/30 text-xs">Проверка и установка патчей без участия пользователя</div>
              </div>
              <button onClick={() => setAutoUpdate(!autoUpdate)}
                className="w-10 h-5 rounded-full relative transition-all shrink-0"
                style={{ background: autoUpdate ? "#00ff87" : "rgba(255,255,255,0.1)" }}>
                <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow"
                  style={{ left: autoUpdate ? "calc(100% - 18px)" : "2px" }} />
              </button>
            </div>
          </div>
          <div className="px-3 py-2 rounded-xl text-xs text-white/40"
            style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.12)" }}>
            Версия загрузчика: <span className="text-white/60">v3.4.1</span> · Следующая проверка: <span className="text-white/60">через 6 часов</span>
          </div>
        </div>

        {/* Диагностика окружения */}
        <div className="p-5 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(59,130,246,0.15)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Monitor" size={16} style={{ color: "#3b82f6" }} />
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Диагностика окружения</h3>
          </div>
          <div className="space-y-2">
            {ENV_CHECKS.map(check => (
              <div key={check.label} className="flex items-center justify-between text-xs">
                <span className="text-white/40">{check.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-white/65">{check.value}</span>
                  <Icon name="Check" size={11} style={{ color: "#00ff87" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Проверка целостности */}
      <div className="p-5 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(245,158,11,0.12)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Icon name="FileCheck" size={16} style={{ color: "#f59e0b" }} />
          <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Проверка целостности файлов</h3>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
            1 предупреждение
          </span>
        </div>
        <div className="space-y-2">
          {INTEGRITY_CHECKS.map(f => (
            <div key={f.module} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${f.status === "warn" ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.05)"}` }}>
              <Icon name={f.status === "ok" ? "ShieldCheck" : "AlertTriangle"} size={14}
                style={{ color: f.status === "ok" ? "#00ff87" : "#f59e0b" }} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-white/70 text-sm truncate">{f.module}</div>
                <div className="text-white/25 text-[10px] font-mono">{f.hash}</div>
              </div>
              <span className="text-white/30 text-xs shrink-0">{f.size}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0 font-semibold"
                style={{
                  background: f.status === "ok" ? "rgba(0,255,135,0.1)" : "rgba(245,158,11,0.1)",
                  color: f.status === "ok" ? "#00ff87" : "#f59e0b"
                }}>
                {f.status === "ok" ? "OK" : "WARN"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Журнал загрузки */}
      <div className="p-5 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Icon name="ScrollText" size={16} style={{ color: "#a855f7" }} />
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Журнал загрузки</h3>
          </div>
          <div className="flex gap-1">
            {(["all", "ok", "warn"] as const).map(f => (
              <button key={f} onClick={() => setLogFilter(f)}
                className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: logFilter === f ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.03)",
                  color: logFilter === f ? "#a855f7" : "rgba(255,255,255,0.3)",
                  border: `1px solid ${logFilter === f ? "rgba(168,85,247,0.3)" : "transparent"}`,
                }}>
                {f === "all" ? "Все" : f === "ok" ? "OK" : "Предупреждения"}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl overflow-hidden font-mono text-xs space-y-0"
          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
          {filteredLog.map((entry, i) => (
            <div key={i} className="flex gap-3 px-4 py-1.5 hover:bg-white/[0.02] transition-colors">
              <span className="text-white/20 shrink-0">{entry.time}</span>
              <span className="shrink-0 w-10 font-bold" style={{ color: LOG_COLORS[entry.level] }}>{entry.level}</span>
              <span className="text-white/60">{entry.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
