import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/bb585f44-133a-4c40-b917-d5573c2b5eb4";

// ─── Типы ─────────────────────────────────────────────────────────────────────
interface Note {
  id: number;
  title: string;
  content: string;
  note_type: string;
  tags: string[];
  color: string;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

type FilterMode = "all" | "pinned" | "archived";
type NoteType = "note" | "idea" | "task" | "legal" | "incident";
type NoteColor = "default" | "purple" | "green" | "blue" | "red" | "yellow";

// ─── Вспомогательные ──────────────────────────────────────────────────────────
function parse(d: unknown) {
  if (typeof d === "string") { try { return JSON.parse(d); } catch { return d; } }
  return d;
}

function fmtDate(s: string) {
  try {
    return new Date(s).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch { return s; }
}

// ─── Конфиг цветов ────────────────────────────────────────────────────────────
const NOTE_COLORS: Record<NoteColor, { border: string; bg: string; label: string }> = {
  default: { border: "rgba(255,255,255,0.10)", bg: "rgba(255,255,255,0.04)", label: "По умолчанию" },
  purple:  { border: "rgba(168,85,247,0.40)",  bg: "rgba(168,85,247,0.08)",  label: "Фиолетовый" },
  green:   { border: "rgba(34,197,94,0.40)",   bg: "rgba(34,197,94,0.08)",   label: "Зелёный" },
  blue:    { border: "rgba(59,130,246,0.40)",  bg: "rgba(59,130,246,0.08)",  label: "Синий" },
  red:     { border: "rgba(244,63,94,0.40)",   bg: "rgba(244,63,94,0.08)",   label: "Красный" },
  yellow:  { border: "rgba(234,179,8,0.40)",   bg: "rgba(234,179,8,0.08)",   label: "Жёлтый" },
};

const COLOR_DOTS: Record<NoteColor, string> = {
  default: "#6b7280",
  purple:  "#a855f7",
  green:   "#22c55e",
  blue:    "#3b82f6",
  red:     "#f43f5e",
  yellow:  "#eab308",
};

// ─── Конфиг типов заметок ─────────────────────────────────────────────────────
const NOTE_TYPES: { value: NoteType; label: string; icon: string; color: string }[] = [
  { value: "note",     label: "Заметка",  icon: "FileText",    color: "#a855f7" },
  { value: "idea",     label: "Идея",     icon: "Lightbulb",   color: "#eab308" },
  { value: "task",     label: "Задача",   icon: "CheckSquare", color: "#22c55e" },
  { value: "legal",    label: "Правовое", icon: "Scale",       color: "#3b82f6" },
  { value: "incident", label: "Инцидент", icon: "AlertTriangle",color: "#f43f5e" },
];

const TYPE_MAP = Object.fromEntries(NOTE_TYPES.map(t => [t.value, t]));

const EMPTY_FORM = {
  title: "",
  content: "",
  note_type: "note" as NoteType,
  color: "default" as NoteColor,
  is_pinned: false,
};

// ─── Компонент ────────────────────────────────────────────────────────────────
export default function EgsuGraphium() {
  const navigate = useNavigate();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [search, setSearch] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  // ── Загрузка заметок ────────────────────────────────────────────────────────
  const load = useCallback(async (archived = false) => {
    setLoading(true);
    try {
      const url = archived ? `${API}?archived=true` : API;
      const data = await fetch(url).then(r => r.json()).then(parse).catch(() => []);
      setNotes(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (filter === "archived") {
      load(true);
    } else {
      load(false);
    }
    setSelectedId(null);
    setIsNew(false);
  }, [filter, load]);

  // ── Выбор заметки ───────────────────────────────────────────────────────────
  const selectNote = (note: Note) => {
    setIsNew(false);
    setSelectedId(note.id);
    setForm({
      title: note.title,
      content: note.content,
      note_type: note.note_type as NoteType,
      color: note.color as NoteColor,
      is_pinned: note.is_pinned,
    });
  };

  // ── Новая запись ────────────────────────────────────────────────────────────
  const newNote = () => {
    setIsNew(true);
    setSelectedId(null);
    setForm({ ...EMPTY_FORM });
  };

  // ── Сохранение ──────────────────────────────────────────────────────────────
  const save = async () => {
    if (!form.title.trim()) { showToast("Введите заголовок"); return; }
    setSaving(true);
    try {
      if (isNew) {
        const r = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const d = parse(await r.json()) as Note;
        showToast("✓ Заметка создана");
        await load(filter === "archived");
        if (d?.id) {
          setIsNew(false);
          setSelectedId(d.id);
        }
      } else if (selectedId) {
        await fetch(`${API}/${selectedId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        showToast("✓ Сохранено");
        await load(filter === "archived");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Архивирование ───────────────────────────────────────────────────────────
  const archive = async (id: number) => {
    setSaving(true);
    try {
      await fetch(`${API}/${id}`, { method: "DELETE" });
      showToast("✓ Заметка архивирована");
      setSelectedId(null);
      setIsNew(false);
      await load(filter === "archived");
    } finally {
      setSaving(false);
    }
  };

  // ── Фильтрация списка ───────────────────────────────────────────────────────
  const visibleNotes = notes.filter(n => {
    if (filter === "pinned" && !n.is_pinned) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    }
    return true;
  });

  const selectedNote = notes.find(n => n.id === selectedId) ?? null;
  const hasEditor = isNew || selectedId !== null;

  // ── Цвета ───────────────────────────────────────────────────────────────────
  const getCardBg  = (c: string) => NOTE_COLORS[c as NoteColor]?.bg   ?? NOTE_COLORS.default.bg;
  const getCardBrd = (c: string) => NOTE_COLORS[c as NoteColor]?.border ?? NOTE_COLORS.default.border;

  // ─── Рендер ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e2e8f0", fontFamily: "Inter, sans-serif" }}>

      {/* ШАПКА */}
      <div style={{
        background: "rgba(10,10,15,0.95)",
        borderBottom: "1px solid rgba(168,85,247,0.20)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 8, padding: "6px 12px", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, transition: "all 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          >
            <Icon name="ArrowLeft" size={15} />
            Назад
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #a855f7, #7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="BookOpen" size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9", letterSpacing: "-0.3px" }}>Графиум</div>
              <div style={{ fontSize: 11, color: "#a855f7", marginTop: -2 }}>ECSU 2.0 · Блокнот</div>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Поиск */}
          <div style={{ position: "relative" }}>
            <Icon name="Search" size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск..."
              style={{
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, padding: "7px 12px 7px 32px", color: "#e2e8f0", fontSize: 13,
                outline: "none", width: 200,
              }}
            />
          </div>

          {/* Кнопка новой записи */}
          <button
            onClick={newNote}
            style={{
              background: "linear-gradient(135deg, #a855f7, #7c3aed)",
              border: "none", borderRadius: 8, padding: "8px 16px",
              color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              fontSize: 13, fontWeight: 600, transition: "opacity 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            <Icon name="Plus" size={15} />
            Новая запись
          </button>
        </div>
      </div>

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px", display: "flex", gap: 20, alignItems: "flex-start" }}>

        {/* ЛЕВАЯ ПАНЕЛЬ — список */}
        <div style={{ width: 300, flexShrink: 0 }}>

          {/* Фильтры */}
          <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 4 }}>
            {(["all", "pinned", "archived"] as FilterMode[]).map(f => {
              const labels: Record<FilterMode, string> = { all: "Все", pinned: "Закреплённые", archived: "Архив" };
              const icons: Record<FilterMode, string> = { all: "List", pinned: "Pin", archived: "Archive" };
              const active = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    flex: 1, border: "none", borderRadius: 7, padding: "6px 4px",
                    background: active ? "linear-gradient(135deg, #a855f7, #7c3aed)" : "transparent",
                    color: active ? "#fff" : "#64748b",
                    cursor: "pointer", fontSize: 11, fontWeight: active ? 600 : 400,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                    transition: "all 0.2s",
                  }}
                >
                  <Icon name={icons[f]} size={12} />
                  {labels[f]}
                </button>
              );
            })}
          </div>

          {/* Счётчик */}
          <div style={{ fontSize: 11, color: "#475569", marginBottom: 10, paddingLeft: 2 }}>
            {loading ? "Загрузка..." : `${visibleNotes.length} заметок`}
          </div>

          {/* Список карточек */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {visibleNotes.length === 0 && !loading && (
              <div style={{ textAlign: "center", color: "#475569", padding: "40px 0", fontSize: 13 }}>
                <Icon name="BookOpen" size={32} color="#334155" style={{ display: "block", margin: "0 auto 10px" }} />
                {search ? "Ничего не найдено" : filter === "archived" ? "Архив пуст" : "Нет заметок"}
              </div>
            )}

            {visibleNotes.map(note => {
              const isActive = note.id === selectedId;
              const typeInfo = TYPE_MAP[note.note_type] ?? TYPE_MAP.note;
              const cardBg  = isActive ? "rgba(168,85,247,0.12)" : getCardBg(note.color);
              const cardBrd = isActive ? "rgba(168,85,247,0.50)" : getCardBrd(note.color);

              return (
                <div
                  key={note.id}
                  onClick={() => selectNote(note)}
                  style={{
                    background: cardBg,
                    border: `1px solid ${cardBrd}`,
                    borderRadius: 10, padding: "10px 12px",
                    cursor: "pointer", transition: "all 0.18s",
                    position: "relative",
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = cardBg; }}
                >
                  {/* Тип + закреп */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                    <Icon name={typeInfo.icon} size={11} color={typeInfo.color} />
                    <span style={{ fontSize: 10, color: typeInfo.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {typeInfo.label}
                    </span>
                    {note.is_pinned && (
                      <span style={{ marginLeft: "auto" }}>
                        <Icon name="Pin" size={10} color="#a855f7" />
                      </span>
                    )}
                  </div>

                  {/* Заголовок */}
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", marginBottom: 4, lineHeight: 1.3,
                    overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {note.title || "Без названия"}
                  </div>

                  {/* Превью контента */}
                  {note.content && (
                    <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4,
                      overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", marginBottom: 6 }}>
                      {note.content}
                    </div>
                  )}

                  {/* Дата + цветная точка */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: "#475569" }}>{fmtDate(note.updated_at)}</span>
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: COLOR_DOTS[note.color as NoteColor] ?? COLOR_DOTS.default,
                      display: "inline-block", flexShrink: 0,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ПРАВАЯ ПАНЕЛЬ — редактор */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!hasEditor ? (
            // Заглушка
            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)",
              borderRadius: 16, padding: "80px 40px", textAlign: "center",
            }}>
              <Icon name="BookOpen" size={48} color="#334155" style={{ display: "block", margin: "0 auto 16px" }} />
              <div style={{ fontSize: 16, color: "#475569", fontWeight: 600, marginBottom: 8 }}>Выберите заметку</div>
              <div style={{ fontSize: 13, color: "#334155" }}>или нажмите «Новая запись» для создания</div>
            </div>
          ) : (
            <div style={{
              background: NOTE_COLORS[form.color]?.bg ?? NOTE_COLORS.default.bg,
              border: `1px solid ${NOTE_COLORS[form.color]?.border ?? NOTE_COLORS.default.border}`,
              borderRadius: 16, padding: "24px",
              transition: "border-color 0.2s, background 0.2s",
            }}>

              {/* Строка типов */}
              <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                {NOTE_TYPES.map(t => {
                  const active = form.note_type === t.value;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setForm(f => ({ ...f, note_type: t.value }))}
                      style={{
                        border: `1px solid ${active ? t.color : "rgba(255,255,255,0.08)"}`,
                        borderRadius: 8, padding: "5px 12px",
                        background: active ? `${t.color}22` : "transparent",
                        color: active ? t.color : "#64748b",
                        cursor: "pointer", fontSize: 12, fontWeight: active ? 600 : 400,
                        display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s",
                      }}
                    >
                      <Icon name={t.icon} size={12} />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Заголовок */}
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Заголовок заметки..."
                style={{
                  width: "100%", background: "transparent",
                  border: "none", borderBottom: "1px solid rgba(255,255,255,0.08)",
                  color: "#f1f5f9", fontSize: 22, fontWeight: 700,
                  padding: "0 0 12px", marginBottom: 20,
                  outline: "none", boxSizing: "border-box",
                }}
              />

              {/* Контент */}
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Начните писать..."
                rows={16}
                style={{
                  width: "100%", background: "rgba(0,0,0,0.15)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 10, color: "#cbd5e1", fontSize: 14,
                  padding: "14px 16px", outline: "none", resize: "vertical",
                  lineHeight: 1.7, fontFamily: "inherit", boxSizing: "border-box",
                  marginBottom: 20,
                }}
              />

              {/* Нижняя строка опций */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>

                {/* Выбор цвета */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Цвет:</span>
                  <div style={{ display: "flex", gap: 5 }}>
                    {(Object.keys(NOTE_COLORS) as NoteColor[]).map(c => (
                      <button
                        key={c}
                        title={NOTE_COLORS[c].label}
                        onClick={() => setForm(f => ({ ...f, color: c }))}
                        style={{
                          width: 18, height: 18, borderRadius: "50%",
                          background: COLOR_DOTS[c],
                          border: form.color === c ? "2px solid #fff" : "2px solid transparent",
                          cursor: "pointer", padding: 0,
                          transition: "border 0.15s",
                          outline: "none",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Закрепить */}
                <button
                  onClick={() => setForm(f => ({ ...f, is_pinned: !f.is_pinned }))}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: form.is_pinned ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${form.is_pinned ? "rgba(168,85,247,0.40)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 8, padding: "6px 12px",
                    color: form.is_pinned ? "#a855f7" : "#64748b",
                    cursor: "pointer", fontSize: 12, fontWeight: form.is_pinned ? 600 : 400,
                    transition: "all 0.15s",
                  }}
                >
                  <Icon name="Pin" size={13} />
                  {form.is_pinned ? "Закреплено" : "Закрепить"}
                </button>

                <div style={{ flex: 1 }} />

                {/* Архивировать */}
                {selectedNote && !selectedNote.is_archived && (
                  <button
                    onClick={() => selectedId && archive(selectedId)}
                    disabled={saving}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: "rgba(244,63,94,0.08)",
                      border: "1px solid rgba(244,63,94,0.20)",
                      borderRadius: 8, padding: "7px 14px",
                      color: "#f43f5e", cursor: "pointer", fontSize: 13,
                      opacity: saving ? 0.6 : 1, transition: "all 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(244,63,94,0.15)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(244,63,94,0.08)")}
                  >
                    <Icon name="Archive" size={14} />
                    Архивировать
                  </button>
                )}

                {/* Сохранить */}
                <button
                  onClick={save}
                  disabled={saving}
                  style={{
                    background: saving ? "rgba(168,85,247,0.40)" : "linear-gradient(135deg, #a855f7, #7c3aed)",
                    border: "none", borderRadius: 8, padding: "8px 20px",
                    color: "#fff", cursor: saving ? "not-allowed" : "pointer",
                    fontSize: 13, fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 6,
                    transition: "opacity 0.2s",
                  }}
                >
                  <Icon name={saving ? "Loader" : "Save"} size={14} />
                  {saving ? "Сохранение..." : isNew ? "Создать" : "Сохранить"}
                </button>
              </div>

              {/* Мета — дата обновления */}
              {selectedNote && (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 16 }}>
                  <span style={{ fontSize: 11, color: "#334155" }}>
                    Создано: <span style={{ color: "#475569" }}>{fmtDate(selectedNote.created_at)}</span>
                  </span>
                  <span style={{ fontSize: 11, color: "#334155" }}>
                    Изменено: <span style={{ color: "#475569" }}>{fmtDate(selectedNote.updated_at)}</span>
                  </span>
                  <span style={{ fontSize: 11, color: "#334155" }}>
                    ID: <span style={{ color: "#475569" }}>#{selectedNote.id}</span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ТОСТ */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          background: "linear-gradient(135deg, #1e1b4b, #2d1b69)",
          border: "1px solid rgba(168,85,247,0.40)",
          borderRadius: 12, padding: "12px 20px",
          color: "#e2e8f0", fontSize: 13, fontWeight: 500,
          boxShadow: "0 8px 32px rgba(168,85,247,0.25)",
          display: "flex", alignItems: "center", gap: 8,
          animation: "fadeIn 0.3s ease",
        }}>
          <Icon name="CheckCircle" size={15} color="#a855f7" />
          {toast}
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        input::placeholder { color: #475569; }
        textarea::placeholder { color: #475569; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.25); border-radius: 3px; }
      `}</style>
    </div>
  );
}
