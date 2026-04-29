/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import LoaderTab from "@/pages/egsu-dashboard/LoaderTab";

// ─── ТИПЫ ────────────────────────────────────────────────────────────────────
interface WinState {
  id: string;
  title: string;
  icon: string;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minimized: boolean;
  maximized: boolean;
  zIndex: number;
  component: string;
}

interface Process {
  id: string;
  name: string;
  cpu: number;
  mem: number;
  status: "running" | "idle" | "stopped";
  pid: number;
  started: string;
}

interface Plugin {
  id: string;
  name: string;
  version: string;
  desc: string;
  installed: boolean;
  icon: string;
  color: string;
  size: string;
}

// ─── ПРИЛОЖЕНИЯ РАБОЧЕГО СТОЛА ───────────────────────────────────────────────
const DESKTOP_APPS = [
  { id: "terminal",  title: "Терминал ECSU",      icon: "Terminal",      color: "#00ff87", component: "terminal" },
  { id: "tasks",     title: "Диспетчер задач",    icon: "Cpu",           color: "#3b82f6", component: "tasks" },
  { id: "plugins",   title: "Менеджер модулей",   icon: "Puzzle",        color: "#a855f7", component: "plugins" },
  { id: "files",     title: "Файловый менеджер",  icon: "FolderOpen",    color: "#f59e0b", component: "files" },
  { id: "monitor",   title: "Монитор системы",    icon: "Activity",      color: "#06b6d4", component: "monitor" },
  { id: "network",   title: "Сетевой менеджер",   icon: "Wifi",          color: "#10b981", component: "network" },
  { id: "settings",  title: "Настройки ОС",       icon: "Settings",      color: "#64748b", component: "settings" },
  { id: "browser",   title: "ECSU Браузер",       icon: "Globe",         color: "#ec4899", component: "browser" },
  { id: "editor",    title: "Редактор",            icon: "FileEdit",      color: "#f59e0b", component: "editor" },
  { id: "calc",      title: "Калькулятор",         icon: "Calculator",    color: "#06b6d4", component: "calc" },
  { id: "aichat",    title: "AI Ассистент",        icon: "BrainCircuit",  color: "#a855f7", component: "aichat" },
  { id: "voice",     title: "Голосовой ввод",      icon: "Mic",           color: "#f43f5e", component: "voice" },
  { id: "loader",    title: "Загрузчик ECSU",      icon: "Code",          color: "#00ff87", component: "loader" },
  { id: "yura-vm",   title: "Юра · Виртуальная ВМ", icon: "Bot",           color: "#00ff87", component: "yura-vm" },
  { id: "install-pc", title: "Установка на ПК",    icon: "MonitorDown",   color: "#00ff87", component: "install-pc" },
];

const ECSU_APPS = [
  { id: "dashboard",  title: "Центр управления", icon: "LayoutDashboard", color: "#00ff87", path: "/egsu/dashboard" },
  { id: "cpvoa",      title: "ЦПВОА",            icon: "Radar",           color: "#2196F3", path: "/egsu/cpvoa" },
  { id: "security",   title: "Безопасность",      icon: "Shield",          color: "#a855f7", path: "/egsu/security" },
  { id: "finance",    title: "Финансы",           icon: "Wallet",          color: "#f59e0b", path: "/egsu/finance" },
  { id: "analytics",  title: "Аналитика",         icon: "BarChart3",       color: "#3b82f6", path: "/egsu/analytics" },
  { id: "emergency",  title: "Протоколы",         icon: "AlertTriangle",   color: "#f43f5e", path: "/egsu/emergency" },
  { id: "docs",       title: "Документы",         icon: "FileText",        color: "#10b981", path: "/egsu/docs" },
  { id: "ark",        title: "Ковчег",            icon: "Server",          color: "#8b5cf6", path: "/egsu/ark" },
  { id: "dalan",      title: "Далан-1",           icon: "BrainCircuit",    color: "#00ff87", path: "/egsu/dalan1" },
  { id: "monetize",   title: "Монетизация",       icon: "Banknote",        color: "#00ff87", path: "/egsu/monetize" },
  { id: "organs",     title: "Органы",            icon: "Building2",       color: "#06b6d4", path: "/egsu/organs" },
  { id: "fund",       title: "Фонд ДАЛАН",        icon: "Landmark",        color: "#10b981", path: "/egsu/fund" },
];

// ─── ПЛАГИНЫ ─────────────────────────────────────────────────────────────────
const AVAILABLE_PLUGINS: Plugin[] = [
  { id: "geo-tracker",   name: "GeoTracker",       version: "1.2.0", desc: "Геолокационный трекер инцидентов. Интеграция с GDACS, USGS.",       installed: true,  icon: "MapPin",       color: "#10b981", size: "2.4 MB" },
  { id: "ai-analyst",    name: "AI Analyst",        version: "2.0.1", desc: "Нейросетевой анализатор угроз. Основан на Далан-1.",               installed: true,  icon: "BrainCircuit", color: "#a855f7", size: "18.7 MB" },
  { id: "cve-monitor",   name: "CVE Monitor",       version: "1.0.5", desc: "Мониторинг уязвимостей NVD/NIST в реальном времени.",              installed: true,  icon: "ShieldAlert",  color: "#f43f5e", size: "1.1 MB" },
  { id: "crypto-vault",  name: "Crypto Vault",      version: "1.3.2", desc: "Зашифрованное хранилище документов. AES-256.",                    installed: false, icon: "Lock",         color: "#f59e0b", size: "3.2 MB" },
  { id: "p2p-mesh",      name: "P2P Mesh Network",  version: "0.9.0", desc: "Децентрализованная сеть узлов ECSU. WebRTC + E2E.",                installed: false, icon: "Network",      color: "#3b82f6", size: "8.9 MB" },
  { id: "bio-module",    name: "Bio Module",        version: "1.0.0", desc: "Анализ биометрических данных. Биологический суверенитет.",         installed: false, icon: "Dna",          color: "#00ff87", size: "45.2 MB" },
  { id: "legal-ai",      name: "Legal AI",          version: "1.1.3", desc: "ИИ-помощник по праву РФ, МГП, ЕКПЧ. Автосоставление документов.", installed: false, icon: "Scale",        color: "#06b6d4", size: "12.3 MB" },
  { id: "sat-comms",     name: "Sat Comms",         version: "0.5.0", desc: "Интерфейс спутниковых коммуникаций. Starlink / Iridium API.",      installed: false, icon: "Satellite",    color: "#ec4899", size: "6.7 MB" },
];

// ─── НАЧАЛЬНЫЕ ПРОЦЕССЫ ───────────────────────────────────────────────────────
const INIT_PROCESSES: Process[] = [
  { id: "kernel",    name: "ecsu-kernel",       cpu: 0.2,  mem: 128,  status: "running", pid: 1,    started: "00:00:01" },
  { id: "dalan",     name: "dalan1-daemon",     cpu: 3.4,  mem: 512,  status: "running", pid: 42,   started: "00:00:03" },
  { id: "cpvoa",     name: "cpvoa-monitor",     cpu: 1.1,  mem: 256,  status: "running", pid: 88,   started: "00:00:05" },
  { id: "cve",       name: "cve-watcher",       cpu: 0.8,  mem: 96,   status: "running", pid: 103,  started: "00:00:07" },
  { id: "geo",       name: "geo-tracker",       cpu: 0.3,  mem: 64,   status: "idle",    pid: 156,  started: "00:00:10" },
  { id: "auth",      name: "auth-service",      cpu: 0.1,  mem: 48,   status: "running", pid: 201,  started: "00:00:12" },
  { id: "sync",      name: "ecsu-sync",         cpu: 2.2,  mem: 320,  status: "running", pid: 299,  started: "00:00:15" },
  { id: "net",       name: "network-guard",     cpu: 0.5,  mem: 80,   status: "running", pid: 340,  started: "00:00:18" },
  { id: "db",        name: "postgres-proxy",    cpu: 1.7,  mem: 640,  status: "running", pid: 400,  started: "00:00:20" },
  { id: "fund",      name: "fund-watcher",      cpu: 0.2,  mem: 32,   status: "idle",    pid: 512,  started: "00:00:25" },
];

