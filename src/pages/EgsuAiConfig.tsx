import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const S = {
  bg: "linear-gradient(135deg, #060a12 0%, #0b1420 100%)",
  card: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.07)",
  accent: "#00c864",
  danger: "#f43f5e",
  warn: "#f59e0b",
  text: "#fff",
  muted: "rgba(255,255,255,0.35)",
};

type FileKey = "prompt" | "faq" | "dictionary" | "settings" | "dialogs" | "responses";

const FILES: { key: FileKey; label: string; icon: string; path: string; type: "json" | "text" }[] = [
  { key: "prompt",     label: "Системный промпт",    icon: "Brain",      path: "/assistant_config/prompts/prompt.json",            type: "json" },
  { key: "faq",        label: "База знаний (FAQ)",    icon: "BookOpen",   path: "/assistant_config/knowledge_base/faq.json",         type: "json" },
  { key: "dictionary", label: "Словарь терминов",     icon: "Library",    path: "/assistant_config/knowledge_base/dictionary.json",  type: "json" },
  { key: "settings",   label: "Настройки стиля",      icon: "Settings",   path: "/assistant_config/settings/settings.json",          type: "json" },
  { key: "dialogs",    label: "Сценарии диалогов",    icon: "MessageCircle", path: "/assistant_config/dialogs/dialog_flows.json",   type: "json" },
  { key: "responses",  label: "Типовые ответы",        icon: "Reply",      path: "/assistant_config/responses/responses.json",       type: "json" },
];

type Snapshot = {
  id: string;
  label: string;
  date: string;
  data: Record<FileKey, string>;
};

const STORAGE_KEY = "ecsu_ai_config_snapshots";
const EDITS_KEY = "ecsu_ai_config_edits";

