import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/e610af8a-f8c5-4c04-8d9b-092391fb0c70";
const SECURITY_API = "https://functions.poehali.dev/15640332-461b-47d1-b024-8fa25fb344ef";
const SCHEDULER_URL = "https://functions.poehali.dev/129bc872-862f-4f58-8992-a6f164ca410d";
const G = (s: string) => `linear-gradient(135deg, ${s})`;

type Setting = { key: string; value: string; type: string; description: string; updated_at: string };
type OwnerData = {
  owner_name: string; system_name: string;
  stats: { unread_notifications: number; threats_today: number; transactions_today: number };
  last_access: { action: string; ip: string; at: string }[];
};
type AccessLog = { id: number; action: string; ip: string; ua: string; at: string };

function parse(d: unknown) {
  if (typeof d === "string") { try { return JSON.parse(d); } catch { return d; } }
  return d;
}

const SETTING_LABELS: Record<string, string> = {
  system_name: "Название системы",
  owner_display_name: "Имя владельца",
  notifications_enabled: "Уведомления",
  security_alerts: "Алерты безопасности",
  finance_alerts: "Финансовые алерты",
  auto_block_ip: "Автоблокировка IP",
  absorption_mode: "Режим поглощения",
  export_format: "Формат экспорта",
  timezone: "Часовой пояс",
  currency_primary: "Основная валюта",
  two_factor_enabled: "2FA аутентификация",
  session_timeout_minutes: "Таймаут сессии (мин)",
};

type AbsorptionStats = {
  absorption_balance_usd: number;
  total_penalties_usd: number;
  total_events: number;
  blocked_ips_count: number;
  critical_events: number;
  last_events: { event_type: string; severity: string; ip_address: string; geo_country: string; penalty_amount: number; created_at: string }[];
};

type ScanStatus = { due_now: { incident_scan: boolean; security_check: boolean }; last_runs: { incident_scan: string | null; security_check: string | null } };

