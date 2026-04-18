import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/e610af8a-f8c5-4c04-8d9b-092391fb0c70";
const G = (s: string) => `linear-gradient(135deg, ${s})`;

type Notification = {
  id: number; type: string; priority: string; title: string; body: string;
  source: string; is_read: boolean; action_url: string; created_at: string;
};

function parse(d: unknown) {
  if (typeof d === "string") { try { return JSON.parse(d); } catch { return d; } }
  return d;
}

const PRIORITY_COLORS: Record<string, string> = { critical: "#f43f5e", high: "#f59e0b", normal: "#3b82f6", low: "#a855f7" };
const PRIORITY_LABELS: Record<string, string> = { critical: "КРИТИЧНО", high: "ВАЖНО", normal: "НОРМА", low: "ИНФО" };
const TYPE_ICONS: Record<string, string> = { security: "ShieldAlert", finance: "Wallet", system: "Server", alert: "AlertTriangle" };
const TYPE_COLORS: Record<string, string> = { security: "#f43f5e", finance: "#f59e0b", system: "#3b82f6", alert: "#f43f5e" };

export default function EgsuNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "security" | "finance" | "system">("all");
  const [toast, setToast] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ type: "system", priority: "normal", title: "", body: "", source: "ECSU", action_url: "" });
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetch(`${API}/notifications`).then(r => r.json()).then(parse).catch(() => []);
      setNotifications(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: number) => {
    await fetch(`${API}/notifications/${id}/read`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: "{}" });
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await fetch(`${API}/notifications/read-all`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: "{}" });
    setNotifications(ns => ns.map(n => ({ ...n, is_read: true })));
    showToast("✓ Все уведомления отмечены прочитанными");
  };

  const createNotification = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const r = await fetch(`${API}/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = parse(await r.json()) as { id: number; message: string };
    setSaving(false);
    setShowCreate(false);
    setForm({ type: "system", priority: "normal", title: "", body: "", source: "ECSU", action_url: "" });
    showToast(`✓ Уведомление #${d.id} создано`);
    load();
  };

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.is_read;
    if (filter === "all") return true;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: G("#a855f7, #f43f5e") }}>
            <Icon name="Bell" size={14} className="text-white" />
          </div>
          <div>
            <div className="font-display text-base font-bold text-white tracking-wide leading-none">УВЕДОМЛЕНИЯ</div>
            <div className="text-white/30 text-[10px]">ECSU 2.0 · Центр сообщений</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.3)" }}>
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-red-400 text-xs font-bold">{unreadCount} новых</span>
            </div>
          )}
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
              <Icon name="CheckCheck" size={13} />
              <span className="hidden md:inline">Всё прочитано</span>
            </button>
          )}
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
            style={{ background: G("#a855f7,#f43f5e"), color: "white" }}>
            <Icon name="Plus" size={13} />
            <span className="hidden md:inline">Создать</span>
          </button>
        </div>
      </nav>

      <div className="pt-14 px-4 md:px-6 py-6 max-w-3xl mx-auto">
        {/* Фильтры */}
        <div className="flex gap-2 flex-wrap mb-6">
          {[
            { id: "all", label: `Все (${notifications.length})` },
            { id: "unread", label: `Непрочитанные (${unreadCount})` },
            { id: "security", label: "Безопасность" },
            { id: "finance", label: "Финансы" },
            { id: "system", label: "Система" },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id as typeof filter)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: filter === f.id ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.05)",
                color: filter === f.id ? "#a855f7" : "rgba(255,255,255,0.4)",
                border: `1px solid ${filter === f.id ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.1)"}`,
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {loading && <div className="text-center py-20 text-white/30">Загружаю...</div>}

        <div className="space-y-3">
          {filtered.map(n => {
            const pc = PRIORITY_COLORS[n.priority] ?? "#888";
            const tc = TYPE_COLORS[n.type] ?? "#888";
            return (
              <div key={n.id}
                className="p-4 rounded-2xl transition-all cursor-pointer hover:scale-[1.01]"
                style={{
                  background: n.is_read ? "rgba(255,255,255,0.02)" : "rgba(168,85,247,0.05)",
                  border: `1px solid ${n.is_read ? "rgba(255,255,255,0.06)" : "rgba(168,85,247,0.2)"}`,
                }}
                onClick={() => {
                  if (!n.is_read) markRead(n.id);
                  if (n.action_url) navigate(n.action_url);
                }}>
                <div className="flex items-start gap-3">
                  {/* Иконка */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${tc}15` }}>
                    <Icon name={TYPE_ICONS[n.type] as "Bell" ?? "Bell"} size={18} style={{ color: tc }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {!n.is_read && (
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "#a855f7" }} />
                      )}
                      <span className="text-white font-semibold text-sm">{n.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                        style={{ background: `${pc}18`, color: pc }}>
                        {PRIORITY_LABELS[n.priority] ?? n.priority}
                      </span>
                    </div>
                    {n.body && <div className="text-white/50 text-sm leading-relaxed">{n.body}</div>}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-white/25 text-xs">{n.source}</span>
                      <span className="text-white/20 text-xs">{new Date(n.created_at).toLocaleString("ru-RU")}</span>
                      {n.action_url && (
                        <span className="text-purple-400/60 text-xs flex items-center gap-1">
                          <Icon name="ExternalLink" size={11} />
                          Открыть
                        </span>
                      )}
                    </div>
                  </div>

                  {!n.is_read && (
                    <button onClick={e => { e.stopPropagation(); markRead(n.id); }}
                      className="shrink-0 p-1.5 rounded-lg text-white/20 hover:text-white/60 transition-colors"
                      style={{ background: "rgba(255,255,255,0.05)" }}>
                      <Icon name="Check" size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-20">
              <Icon name="BellOff" size={40} className="mx-auto mb-3 text-white/10" />
              <p className="text-white/25 text-sm">
                {filter === "unread" ? "Нет непрочитанных уведомлений" : "Уведомлений нет"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Модал создания */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: "#0d1220", border: "1px solid rgba(168,85,247,0.3)" }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ background: "rgba(168,85,247,0.07)", borderBottom: "1px solid rgba(168,85,247,0.15)" }}>
              <div className="flex items-center gap-2">
                <Icon name="Bell" size={18} className="text-purple-400" />
                <span className="text-white font-bold">Создать уведомление</span>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-white/30 hover:text-white/70">
                <Icon name="X" size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Тип</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {["security","finance","system","alert"].map(t => (
                      <option key={t} value={t} style={{ background: "#0d1220" }}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Приоритет</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {["normal","high","critical","low"].map(p => (
                      <option key={p} value={p} style={{ background: "#0d1220" }}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Заголовок *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Текст уведомления"
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Описание</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Детали..." rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Источник</label>
                  <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Ссылка</label>
                  <input value={form.action_url} onChange={e => setForm(f => ({ ...f, action_url: e.target.value }))}
                    placeholder="/egsu/finance"
                    className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
              </div>
              <button onClick={createNotification} disabled={saving || !form.title.trim()}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-40"
                style={{ background: G("#a855f7,#f43f5e"), color: "white" }}>
                {saving ? "Создаю..." : "Создать уведомление"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}