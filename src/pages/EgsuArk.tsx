import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

// URL подставится после деплоя
const ARK_API = "https://functions.poehali.dev/9878d5a9-0ad5-432c-9dd0-3ab00d97c421";
const COVENANT_API = "https://functions.poehali.dev/95e61865-02c5-4b09-a4b9-cfccf7aba44e";
const OWNER_TOKEN = "ecsu-ark-owner-2024";
const AI_TOKEN = "ecsu-ai-deputy-2024";

const G = (s: string) => `linear-gradient(135deg, ${s})`;
const fmt = (iso: string) => {
  try { return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
};

type Server = {
  id: number; server_id: string; name: string; description: string;
  server_group: string; connection_url: string; is_active: boolean;
  status?: string; ping_ms?: number; cpu_percent?: number; memory_percent?: number;
  last_updated?: string;
};
type ArkSettings = { default_mode: string; default_server_id: string; auto_failover: boolean };
type Monitoring = { total_servers: number; online_servers: number; offline_servers: number; high_load_servers: number; avg_ping_ms: number };
type LogEntry = { id: number; event: string; user_id: string; details: string; ip_address: string; created_at: string };
type CovenantItem = { id: number; covenant_num: number; priority_num: string; icon: string; title: string; subtitle: string; color: string; description: string; sort_order: number; updated_at: string; updated_by: string };
type CovenantDecision = { id: number; decision_title: string; decision_body: string; initiator: string; status: string; owner_vote: string | null; ai_vote: string | null; ai_reasoning: string | null; final_decision: string | null; created_at: string; resolved_at: string | null };

const STATUS_CFG: Record<string, { label: string; color: string; dot: string }> = {
  online:    { label: "Онлайн",       color: "#22c55e", dot: "#22c55e" },
  offline:   { label: "Офлайн",       color: "#f43f5e", dot: "#f43f5e" },
  high_load: { label: "Выс. нагрузка", color: "#f59e0b", dot: "#f59e0b" },
};

const EMPTY_FORM = { id: "", name: "", description: "", group: "free", url: "", active: true };

export default function EgsuArk() {
  const navigate = useNavigate();
  const [apiUrl, setApiUrl] = useState(ARK_API);
  const [tab, setTab] = useState<"free" | "premium" | "all">("all");
  const [sideTab, setSideTab] = useState<"dashboard" | "settings" | "logs" | "covenant">("dashboard");

  const [systemMode, setSystemMode] = useState("online");
  const [settings, setSettings] = useState<ArkSettings>({ default_mode: "online", default_server_id: "", auto_failover: true });
  const [monitoring, setMonitoring] = useState<Monitoring | null>(null);
  const [freeServers, setFreeServers] = useState<Server[]>([]);
  const [premiumServers, setPremiumServers] = useState<Server[]>([]);
  const [allServers, setAllServers] = useState<Server[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [confirmMode, setConfirmMode] = useState<null | { msg: string; action: () => void }>(null);
  const [serverForm, setServerForm] = useState<typeof EMPTY_FORM | null>(null);
  const [editServer, setEditServer] = useState<Server | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Завет
  const [covenantItems, setCovenantItems] = useState<CovenantItem[]>([]);
  const [covenantDecisions, setCovenantDecisions] = useState<CovenantDecision[]>([]);
  const [covenantRole, setCovenantRole] = useState<"owner" | "ai" | null>(null);
  const [covenantTab, setCovenantTab] = useState<"view" | "decisions">("view");
  const [editingItem, setEditingItem] = useState<CovenantItem | null>(null);
  const [editForm, setEditForm] = useState<Partial<CovenantItem>>({});
  const [covenantLoading, setCovenantLoading] = useState(false);
  const [covenantToken, setCovenantToken] = useState("");
  const [loginError, setLoginError] = useState("");
  const [newDecision, setNewDecision] = useState({ title: "", body: "" });
  const [showNewDecision, setShowNewDecision] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const authHeaders = { "Content-Type": "application/json", "X-Owner-Token": OWNER_TOKEN };

  const loadDashboard = async (url = apiUrl) => {
    if (!url || url.includes("placeholder")) return;
    try {
      const r = await fetch(`${url}/dashboard`, { headers: authHeaders });
      const raw = await r.json();
      const d = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (d.error) { showToast(d.error, false); return; }
      setSystemMode(d.system_status || "online");
      setSettings(d.default_settings || settings);
      setMonitoring(d.monitoring || null);
      setFreeServers(d.server_groups?.free || []);
      setPremiumServers(d.server_groups?.premium || []);
      setAllServers(d.all_servers || [...(d.server_groups?.free || []), ...(d.server_groups?.premium || [])]);
      setLogs(d.recent_logs || []);
    } catch { showToast("Ошибка загрузки данных", false); }
    setLoading(false);
  };

  const call = async (path: string, method = "GET", body?: object) => {
    const r = await fetch(`${apiUrl}${path}`, {
      method,
      headers: authHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
    const raw = await r.json();
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  };

  useEffect(() => {
    fetch("/func2url.json").then(r => r.json())
      .then(d => { if (d["ark-admin"]) setApiUrl(d["ark-admin"]); })
      .catch(() => {});
    setLoading(false);
  }, []);

  useEffect(() => {
    if (apiUrl && !apiUrl.includes("placeholder")) {
      loadDashboard(apiUrl);
      pollRef.current = setInterval(() => loadDashboard(apiUrl), 30000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [apiUrl]);

  const saveGlobalSettings = async () => {
    setSaving(true);
    try {
      const d = await call("/settings", "POST", {
        system_mode: systemMode,
        default_server_id: settings.default_server_id,
        auto_failover: settings.auto_failover,
        default_mode: settings.default_mode,
      });
      showToast(d.message || "Глобальные настройки Ковчега применены");
      loadDashboard();
    } catch { showToast("Ошибка сохранения", false); }
    setSaving(false);
  };

  const confirmAction = (msg: string, action: () => void) => setConfirmMode({ msg, action });

  const toggleMode = () => {
    const next = systemMode === "online" ? "offline" : "online";
    if (next === "offline") {
      confirmAction(
        "Перевести систему в ОФЛАЙН-режим? Доступ для пользователей будет заблокирован.",
        () => { setSystemMode("offline"); setConfirmMode(null); }
      );
    } else {
      setSystemMode("online");
    }
  };

  const serverAction = async (serverId: string, action: "restart" | "shutdown") => {
    setActionLoading(serverId + action);
    try {
      const d = await call(`/servers/${serverId}/${action}`, "POST");
      showToast(d.message || `Сервер ${action === "restart" ? "перезагружен" : "остановлен"}`);
      setTimeout(() => loadDashboard(), 1000);
    } catch { showToast("Ошибка операции", false); }
    setActionLoading(null);
  };

  const deleteServer = async (sid: string) => {
    confirmAction(`Удалить сервер ${sid}?`, async () => {
      setConfirmMode(null);
      try {
        await call(`/servers/${sid}`, "DELETE");
        showToast(`Сервер ${sid} удалён`);
        loadDashboard();
      } catch { showToast("Ошибка удаления", false); }
    });
  };

  const submitServerForm = async () => {
    if (!serverForm?.id || !serverForm?.name) { showToast("ID и название обязательны", false); return; }
    setSaving(true);
    try {
      if (editServer) {
        await call(`/servers/${serverForm.id}`, "PUT", serverForm);
        showToast(`Сервер ${serverForm.name} обновлён`);
      } else {
        await call("/servers", "POST", serverForm);
        showToast(`Сервер ${serverForm.name} добавлен`);
      }
      setServerForm(null);
      setEditServer(null);
      loadDashboard();
    } catch { showToast("Ошибка сохранения сервера", false); }
    setSaving(false);
  };

  const openEdit = (s: Server) => {
    setEditServer(s);
    setServerForm({ id: s.server_id, name: s.name, description: s.description, group: s.server_group, url: s.connection_url, active: s.is_active });
    setSideTab("dashboard");
  };

  const displayServers = tab === "free" ? freeServers : tab === "premium" ? premiumServers : allServers;
  const isApiReady = apiUrl && !apiUrl.includes("placeholder");

  // ── Завет ──────────────────────────────────────────────
  const covenantHeaders = useCallback(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (covenantRole === "owner") h["X-Owner-Token"] = OWNER_TOKEN;
    if (covenantRole === "ai") h["X-AI-Token"] = AI_TOKEN;
    return h;
  }, [covenantRole]);

  const loadCovenant = useCallback(async () => {
    setCovenantLoading(true);
    const [c, d] = await Promise.all([
      fetch(`${COVENANT_API}/`).then(r => r.json()),
      fetch(`${COVENANT_API}/decisions`).then(r => r.json()),
    ]);
    setCovenantItems(c.covenant || []);
    setCovenantDecisions(d.decisions || []);
    setCovenantLoading(false);
  }, []);

  useEffect(() => {
    if (sideTab === "covenant") loadCovenant();
  }, [sideTab, loadCovenant]);

  const loginCovenant = async () => {
    setLoginError("");
    const token = covenantToken.trim();
    const role = token === OWNER_TOKEN ? "owner" : token === AI_TOKEN ? "ai" : null;
    if (!role) { setLoginError("Неверный токен доступа"); return; }
    setCovenantRole(role);
    setCovenantToken("");
  };

  const saveItem = async () => {
    if (!editingItem) return;
    setCovenantLoading(true);
    await fetch(`${COVENANT_API}/items/${editingItem.id}`, {
      method: "PUT",
      headers: covenantHeaders(),
      body: JSON.stringify(editForm),
    });
    setEditingItem(null);
    setEditForm({});
    await loadCovenant();
    showToast("Пункт Завета обновлён");
    setCovenantLoading(false);
  };

  const submitDecision = async () => {
    if (!newDecision.title.trim()) return;
    await fetch(`${COVENANT_API}/decisions`, {
      method: "POST",
      headers: covenantHeaders(),
      body: JSON.stringify({ decision_title: newDecision.title, decision_body: newDecision.body }),
    });
    setNewDecision({ title: "", body: "" });
    setShowNewDecision(false);
    await loadCovenant();
    showToast("Решение вынесено на обсуждение");
  };

  const voteDecision = async (id: number, vote: string) => {
    const reasoning = vote === "reject" ? "Требует доработки с учётом приоритетов Завета." : "Соответствует цепочке Завета.";
    await fetch(`${COVENANT_API}/decisions/${id}/vote`, {
      method: "PUT",
      headers: covenantHeaders(),
      body: JSON.stringify({ vote, reasoning }),
    });
    await loadCovenant();
    showToast("Голос принят");
  };

  const resolveDecision = async (id: number, final: string) => {
    await fetch(`${COVENANT_API}/decisions/${id}/resolve`, {
      method: "PUT",
      headers: covenantHeaders(),
      body: JSON.stringify({ final_decision: final }),
    });
    await loadCovenant();
    showToast(`Решение ${final === "approved" ? "принято" : "отклонено"}`);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060a12", color: "#e0e8ff", fontFamily: "'Golos Text', monospace" }}>

      {/* TOAST */}
      {toast && (
        <div style={{ position: "fixed", top: 80, right: 20, zIndex: 200, padding: "12px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13, background: toast.ok ? "rgba(0,255,135,0.95)" : "rgba(244,63,94,0.95)", color: "#000" }}>
          {toast.msg}
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmMode && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#0d1b2e", border: "1px solid rgba(244,63,94,0.4)", borderRadius: 16, padding: 32, maxWidth: 420, width: "90%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <Icon name="AlertTriangle" size={24} style={{ color: "#f43f5e" }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Подтверждение действия</div>
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 24, lineHeight: 1.6 }}>{confirmMode.msg}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmMode(null)} style={{ flex: 1, padding: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 13 }}>
                Отмена
              </button>
              <button onClick={confirmMode.action} style={{ flex: 1, padding: 11, background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.4)", borderRadius: 8, color: "#f43f5e", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SERVER FORM MODAL */}
      {serverForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#0d1b2e", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 16, padding: 28, maxWidth: 480, width: "90%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{editServer ? "Редактировать сервер" : "Добавить сервер"}</div>
              <button onClick={() => { setServerForm(null); setEditServer(null); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            {[
              { label: "ID сервера", key: "id", placeholder: "ecsu-server-1", disabled: !!editServer },
              { label: "Название", key: "name", placeholder: "Мой сервер" },
              { label: "Описание", key: "description", placeholder: "Краткое описание" },
              { label: "URL подключения", key: "url", placeholder: "https://..." },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 5, textTransform: "uppercase" }}>{f.label}</label>
                <input value={(serverForm as Record<string, string>)[f.key] || ""} disabled={f.disabled}
                  onChange={e => setServerForm(p => p ? { ...p, [f.key]: e.target.value } : p)}
                  placeholder={f.placeholder}
                  style={{ width: "100%", background: f.disabled ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none", opacity: f.disabled ? 0.5 : 1 }} />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 5, textTransform: "uppercase" }}>Группа</label>
              <select value={serverForm.group} onChange={e => setServerForm(p => p ? { ...p, group: e.target.value } : p)}
                style={{ width: "100%", background: "#0d1b2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none" }}>
                <option value="free">Базовые (открытый код)</option>
                <option value="premium">Премиум</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <input type="checkbox" checked={serverForm.active} onChange={e => setServerForm(p => p ? { ...p, active: e.target.checked } : p)} style={{ width: 16, height: 16, cursor: "pointer" }} />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Активный</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setServerForm(null); setEditServer(null); }} style={{ flex: 1, padding: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 13 }}>Отмена</button>
              <button onClick={submitServerForm} disabled={saving} style={{ flex: 2, padding: 11, background: G("#a855f7, #3b82f6"), border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                {saving ? "Сохраняю..." : (editServer ? "Сохранить изменения" : "Добавить сервер")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(6,10,18,0.98)", borderBottom: "1px solid rgba(168,85,247,0.2)", backdropFilter: "blur(20px)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate("/egsu/owner")} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer" }}>
          <Icon name="ChevronLeft" size={18} />
        </button>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: G("#f43f5e, #a855f7"), display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="Anchor" size={16} style={{ color: "#fff" }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: 2, color: "#fff" }}>КОВЧЕГ</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>ECSU 2.0 · Управление инфраструктурой · Только для владельца</div>
        </div>
        {/* Индикатор системы */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {monitoring && (
            <div style={{ display: "flex", gap: 10, marginRight: 16 }}>
              {[
                { v: monitoring.online_servers, label: "онлайн", c: "#22c55e" },
                { v: monitoring.offline_servers, label: "офлайн", c: "#f43f5e" },
                { v: monitoring.high_load_servers, label: "нагрузка", c: "#f59e0b" },
              ].map(m => (
                <div key={m.label} style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  <span style={{ color: m.c, fontWeight: 700 }}>{m.v}</span> {m.label}
                </div>
              ))}
            </div>
          )}
          {/* Тумблер режима */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Система:</span>
            <div onClick={toggleMode} style={{ width: 48, height: 26, borderRadius: 13, background: systemMode === "online" ? "rgba(34,197,94,0.4)" : "rgba(244,63,94,0.4)", border: `1px solid ${systemMode === "online" ? "#22c55e" : "#f43f5e"}`, cursor: "pointer", position: "relative", transition: "all 0.3s" }}>
              <div style={{ position: "absolute", top: 3, left: systemMode === "online" ? 24 : 3, width: 18, height: 18, borderRadius: "50%", background: systemMode === "online" ? "#22c55e" : "#f43f5e", transition: "left 0.3s" }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: systemMode === "online" ? "#22c55e" : "#f43f5e" }}>
              {systemMode === "online" ? "ОНЛАЙН" : "ОФЛАЙН"}
            </span>
          </div>
        </div>
      </nav>

      <div style={{ paddingTop: 60, display: "flex", minHeight: "100vh" }}>

        {/* SIDEBAR */}
        <aside style={{ position: "fixed", top: 60, bottom: 0, left: 0, width: 200, background: "rgba(6,10,18,0.96)", borderRight: "1px solid rgba(168,85,247,0.1)", display: "flex", flexDirection: "column", padding: "16px 8px", gap: 4, overflowY: "auto" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: 2, padding: "4px 8px 8px" }}>Администрирование</div>
          {([
            { id: "covenant", icon: "BookMarked", label: "Завет", color: "#00ff87" },
            { id: "dashboard", icon: "LayoutDashboard", label: "Серверы", color: "#a855f7" },
            { id: "settings", icon: "Settings", label: "Настройки", color: "#3b82f6" },
            { id: "logs", icon: "ScrollText", label: "Логи системы", color: "#f59e0b" },
          ] as { id: typeof sideTab; icon: string; label: string; color: string }[]).map(t => (
            <button key={t.id} onClick={() => setSideTab(t.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, border: `1px solid ${sideTab === t.id ? t.color + "40" : "transparent"}`, background: sideTab === t.id ? `${t.color}12` : "transparent", color: sideTab === t.id ? t.color : "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 13, fontWeight: sideTab === t.id ? 700 : 400, textAlign: "left" }}>
              <Icon name={t.icon as "Settings"} size={15} />
              {t.label}
            </button>
          ))}

          {monitoring && (
            <div style={{ marginTop: "auto", padding: 12, background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 8 }}>МОНИТОРИНГ</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Серверов: <span style={{ color: "#fff", fontWeight: 700 }}>{monitoring.total_servers}</span></div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Пинг: <span style={{ color: "#00ff87", fontWeight: 700 }}>{monitoring.avg_ping_ms} мс</span></div>
            </div>
          )}
        </aside>

        {/* MAIN */}
        <main style={{ marginLeft: 200, flex: 1, padding: "20px 24px", minHeight: "calc(100vh - 60px)" }}>

          {/* API не подключён */}
          {!isApiReady && (
            <div style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)", borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <Icon name="AlertTriangle" size={20} style={{ color: "#f43f5e", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f43f5e", marginBottom: 4 }}>API Ковчега не задеплоен</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                    Функция <code style={{ color: "#a855f7" }}>ark-admin</code> создана, но URL ещё не получен.
                    Нажмите «Деплой» в системе — и страница заработает автоматически.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ ЗАВЕТ ═══ */}
          {sideTab === "covenant" && (
            <div>
              {/* Заголовок */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#00ff87,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="BookMarked" size={24} style={{ color: "#000" }} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>ЗАВЕТ СИСТЕМЫ</h2>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Директива высшего приоритета · ECSU 2.0 · Ковчег</div>
                  </div>
                </div>
                {/* Статус авторизации */}
                {covenantRole ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: covenantRole === "owner" ? "rgba(0,255,135,0.1)" : "rgba(124,58,237,0.1)", border: `1px solid ${covenantRole === "owner" ? "rgba(0,255,135,0.3)" : "rgba(124,58,237,0.3)"}`, borderRadius: 20, padding: "5px 14px" }}>
                      <Icon name={covenantRole === "owner" ? "Crown" : "Brain"} size={13} style={{ color: covenantRole === "owner" ? "#00ff87" : "#a855f7" }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: covenantRole === "owner" ? "#00ff87" : "#a855f7" }}>
                        {covenantRole === "owner" ? "Владелец" : "ИИ-Заместитель"}
                      </span>
                    </div>
                    <button onClick={() => setCovenantRole(null)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "5px 10px", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 11 }}>Выйти</button>
                  </div>
                ) : null}
              </div>

              {/* Форма входа если не авторизован */}
              {!covenantRole && (
                <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(0,255,135,0.2)", borderRadius: 14, padding: 24, marginBottom: 20, maxWidth: 400 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#00ff87", marginBottom: 4 }}>Вход в Завет</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 14 }}>Только владелец системы или ИИ-заместитель</div>
                  <input value={covenantToken} onChange={e => setCovenantToken(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && loginCovenant()}
                    type="password" placeholder="Токен доступа"
                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none", marginBottom: 10, boxSizing: "border-box" }} />
                  {loginError && <div style={{ fontSize: 12, color: "#f43f5e", marginBottom: 8 }}>{loginError}</div>}
                  <button onClick={loginCovenant} style={{ width: "100%", background: G("#00ff87,#3b82f6"), border: "none", borderRadius: 8, padding: "9px 0", color: "#000", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Войти</button>
                </div>
              )}

              {/* Вкладки Завета */}
              <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {([["view","Директива","BookMarked"],["decisions","Совместные решения","Handshake"]] as const).map(([id, label, icon]) => (
                  <button key={id} onClick={() => setCovenantTab(id)}
                    style={{ padding: "8px 18px", background: "none", border: "none", borderBottom: `2px solid ${covenantTab === id ? "#00ff87" : "transparent"}`, color: covenantTab === id ? "#00ff87" : "rgba(255,255,255,0.35)", cursor: "pointer", fontWeight: covenantTab === id ? 700 : 400, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name={icon} size={13} />{label}
                    {id === "decisions" && covenantDecisions.filter(d => d.status === "discussion").length > 0 && (
                      <span style={{ background: "#f59e0b", borderRadius: 10, padding: "1px 6px", fontSize: 10, color: "#000", fontWeight: 800 }}>
                        {covenantDecisions.filter(d => d.status === "discussion").length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {covenantLoading && <div style={{ textAlign: "center", padding: 30, color: "rgba(255,255,255,0.3)" }}>Загрузка...</div>}

              {/* ── ДИРЕКТИВА ── */}
              {covenantTab === "view" && !covenantLoading && (
                <div>
                  {/* Шапка */}
                  <div style={{ background: "linear-gradient(135deg,rgba(0,255,135,0.08),rgba(59,130,246,0.06))", border: "1px solid rgba(0,255,135,0.2)", borderRadius: 14, padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                    <Icon name="Shield" size={20} style={{ color: "#00ff87" }} />
                    <div>
                      <div style={{ fontWeight: 800, color: "#00ff87", fontSize: 14, letterSpacing: 1 }}>ЗАВЕТ № 1 — ДИРЕКТИВА АКТИВНА</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Абсолютный приоритет · Николаев Владимир Владимирович</div>
                    </div>
                  </div>

                  {/* Пункты из БД */}
                  {covenantItems.map((item, i) => (
                    <div key={item.id} style={{ marginBottom: 6 }}>
                      {editingItem?.id === item.id ? (
                        /* Форма редактирования */
                        <div style={{ background: "rgba(0,255,135,0.04)", border: `1px solid ${item.color}50`, borderRadius: 12, padding: 20 }}>
                          <div style={{ fontSize: 12, color: item.color, fontWeight: 700, marginBottom: 12 }}>Редактирование пункта {item.priority_num}</div>
                          {[
                            { label: "Заголовок", key: "title" as const },
                            { label: "Подзаголовок", key: "subtitle" as const },
                          ].map(f => (
                            <div key={f.key} style={{ marginBottom: 10 }}>
                              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 4, textTransform: "uppercase" }}>{f.label}</div>
                              <input value={(editForm[f.key] ?? item[f.key]) as string}
                                onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                            </div>
                          ))}
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 4, textTransform: "uppercase" }}>Описание</div>
                            <textarea value={(editForm.description ?? item.description) as string}
                              onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                              rows={4}
                              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={saveItem} style={{ flex: 1, background: G("#00ff87,#3b82f6"), border: "none", borderRadius: 8, padding: "9px 0", color: "#000", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Сохранить</button>
                            <button onClick={() => { setEditingItem(null); setEditForm({}); }} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 0", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>Отмена</button>
                          </div>
                        </div>
                      ) : (
                        /* Просмотр пункта */
                        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                            <div style={{ width: 42, height: 42, borderRadius: "50%", background: `${item.color}18`, border: `2px solid ${item.color}60`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Icon name={item.icon as "Scale"} size={18} style={{ color: item.color }} />
                            </div>
                            {i < covenantItems.length - 1 && (
                              <div style={{ width: 2, height: 28, background: `${item.color}40`, margin: "6px 0" }} />
                            )}
                          </div>
                          <div style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: `1px solid ${item.color}20`, borderRadius: 12, padding: "14px 16px", marginBottom: i < covenantItems.length - 1 ? 0 : 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                              <div>
                                <span style={{ fontSize: 10, fontWeight: 800, color: item.color, background: `${item.color}15`, border: `1px solid ${item.color}40`, borderRadius: 6, padding: "2px 8px", marginRight: 8 }}>
                                  ПРИОРИТЕТ {item.priority_num}
                                </span>
                                <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{item.title}</span>
                              </div>
                              {covenantRole === "owner" && (
                                <button onClick={() => { setEditingItem(item); setEditForm({}); }}
                                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 10px", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                                  <Icon name="Pencil" size={11} /> Изменить
                                </button>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontStyle: "italic", marginBottom: 8 }}>{item.subtitle}</div>
                            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, borderLeft: `3px solid ${item.color}40`, paddingLeft: 10 }}>{item.description}</div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", marginTop: 8 }}>Изм. {fmt(item.updated_at)} · {item.updated_by}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Алгоритм */}
                  <div style={{ marginTop: 20, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 18px" }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Алгоритм решения</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 11, alignItems: "center" }}>
                      {covenantItems.map((item, i) => (
                        <span key={item.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ color: item.color, fontWeight: 700 }}>{item.title}</span>
                          {i < covenantItems.length - 1 && <span style={{ color: "rgba(255,255,255,0.2)" }}>→</span>}
                        </span>
                      ))}
                      {covenantItems.length > 0 && <><span style={{ color: "rgba(255,255,255,0.2)" }}>→</span><span style={{ color: "#fff", fontWeight: 800, background: "rgba(255,255,255,0.08)", borderRadius: 6, padding: "2px 10px" }}>РЕШЕНИЕ</span></>}
                    </div>
                  </div>
                </div>
              )}

              {/* ── СОВМЕСТНЫЕ РЕШЕНИЯ ── */}
              {covenantTab === "decisions" && !covenantLoading && (
                <div>
                  {/* Кнопка нового решения */}
                  {covenantRole && (
                    <div style={{ marginBottom: 16 }}>
                      {showNewDecision ? (
                        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,255,135,0.2)", borderRadius: 12, padding: 18 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#00ff87", marginBottom: 12 }}>Новое решение на обсуждение</div>
                          <input value={newDecision.title} onChange={e => setNewDecision(p => ({ ...p, title: e.target.value }))}
                            placeholder="Заголовок решения"
                            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13, outline: "none", marginBottom: 8, boxSizing: "border-box" }} />
                          <textarea value={newDecision.body} onChange={e => setNewDecision(p => ({ ...p, body: e.target.value }))}
                            placeholder="Подробное описание, обоснование..." rows={3}
                            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13, outline: "none", marginBottom: 10, resize: "vertical", boxSizing: "border-box" }} />
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={submitDecision} style={{ flex: 2, background: G("#00ff87,#3b82f6"), border: "none", borderRadius: 8, padding: "9px 0", color: "#000", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Вынести на обсуждение</button>
                            <button onClick={() => setShowNewDecision(false)} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 0", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer" }}>Отмена</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setShowNewDecision(true)}
                          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", background: G("#00ff87,#3b82f6"), border: "none", borderRadius: 8, color: "#000", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                          <Icon name="Plus" size={14} /> Предложить решение
                        </button>
                      )}
                    </div>
                  )}

                  {covenantDecisions.length === 0 && (
                    <div style={{ textAlign: "center", padding: 50, color: "rgba(255,255,255,0.2)" }}>
                      <Icon name="Handshake" size={40} style={{ color: "rgba(255,255,255,0.08)" }} />
                      <div style={{ marginTop: 12 }}>Совместных решений пока нет</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>Войдите и предложите первое решение</div>
                    </div>
                  )}

                  {covenantDecisions.map(d => {
                    const isPending = d.status === "discussion";
                    const myVote = covenantRole === "owner" ? d.owner_vote : d.ai_vote;
                    return (
                      <div key={d.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${isPending ? "rgba(245,158,11,0.3)" : d.final_decision === "approved" ? "rgba(0,255,135,0.2)" : "rgba(255,255,255,0.07)"}`, borderRadius: 12, padding: 18, marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div>
                            <div style={{ fontWeight: 700, color: "#fff", fontSize: 14, marginBottom: 2 }}>{d.decision_title}</div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                              Инициатор: <span style={{ color: d.initiator === "owner" ? "#00ff87" : "#a855f7" }}>{d.initiator === "owner" ? "Владелец" : "ИИ-Заместитель"}</span>
                              {" · "}{fmt(d.created_at)}
                            </div>
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10,
                            background: isPending ? "rgba(245,158,11,0.12)" : d.final_decision === "approved" ? "rgba(0,255,135,0.1)" : "rgba(244,63,94,0.1)",
                            color: isPending ? "#f59e0b" : d.final_decision === "approved" ? "#00ff87" : "#f43f5e" }}>
                            {isPending ? "Обсуждение" : d.final_decision === "approved" ? "Принято" : "Отклонено"}
                          </div>
                        </div>

                        {d.decision_body && (
                          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 12, lineHeight: 1.6 }}>{d.decision_body}</div>
                        )}

                        {/* Голоса */}
                        <div style={{ display: "flex", gap: 10, marginBottom: isPending && covenantRole ? 12 : 0 }}>
                          {[
                            { label: "Владелец", vote: d.owner_vote, color: "#00ff87" },
                            { label: "ИИ-Заместитель", vote: d.ai_vote, color: "#a855f7", note: d.ai_reasoning },
                          ].map(v => (
                            <div key={v.label} style={{ flex: 1, background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
                              <div style={{ color: v.color, fontWeight: 700, marginBottom: 2 }}>{v.label}</div>
                              <div style={{ color: !v.vote ? "rgba(255,255,255,0.2)" : v.vote === "approve" ? "#00ff87" : v.vote === "reject" ? "#f43f5e" : "#f59e0b" }}>
                                {!v.vote ? "Не проголосовал" : v.vote === "approve" ? "За" : v.vote === "reject" ? "Против" : "На обсуждение"}
                              </div>
                              {v.note && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>{v.note}</div>}
                            </div>
                          ))}
                        </div>

                        {/* Кнопки голосования */}
                        {isPending && covenantRole && !myVote && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => voteDecision(d.id, "approve")} style={{ flex: 1, background: "rgba(0,255,135,0.1)", border: "1px solid rgba(0,255,135,0.3)", borderRadius: 8, padding: "7px 0", color: "#00ff87", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>За</button>
                            <button onClick={() => voteDecision(d.id, "discuss")} style={{ flex: 1, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "7px 0", color: "#f59e0b", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Обсудить</button>
                            <button onClick={() => voteDecision(d.id, "reject")} style={{ flex: 1, background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: 8, padding: "7px 0", color: "#f43f5e", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Против</button>
                          </div>
                        )}

                        {/* Финализация владельцем */}
                        {isPending && covenantRole === "owner" && d.owner_vote && d.ai_vote && d.owner_vote !== d.ai_vote && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ fontSize: 11, color: "#f59e0b", marginBottom: 6 }}>Голоса разошлись — финальное слово за Владельцем:</div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => resolveDecision(d.id, "approved")} style={{ flex: 1, background: G("#00ff87,#3b82f6"), border: "none", borderRadius: 8, padding: "7px 0", color: "#000", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Утвердить</button>
                              <button onClick={() => resolveDecision(d.id, "rejected")} style={{ flex: 1, background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: 8, padding: "7px 0", color: "#f43f5e", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Отклонить</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══ СЕРВЕРЫ ═══ */}
          {sideTab === "dashboard" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>Ковчег — управление инфраструктурой</h2>
                <button onClick={() => { setEditServer(null); setServerForm({ ...EMPTY_FORM }); }}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", background: G("#a855f7, #3b82f6"), border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  <Icon name="Plus" size={14} /> Добавить сервер
                </button>
              </div>

              {/* Вкладки групп */}
              <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0 }}>
                {([
                  { id: "all", label: `Все серверы (${allServers.length})` },
                  { id: "free", label: `Базовые (${freeServers.length})` },
                  { id: "premium", label: `Премиум (${premiumServers.length})` },
                ] as { id: typeof tab; label: string }[]).map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    style={{ padding: "8px 16px", background: "none", border: "none", borderBottom: `2px solid ${tab === t.id ? "#a855f7" : "transparent"}`, color: tab === t.id ? "#a855f7" : "rgba(255,255,255,0.35)", cursor: "pointer", fontWeight: tab === t.id ? 700 : 400, fontSize: 13 }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {loading ? (
                <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
                  <div style={{ marginBottom: 12 }}>⚓</div>
                  Загрузка панели Ковчега...
                </div>
              ) : displayServers.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
                  Нет серверов в этой группе. Нажмите «Добавить сервер».
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                        {["Сервер", "Группа", "Статус", "Пинг", "CPU", "RAM", "Обновлён", "Действия"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "rgba(255,255,255,0.3)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayServers.map(s => {
                        const sc = STATUS_CFG[s.status || (s.is_active ? "online" : "offline")];
                        const busy = actionLoading?.startsWith(s.server_id);
                        return (
                          <tr key={s.server_id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}>
                            <td style={{ padding: "12px 12px" }}>
                              <div style={{ fontWeight: 700, color: "#fff" }}>{s.name}</div>
                              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{s.server_id}</div>
                              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 1 }}>{s.description}</div>
                            </td>
                            <td style={{ padding: "12px 12px" }}>
                              <div style={{ fontSize: 11, padding: "3px 8px", background: s.server_group === "premium" ? "rgba(168,85,247,0.12)" : "rgba(0,255,135,0.08)", color: s.server_group === "premium" ? "#a855f7" : "#00ff87", borderRadius: 10, display: "inline-block" }}>
                                {s.server_group === "premium" ? "Премиум" : "Базовый"}
                              </div>
                            </td>
                            <td style={{ padding: "12px 12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ width: 7, height: 7, borderRadius: "50%", background: sc.dot }} />
                                <span style={{ color: sc.color, fontWeight: 600 }}>{sc.label}</span>
                              </div>
                            </td>
                            <td style={{ padding: "12px 12px", color: (s.ping_ms || 0) > 100 ? "#f59e0b" : "#22c55e", fontWeight: 600 }}>
                              {s.ping_ms ? `${s.ping_ms} мс` : "—"}
                            </td>
                            <td style={{ padding: "12px 12px" }}>
                              <div style={{ fontSize: 11, color: (s.cpu_percent || 0) > 70 ? "#f43f5e" : "rgba(255,255,255,0.6)" }}>
                                {s.cpu_percent != null ? `${s.cpu_percent}%` : "—"}
                              </div>
                            </td>
                            <td style={{ padding: "12px 12px" }}>
                              <div style={{ fontSize: 11, color: (s.memory_percent || 0) > 80 ? "#f43f5e" : "rgba(255,255,255,0.6)" }}>
                                {s.memory_percent != null ? `${s.memory_percent}%` : "—"}
                              </div>
                            </td>
                            <td style={{ padding: "12px 12px", color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
                              {s.last_updated ? fmt(s.last_updated) : "—"}
                            </td>
                            <td style={{ padding: "12px 12px" }}>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => openEdit(s)} title="Редактировать"
                                  style={{ padding: "5px 8px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 6, color: "#3b82f6", cursor: "pointer", fontSize: 11 }}>
                                  <Icon name="Edit" size={12} />
                                </button>
                                <button onClick={() => serverAction(s.server_id, "restart")} disabled={!!busy} title="Перезагрузить"
                                  style={{ padding: "5px 8px", background: "rgba(0,255,135,0.08)", border: "1px solid rgba(0,255,135,0.2)", borderRadius: 6, color: "#00ff87", cursor: "pointer", fontSize: 11, opacity: busy ? 0.5 : 1 }}>
                                  {busy && actionLoading === s.server_id + "restart" ? "..." : <Icon name="RotateCcw" size={12} />}
                                </button>
                                <button onClick={() => serverAction(s.server_id, "shutdown")} disabled={!!busy} title="Выключить"
                                  style={{ padding: "5px 8px", background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: 6, color: "#f43f5e", cursor: "pointer", fontSize: 11, opacity: busy ? 0.5 : 1 }}>
                                  <Icon name="PowerOff" size={12} />
                                </button>
                                <button onClick={() => deleteServer(s.server_id)} title="Удалить"
                                  style={{ padding: "5px 8px", background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.15)", borderRadius: 6, color: "rgba(244,63,94,0.6)", cursor: "pointer", fontSize: 11 }}>
                                  <Icon name="Trash2" size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═══ НАСТРОЙКИ ═══ */}
          {sideTab === "settings" && (
            <div style={{ maxWidth: 560 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 24 }}>Глобальные настройки Ковчега</h2>

              <div style={{ display: "grid", gap: 18 }}>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 16 }}>Режим работы системы</div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 8, textTransform: "uppercase" }}>Глобальный режим</label>
                    <div style={{ display: "flex", gap: 10 }}>
                      {["online", "offline"].map(m => (
                        <button key={m} onClick={() => m === "offline" ? confirmAction("Перевести систему в режим ОФЛАЙН для всех пользователей?", () => { setSystemMode("offline"); setConfirmMode(null); }) : setSystemMode(m)}
                          style={{ flex: 1, padding: 11, background: systemMode === m ? (m === "online" ? "rgba(34,197,94,0.15)" : "rgba(244,63,94,0.15)") : "rgba(255,255,255,0.03)", border: `1px solid ${systemMode === m ? (m === "online" ? "#22c55e" : "#f43f5e") : "rgba(255,255,255,0.08)"}`, borderRadius: 8, color: systemMode === m ? (m === "online" ? "#22c55e" : "#f43f5e") : "rgba(255,255,255,0.35)", cursor: "pointer", fontWeight: systemMode === m ? 700 : 400, fontSize: 13 }}>
                          {m === "online" ? "🟢 Система онлайн" : "🔴 Система офлайн"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 8, textTransform: "uppercase" }}>Базовый режим по умолчанию</label>
                    <select value={settings.default_mode} onChange={e => setSettings(s => ({ ...s, default_mode: e.target.value }))}
                      style={{ width: "100%", background: "#0d1b2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none" }}>
                      <option value="online">Онлайн</option>
                      <option value="offline">Офлайн</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 8, textTransform: "uppercase" }}>Сервер по умолчанию</label>
                    <select value={settings.default_server_id} onChange={e => setSettings(s => ({ ...s, default_server_id: e.target.value }))}
                      style={{ width: "100%", background: "#0d1b2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none" }}>
                      <option value="">— Не выбран —</option>
                      {allServers.map(s => <option key={s.server_id} value={s.server_id}>{s.name} ({s.server_id})</option>)}
                    </select>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <input type="checkbox" checked={settings.auto_failover} onChange={e => setSettings(s => ({ ...s, auto_failover: e.target.checked }))}
                      style={{ width: 16, height: 16, cursor: "pointer" }} />
                    <div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Автоматическое переключение при сбое</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>При недоступности основного сервера — переключение на резервный</div>
                    </div>
                  </div>

                  <button onClick={() => confirmAction("Применить глобальные настройки Ковчега? Это повлияет на всех пользователей системы.", saveGlobalSettings)}
                    disabled={saving}
                    style={{ width: "100%", padding: 14, background: saving ? "rgba(255,255,255,0.05)" : "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.4)", borderRadius: 10, color: saving ? "rgba(255,255,255,0.3)" : "#f43f5e", fontWeight: 700, fontSize: 14, cursor: saving ? "wait" : "pointer" }}>
                    {saving ? "Применяю..." : "⚠ Применить глобальные настройки"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══ ЛОГИ ═══ */}
          {sideTab === "logs" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>Последние события</h2>
                <button onClick={() => loadDashboard()} style={{ padding: "8px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 12 }}>
                  <Icon name="RefreshCw" size={13} /> Обновить
                </button>
              </div>
              {logs.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.2)", fontSize: 13 }}>Нет событий</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {logs.map(l => (
                    <div key={l.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 16px", display: "grid", gridTemplateColumns: "140px 160px 1fr 80px", gap: 12, alignItems: "center" }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{fmt(l.created_at)}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#a855f7" }}>{l.event}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", wordBreak: "break-word" }}>{l.details}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "right" }}>{l.ip_address || l.user_id}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}