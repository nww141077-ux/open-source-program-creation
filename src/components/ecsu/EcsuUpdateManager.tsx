import React, { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const UPDATES_URL = "https://functions.poehali.dev/0639f989-669a-462c-aac5-7730ba2e2470";
const MUSON_URL   = "https://functions.poehali.dev/7bb30a16-64ef-48af-ae2a-132fc94893cd";

type UpdateType = "patch" | "minor" | "major" | "data" | "config";
type UpdateStatus = "active" | "paused" | "archived";

interface AppUpdate {
  id: number;
  version: string;
  title: string;
  description: string;
  update_type: UpdateType;
  payload: Record<string, unknown>;
  files: string[];
  created_by: string;
  created_at: string;
  status: UpdateStatus;
  applied_count: number;
}

const TYPE_META: Record<UpdateType, { label: string; color: string; icon: string }> = {
  patch:  { label: "Патч",         color: "#60a5fa", icon: "Wrench" },
  minor:  { label: "Обновление",   color: "#34d399", icon: "RefreshCw" },
  major:  { label: "Мажорное",     color: "#a78bfa", icon: "Rocket" },
  data:   { label: "Данные",       color: "#fbbf24", icon: "Database" },
  config: { label: "Конфигурация", color: "#f97316", icon: "Settings" },
};

const STATUS_META: Record<UpdateStatus, { label: string; color: string }> = {
  active:   { label: "Активно",    color: "#34d399" },
  paused:   { label: "На паузе",   color: "#f59e0b" },
  archived: { label: "Архив",      color: "#6b7280" },
};

interface Snapshot {
  id: number;
  name: string;
  description: string;
  snapshot_type: string;
  created_by: string;
  created_at: string;
  is_active: boolean;
  tag: string;
  size_kb: number;
  rollback_count: number;
}

interface DeliveryFile {
  id: number;
  filename: string;
  description: string;
  file_type: string;
  dest_path: string;
  size_bytes: number;
  created_by: string;
  created_at: string;
  status: string;
  delivered_count: number;
}

interface Props {
  onClose: () => void;
}

const EcsuUpdateManager = ({ onClose }: Props) => {
  const [updates, setUpdates]         = useState<AppUpdate[]>([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState<"list" | "create" | "files" | "snapshots" | "agents">("list");
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [agents, setAgents]           = useState<{ agent_id: string; hostname: string; status: string }[]>([]);
  const [files, setFiles]             = useState<DeliveryFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [fileForm, setFileForm]       = useState({ description: "", dest_path: "", file_type: "document" });
  const fileInputRef                  = React.useRef<HTMLInputElement>(null);
  const [snapshots, setSnapshots]     = useState<Snapshot[]>([]);
  const [snapLoading, setSnapLoading] = useState(false);
  const [snapForm, setSnapForm]       = useState({ name: "", description: "", tag: "" });
  const [snapSaving, setSnapSaving]   = useState(false);
  const [snapSaved, setSnapSaved]     = useState(false);
  const [rollbackId, setRollbackId]   = useState<number | null>(null);
  const [rollbackReason, setRollbackReason] = useState("");
  const [rolling, setRolling]         = useState(false);

  // Форма создания
  const [form, setForm] = useState({
    version:     "2.0.5",
    title:       "",
    description: "",
    update_type: "patch" as UpdateType,
    status:      "active" as UpdateStatus,
    payload_raw: "{}",
  });
  const [formError, setFormError] = useState("");

  const loadUpdates = async () => {
    setLoading(true);
    try {
      const r = await fetch(UPDATES_URL);
      const d = await r.json();
      setUpdates(d.updates || []);
    } catch { /* нет связи */ }
    setLoading(false);
  };

  const loadAgents = async () => {
    try {
      const r = await fetch(MUSON_URL);
      const d = await r.json();
      setAgents((d.agents || []).map((a: { agent_id: string; hostname: string; status: string }) => ({
        agent_id: a.agent_id,
        hostname: a.hostname,
        status:   a.status,
      })));
    } catch { /* нет связи */ }
  };

  const loadSnapshots = async () => {
    setSnapLoading(true);
    try {
      const r = await fetch(`${UPDATES_URL}?action=snapshots`);
      const d = await r.json();
      setSnapshots((d.snapshots || []).filter((s: Snapshot) => s.snapshot_type !== "rollback_command"));
    } catch { /* нет связи */ }
    setSnapLoading(false);
  };

  const loadFiles = async () => {
    setFilesLoading(true);
    try {
      const r = await fetch(`${UPDATES_URL}?action=files`);
      const d = await r.json();
      setFiles(d.files || []);
    } catch { /* нет связи */ }
    setFilesLoading(false);
  };

  const uploadFile = async (file: File) => {
    setFileUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1] || "";
        await fetch(UPDATES_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "upload_file",
            filename: file.name,
            description: fileForm.description,
            file_type: fileForm.file_type,
            content_b64: base64,
            dest_path: fileForm.dest_path,
          }),
        });
        setFileForm({ description: "", dest_path: "", file_type: "document" });
        await loadFiles();
      };
      reader.readAsDataURL(file);
    } catch { /* ошибка */ }
    setFileUploading(false);
  };

  const deleteFile = async (id: number) => {
    if (!confirm("Удалить файл?")) return;
    await fetch(UPDATES_URL, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "file", id }),
    });
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const createSnapshot = async () => {
    setSnapSaving(true);
    const name = snapForm.name.trim() || `Снапшот ${new Date().toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`;
    try {
      await fetch(UPDATES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "snapshot",
          name,
          description: snapForm.description,
          tag: snapForm.tag,
          snapshot_type: "manual",
          state: { version: "2.0.5", saved_at: new Date().toISOString(), tag: snapForm.tag, updates_count: updates.length },
        }),
      });
      setSnapSaved(true);
      setSnapForm({ name: "", description: "", tag: "" });
      await loadSnapshots();
      setTimeout(() => setSnapSaved(false), 2000);
    } catch { /* ошибка */ }
    setSnapSaving(false);
  };

  const doRollback = async () => {
    if (!rollbackId) return;
    setRolling(true);
    try {
      await fetch(UPDATES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rollback",
          snapshot_id: rollbackId,
          reason: rollbackReason || "Инициировано с сайта",
          rolled_by: "admin",
        }),
      });
      setRollbackId(null);
      setRollbackReason("");
      await loadSnapshots();
    } catch { /* ошибка */ }
    setRolling(false);
  };

  const deleteSnapshot = async (id: number) => {
    if (!confirm("Удалить снапшот?")) return;
    await fetch(UPDATES_URL, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "snapshot", id }),
    });
    setSnapshots(prev => prev.filter(s => s.id !== id));
  };

  useEffect(() => {
    loadUpdates();
    loadAgents();
    loadSnapshots();
    loadFiles();
  }, []);

  const createUpdate = async () => {
    if (!form.title.trim()) { setFormError("Введите название обновления"); return; }
    setFormError("");
    setSaving(true);
    try {
      let payload = {};
      try { payload = JSON.parse(form.payload_raw); } catch { payload = {}; }
      await fetch(UPDATES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, payload }),
      });
      setSaved(true);
      setForm({ version: "2.0.5", title: "", description: "", update_type: "patch", status: "active", payload_raw: "{}" });
      await loadUpdates();
      setTimeout(() => { setSaved(false); setTab("list"); }, 1500);
    } catch { setFormError("Ошибка сохранения"); }
    setSaving(false);
  };

  const setStatus = async (id: number, status: UpdateStatus) => {
    await fetch(UPDATES_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setUpdates(prev => prev.map(u => u.id === id ? { ...u, status } : u));
  };

  const deleteUpdate = async (id: number) => {
    if (!confirm("Удалить обновление?")) return;
    await fetch(UPDATES_URL, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setUpdates(prev => prev.filter(u => u.id !== id));
  };

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div
        className="bg-[#0d1225] border border-blue-900/40 rounded-2xl w-full max-w-3xl mx-4 shadow-2xl flex flex-col"
        style={{ maxHeight: "88vh" }}
      >
        {/* ── Шапка ── */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-blue-900/30 bg-gradient-to-r from-[#34d399]/10 to-transparent rounded-t-2xl">
          <div className="w-9 h-9 bg-gradient-to-br from-[#34d399] to-[#059669] rounded-xl flex items-center justify-center">
            <Icon name="Download" size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="text-white font-bold text-base">Менеджер обновлений ECSU</div>
            <div className="text-[#34d399] text-xs">
              Управление обновлениями · автосинхронизация с ПК-приложением
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#1a3d2e] border border-[#34d399]/20 rounded-lg px-2.5 py-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${agents.filter(a => a.status === "online").length > 0 ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
              <span className="text-[#34d399] text-xs">
                {agents.filter(a => a.status === "online").length} ПК онлайн
              </span>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-red-400 transition-colors p-1">
              <Icon name="X" size={18} />
            </button>
          </div>
        </div>

        {/* ── Вкладки ── */}
        <div className="flex gap-1 px-5 pt-3 pb-0">
          {[
            { id: "list"      as const, label: "Обновления",       icon: "List" },
            { id: "create"    as const, label: "Создать",           icon: "Plus" },
            { id: "files"     as const, label: "Файлы на ПК",      icon: "FolderUp" },
            { id: "snapshots" as const, label: "Снапшоты / Откат", icon: "RotateCcw" },
            { id: "agents"    as const, label: "ПК-агенты",        icon: "Laptop" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-all border-b-2 ${
                tab === t.id
                  ? "text-[#34d399] border-[#34d399]"
                  : "text-gray-500 border-transparent hover:text-gray-300"
              }`}
            >
              <Icon name={t.icon} size={13} />
              {t.label}
            </button>
          ))}
        </div>
        <div className="border-b border-blue-900/20 mx-5" />

        {/* ── Контент ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* ── СПИСОК ОБНОВЛЕНИЙ ── */}
          {tab === "list" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-400 text-xs">
                  Всего: {updates.length} · Активных: {updates.filter(u => u.status === "active").length}
                </span>
                <button
                  onClick={loadUpdates}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Icon name="RefreshCw" size={11} />
                  Обновить
                </button>
              </div>

              {loading && (
                <div className="flex items-center gap-2 text-gray-500 text-sm py-6 justify-center">
                  <Icon name="Loader" size={16} className="animate-spin" />
                  Загрузка...
                </div>
              )}

              {!loading && updates.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-900/20 flex items-center justify-center">
                    <Icon name="PackageOpen" size={26} className="text-blue-600" />
                  </div>
                  <div className="text-gray-500 text-sm">Обновлений пока нет</div>
                  <button
                    onClick={() => setTab("create")}
                    className="px-4 py-2 bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/30 rounded-lg text-sm hover:bg-[#34d399]/30 transition-colors"
                  >
                    Создать первое обновление
                  </button>
                </div>
              )}

              {updates.map(u => {
                const tm = TYPE_META[u.update_type] || TYPE_META.patch;
                const sm = STATUS_META[u.status] || STATUS_META.active;
                return (
                  <div
                    key={u.id}
                    className={`p-4 rounded-xl border transition-all ${
                      u.status === "active"
                        ? "bg-[#0a1f1a] border-[#34d399]/20"
                        : u.status === "paused"
                        ? "bg-[#1a1a0a] border-yellow-900/20"
                        : "bg-[#0d1225] border-white/5 opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: tm.color + "22" }}
                      >
                        <Icon name={tm.icon} size={16} style={{ color: tm.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-semibold text-sm">{u.title}</span>
                          {u.version && (
                            <span className="text-[10px] bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded font-mono">
                              v{u.version}
                            </span>
                          )}
                          <span
                            className="text-[10px] px-2 py-0.5 rounded font-semibold"
                            style={{ background: tm.color + "22", color: tm.color }}
                          >
                            {tm.label}
                          </span>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded font-semibold"
                            style={{ color: sm.color }}
                          >
                            {sm.label}
                          </span>
                        </div>
                        {u.description && (
                          <div className="text-gray-400 text-xs mt-1">{u.description}</div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-600">
                          <span>{formatDate(u.created_at)}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Icon name="CheckCircle" size={10} className="text-green-600" />
                            Применено на {u.applied_count} ПК
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {u.status === "active" && (
                          <button
                            onClick={() => setStatus(u.id, "paused")}
                            title="Приостановить"
                            className="p-1.5 text-gray-500 hover:text-yellow-400 transition-colors"
                          >
                            <Icon name="PauseCircle" size={15} />
                          </button>
                        )}
                        {u.status === "paused" && (
                          <button
                            onClick={() => setStatus(u.id, "active")}
                            title="Возобновить"
                            className="p-1.5 text-gray-500 hover:text-green-400 transition-colors"
                          >
                            <Icon name="PlayCircle" size={15} />
                          </button>
                        )}
                        {u.status !== "archived" && (
                          <button
                            onClick={() => setStatus(u.id, "archived")}
                            title="В архив"
                            className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors"
                          >
                            <Icon name="Archive" size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteUpdate(u.id)}
                          title="Удалить"
                          className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                        >
                          <Icon name="Trash2" size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── СОЗДАТЬ ОБНОВЛЕНИЕ ── */}
          {tab === "create" && (
            <div className="space-y-4 max-w-xl">
              <div className="text-gray-400 text-xs">
                Создайте обновление — оно автоматически появится в очереди для всех ПК-приложений.
                Агент на ПК проверяет очередь каждые 30 секунд и применяет новые обновления.
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-gray-500 text-xs mb-1 block">Название обновления *</label>
                    <input
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder="Краткое название изменения"
                      className="w-full bg-[#060d1f] border border-blue-900/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#34d399]/50 placeholder-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs mb-1 block">Версия</label>
                    <input
                      value={form.version}
                      onChange={e => setForm({ ...form, version: e.target.value })}
                      placeholder="2.0.5"
                      className="w-full bg-[#060d1f] border border-blue-900/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#34d399]/50 placeholder-gray-600 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-500 text-xs mb-1 block">Описание изменений</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Что изменилось, что нужно обновить на ПК-приложении..."
                    rows={3}
                    className="w-full bg-[#060d1f] border border-blue-900/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#34d399]/50 placeholder-gray-600 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-500 text-xs mb-1 block">Тип обновления</label>
                    <select
                      value={form.update_type}
                      onChange={e => setForm({ ...form, update_type: e.target.value as UpdateType })}
                      className="w-full bg-[#060d1f] border border-blue-900/30 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="patch">Патч (мелкие правки)</option>
                      <option value="minor">Обновление (новые функции)</option>
                      <option value="major">Мажорное (крупное)</option>
                      <option value="data">Данные (справочники, инциденты)</option>
                      <option value="config">Конфигурация (настройки)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs mb-1 block">Статус</label>
                    <select
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value as UpdateStatus })}
                      className="w-full bg-[#060d1f] border border-blue-900/30 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="active">Активно (сразу разослать)</option>
                      <option value="paused">На паузе (не рассылать)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-gray-500 text-xs mb-1 block">
                    Данные обновления (JSON, необязательно)
                  </label>
                  <textarea
                    value={form.payload_raw}
                    onChange={e => setForm({ ...form, payload_raw: e.target.value })}
                    placeholder='{"key": "value"}'
                    rows={3}
                    className="w-full bg-[#060d1f] border border-blue-900/30 text-green-400 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#34d399]/50 placeholder-gray-700 resize-none"
                  />
                  <div className="text-gray-700 text-[10px] mt-1">
                    Сюда можно вставить данные (настройки, конфигурацию) которые агент применит на ПК
                  </div>
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-900/30 rounded-lg px-3 py-2">
                  <Icon name="AlertCircle" size={14} />
                  {formError}
                </div>
              )}

              <button
                onClick={createUpdate}
                disabled={saving || saved}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                  saved
                    ? "bg-green-600 text-white"
                    : "bg-[#34d399] hover:bg-[#2bb884] text-black disabled:opacity-50"
                }`}
              >
                {saved ? (
                  <span className="flex items-center justify-center gap-2">
                    <Icon name="Check" size={16} />
                    Обновление создано и разослано!
                  </span>
                ) : saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Icon name="Loader" size={14} className="animate-spin" />
                    Сохранение...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Icon name="Send" size={14} />
                    Создать и разослать на все ПК
                  </span>
                )}
              </button>
            </div>
          )}

          {/* ── ПК-ПРИЛОЖЕНИЯ ── */}
          {tab === "agents" && (
            <div className="space-y-4">
              {/* Инструкция установки агента */}
              <div className="bg-blue-950/30 border border-blue-800/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="Info" size={15} className="text-blue-400" />
                  <span className="text-blue-300 text-sm font-semibold">Как установить агент на ПК</span>
                </div>
                <div className="space-y-2 text-xs text-gray-400">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold shrink-0">1.</span>
                    <span>Скачайте файл <span className="text-white font-mono">ecsu_agent.py</span> (кнопка ниже)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold shrink-0">2.</span>
                    <span>Установите Python 3.10+: <span className="text-blue-300">python.org/downloads</span></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold shrink-0">3.</span>
                    <span>Запустите: <span className="text-white font-mono">python ecsu_agent.py</span> или дважды кликните <span className="text-white font-mono">ЗАПУСК.bat</span></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold shrink-0">4.</span>
                    <span>Агент автоматически подключится к серверу и начнёт получать обновления</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <a
                    href={`data:text/plain;charset=utf-8,${encodeURIComponent(generateAgentScript())}`}
                    download="ecsu_agent.py"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#34d399]/20 border border-[#34d399]/30 text-[#34d399] text-xs rounded-lg hover:bg-[#34d399]/30 transition-colors"
                  >
                    <Icon name="Download" size={12} />
                    Скачать ecsu_agent.py
                  </a>
                  <a
                    href={`data:text/plain;charset=utf-8,${encodeURIComponent(generateBatScript())}`}
                    download="ЗАПУСК.bat"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/20 border border-blue-700/30 text-blue-400 text-xs rounded-lg hover:bg-blue-900/30 transition-colors"
                  >
                    <Icon name="Terminal" size={12} />
                    Скачать ЗАПУСК.bat
                  </a>
                </div>
              </div>

              {/* Список ПК */}
              <div>
                <div className="text-gray-500 text-xs mb-2 flex items-center justify-between">
                  <span>Подключённые ПК-приложения</span>
                  <button onClick={loadAgents} className="text-blue-400 hover:text-blue-300 transition-colors">
                    <Icon name="RefreshCw" size={11} />
                  </button>
                </div>
                {agents.length === 0 ? (
                  <div className="text-center py-6 text-gray-600 text-sm">
                    Нет подключённых ПК
                  </div>
                ) : (
                  <div className="space-y-2">
                    {agents.map(a => (
                      <div
                        key={a.agent_id}
                        className="flex items-center gap-3 p-3 bg-[#0d1225] border border-white/5 rounded-xl"
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${a.status === "online" ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
                        <div className="flex-1">
                          <div className="text-white text-sm font-medium">{a.hostname}</div>
                          <div className="text-gray-600 text-xs font-mono">{a.agent_id}</div>
                        </div>
                        <div
                          className="text-xs px-2 py-0.5 rounded font-semibold"
                          style={a.status === "online"
                            ? { color: "#34d399", background: "#34d39922" }
                            : { color: "#6b7280", background: "#6b728022" }}
                        >
                          {a.status === "online" ? "Онлайн" : "Офлайн"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════
              ФАЙЛЫ НА ПК
          ══════════════════════════════════════════ */}
          {tab === "files" && (
            <div className="space-y-4">

              {/* Загрузка файла */}
              <div className="bg-[#0a1222] border border-blue-800/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="FolderUp" size={15} className="text-blue-400" />
                  <span className="text-white text-sm font-semibold">Отправить файл на все ПК</span>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-500 text-[10px] mb-1 block">Описание файла</label>
                      <input
                        value={fileForm.description}
                        onChange={e => setFileForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Что это за файл"
                        className="w-full bg-[#060d1f] border border-blue-900/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-600"
                      />
                    </div>
                    <div>
                      <label className="text-gray-500 text-[10px] mb-1 block">Путь назначения на ПК</label>
                      <input
                        value={fileForm.dest_path}
                        onChange={e => setFileForm(f => ({ ...f, dest_path: e.target.value }))}
                        placeholder="C:\ECSU\configs\ (необязательно)"
                        className="w-full bg-[#060d1f] border border-blue-900/30 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500/50 placeholder-gray-600"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={fileForm.file_type}
                      onChange={e => setFileForm(f => ({ ...f, file_type: e.target.value }))}
                      className="bg-[#060d1f] border border-blue-900/30 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="document">Документ</option>
                      <option value="config">Конфигурация</option>
                      <option value="script">Скрипт</option>
                      <option value="data">Данные (JSON/CSV)</option>
                      <option value="image">Изображение</option>
                      <option value="archive">Архив</option>
                    </select>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0]); }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={fileUploading}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      <Icon name={fileUploading ? "Loader" : "Upload"} size={14} className={fileUploading ? "animate-spin" : ""} />
                      {fileUploading ? "Загрузка..." : "Выбрать файл"}
                    </button>
                  </div>
                </div>
                <div className="mt-3 text-gray-600 text-[10px] flex items-center gap-1.5">
                  <Icon name="Info" size={10} />
                  Файл будет автоматически доставлен на все онлайн ПК-агенты. Агент сохранит его в папку назначения.
                </div>
              </div>

              {/* Список файлов */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs">Файлы в очереди доставки: {files.filter(f => f.status === "active").length}</span>
                  <button onClick={loadFiles} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs transition-colors">
                    <Icon name="RefreshCw" size={10} />
                    Обновить
                  </button>
                </div>

                {filesLoading && (
                  <div className="flex justify-center items-center gap-2 text-gray-500 text-sm py-6">
                    <Icon name="Loader" size={15} className="animate-spin" />
                    Загрузка...
                  </div>
                )}

                {!filesLoading && files.length === 0 && (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-blue-900/20 flex items-center justify-center">
                      <Icon name="FolderOpen" size={22} className="text-blue-600/40" />
                    </div>
                    <div className="text-gray-600 text-sm">Файлов для доставки нет</div>
                  </div>
                )}

                <div className="space-y-2">
                  {files.map(f => {
                    const typeIcon: Record<string, string> = {
                      document: "FileText", config: "Settings", script: "Terminal",
                      data: "Database", image: "Image", archive: "Archive",
                    };
                    const icon = typeIcon[f.file_type] || "File";
                    const sizeStr = f.size_bytes > 1024 * 1024
                      ? `${(f.size_bytes / 1024 / 1024).toFixed(1)} МБ`
                      : f.size_bytes > 1024
                      ? `${(f.size_bytes / 1024).toFixed(0)} КБ`
                      : `${f.size_bytes} Б`;
                    return (
                      <div key={f.id} className="flex items-start gap-3 p-3 bg-[#0d1225] border border-white/5 rounded-xl hover:border-white/10 transition-all">
                        <div className="w-9 h-9 rounded-lg bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                          <Icon name={icon} size={16} className="text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white text-sm font-semibold truncate">{f.filename}</span>
                            <span className="text-[10px] bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded">{f.file_type}</span>
                            {f.status !== "active" && (
                              <span className="text-[10px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">{f.status}</span>
                            )}
                          </div>
                          {f.description && <div className="text-gray-400 text-xs mt-0.5">{f.description}</div>}
                          {f.dest_path && (
                            <div className="text-gray-600 text-[10px] font-mono mt-0.5 flex items-center gap-1">
                              <Icon name="FolderOpen" size={9} />
                              {f.dest_path}
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-600">
                            <span>{f.created_at ? new Date(f.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                            <span>{sizeStr}</span>
                            <span className="flex items-center gap-1 text-green-600">
                              <Icon name="CheckCircle" size={9} />
                              Доставлено: {f.delivered_count} ПК
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteFile(f.id)}
                          className="p-1.5 text-gray-600 hover:text-red-400 transition-colors shrink-0"
                        >
                          <Icon name="Trash2" size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════
              СНАПШОТЫ И ОТКАТ
          ══════════════════════════════════════════ */}
          {tab === "snapshots" && (
            <div className="space-y-5">

              {/* Блок создания снапшота */}
              <div className="bg-[#0a1f1a] border border-[#34d399]/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="Camera" size={15} className="text-[#34d399]" />
                  <span className="text-white text-sm font-semibold">Создать снапшот</span>
                  <span className="text-gray-600 text-xs ml-1">— точка восстановления системы</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="col-span-2">
                    <input
                      value={snapForm.name}
                      onChange={e => setSnapForm({ ...snapForm, name: e.target.value })}
                      placeholder={`Снапшот ${new Date().toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`}
                      className="w-full bg-[#060d1f] border border-[#34d399]/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#34d399]/50 placeholder-gray-600"
                    />
                  </div>
                  <div>
                    <input
                      value={snapForm.description}
                      onChange={e => setSnapForm({ ...snapForm, description: e.target.value })}
                      placeholder="Описание (необязательно)"
                      className="w-full bg-[#060d1f] border border-blue-900/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#34d399]/50 placeholder-gray-600"
                    />
                  </div>
                  <div>
                    <input
                      value={snapForm.tag}
                      onChange={e => setSnapForm({ ...snapForm, tag: e.target.value })}
                      placeholder="Тег (напр: v2.0.5-stable)"
                      className="w-full bg-[#060d1f] border border-blue-900/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#34d399]/50 placeholder-gray-600 font-mono"
                    />
                  </div>
                </div>
                <button
                  onClick={createSnapshot}
                  disabled={snapSaving || snapSaved}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    snapSaved
                      ? "bg-green-600 text-white"
                      : "bg-[#34d399] hover:bg-[#2bb884] text-black disabled:opacity-50"
                  }`}
                >
                  <Icon name={snapSaved ? "Check" : snapSaving ? "Loader" : "Camera"} size={14} className={snapSaving ? "animate-spin" : ""} />
                  {snapSaved ? "Снапшот создан!" : snapSaving ? "Сохранение..." : "Сохранить снапшот"}
                </button>
              </div>

              {/* Список снапшотов */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs">
                    Точек восстановления: {snapshots.length}
                  </span>
                  <button onClick={loadSnapshots} className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 transition-colors">
                    <Icon name="RefreshCw" size={10} />
                    Обновить
                  </button>
                </div>

                {snapLoading && (
                  <div className="flex items-center justify-center gap-2 text-gray-500 text-sm py-6">
                    <Icon name="Loader" size={15} className="animate-spin" />
                    Загрузка...
                  </div>
                )}

                {!snapLoading && snapshots.length === 0 && (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#34d399]/10 flex items-center justify-center">
                      <Icon name="Camera" size={22} className="text-[#34d399]/40" />
                    </div>
                    <div className="text-gray-600 text-sm">Снапшотов пока нет. Создайте первую точку восстановления.</div>
                  </div>
                )}

                <div className="space-y-2">
                  {snapshots.map(s => (
                    <div
                      key={s.id}
                      className={`p-4 rounded-xl border transition-all ${
                        rollbackId === s.id
                          ? "bg-orange-950/30 border-orange-500/40"
                          : "bg-[#0d1225] border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#34d399]/10 flex items-center justify-center flex-shrink-0">
                          <Icon name="Camera" size={16} className="text-[#34d399]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-semibold text-sm">{s.name}</span>
                            {s.tag && (
                              <span className="text-[10px] bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded font-mono">
                                {s.tag}
                              </span>
                            )}
                          </div>
                          {s.description && (
                            <div className="text-gray-400 text-xs mt-0.5">{s.description}</div>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-600">
                            <span>{s.created_at ? new Date(s.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                            {s.size_kb > 0 && <span>{s.size_kb} КБ</span>}
                            {s.rollback_count > 0 && (
                              <span className="text-orange-400 flex items-center gap-1">
                                <Icon name="RotateCcw" size={9} />
                                Откатов: {s.rollback_count}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {rollbackId !== s.id ? (
                            <button
                              onClick={() => { setRollbackId(s.id); setRollbackReason(""); }}
                              title="Откатить к этому снапшоту"
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-900/20 border border-orange-700/30 text-orange-400 text-xs rounded-lg hover:bg-orange-900/30 transition-colors"
                            >
                              <Icon name="RotateCcw" size={12} />
                              Откат
                            </button>
                          ) : (
                            <button
                              onClick={() => setRollbackId(null)}
                              className="text-gray-500 hover:text-gray-300 p-1 transition-colors"
                            >
                              <Icon name="X" size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteSnapshot(s.id)}
                            title="Удалить снапшот"
                            className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                          >
                            <Icon name="Trash2" size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Панель подтверждения отката */}
                      {rollbackId === s.id && (
                        <div className="mt-3 pt-3 border-t border-orange-700/20 space-y-2">
                          <div className="flex items-center gap-2 text-orange-400 text-xs mb-2">
                            <Icon name="AlertTriangle" size={12} />
                            <span>Все ПК-агенты получат команду откатиться к этому снапшоту</span>
                          </div>
                          <input
                            value={rollbackReason}
                            onChange={e => setRollbackReason(e.target.value)}
                            placeholder="Причина отката (необязательно)"
                            className="w-full bg-[#060d1f] border border-orange-700/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500/40 placeholder-gray-600"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={doRollback}
                              disabled={rolling}
                              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                            >
                              <Icon name={rolling ? "Loader" : "RotateCcw"} size={13} className={rolling ? "animate-spin" : ""} />
                              {rolling ? "Отправка команды..." : "Подтвердить откат"}
                            </button>
                            <button
                              onClick={() => setRollbackId(null)}
                              className="px-4 py-2 bg-white/5 text-gray-400 text-sm rounded-lg hover:bg-white/10 transition-colors"
                            >
                              Отмена
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── Подвал ── */}
        <div className="px-5 py-3 border-t border-blue-900/20 flex items-center justify-between">
          <div className="text-gray-600 text-[11px] flex items-center gap-1.5">
            <Icon name="Zap" size={10} className="text-[#34d399]" />
            Агент на ПК проверяет обновления каждые 30 сек
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white/5 text-gray-400 text-sm rounded-lg hover:bg-white/10 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Генерация Python-агента для скачивания ──────────────────────────────────
function generateAgentScript(): string {
  return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ECSU Agent — Агент автообновления для ПК
Версия: 2.0.5 | 20.05.2026
Сайт: поехали.dev

Запуск: python ecsu_agent.py
Требования: Python 3.10+  (pip install requests psutil)
"""
import os
import sys
import json
import time
import uuid
import socket
import logging
import platform
import subprocess
import threading
from datetime import datetime
from pathlib import Path

try:
    import requests
    import psutil
except ImportError:
    print("[ECSU] Устанавливаем зависимости...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "psutil", "-q"])
    import requests
    import psutil

# ─── Конфигурация ───────────────────────────────────────────────────────────
MUSON_URL   = "https://functions.poehali.dev/7bb30a16-64ef-48af-ae2a-132fc94893cd"
UPDATES_URL = "https://functions.poehali.dev/0639f989-669a-462c-aac5-7730ba2e2470"

HEARTBEAT_INTERVAL = 30   # секунд между пингами
UPDATE_CHECK_EVERY = 2    # проверять обновления каждые N пингов
LOCAL_PORT = 7749         # порт локального HTTP-сервера

AGENT_DIR  = Path(__file__).parent
CONFIG_DIR = AGENT_DIR / "ecsu_config"
UPDATES_DIR = AGENT_DIR / "ecsu_updates"
LOG_FILE   = AGENT_DIR / "ecsu_agent.log"

CONFIG_DIR.mkdir(exist_ok=True)
UPDATES_DIR.mkdir(exist_ok=True)

# ─── Логирование ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ]
)
log = logging.getLogger("ECSU")

# ─── Уникальный ID агента ───────────────────────────────────────────────────
ID_FILE = AGENT_DIR / "agent_id.txt"
if ID_FILE.exists():
    AGENT_ID = ID_FILE.read_text().strip()
else:
    AGENT_ID = "ecsu-" + str(uuid.uuid4())[:8]
    ID_FILE.write_text(AGENT_ID)
    log.info(f"Создан новый Agent ID: {AGENT_ID}")

STARTED_AT = datetime.now().isoformat()

# ─── Получение метрик ПК ────────────────────────────────────────────────────
def get_pc_metrics() -> dict:
    disk_d = {}
    for part in psutil.disk_partitions():
        if part.mountpoint in ("D:\\\\", "D:/", "/Volumes/D"):
            try:
                usage = psutil.disk_usage(part.mountpoint)
                disk_d = {
                    "total_gb": round(usage.total / 1e9, 1),
                    "used_gb":  round(usage.used  / 1e9, 1),
                    "free_gb":  round(usage.free  / 1e9, 1),
                    "percent":  usage.percent,
                }
            except Exception:
                pass
            break
    return {
        "hostname":    socket.gethostname(),
        "os":          platform.system() + " " + platform.release(),
        "cpu_percent": psutil.cpu_percent(interval=1),
        "ram_percent": psutil.virtual_memory().percent,
        "ram_total_gb": round(psutil.virtual_memory().total / 1e9, 1),
        "disk_d":      disk_d,
        "started_at":  STARTED_AT,
    }

def get_muson_files() -> dict:
    files = []
    muson_path = Path.home() / "Documents" / "МУСОН"
    if not muson_path.exists():
        muson_path = AGENT_DIR / "МУСОН"
        muson_path.mkdir(exist_ok=True)
    for f in list(muson_path.rglob("*"))[:200]:
        if f.is_file():
            try:
                files.append({
                    "name": f.name,
                    "path": str(f),
                    "size_kb": round(f.stat().st_size / 1024, 1),
                    "modified": datetime.fromtimestamp(f.stat().st_mtime).strftime("%Y-%m-%d %H:%M"),
                    "extension": f.suffix.lower(),
                })
            except Exception:
                pass
    return {"count": len(files), "files": files}

# ─── Применение обновлений ──────────────────────────────────────────────────
applied_ids = []

def apply_updates(updates: list) -> list:
    """Применяет список обновлений и возвращает ID применённых."""
    if not updates:
        return []
    new_ids = []
    for upd in updates:
        uid = upd.get("id")
        title = upd.get("title", "")
        utype = upd.get("update_type", "patch")
        payload = upd.get("payload", {})

        log.info(f"Применяю обновление #{uid}: [{utype}] {title}")

        try:
            # Сохраняем данные обновления в папку
            upd_file = UPDATES_DIR / f"update_{uid}_{utype}.json"
            with open(upd_file, "w", encoding="utf-8") as f:
                json.dump(upd, f, ensure_ascii=False, indent=2)

            # Если payload содержит конфиг — сохраняем отдельно
            if payload and utype == "config":
                cfg_file = CONFIG_DIR / f"config_{uid}.json"
                with open(cfg_file, "w", encoding="utf-8") as f:
                    json.dump(payload, f, ensure_ascii=False, indent=2)
                log.info(f"  Конфигурация сохранена: {cfg_file}")

            # Если есть exec-команды — выполняем безопасно
            if payload.get("exec_safe"):
                cmd = payload["exec_safe"]
                log.info(f"  Выполняю команду: {cmd}")
                subprocess.run(cmd, shell=True, timeout=30, capture_output=True)

            new_ids.append(uid)
            print(f"[ECSU] ✓ Обновление #{uid} применено: {title}")

        except Exception as e:
            log.error(f"Ошибка применения обновления #{uid}: {e}")

    return new_ids

# ─── Отчёт о применённых обновлениях ────────────────────────────────────────
def report_applied(update_ids: list, hostname: str):
    if not update_ids:
        return
    try:
        requests.post(UPDATES_URL, json={
            "action": "applied",
            "agent_id": AGENT_ID,
            "hostname": hostname,
            "update_ids": update_ids,
            "result": "ok",
        }, timeout=10)
        log.info(f"Отчёт отправлен: применено {len(update_ids)} обновлений")
    except Exception as e:
        log.warning(f"Не удалось отправить отчёт: {e}")

# ─── Получение файлов с сайта ───────────────────────────────────────────────
RECEIVED_DIR = AGENT_DIR / "ecsu_received"
RECEIVED_DIR.mkdir(exist_ok=True)

def check_and_download_files(hostname: str):
    """Проверяет и скачивает файлы отправленные с сайта."""
    try:
        r = requests.get(
            f"{UPDATES_URL}?action=files_pending&agent_id={AGENT_ID}",
            timeout=15
        )
        data = r.json()
        files = data.get("files", [])
        if not files:
            return

        log.info(f"[ФАЙЛЫ] Получено файлов для доставки: {len(files)}")
        received_ids = []

        for f in files:
            fid      = f.get("id")
            filename = f.get("filename", "file")
            content  = f.get("content_b64", "")
            dest     = f.get("dest_path", "").strip()
            ftype    = f.get("file_type", "document")

            try:
                import base64
                file_bytes = base64.b64decode(content) if content else b""

                # Определяем папку назначения
                if dest:
                    save_dir = Path(dest)
                elif ftype == "config":
                    save_dir = CONFIG_DIR
                elif ftype == "script":
                    save_dir = AGENT_DIR
                else:
                    save_dir = RECEIVED_DIR

                save_dir.mkdir(parents=True, exist_ok=True)
                save_path = save_dir / filename

                with open(save_path, "wb") as fp:
                    fp.write(file_bytes)

                log.info(f"  [ФАЙЛ] Сохранён: {save_path} ({len(file_bytes)} байт)")
                print(f"[ECSU] ✓ Получен файл: {filename} → {save_path}")
                received_ids.append(fid)

            except Exception as e:
                log.error(f"Ошибка сохранения файла #{fid} {filename}: {e}")

        # Подтверждаем получение
        if received_ids:
            requests.post(UPDATES_URL, json={
                "action": "file_received",
                "agent_id": AGENT_ID,
                "hostname": hostname,
                "file_ids": received_ids,
            }, timeout=10)
            log.info(f"[ФАЙЛЫ] Подтверждено получение {len(received_ids)} файлов")

    except Exception as e:
        log.debug(f"Проверка файлов: {e}")

# ─── Снапшоты и откат ───────────────────────────────────────────────────────
SNAPSHOTS_DIR = AGENT_DIR / "ecsu_snapshots"
SNAPSHOTS_DIR.mkdir(exist_ok=True)

def save_local_snapshot(tag: str = "auto") -> str:
    """Сохраняет локальный снапшот состояния ПК."""
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    snap_file = SNAPSHOTS_DIR / f"snap_{ts}_{tag}.json"
    state = {
        "saved_at": datetime.now().isoformat(),
        "agent_id": AGENT_ID,
        "tag": tag,
        "config_files": [str(f) for f in CONFIG_DIR.glob("*.json")],
        "update_files": [str(f) for f in UPDATES_DIR.glob("*.json")],
    }
    with open(snap_file, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)
    log.info(f"Локальный снапшот сохранён: {snap_file}")
    return str(snap_file)

def do_rollback_local(snapshot: dict) -> bool:
    """Выполняет откат по команде с сервера."""
    name = snapshot.get("name", "неизвестно")
    state = snapshot.get("state", {})
    log.info(f"[ОТКАТ] Начинаю откат к снапшоту: {name}")

    # Сохраняем текущее состояние перед откатом
    save_local_snapshot(tag="before_rollback")

    # Создаём резервную копию текущих конфигов
    backup_dir = AGENT_DIR / "ecsu_backup_before_rollback"
    backup_dir.mkdir(exist_ok=True)
    import shutil
    for cfg in CONFIG_DIR.glob("*.json"):
        shutil.copy2(cfg, backup_dir / cfg.name)

    # Если в state есть конфиги — восстанавливаем
    rollback_configs = state.get("configs", {})
    for cfg_name, cfg_data in rollback_configs.items():
        cfg_file = CONFIG_DIR / cfg_name
        with open(cfg_file, "w", encoding="utf-8") as f:
            json.dump(cfg_data, f, ensure_ascii=False, indent=2)
        log.info(f"  [ОТКАТ] Восстановлен конфиг: {cfg_name}")

    # Сохраняем лог отката
    rollback_log = AGENT_DIR / "rollback_history.json"
    history = []
    if rollback_log.exists():
        try:
            with open(rollback_log) as f:
                history = json.load(f)
        except Exception:
            pass
    history.append({
        "snapshot_id": snapshot.get("id"),
        "snapshot_name": name,
        "rolled_at": datetime.now().isoformat(),
        "result": "ok"
    })
    with open(rollback_log, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

    print(f"[ECSU] ✓ Откат выполнен: {name}")
    log.info(f"[ОТКАТ] Успешно выполнен откат к: {name}")
    return True

def check_rollback(hostname: str):
    """Проверяет наличие команды отката с сайта."""
    try:
        r = requests.get(
            f"{UPDATES_URL}?action=rollback_target&agent_id={AGENT_ID}",
            timeout=10
        )
        data = r.json()
        if data.get("has_rollback") and data.get("snapshot"):
            snap = data["snapshot"]
            log.info(f"[ОТКАТ] Получена команда отката: #{snap.get('id')} {snap.get('name')}")
            ok = do_rollback_local(snap)
            # Подтверждаем откат серверу
            requests.post(UPDATES_URL, json={
                "action": "rollback_done",
                "agent_id": AGENT_ID,
                "hostname": hostname,
                "snapshot_id": snap.get("id"),
                "result": "ok" if ok else "error",
            }, timeout=10)
    except Exception as e:
        log.debug(f"Проверка отката: {e}")

# ─── Основной цикл ──────────────────────────────────────────────────────────
def main_loop():
    ping_count = 0
    log.info(f"ECSU Agent запущен | ID: {AGENT_ID}")
    log.info(f"Сервер: {MUSON_URL}")
    print(f"""
╔══════════════════════════════════════════╗
║        ECSU Agent v2.0.5 запущен         ║
║  ID: {AGENT_ID:<33}  ║
║  Интервал: {HEARTBEAT_INTERVAL} сек                         ║
║  Порт:     {LOCAL_PORT}                          ║
╚══════════════════════════════════════════╝
""")

    while True:
        try:
            pc     = get_pc_metrics()
            muson  = get_muson_files()

            # Отправляем heartbeat и получаем очередь обновлений
            resp = requests.post(MUSON_URL, json={
                "agent_id": AGENT_ID,
                "pc":       pc,
                "muson":    muson,
            }, timeout=15)

            data = resp.json()
            updates = data.get("updates", [])

            if updates:
                log.info(f"Получено {len(updates)} новых обновлений с сайта")
                new_applied = apply_updates(updates)
                if new_applied:
                    report_applied(new_applied, pc["hostname"])
            else:
                if ping_count % 10 == 0:
                    log.info(f"Heartbeat #{ping_count} | CPU:{pc['cpu_percent']}% RAM:{pc['ram_percent']}% | Обновлений нет")

            # Проверяем команду отката (каждые 3 пинга)
            if ping_count % 3 == 0:
                check_rollback(pc["hostname"])

            # Проверяем файлы для доставки (каждые 2 пинга)
            if ping_count % 2 == 0:
                check_and_download_files(pc["hostname"])


        except requests.exceptions.ConnectionError:
            log.warning("Нет соединения с сервером ECSU. Повтор через 30 сек...")
        except Exception as e:
            log.error(f"Ошибка в главном цикле: {e}")

        ping_count += 1
        time.sleep(HEARTBEAT_INTERVAL)

# ─── Локальный HTTP-сервер для команд с сайта ───────────────────────────────
def local_server():
    """Принимает команды от сайта через localhost."""
    from http.server import HTTPServer, BaseHTTPRequestHandler

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass  # подавляем стандартный лог

        def do_GET(self):
            if self.path == "/ping":
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"pong": True, "agent_id": AGENT_ID}).encode())

        def do_POST(self):
            cors_headers = {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length) or "{}")

            if self.path == "/sync":
                self.send_response(200)
                for k, v in cors_headers.items():
                    self.send_header(k, v)
                self.end_headers()
                self.wfile.write(json.dumps({"ok": True}).encode())

            elif self.path == "/muson/open":
                muson_path = Path.home() / "Documents" / "МУСОН"
                muson_path.mkdir(exist_ok=True)
                try:
                    if platform.system() == "Windows":
                        os.startfile(str(muson_path))
                    elif platform.system() == "Darwin":
                        subprocess.Popen(["open", str(muson_path)])
                    else:
                        subprocess.Popen(["xdg-open", str(muson_path)])
                except Exception:
                    pass
                self.send_response(200)
                for k, v in cors_headers.items():
                    self.send_header(k, v)
                self.end_headers()
                self.wfile.write(json.dumps({"ok": True}).encode())

        def do_OPTIONS(self):
            self.send_response(200)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.end_headers()

    try:
        server = HTTPServer(("localhost", LOCAL_PORT), Handler)
        log.info(f"Локальный сервер запущен на порту {LOCAL_PORT}")
        server.serve_forever()
    except OSError:
        log.warning(f"Порт {LOCAL_PORT} занят — агент уже запущен или порт используется")

if __name__ == "__main__":
    # Запускаем локальный HTTP-сервер в фоне
    t = threading.Thread(target=local_server, daemon=True)
    t.start()
    # Основной цикл
    main_loop()
`;
}

function generateBatScript(): string {
  return `@echo off
chcp 65001 > nul
title ECSU Agent v2.0.5
echo.
echo  ╔═══════════════════════════════════════╗
echo  ║    ECSU Agent — Запуск агента ECSU    ║
echo  ╚═══════════════════════════════════════╝
echo.

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ОШИБКА] Python не установлен!
    echo Скачайте Python с https://python.org/downloads
    echo Убедитесь что отметили "Add to PATH" при установке
    pause
    exit /b 1
)

echo [OK] Python найден
echo [..] Запускаем ECSU Agent...
echo.

python "%~dp0ecsu_agent.py"

if %errorlevel% neq 0 (
    echo.
    echo [ОШИБКА] Агент завершился с ошибкой
    pause
)
`;
}

export default EcsuUpdateManager;