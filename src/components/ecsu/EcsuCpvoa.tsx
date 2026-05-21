import { useState } from "react";
import Icon from "@/components/ui/icon";

type Tab = "provider" | "dns" | "modem" | "satellite" | "priorities";

interface Provider {
  id: string;
  name: string;
  type: "fiber" | "4g" | "satellite" | "dsl";
  status: "active" | "inactive" | "error";
  ip?: string;
  speed?: string;
}

interface DnsRecord {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  active: boolean;
}

interface ModemProfile {
  id: string;
  name: string;
  apn: string;
  operator: string;
  signal: number;
  status: "connected" | "disconnected" | "connecting";
  interface: string;
}

const PROVIDER_ICONS: Record<string, string> = {
  fiber: "Zap",
  "4g": "Signal",
  satellite: "Satellite",
  dsl: "Phone",
};

const PROVIDER_COLORS: Record<string, string> = {
  fiber: "#34d399",
  "4g": "#60a5fa",
  satellite: "#a78bfa",
  dsl: "#f59e0b",
};

const EcsuCpvoa = ({ onClose }: { onClose: () => void }) => {
  const [tab, setTab] = useState<Tab>("provider");

  const [providers, setProviders] = useState<Provider[]>([
    { id: "1", name: "Ростелеком ВОЛС", type: "fiber", status: "active", ip: "212.45.18.2", speed: "1 Гбит/с" },
    { id: "2", name: "МТС 4G", type: "4g", status: "inactive", ip: "", speed: "150 Мбит/с" },
    { id: "3", name: "VSAT Орион", type: "satellite", status: "error", ip: "", speed: "50 Мбит/с" },
  ]);

  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>([
    { id: "1", name: "Системный (ECSU)", primary: "8.8.8.8", secondary: "8.8.4.4", active: true },
    { id: "2", name: "Резервный", primary: "1.1.1.1", secondary: "1.0.0.1", active: false },
    { id: "3", name: "Корпоративный", primary: "10.0.0.1", secondary: "10.0.0.2", active: false },
  ]);

  const [modems, setModems] = useState<ModemProfile[]>([
    { id: "1", name: "Модем 1 (МТС)", apn: "internet.mts.ru", operator: "МТС", signal: 78, status: "connected", interface: "ppp0" },
    { id: "2", name: "Модем 2 (Билайн)", apn: "internet.beeline.ru", operator: "Билайн", signal: 45, status: "disconnected", interface: "ppp1" },
    { id: "3", name: "Модем 3 (МегаФон)", apn: "internet", operator: "МегаФон", signal: 62, status: "disconnected", interface: "ppp2" },
  ]);

  const [satQuery, setSatQuery] = useState("");
  const [satResults, setSatResults] = useState<{ title: string; url: string; source: string }[]>([]);
  const [satLoading, setSatLoading] = useState(false);
  const [satEngine, setSatEngine] = useState<"google" | "yandex" | "bing">("google");

  const satSearch = () => {
    if (!satQuery.trim()) return;
    setSatLoading(true);
    setSatResults([]);
    const q = encodeURIComponent(satQuery);
    const allResults = [
      { title: `${satQuery} — Google`, url: `https://www.google.com/search?q=${q}`, source: "Google" },
      { title: `${satQuery} — Яндекс`, url: `https://yandex.ru/search/?text=${q}`, source: "Яндекс" },
      { title: `${satQuery} — Bing`, url: `https://www.bing.com/search?q=${q}`, source: "Bing" },
      { title: `${satQuery} — DuckDuckGo`, url: `https://duckduckgo.com/?q=${q}`, source: "DuckDuckGo" },
      { title: `${satQuery} — YouTube видео`, url: `https://www.youtube.com/results?search_query=${q}`, source: "YouTube" },
      { title: `${satQuery} — Википедия`, url: `https://ru.wikipedia.org/w/index.php?search=${q}`, source: "Википедия" },
    ];
    const engineFirst: Record<string, string> = { google: "Google", yandex: "Яндекс", bing: "Bing" };
    const sorted = [
      ...allResults.filter(r => r.source === engineFirst[satEngine]),
      ...allResults.filter(r => r.source !== engineFirst[satEngine]),
    ];
    setTimeout(() => {
      setSatResults(sorted);
      setSatLoading(false);
    }, 1400);
  };

  const [addingProvider, setAddingProvider] = useState(false);
  const [addingDns, setAddingDns] = useState(false);
  const [addingModem, setAddingModem] = useState(false);

  const [newProvider, setNewProvider] = useState({ name: "", type: "fiber" as Provider["type"], ip: "", speed: "" });
  const [newDns, setNewDns] = useState({ name: "", primary: "", secondary: "" });
  const [newModem, setNewModem] = useState({ name: "", apn: "", operator: "", interface: "ppp3" });

  const statusColor: Record<string, string> = {
    active: "#34d399",
    connected: "#34d399",
    inactive: "#6b7280",
    disconnected: "#6b7280",
    error: "#e94560",
    connecting: "#f59e0b",
  };

  const statusLabel: Record<string, string> = {
    active: "Активен",
    connected: "Подключён",
    inactive: "Отключён",
    disconnected: "Отключён",
    error: "Ошибка",
    connecting: "Подключение...",
  };

  const activateProvider = (id: string) => {
    setProviders((prev) =>
      prev.map((p) => ({ ...p, status: p.id === id ? "active" : "inactive" }))
    );
  };

  const activateDns = (id: string) => {
    setDnsRecords((prev) =>
      prev.map((d) => ({ ...d, active: d.id === id }))
    );
  };

  const toggleModem = (id: string) => {
    setModems((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        return { ...m, status: m.status === "connected" ? "disconnected" : "connecting" };
      })
    );
    setTimeout(() => {
      setModems((prev) =>
        prev.map((m) => {
          if (m.id !== id) return m;
          return m.status === "connecting" ? { ...m, status: "connected" } : m;
        })
      );
    }, 1500);
  };

  const addProvider = () => {
    if (!newProvider.name) return;
    setProviders((prev) => [...prev, {
      id: Date.now().toString(),
      ...newProvider,
      status: "inactive",
    }]);
    setNewProvider({ name: "", type: "fiber", ip: "", speed: "" });
    setAddingProvider(false);
  };

  const addDns = () => {
    if (!newDns.name || !newDns.primary) return;
    setDnsRecords((prev) => [...prev, {
      id: Date.now().toString(),
      ...newDns,
      active: false,
    }]);
    setNewDns({ name: "", primary: "", secondary: "" });
    setAddingDns(false);
  };

  const addModem = () => {
    if (!newModem.name || !newModem.apn) return;
    setModems((prev) => [...prev, {
      id: Date.now().toString(),
      ...newModem,
      signal: 0,
      status: "disconnected",
    }]);
    setNewModem({ name: "", apn: "", operator: "", interface: "ppp3" });
    setAddingModem(false);
  };

  const removeProvider = (id: string) => setProviders((prev) => prev.filter((p) => p.id !== id));
  const removeDns = (id: string) => setDnsRecords((prev) => prev.filter((d) => d.id !== id));
  const removeModem = (id: string) => setModems((prev) => prev.filter((m) => m.id !== id));

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "provider",   label: "Провайдер",          icon: "Globe" },
    { id: "dns",        label: "DNS",                 icon: "Server" },
    { id: "modem",      label: "Модем",               icon: "Smartphone" },
    { id: "satellite",  label: "Спутниковый поиск",   icon: "Satellite" },
    { id: "priorities", label: "Приоритеты",          icon: "ListOrdered" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0d1225] border border-[#34d399]/30 rounded-2xl w-full max-w-2xl mx-4 shadow-2xl shadow-black/60 flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#34d399]/20 bg-gradient-to-r from-[#34d399]/10 to-transparent rounded-t-2xl">
          <div className="w-9 h-9 bg-gradient-to-br from-[#34d399] to-[#059669] rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon name="Radar" size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="text-white font-bold text-base">ЦПВОА — Управление сетью</div>
            <div className="text-[#34d399] text-xs">Центр подключения и управления сетевыми ресурсами</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-red-400 transition-colors p-1">
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-4 pb-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? "bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/30"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              <Icon name={t.icon} size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">

          {/* ПРОВАЙДЕР */}
          {tab === "provider" && (
            <>
              <div className="text-gray-400 text-xs mb-2">Выберите активный сервис подключения к сети. Только один провайдер может быть активен одновременно.</div>
              {providers.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    p.status === "active"
                      ? "bg-[#34d399]/10 border-[#34d399]/30"
                      : p.status === "error"
                      ? "bg-[#e94560]/5 border-[#e94560]/20"
                      : "bg-[#1a1a2e]/60 border-white/5 hover:border-white/10"
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: PROVIDER_COLORS[p.type] + "22" }}
                  >
                    <Icon name={PROVIDER_ICONS[p.type]} size={18} style={{ color: PROVIDER_COLORS[p.type] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium">{p.name}</div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-gray-500 text-xs">{p.speed || "—"}</span>
                      {p.ip && <span className="text-gray-600 text-xs font-mono">{p.ip}</span>}
                      <span className="flex items-center gap-1 text-xs" style={{ color: statusColor[p.status] }}>
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: statusColor[p.status] }} />
                        {statusLabel[p.status]}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.status !== "active" && (
                      <button
                        onClick={() => activateProvider(p.id)}
                        className="px-3 py-1.5 text-xs bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/30 rounded-lg hover:bg-[#34d399]/30 transition-colors"
                      >
                        Активировать
                      </button>
                    )}
                    {p.status === "active" && (
                      <span className="px-3 py-1.5 text-xs bg-[#34d399] text-black font-semibold rounded-lg">Активен</span>
                    )}
                    <button onClick={() => removeProvider(p.id)} className="text-gray-600 hover:text-red-400 transition-colors p-1">
                      <Icon name="Trash2" size={13} />
                    </button>
                  </div>
                </div>
              ))}

              {addingProvider ? (
                <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="text-white text-sm font-medium">Новый провайдер</div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={newProvider.name}
                      onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                      placeholder="Название провайдера"
                      className="bg-[#0d1225] border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#34d399]/50 placeholder-gray-600 col-span-2"
                    />
                    <select
                      value={newProvider.type}
                      onChange={(e) => setNewProvider({ ...newProvider, type: e.target.value as Provider["type"] })}
                      className="bg-[#0d1225] border border-white/10 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="fiber">Оптоволокно</option>
                      <option value="4g">4G/5G</option>
                      <option value="satellite">Спутник</option>
                      <option value="dsl">DSL</option>
                    </select>
                    <input
                      value={newProvider.speed}
                      onChange={(e) => setNewProvider({ ...newProvider, speed: e.target.value })}
                      placeholder="Скорость (напр. 100 Мбит/с)"
                      className="bg-[#0d1225] border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#34d399]/50 placeholder-gray-600"
                    />
                    <input
                      value={newProvider.ip}
                      onChange={(e) => setNewProvider({ ...newProvider, ip: e.target.value })}
                      placeholder="IP-адрес (необязательно)"
                      className="bg-[#0d1225] border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#34d399]/50 placeholder-gray-600 col-span-2"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addProvider} className="px-4 py-2 bg-[#34d399] text-black text-sm font-semibold rounded-lg hover:bg-[#2bb884] transition-colors">Добавить</button>
                    <button onClick={() => setAddingProvider(false)} className="px-4 py-2 bg-white/5 text-gray-400 text-sm rounded-lg hover:bg-white/10 transition-colors">Отмена</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingProvider(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-[#34d399]/30 text-[#34d399] text-sm rounded-xl hover:bg-[#34d399]/5 transition-colors"
                >
                  <Icon name="Plus" size={14} />
                  Добавить провайдера
                </button>
              )}
            </>
          )}

          {/* DNS */}
          {tab === "dns" && (
            <>
              <div className="text-gray-400 text-xs mb-2">Настройте DNS-серверы для системы. Активный профиль используется для всех сетевых запросов ECSU.</div>
              {dnsRecords.map((d) => (
                <div
                  key={d.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    d.active
                      ? "bg-[#34d399]/10 border-[#34d399]/30"
                      : "bg-[#1a1a2e]/60 border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${d.active ? "bg-[#34d399]/20" : "bg-white/5"}`}>
                    <Icon name="Server" size={16} className={d.active ? "text-[#34d399]" : "text-gray-500"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium">{d.name}</div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-gray-400 text-xs font-mono">{d.primary}</span>
                      {d.secondary && <span className="text-gray-600 text-xs font-mono">{d.secondary}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!d.active && (
                      <button
                        onClick={() => activateDns(d.id)}
                        className="px-3 py-1.5 text-xs bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/30 rounded-lg hover:bg-[#34d399]/30 transition-colors"
                      >
                        Применить
                      </button>
                    )}
                    {d.active && (
                      <span className="px-3 py-1.5 text-xs bg-[#34d399] text-black font-semibold rounded-lg">Активен</span>
                    )}
                    <button onClick={() => removeDns(d.id)} className="text-gray-600 hover:text-red-400 transition-colors p-1">
                      <Icon name="Trash2" size={13} />
                    </button>
                  </div>
                </div>
              ))}

              {addingDns ? (
                <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="text-white text-sm font-medium">Новый DNS-профиль</div>
                  <div className="space-y-2">
                    <input
                      value={newDns.name}
                      onChange={(e) => setNewDns({ ...newDns, name: e.target.value })}
                      placeholder="Название профиля"
                      className="w-full bg-[#0d1225] border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#34d399]/50 placeholder-gray-600"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={newDns.primary}
                        onChange={(e) => setNewDns({ ...newDns, primary: e.target.value })}
                        placeholder="Основной DNS"
                        className="bg-[#0d1225] border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#34d399]/50 placeholder-gray-600 font-mono"
                      />
                      <input
                        value={newDns.secondary}
                        onChange={(e) => setNewDns({ ...newDns, secondary: e.target.value })}
                        placeholder="Резервный DNS"
                        className="bg-[#0d1225] border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#34d399]/50 placeholder-gray-600 font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addDns} className="px-4 py-2 bg-[#34d399] text-black text-sm font-semibold rounded-lg hover:bg-[#2bb884] transition-colors">Добавить</button>
                    <button onClick={() => setAddingDns(false)} className="px-4 py-2 bg-white/5 text-gray-400 text-sm rounded-lg hover:bg-white/10 transition-colors">Отмена</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingDns(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-[#34d399]/30 text-[#34d399] text-sm rounded-xl hover:bg-[#34d399]/5 transition-colors"
                >
                  <Icon name="Plus" size={14} />
                  Добавить DNS-профиль
                </button>
              )}
            </>
          )}

          {/* МОДЕМ */}
          {tab === "modem" && (
            <>
              <div className="text-gray-400 text-xs mb-2">Управление подключением через USB/PCIe модемы. Поддерживается несколько модемов одновременно.</div>
              {modems.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    m.status === "connected"
                      ? "bg-[#34d399]/10 border-[#34d399]/30"
                      : m.status === "connecting"
                      ? "bg-[#f59e0b]/5 border-[#f59e0b]/20"
                      : "bg-[#1a1a2e]/60 border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${m.status === "connected" ? "bg-[#34d399]/20" : "bg-white/5"}`}>
                    <Icon name="Smartphone" size={16} className={m.status === "connected" ? "text-[#34d399]" : "text-gray-500"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{m.name}</span>
                      <span className="text-gray-600 text-xs font-mono">{m.interface}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-gray-500 text-xs">APN: <span className="font-mono text-gray-400">{m.apn}</span></span>
                      {m.status === "connected" && (
                        <span className="flex items-center gap-1 text-xs text-[#34d399]">
                          <Icon name="Signal" size={10} />
                          {m.signal}%
                        </span>
                      )}
                      <span className="text-xs" style={{ color: statusColor[m.status] }}>
                        {statusLabel[m.status]}
                      </span>
                    </div>
                  </div>
                  {/* Signal bar */}
                  {m.status === "connected" && (
                    <div className="flex flex-col items-end gap-1 mr-1">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${m.signal}%`,
                            background: m.signal > 60 ? "#34d399" : m.signal > 30 ? "#f59e0b" : "#e94560",
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleModem(m.id)}
                      disabled={m.status === "connecting"}
                      className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors disabled:opacity-50 ${
                        m.status === "connected"
                          ? "bg-[#e94560]/20 text-[#e94560] border border-[#e94560]/30 hover:bg-[#e94560]/30"
                          : m.status === "connecting"
                          ? "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30"
                          : "bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/30 hover:bg-[#34d399]/30"
                      }`}
                    >
                      {m.status === "connected" ? "Отключить" : m.status === "connecting" ? "Подключение..." : "Подключить"}
                    </button>
                    <button onClick={() => removeModem(m.id)} className="text-gray-600 hover:text-red-400 transition-colors p-1">
                      <Icon name="Trash2" size={13} />
                    </button>
                  </div>
                </div>
              ))}

              {addingModem ? (
                <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="text-white text-sm font-medium">Новый модем</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={newModem.name}
                      onChange={(e) => setNewModem({ ...newModem, name: e.target.value })}
                      placeholder="Название модема"
                      className="bg-[#0d1225] border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#34d399]/50 placeholder-gray-600 col-span-2"
                    />
                    <input
                      value={newModem.operator}
                      onChange={(e) => setNewModem({ ...newModem, operator: e.target.value })}
                      placeholder="Оператор (МТС, Билайн...)"
                      className="bg-[#0d1225] border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#34d399]/50 placeholder-gray-600"
                    />
                    <input
                      value={newModem.interface}
                      onChange={(e) => setNewModem({ ...newModem, interface: e.target.value })}
                      placeholder="Интерфейс (ppp0...)"
                      className="bg-[#0d1225] border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#34d399]/50 placeholder-gray-600 font-mono"
                    />
                    <input
                      value={newModem.apn}
                      onChange={(e) => setNewModem({ ...newModem, apn: e.target.value })}
                      placeholder="APN (internet.mts.ru...)"
                      className="bg-[#0d1225] border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#34d399]/50 placeholder-gray-600 font-mono col-span-2"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addModem} className="px-4 py-2 bg-[#34d399] text-black text-sm font-semibold rounded-lg hover:bg-[#2bb884] transition-colors">Добавить</button>
                    <button onClick={() => setAddingModem(false)} className="px-4 py-2 bg-white/5 text-gray-400 text-sm rounded-lg hover:bg-white/10 transition-colors">Отмена</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingModem(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-[#34d399]/30 text-[#34d399] text-sm rounded-xl hover:bg-[#34d399]/5 transition-colors"
                >
                  <Icon name="Plus" size={14} />
                  Добавить модем
                </button>
              )}
            </>
          )}

          {/* СПУТНИКОВЫЙ ПОИСК */}
          {tab === "satellite" && (
            <>
              <div className="text-gray-400 text-xs mb-3">
                Поиск информации через спутниковый интернет-канал ЦПВОА. Запрос транслируется через активный спутниковый узел сети.
              </div>

              {/* Статус спутника */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#a78bfa]/10 border border-[#a78bfa]/30 mb-3">
                <div className="w-9 h-9 rounded-lg bg-[#a78bfa]/20 flex items-center justify-center flex-shrink-0">
                  <Icon name="Satellite" size={18} className="text-[#a78bfa]" />
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">VSAT Орион-2 · Спутниковый узел</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-[#a78bfa] rounded-full animate-pulse" />
                    <span className="text-[#a78bfa] text-xs">Канал активен · 50 Мбит/с · Пинг 650мс</span>
                  </div>
                </div>
                <div className="text-gray-500 text-xs text-right">
                  <div>Орбита: ГСО</div>
                  <div>36 000 км</div>
                </div>
              </div>

              {/* Выбор поисковика */}
              <div className="flex gap-2 mb-3">
                {([
                  { id: "google", label: "Google", color: "#60a5fa" },
                  { id: "yandex", label: "Яндекс", color: "#f59e0b" },
                  { id: "bing", label: "Bing", color: "#34d399" },
                ] as const).map(e => (
                  <button
                    key={e.id}
                    onClick={() => setSatEngine(e.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
                    style={satEngine === e.id
                      ? { background: e.color + "22", borderColor: e.color + "66", color: e.color }
                      : { background: "transparent", borderColor: "rgba(255,255,255,0.05)", color: "#6b7280" }
                    }
                  >
                    {e.label}
                  </button>
                ))}
              </div>

              {/* Поисковая строка */}
              <div className="flex gap-2 mb-4">
                <input
                  value={satQuery}
                  onChange={e => setSatQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && satSearch()}
                  placeholder="Введите поисковый запрос..."
                  className="flex-1 bg-[#0d1225] border border-[#a78bfa]/30 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#a78bfa]/60 placeholder-gray-600"
                />
                <button
                  onClick={satSearch}
                  disabled={satLoading || !satQuery.trim()}
                  className="px-4 py-2.5 bg-[#a78bfa] hover:bg-[#8b5cf6] disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {satLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Icon name="Search" size={14} />
                  )}
                  Поиск
                </button>
              </div>

              {/* Результаты */}
              {satLoading && (
                <div className="flex items-center gap-3 p-4 bg-[#a78bfa]/5 rounded-xl border border-[#a78bfa]/20">
                  <span className="w-4 h-4 border-2 border-[#a78bfa]/30 border-t-[#a78bfa] rounded-full animate-spin flex-shrink-0" />
                  <span className="text-[#a78bfa] text-sm">Передача запроса через спутниковый канал...</span>
                </div>
              )}
              {!satLoading && satResults.length > 0 && (
                <div className="space-y-2">
                  <div className="text-gray-500 text-xs mb-1">Найдено источников: {satResults.length}</div>
                  {satResults.map((r, i) => (
                    <a
                      key={i}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1a2e]/60 border border-white/5 hover:border-[#a78bfa]/30 hover:bg-[#a78bfa]/5 transition-all group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#a78bfa]/10 flex items-center justify-center flex-shrink-0">
                        <Icon name="ExternalLink" size={13} className="text-[#a78bfa]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm group-hover:text-[#a78bfa] transition-colors truncate">{r.title}</div>
                        <div className="text-gray-600 text-xs mt-0.5">{r.source} · через спутниковый узел ЦПВОА</div>
                      </div>
                      <Icon name="ChevronRight" size={14} className="text-gray-600 group-hover:text-[#a78bfa] flex-shrink-0 transition-colors" />
                    </a>
                  ))}
                </div>
              )}
              {!satLoading && satResults.length === 0 && !satQuery && (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#a78bfa]/10 flex items-center justify-center">
                    <Icon name="Satellite" size={26} className="text-[#a78bfa]" />
                  </div>
                  <div className="text-gray-500 text-sm">Введи запрос для поиска через спутниковый канал</div>
                </div>
              )}
            </>
          )}

          {/* ПРИОРИТЕТЫ (дополнение 20.05.2026) */}
          {tab === "priorities" && (
            <>
              <div className="text-gray-400 text-xs mb-3">
                Приоритеты ЦПВОА по состоянию на 20.05.2026 — автоматически сформированы на основе данных сети.
              </div>

              {/* Статус сети */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "Активный канал", value: "Ростелеком ВОЛС", color: "#34d399", icon: "Wifi" },
                  { label: "Нагрузка сети", value: "34%", color: "#60a5fa", icon: "Activity" },
                  { label: "Пакетные потери", value: "0.02%", color: "#fbbf24", icon: "AlertTriangle" },
                ].map(s => (
                  <div key={s.label} className="bg-[#0d1225] border border-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon name={s.icon} size={12} style={{ color: s.color }} />
                      <span className="text-gray-500 text-[10px]">{s.label}</span>
                    </div>
                    <div className="text-sm font-bold" style={{ color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Список приоритетов */}
              <div className="space-y-2">
                {[
                  { priority: 1, task: "Восстановить VSAT Орион — ошибка подключения", status: "critical", assignee: "Оператор ЦПВОА", deadline: "20.05.2026" },
                  { priority: 2, task: "Проверить резервный DNS 1.1.1.1 — задержка 230мс", status: "high", assignee: "Системный администратор", deadline: "21.05.2026" },
                  { priority: 3, task: "Обновить профиль APN Билайн", status: "medium", assignee: "Оператор ЦПВОА", deadline: "22.05.2026" },
                  { priority: 4, task: "Добавить резервный канал МегаФон 5G", status: "medium", assignee: "Администратор", deadline: "25.05.2026" },
                  { priority: 5, task: "Провести тест пропускной способности всех каналов", status: "low", assignee: "Аналитик", deadline: "31.05.2026" },
                ].map(item => {
                  const sc: Record<string, { color: string; label: string; bg: string }> = {
                    critical: { color: "#e94560", label: "Критический", bg: "#3d1520" },
                    high:     { color: "#f97316", label: "Высокий",     bg: "#3d1f00" },
                    medium:   { color: "#fbbf24", label: "Средний",     bg: "#3d2e00" },
                    low:      { color: "#60a5fa", label: "Низкий",      bg: "#1e3a5f" },
                  };
                  const s = sc[item.status];
                  return (
                    <div key={item.priority} className="flex items-center gap-3 p-3 bg-[#0d1225] border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: s.bg, color: s.color }}
                      >
                        {item.priority}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm truncate">{item.task}</div>
                        <div className="text-gray-600 text-[11px] mt-0.5">{item.assignee} · до {item.deadline}</div>
                      </div>
                      <div
                        className="text-[10px] px-2 py-0.5 rounded font-semibold shrink-0"
                        style={{ background: s.bg, color: s.color }}
                      >
                        {s.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
          <div className="text-gray-600 text-xs">
            Провайдеров: {providers.length} · DNS-профилей: {dnsRecords.length} · Модемов: {modems.length}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/5 text-gray-400 text-sm rounded-lg hover:bg-white/10 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default EcsuCpvoa;