function ts() {
  return new Date().toLocaleString("ru-RU");
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function isValidJson(s: string) {
  try { JSON.parse(s); return true; } catch { return false; }
}

export default function EgsuAiConfig() {
  const navigate = useNavigate();
  const [activeFile, setActiveFile] = useState<FileKey>("prompt");
  const [contents, setContents] = useState<Record<FileKey, string>>({} as Record<FileKey, string>);
  const [edited, setEdited] = useState<Record<FileKey, boolean>>({} as Record<FileKey, boolean>);
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [snapLabel, setSnapLabel] = useState("");
  const [tab, setTab] = useState<"editor" | "snapshots">("editor");
  const [saved, setSaved] = useState<FileKey | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState("");

  useEffect(() => {
    const storedEdits = JSON.parse(localStorage.getItem(EDITS_KEY) || "{}");
    const storedSnaps: Snapshot[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    setSnapshots(storedSnaps);

    const loadFiles = async () => {
      const result: Record<FileKey, string> = {} as Record<FileKey, string>;
      for (const f of FILES) {
        if (storedEdits[f.key]) {
          result[f.key] = storedEdits[f.key];
        } else {
          try {
            const res = await fetch(f.path);
            const text = await res.text();
            result[f.key] = text;
          } catch {
            result[f.key] = f.type === "json" ? "{}" : "";
          }
        }
      }
      setContents(result);
      const editFlags = {} as Record<FileKey, boolean>;
      FILES.forEach(f => { editFlags[f.key] = !!storedEdits[f.key]; });
      setEdited(editFlags);
      setLoading(false);
    };
    loadFiles();
  }, []);

  const handleChange = (val: string) => {
    const cur = activeFile;
    setContents(prev => ({ ...prev, [cur]: val }));
    setEdited(prev => ({ ...prev, [cur]: true }));
    setJsonError("");
  };

  const handleSave = () => {
    const f = FILES.find(f => f.key === activeFile)!;
    if (f.type === "json" && !isValidJson(contents[activeFile])) {
      setJsonError("Ошибка: невалидный JSON. Исправьте синтаксис перед сохранением.");
      return;
    }
    const storedEdits = JSON.parse(localStorage.getItem(EDITS_KEY) || "{}");
    storedEdits[activeFile] = contents[activeFile];
    localStorage.setItem(EDITS_KEY, JSON.stringify(storedEdits));
    setEdited(prev => ({ ...prev, [activeFile]: true }));
    setSaved(activeFile);
    setTimeout(() => setSaved(null), 2000);
    setJsonError("");
  };

  const handleReset = () => {
    const storedEdits = JSON.parse(localStorage.getItem(EDITS_KEY) || "{}");
    delete storedEdits[activeFile];
    localStorage.setItem(EDITS_KEY, JSON.stringify(storedEdits));
    setEdited(prev => ({ ...prev, [activeFile]: false }));
    const f = FILES.find(f => f.key === activeFile)!;
    fetch(f.path).then(r => r.text()).then(text => {
      setContents(prev => ({ ...prev, [activeFile]: text }));
    });
  };

  const handleFormat = () => {
    const f = FILES.find(f => f.key === activeFile)!;
    if (f.type !== "json") return;
    try {
      const pretty = JSON.stringify(JSON.parse(contents[activeFile]), null, 2);
      setContents(prev => ({ ...prev, [activeFile]: pretty }));
      setJsonError("");
    } catch {
      setJsonError("Невозможно форматировать — JSON содержит ошибки.");
    }
  };

  const createSnapshot = () => {
    const label = snapLabel.trim() || `Точка восстановления ${ts()}`;
    const snap: Snapshot = { id: uid(), label, date: ts(), data: { ...contents } };
    const updated = [snap, ...snapshots].slice(0, 20);
    setSnapshots(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSnapLabel("");
  };

  const restoreSnapshot = (snap: Snapshot) => {
    setContents(snap.data);
    const editFlags = {} as Record<FileKey, boolean>;
    FILES.forEach(f => { editFlags[f.key] = true; });
    setEdited(editFlags);
    localStorage.setItem(EDITS_KEY, JSON.stringify(snap.data));
    setRestoreConfirm(null);
    setTab("editor");
  };

  const deleteSnapshot = (id: string) => {
    const updated = snapshots.filter(s => s.id !== id);
    setSnapshots(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const downloadAll = () => {
    const data = { exported_at: ts(), files: contents };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ecsu_ai_config_${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const activeFileMeta = FILES.find(f => f.key === activeFile)!;
  const editedCount = Object.values(edited).filter(Boolean).length;

  return (
    <div style={{ minHeight: "100vh", background: S.bg, color: S.text, fontFamily: "monospace" }}>

      {/* Шапка */}
      <div style={{ borderBottom: `1px solid ${S.border}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/egsu/ai-control")}
            style={{ background: "none", border: "none", color: S.muted, cursor: "pointer", padding: 0 }}>
            <Icon name="ArrowLeft" size={18} />
          </button>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#00c864,#0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="FileEdit" size={18} color="#000" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Редактор конфигурации ИИ</div>
            <div style={{ fontSize: 11, color: S.muted }}>ECSU 2.0 · AI Assistant Config</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {editedCount > 0 && (
            <div style={{ fontSize: 11, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 20, padding: "4px 12px", color: S.warn }}>
              {editedCount} файл(а) изменено
            </div>
          )}
          <button onClick={downloadAll}
            style={{ background: "rgba(0,200,100,0.1)", border: `1px solid ${S.accent}33`, borderRadius: 8, color: S.accent, padding: "6px 14px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="Download" size={14} /> Скачать всё
          </button>
        </div>
      </div>

      {/* Табы */}
      <div style={{ display: "flex", gap: 4, padding: "12px 24px", borderBottom: `1px solid ${S.border}` }}>
        {[
          { key: "editor", label: "Редактор", icon: "Code" },
          { key: "snapshots", label: `Точки восстановления (${snapshots.length})`, icon: "History" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as "editor" | "snapshots")}
            style={{
              background: tab === t.key ? "rgba(0,200,100,0.12)" : "none",
              border: tab === t.key ? `1px solid ${S.accent}44` : "1px solid transparent",
              borderRadius: 8, color: tab === t.key ? S.accent : S.muted,
              padding: "7px 16px", fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}>
            <Icon name={t.icon as "Code"} size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* РЕДАКТОР */}
      {tab === "editor" && (
        <div style={{ display: "flex", height: "calc(100vh - 130px)" }}>

          {/* Боковая панель — файлы */}
          <div style={{ width: 220, borderRight: `1px solid ${S.border}`, padding: "12px 8px", flexShrink: 0, overflowY: "auto" }}>
            <div style={{ fontSize: 10, color: S.muted, letterSpacing: 1, textTransform: "uppercase", padding: "0 8px 8px" }}>Файлы конфигурации</div>
            {FILES.map(f => (
              <button key={f.key} onClick={() => { setActiveFile(f.key); setJsonError(""); }}
                style={{
                  width: "100%", textAlign: "left", background: activeFile === f.key ? "rgba(0,200,100,0.1)" : "none",
                  border: activeFile === f.key ? `1px solid ${S.accent}33` : "1px solid transparent",
                  borderRadius: 8, padding: "9px 10px", cursor: "pointer", marginBottom: 2,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                <Icon name={f.icon as "Brain"} size={14} color={activeFile === f.key ? S.accent : S.muted} />
                <span style={{ fontSize: 12, color: activeFile === f.key ? S.accent : S.text, flex: 1 }}>{f.label}</span>
                {edited[f.key] && (
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: S.warn, flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>

          {/* Область редактирования */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Тулбар файла */}
            <div style={{ padding: "10px 16px", borderBottom: `1px solid ${S.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name={activeFileMeta.icon as "Brain"} size={16} color={S.accent} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>{activeFileMeta.label}</span>
                <span style={{ fontSize: 10, color: S.muted, background: "rgba(255,255,255,0.05)", borderRadius: 4, padding: "2px 6px" }}>{activeFileMeta.type.toUpperCase()}</span>
                {edited[activeFile] && <span style={{ fontSize: 10, color: S.warn }}>● изменён</span>}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {activeFileMeta.type === "json" && (
                  <button onClick={handleFormat}
                    style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${S.border}`, borderRadius: 6, color: S.muted, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}>
                    Форматировать
                  </button>
                )}
                {edited[activeFile] && (
                  <button onClick={handleReset}
                    style={{ background: "rgba(244,63,94,0.08)", border: `1px solid ${S.danger}33`, borderRadius: 6, color: S.danger, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}>
                    Сбросить
                  </button>
                )}
                <button onClick={handleSave}
                  style={{ background: saved === activeFile ? "rgba(0,200,100,0.2)" : "rgba(0,200,100,0.12)", border: `1px solid ${S.accent}44`, borderRadius: 6, color: S.accent, padding: "5px 14px", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>
                  {saved === activeFile ? "✓ Сохранено" : "Сохранить"}
                </button>
              </div>
            </div>

            {/* Ошибка JSON */}
            {jsonError && (
              <div style={{ background: "rgba(244,63,94,0.08)", borderBottom: `1px solid ${S.danger}33`, padding: "8px 16px", fontSize: 12, color: S.danger, display: "flex", gap: 6, alignItems: "center" }}>
                <Icon name="AlertCircle" size={13} color={S.danger} /> {jsonError}
              </div>
            )}

            {/* Textarea */}
            {loading ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: S.muted, fontSize: 13 }}>
                Загрузка файлов...
              </div>
            ) : (
              <textarea
                value={contents[activeFile] || ""}
                onChange={e => handleChange(e.target.value)}
                spellCheck={false}
                style={{
                  flex: 1, background: "rgba(0,0,0,0.25)", color: "#e2f5e9",
                  border: "none", outline: "none", resize: "none",
                  padding: "16px 20px", fontSize: 13, lineHeight: 1.7,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  tabSize: 2,
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* ТОЧКИ ВОССТАНОВЛЕНИЯ */}
      {tab === "snapshots" && (
        <div style={{ padding: 24, maxWidth: 860 }}>

          {/* Создать точку */}
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Создать точку восстановления</div>
            <div style={{ fontSize: 12, color: S.muted, marginBottom: 14 }}>
              Сохраняет текущее состояние всех файлов конфигурации. Хранится в браузере — до 20 точек.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={snapLabel}
                onChange={e => setSnapLabel(e.target.value)}
                placeholder="Описание (необязательно)"
                style={{
                  flex: 1, background: "rgba(0,0,0,0.3)", border: `1px solid ${S.border}`,
                  borderRadius: 8, padding: "9px 14px", color: S.text, fontSize: 13, outline: "none",
                }}
              />
              <button onClick={createSnapshot}
                style={{ background: "linear-gradient(135deg,#00c864,#0ea5e9)", border: "none", borderRadius: 8, color: "#000", fontWeight: 800, padding: "9px 20px", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="Save" size={15} /> Сохранить точку
              </button>
            </div>
          </div>

          {/* Список точек */}
          {snapshots.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: S.muted, fontSize: 13 }}>
              <Icon name="History" size={32} color={S.muted} />
              <div style={{ marginTop: 12 }}>Точек восстановления пока нет</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>Создайте первую точку после внесения изменений</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 10, color: S.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                Сохранённые точки ({snapshots.length}/20)
              </div>
              {snapshots.map((snap, i) => (
                <div key={snap.id} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: i === 0 ? "rgba(0,200,100,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${i === 0 ? S.accent + "44" : S.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="History" size={16} color={i === 0 ? S.accent : S.muted} />
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                      {snap.label}
                      {i === 0 && <span style={{ fontSize: 10, background: "rgba(0,200,100,0.15)", border: `1px solid ${S.accent}44`, borderRadius: 10, padding: "2px 8px", color: S.accent }}>последняя</span>}
                    </div>
                    <div style={{ fontSize: 11, color: S.muted, marginTop: 2 }}>{snap.date}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {restoreConfirm === snap.id ? (
                      <>
                        <button onClick={() => restoreSnapshot(snap)}
                          style={{ background: "rgba(244,63,94,0.15)", border: `1px solid ${S.danger}44`, borderRadius: 7, color: S.danger, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
                          Да, восстановить
                        </button>
                        <button onClick={() => setRestoreConfirm(null)}
                          style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${S.border}`, borderRadius: 7, color: S.muted, padding: "6px 10px", fontSize: 12, cursor: "pointer" }}>
                          Отмена
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setRestoreConfirm(snap.id)}
                          style={{ background: "rgba(0,200,100,0.1)", border: `1px solid ${S.accent}33`, borderRadius: 7, color: S.accent, padding: "6px 12px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                          <Icon name="RotateCcw" size={13} /> Откатить
                        </button>
                        <button onClick={() => deleteSnapshot(snap.id)}
                          style={{ background: "rgba(244,63,94,0.06)", border: `1px solid ${S.danger}22`, borderRadius: 7, color: S.danger, padding: "6px 8px", fontSize: 12, cursor: "pointer" }}>
                          <Icon name="Trash2" size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
