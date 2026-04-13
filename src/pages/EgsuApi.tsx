import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/7425192d-b613-4c55-bdb8-01479a9f0d24";
const INCIDENTS_API = "https://functions.poehali.dev/c71047de-6e10-499a-aa1c-e9fdba33e7bd";

const G = (s: string) => `linear-gradient(135deg, ${s})`;

type Integration = { id: number; platform_name: string; description: string; permissions: string[]; is_active: boolean; requests_count: number; created_at: string };

const ENDPOINTS = [
  {
    group: "Инциденты",
    color: "#f43f5e",
    icon: "AlertTriangle",
    items: [
      { method: "GET", path: "/", desc: "Список всех инцидентов из базы данных", params: [], response: '{"incidents": [...], "total": 12}' },
      { method: "POST", path: "/", desc: "Создать новый инцидент / подать заявку", params: ["type", "title", "country", "severity", "description", "evidence"], response: '{"status": "verified", "incident_code": "INC-XXXX"}' },
    ],
    base: INCIDENTS_API,
  },
  {
    group: "Правовая база",
    color: "#a855f7",
    icon: "Scale",
    items: [
      { method: "GET", path: "/", desc: "Статистика правовой базы (юрисдикции, документы, статьи)", params: [], response: '{"system": "ЕЦСУ 2.0", "stats": {...}}' },
      { method: "GET", path: "/jurisdictions", desc: "Список всех юрисдикций с количеством документов", params: [], response: '[{"id":1,"code":"INT","name":"Международное право",...}]' },
      { method: "GET", path: "/documents", desc: "Список правовых документов с фильтрацией", params: ["jurisdiction_id", "category"], response: '[{"id":1,"title":"Конституция РФ","category":"constitution",...}]' },
      { method: "GET", path: "/articles", desc: "Статьи с полнотекстовым поиском", params: ["document_id", "q"], response: '[{"article_number":"Статья 42","content":"...","tags":[...]}]' },
      { method: "GET", path: "/integrations", desc: "Реестр зарегистрированных интеграций", params: [], response: '[{"id":1,"platform_name":"...","permissions":[...]}]' },
      { method: "POST", path: "/integrations", desc: "Зарегистрировать новую интеграцию и получить API-ключ", params: ["platform_name", "description", "permissions"], response: '{"id":2,"api_key":"egsu-xxx","message":"Интеграция зарегистрирована"}' },
    ],
    base: API,
  },
];

const EMBED_CODE = `<!-- ЕЦСУ 2.0 — Встраиваемый виджет инцидентов -->
<div id="egsu-widget"></div>
<script>
  fetch('${INCIDENTS_API}')
    .then(r => r.json())
    .then(raw => {
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const incidents = data.incidents || [];
      const el = document.getElementById('egsu-widget');
      el.innerHTML = '<h3>Инциденты ЕЦСУ</h3>' +
        incidents.slice(0, 5).map(i =>
          '<div style="padding:8px;border:1px solid #333;margin:4px;border-radius:6px">' +
          '<strong>' + i.incident_code + '</strong> ' + i.title +
          ' (' + i.country + ')' +
          '</div>'
        ).join('');
    });
</script>`;

const IFRAME_CODE = `<iframe
  src="https://ваш-домен.poehali.dev/egsu/dashboard"
  width="100%"
  height="800"
  frameborder="0"
  allow="microphone"
  title="ЕЦСУ 2.0 — Система управления"
></iframe>`;

