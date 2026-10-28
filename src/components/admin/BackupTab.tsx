import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const BACKUP_URL = "https://functions.poehali.dev/b98bd499-c703-43f7-a948-a79106a3d313";

interface Backup {
  id: number;
  label: string;
  modules_count: number;
  note: string;
  created_at: string;
}

const BackupTab = () => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newNote, setNewNote] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`${BACKUP_URL}?action=list`)
      .then((r) => r.json())
      .then((data) => {
        setBackups(data);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const showMsg = (text: string, ok: boolean) => {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 3000);
  };

  const create = async () => {
    setCreating(true);
    const res = await fetch(`${BACKUP_URL}?action=create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: newLabel || undefined,
        note: newNote,
      }),
    });
    const data = await res.json();
    setCreating(false);
    setNewLabel("");
    setNewNote("");
    setShowForm(false);
    if (data.ok) {
      showMsg(`Точка восстановления "${data.label}" создана`, true);
      load();
    }
  };

  const restore = async (backup: Backup) => {
    if (!window.confirm(`Восстановить систему из точки "${backup.label}"?\nВсе текущие настройки будут заменены.`)) return;
    setRestoring(backup.id);
    const res = await fetch(`${BACKUP_URL}?action=restore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: backup.id }),
    });
    const data = await res.json();
    setRestoring(null);
    showMsg(data.ok ? "Система восстановлена" : "Ошибка восстановления", !!data.ok);
  };

  const remove = async (backup: Backup) => {
    if (!window.confirm(`Удалить точку "${backup.label}"?`)) return;
    setDeleting(backup.id);
    await fetch(`${BACKUP_URL}?action=delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: backup.id }),
    });
    setDeleting(null);
    load();
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <Icon name="ArchiveRestore" size={20} className="text-[#e94560]" />
        Восстановление системы
      </h2>
      <p className="text-gray-500 text-sm mb-6">
        Создавайте точки восстановления перед важными изменениями. Откатитесь к любой сохранённой конфигурации.
      </p>

      {/* Сообщение */}
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
          message.ok ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
        }`}>
          <Icon name={message.ok ? "CheckCircle" : "XCircle"} size={16} />
          {message.text}
        </div>
      )}

      {/* Кнопка создания */}
      <div className="mb-5">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#e94560] hover:bg-[#c73550] text-white px-5 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Icon name="Plus" size={16} />
            Создать точку восстановления
          </button>
        ) : (
          <div className="bg-[#1a1a2e] rounded-xl border border-[#e94560]/20 p-5 space-y-3">
            <div className="text-white font-medium">Новая точка восстановления</div>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Название (необязательно)"
              className="w-full bg-[#0d0d1a] border border-[#e94560]/20 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#e94560] placeholder-gray-600"
            />
            <input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Комментарий (необязательно)"
              className="w-full bg-[#0d0d1a] border border-[#e94560]/20 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#e94560] placeholder-gray-600"
            />
            <div className="flex gap-2">
              <button
                onClick={create}
                disabled={creating}
                className="bg-[#e94560] hover:bg-[#c73550] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {creating ? <><Icon name="Loader2" size={14} className="animate-spin" /> Создаю...</> : "Создать"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Список точек */}
      {loading ? (
        <div className="text-gray-500 animate-pulse">Загрузка...</div>
      ) : backups.length === 0 ? (
        <div className="bg-[#1a1a2e] rounded-xl border border-[#e94560]/10 p-8 text-center text-gray-600">
          <Icon name="Archive" size={32} className="mx-auto mb-3 opacity-30" />
          <div>Точек восстановления пока нет</div>
        </div>
      ) : (
        <div className="space-y-3">
          {backups.map((b) => (
            <div
              key={b.id}
              className="bg-[#1a1a2e] rounded-xl border border-[#e94560]/10 px-5 py-4 flex items-center justify-between"
            >
              <div>
                <div className="text-white font-medium">{b.label}</div>
                <div className="text-gray-500 text-xs mt-0.5 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Icon name="Clock" size={12} />
                    {formatDate(b.created_at)}
                  </span>
                  {b.modules_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Icon name="LayoutGrid" size={12} />
                      {b.modules_count} модулей
                    </span>
                  )}
                </div>
                {b.note && <div className="text-gray-600 text-xs mt-1">{b.note}</div>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => restore(b)}
                  disabled={restoring === b.id}
                  className="text-sm text-[#e94560] hover:text-white border border-[#e94560]/30 hover:border-[#e94560] px-3 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {restoring === b.id ? (
                    <Icon name="Loader2" size={14} className="animate-spin" />
                  ) : (
                    <><Icon name="RotateCcw" size={14} /> Восстановить</>
                  )}
                </button>
                <button
                  onClick={() => remove(b)}
                  disabled={deleting === b.id}
                  className="text-gray-600 hover:text-red-400 p-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting === b.id ? (
                    <Icon name="Loader2" size={14} className="animate-spin" />
                  ) : (
                    <Icon name="Trash2" size={14} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BackupTab;