// ─── ТЕРМИНАЛ КОМАНДЫ ─────────────────────────────────────────────────────────
const TERMINAL_HELP = `
ECSU OS v2.0 — Терминал владельца
══════════════════════════════════
Доступные команды:
  help          — эта справка
  status        — статус всех сервисов
  ps            — список процессов
  restart <srv> — перезапустить сервис
  stop <srv>    — остановить сервис
  start <srv>   — запустить сервис
  clear         — очистить терминал
  whoami        — информация о владельце
  uptime        — время работы системы
  netstat       — сетевые соединения
  modules       — установленные модули
  version       — версия ECSU OS
  boot          — протокол загрузки
`.trim();

let zTop = 100;

export default function EgsuOS() {
  const navigate = useNavigate();
  const [desktop, setDesktop] = useState<1 | 2>(1);
  const [windows, setWindows] = useState<WinState[]>([]);
  const [processes, setProcesses] = useState<Process[]>(INIT_PROCESSES);
  const [plugins, setPlugins] = useState<Plugin[]>(AVAILABLE_PLUGINS);
  const [time, setTime] = useState(new Date());
  const [bootDone, setBootDone] = useState(false);
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [termHistory, setTermHistory] = useState<{ type: "cmd" | "out" | "err"; text: string }[]>([
    { type: "out", text: "ECSU OS v2.0 · Nikolaev V.V. · Добро пожаловать, Владелец" },
    { type: "out", text: 'Введите "help" для списка команд.' },
  ]);
  const [termInput, setTermInput] = useState("");
  const [termCmdHistory, setTermCmdHistory] = useState<string[]>([]);
  const [termHistIdx, setTermHistIdx] = useState(-1);
  const termEndRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ winId: string; ox: number; oy: number } | null>(null);

  // Загрузка системы
  useEffect(() => {
    const lines = [
      "[  0.001] ECSU-OS kernel loading...",
      "[  0.043] Initializing memory subsystem... OK",
      "[  0.112] Loading ECSU core modules...",
      "[  0.234] Starting dalan1-daemon... OK",
      "[  0.389] Starting cpvoa-monitor... OK",
      "[  0.445] Starting cve-watcher... OK",
      "[  0.502] Starting auth-service... OK",
      "[  0.588] Starting postgres-proxy... OK",
      "[  0.712] Starting network-guard... OK",
      "[  0.834] Starting ecsu-sync... OK",
      "[  0.901] All services started successfully.",
      "[  1.024] ECSU OS v2.0 ready. Welcome, Владелец.",
    ];
    let i = 0;
    const t = setInterval(() => {
      if (i < lines.length) {
        setBootLines(p => [...p, lines[i]]);
        i++;
      } else {
        clearInterval(t);
        setTimeout(() => setBootDone(true), 600);
      }
    }, 120);
    return () => clearInterval(t);
  }, []);

  // Часы
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Симуляция CPU
  useEffect(() => {
    const t = setInterval(() => {
      setProcesses(ps => ps.map(p => ({
        ...p,
        cpu: p.status === "running" ? Math.max(0.1, Math.min(15, p.cpu + (Math.random() - 0.5) * 1.5)) : 0,
        mem: p.status === "running" ? Math.max(20, Math.min(800, p.mem + (Math.random() - 0.5) * 10)) : p.mem,
      })));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { termEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [termHistory]);

  // ─── УПРАВЛЕНИЕ ОКНАМИ ────────────────────────────────────────────────────
  function openWindow(app: typeof DESKTOP_APPS[0]) {
    const existing = windows.find(w => w.id === app.id);
    if (existing) {
      setWindows(ws => ws.map(w => w.id === app.id ? { ...w, minimized: false, zIndex: ++zTop } : w));
      return;
    }
    const w: WinState = {
      id: app.id, title: app.title, icon: app.icon, color: app.color,
      x: 60 + windows.length * 30, y: 60 + windows.length * 25,
      w: app.component === "terminal" ? 720 : app.component === "tasks" ? 740 : 680,
      h: app.component === "terminal" ? 460 : app.component === "tasks" ? 480 : 440,
      minimized: false, maximized: false, zIndex: ++zTop, component: app.component,
    };
    setWindows(ws => [...ws, w]);
  }

  function closeWindow(id: string) { setWindows(ws => ws.filter(w => w.id !== id)); }
  function minimizeWindow(id: string) { setWindows(ws => ws.map(w => w.id === id ? { ...w, minimized: true } : w)); }
  function maximizeWindow(id: string) { setWindows(ws => ws.map(w => w.id === id ? { ...w, maximized: !w.maximized } : w)); }
  function focusWindow(id: string) { setWindows(ws => ws.map(w => w.id === id ? { ...w, zIndex: ++zTop } : w)); }

  // ─── DRAG ─────────────────────────────────────────────────────────────────
  const onDragStart = useCallback((e: React.MouseEvent, winId: string) => {
    const win = windows.find(w => w.id === winId);
    if (!win || win.maximized) return;
    dragRef.current = { winId, ox: e.clientX - win.x, oy: e.clientY - win.y };
    focusWindow(winId);
  }, [windows]);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { winId, ox, oy } = dragRef.current;
      setWindows(ws => ws.map(w => w.id === winId ? { ...w, x: e.clientX - ox, y: e.clientY - oy } : w));
    };
    const up = () => { dragRef.current = null; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, []);

  // ─── ТЕРМИНАЛ ─────────────────────────────────────────────────────────────
  function execCmd(raw: string) {
    const cmd = raw.trim();
    if (!cmd) return;
    setTermCmdHistory(h => [cmd, ...h]);
    setTermHistIdx(-1);
    setTermHistory(h => [...h, { type: "cmd", text: `nvv@ecsu-os:~$ ${cmd}` }]);
    const [c, ...args] = cmd.toLowerCase().split(" ");
    let out: { type: "cmd" | "out" | "err"; text: string }[] = [];
    switch (c) {
      case "help":
        out = TERMINAL_HELP.split("\n").map(t => ({ type: "out" as const, text: t }));
        break;
      case "clear":
        setTermHistory([{ type: "out", text: "ECSU OS v2.0 · Терминал очищен." }]);
        setTermInput("");
        return;
      case "whoami":
        out = [
          { type: "out", text: "Пользователь: nvv (Николаев Владимир Владимирович)" },
          { type: "out", text: "Роль: OWNER · Уровень доступа: SUPREME" },
          { type: "out", text: "Система: ECSU OS v2.0" },
          { type: "out", text: "Права: ALL_ACCESS · KERNEL_CONTROL · DEPLOY_OK" },
        ];
        break;
      case "status":
        out = processes.map(p => ({
          type: "out" as const,
          text: `  ${p.status === "running" ? "●" : "○"} ${p.name.padEnd(20)} PID:${String(p.pid).padEnd(6)} CPU:${p.cpu.toFixed(1).padStart(5)}%  MEM:${p.mem.toFixed(0).padStart(4)}MB  ${p.status.toUpperCase()}`,
        }));
        out.unshift({ type: "out", text: "  СЕРВИС               PID    CPU      MEM    СТАТУС" });
        break;
      case "ps":
        out = processes.map(p => ({
          type: "out" as const,
          text: `  ${String(p.pid).padStart(5)}  ${p.name}`,
        }));
        out.unshift({ type: "out", text: "  PID    COMMAND" });
        break;
      case "restart":
        if (!args[0]) { out = [{ type: "err", text: "Укажи сервис: restart <имя>" }]; break; }
        out = [{ type: "out", text: `Перезапуск ${args[0]}... OK` }];
        setProcesses(ps => ps.map(p => p.name.includes(args[0]) ? { ...p, status: "running", cpu: 0.5 } : p));
        break;
      case "stop":
        if (!args[0]) { out = [{ type: "err", text: "Укажи сервис: stop <имя>" }]; break; }
        out = [{ type: "out", text: `Остановка ${args[0]}... OK` }];
        setProcesses(ps => ps.map(p => p.name.includes(args[0]) ? { ...p, status: "stopped", cpu: 0 } : p));
        break;
      case "start":
        if (!args[0]) { out = [{ type: "err", text: "Укажи сервис: start <имя>" }]; break; }
        out = [{ type: "out", text: `Запуск ${args[0]}... OK` }];
        setProcesses(ps => ps.map(p => p.name.includes(args[0]) ? { ...p, status: "running", cpu: 0.5 } : p));
        break;
      case "modules":
        out = plugins.filter(p => p.installed).map(p => ({ type: "out" as const, text: `  ✓ ${p.name.padEnd(20)} v${p.version}  ${p.size}` }));
        out.unshift({ type: "out", text: "  Установленные модули:" });
        break;
      case "version":
        out = [
          { type: "out", text: "ECSU OS v2.0.0 (build 20260429)" },
          { type: "out", text: "Kernel: ecsu-kernel 2.0 · Runtime: Electron 28 / Chromium 120" },
          { type: "out", text: "Автор: Николаев В.В. · © 2026" },
        ];
        break;
      case "uptime":
        out = [{ type: "out", text: `Время работы: ${Math.floor((Date.now() % 86400000) / 3600000)}ч ${Math.floor((Date.now() % 3600000) / 60000)}м · Загрузка: ${(processes.reduce((s, p) => s + p.cpu, 0) / processes.length).toFixed(1)}%` }];
        break;
      case "netstat":
        out = [
          { type: "out", text: "  СОЕДИНЕНИЕ                          СТАТУС" },
          { type: "out", text: "  functions.poehali.dev:443           ESTABLISHED" },
          { type: "out", text: "  cdn.poehali.dev:443                 ESTABLISHED" },
          { type: "out", text: "  nist.gov:443                        TIME_WAIT" },
          { type: "out", text: "  gdacs.org:443                       ESTABLISHED" },
        ];
        break;
      case "boot":
        out = bootLines.map(l => ({ type: "out" as const, text: l }));
        break;
      default:
        out = [{ type: "err", text: `ecsu-os: команда не найдена: ${c}. Попробуй "help".` }];
    }
    setTermHistory(h => [...h, ...out]);
    setTermInput("");
  }

  const totalCpu = processes.reduce((s, p) => s + p.cpu, 0);
  const totalMem = processes.reduce((s, p) => s + p.mem, 0);
  const runningCount = processes.filter(p => p.status === "running").length;

  // ─── BOOT SCREEN ─────────────────────────────────────────────────────────
  if (!bootDone) {
    return (
      <div className="fixed inset-0 flex flex-col justify-center items-start px-8 font-mono"
        style={{ background: "#000", color: "#00ff87", fontSize: 13 }}>
        <div className="mb-6">
          <div className="text-2xl font-black mb-1" style={{ color: "#00ff87", letterSpacing: 4 }}>ECSU OS v2.0</div>
          <div style={{ color: "#ffffff40" }}>Nikolaev V.V. · Система запускается...</div>
        </div>
        <div className="space-y-0.5">
          {bootLines.map((l, i) => (
            <div key={i} style={{ color: l.includes("OK") ? "#00ff87" : l.includes("ready") ? "#ffffff" : "#ffffff80", opacity: 0.9 }}>{l}</div>
          ))}
          <div className="mt-2" style={{ color: "#00ff87" }}>█</div>
        </div>
      </div>
    );
  }

  // ─── ОС ИНТЕРФЕЙС ────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 overflow-hidden select-none"
      style={{ background: desktop === 1 ? "linear-gradient(135deg, #060a12 0%, #0d1424 50%, #060a12 100%)" : "linear-gradient(135deg, #0a0612 0%, #120a24 50%, #0a0612 100%)", fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}>

      {/* ─── ФОНОВЫЕ СЕТКИ ─── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: desktop === 1
          ? "linear-gradient(rgba(0,255,135,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,135,0.03) 1px, transparent 1px)"
          : "linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      {/* ─── TASKBAR ──────────────────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-12 flex items-center px-3 gap-2 z-50"
        style={{ background: "rgba(6,10,18,0.97)", borderTop: "1px solid rgba(0,255,135,0.1)", backdropFilter: "blur(20px)" }}>

        {/* Логотип */}
        <button onClick={() => navigate("/egsu/start")}
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all hover:scale-110"
          style={{ background: "linear-gradient(135deg, #00ff87, #3b82f6)" }}>
          <Icon name="Zap" size={14} className="text-black" />
        </button>

        {/* Переключатель рабочих столов */}
        <div className="flex gap-1 mx-1">
          {([1, 2] as const).map(d => (
            <button key={d} onClick={() => setDesktop(d)}
              className="w-6 h-6 rounded text-xs font-bold transition-all"
              style={{
                background: desktop === d ? "rgba(0,255,135,0.15)" : "rgba(255,255,255,0.04)",
                color: desktop === d ? "#00ff87" : "rgba(255,255,255,0.3)",
                border: `1px solid ${desktop === d ? "rgba(0,255,135,0.3)" : "rgba(255,255,255,0.08)"}`,
              }}>
              {d}
            </button>
          ))}
        </div>

        <div className="w-px h-6" style={{ background: "rgba(255,255,255,0.08)" }} />

        {/* Открытые окна */}
        <div className="flex gap-1 flex-1 overflow-x-auto">
          {windows.map(w => (
            <button key={w.id}
              onClick={() => w.minimized ? setWindows(ws => ws.map(x => x.id === w.id ? { ...x, minimized: false, zIndex: ++zTop } : x)) : minimizeWindow(w.id)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all shrink-0"
              style={{
                background: w.minimized ? "rgba(255,255,255,0.03)" : `${w.color}12`,
                color: w.minimized ? "rgba(255,255,255,0.3)" : w.color,
                border: `1px solid ${w.minimized ? "rgba(255,255,255,0.06)" : w.color + "30"}`,
                maxWidth: 120,
              }}>
              <Icon name={w.icon as any} size={11} />
              <span className="truncate">{w.title}</span>
            </button>
          ))}
        </div>

        {/* Системные иконки */}
        <div className="flex items-center gap-3 ml-2 shrink-0">
          <div className="flex items-center gap-1" style={{ color: totalCpu > 20 ? "#f43f5e" : "#00ff87" }}>
            <Icon name="Cpu" size={11} />
            <span className="text-xs">{totalCpu.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-1" style={{ color: "#3b82f6" }}>
            <Icon name="MemoryStick" size={11} />
            <span className="text-xs">{(totalMem / 1024).toFixed(1)}GB</span>
          </div>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            {time.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
          {/* Кнопки управления окном Electron */}
          {typeof (window as any).ecsuOS !== "undefined" && (
            <div className="flex items-center gap-1 ml-2">
              <button onClick={() => (window as any).ecsuOS.minimize()}
                className="w-6 h-6 rounded-md flex items-center justify-center transition-all hover:scale-110"
                style={{ background: "rgba(255,193,7,0.15)", color: "#ffc107" }} title="Свернуть">
                <Icon name="Minus" size={10} />
              </button>
              <button onClick={() => (window as any).ecsuOS.maximize()}
                className="w-6 h-6 rounded-md flex items-center justify-center transition-all hover:scale-110"
                style={{ background: "rgba(0,255,135,0.15)", color: "#00ff87" }} title="Полный экран">
                <Icon name="Maximize2" size={10} />
              </button>
              <button onClick={() => (window as any).ecsuOS.close()}
                className="w-6 h-6 rounded-md flex items-center justify-center transition-all hover:scale-110"
                style={{ background: "rgba(244,63,94,0.15)", color: "#f43f5e" }} title="Закрыть">
                <Icon name="X" size={10} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── РАБОЧИЙ СТОЛ 1 (ОС) ────────────────────────────────────────── */}
      {desktop === 1 && (
        <div className="absolute inset-0 pb-12 p-4">
          <div className="grid grid-cols-8 gap-3 mt-2">
            {DESKTOP_APPS.map(app => (
              <button key={app.id} onDoubleClick={() => openWindow(app)}
                onClick={() => openWindow(app)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all hover:scale-105 active:scale-95"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${app.color}15`, border: `1px solid ${app.color}30` }}>
                  <Icon name={app.icon as any} size={22} style={{ color: app.color }} />
                </div>
                <span className="text-xs text-center leading-tight" style={{ color: "rgba(255,255,255,0.7)", fontSize: 10 }}>
                  {app.title}
                </span>
              </button>
            ))}
          </div>

          {/* Мини-виджет статуса */}
          <div className="absolute bottom-16 right-4 p-3 rounded-2xl" style={{ background: "rgba(0,255,135,0.04)", border: "1px solid rgba(0,255,135,0.1)", width: 200 }}>
            <div className="text-xs mb-2" style={{ color: "rgba(0,255,135,0.6)" }}>ECSU OS · Статус</div>
            {[
              { label: "Процессов", val: `${runningCount}/${processes.length}`, color: "#00ff87" },
              { label: "CPU", val: `${totalCpu.toFixed(1)}%`, color: totalCpu > 20 ? "#f43f5e" : "#00ff87" },
              { label: "Память", val: `${(totalMem / 1024).toFixed(1)} GB`, color: "#3b82f6" },
              { label: "Модули", val: `${plugins.filter(p => p.installed).length}/${plugins.length}`, color: "#a855f7" },
            ].map(s => (
              <div key={s.label} className="flex justify-between items-center py-0.5">
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</span>
                <span className="text-xs font-bold" style={{ color: s.color }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── РАБОЧИЙ СТОЛ 2 (ECSU) ──────────────────────────────────────── */}
      {desktop === 2 && (
        <div className="absolute inset-0 pb-12 p-4 overflow-auto">
          <div className="text-center mb-4">
            <div className="text-xs" style={{ color: "rgba(168,85,247,0.6)", letterSpacing: 4 }}>ECSU 2.0 · РАБОЧИЙ СТОЛ СИСТЕМЫ</div>
          </div>
          <div className="grid grid-cols-4 gap-3 max-w-2xl mx-auto">
            {ECSU_APPS.map(app => (
              <button key={app.id} onClick={() => navigate(app.path)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all hover:scale-105 active:scale-95"
                style={{ background: `${app.color}08`, border: `1px solid ${app.color}20` }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: `${app.color}15` }}>
                  <Icon name={app.icon as any} size={22} style={{ color: app.color }} />
                </div>
                <span className="text-xs text-center leading-tight" style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
                  {app.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── ОКНА ─────────────────────────────────────────────────────────── */}
      {windows.map(win => {
        if (win.minimized) return null;
        const style: React.CSSProperties = win.maximized
          ? { position: "fixed", left: 0, top: 0, right: 0, bottom: 48, width: "100%", height: "calc(100% - 48px)", zIndex: win.zIndex }
          : { position: "fixed", left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.zIndex };

        return (
          <div key={win.id} style={style}
            className="flex flex-col rounded-xl overflow-hidden shadow-2xl"
            onClick={() => focusWindow(win.id)}
            onMouseDown={() => focusWindow(win.id)}
            style={{ ...style, background: "rgba(8,12,24,0.98)", border: `1px solid ${win.color}25`, backdropFilter: "blur(20px)" }}>

            {/* Заголовок окна */}
            <div className="flex items-center gap-2 px-3 py-2 shrink-0 cursor-move"
              style={{ background: `${win.color}08`, borderBottom: `1px solid ${win.color}15` }}
              onMouseDown={e => { e.preventDefault(); onDragStart(e, win.id); }}>
              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: `${win.color}20` }}>
                <Icon name={win.icon as any} size={11} style={{ color: win.color }} />
              </div>
              <span className="text-xs font-semibold flex-1" style={{ color: win.color }}>{win.title}</span>
              <div className="flex gap-1.5">
                <button onClick={() => minimizeWindow(win.id)}
                  className="w-3 h-3 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                  style={{ background: "#f59e0b" }} />
                <button onClick={() => maximizeWindow(win.id)}
                  className="w-3 h-3 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                  style={{ background: "#10b981" }} />
                <button onClick={() => closeWindow(win.id)}
                  className="w-3 h-3 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                  style={{ background: "#f43f5e" }} />
              </div>
            </div>

            {/* Содержимое окна */}
            <div className="flex-1 overflow-hidden">
              {win.component === "terminal" && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-0.5" style={{ background: "#020408" }}>
                    {termHistory.map((line, i) => (
                      <div key={i} style={{
                        color: line.type === "cmd" ? "#00ff87" : line.type === "err" ? "#f43f5e" : "rgba(255,255,255,0.7)",
                        whiteSpace: "pre",
                      }}>{line.text}</div>
                    ))}
                    <div ref={termEndRef} />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 font-mono text-xs" style={{ background: "#020408", borderTop: "1px solid rgba(0,255,135,0.1)" }}>
                    <span style={{ color: "#00ff87" }}>nvv@ecsu-os:~$</span>
                    <input autoFocus value={termInput} onChange={e => setTermInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") { execCmd(termInput); }
                        if (e.key === "ArrowUp") {
                          const idx = Math.min(termHistIdx + 1, termCmdHistory.length - 1);
                          setTermHistIdx(idx);
                          setTermInput(termCmdHistory[idx] || "");
                        }
                        if (e.key === "ArrowDown") {
                          const idx = Math.max(termHistIdx - 1, -1);
                          setTermHistIdx(idx);
                          setTermInput(idx === -1 ? "" : termCmdHistory[idx] || "");
                        }
                      }}
                      className="flex-1 bg-transparent outline-none text-white caret-green-400" />
                  </div>
                </div>
              )}

              {win.component === "tasks" && (
                <div className="h-full overflow-auto p-3">
                  <div className="flex gap-4 mb-3">
                    {[
                      { l: "CPU", v: `${totalCpu.toFixed(1)}%`, c: "#3b82f6", w: Math.min(100, totalCpu * 5) },
                      { l: "Память", v: `${(totalMem / 1024).toFixed(1)} GB`, c: "#a855f7", w: Math.min(100, totalMem / 30) },
                      { l: "Процессов", v: `${runningCount}`, c: "#00ff87", w: (runningCount / processes.length) * 100 },
                    ].map(s => (
                      <div key={s.l} className="flex-1 p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{s.l}</span>
                          <span className="text-xs font-bold" style={{ color: s.c }}>{s.v}</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-1.5 rounded-full transition-all" style={{ width: `${s.w}%`, background: s.c }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <div className="grid text-xs px-2 pb-1" style={{ gridTemplateColumns: "80px 1fr 70px 70px 80px", color: "rgba(255,255,255,0.3)" }}>
                      <span>PID</span><span>Процесс</span><span>CPU</span><span>Память</span><span>Статус</span>
                    </div>
                    {processes.map(p => (
                      <div key={p.id} className="grid items-center px-2 py-1.5 rounded-lg text-xs"
                        style={{ gridTemplateColumns: "80px 1fr 70px 70px 80px", background: "rgba(255,255,255,0.02)" }}>
                        <span style={{ color: "rgba(255,255,255,0.3)" }}>{p.pid}</span>
                        <span style={{ color: "rgba(255,255,255,0.8)" }}>{p.name}</span>
                        <span style={{ color: p.cpu > 5 ? "#f43f5e" : "#00ff87" }}>{p.cpu.toFixed(1)}%</span>
                        <span style={{ color: "#3b82f6" }}>{p.mem.toFixed(0)} MB</span>
                        <span className="px-1.5 py-0.5 rounded text-center" style={{
                          background: p.status === "running" ? "rgba(0,255,135,0.1)" : p.status === "idle" ? "rgba(245,158,11,0.1)" : "rgba(244,63,94,0.1)",
                          color: p.status === "running" ? "#00ff87" : p.status === "idle" ? "#f59e0b" : "#f43f5e",
                        }}>
                          {p.status === "running" ? "●" : p.status === "idle" ? "◌" : "✕"} {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {win.component === "plugins" && (
                <div className="h-full overflow-auto p-3 space-y-2">
                  <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Установлено: {plugins.filter(p => p.installed).length} · Доступно: {plugins.filter(p => !p.installed).length}
                  </div>
                  {plugins.map(pl => (
                    <div key={pl.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${pl.installed ? pl.color + "20" : "rgba(255,255,255,0.05)"}` }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${pl.color}12` }}>
                        <Icon name={pl.icon as any} size={16} style={{ color: pl.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>{pl.name}</span>
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>v{pl.version}</span>
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>{pl.size}</span>
                        </div>
                        <div className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{pl.desc}</div>
                      </div>
                      <button onClick={() => setPlugins(ps => ps.map(p => p.id === pl.id ? { ...p, installed: !p.installed } : p))}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all"
                        style={{
                          background: pl.installed ? "rgba(244,63,94,0.1)" : `${pl.color}15`,
                          color: pl.installed ? "#f43f5e" : pl.color,
                          border: `1px solid ${pl.installed ? "rgba(244,63,94,0.2)" : pl.color + "30"}`,
                        }}>
                        {pl.installed ? "Удалить" : "Установить"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {win.component === "files" && (
                <div className="h-full p-3 font-mono">
                  <div className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>/ · корень файловой системы ECSU</div>
                  {[
                    { name: "bin/",     icon: "Folder",   color: "#f59e0b", desc: "Исполняемые файлы системы" },
                    { name: "etc/",     icon: "Folder",   color: "#f59e0b", desc: "Конфигурация и настройки" },
                    { name: "var/",     icon: "Folder",   color: "#f59e0b", desc: "Переменные данные, логи" },
                    { name: "modules/", icon: "Puzzle",   color: "#a855f7", desc: "Установленные модули" },
                    { name: "data/",    icon: "Database", color: "#3b82f6", desc: "Данные ECSU · Шифрованы AES-256" },
                    { name: "keys/",    icon: "Key",      color: "#f43f5e", desc: "Ключи и сертификаты · SECRET" },
                    { name: "logs/",    icon: "FileText", color: "#10b981", desc: "Журналы системы" },
                    { name: "boot/",    icon: "Zap",      color: "#00ff87", desc: "Загрузочные файлы ядра" },
                  ].map(f => (
                    <div key={f.name} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-colors">
                      <Icon name={f.icon as any} size={14} style={{ color: f.color }} />
                      <span className="text-xs w-24" style={{ color: f.color }}>{f.name}</span>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{f.desc}</span>
                    </div>
                  ))}
                </div>
              )}

              {win.component === "monitor" && (
                <div className="h-full p-3 overflow-auto">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { l: "Uptime", v: `${Math.floor((Date.now() % 86400000) / 3600000)}ч ${Math.floor((Date.now() % 3600000) / 60000)}м`, c: "#00ff87" },
                      { l: "Версия", v: "2.0.0", c: "#a855f7" },
                      { l: "CPU Total", v: `${totalCpu.toFixed(1)}%`, c: "#3b82f6" },
                      { l: "RAM Used", v: `${(totalMem / 1024).toFixed(1)} GB`, c: "#f59e0b" },
                    ].map(s => (
                      <div key={s.l} className="p-3 rounded-xl text-center" style={{ background: `${s.c}08`, border: `1px solid ${s.c}20` }}>
                        <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{s.l}</div>
                        <div className="font-bold mt-0.5" style={{ color: s.c }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs px-2 py-1 mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Активные соединения</div>
                  {["functions.poehali.dev · HTTPS · 443", "cdn.poehali.dev · CDN · 443", "gdacs.org · API · 443", "nist.gov · CVE · 443"].map(c => (
                    <div key={c} className="flex items-center gap-2 px-2 py-1 rounded text-xs">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#00ff87" }} />
                      <span style={{ color: "rgba(255,255,255,0.5)" }}>{c}</span>
                    </div>
                  ))}
                </div>
              )}

              {win.component === "network" && (
                <div className="h-full p-4 space-y-3">
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Сетевые интерфейсы</div>
                  {[
                    { name: "ecsu0",  ip: "10.0.0.1",      mac: "00:EC:SU:20:26:01", status: true,  speed: "1 Gbps" },
                    { name: "tun0",   ip: "172.16.0.1",    mac: "TUN/VPN",            status: true,  speed: "100 Mbps" },
                    { name: "lo",     ip: "127.0.0.1",     mac: "loopback",           status: true,  speed: "∞" },
                    { name: "mesh0",  ip: "192.168.99.1",  mac: "P2P-Mesh",           status: false, speed: "—" },
                  ].map(iface => (
                    <div key={iface.name} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${iface.status ? "rgba(0,255,135,0.15)" : "rgba(255,255,255,0.05)"}` }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold" style={{ color: iface.status ? "#00ff87" : "rgba(255,255,255,0.3)" }}>{iface.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: iface.status ? "rgba(0,255,135,0.1)" : "rgba(255,255,255,0.05)", color: iface.status ? "#00ff87" : "rgba(255,255,255,0.3)" }}>
                          {iface.status ? "UP" : "DOWN"}
                        </span>
                      </div>
                      <div className="text-xs space-y-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                        <div>IP: {iface.ip} · {iface.mac}</div>
                        <div>Скорость: {iface.speed}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {win.component === "settings" && (
                <div className="h-full p-4 overflow-auto space-y-3">
                  <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Настройки ECSU OS</div>
                  {[
                    { l: "Владелец", v: "nvv · Николаев В.В." },
                    { l: "Версия ОС", v: "ECSU OS v2.0.0" },
                    { l: "Сборка", v: "20260429-stable" },
                    { l: "Среда", v: "Electron 28 · Chromium 120" },
                    { l: "Платформа", v: typeof navigator !== "undefined" ? navigator.platform : "Unknown" },
                    { l: "Модулей установлено", v: `${plugins.filter(p => p.installed).length}` },
                    { l: "Процессов запущено", v: `${runningCount}` },
                    { l: "Сессия", v: new Date().toLocaleDateString("ru-RU") },
                  ].map(s => (
                    <div key={s.l} className="flex justify-between items-center py-2 px-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{s.l}</span>
                      <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>{s.v}</span>
                    </div>
                  ))}
                  <div className="mt-4 p-3 rounded-xl" style={{ background: "rgba(0,255,135,0.04)", border: "1px solid rgba(0,255,135,0.1)" }}>
                    <div className="text-xs font-semibold mb-1" style={{ color: "#00ff87" }}>Установка на ПК</div>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Для установки ECSU OS как desktop-приложения — нажмите «Скачать» в меню Опубликовать и используйте Electron-сборку.
                    </div>
                  </div>
                </div>
              )}

              {win.component === "browser" && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center gap-2 p-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <Icon name="Lock" size={11} style={{ color: "#00ff87" }} />
                    <div className="flex-1 px-3 py-1 rounded-lg text-xs" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)" }}>
                      ecsu-os://home
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center" style={{ background: "#020408" }}>
                    <div className="text-center">
                      <div className="text-4xl font-black mb-2" style={{ color: "rgba(0,255,135,0.15)", letterSpacing: 6 }}>ECSU</div>
                      <div className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Встроенный браузер системы</div>
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        {ECSU_APPS.slice(0, 6).map(a => (
                          <button key={a.id} onClick={() => navigate(a.path)}
                            className="px-3 py-2 rounded-xl text-xs transition-all hover:scale-105"
                            style={{ background: `${a.color}10`, color: a.color, border: `1px solid ${a.color}20` }}>
                            {a.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {win.component === "loader" && (
                <div className="h-full overflow-auto p-4" style={{ background: "#020408" }}>
                  <LoaderTab />
                </div>
              )}
              {win.component === "editor" && <EditorApp />}
              {win.component === "calc" && <CalcApp />}
              {win.component === "aichat" && <AiChatApp />}
              {win.component === "voice" && <VoiceApp />}
              {win.component === "yura-vm" && <YuraVM />}
              {win.component === "install-pc" && <InstallPCApp />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── РЕДАКТОР ────────────────────────────────────────────────────────────────
function EditorApp() {
  const [text, setText] = useState("// ECSU OS · Редактор документов\n// Владелец: Николаев В.В.\n\n");
  const [filename, setFilename] = useState("document.txt");
  const [saved, setSaved] = useState(false);

  function save() {
    localStorage.setItem(`ecsu-editor-${filename}`, text);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function download() {
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }

  return (
    <div className="h-full flex flex-col" style={{ background: "#020408" }}>
      <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ borderBottom: "1px solid rgba(245,158,11,0.1)" }}>
        <input value={filename} onChange={e => setFilename(e.target.value)}
          className="bg-transparent outline-none text-xs px-2 py-1 rounded-lg"
          style={{ color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)", width: 160 }} />
        <div className="flex-1" />
        <span className="text-xs" style={{ color: saved ? "#00ff87" : "transparent" }}>✓ Сохранено</span>
        <button onClick={save} className="px-2 py-1 rounded-lg text-xs" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>Сохранить</button>
        <button onClick={download} className="px-2 py-1 rounded-lg text-xs" style={{ background: "rgba(0,255,135,0.08)", color: "#00ff87" }}>Скачать</button>
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)}
        className="flex-1 p-4 resize-none outline-none font-mono text-xs"
        style={{ background: "#020408", color: "rgba(255,255,255,0.8)", lineHeight: 1.7 }}
        spellCheck={false} />
      <div className="flex items-center gap-4 px-3 py-1 text-xs shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.2)" }}>
        <span>Строк: {text.split("\n").length}</span>
        <span>Символов: {text.length}</span>
        <span>UTF-8</span>
      </div>
    </div>
  );
}

// ─── КАЛЬКУЛЯТОР ─────────────────────────────────────────────────────────────
function CalcApp() {
  const [display, setDisplay] = useState("0");
  const [expr, setExpr] = useState("");
  const [fresh, setFresh] = useState(true);

  function press(val: string) {
    if (val === "C") { setDisplay("0"); setExpr(""); setFresh(true); return; }
    if (val === "=") {
      try {
         
        const res = eval(expr + display);
        setExpr("");
        setDisplay(String(parseFloat(res.toFixed(10))));
        setFresh(true);
      } catch { setDisplay("Ошибка"); setExpr(""); setFresh(true); }
      return;
    }
    if (["+", "-", "×", "÷", "%"].includes(val)) {
      const op = val === "×" ? "*" : val === "÷" ? "/" : val;
      setExpr(expr + display + op);
      setFresh(true);
      return;
    }
    if (val === "±") { setDisplay(d => d.startsWith("-") ? d.slice(1) : "-" + d); return; }
    if (val === "." && display.includes(".")) return;
    if (fresh) { setDisplay(val === "." ? "0." : val); setFresh(false); }
    else setDisplay(d => d === "0" && val !== "." ? val : d + val);
  }

  const BTNS = [
    ["C", "±", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["0", ".", "="],
  ];

  return (
    <div className="h-full flex flex-col p-3 gap-2" style={{ background: "#020408" }}>
      <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)" }}>
        <div className="text-xs text-right mb-1" style={{ color: "rgba(255,255,255,0.2)", minHeight: 16 }}>{expr}</div>
        <div className="text-right text-3xl font-bold truncate" style={{ color: "#06b6d4" }}>{display}</div>
      </div>
      <div className="flex-1 flex flex-col gap-2">
        {BTNS.map((row, i) => (
          <div key={i} className="flex gap-2 flex-1">
            {row.map(b => (
              <button key={b} onClick={() => press(b)}
                className="flex-1 rounded-2xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                style={{
                  background: b === "=" ? "#06b6d4" : ["+", "-", "×", "÷", "%", "±"].includes(b) ? "rgba(6,182,212,0.15)" : b === "C" ? "rgba(244,63,94,0.15)" : "rgba(255,255,255,0.05)",
                  color: b === "=" ? "#000" : b === "C" ? "#f43f5e" : ["+", "-", "×", "÷", "%", "±"].includes(b) ? "#06b6d4" : "rgba(255,255,255,0.8)",
                }}>
                {b}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AI АССИСТЕНТ ─────────────────────────────────────────────────────────────
function AiChatApp() {
  const [msgs, setMsgs] = useState([
    { role: "ai", text: "Привет, Владелец. Я AI-ассистент ECSU OS на базе Далан-1. Чем могу помочь?" },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const RESPONSES: Record<string, string> = {
    "статус": "Все системы ECSU работают в штатном режиме. CPU: в норме. Память: в норме. Сеть: активна.",
    "помощь": "Я могу помочь с: управлением ECSU, анализом угроз, правовыми вопросами, навигацией по системе.",
    "далан": "Далан-1 — нейросетевое ядро ECSU. Версия 2.0. Работает в штатном режиме. Готов к аналитическим задачам.",
    "угроза": "Анализирую угрозы... CVE-2024-0001: патч установлен. Внешних атак не обнаружено. Система защищена.",
    "финансы": "Для управления финансами перейди в модуль Финансы. Счета активны, транзакции в норме.",
    "безопасность": "Уровень защиты: МАКСИМАЛЬНЫЙ. Firewall: активен. VPN: включён. Шифрование AES-256: активно.",
  };

  function send() {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input };
    setMsgs(m => [...m, userMsg]);
    const q = input.toLowerCase();
    let reply = "Обрабатываю запрос... Для детальной аналитики обратись к модулю Далан-1 в разделе ECSU.";
    for (const key of Object.keys(RESPONSES)) {
      if (q.includes(key)) { reply = RESPONSES[key]; break; }
    }
    setTimeout(() => setMsgs(m => [...m, { role: "ai", text: reply }]), 600);
    setInput("");
  }

  return (
    <div className="h-full flex flex-col" style={{ background: "#020408" }}>
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-xs px-3 py-2 rounded-2xl text-xs"
              style={{
                background: m.role === "user" ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.04)",
                color: m.role === "user" ? "#a855f7" : "rgba(255,255,255,0.8)",
                border: `1px solid ${m.role === "user" ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.06)"}`,
              }}>
              {m.role === "ai" && <div className="text-xs mb-1" style={{ color: "rgba(168,85,247,0.5)" }}>Далан-1 ·</div>}
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 p-3" style={{ borderTop: "1px solid rgba(168,85,247,0.1)" }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Спроси Далан-1..."
          className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
          style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(168,85,247,0.15)" }} />
        <button onClick={send} className="px-3 py-2 rounded-xl text-xs"
          style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7" }}>
          <Icon name="Send" size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── ГОЛОСОВОЙ ВВОД ───────────────────────────────────────────────────────────
function VoiceApp() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [log, setLog] = useState<string[]>(["Система голосового ввода готова.", "Нажми кнопку и говори команду."]);

  function toggleListen() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setLog(l => [...l, "Ошибка: браузер не поддерживает голосовой ввод."]); return; }
    if (listening) { setListening(false); return; }
    const recognition = new SR();
    recognition.lang = "ru-RU";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onstart = () => { setListening(true); setLog(l => [...l, "● Запись... говорите"]); };
    recognition.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setTranscript(t);
    };
    recognition.onend = () => {
      setListening(false);
      setLog(l => [...l, `✓ Распознано: "${transcript}"`]);
    };
    recognition.onerror = (e: any) => { setListening(false); setLog(l => [...l, `Ошибка: ${e.error}`]); };
    recognition.start();
  }

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-6" style={{ background: "#020408" }}>
      <div className="text-center">
        <div className="text-xs mb-1" style={{ color: "rgba(244,63,94,0.5)" }}>ECSU VOICE · Голосовой ввод</div>
        <div className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>Язык: Русский</div>
      </div>
      <button onClick={toggleListen}
        className="w-24 h-24 rounded-full flex items-center justify-center transition-all"
        style={{
          background: listening ? "rgba(244,63,94,0.2)" : "rgba(244,63,94,0.08)",
          border: `2px solid ${listening ? "#f43f5e" : "rgba(244,63,94,0.2)"}`,
          boxShadow: listening ? "0 0 40px rgba(244,63,94,0.3)" : "none",
          animation: listening ? "pulse 1.5s infinite" : "none",
        }}>
        <Icon name={listening ? "MicOff" : "Mic"} size={32} style={{ color: "#f43f5e" }} />
      </button>
      {transcript && (
        <div className="px-4 py-2 rounded-xl text-sm text-center max-w-xs" style={{ background: "rgba(244,63,94,0.08)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.15)" }}>
          {transcript}
        </div>
      )}
      <div className="w-full max-w-sm space-y-1">
        {log.slice(-5).map((l, i) => (
          <div key={i} className="text-xs px-2" style={{ color: "rgba(255,255,255,0.3)" }}>{l}</div>
        ))}
      </div>
    </div>
  );
}

// ─── ЮРА · ВИРТУАЛЬНАЯ МАШИНА ────────────────────────────────────────────────
const VM_URL = "https://functions.poehali.dev/f9a4efa1-55cb-4b31-88fe-26f86159aa83";

const CHAT_STORAGE_KEY = "ecsu-vm-chat-history";

function YuraVM() {
  const [msgs, setMsgs] = useState<{ role: string; content: string }[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (_) { return []; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [booted, setBooted] = useState(false);
  const [bootLog, setBootLog] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(msgs)); } catch (_) { /* ignore */ }
  }, [msgs]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, bootLog]);

  useEffect(() => {
    const lines = [
      "ECSU VM v1.0 — инициализация...",
      "Загрузка ядра Юра-1...",
      "Подключение к poehali.dev...",
      "Установка AI-модуля (Pollinations/OpenAI)...",
      "Настройка контекста ECSU OS...",
      "✓ Виртуальная машина готова. Юра онлайн.",
    ];
    let i = 0;
    const t = setInterval(() => {
      if (i < lines.length) { setBootLog(l => [...l, lines[i]]); i++; }
      else { clearInterval(t); setTimeout(() => setBooted(true), 500); }
    }, 400);
    return () => clearInterval(t);
  }, []);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(VM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs }),
      });
      const data = JSON.parse(await res.text());
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      setMsgs(m => [...m, { role: "assistant", content: parsed.reply || "..." }]);
    } catch {
      setMsgs(m => [...m, { role: "assistant", content: "Ошибка соединения с ВМ. Попробуй ещё раз." }]);
    }
    setLoading(false);
  }

  if (!booted) {
    return (
      <div className="h-full flex flex-col justify-center p-6 font-mono" style={{ background: "#020408" }}>
        <div className="text-xs mb-4" style={{ color: "#00ff87" }}>ECSU OS — Виртуальная машина</div>
        {bootLog.map((l, i) => (
          <div key={i} className="text-xs mb-1 animate-fade-up" style={{ color: i === bootLog.length - 1 ? "#00ff87" : "rgba(255,255,255,0.4)" }}>
            {i === bootLog.length - 1 ? "▶ " : "  "}{l}
          </div>
        ))}
        <div className="mt-3 flex gap-1">
          {[0,1,2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#00ff87", animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ background: "#020408" }}>
      {/* Шапка ВМ */}
      <div className="flex items-center gap-3 px-4 py-2 shrink-0" style={{ borderBottom: "1px solid rgba(0,255,135,0.1)", background: "rgba(0,255,135,0.03)" }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00ff87, #3b82f6)" }}>
          <Icon name="Bot" size={14} className="text-black" />
        </div>
        <div>
          <div className="text-xs font-bold" style={{ color: "#00ff87" }}>Юра · ECSU Virtual Machine</div>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>poehali.dev · AI-среда · бесплатный режим</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>online · {msgs.length} сообщ.</span>
          </div>
          {msgs.length > 0 && (
            <button onClick={() => { setMsgs([]); localStorage.removeItem(CHAT_STORAGE_KEY); }}
              className="px-2 py-1 rounded-lg text-xs transition-all hover:scale-105"
              style={{ background: "rgba(244,63,94,0.1)", color: "#f43f5e" }}
              title="Очистить историю">
              <Icon name="Trash2" size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {msgs.length === 0 && (
          <div className="text-center py-8">
            <div className="text-2xl mb-2">🚀</div>
            <div className="text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>Привет! Я Юра.</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Твой личный разработчик прямо внутри ECSU OS.</div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {["Как добавить новое окно?", "Объясни архитектуру ECSU", "Помоги с кодом React", "Что такое Далан-1?"].map(q => (
                <button key={q} onClick={() => setInput(q)}
                  className="px-3 py-2 rounded-xl text-xs text-left transition-all hover:scale-105"
                  style={{ background: "rgba(0,255,135,0.05)", color: "rgba(0,255,135,0.7)", border: "1px solid rgba(0,255,135,0.1)" }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-6 h-6 rounded-lg mr-2 shrink-0 flex items-center justify-center mt-0.5" style={{ background: "linear-gradient(135deg,#00ff87,#3b82f6)" }}>
                <Icon name="Bot" size={11} className="text-black" />
              </div>
            )}
            <div className="max-w-sm px-3 py-2 rounded-2xl text-xs whitespace-pre-wrap"
              style={{
                background: m.role === "user" ? "rgba(0,255,135,0.1)" : "rgba(255,255,255,0.04)",
                color: m.role === "user" ? "#00ff87" : "rgba(255,255,255,0.85)",
                border: `1px solid ${m.role === "user" ? "rgba(0,255,135,0.2)" : "rgba(255,255,255,0.06)"}`,
              }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-lg mr-2 shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#00ff87,#3b82f6)" }}>
              <Icon name="Bot" size={11} className="text-black" />
            </div>
            <div className="px-3 py-2 rounded-2xl flex gap-1 items-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#00ff87", animationDelay: `${i*0.15}s` }} />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Ввод */}
      <div className="flex gap-2 p-3 shrink-0" style={{ borderTop: "1px solid rgba(0,255,135,0.08)" }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Спроси Юру..."
          disabled={loading}
          className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
          style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(0,255,135,0.1)" }} />
        <button onClick={send} disabled={loading || !input.trim()}
          className="px-3 py-2 rounded-xl text-xs transition-all hover:scale-105 disabled:opacity-40"
          style={{ background: "rgba(0,255,135,0.15)", color: "#00ff87" }}>
          <Icon name="Send" size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── УСТАНОВКА НА ПК ─────────────────────────────────────────────────────────
function InstallPCApp() {
  const [done, setDone] = useState<Record<number, boolean>>({});

  const steps = [
    {
      num: "01",
      title: "Системные требования",
      icon: "Monitor",
      color: "#3b82f6",
      items: [
        "ОС: Windows 10/11 (64-бит) или Linux Ubuntu 20.04+",
        "ОЗУ: минимум 4 ГБ (рекомендуется 8 ГБ)",
        "Место на диске: 500 МБ свободного пространства",
        "Интернет: нужен для первого запуска и синхронизации",
        "Процессор: любой современный x64 (Intel / AMD)",
      ],
      code: null,
    },
    {
      num: "02",
      title: "Скачать билд проекта",
      icon: "Download",
      color: "#00ff87",
      items: [
        "Откройте poehali.dev → ваш проект ECSU",
        "Нажмите кнопку «Скачать» в правом верхнем меню",
        "Выберите «Скачать билд» (HTML + JS + CSS)",
        "Файл загрузится в папку «Загрузки» как ZIP-архив",
      ],
      code: null,
    },
    {
      num: "03",
      title: "Установить Node.js и Electron",
      icon: "Package",
      color: "#f59e0b",
      items: [
        "Скачайте Node.js LTS с сайта nodejs.org",
        "Установите Node.js (Next → Next → Install)",
        "Откройте командную строку (Win+R → cmd → Enter)",
        "Выполните команду установки Electron:",
      ],
      code: "npm install -g electron",
    },
    {
      num: "04",
      title: "Распаковать и подготовить",
      icon: "FolderOpen",
      color: "#a855f7",
      items: [
        "Распакуйте скачанный ZIP в любую папку (напр. C:\\ECSU-OS)",
        "В распакованной папке создайте файл main.js",
        "Вставьте в main.js следующий код:",
      ],
      code: `const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'ECSU OS',
    webPreferences: { nodeIntegration: false }
  });
  win.loadFile('index.html');
  win.setMenuBarVisibility(false);
});

app.on('window-all-closed', () => app.quit());`,
    },
    {
      num: "05",
      title: "Создать package.json",
      icon: "FileJson",
      color: "#06b6d4",
      items: [
        "В той же папке создайте файл package.json",
        "Вставьте следующее содержимое:",
      ],
      code: `{
  "name": "ecsu-os",
  "version": "2.0.0",
  "description": "ECSU OS · Николаев В.В.",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  }
}`,
    },
    {
      num: "06",
      title: "Установить зависимости",
      icon: "Terminal",
      color: "#10b981",
      items: [
        "В командной строке перейдите в папку с проектом:",
        "Затем установите зависимости:",
      ],
      code: `cd C:\\ECSU-OS
npm install electron --save-dev`,
    },
    {
      num: "07",
      title: "Первый запуск",
      icon: "Play",
      color: "#00ff87",
      items: [
        "Запустите ECSU OS командой:",
        "Откроется окно приложения с рабочим столом ECSU",
        "При первом запуске система синхронизируется с сервером",
        "Войдите под учётными данными Владимира (nvv)",
      ],
      code: "npm start",
    },
    {
      num: "08",
      title: "Создать ярлык на рабочем столе",
      icon: "Layers",
      color: "#ec4899",
      items: [
        "Для удобного запуска создайте bat-файл start-ecsu.bat в папке:",
        "Содержимое файла:",
        "Затем создайте ярлык этого файла на рабочем столе Windows",
      ],
      code: `@echo off
cd /d C:\\ECSU-OS
npm start`,
    },
    {
      num: "09",
      title: "Обновление системы",
      icon: "RefreshCw",
      color: "#f43f5e",
      items: [
        "При выходе новой версии на poehali.dev — скачайте новый билд",
        "Замените содержимое папки C:\\ECSU-OS новыми файлами",
        "Файлы main.js и package.json НЕ удалять — они ваши",
        "После замены запустите npm start — система обновлена",
      ],
      code: null,
    },
  ];

  const doneCount = Object.values(done).filter(Boolean).length;
  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="h-full overflow-auto p-4 space-y-4" style={{ background: "#020408" }}>
      {/* Заголовок */}
      <div className="rounded-xl p-4" style={{ background: "rgba(0,255,135,0.05)", border: "1px solid rgba(0,255,135,0.15)" }}>
        <div className="flex items-center gap-3 mb-1">
          <Icon name="MonitorDown" size={20} style={{ color: "#00ff87" }} />
          <span className="text-sm font-bold text-white">Установка ECSU OS на ПК</span>
          <span className="ml-auto text-xs font-mono" style={{ color: "#00ff87" }}>{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#00ff87,#3b82f6)" }} />
        </div>
        <div className="mt-2 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
          Отмечайте шаги по мере выполнения · {doneCount} из {steps.length} выполнено
        </div>
      </div>

      {/* Кнопки скачивания файлов */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Icon name="Download" size={14} style={{ color: "#00ff87" }} />
          <span className="text-xs font-semibold text-white">Скачать файлы для установки</span>
        </div>
        {[
          {
            label: "main.js",
            icon: "FileCode",
            color: "#a855f7",
            desc: "Точка входа Electron-приложения",
            filename: "main.js",
            content: `const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'ECSU OS',
    webPreferences: { nodeIntegration: false }
  });
  win.loadFile('index.html');
  win.setMenuBarVisibility(false);
});

app.on('window-all-closed', () => app.quit());`,
          },
          {
            label: "package.json",
            icon: "FileJson",
            color: "#06b6d4",
            desc: "Конфигурация проекта Node.js",
            filename: "package.json",
            content: `{
  "name": "ecsu-os",
  "version": "2.0.0",
  "description": "ECSU OS · Николаев В.В.",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  }
}`,
          },
          {
            label: "start-ecsu.bat",
            icon: "Terminal",
            color: "#f59e0b",
            desc: "Ярлык запуска для Windows",
            filename: "start-ecsu.bat",
            content: `@echo off
cd /d C:\\ECSU-OS
npm start`,
          },
        ].map((file) => (
          <div key={file.filename} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${file.color}18`, border: `1px solid ${file.color}30` }}>
              <Icon name={file.icon as any} size={15} style={{ color: file.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-mono font-semibold text-white">{file.label}</div>
              <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{file.desc}</div>
            </div>
            <button
              onClick={() => {
                const blob = new Blob([file.content], { type: "text/plain" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = file.filename;
                a.click();
                URL.revokeObjectURL(a.href);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 shrink-0"
              style={{ background: `${file.color}15`, color: file.color, border: `1px solid ${file.color}30` }}
            >
              <Icon name="Download" size={11} />
              Скачать
            </button>
          </div>
        ))}
      </div>

      {/* Шаги */}
      {steps.map((step, idx) => (
        <div key={idx} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${done[idx] ? "rgba(0,255,135,0.25)" : "rgba(255,255,255,0.07)"}`, background: done[idx] ? "rgba(0,255,135,0.04)" : "rgba(255,255,255,0.02)" }}>
          {/* Шапка шага */}
          <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none" onClick={() => setDone(d => ({ ...d, [idx]: !d[idx] }))}>
            <span className="text-xs font-mono w-6 shrink-0" style={{ color: done[idx] ? "#00ff87" : "rgba(255,255,255,0.25)" }}>{step.num}</span>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${step.color}18`, border: `1px solid ${step.color}30` }}>
              <Icon name={done[idx] ? "CheckCircle" : step.icon as any} size={14} style={{ color: done[idx] ? "#00ff87" : step.color }} />
            </div>
            <span className="text-sm font-medium flex-1" style={{ color: done[idx] ? "#00ff87" : "rgba(255,255,255,0.85)" }}>{step.title}</span>
            <div className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all"
              style={{ borderColor: done[idx] ? "#00ff87" : "rgba(255,255,255,0.2)", background: done[idx] ? "#00ff87" : "transparent" }}>
              {done[idx] && <Icon name="Check" size={11} className="text-black" />}
            </div>
          </div>

          {/* Контент */}
          <div className="px-4 pb-4 space-y-2">
            {step.items.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <Icon name="ChevronRight" size={12} className="mt-0.5 shrink-0" style={{ color: step.color }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{item}</span>
              </div>
            ))}
            {step.code && (
              <div className="mt-3 rounded-lg p-3 font-mono text-xs overflow-x-auto whitespace-pre" style={{ background: "rgba(0,0,0,0.4)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.1)" }}>
                {step.code}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Финал */}
      {pct === 100 && (
        <div className="rounded-xl p-4 text-center" style={{ background: "rgba(0,255,135,0.08)", border: "1px solid rgba(0,255,135,0.3)" }}>
          <Icon name="CheckCircle" size={28} style={{ color: "#00ff87", margin: "0 auto 8px" }} />
          <div className="text-sm font-bold text-white mb-1">ECSU OS успешно установлена на ПК</div>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Все шаги выполнены · Владелец: Николаев В.В.</div>
        </div>
      )}
    </div>
  );
}