import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

type Lang = "python" | "javascript" | "typescript" | "bash" | "json" | "html" | "css" | "sql";

interface SavedFile {
  id: string;
  name: string;
  lang: Lang;
  code: string;
  savedAt: string;
}

const STORAGE_KEY = "ecsu_code_files";

function loadFiles(): SavedFile[] {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : DEFAULT_FILES; }
  catch { return DEFAULT_FILES; }
}

function saveFiles(files: SavedFile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
}

const DEFAULT_FILES: SavedFile[] = [
  {
    id: "f1", name: "agent.py", lang: "python", savedAt: "2026-05-21",
    code: `#!/usr/bin/env python3
# МУСОН-агент ЕЦСУ
import psutil, time, json, os

AGENT_ID = "ECSU-PC-001"
MUSON_DIR = "D:/МУСОН"

def get_metrics():
    return {
        "id":   AGENT_ID,
        "cpu":  psutil.cpu_percent(interval=1),
        "ram":  psutil.virtual_memory().percent,
        "disk": psutil.disk_usage(MUSON_DIR).percent
                if os.path.exists(MUSON_DIR) else 0,
    }

while True:
    metrics = get_metrics()
    print(json.dumps(metrics, ensure_ascii=False))
    time.sleep(30)
`,
  },
  {
    id: "f2", name: "install.bat", lang: "bash", savedAt: "2026-05-21",
    code: `@echo off
REM Установка ЕЦСУ 2.0 на Windows
echo [ЕЦСУ] Установка агента...

pip install psutil requests --quiet

if not exist "D:\\МУСОН" (
    mkdir "D:\\МУСОН"
    echo [ЕЦСУ] Папка D:\\МУСОН создана
)

copy agent.py "D:\\МУСОН\\agent.py"
echo [ЕЦСУ] Агент установлен!

REM Запуск агента
start "МУСОН-агент" python "D:\\МУСОН\\agent.py"
echo [ЕЦСУ] Агент запущен. PID сохранён.
pause
`,
  },
];

// Подсветка синтаксиса — простой токенайзер
function highlight(code: string, lang: Lang): string {
  let c = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  if (lang === "python") {
    c = c
      .replace(/(#[^\n]*)/g, '<span style="color:#6a9955">$1</span>')
      .replace(/\b(def|class|import|from|return|if|else|elif|for|while|in|not|and|or|is|None|True|False|try|except|with|as|pass|break|continue|lambda|yield|global|nonlocal|raise|del|assert)\b/g, '<span style="color:#569cd6">$1</span>')
      .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span style="color:#ce9178">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#b5cea8">$1</span>');
  } else if (lang === "javascript" || lang === "typescript") {
    c = c
      .replace(/(\/\/[^\n]*)/g, '<span style="color:#6a9955">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#6a9955">$1</span>')
      .replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|default|new|this|typeof|async|await|try|catch|finally|throw|true|false|null|undefined)\b/g, '<span style="color:#569cd6">$1</span>')
      .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, '<span style="color:#ce9178">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#b5cea8">$1</span>');
  } else if (lang === "bash") {
    c = c
      .replace(/(#[^\n]*)/g, '<span style="color:#6a9955">$1</span>')
      .replace(/(REM[^\n]*)/g, '<span style="color:#6a9955">$1</span>')
      .replace(/\b(echo|if|else|for|do|done|exit|cd|mkdir|copy|move|del|start|pause|goto|set|call)\b/g, '<span style="color:#569cd6">$1</span>')
      .replace(/("(?:[^"\\]|\\.)*")/g, '<span style="color:#ce9178">$1</span>');
  } else if (lang === "json") {
    c = c
      .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span style="color:#9cdcfe">$1</span>:')
      .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span style="color:#ce9178">$1</span>')
      .replace(/\b(true|false|null)\b/g, '<span style="color:#569cd6">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#b5cea8">$1</span>');
  } else if (lang === "html") {
    c = c
      .replace(/(&lt;\/?)([\w-]+)/g, '$1<span style="color:#569cd6">$2</span>')
      .replace(/([\w-]+)=/g, '<span style="color:#9cdcfe">$1</span>=')
      .replace(/("(?:[^"]*)")/g, '<span style="color:#ce9178">$1</span>')
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span style="color:#6a9955">$1</span>');
  } else if (lang === "sql") {
    c = c
      .replace(/(--[^\n]*)/g, '<span style="color:#6a9955">$1</span>')
      .replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|ON|GROUP|BY|ORDER|HAVING|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|DROP|ALTER|ADD|COLUMN|PRIMARY|KEY|FOREIGN|REFERENCES|NOT|NULL|DEFAULT|UNIQUE|AND|OR|IN|LIKE|BETWEEN|AS|DISTINCT|COUNT|SUM|AVG|MAX|MIN)\b/gi, '<span style="color:#569cd6">$1</span>')
      .replace(/('(?:[^'\\]|\\.)*')/g, '<span style="color:#ce9178">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#b5cea8">$1</span>');
  }
  return c;
}

