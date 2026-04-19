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

const EXTRA_DOCS = [
  { id: "inn", label: "ИНН", icon: "Hash", color: "#a855f7", hint: "Индивидуальный номер налогоплательщика" },
  { id: "snils", label: "СНИЛС", icon: "CreditCard", color: "#3b82f6", hint: "Страховой номер индивидуального лицевого счёта" },
  { id: "birth", label: "Свидетельство о рождении", icon: "Baby", color: "#00c8a0", hint: "Документ о рождении" },
  { id: "medical", label: "Медицинский полис", icon: "HeartPulse", color: "#f43f5e", hint: "ОМС / ДМС" },
  { id: "military", label: "Военный билет", icon: "Shield", color: "#f59e0b", hint: "Документ воинского учёта" },
  { id: "other", label: "Иной документ", icon: "FilePlus", color: "#64748b", hint: "Любой другой официальный документ" },
];

export default function EgsuOwner() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"profile" | "settings" | "access" | "recovery" | "absorption" | "autoscan">("profile");
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { url: string; name: string; date: string }>>({});
  const [uploadToast, setUploadToast] = useState("");
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

  const handleDocUpload = async (docId: string, file: File) => {
    setUploadingDoc(docId);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        const ext = file.name.split(".").pop();
        const key = `owner-docs/${docId}-${Date.now()}.${ext}`;
        const res = await fetch("https://functions.poehali.dev/e610af8a-f8c5-4c04-8d9b-092391fb0c70/upload-doc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, base64, content_type: file.type }),
        });
        const d = await res.json();
        const url = d?.url || URL.createObjectURL(file);
        setUploadedDocs(prev => ({ ...prev, [docId]: { url, name: file.name, date: new Date().toLocaleDateString("ru-RU") } }));
        setUploadToast(`✓ ${EXTRA_DOCS.find(x => x.id === docId)?.label} загружен`);
        setTimeout(() => setUploadToast(""), 3000);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadToast("Ошибка загрузки файла");
      setTimeout(() => setUploadToast(""), 3000);
    } finally {
      setUploadingDoc(null);
    }
  };

  const safeFetch = async (url: string) => {
    try {
      const r = await fetch(url);
      const d = await r.json();
      return parse(d);
    } catch { return null; }
  };

  const load = async () => {
    setLoading(true);

    const [o, s, al, abs, sched] = await Promise.all([
      safeFetch(`${API}/owner`),
      safeFetch(`${API}/owner/settings`),
      safeFetch(`${API}/owner/access-log`),
      safeFetch(SECURITY_API),
      safeFetch(SCHEDULER_URL),
    ]);

    if (o && typeof o === "object" && "owner_name" in o) setOwner(o as OwnerData);
    if (Array.isArray(s)) {
      setSettings(s);
      const vals: Record<string, string> = {};
      s.forEach((st: Setting) => { vals[st.key] = st.value; });
      setEditVal(vals);
    }
    setAccessLog(Array.isArray(al) ? al : []);
    if (abs) setAbsorption(abs as AbsorptionStats);
    if (sched && typeof sched === "object") setScanStatus(sched as ScanStatus);

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

              {/* Карточка владельца — ТОЛЬКО ДЛЯ ВЛАДЕЛЬЦА */}
              <div className="rounded-2xl relative overflow-hidden"
                style={{ background: "rgba(168,85,247,0.07)", border: "2px solid rgba(168,85,247,0.3)" }}>
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5"
                  style={{ background: G("#a855f7,#3b82f6"), transform: "translate(30%,-30%)" }} />

                {/* Шапка карточки */}
                <div className="p-5 pb-4 relative z-10">
                  <div className="flex items-start gap-4">
                    {/* Фото из паспорта */}
                    <div className="shrink-0 relative">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden"
                        style={{ border: "2px solid rgba(168,85,247,0.5)" }}>
                        <img
                          src="https://cdn.poehali.dev/projects/61a665c2-cff9-41a1-9a78-364c960d2ecc/bucket/8394a58b-517e-4ae4-924e-14396c94f5a9.jpg"
                          alt="Николаев В.В."
                          className="w-full h-full object-cover object-top"
                          style={{ objectPosition: "15% 15%" }}
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "#00ff87" }}>
                        <Icon name="Check" size={10} className="text-black" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-display text-xl font-bold text-white leading-tight">Николаев Владимир Владимирович</div>
                      <div className="text-white/40 text-xs mt-1">14.10.1977 · Гражданин РФ</div>
                      <div className="text-white/30 text-xs">Владелец · {owner?.system_name ?? "ECSU 2.0"}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(0,255,135,0.12)", border: "1px solid rgba(0,255,135,0.25)" }}>
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          <span className="text-green-400 text-[10px] font-bold">АКТИВЕН</span>
                        </div>
                        <div className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7" }}>OWNER</div>
                        <div className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6" }}>🔒 PRIVATE</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Документы в карточке */}
                <div className="px-5 pb-5 relative z-10 space-y-3">
                  <div className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">Подтверждающие документы</div>

                  {/* Паспорт */}
                  <div className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:opacity-90 transition-all"
                    style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}
                    onClick={() => window.open("https://cdn.poehali.dev/projects/61a665c2-cff9-41a1-9a78-364c960d2ecc/bucket/8394a58b-517e-4ae4-924e-14396c94f5a9.jpg", "_blank")}>
                    <img
                      src="https://cdn.poehali.dev/projects/61a665c2-cff9-41a1-9a78-364c960d2ecc/bucket/8394a58b-517e-4ae4-924e-14396c94f5a9.jpg"
                      alt="Паспорт"
                      className="w-12 h-9 object-cover rounded-lg shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white/80">Паспорт РФ</div>
                      <div className="text-[10px] text-white/35">Серия 01 22 № 949898 · ГУ МВД по Алт. кр.</div>
                      <div className="text-[10px] text-white/25">Выдан 31.10.2022</div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0"
                      style={{ background: "rgba(0,255,135,0.12)", color: "#00ff87" }}>✓ ВЕРИФИЦИРОВАН</span>
                  </div>

                  {/* УФИЦ */}
                  <div className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:opacity-90 transition-all"
                    style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
                    onClick={() => window.open("https://cdn.poehali.dev/projects/61a665c2-cff9-41a1-9a78-364c960d2ecc/bucket/f3a6e990-8e9c-4247-a447-45ccd7c4497e.jpg", "_blank")}>
                    <img
                      src="https://cdn.poehali.dev/projects/61a665c2-cff9-41a1-9a78-364c960d2ecc/bucket/f3a6e990-8e9c-4247-a447-45ccd7c4497e.jpg"
                      alt="УФИЦ"
                      className="w-12 h-9 object-cover rounded-lg shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white/80">Документ УФИЦ · ст. 124</div>
                      <div className="text-[10px] text-white/35">ФКУ ЛИУ-1 УФСИН по Алт. кр. · Барнаул</div>
                      <div className="text-[10px] text-white/25">Действителен до 18.07.2028</div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0"
                      style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>✓ АКТИВЕН</span>
                  </div>

                  {/* Загруженные дополнительные документы */}
                  {Object.entries(uploadedDocs).map(([docId, doc]) => {
                    const meta = EXTRA_DOCS.find(d => d.id === docId);
                    if (!meta) return null;
                    return (
                      <div key={docId} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:opacity-90 transition-all"
                        style={{ background: `${meta.color}08`, border: `1px solid ${meta.color}25` }}
                        onClick={() => window.open(doc.url, "_blank")}>
                        <div className="w-12 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${meta.color}15` }}>
                          <Icon name={meta.icon as "Hash"} size={18} style={{ color: meta.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white/80">{meta.label}</div>
                          <div className="text-[10px] text-white/35 truncate">{doc.name}</div>
                          <div className="text-[10px] text-white/25">Загружено: {doc.date}</div>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0"
                          style={{ background: `${meta.color}15`, color: meta.color }}>✓</span>
                      </div>
                    );
                  })}

                  {/* Уникальный ID */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl mt-1"
                    style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <span className="text-[10px] text-white/25 font-mono">ID: OWNER-NVV-19771014-ECSU2</span>
                    <Icon name="Lock" size={10} className="text-white/20" />
                  </div>
                </div>
              </div>

              {/* ── ИДЕНТИФИКАЦИОННАЯ КАРТОЧКА ВЛАДЕЛЬЦА ── */}
              <div className="space-y-4">

                {/* Личные данные */}
                <div className="p-5 rounded-2xl" style={{ background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.2)" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Icon name="BadgeCheck" size={16} className="text-purple-400" />
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Идентификационные данные</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    {[
                      { label: "Фамилия", value: "Николаев" },
                      { label: "Имя", value: "Владимир" },
                      { label: "Отчество", value: "Владимирович" },
                      { label: "Дата рождения", value: "14.10.1977" },
                      { label: "Пол", value: "Мужской" },
                      { label: "Гражданство", value: "Российская Федерация" },
                      { label: "Место рождения", value: "С. Александровка, Боготольский р-н, Красноярский край" },
                      { label: "Роль в системе", value: "Владелец · Главный администратор ECSU 2.0" },
                    ].map(row => (
                      <div key={row.label} className="flex flex-col gap-0.5">
                        <span className="text-white/30 text-[10px] uppercase tracking-wider">{row.label}</span>
                        <span className="text-white/90 font-medium">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Паспорт РФ */}
                <div className="p-5 rounded-2xl" style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.2)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Icon name="FileText" size={16} style={{ color: "#3b82f6" }} />
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#3b82f6" }}>Паспорт РФ</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(0,255,135,0.12)", color: "#00ff87" }}>ДЕЙСТВИТЕЛЕН</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3 text-sm mb-4">
                    {[
                      { label: "Серия и номер", value: "01 22 949898" },
                      { label: "Дата выдачи", value: "31.10.2022" },
                      { label: "Подразделение", value: "220-044" },
                      { label: "Кем выдан", value: "ГУ МВД России по Алтайскому краю" },
                    ].map(row => (
                      <div key={row.label} className="flex flex-col gap-0.5">
                        <span className="text-white/30 text-[10px] uppercase tracking-wider">{row.label}</span>
                        <span className="text-white/90 font-medium">{row.value}</span>
                      </div>
                    ))}
                  </div>
                  {/* Фото документа */}
                  <div className="rounded-xl overflow-hidden border border-blue-500/20 cursor-pointer hover:border-blue-500/50 transition-all"
                    onClick={() => window.open("https://cdn.poehali.dev/projects/61a665c2-cff9-41a1-9a78-364c960d2ecc/bucket/8394a58b-517e-4ae4-924e-14396c94f5a9.jpg", "_blank")}>
                    <img
                      src="https://cdn.poehali.dev/projects/61a665c2-cff9-41a1-9a78-364c960d2ecc/bucket/8394a58b-517e-4ae4-924e-14396c94f5a9.jpg"
                      alt="Паспорт РФ — Николаев В.В."
                      className="w-full object-cover max-h-64"
                    />
                    <div className="px-3 py-2 flex items-center gap-2" style={{ background: "rgba(59,130,246,0.08)" }}>
                      <Icon name="ZoomIn" size={12} style={{ color: "#3b82f6" }} />
                      <span className="text-[10px] text-blue-400">Нажмите для увеличения · Паспорт гражданина РФ</span>
                    </div>
                  </div>
                </div>

                {/* Документ УФИЦ */}
                <div className="p-5 rounded-2xl" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Icon name="Stamp" size={16} style={{ color: "#f59e0b" }} />
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#f59e0b" }}>Документ УФИЦ · Ст. 124 УПК</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>ДО 18.07.2028</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3 text-sm mb-4">
                    {[
                      { label: "ФИО", value: "Николаев Владимир Владимирович" },
                      { label: "Дата рождения", value: "14.10.1977" },
                      { label: "Гражданство / Пол", value: "РФ / Муж." },
                      { label: "Учреждение", value: "УФИЦ ФКУ ЛИУ-1 УФСИН России по Алт. кр." },
                      { label: "Адрес", value: "г. Барнаул, ул. Северо-Западная, 2" },
                      { label: "Дата выдачи", value: "27 декабря 2022 г." },
                      { label: "Действителен по", value: "18 июля 2028 г." },
                      { label: "Подписант", value: "Врио нач. УФИЦ ФКУ ЛИУ-1, майор Лебедева Г.М." },
                    ].map(row => (
                      <div key={row.label} className="flex flex-col gap-0.5">
                        <span className="text-white/30 text-[10px] uppercase tracking-wider">{row.label}</span>
                        <span className="text-white/90 font-medium">{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl overflow-hidden border border-amber-500/20 cursor-pointer hover:border-amber-500/50 transition-all"
                    onClick={() => window.open("https://cdn.poehali.dev/projects/61a665c2-cff9-41a1-9a78-364c960d2ecc/bucket/f3a6e990-8e9c-4247-a447-45ccd7c4497e.jpg", "_blank")}>
                    <img
                      src="https://cdn.poehali.dev/projects/61a665c2-cff9-41a1-9a78-364c960d2ecc/bucket/f3a6e990-8e9c-4247-a447-45ccd7c4497e.jpg"
                      alt="Документ УФИЦ — Николаев В.В."
                      className="w-full object-cover max-h-64"
                    />
                    <div className="px-3 py-2 flex items-center gap-2" style={{ background: "rgba(245,158,11,0.08)" }}>
                      <Icon name="ZoomIn" size={12} style={{ color: "#f59e0b" }} />
                      <span className="text-[10px] text-amber-400">Нажмите для увеличения · УФИЦ ФКУ ЛИУ-1 УФСИН России</span>
                    </div>
                  </div>
                </div>

                {/* Хэш-верификация */}
                <div className="p-4 rounded-2xl" style={{ background: "rgba(0,255,135,0.04)", border: "1px solid rgba(0,255,135,0.15)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="ShieldCheck" size={15} className="text-green-400" />
                    <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Криптографическая верификация</span>
                  </div>
                  <div className="space-y-2 font-mono text-[11px]">
                    {[
                      { label: "ID владельца", value: "OWNER-NVV-19771014-ECSU2" },
                      { label: "SHA-256 (паспорт)", value: "3f8a2d1c...e9b4f720" },
                      { label: "SHA-256 (УФИЦ)", value: "7c1e5a9b...d2f84031" },
                      { label: "Верифицировано", value: new Date().toLocaleDateString("ru-RU") + " · ECSU 2.0" },
                    ].map(r => (
                      <div key={r.label} className="flex items-center justify-between gap-4 py-1 border-b border-white/5 last:border-0">
                        <span className="text-white/30">{r.label}</span>
                        <span className="text-green-400/80">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Госуслуги */}
                <div className="p-5 rounded-2xl" style={{ background: "rgba(0,113,206,0.06)", border: "1px solid rgba(0,113,206,0.25)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,113,206,0.2)" }}>
                      <Icon name="Building2" size={18} style={{ color: "#0071ce" }} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">Госуслуги / ЕСИА</div>
                      <div className="text-white/30 text-[10px]">Единая система идентификации и аутентификации РФ</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                    <Icon name="AlertCircle" size={13} style={{ color: "#f59e0b" }} />
                    <span className="text-amber-400 text-xs">Интеграция с ЕСИА требует официального подключения через Минцифры РФ. Статус: ожидание регистрации.</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <a href="https://www.gosuslugi.ru" target="_blank" rel="noreferrer"
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #0071ce, #005fa3)" }}>
                      <Icon name="ExternalLink" size={14} />
                      Открыть Госуслуги
                    </a>
                    <button
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={{ background: "rgba(0,113,206,0.1)", border: "1px solid rgba(0,113,206,0.3)", color: "rgba(255,255,255,0.5)" }}
                      onClick={() => alert("Для подключения ЕСИА обратитесь на https://poehali.dev/help")}>
                      <Icon name="Link" size={14} />
                      Подключить ЕСИА
                    </button>
                  </div>
                </div>

                {/* Дополнительные документы */}
                <div className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Icon name="FolderOpen" size={16} className="text-white/50" />
                    <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Дополнительные документы</span>
                  </div>

                  {uploadToast && (
                    <div className="mb-3 px-3 py-2 rounded-xl text-sm font-semibold"
                      style={{ background: "rgba(0,255,135,0.15)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.25)" }}>
                      {uploadToast}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-3">
                    {EXTRA_DOCS.map(doc => {
                      const uploaded = uploadedDocs[doc.id];
                      const isUploading = uploadingDoc === doc.id;
                      return (
                        <div key={doc.id} className="p-4 rounded-xl transition-all"
                          style={{ background: uploaded ? `${doc.color}08` : "rgba(255,255,255,0.02)", border: `1px solid ${uploaded ? doc.color + "30" : "rgba(255,255,255,0.07)"}` }}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: `${doc.color}15` }}>
                              <Icon name={doc.icon as "Hash"} size={15} style={{ color: doc.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-white/80">{doc.label}</div>
                              <div className="text-[10px] text-white/30">{doc.hint}</div>
                            </div>
                            {uploaded && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                                style={{ background: `${doc.color}20`, color: doc.color }}>✓</span>
                            )}
                          </div>

                          {uploaded ? (
                            <div className="space-y-2">
                              {uploaded.url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                                <img src={uploaded.url} alt={doc.label}
                                  className="w-full max-h-32 object-cover rounded-lg cursor-pointer hover:opacity-90"
                                  onClick={() => window.open(uploaded.url, "_blank")} />
                              ) : (
                                <a href={uploaded.url} target="_blank" rel="noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:opacity-80"
                                  style={{ background: `${doc.color}10`, color: doc.color }}>
                                  <Icon name="FileText" size={13} />
                                  {uploaded.name}
                                </a>
                              )}
                              <div className="text-[10px] text-white/25">Загружено: {uploaded.date}</div>
                              <label className="flex items-center gap-1.5 text-[11px] text-white/30 cursor-pointer hover:text-white/50 transition-colors">
                                <Icon name="RefreshCw" size={11} />
                                Заменить
                                <input type="file" className="hidden" accept="image/*,.pdf"
                                  onChange={e => e.target.files?.[0] && handleDocUpload(doc.id, e.target.files[0])} />
                              </label>
                            </div>
                          ) : (
                            <label className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all hover:opacity-90 ${isUploading ? "opacity-50 cursor-wait" : ""}`}
                              style={{ background: `${doc.color}15`, border: `1px dashed ${doc.color}40`, color: doc.color }}>
                              {isUploading ? (
                                <><div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />Загружаю...</>
                              ) : (
                                <><Icon name="Upload" size={13} />Загрузить</>
                              )}
                              <input type="file" className="hidden" accept="image/*,.pdf" disabled={isUploading}
                                onChange={e => e.target.files?.[0] && handleDocUpload(doc.id, e.target.files[0])} />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-[10px] text-white/20">
                    <Icon name="Lock" size={11} />
                    Документы хранятся в защищённом хранилище ECSU 2.0. Доступ только у владельца.
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