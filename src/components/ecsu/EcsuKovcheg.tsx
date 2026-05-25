import { useState } from "react";
import Icon from "@/components/ui/icon";

const SYSTEM_STATUS = true;

const EcsuKovcheg = () => {
  const [tab, setTab] = useState<"zavet" | "servers" | "settings" | "logs">("zavet");
  const [token, setToken] = useState("");
  const [tokenEntered, setTokenEntered] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [directiveTab, setDirectiveTab] = useState<"directive" | "solutions">("directive");

  const CORRECT_TOKEN = "NWW-ECSU-2026";

  const handleEnter = () => {
    if (token.trim() === CORRECT_TOKEN) {
      setTokenEntered(true);
      setTokenError(false);
    } else {
      setTokenError(true);
      setTimeout(() => setTokenError(false), 2000);
    }
  };

  const servers = [
    { name: "ecsu-server", ip: "5.129.207.35", status: "online", node: "kvmnvm-1086", cpu: 2, ram: 4, disk: 50, os: "Ubuntu 22.04" },
    { name: "ecsu-nww.com", ip: "5.129.207.35", status: "online", node: "DNS", cpu: null, ram: null, disk: null, os: "Домен" },
  ];

  const logs = [
    { time: "25.05.2026 · 11:18", level: "OK",   msg: "Ковчег инициализирован. Директива активна." },
    { time: "25.05.2026 · 11:17", level: "OK",   msg: "Подключение к серверу 5.129.207.35 — успешно." },
    { time: "25.05.2026 · 10:53", level: "OK",   msg: "Авторизация владельца: nikolaev — успешно." },
    { time: "25.05.2026 · 07:12", level: "WARN", msg: "Попытка сканирования портов с внешней сети." },
    { time: "24.05.2026 · 23:40", level: "OK",   msg: "Резервная копия системы создана." },
    { time: "24.05.2026 · 15:47", level: "ERR",  msg: "Несанкционированная попытка входа заблокирована." },
    { time: "23.05.2026 · 14:11", level: "OK",   msg: "Конфигурация системы обновлена владельцем." },
    { time: "22.05.2026 · 09:30", level: "WARN", msg: "Фишинговое письмо на nikolaevvladimir77@yandex.ru — заблокировано." },
  ];

  const levelColor: Record<string, string> = {
    OK: "#34d399", WARN: "#f59e0b", ERR: "#e94560",
  };

  return (
    <div className="flex h-full">

      {/* Левое меню */}
      <div className="w-44 bg-[#090e1e] border-r border-blue-900/20 flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-blue-900/20 flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Icon name="Anchor" size={14} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-xs">КОВЧЕГ</div>
            <div className="text-gray-600 text-[8px]">ECSU 2.0 · Администрирование</div>
          </div>
        </div>

        <div className="text-gray-600 text-[9px] uppercase tracking-widest px-4 py-2">АДМИНИСТРИРОВАНИЕ</div>

        {[
          { id: "zavet"    as const, label: "Завет",       icon: "BookLock" },
          { id: "servers"  as const, label: "Серверы",     icon: "Server" },
          { id: "settings" as const, label: "Настройки",   icon: "Settings" },
          { id: "logs"     as const, label: "Логи системы", icon: "ScrollText" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-all ${
              tab === t.id
                ? "bg-cyan-900/30 text-white border-r-2 border-cyan-400"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border-r-2 border-transparent"
            }`}
          >
            <Icon name={t.icon} size={13} />
            {t.label}
          </button>
        ))}

        {/* Статус системы */}
        <div className="mt-auto px-4 py-4 border-t border-blue-900/20">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${SYSTEM_STATUS ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
            <span className="text-xs" style={{ color: SYSTEM_STATUS ? "#34d399" : "#e94560" }}>
              Система {SYSTEM_STATUS ? "онлайн" : "офлайн"}
            </span>
          </div>
          <div className="text-gray-700 text-[9px] mt-1">ECSU 2.0 · ecsu-nww.com</div>
        </div>
      </div>

      {/* Основная область */}
      <div className="flex-1 overflow-y-auto bg-[#080c1a]">

        {/* ── ЗАВЕТ ── */}
        {tab === "zavet" && (
          <div className="p-6 max-w-3xl">
            {/* Заголовок */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-700 rounded-xl flex items-center justify-center">
                  <Icon name="Anchor" size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">ЗАВЕТ СИСТЕМЫ</h1>
                  <div className="text-gray-500 text-xs">Директивы высшего приоритета · ECSU 2.0 · Ковчег</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-xs font-mono">Система {SYSTEM_STATUS ? "ОНЛАЙН" : "ОФЛАЙН"}</span>
              </div>
            </div>

            {/* Форма входа в Завет */}
            {!tokenEntered && (
              <div className="bg-[#0d1225] border border-cyan-900/40 rounded-xl p-5 mb-5 max-w-sm">
                <div className="text-white text-sm font-bold mb-1">Вход в Завет</div>
                <div className="text-gray-500 text-xs mb-3">Только владелец системы или ИИ-администратор</div>
                <input
                  type="password"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleEnter()}
                  placeholder="Токен доступа"
                  className={`w-full bg-[#060d1f] border text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none mb-3 transition-colors ${
                    tokenError ? "border-red-500" : "border-cyan-900/40 focus:border-cyan-500"
                  }`}
                />
                {tokenError && (
                  <div className="text-red-400 text-xs mb-2 flex items-center gap-1">
                    <Icon name="AlertCircle" size={11} /> Неверный токен
                  </div>
                )}
                <button
                  onClick={handleEnter}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Войти
                </button>
                <div className="text-gray-700 text-[10px] mt-2 text-center">Токен: NWW-ECSU-2026</div>
              </div>
            )}

            {/* Директивы (доступны всегда) */}
            <div className="flex gap-2 mb-4">
              {([["directive", "Директива"], ["solutions", "Согласованные решения"]] as const).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setDirectiveTab(id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    directiveTab === id
                      ? "bg-cyan-900/40 text-cyan-300 border border-cyan-700/40"
                      : "text-gray-600 hover:text-gray-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {directiveTab === "directive" && (
              <div>
                {/* Активная директива */}
                <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/20 border border-cyan-700/40 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                    <span className="text-cyan-300 text-sm font-bold">ЗАВЕТ №1 — ДИРЕКТИВА АКТИВНА</span>
                  </div>
                  <div className="text-gray-400 text-xs">Абсолютный приоритет · Николаев Владимир Владимирович</div>
                </div>

                {tokenEntered ? (
                  <div className="space-y-3">
                    <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">АЛГОРИТМ РЕШЕНИЯ</div>
                    {[
                      { n: "1", text: "Владелец системы — Николаев Владимир Владимирович — обладает абсолютным приоритетом над всеми решениями системы ЕЦСУ.", color: "#34d399" },
                      { n: "2", text: "Все данные системы ЕЦСУ являются собственностью Николаева В.В. Несанкционированное копирование, модификация и передача запрещены.", color: "#60a5fa" },
                      { n: "3", text: "В случае угрозы безопасности система автоматически переходит в режим Ковчег. Доступ ограничен только для владельца.", color: "#f59e0b" },
                      { n: "4", text: "Сервер 5.129.207.35 (ecsu-nww.com) является основной инфраструктурой. Резервное копирование каждые 24 часа.", color: "#a78bfa" },
                      { n: "5", text: "Контракт SYNERGON GLOBAL № 5052834788 — действующий. Все права интеллектуальной собственности защищены.", color: "#e94560" },
                    ].map(d => (
                      <div key={d.n} className="flex gap-3 bg-[#0d1225] border border-blue-900/20 rounded-xl p-4">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: d.color + "22", color: d.color }}>
                          {d.n}
                        </div>
                        <div className="text-gray-300 text-sm leading-relaxed">{d.text}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-600">
                    <Icon name="Lock" size={32} className="mx-auto mb-3 text-gray-700" />
                    <div className="text-sm">Введите токен для просмотра директив</div>
                  </div>
                )}
              </div>
            )}

            {directiveTab === "solutions" && (
              <div className="space-y-3">
                {tokenEntered ? (
                  [
                    { title: "Расширение инфраструктуры ЕЦСУ", date: "20.05.2026", status: "Одобрено" },
                    { title: "Интеграция DALAN с внешними API", date: "15.05.2026", status: "Одобрено" },
                    { title: "Переход на домен ecsu-nww.com", date: "10.05.2026", status: "Выполнено" },
                  ].map((s, i) => (
                    <div key={i} className="bg-[#0d1225] border border-blue-900/20 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <div className="text-white text-sm font-medium">{s.title}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{s.date}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-green-900/30 border border-green-700/30 text-green-400 rounded-full">{s.status}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-600">
                    <Icon name="Lock" size={32} className="mx-auto mb-3 text-gray-700" />
                    <div className="text-sm">Введите токен для просмотра</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── СЕРВЕРЫ ── */}
        {tab === "servers" && (
          <div className="p-6 max-w-3xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Серверы</h2>
                <p className="text-gray-500 text-sm">Инфраструктура ЕЦСУ · Timeweb Cloud</p>
              </div>
              <div className="flex items-center gap-2 text-green-400 text-xs">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                {servers.filter(s => s.status === "online").length} из {servers.length} онлайн
              </div>
            </div>

            <div className="space-y-3">
              {servers.map((s, i) => (
                <div key={i} className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <Icon name="Server" size={18} className="text-blue-400" />
                      </div>
                      <div>
                        <div className="text-white font-bold">{s.name}</div>
                        <div className="text-gray-500 text-xs">{s.ip} · {s.node}</div>
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                      s.status === "online" ? "bg-green-900/30 border border-green-700/30 text-green-400" : "bg-red-900/30 border border-red-700/30 text-red-400"
                    }`}>
                      {s.status === "online" ? "● ОНЛАЙН" : "● ОФЛАЙН"}
                    </span>
                  </div>
                  {s.cpu && (
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="bg-[#060d1f] rounded-lg p-2.5">
                        <div className="text-gray-500">CPU</div>
                        <div className="text-white font-bold mt-0.5">{s.cpu} ядра</div>
                      </div>
                      <div className="bg-[#060d1f] rounded-lg p-2.5">
                        <div className="text-gray-500">RAM</div>
                        <div className="text-white font-bold mt-0.5">{s.ram} ГБ</div>
                      </div>
                      <div className="bg-[#060d1f] rounded-lg p-2.5">
                        <div className="text-gray-500">Диск NVMe</div>
                        <div className="text-white font-bold mt-0.5">{s.disk} ГБ</div>
                      </div>
                    </div>
                  )}
                  <div className="mt-2 text-gray-600 text-xs">{s.os}</div>
                </div>
              ))}
            </div>

            {/* SSH инструкция */}
            <div className="mt-4 bg-[#0d1225] border border-cyan-900/20 rounded-xl p-4">
              <div className="text-cyan-400 text-xs font-bold mb-2 flex items-center gap-2">
                <Icon name="Terminal" size={12} /> Подключение по SSH
              </div>
              <div className="font-mono text-xs text-gray-400 bg-[#060d1f] rounded-lg p-3">
                ssh root@5.129.207.35
              </div>
            </div>
          </div>
        )}

        {/* ── НАСТРОЙКИ ── */}
        {tab === "settings" && (
          <div className="p-6 max-w-xl">
            <h2 className="text-xl font-bold text-white mb-1">Настройки Ковчега</h2>
            <p className="text-gray-500 text-sm mb-6">Конфигурация системы безопасности</p>
            <div className="space-y-4">
              {[
                { label: "Домен системы", value: "ecsu-nww.com", editable: true },
                { label: "IP сервера", value: "5.129.207.35", editable: true },
                { label: "Email владельца", value: "nikolaevvladimir77@yandex.ru", editable: true },
                { label: "Нода", value: "kvmnvm-1086", editable: false },
                { label: "Версия ECSU", value: "2.0.5", editable: false },
              ].map((f, i) => (
                <div key={i} className="bg-[#0d1225] border border-blue-900/20 rounded-xl p-4">
                  <label className="text-gray-500 text-xs block mb-2">{f.label}</label>
                  <input
                    defaultValue={f.value}
                    readOnly={!f.editable}
                    className={`w-full bg-[#060d1f] border text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none ${
                      f.editable
                        ? "border-blue-900/30 focus:border-blue-500 cursor-text"
                        : "border-gray-800 text-gray-500 cursor-default"
                    }`}
                  />
                </div>
              ))}
              <button className="w-full py-3 bg-cyan-700 hover:bg-cyan-600 text-white text-sm font-bold rounded-xl transition-colors">
                Сохранить настройки
              </button>
            </div>
          </div>
        )}

        {/* ── ЛОГИ ── */}
        {tab === "logs" && (
          <div className="p-6 max-w-3xl">
            <h2 className="text-xl font-bold text-white mb-1">Логи системы</h2>
            <p className="text-gray-500 text-sm mb-6">Системные события ЕЦСУ · КОВЧЕГ</p>
            <div className="bg-[#060d1f] border border-blue-900/20 rounded-xl p-4 space-y-1.5 font-mono">
              {logs.map((l, i) => (
                <div key={i} className="flex items-start gap-3 text-xs py-1 border-b border-white/5 last:border-0">
                  <span className="text-gray-600 shrink-0">{l.time}</span>
                  <span className="font-bold shrink-0" style={{ color: levelColor[l.level] }}>[{l.level}]</span>
                  <span className="text-gray-300">{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EcsuKovcheg;
