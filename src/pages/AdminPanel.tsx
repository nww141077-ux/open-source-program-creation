import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/aa81ecbc-fe9a-4921-a022-4a9ddd8dcb0e";
const SETTINGS_URL = "https://functions.poehali.dev/59e4c67e-ace9-4d4a-84fe-12edd379d465";
const LOGS_URL = "https://functions.poehali.dev/c771dff7-b826-46b9-ba5f-58f48879f8b5";
const FILES_URL = "https://functions.poehali.dev/3939f61b-ae8c-41d2-a8b1-b3fd7cce326f";

type Tab = "settings" | "modules" | "files" | "logs" | "backups";

type Module = { name: string; label: string; enabled: boolean };
type FileItem = { id: number; filename: string; original_name: string; size: number; content_type: string; url: string; uploaded_at: string };
type LogItem = { id: number; action: string; details: string; username: string; created_at: string };
type BackupItem = { id: number; label: string; created_at: string };

export default function AdminPanel() {
  const navigate = useNavigate();
  const token = localStorage.getItem("admin_token") || "";
  const adminUser = localStorage.getItem("admin_user") || "admin";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>("settings");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  // Settings
  const [settings, setSettings] = useState<Record<string, string>>({
    app_name: "", logo_path: "", theme_color: "#3498db", version: "1.0.0"
  });

  // Modules
  const [modules, setModules] = useState<Module[]>([]);

  // Files
  const [files, setFiles] = useState<FileItem[]>([]);
  const [renameId, setRenameId] = useState<number | null>(null);
  const [renameName, setRenameName] = useState("");

  // Logs
  const [logs, setLogs] = useState<LogItem[]>([]);

  // Backups
  const [backups, setBackups] = useState<BackupItem[]>([]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  useEffect(() => {
    if (!token) { navigate("/admin"); return; }
    loadAll();
    // Синхронизация каждые 5 минут
    const interval = setInterval(loadAll, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadSettings(), loadFiles(), loadLogs(), loadBackups()]);
    setLoading(false);
  };

  const loadSettings = async () => {
    const res = await fetch(SETTINGS_URL, { headers: authHeaders() });
    if (res.status === 401) { logout(); return; }
    const data = await res.json();
    if (data.settings) setSettings(data.settings);
    if (data.modules) setModules(data.modules);
  };

  const loadFiles = async () => {
    const res = await fetch(FILES_URL, { headers: authHeaders() });
    const data = await res.json();
    if (data.files) setFiles(data.files);
  };

  const loadLogs = async () => {
    const res = await fetch(LOGS_URL, { headers: authHeaders() });
    const data = await res.json();
    if (data.logs) setLogs(data.logs);
  };

  const loadBackups = async () => {
    const res = await fetch(`${LOGS_URL}/backup`, { headers: authHeaders() });
    const data = await res.json();
    if (data.backups) setBackups(data.backups);
  };

  const saveSettings = async () => {
    setLoading(true);
    await fetch(SETTINGS_URL, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ settings }),
    });
    showToast("✓ Настройки сохранены");
    loadLogs();
    setLoading(false);
  };

  const saveModules = async () => {
    setLoading(true);
    await fetch(`${SETTINGS_URL}/modules`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ modules }),
    });
    showToast("✓ Модули обновлены");
    loadLogs();
    setLoading(false);
  };

  const toggleModule = (name: string) => {
    setModules(prev => prev.map(m => m.name === name ? { ...m, enabled: !m.enabled } : m));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = (reader.result as string).split(",")[1];
      await fetch(`${FILES_URL}/upload`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ filename: file.name, content: b64, content_type: file.type }),
      });
      showToast("✓ Файл загружен");
      loadFiles();
      loadLogs();
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const deleteFile = async (id: number) => {
    if (!confirm("Удалить файл?")) return;
    await fetch(`${FILES_URL}?id=${id}`, { method: "DELETE", headers: authHeaders() });
    showToast("✓ Файл удалён");
    loadFiles();
    loadLogs();
  };

  const renameFile = async () => {
    if (!renameId || !renameName.trim()) return;
    await fetch(`${FILES_URL}/rename`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ id: renameId, name: renameName }),
    });
    setRenameId(null);
    setRenameName("");
    showToast("✓ Файл переименован");
    loadFiles();
    loadLogs();
  };

  const createBackup = async () => {
    setLoading(true);
    await fetch(`${LOGS_URL}/backup`, { method: "POST", headers: authHeaders() });
    showToast("✓ Резервная копия создана");
    loadBackups();
    loadLogs();
    setLoading(false);
  };

  const restoreBackup = async (id: number) => {
    if (!confirm("Восстановить эту резервную копию? Текущие настройки будут заменены.")) return;
    setLoading(true);
    await fetch(`${LOGS_URL}/restore`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ id }),
    });
    showToast("✓ Настройки восстановлены");
    loadAll();
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    navigate("/admin");
  };

  const fmtDate = (iso: string) => new Date(iso).toLocaleString("ru-RU");
  const fmtSize = (bytes: number) => bytes < 1024 ? `${bytes} Б` : bytes < 1048576 ? `${Math.round(bytes / 1024)} КБ` : `${Math.round(bytes / 1048576)} МБ`;

  const navItems: { id: Tab; icon: string; label: string }[] = [
    { id: "settings", icon: "Settings", label: "Настройки" },
    { id: "modules", icon: "ToggleLeft", label: "Модули" },
    { id: "files", icon: "FolderOpen", label: "Файлы" },
    { id: "backups", icon: "Archive", label: "Бэкапы" },
    { id: "logs", icon: "ScrollText", label: "Журнал" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#0f172a", color: "white" }}>
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-xl"
          style={{ background: "rgba(59,130,246,0.9)", color: "white" }}>{toast}</div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-3"
        style={{ background: "rgba(15,23,42,0.95)", borderBottom: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>
            <Icon name="Shield" size={16} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">Панель управления</div>
            <div className="text-xs text-slate-500">Система удалённого управления</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {loading && <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />}
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Icon name="User" size={14} />
            {adminUser}
          </div>
          <button onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-red-400 transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <Icon name="LogOut" size={13} />
            Выйти
          </button>
        </div>
      </header>

      <div className="pt-14 flex min-h-screen">
        {/* Sidebar */}
        <aside className="fixed left-0 top-14 bottom-0 w-16 md:w-52 flex flex-col py-4 gap-1 px-2"
          style={{ background: "rgba(15,23,42,0.95)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left"
              style={{
                background: tab === item.id ? "rgba(59,130,246,0.15)" : "transparent",
                color: tab === item.id ? "#60a5fa" : "rgba(255,255,255,0.4)",
                border: tab === item.id ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent",
              }}>
              <Icon name={item.icon as "Settings"} size={16} />
              <span className="hidden md:block text-xs">{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Main */}
        <main className="flex-1 ml-16 md:ml-52 p-6">

          {/* НАСТРОЙКИ */}
          {tab === "settings" && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Настройки приложения</h2>
                <p className="text-slate-500 text-sm mt-1">Изменения применяются без перезапуска</p>
              </div>
              <div className="p-6 rounded-2xl space-y-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Название приложения</label>
                  <input type="text" value={settings.app_name || ""} onChange={e => setSettings(p => ({ ...p, app_name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Цветовая схема</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={settings.theme_color || "#3498db"}
                      onChange={e => setSettings(p => ({ ...p, theme_color: e.target.value }))}
                      className="w-12 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                    <input type="text" value={settings.theme_color || ""}
                      onChange={e => setSettings(p => ({ ...p, theme_color: e.target.value }))}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none font-mono"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Версия</label>
                  <input type="text" value={settings.version || ""} onChange={e => setSettings(p => ({ ...p, version: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
                </div>
                <button onClick={saveSettings} disabled={loading}
                  className="w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>
                  Сохранить настройки
                </button>
              </div>
            </div>
          )}

          {/* МОДУЛИ */}
          {tab === "modules" && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Управление модулями</h2>
                <p className="text-slate-500 text-sm mt-1">Включение и отключение функциональности</p>
              </div>
              <div className="p-6 rounded-2xl space-y-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {modules.map(m => (
                  <div key={m.name} className="flex items-center justify-between py-3 border-b last:border-0"
                    style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <div>
                      <div className="text-white text-sm font-medium">{m.label}</div>
                      <div className="text-slate-500 text-xs">{m.name}</div>
                    </div>
                    <button onClick={() => toggleModule(m.name)}
                      className="relative w-11 h-6 rounded-full transition-all duration-300"
                      style={{ background: m.enabled ? "#3b82f6" : "rgba(255,255,255,0.1)" }}>
                      <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300"
                        style={{ left: m.enabled ? "24px" : "4px" }} />
                    </button>
                  </div>
                ))}
                <button onClick={saveModules} disabled={loading}
                  className="w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 mt-2"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>
                  Сохранить
                </button>
              </div>
            </div>
          )}

          {/* ФАЙЛЫ */}
          {tab === "files" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Файловый менеджер</h2>
                  <p className="text-slate-500 text-sm mt-1">{files.length} файлов</p>
                </div>
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>
                  <Icon name="Upload" size={15} />
                  Загрузить
                </button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
              </div>

              {renameId && (
                <div className="p-4 rounded-xl flex items-center gap-3"
                  style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)" }}>
                  <input type="text" value={renameName} onChange={e => setRenameName(e.target.value)}
                    placeholder="Новое имя файла"
                    className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
                  <button onClick={renameFile} className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                    style={{ background: "#3b82f6" }}>ОК</button>
                  <button onClick={() => setRenameId(null)} className="px-3 py-2 rounded-lg text-sm text-slate-400">Отмена</button>
                </div>
              )}

              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Имя файла</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Размер</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Дата</th>
                      <th className="text-right px-4 py-3 text-slate-400 font-medium">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map(f => (
                      <tr key={f.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Icon name="File" size={14} className="text-slate-500 shrink-0" />
                            <a href={f.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline truncate max-w-[200px]">
                              {f.original_name}
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{fmtSize(f.size)}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">{fmtDate(f.uploaded_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => { setRenameId(f.id); setRenameName(f.original_name); }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 transition-colors"
                              style={{ background: "rgba(255,255,255,0.05)" }}>
                              <Icon name="Pencil" size={13} />
                            </button>
                            <button onClick={() => deleteFile(f.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                              style={{ background: "rgba(255,255,255,0.05)" }}>
                              <Icon name="Trash2" size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {files.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-slate-600">
                          <Icon name="FolderOpen" size={32} className="mx-auto mb-2 opacity-40" />
                          <p>Файлов нет</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* БЭКАПЫ */}
          {tab === "backups" && (
            <div className="max-w-xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Резервные копии</h2>
                  <p className="text-slate-500 text-sm mt-1">Хранится до 5 последних версий</p>
                </div>
                <button onClick={createBackup} disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>
                  <Icon name="Archive" size={15} />
                  Создать бэкап
                </button>
              </div>
              <div className="space-y-3">
                {backups.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-4 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div>
                      <div className="text-white text-sm font-medium">{b.label}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{fmtDate(b.created_at)}</div>
                    </div>
                    <button onClick={() => restoreBackup(b.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                      style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)" }}>
                      <Icon name="RotateCcw" size={12} />
                      Восстановить
                    </button>
                  </div>
                ))}
                {backups.length === 0 && (
                  <div className="text-center py-12 text-slate-600">
                    <Icon name="Archive" size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Резервных копий нет</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ЖУРНАЛ */}
          {tab === "logs" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Журнал изменений</h2>
                <p className="text-slate-500 text-sm mt-1">Все действия администратора</p>
              </div>
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Дата</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Действие</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Детали</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Пользователь</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(l => (
                      <tr key={l.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{fmtDate(l.created_at)}</td>
                        <td className="px-4 py-3 text-white">{l.action}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell max-w-xs truncate">{l.details || "—"}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}>
                            {l.username}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-slate-600">
                          <Icon name="ScrollText" size={32} className="mx-auto mb-2 opacity-40" />
                          <p>Журнал пуст</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
