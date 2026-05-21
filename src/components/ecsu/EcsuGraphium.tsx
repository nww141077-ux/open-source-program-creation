import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/4e0c6e94-8c17-42df-a63e-dad5579bf7cf";

type NoteType = "note" | "task" | "secret" | "log" | "config";
type NoteColor = "default" | "blue" | "green" | "yellow" | "red" | "purple";

interface Note {
  id: number;
  title: string;
  content: string;
  note_type: NoteType;
  tags: string[];
  color: NoteColor;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

const TYPE_META: Record<NoteType, { label: string; icon: string; color: string }> = {
  note:   { label: "Заметка",       icon: "FileText",   color: "#94a3b8" },
  task:   { label: "Задача",        icon: "CheckSquare", color: "#60a5fa" },
  secret: { label: "Секрет",        icon: "Lock",       color: "#f97316" },
  log:    { label: "Лог",           icon: "Terminal",   color: "#34d399" },
  config: { label: "Конфигурация",  icon: "Settings",   color: "#a78bfa" },
};

const COLOR_MAP: Record<NoteColor, { bg: string; border: string; dot: string }> = {
  default: { bg: "#0d1225",   border: "#1e2d4a",  dot: "#475569" },
  blue:    { bg: "#0a1929",   border: "#1e3a5f",  dot: "#60a5fa" },
  green:   { bg: "#0a1f14",   border: "#1a3d2e",  dot: "#34d399" },
  yellow:  { bg: "#1a1400",   border: "#3d3000",  dot: "#fbbf24" },
  red:     { bg: "#1a0a0a",   border: "#3d1520",  dot: "#e94560" },
  purple:  { bg: "#12081f",   border: "#2d1f4a",  dot: "#a78bfa" },
};

const COLORS: NoteColor[] = ["default", "blue", "green", "yellow", "red", "purple"];

const EcsuGraphium = () => {
  const [notes, setNotes]         = useState<Note[]>([]);
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState<"grid" | "list">("grid");
  const [editNote, setEditNote]   = useState<Note | null>(null);
  const [creating, setCreating]   = useState(false);
  const [search, setSearch]       = useState("");
  const [filterType, setFilterType] = useState<NoteType | "">("");
  const [showArchive, setShowArchive] = useState(false);
  const [saving, setSaving]       = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const emptyForm = (): Partial<Note> => ({
    title: "", content: "", note_type: "note",
    color: "default", tags: [], is_pinned: false,
  });
  const [form, setForm] = useState<Partial<Note>>(emptyForm());

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ archived: String(showArchive) });
      if (filterType) params.set("type", filterType);
      if (search)     params.set("q", search);
      const r = await fetch(`${API}?${params}`);
      const d = await r.json();
      setNotes(d.notes || []);
    } catch { /* нет связи */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [showArchive, filterType]);

  const save = async () => {
    setSaving(true);
    try {
      if (editNote) {
        await fetch(API, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editNote.id, ...form }),
        });
      } else {
        await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      setEditNote(null);
      setCreating(false);
      setForm(emptyForm());
      await load();
    } catch { /* ошибка */ }
    setSaving(false);
  };

  const deleteNote = async (id: number) => {
    if (!confirm("Удалить заметку?")) return;
    await fetch(API, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const togglePin = async (note: Note) => {
    await fetch(API, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: note.id, is_pinned: !note.is_pinned }),
    });
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, is_pinned: !n.is_pinned } : n));
  };

  const archiveNote = async (note: Note) => {
    await fetch(API, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: note.id, is_archived: true }),
    });
    setNotes(prev => prev.filter(n => n.id !== note.id));
  };

  const openEdit = (note: Note) => {
    setEditNote(note);
    setCreating(true);
    setForm({
      title: note.title, content: note.content,
      note_type: note.note_type, color: note.color,
      tags: note.tags, is_pinned: note.is_pinned,
    });
    setTimeout(() => textRef.current?.focus(), 50);
  };

  const openCreate = () => {
    setEditNote(null);
    setCreating(true);
    setForm(emptyForm());
    setTimeout(() => textRef.current?.focus(), 50);
  };

  const cancelEdit = () => {
    setCreating(false);
    setEditNote(null);
    setForm(emptyForm());
  };

  const filteredNotes = notes.filter(n =>
    !search || n.title?.toLowerCase().includes(search.toLowerCase()) ||
    n.content?.toLowerCase().includes(search.toLowerCase())
  );

  const pinned   = filteredNotes.filter(n => n.is_pinned);
  const unpinned = filteredNotes.filter(n => !n.is_pinned);

  const formatDate = (iso: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  const NoteCard = ({ note }: { note: Note }) => {
    const cm = COLOR_MAP[note.color] || COLOR_MAP.default;
    const tm = TYPE_META[note.note_type] || TYPE_META.note;
    return (
      <div
        className={`rounded-xl border p-3 flex flex-col gap-2 cursor-pointer transition-all hover:brightness-110 group relative ${view === "list" ? "flex-row items-start" : ""}`}
        style={{ background: cm.bg, borderColor: cm.border }}
        onClick={() => openEdit(note)}
      >
        {/* Цветная полоска */}
        <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full" style={{ background: cm.dot }} />

        <div className={`flex items-start justify-between gap-2 ${view === "list" ? "flex-1" : ""}`}>
          <div className="flex-1 min-w-0 pl-2">
            <div className="flex items-center gap-1.5 mb-1">
              <div style={{ color: tm.color }}>
                <Icon name={tm.icon} size={11} />
              </div>
              {note.is_pinned && <Icon name="Pin" size={10} className="text-yellow-400" />}
              <span className="text-white font-semibold text-xs truncate">
                {note.title || <span className="text-gray-600 italic">Без названия</span>}
              </span>
            </div>
            {note.content && (
              <div className="text-gray-400 text-[11px] leading-relaxed line-clamp-3 whitespace-pre-wrap">
                {note.content}
              </div>
            )}
            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {note.tags.slice(0, 4).map(tag => (
                  <span key={tag} className="text-[9px] bg-white/5 text-gray-500 px-1.5 py-0.5 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-gray-600 text-[10px]">{formatDate(note.updated_at)}</span>
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <button onClick={() => togglePin(note)} title={note.is_pinned ? "Открепить" : "Закрепить"}
              className="p-1 text-gray-600 hover:text-yellow-400 transition-colors">
              <Icon name="Pin" size={11} />
            </button>
            <button onClick={() => archiveNote(note)} title="В архив"
              className="p-1 text-gray-600 hover:text-blue-400 transition-colors">
              <Icon name="Archive" size={11} />
            </button>
            <button onClick={() => deleteNote(note.id)} title="Удалить"
              className="p-1 text-gray-600 hover:text-red-400 transition-colors">
              <Icon name="Trash2" size={11} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#080c1a]">

      {/* ── Шапка ── */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-blue-900/20">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-700 rounded-xl flex items-center justify-center shrink-0">
          <Icon name="BookOpen" size={15} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="text-white font-bold text-sm">Графиум</div>
          <div className="text-gray-500 text-[10px]">Блокнот · заметки, задачи, конфигурации</div>
        </div>

        {/* Поиск */}
        <div className="flex items-center gap-2 bg-[#0d1225] border border-blue-900/30 rounded-lg px-3 py-1.5">
          <Icon name="Search" size={12} className="text-gray-600" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); load(); }}
            placeholder="Поиск заметок..."
            className="bg-transparent text-white text-xs focus:outline-none w-40 placeholder-gray-600"
          />
          {search && (
            <button onClick={() => { setSearch(""); load(); }} className="text-gray-600 hover:text-gray-400">
              <Icon name="X" size={10} />
            </button>
          )}
        </div>

        {/* Фильтр по типу */}
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as NoteType | "")}
          className="bg-[#0d1225] border border-blue-900/30 text-gray-400 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
        >
          <option value="">Все типы</option>
          {(Object.keys(TYPE_META) as NoteType[]).map(t => (
            <option key={t} value={t}>{TYPE_META[t].label}</option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <button onClick={() => setView("grid")} className={`p-1.5 rounded transition-colors ${view === "grid" ? "text-white bg-blue-900/40" : "text-gray-600 hover:text-gray-400"}`}>
            <Icon name="Grid" size={14} />
          </button>
          <button onClick={() => setView("list")} className={`p-1.5 rounded transition-colors ${view === "list" ? "text-white bg-blue-900/40" : "text-gray-600 hover:text-gray-400"}`}>
            <Icon name="List" size={14} />
          </button>
        </div>

        <button
          onClick={() => setShowArchive(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${showArchive ? "bg-blue-900/40 text-blue-400" : "bg-white/5 text-gray-500 hover:text-gray-300"}`}
        >
          <Icon name="Archive" size={12} />
          {showArchive ? "Архив" : "Архив"}
        </button>

        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-700/80 hover:bg-purple-600 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Icon name="Plus" size={13} />
          Создать
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Панель редактора (слева если открыт) ── */}
        {creating && (
          <div className="w-80 border-r border-blue-900/20 flex flex-col bg-[#0a0f1e]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-blue-900/20">
              <span className="text-white text-sm font-semibold">
                {editNote ? "Редактировать" : "Новая заметка"}
              </span>
              <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-300 transition-colors">
                <Icon name="X" size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <input
                value={form.title || ""}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Заголовок"
                className="w-full bg-[#060d1f] border border-blue-900/30 text-white rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-purple-500/50 placeholder-gray-600"
              />

              <textarea
                ref={textRef}
                value={form.content || ""}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Содержимое заметки..."
                rows={10}
                className="w-full bg-[#060d1f] border border-blue-900/30 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500/50 placeholder-gray-600 resize-none leading-relaxed font-mono"
              />

              {/* Тип */}
              <div>
                <div className="text-gray-500 text-[10px] mb-1.5">Тип заметки</div>
                <div className="grid grid-cols-3 gap-1">
                  {(Object.keys(TYPE_META) as NoteType[]).map(t => {
                    const tm = TYPE_META[t];
                    const active = form.note_type === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setForm(f => ({ ...f, note_type: t }))}
                        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all border ${
                          active ? "border-purple-500/50 bg-purple-900/30" : "border-white/5 bg-white/3 hover:bg-white/5"
                        }`}
                        style={{ color: active ? tm.color : "#6b7280" }}
                      >
                        <Icon name={tm.icon} size={11} style={{ color: active ? tm.color : "#6b7280" }} />
                        {tm.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Цвет */}
              <div>
                <div className="text-gray-500 text-[10px] mb-1.5">Цвет</div>
                <div className="flex gap-1.5">
                  {COLORS.map(c => {
                    const cm = COLOR_MAP[c];
                    return (
                      <button
                        key={c}
                        onClick={() => setForm(f => ({ ...f, color: c }))}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${form.color === c ? "scale-125" : "hover:scale-110"}`}
                        style={{ background: cm.dot, borderColor: form.color === c ? "#fff" : "transparent" }}
                        title={c}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Теги */}
              <div>
                <div className="text-gray-500 text-[10px] mb-1">Теги (через запятую)</div>
                <input
                  value={(form.tags || []).join(", ")}
                  onChange={e => setForm(f => ({
                    ...f,
                    tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean),
                  }))}
                  placeholder="срочно, важно, система"
                  className="w-full bg-[#060d1f] border border-blue-900/30 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-purple-500/50 placeholder-gray-600"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_pinned || false}
                  onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))}
                  className="accent-purple-500"
                />
                <span className="text-gray-400 text-xs">Закрепить наверху</span>
              </label>
            </div>

            <div className="px-4 py-3 border-t border-blue-900/20 flex gap-2">
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <Icon name={saving ? "Loader" : "Save"} size={14} className={saving ? "animate-spin" : ""} />
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
              <button onClick={cancelEdit} className="px-4 py-2 bg-white/5 text-gray-400 text-sm rounded-lg hover:bg-white/10 transition-colors">
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* ── Список заметок ── */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm py-12">
              <Icon name="Loader" size={16} className="animate-spin" />
              Загрузка...
            </div>
          )}

          {!loading && filteredNotes.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-900/20 flex items-center justify-center">
                <Icon name="BookOpen" size={28} className="text-purple-600/50" />
              </div>
              <div>
                <div className="text-gray-400 text-sm font-medium">
                  {showArchive ? "Архив пуст" : "Заметок пока нет"}
                </div>
                <div className="text-gray-600 text-xs mt-1">
                  {showArchive ? "Заархивированные заметки появятся здесь" : "Нажмите «Создать» чтобы добавить заметку"}
                </div>
              </div>
              {!showArchive && (
                <button onClick={openCreate} className="px-4 py-2 bg-purple-700/60 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors">
                  Создать первую заметку
                </button>
              )}
            </div>
          )}

          {pinned.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Pin" size={11} className="text-yellow-500" />
                <span className="text-yellow-500/70 text-[10px] font-semibold uppercase tracking-wider">Закреплённые</span>
              </div>
              <div className={view === "grid"
                ? "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                : "space-y-2"}>
                {pinned.map(n => <NoteCard key={n.id} note={n} />)}
              </div>
            </div>
          )}

          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-600 text-[10px] font-semibold uppercase tracking-wider">Остальные</span>
                </div>
              )}
              <div className={view === "grid"
                ? "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                : "space-y-2"}>
                {unpinned.map(n => <NoteCard key={n.id} note={n} />)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Статус-бар */}
      <div className="px-5 py-2 border-t border-blue-900/20 flex items-center justify-between">
        <span className="text-gray-600 text-[10px]">
          Всего: {notes.length} заметок · {notes.filter(n => n.is_pinned).length} закреплено
        </span>
        <button onClick={load} className="text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1 text-[10px]">
          <Icon name="RefreshCw" size={10} />
          Обновить
        </button>
      </div>
    </div>
  );
};

export default EcsuGraphium;
