import { useState } from "react";
import Icon from "@/components/ui/icon";
import {
  Message, KnowledgeItem, UploadedDoc, SearchResult, LMSettings,
  SK, DEFAULT_SETTINGS, lsGet, lsSet, callLMStudio,
} from "./AcTypes";
import AcChatTab from "./AcChatTab";
import { KnowledgeTab, DocsTab, SearchTab } from "./AcKnowledgeDocsSearch";
import AcSettingsTab from "./AcSettingsTab";

const TABS = [
  { id: "chat",      label: "Чат",          icon: "MessageSquare" },
  { id: "knowledge", label: "База знаний",   icon: "BookOpen"      },
  { id: "docs",      label: "Документы",     icon: "FileText"      },
  { id: "search",    label: "Веб-поиск",     icon: "Search"        },
  { id: "settings",  label: "Настройки",     icon: "Settings"      },
] as const;

const AiConstructor = () => {
  const [tab, setTab] = useState<"chat" | "knowledge" | "docs" | "search" | "settings">("chat");
  const [settings, setSettings]   = useState<LMSettings>(() => lsGet(SK.settings, DEFAULT_SETTINGS));
  const [messages, setMessages]   = useState<Message[]>(() => lsGet(SK.history, []));
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>(() => lsGet(SK.knowledge, []));
  const [docs, setDocs]           = useState<UploadedDoc[]>(() => lsGet(SK.docs, []));
  const [searches, setSearches]   = useState<SearchResult[]>(() => lsGet(SK.search, []));

  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [connected, setConnected] = useState<boolean | null>(null);
  const [checking, setChecking]   = useState(false);

  // ── Сохранение ────────────────────────────────────────────────────────────
  const saveSettings  = (s: LMSettings)      => { setSettings(s);   lsSet(SK.settings,  s); };
  const saveMessages  = (m: Message[])        => { setMessages(m);   lsSet(SK.history,   m); };
  const saveKnowledge = (k: KnowledgeItem[]) => { setKnowledge(k);  lsSet(SK.knowledge, k); };
  const saveDocs      = (d: UploadedDoc[])   => { setDocs(d);       lsSet(SK.docs,      d); };
  const saveSearches  = (s: SearchResult[])  => { setSearches(s);   lsSet(SK.search,    s); };

  // ── Проверка LM Studio ─────────────────────────────────────────────────
  const checkConnection = async () => {
    setChecking(true); setConnected(null);
    try {
      const r = await fetch(`http://${settings.host}:${settings.port}/v1/models`, { signal: AbortSignal.timeout(3000) });
      setConnected(r.ok);
    } catch { setConnected(false); }
    setChecking(false);
  };

  // ── Отправка сообщения ─────────────────────────────────────────────────
  const send = async (text?: string) => {
    const t = (text || input).trim();
    if (!t || loading) return;
    setInput(""); setError("");

    const newMsgs: Message[] = [...messages, { role: "user", content: t }];
    saveMessages(newMsgs);
    setLoading(true);

    try {
      const reply = await callLMStudio(newMsgs, settings, knowledge, docs);
      saveMessages([...newMsgs, { role: "assistant", content: reply }]);
    } catch (e) {
      const err = e instanceof Error ? e.message : "Неизвестная ошибка";
      setError(err.includes("Failed to fetch") || err.includes("TypeError")
        ? "Не удалось подключиться к LM Studio. Убедитесь что LM Studio запущен и сервер активен (порт " + settings.port + ")"
        : "Ошибка: " + err);
    }
    setLoading(false);
  };

  const connColor = connected === true ? "#34d399" : connected === false ? "#e94560" : "#94a3b8";

  return (
    <div className="flex flex-col h-full bg-[#080c1a] text-white">

      {/* ── ШАПКА ── */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-blue-900/20">
        <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-700 rounded-xl flex items-center justify-center">
          <Icon name="BrainCircuit" size={18} className="text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-sm">ИИ-Конструктор ЕЦСУ</div>
          <div className="text-gray-500 text-[10px] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: connColor }} />
            {connected === true ? "LM Studio подключён" : connected === false ? "LM Studio недоступен" : "LM Studio · локальный ИИ"}
          </div>
        </div>
        <div className="flex-1" />
        <button onClick={checkConnection} disabled={checking}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/30 border border-blue-700/30 text-blue-400 text-xs rounded-lg hover:bg-blue-900/50 transition-colors disabled:opacity-50">
          <Icon name={checking ? "Loader" : "Wifi"} size={12} className={checking ? "animate-spin" : ""} />
          {checking ? "Проверка..." : "Проверить связь"}
        </button>
      </div>

      {/* ── ВКЛАДКИ ── */}
      <div className="flex gap-1 px-4 pt-3 pb-0 border-b border-blue-900/10">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-all ${tab === t.id ? "text-purple-300 border-purple-500 bg-purple-900/10" : "text-gray-500 border-transparent hover:text-gray-300"}`}>
            <Icon name={t.icon} size={12} />
            {t.label}
            {t.id === "knowledge" && knowledge.length > 0 && (
              <span className="w-4 h-4 text-[9px] bg-purple-700 rounded-full flex items-center justify-center">{knowledge.length}</span>
            )}
            {t.id === "docs" && docs.length > 0 && (
              <span className="w-4 h-4 text-[9px] bg-blue-700 rounded-full flex items-center justify-center">{docs.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── КОНТЕНТ ВКЛАДОК ── */}
      {tab === "chat" && (
        <AcChatTab
          messages={messages}
          saveMessages={saveMessages}
          knowledge={knowledge}
          saveKnowledge={saveKnowledge}
          docsLength={docs.length}
          input={input}
          setInput={setInput}
          loading={loading}
          error={error}
          connColor={connColor}
          settingsHost={settings.host}
          settingsPort={settings.port}
          onSend={send}
        />
      )}

      {tab === "knowledge" && (
        <KnowledgeTab
          knowledge={knowledge}
          saveKnowledge={saveKnowledge}
        />
      )}

      {tab === "docs" && (
        <DocsTab
          docs={docs}
          saveDocs={saveDocs}
        />
      )}

      {tab === "search" && (
        <SearchTab
          searches={searches}
          saveSearches={saveSearches}
          saveKnowledge={saveKnowledge}
          knowledge={knowledge}
        />
      )}

      {tab === "settings" && (
        <AcSettingsTab
          settings={settings}
          saveSettings={saveSettings}
          connected={connected}
          checkConnection={checkConnection}
          knowledgeLength={knowledge.length}
          docsLength={docs.length}
          searchesLength={searches.length}
        />
      )}
    </div>
  );
};

export default AiConstructor;