export default function EgsuOwner() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"profile" | "settings" | "access" | "recovery" | "absorption" | "autoscan">("profile");
  const [owner, setOwner] = useState<OwnerData | null>(null);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [accessLog, setAccessLog] = useState<AccessLog[]>([]);
  const [absorption, setAbsorption] = useState<AbsorptionStats | null>(null);
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [editVal, setEditVal] = useState<Record<string, string>>({});
  const [recoveryForm, setRecoveryForm] = useState({ reason: "" });
  const [recoveryResult, setRecoveryResult] = useState<{ message: string; token_prefix: string } | null>(null);
  const [scanRunning, setScanRunning] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const load = async () => {
    setLoading(true);
    try {
      const [o, s, al] = await Promise.all([
        fetch(`${API}/owner`).then(r => r.json()).then(parse),
        fetch(`${API}/owner/settings`).then(r => r.json()).then(parse),
        fetch(`${API}/owner/access-log`).then(r => r.json()).then(parse),
      ]);
      setOwner(o as OwnerData);
      if (Array.isArray(s)) {
        setSettings(s);
        const vals: Record<string, string> = {};
        s.forEach((st: Setting) => { vals[st.key] = st.value; });
        setEditVal(vals);
      }
      setAccessLog(Array.isArray(al) ? al : []);

      // Загружаем статистику поглощения
      const abs = await fetch(SECURITY_API).then(r => r.json()).then(parse);
      setAbsorption(abs as AbsorptionStats);

      // Статус планировщика
      const sched = await fetch(SCHEDULER_URL).then(r => r.json()).then(parse).catch(() => null);
      if (sched) setScanStatus(sched as ScanStatus);
    } catch {
      // Тихая ошибка — покажем что загрузилось
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveSetting = async (key: string) => {
    setSaving(key);
    await fetch(`${API}/owner/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: editVal[key] }),
    });
    setSaving(null);
    showToast(`✓ Настройка «${SETTING_LABELS[key] ?? key}» сохранена`);
    load();
  };

  const sendRecovery = async () => {
    if (!recoveryForm.reason.trim()) return;
    setSaving("recovery");
    const r = await fetch(`${API}/recovery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recoveryForm),
    });
    const d = parse(await r.json()) as { message: string; token_prefix: string };
    setSaving(null);
    setRecoveryResult(d);
  };

  const boolColor = (val: string) => val === "true" ? "#00ff87" : "rgba(255,255,255,0.25)";

  return (
    <div className="min-h-screen font-body" style={{ background: "#060a12" }}>
      {toast && (
        <div className="fixed top-20 right-6 z-[100] px-4 py-3 rounded-xl text-sm font-semibold shadow-xl"
          style={{ background: "rgba(0,255,135,0.92)", color: "black" }}>{toast}</div>
      )}

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-3"
        style={{ background: "rgba(6,10,18,0.98)", borderBottom: "1px solid rgba(168,85,247,0.2)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/egsu/dashboard")} className="text-white/40 hover:text-white/70 transition-colors">
            <Icon name="ChevronLeft" size={16} />
          </button>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: G("#a855f7, #3b82f6") }}>
            <Icon name="UserCog" size={14} className="text-white" />
          </div>
          <div>
            <div className="font-display text-base font-bold text-white tracking-wide leading-none">ПАНЕЛЬ ВЛАДЕЛЬЦА</div>
            <div className="text-white/30 text-[10px]">ECSU 2.0 · Управление системой</div>
          </div>
        </div>
        {owner && (
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <div className="text-white/80 text-sm font-semibold">{owner.owner_name}</div>
              <div className="text-white/30 text-[10px]">{owner.system_name}</div>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: G("#a855f7, #3b82f6") }}>
              <Icon name="User" size={15} className="text-white" />
            </div>
          </div>
        )}
      </nav>

      <div className="pt-14 flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="fixed left-0 top-14 bottom-0 w-14 md:w-56 flex flex-col py-4 gap-1 px-2"
          style={{ background: "rgba(6,10,18,0.95)", borderRight: "1px solid rgba(168,85,247,0.1)" }}>
          {[
            { id: "profile", icon: "User", label: "Профиль" },
            { id: "absorption", icon: "ShieldAlert", label: "Поглощение" },
            { id: "autoscan", icon: "Radar", label: "Автосканирование" },
            { id: "settings", icon: "Settings", label: "Настройки" },
            { id: "access", icon: "ClipboardList", label: "Журнал доступа" },
            { id: "recovery", icon: "KeyRound", label: "Восстановление" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left"
              style={{
                background: tab === t.id ? "rgba(168,85,247,0.12)" : "transparent",
                color: tab === t.id ? "#a855f7" : "rgba(255,255,255,0.4)",
                border: tab === t.id ? "1px solid rgba(168,85,247,0.25)" : "1px solid transparent",
              }}>
              <Icon name={t.icon as "User"} size={16} />
              <span className="hidden md:block text-xs">{t.label}</span>
            </button>
          ))}
          <div style={{ marginTop: "auto", padding: "8px 4px 4px" }}>
            <button onClick={() => navigate("/egsu/ark")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", color: "#f43f5e" }}>
              <Icon name="Anchor" size={16} />
              <span className="hidden md:block text-xs">⚓ Ковчег</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 ml-14 md:ml-56 p-4 md:p-6">
          {loading && <div className="text-center py-20 text-white/30">Загружаю...</div>}

          {/* PROFILE */}
          {!loading && tab === "profile" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-white uppercase">Профиль владельца</h1>
                <p className="text-white/30 text-sm mt-1">Системная информация и статус</p>
              </div>

              {/* Карточка владельца */}
              <div className="p-6 rounded-2xl relative overflow-hidden"
                style={{ background: "rgba(168,85,247,0.07)", border: "2px solid rgba(168,85,247,0.25)" }}>
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-5"
                  style={{ background: G("#a855f7,#3b82f6"), transform: "translate(30%,-30%)" }} />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: G("#a855f7,#3b82f6") }}>
                    <Icon name="Crown" size={28} className="text-white" />
                  </div>
                  <div>
                    <div className="font-display text-xl font-bold text-white">{owner?.owner_name ?? "Николаев Владимир Владимирович"}</div>
                    <div className="text-white/40 text-sm mt-0.5">Владелец · {owner?.system_name ?? "ECSU 2.0"}</div>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                        style={{ background: "rgba(0,255,135,0.12)", border: "1px solid rgba(0,255,135,0.25)" }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-green-400 text-xs font-bold">ACTIVE</span>
                      </div>
                      <div className="px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7" }}>OWNER ROLE</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Статистика */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Непрочитанных\nуведомлений", val: owner?.stats?.unread_notifications ?? 0, icon: "Bell", color: "#f59e0b" },
                  { label: "Угроз за 24ч", val: owner?.stats?.threats_today ?? 0, icon: "ShieldAlert", color: "#f43f5e" },
                  { label: "Транзакций за 24ч", val: owner?.stats?.transactions_today ?? 0, icon: "ArrowLeftRight", color: "#3b82f6" },
                ].map(k => (
                  <div key={k.label} className="p-4 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${k.color}20` }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${k.color}15` }}>
                      <Icon name={k.icon as "Bell"} size={16} style={{ color: k.color }} />
                    </div>
                    <div className="font-display text-3xl font-bold" style={{ color: k.color }}>{k.val}</div>
                    <div className="text-white/30 text-xs mt-0.5 whitespace-pre-line">{k.label}</div>
                  </div>
                ))}
              </div>

              {/* Последний доступ */}
              {(owner?.last_access?.length ?? 0) > 0 && (
                <div className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="font-display text-sm font-bold text-white/50 uppercase tracking-widest mb-3">Последние действия</div>
                  <div className="space-y-2">
                    {(owner?.last_access ?? []).map((a, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-2">
                          <Icon name="Activity" size={13} className="text-purple-400/60" />
                          <span className="text-white/60 text-sm">{a.action}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-white/30 text-xs">{a.ip}</div>
                          <div className="text-white/20 text-[10px]">{new Date(a.at).toLocaleString("ru-RU")}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Быстрые переходы */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Финансы", icon: "Wallet", to: "/egsu/finance", color: "#f59e0b" },
                  { label: "Безопасность", icon: "ShieldAlert", to: "/egsu/security", color: "#f43f5e" },
                  { label: "Аналитика", icon: "BarChart3", to: "/egsu/analytics", color: "#3b82f6" },
                  { label: "Уведомления", icon: "Bell", to: "/egsu/notifications", color: "#a855f7" },
                ].map(item => (
                  <button key={item.label} onClick={() => navigate(item.to)}
                    className="p-4 rounded-2xl text-center transition-all hover:scale-105"
                    style={{ background: `${item.color}10`, border: `1px solid ${item.color}25` }}>
                    <Icon name={item.icon as "Wallet"} size={22} className="mx-auto mb-2" style={{ color: item.color }} />
                    <div className="text-white/60 text-xs font-semibold">{item.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {!loading && tab === "settings" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-white uppercase">Настройки системы</h1>
                <p className="text-white/30 text-sm mt-1">Конфигурация ECSU 2.0</p>
              </div>
              <div className="space-y-3">
                {settings.map(s => (
                  <div key={s.key} className="p-4 rounded-2xl flex items-center gap-4"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-white/80 text-sm font-semibold">{SETTING_LABELS[s.key] ?? s.key}</div>
                      <div className="text-white/30 text-xs mt-0.5">{s.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.type === "boolean" ? (
                        <button onClick={() => {
                          const newVal = editVal[s.key] === "true" ? "false" : "true";
                          setEditVal(v => ({ ...v, [s.key]: newVal }));
                          saveSetting(s.key);
                        }}
                          className="w-12 h-6 rounded-full transition-all relative"
                          style={{ background: editVal[s.key] === "true" ? "rgba(0,255,135,0.4)" : "rgba(255,255,255,0.1)" }}>
                          <div className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                            style={{ background: boolColor(editVal[s.key] ?? "false"), left: editVal[s.key] === "true" ? "26px" : "2px" }} />
                        </button>
                      ) : (
                        <>
                          <input value={editVal[s.key] ?? ""} onChange={e => setEditVal(v => ({ ...v, [s.key]: e.target.value }))}
                            className="px-3 py-1.5 rounded-lg text-white text-sm outline-none w-36 md:w-48"
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                          <button onClick={() => saveSetting(s.key)} disabled={saving === s.key}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 disabled:opacity-40"
                            style={{ background: "rgba(168,85,247,0.2)", color: "#a855f7" }}>
                            {saving === s.key ? "..." : "Сохранить"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ПОГЛОЩЕНИЕ */}
          {!loading && tab === "absorption" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-white uppercase">Режим Поглощения</h1>
                <p className="text-white/30 text-sm mt-1">Штрафные начисления с нарушителей · Автозащита системы</p>
              </div>

              {absorption ? (
                <>
                  {/* Баланс */}
                  <div className="p-6 rounded-2xl relative overflow-hidden"
                    style={{ background: "rgba(244,63,94,0.07)", border: "2px solid rgba(244,63,94,0.25)" }}>
                    <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-5" style={{ background: G("#f43f5e,#f59e0b"), transform: "translate(30%,-30%)" }} />
                    <div className="relative z-10">
                      <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Баланс счёта Поглощения</div>
                      <div className="font-display text-4xl font-black text-white mb-1">
                        ${absorption.absorption_balance_usd?.toLocaleString("ru-RU", { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-white/40 text-xs">Всего штрафов взыскано: ${absorption.total_penalties_usd?.toLocaleString("ru-RU", { maximumFractionDigits: 0 })}</div>
                    </div>
                  </div>

                  {/* Статы */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Всего событий", val: absorption.total_events, color: "#3b82f6" },
                      { label: "Критических", val: absorption.critical_events, color: "#f43f5e" },
                      { label: "Заблокировано IP", val: absorption.blocked_ips_count, color: "#f59e0b" },
                      { label: "Штрафов USD", val: `$${(absorption.total_penalties_usd || 0).toFixed(0)}`, color: "#00ff87" },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div className="text-white/40 text-[10px] uppercase tracking-wide mb-1">{label}</div>
                        <div className="font-bold text-xl" style={{ color }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Кнопки действий */}
                  <div className="flex gap-3 flex-wrap">
                    <button onClick={() => navigate("/egsu/security")}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
                      style={{ background: "rgba(244,63,94,0.15)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.3)" }}>
                      <Icon name="ShieldAlert" size={15} />
                      Открыть Безопасность
                    </button>
                    <button onClick={load}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
                      style={{ background: "rgba(168,85,247,0.12)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.25)" }}>
                      <Icon name="RefreshCw" size={15} />
                      Обновить
                    </button>
                  </div>

                  {/* Последние события */}
                  {absorption.last_events && absorption.last_events.length > 0 && (
                    <div>
                      <div className="text-white/30 text-xs uppercase tracking-widest mb-3">Последние события безопасности</div>
                      <div className="space-y-2">
                        {absorption.last_events.map((e, i) => (
                          <div key={i} className="p-3 rounded-xl flex items-center gap-3"
                            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: e.severity === "critical" ? "#f43f5e" : e.severity === "high" ? "#f59e0b" : "#3b82f6" }} />
                            <div className="flex-1 min-w-0">
                              <div className="text-white/80 text-sm font-medium">{e.event_type}</div>
                              <div className="text-white/30 text-xs">{e.ip_address} · {e.geo_country}</div>
                            </div>
                            <div className="text-green-400 text-sm font-bold shrink-0">${Number(e.penalty_amount).toFixed(0)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16 text-white/30">
                  <Icon name="ShieldAlert" size={36} className="mx-auto mb-2 opacity-30" />
                  <p>Загружаю данные поглощения...</p>
                </div>
              )}
            </div>
          )}

          {/* АВТОСКАНИРОВАНИЕ */}
          {!loading && tab === "autoscan" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-white uppercase">Автосканирование</h1>
                <p className="text-white/30 text-sm mt-1">Автоматический парсинг открытых источников инцидентов</p>
              </div>

              {/* Статус планировщика */}
              {scanStatus && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      label: "Сканирование инцидентов",
                      icon: "Search",
                      due: scanStatus.due_now.incident_scan,
                      last: scanStatus.last_runs.incident_scan,
                      interval: "60 мин",
                    },
                    {
                      label: "Проверка безопасности",
                      icon: "Shield",
                      due: scanStatus.due_now.security_check,
                      last: scanStatus.last_runs.security_check,
                      interval: "15 мин",
                    },
                  ].map(({ label, icon, due, last, interval }) => (
                    <div key={label} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${due ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.07)"}` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${due ? "bg-amber-400 animate-pulse" : "bg-green-400"}`} />
                        <Icon name={icon as "Shield"} size={14} className="text-white/50" />
                        <div className="text-white/80 text-sm font-semibold">{label}</div>
                      </div>
                      <div className="text-white/30 text-xs">Интервал: {interval}</div>
                      <div className="text-white/30 text-xs">
                        Последний запуск: {last ? new Date(last).toLocaleString("ru-RU") : "не запускался"}
                      </div>
                      <div className={`text-xs mt-1 font-bold ${due ? "text-amber-400" : "text-green-400"}`}>
                        {due ? "⚡ Готов к запуску" : "✓ Актуально"}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Источники */}
              <div>
                <div className="text-white/30 text-xs uppercase tracking-widest mb-3">Открытые источники данных</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { id: "GDACS", desc: "Стихийные бедствия (ООН)", color: "#f43f5e", icon: "Globe" },
                    { id: "USGS", desc: "Землетрясения (США)", color: "#f59e0b", icon: "Activity" },
                    { id: "OpenAQ", desc: "Качество воздуха PM2.5", color: "#3b82f6", icon: "Wind" },
                    { id: "CVE/CIRCL", desc: "Киберуязвимости", color: "#a855f7", icon: "AlertTriangle" },
                    { id: "ReliefWeb", desc: "Гуманитарные кризисы (ООН)", color: "#00ff87", icon: "Users" },
                    { id: "EMSC", desc: "Сейсмическая активность (EU)", color: "#f59e0b", icon: "Zap" },
                  ].map(({ id, desc, color, icon }) => (
                    <div key={id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <Icon name={icon as "Globe"} size={16} style={{ color }} />
                      <div>
                        <div className="text-white/80 text-sm font-semibold">{id}</div>
                        <div className="text-white/30 text-xs">{desc}</div>
                      </div>
                      <div className="ml-auto w-2 h-2 rounded-full bg-green-400" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Кнопки запуска */}
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={async () => {
                    setScanRunning(true);
                    try {
                      const r = await fetch(SCHEDULER_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tasks: "scan", force: true }) });
                      const d = parse(await r.json()) as { results?: { incident_scan?: { created?: number } } };
                      const created = d.results?.incident_scan?.created ?? 0;
                      showToast(`✓ Сканирование завершено. Добавлено ${created} инцидентов.`);
                      load();
                    } catch { showToast("✗ Ошибка сканирования"); }
                    setScanRunning(false);
                  }}
                  disabled={scanRunning}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}>
                  <Icon name={scanRunning ? "Loader" : "Search"} size={15} />
                  {scanRunning ? "Сканирование..." : "Запустить сканирование"}
                </button>
                <button
                  onClick={async () => {
                    setScanRunning(true);
                    try {
                      const r = await fetch(SCHEDULER_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tasks: "all", force: true }) });
                      const d = parse(await r.json()) as { tasks_executed?: number };
                      showToast(`✓ Все задачи выполнены (${d.tasks_executed ?? 0})`);
                      load();
                    } catch { showToast("✗ Ошибка"); }
                    setScanRunning(false);
                  }}
                  disabled={scanRunning}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }}>
                  <Icon name="RefreshCw" size={15} />
                  Запустить все задачи
                </button>
              </div>

              <div className="p-4 rounded-xl text-xs text-white/30" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                Планировщик работает в режиме ручного запуска. Нажмите кнопку для немедленного сканирования или дождитесь автозапуска по расписанию.
              </div>
            </div>
          )}

          {/* ACCESS LOG */}
          {!loading && tab === "access" && (
            <div>
              <div className="mb-6">
                <h1 className="font-display text-2xl font-bold text-white uppercase">Журнал доступа</h1>
                <p className="text-white/30 text-sm mt-1">{accessLog.length} записей</p>
              </div>
              <div className="space-y-2">
                {accessLog.map(a => (
                  <div key={a.id} className="p-4 rounded-2xl flex items-center gap-4"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(168,85,247,0.12)" }}>
                      <Icon name="LogIn" size={16} className="text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white/80 text-sm font-semibold">{a.action}</div>
                      <div className="font-mono text-white/30 text-xs mt-0.5">{a.ip}</div>
                    </div>
                    <div className="text-white/25 text-xs shrink-0">{new Date(a.at).toLocaleString("ru-RU")}</div>
                  </div>
                ))}
                {accessLog.length === 0 && (
                  <div className="text-center py-16 text-white/25">
                    <Icon name="ClipboardList" size={36} className="mx-auto mb-2 opacity-30" />
                    <p>Журнал пуст</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RECOVERY */}
          {!loading && tab === "recovery" && (
            <div className="max-w-lg">
              <div className="mb-6">
                <h1 className="font-display text-2xl font-bold text-white uppercase">Восстановление доступа</h1>
                <p className="text-white/30 text-sm mt-1">Запросить восстановление при потере доступа к системе</p>
              </div>

              <div className="p-5 rounded-2xl mb-6"
                style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <div className="flex items-start gap-3">
                  <Icon name="AlertTriangle" size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-white/60 text-sm">
                    Функция восстановления создаёт запрос в системе. Администратор свяжется с вами для верификации личности и предоставит временный доступ.
                  </div>
                </div>
              </div>

              {!recoveryResult ? (
                <div className="p-6 rounded-2xl space-y-4"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Причина запроса *</label>
                    <textarea value={recoveryForm.reason} onChange={e => setRecoveryForm({ reason: e.target.value })}
                      placeholder="Опишите причину потери доступа..."
                      rows={4}
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none resize-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      "Потеря пароля", "Смена устройства", "Взлом аккаунта",
                      "Технический сбой", "Смена телефона", "Другая причина"
                    ].map(r => (
                      <button key={r} onClick={() => setRecoveryForm({ reason: r })}
                        className="px-3 py-2 rounded-lg text-xs text-left transition-all hover:scale-105"
                        style={{
                          background: recoveryForm.reason === r ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.04)",
                          color: recoveryForm.reason === r ? "#a855f7" : "rgba(255,255,255,0.5)",
                          border: `1px solid ${recoveryForm.reason === r ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.08)"}`,
                        }}>
                        {r}
                      </button>
                    ))}
                  </div>
                  <button onClick={sendRecovery} disabled={saving === "recovery" || !recoveryForm.reason.trim()}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-40"
                    style={{ background: G("#a855f7, #3b82f6"), color: "white" }}>
                    {saving === "recovery" ? "Отправляю запрос..." : "Отправить запрос на восстановление"}
                  </button>
                </div>
              ) : (
                <div className="p-6 rounded-2xl space-y-4"
                  style={{ background: "rgba(0,255,135,0.06)", border: "2px solid rgba(0,255,135,0.25)" }}>
                  <div className="flex items-center gap-3">
                    <Icon name="CheckCircle" size={24} className="text-green-400" />
                    <div className="font-bold text-white">Запрос зафиксирован</div>
                  </div>
                  <p className="text-white/60 text-sm">{recoveryResult.message}</p>
                  <div className="p-3 rounded-xl" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}>
                    <div className="text-white/40 text-xs mb-1">Код подтверждения (первые 4 символа)</div>
                    <div className="font-mono font-bold text-xl text-purple-400">{recoveryResult.token_prefix}••••••••••••</div>
                    <div className="text-white/25 text-xs mt-1">Сохраните для верификации</div>
                  </div>
                  <button onClick={() => setRecoveryResult(null)} className="text-white/40 text-sm hover:text-white/70 transition-colors">
                    ← Новый запрос
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}