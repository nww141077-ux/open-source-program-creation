import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { KnowledgeItem, UploadedDoc, SearchResult } from "./AcTypes";

// ─── БАЗА ЗНАНИЙ ─────────────────────────────────────────────────────────────
interface KnowledgeTabProps {
  knowledge: KnowledgeItem[];
  saveKnowledge: (k: KnowledgeItem[]) => void;
}

export const KnowledgeTab = ({ knowledge, saveKnowledge }: KnowledgeTabProps) => {
  const [kq, setKq] = useState("");
  const [ka, setKa] = useState("");

  const addKnowledge = () => {
    if (!kq.trim() || !ka.trim()) return;
    const item: KnowledgeItem = {
      id: Date.now().toString(), question: kq.trim(), answer: ka.trim(),
      source: "manual", createdAt: new Date().toLocaleDateString("ru-RU"),
    };
    saveKnowledge([item, ...knowledge]);
    setKq(""); setKa("");
  };

  const deleteKnowledge = (id: string) => saveKnowledge(knowledge.filter(k => k.id !== id));

  return (
    <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
      <div className="bg-[#0a0f1e] border border-purple-900/30 rounded-xl p-4">
        <div className="text-purple-300 text-xs font-semibold mb-3 flex items-center gap-2">
          <Icon name="Plus" size={12} />
          Добавить знание вручную
        </div>
        <input value={kq} onChange={e => setKq(e.target.value)} placeholder="Вопрос / тема"
          className="w-full bg-[#060b18] border border-purple-900/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none mb-2" />
        <textarea value={ka} onChange={e => setKa(e.target.value)} placeholder="Ответ / содержание"
          rows={4}
          className="w-full bg-[#060b18] border border-purple-900/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none resize-none mb-2" />
        <button onClick={addKnowledge} disabled={!kq.trim() || !ka.trim()}
          className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold rounded-lg disabled:opacity-40 transition-colors">
          Добавить в базу
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {knowledge.length === 0 && (
          <div className="text-gray-600 text-sm text-center py-8">База знаний пуста — добавьте знания или загрузите документы</div>
        )}
        {knowledge.map(k => (
          <div key={k.id} className="bg-[#0a0f1e] border border-blue-900/20 rounded-xl p-3 flex gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${k.source === "manual" ? "bg-purple-900/30 text-purple-400" : k.source === "web" ? "bg-blue-900/30 text-blue-400" : "bg-green-900/30 text-green-400"}`}>
                  {k.source === "manual" ? "ручное" : k.source === "web" ? "веб" : "документ"}
                </span>
                <span className="text-gray-600 text-[9px]">{k.createdAt}</span>
              </div>
              <div className="text-white text-xs font-semibold mb-1">{k.question}</div>
              <div className="text-gray-400 text-xs line-clamp-2">{k.answer}</div>
            </div>
            <button onClick={() => deleteKnowledge(k.id)}
              className="text-gray-700 hover:text-red-400 transition-colors flex-shrink-0">
              <Icon name="X" size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── ДОКУМЕНТЫ ───────────────────────────────────────────────────────────────
interface DocsTabProps {
  docs: UploadedDoc[];
  saveDocs: (d: UploadedDoc[]) => void;
}

export const DocsTab = ({ docs, saveDocs }: DocsTabProps) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadDoc = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      const doc: UploadedDoc = {
        id: Date.now().toString(), name: file.name,
        content: content.slice(0, 50000),
        size: file.size > 1024 * 1024
          ? (file.size / 1024 / 1024).toFixed(1) + " МБ"
          : (file.size / 1024).toFixed(0) + " КБ",
        uploadedAt: new Date().toLocaleDateString("ru-RU"),
      };
      saveDocs([doc, ...docs]);
    };
    reader.readAsText(file, "utf-8");
  };

  return (
    <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
      <div className="bg-[#0a0f1e] border border-blue-900/30 rounded-xl p-4">
        <div className="text-blue-300 text-xs font-semibold mb-2 flex items-center gap-2">
          <Icon name="Upload" size={12} />
          Загрузить документ
        </div>
        <div className="text-gray-500 text-xs mb-3">Поддерживаются: .txt, .md, .json, .py, .js, .ts, .html, .css, .csv</div>
        <input ref={fileRef} type="file" className="hidden"
          accept=".txt,.md,.json,.py,.js,.ts,.html,.css,.csv"
          onChange={e => { if (e.target.files?.[0]) uploadDoc(e.target.files[0]); }} />
        <button onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors">
          <Icon name="FolderOpen" size={13} />
          Выбрать файл
        </button>
        <div className="text-gray-700 text-[10px] mt-2">
          ИИ будет использовать содержимое документов при ответах (RAG)
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {docs.length === 0 && (
          <div className="text-gray-600 text-sm text-center py-8">Нет загруженных документов</div>
        )}
        {docs.map(d => (
          <div key={d.id} className="bg-[#0a0f1e] border border-blue-900/20 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon name="FileText" size={15} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-semibold truncate">{d.name}</div>
              <div className="text-gray-500 text-xs">{d.size} · загружен {d.uploadedAt}</div>
              <div className="text-gray-700 text-[10px] mt-0.5 truncate">{d.content.slice(0, 80)}...</div>
            </div>
            <button onClick={() => saveDocs(docs.filter(dd => dd.id !== d.id))}
              className="text-gray-700 hover:text-red-400 transition-colors">
              <Icon name="Trash2" size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── ВЕБ-ПОИСК ───────────────────────────────────────────────────────────────
interface SearchTabProps {
  searches: SearchResult[];
  saveSearches: (s: SearchResult[]) => void;
  saveKnowledge: (k: KnowledgeItem[]) => void;
  knowledge: KnowledgeItem[];
}

export const SearchTab = ({ searches, saveSearches, saveKnowledge, knowledge }: SearchTabProps) => {
  const [searchQ, setSearchQ] = useState("");
  const [searching, setSearching] = useState(false);

  const doSearch = async () => {
    if (!searchQ.trim()) return;
    setSearching(true);
    const q = searchQ.trim();
    window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_blank");

    const result: SearchResult = {
      title: `Поиск: ${q}`,
      url: `https://www.google.com/search?q=${encodeURIComponent(q)}`,
      snippet: `Запрос выполнен ${new Date().toLocaleTimeString("ru-RU")}. Откройте ссылку и скопируйте нужное в базу знаний.`,
      savedAt: new Date().toLocaleTimeString("ru-RU"),
    };
    saveSearches([result, ...searches]);
    setSearching(false);
    setSearchQ("");
  };

  const addSearchToKnowledge = (s: SearchResult) => {
    const item: KnowledgeItem = {
      id: Date.now().toString(), question: s.title, answer: s.snippet,
      source: "web", createdAt: s.savedAt,
    };
    saveKnowledge([item, ...knowledge]);
  };

  return (
    <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
      <div className="bg-[#0a0f1e] border border-blue-900/30 rounded-xl p-4">
        <div className="text-blue-300 text-xs font-semibold mb-3 flex items-center gap-2">
          <Icon name="Search" size={12} />
          Поиск в интернете
        </div>
        <div className="flex gap-2">
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") doSearch(); }}
            placeholder="Что искать?"
            className="flex-1 bg-[#060b18] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none" />
          <button onClick={doSearch} disabled={!searchQ.trim() || searching}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded-lg disabled:opacity-40 transition-colors">
            {searching ? "..." : "Найти"}
          </button>
        </div>
        <div className="text-gray-600 text-[10px] mt-2 flex items-center gap-1.5">
          <Icon name="Info" size={9} />
          Открывает Google-поиск и сохраняет запрос. Найденное можно добавить в базу знаний.
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {searches.length === 0 && (
          <div className="text-gray-600 text-sm text-center py-8">История поиска пуста</div>
        )}
        {searches.map((s, i) => (
          <div key={i} className="bg-[#0a0f1e] border border-blue-900/20 rounded-xl p-3 flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon name="Globe" size={13} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-semibold">{s.title}</div>
              <div className="text-gray-500 text-xs mt-0.5">{s.snippet}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <a href={s.url} target="_blank" rel="noreferrer"
                  className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  <Icon name="ExternalLink" size={9} />
                  Открыть
                </a>
                <button onClick={() => addSearchToKnowledge(s)}
                  className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
                  <Icon name="BookmarkPlus" size={9} />
                  В базу знаний
                </button>
                <span className="text-gray-700 text-[9px]">{s.savedAt}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