const LANG_EXT: Record<Lang, string> = {
  python: ".py", javascript: ".js", typescript: ".ts",
  bash: ".sh", json: ".json", html: ".html", css: ".css", sql: ".sql",
};

const LANG_COLORS: Record<Lang, string> = {
  python: "#3b82f6", javascript: "#f59e0b", typescript: "#60a5fa",
  bash: "#34d399", json: "#a78bfa", html: "#f97316", css: "#e94560", sql: "#fbbf24",
};

const EcsuCodeEditor = () => {
  const [files, setFiles]         = useState<SavedFile[]>(loadFiles);
  const [activeId, setActiveId]   = useState<string>(files[0]?.id || "");
  const [lang, setLang]           = useState<Lang>("python");
  const [code, setCode]           = useState<string>(files[0]?.code || "");
  const [filename, setFilename]   = useState(files[0]?.name || "новый.py");
  const [editingName, setEditingName] = useState(false);
  const [copied, setCopied]       = useState(false);
  const [showLines, setShowLines] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const activeFile = files.find(f => f.id === activeId);

  useEffect(() => {
    if (activeFile) {
      setCode(activeFile.code);
      setLang(activeFile.lang);
      setFilename(activeFile.name);
    }
  }, [activeId]);

  const syncScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const updateCode = (val: string) => {
    setCode(val);
  };

  const saveFile = () => {
    const now = new Date().toLocaleDateString("ru-RU");
    let updated: SavedFile[];
    if (activeId && files.find(f => f.id === activeId)) {
      updated = files.map(f => f.id === activeId ? { ...f, code, lang, name: filename, savedAt: now } : f);
    } else {
      const nf: SavedFile = { id: Date.now().toString(), name: filename, lang, code, savedAt: now };
      updated = [...files, nf];
      setActiveId(nf.id);
    }
    setFiles(updated);
    saveFiles(updated);
  };

  const newFile = () => {
    const ext = LANG_EXT[lang];
    const nf: SavedFile = {
      id: Date.now().toString(),
      name: "новый" + ext,
      lang,
      code: "",
      savedAt: new Date().toLocaleDateString("ru-RU"),
    };
    const updated = [...files, nf];
    setFiles(updated);
    saveFiles(updated);
    setActiveId(nf.id);
    setCode(""); setFilename(nf.name);
  };

  const deleteFile = (id: string) => {
    if (!confirm("Удалить файл?")) return;
    const updated = files.filter(f => f.id !== id);
    setFiles(updated);
    saveFiles(updated);
    if (activeId === id) {
      const next = updated[0];
      if (next) { setActiveId(next.id); setCode(next.code); setLang(next.lang); setFilename(next.name); }
      else { setActiveId(""); setCode(""); setFilename("новый.py"); }
    }
  };

  const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      const newVal = code.slice(0, start) + "    " + code.slice(end);
      setCode(newVal);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 4; }, 0);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); saveFile(); }
  };

  const copyAll = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const lines = code.split("\n");
  const lineCount = lines.length;

  return (
    <div className="flex h-full bg-[#1e1e1e] text-white">

      {/* Файловое дерево */}
      <div className="w-48 bg-[#252526] border-r border-[#3c3c3c] flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#3c3c3c]">
          <span className="text-[#cccccc] text-[11px] font-semibold uppercase tracking-wider">Файлы</span>
          <button onClick={newFile} className="w-5 h-5 flex items-center justify-center text-[#cccccc] hover:text-white transition-colors">
            <Icon name="Plus" size={12} />
          </button>
        </div>
        <div className="flex-1 overflow-auto py-1">
          {files.map(f => (
            <div key={f.id}
              onClick={() => setActiveId(f.id)}
              className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer group transition-colors ${activeId === f.id ? "bg-[#37373d]" : "hover:bg-[#2a2d2e]"}`}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: LANG_COLORS[f.lang] }} />
              <span className="text-[#cccccc] text-[11px] flex-1 truncate">{f.name}</span>
              <button onClick={e => { e.stopPropagation(); deleteFile(f.id); }}
                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all">
                <Icon name="X" size={10} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Редактор */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Панель вкладки */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c]">
          <div className="flex items-center gap-2 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-0.5">
            <span className="w-2 h-2 rounded-full" style={{ background: LANG_COLORS[lang] }} />
            {editingName ? (
              <input value={filename} onChange={e => setFilename(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={e => { if (e.key === "Enter") setEditingName(false); }}
                className="bg-transparent text-[12px] text-white outline-none w-32" autoFocus />
            ) : (
              <span className="text-[12px] text-[#cccccc] cursor-pointer" onDoubleClick={() => setEditingName(true)}>{filename}</span>
            )}
          </div>

          {/* Выбор языка */}
          <select value={lang} onChange={e => setLang(e.target.value as Lang)}
            className="bg-[#3c3c3c] text-[#cccccc] text-[11px] border border-[#555] rounded px-1.5 py-0.5 outline-none">
            {(Object.keys(LANG_EXT) as Lang[]).map(l => (
              <option key={l} value={l}>{l.toUpperCase()}</option>
            ))}
          </select>

          <div className="flex-1" />

          <button onClick={() => setShowLines(s => !s)} title="Нумерация строк"
            className={`p-1 rounded text-[11px] transition-colors ${showLines ? "text-[#cccccc]" : "text-gray-600"}`}>
            <Icon name="Hash" size={12} />
          </button>
          <button onClick={copyAll} className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-[#cccccc] hover:text-white transition-colors">
            <Icon name={copied ? "Check" : "Copy"} size={11} />
            {copied ? "OK" : "Copy"}
          </button>
          <button onClick={download} className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-[#cccccc] hover:text-white transition-colors">
            <Icon name="Download" size={11} />
            Скачать
          </button>
          <button onClick={saveFile} className="flex items-center gap-1 px-2 py-0.5 bg-[#0e639c] text-white text-[11px] rounded hover:bg-[#1177bb] transition-colors">
            <Icon name="Save" size={11} />
            Сохранить
          </button>
        </div>

        {/* Зона кода */}
        <div className="flex flex-1 overflow-hidden font-mono text-[13px] leading-[1.5]">
          {/* Номера строк */}
          {showLines && (
            <div className="select-none bg-[#1e1e1e] text-[#858585] text-right pr-3 pl-2 pt-3 overflow-hidden flex-shrink-0" style={{ minWidth: 40 }}>
              {lines.map((_, i) => (
                <div key={i} style={{ lineHeight: "1.5em" }}>{i + 1}</div>
              ))}
            </div>
          )}

          {/* Подсвеченный код + textarea */}
          <div className="flex-1 relative overflow-hidden">
            {/* Подсветка (за textarea) */}
            <div
              ref={highlightRef}
              className="absolute inset-0 pt-3 px-3 overflow-auto pointer-events-none whitespace-pre"
              style={{ color: "#d4d4d4", background: "#1e1e1e", lineHeight: "1.5em" }}
              dangerouslySetInnerHTML={{ __html: highlight(code, lang) + "\n" }}
            />
            {/* Прозрачный textarea поверх */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={e => updateCode(e.target.value)}
              onKeyDown={handleTab}
              onScroll={syncScroll}
              spellCheck={false}
              className="absolute inset-0 pt-3 px-3 w-full h-full bg-transparent text-transparent caret-white outline-none resize-none overflow-auto whitespace-pre"
              style={{ lineHeight: "1.5em", caretColor: "#aeafad", fontFamily: "inherit", fontSize: "inherit" }}
            />
          </div>
        </div>

        {/* Статусбар */}
        <div className="flex items-center gap-4 px-3 py-1 bg-[#007acc] text-white text-[11px]">
          <span>Ln {lineCount}</span>
          <span>Col 1</span>
          <span>UTF-8</span>
          <span style={{ color: LANG_COLORS[lang] }}>{lang.toUpperCase()}</span>
          <span className="ml-auto">Ctrl+S — сохранить · Tab — 4 пробела</span>
        </div>
      </div>
    </div>
  );
};

export default EcsuCodeEditor;