export default function EgsuApi() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"endpoints" | "embed" | "integrations" | "register">("endpoints");
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [copiedKey, setCopiedKey] = useState("");
  const [form, setForm] = useState({ platform_name: "", description: "", permissions: ["read"] });
  const [newKey, setNewKey] = useState<{ api_key: string; id: number } | null>(null);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetch(`${API}/integrations`).then(r => r.json()).then(d => {
      const data = typeof d === "string" ? JSON.parse(d) : d;
      setIntegrations(Array.isArray(data) ? data : []);
    });
  }, []);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 2000);
  };

  const register = async () => {
    if (!form.platform_name.trim()) return;
    setRegistering(true);
    const r = await fetch(`${API}/integrations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    const data = typeof d === "string" ? JSON.parse(d) : d;
    setNewKey(data);
    setRegistering(false);
    fetch(`${API}/integrations`).then(r => r.json()).then(d => {
      const data = typeof d === "string" ? JSON.parse(d) : d;
      setIntegrations(Array.isArray(data) ? data : []);
    });
  };

  const togglePerm = (perm: string) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter(p => p !== perm)
        : [...f.permissions, perm],
    }));
  };

  return (
    <div className="min-h-screen font-body" style={{ background: "#060a12" }}>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-3"
        style={{ background: "rgba(6,10,18,0.97)", borderBottom: "1px solid rgba(0,255,135,0.15)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/egsu/dashboard")}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
            <Icon name="ChevronLeft" size={16} />
          </button>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: G("#00ff87, #3b82f6") }}>
            <Icon name="Plug" size={14} className="text-black" />
          </div>
          <div>
            <div className="font-display text-base font-bold text-white tracking-wide leading-none">API & ИНТЕГРАЦИИ</div>
            <div className="text-white/30 text-[10px]">Автономная работа · Встраивание · Документация</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(0,255,135,0.1)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.2)" }}>
            v1.0 · Публичный API
          </div>
        </div>
      </nav>

      <div className="pt-16 max-w-5xl mx-auto px-4 md:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: "endpoints", icon: "Code2", label: "Эндпоинты API" },
            { id: "embed", icon: "LayoutTemplate", label: "Встраивание" },
            { id: "integrations", icon: "Network", label: "Реестр интеграций" },
            { id: "register", icon: "KeyRound", label: "Получить ключ" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
              style={{
                background: tab === t.id ? G("#00ff87, #3b82f6") : "rgba(255,255,255,0.04)",
                color: tab === t.id ? "black" : "rgba(255,255,255,0.5)",
                border: tab === t.id ? "none" : "1px solid rgba(255,255,255,0.08)",
              }}>
              <Icon name={t.icon as "Code2"} size={15} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Эндпоинты */}
        {tab === "endpoints" && (
          <div>
            <div className="mb-6 p-5 rounded-2xl" style={{ background: "rgba(0,255,135,0.05)", border: "1px solid rgba(0,255,135,0.15)" }}>
              <div className="text-white font-bold mb-1">Автономный режим</div>
              <p className="text-white/50 text-sm">Система ЕЦСУ 2.0 работает полностью независимо от любой платформы. API доступен 24/7 и может быть использован на любом сайте, мобильном приложении или сервере без привязки к poehali.dev.</p>
            </div>

            {ENDPOINTS.map(group => (
              <div key={group.group} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Icon name={group.icon as "AlertTriangle"} size={18} style={{ color: group.color }} />
                  <h2 className="font-display font-bold text-white text-lg uppercase">{group.group}</h2>
                  <div className="text-white/30 text-xs font-mono ml-2 truncate">{group.base}</div>
                </div>
                <div className="space-y-3">
                  {group.items.map((ep, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="flex items-center gap-3 px-5 py-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <span className="font-mono font-bold text-sm px-2 py-0.5 rounded"
                          style={{ background: ep.method === "GET" ? "rgba(0,255,135,0.15)" : "rgba(168,85,247,0.2)", color: ep.method === "GET" ? "#00ff87" : "#a855f7" }}>
                          {ep.method}
                        </span>
                        <span className="font-mono text-white/80 text-sm">{group.base}{ep.path}</span>
                        <button onClick={() => copy(`${group.base}${ep.path}`, `ep-${i}`)}
                          className="ml-auto text-white/30 hover:text-white/60 transition-colors">
                          <Icon name={copiedKey === `ep-${i}` ? "Check" : "Copy"} size={14} />
                        </button>
                      </div>
                      <div className="px-5 py-4">
                        <p className="text-white/60 text-sm mb-3">{ep.desc}</p>
                        {ep.params.length > 0 && (
                          <div className="mb-3">
                            <div className="text-white/30 text-xs mb-1 uppercase tracking-wide">Параметры</div>
                            <div className="flex flex-wrap gap-1">
                              {ep.params.map(p => (
                                <span key={p} className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#f59e0b" }}>{p}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="text-white/30 text-xs mb-1 uppercase tracking-wide">Ответ</div>
                          <div className="font-mono text-xs p-3 rounded-xl text-green-400/70 overflow-x-auto"
                            style={{ background: "rgba(0,0,0,0.3)" }}>{ep.response}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Встраивание */}
        {tab === "embed" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold text-white uppercase mb-2">Встраивание на сайт</h2>
              <p className="text-white/40 text-sm">ЕЦСУ 2.0 может работать на любом сайте или платформе</p>
            </div>

            {[
              { title: "JavaScript виджет — список инцидентов", icon: "Code2", color: "#f59e0b", code: EMBED_CODE, desc: "Встройте живой список инцидентов на любой сайт через JS" },
              { title: "Iframe — полный интерфейс системы", icon: "LayoutTemplate", color: "#3b82f6", code: IFRAME_CODE, desc: "Встройте весь интерфейс ЕЦСУ как вставку на странице" },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center justify-between px-5 py-4" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${item.color}20` }}>
                      <Icon name={item.icon as "Code2"} size={16} style={{ color: item.color }} />
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">{item.title}</div>
                      <div className="text-white/40 text-xs">{item.desc}</div>
                    </div>
                  </div>
                  <button onClick={() => copy(item.code, `embed-${i}`)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all"
                    style={{ background: copiedKey === `embed-${i}` ? "rgba(0,255,135,0.15)" : "rgba(255,255,255,0.06)", color: copiedKey === `embed-${i}` ? "#00ff87" : "white" }}>
                    <Icon name={copiedKey === `embed-${i}` ? "Check" : "Copy"} size={13} />
                    {copiedKey === `embed-${i}` ? "Скопировано" : "Копировать"}
                  </button>
                </div>
                <pre className="px-5 py-4 text-xs text-green-400/70 overflow-x-auto font-mono leading-relaxed"
                  style={{ background: "rgba(0,0,0,0.4)" }}>{item.code}</pre>
              </div>
            ))}

            <div className="p-5 rounded-2xl" style={{ background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.2)" }}>
              <div className="flex items-start gap-3">
                <Icon name="Info" size={18} className="text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-semibold mb-2">Независимость от платформы</div>
                  <ul className="text-white/50 text-sm space-y-1">
                    <li>• API работает независимо от poehali.dev</li>
                    <li>• Совместим с React, Vue, Angular, WordPress, 1C-Битрикс</li>
                    <li>• Мобильные приложения (iOS / Android) через REST API</li>
                    <li>• Telegram-бот, интеграция с CRM и ERP-системами</li>
                    <li>• Экспорт данных в CSV / JSON / XML по запросу</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Реестр интеграций */}
        {tab === "integrations" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-xl font-bold text-white uppercase">Реестр интеграций</h2>
                <p className="text-white/40 text-sm mt-1">{integrations.length} зарегистрированных платформ</p>
              </div>
              <button onClick={() => setTab("register")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                style={{ background: G("#00ff87, #3b82f6"), color: "black" }}>
                <Icon name="Plus" size={15} />
                Зарегистрировать
              </button>
            </div>
            <div className="space-y-3">
              {integrations.map(int => (
                <div key={int.id} className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: int.is_active ? "rgba(0,255,135,0.15)" : "rgba(255,255,255,0.05)" }}>
                    <Icon name="Network" size={18} style={{ color: int.is_active ? "#00ff87" : "#666" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm">{int.platform_name}</div>
                    {int.description && <div className="text-white/40 text-xs mt-0.5 truncate">{int.description}</div>}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {int.permissions.map(p => (
                        <span key={p} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7" }}>{p}</span>
                      ))}
                      <span className="text-white/25 text-[10px]">{new Date(int.created_at).toLocaleDateString("ru-RU")}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-white/60 font-bold">{int.requests_count}</div>
                    <div className="text-white/25 text-[10px]">запросов</div>
                  </div>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: int.is_active ? "#00ff87" : "#666" }} />
                </div>
              ))}
              {integrations.length === 0 && (
                <div className="text-center py-16 text-white/30">Нет зарегистрированных интеграций</div>
              )}
            </div>
          </div>
        )}

        {/* Регистрация */}
        {tab === "register" && (
          <div className="max-w-lg">
            <div className="mb-6">
              <h2 className="font-display text-xl font-bold text-white uppercase">Получить API-ключ</h2>
              <p className="text-white/40 text-sm mt-1">Зарегистрируйте вашу платформу для интеграции с ЕЦСУ</p>
            </div>

            {newKey ? (
              <div className="p-6 rounded-2xl" style={{ background: "rgba(0,255,135,0.07)", border: "1px solid rgba(0,255,135,0.25)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="CheckCircle" size={22} className="text-green-400" />
                  <div className="text-white font-bold">Интеграция зарегистрирована!</div>
                </div>
                <div className="mb-3">
                  <div className="text-white/40 text-xs mb-1 uppercase tracking-wide">Ваш API-ключ</div>
                  <div className="flex items-center gap-2">
                    <div className="font-mono text-sm text-green-400 flex-1 p-3 rounded-xl overflow-x-auto"
                      style={{ background: "rgba(0,0,0,0.4)" }}>{newKey.api_key}</div>
                    <button onClick={() => copy(newKey.api_key, "new-key")}
                      className="p-2 rounded-lg transition-all"
                      style={{ background: copiedKey === "new-key" ? "rgba(0,255,135,0.2)" : "rgba(255,255,255,0.07)" }}>
                      <Icon name={copiedKey === "new-key" ? "Check" : "Copy"} size={16} className="text-white/60" />
                    </button>
                  </div>
                </div>
                <p className="text-white/40 text-xs">Сохраните ключ — он отображается только один раз. Используйте в заголовке запроса: <span className="font-mono text-yellow-400">X-Api-Key: {newKey.api_key}</span></p>
                <button onClick={() => { setNewKey(null); setForm({ platform_name: "", description: "", permissions: ["read"] }); }}
                  className="mt-4 px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white/80 transition-colors">
                  Зарегистрировать ещё
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wide block mb-2">Название платформы *</label>
                  <input value={form.platform_name} onChange={e => setForm(f => ({ ...f, platform_name: e.target.value }))}
                    placeholder="Мой сайт / CRM / Мобильное приложение"
                    className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wide block mb-2">Описание (необязательно)</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Для чего используется интеграция..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none resize-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wide block mb-2">Права доступа</label>
                  <div className="flex flex-wrap gap-2">
                    {["read", "incidents", "legal", "write"].map(perm => (
                      <button key={perm} onClick={() => togglePerm(perm)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: form.permissions.includes(perm) ? "rgba(0,255,135,0.15)" : "rgba(255,255,255,0.05)",
                          color: form.permissions.includes(perm) ? "#00ff87" : "rgba(255,255,255,0.4)",
                          border: form.permissions.includes(perm) ? "1px solid rgba(0,255,135,0.3)" : "1px solid rgba(255,255,255,0.08)",
                        }}>
                        {perm}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={register} disabled={registering || !form.platform_name.trim()}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: G("#00ff87, #3b82f6"), color: "black" }}>
                  {registering ? "Регистрирую..." : "Получить API-ключ"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
