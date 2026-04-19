import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import ModelsCatalog from "@/pages/my-model/ModelsCatalog";
import ModelConfigTab from "@/pages/my-model/ModelConfig";
import ModelTraining from "@/pages/my-model/ModelTraining";
import { ModelDocumentsTab, ModelLogTab } from "@/pages/my-model/ModelDocuments";

const API = "https://functions.poehali.dev/494683c4-8d1a-4c3a-b0e9-9117da34c2ed";

type Tab = "models" | "config" | "training" | "document" | "log";

interface BaseModel {
  id: string; name: string; org: string; license: string; license_type: string;
  license_url: string; description: string; params: string; languages: string[];
  via: string; ollama_tag: string; commercial_ok: boolean; finetune_ok: boolean; color: string;
}
interface ModelConfig {
  id?: number; base_model_id: string; model_name: string; owner_name: string;
  system_prompt: string; temperature: number; max_tokens: number; language: string; domain: string;
}
interface TrainingItem {
  id: number; data_type: string; instruction: string; response: string;
  category: string; quality_score: number; created_at: string;
}
interface LogItem {
  id: number; action: string; details: string; base_model: string;
  model_name: string; owner_name: string; created_at: string;
}
interface DocItem {
  id: number; doc_type: string; title: string; base_model: string;
  model_name: string; owner_name: string; doc_hash: string; created_at: string;
}

export default function MyModel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("models");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  const [models, setModels] = useState<BaseModel[]>([]);
  const [config, setConfig] = useState<ModelConfig>({
    base_model_id: "mistral-7b", model_name: "Моя модель", owner_name: "",
    system_prompt: "", temperature: 0.7, max_tokens: 1024, language: "ru", domain: "general",
  });
  const [training, setTraining] = useState<TrainingItem[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [generatedDoc, setGeneratedDoc] = useState("");

  const [newInstruction, setNewInstruction] = useState("");
  const [newResponse, setNewResponse] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newScore, setNewScore] = useState(5);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const get = async (path: string) => {
    const r = await fetch(`${API}${path}`);
    const d = await r.json();
    return typeof d === "string" ? JSON.parse(d) : d;
  };
  const post = async (path: string, body: object) => {
    const r = await fetch(`${API}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    return typeof d === "string" ? JSON.parse(d) : d;
  };

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [m, c, t, l, dd] = await Promise.all([
      get("/models"), get("/config"), get("/training"), get("/log"), get("/documents"),
    ]);
    if (m.models) setModels(m.models);
    if (c.config) setConfig(c.config);
    if (t.data) setTraining(t.data);
    if (l.log) setLogs(l.log);
    if (dd.documents) setDocs(dd.documents);
    setLoading(false);
  };

  const saveConfig = async () => {
    setLoading(true);
    await post("/config", config);
    showToast("✓ Конфигурация сохранена");
    loadAll();
    setLoading(false);
  };

  const addTraining = async () => {
    if (!newInstruction.trim() || !newResponse.trim()) { showToast("Заполните вопрос и ответ"); return; }
    setLoading(true);
    await post("/training", { instruction: newInstruction, response: newResponse, category: newCategory, quality_score: newScore });
    setNewInstruction(""); setNewResponse(""); setNewScore(5);
    showToast("✓ Пример добавлен");
    loadAll();
    setLoading(false);
  };

  const deleteTraining = async (id: number) => {
    await fetch(`${API}/training?id=${id}`, { method: "DELETE" });
    showToast("✓ Пример удалён");
    setTraining(prev => prev.filter(t => t.id !== id));
  };

  const generateDoc = async () => {
    if (!config.owner_name.trim()) { showToast("Укажите ваше имя в настройках"); setTab("config"); return; }
    setLoading(true);
    const d = await post("/document", {});
    if (d.content) { setGeneratedDoc(d.content); showToast("✓ Документ сформирован"); }
    loadAll();
    setLoading(false);
  };

  const downloadDoc = () => {
    const blob = new Blob([generatedDoc], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "декларация_модели.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const selectedModel = models.find(m => m.id === config.base_model_id);

  const navItems: { id: Tab; icon: string; label: string }[] = [
    { id: "models", icon: "Cpu", label: "Базовые модели" },
    { id: "config", icon: "Settings2", label: "Настройка" },
    { id: "training", icon: "BookOpen", label: `Обучение (${training.length})` },
    { id: "document", icon: "FileText", label: "Документы" },
    { id: "log", icon: "ScrollText", label: "Журнал" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#070c18", color: "white" }}>
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-xl"
          style={{ background: "rgba(59,130,246,0.95)", color: "white" }}>{toast}</div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-3"
        style={{ background: "rgba(7,12,24,0.97)", borderBottom: "1px solid rgba(99,102,241,0.2)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-white/30 hover:text-white/70 transition-colors mr-1">
            <Icon name="ChevronLeft" size={18} />
          </button>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}>
            <Icon name="BrainCircuit" size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-none">Моя ИИ-Модель</div>
            <div className="text-[10px] text-indigo-400/70">Реестр открытых моделей · ECSU 2.0</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {loading && <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />}
          {selectedModel && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
              style={{ background: `${selectedModel.color}18`, border: `1px solid ${selectedModel.color}40`, color: selectedModel.color }}>
              <Icon name="Cpu" size={12} />
              {selectedModel.name}
            </div>
          )}
          <button onClick={generateDoc}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-all"
            style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}>
            <Icon name="FileText" size={13} />
            <span className="hidden md:inline">Сформировать документ</span>
            <span className="md:hidden">Документ</span>
          </button>
        </div>
      </header>

      <div className="pt-14 flex min-h-screen">
        {/* Sidebar */}
        <aside className="fixed left-0 top-14 bottom-0 w-16 md:w-56 flex flex-col py-4 gap-1 px-2"
          style={{ background: "rgba(7,12,24,0.97)", borderRight: "1px solid rgba(99,102,241,0.1)" }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left"
              style={{
                background: tab === item.id ? "rgba(99,102,241,0.15)" : "transparent",
                color: tab === item.id ? "#818cf8" : "rgba(255,255,255,0.35)",
                border: tab === item.id ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
              }}>
              <Icon name={item.icon as "Cpu"} size={15} />
              <span className="hidden md:block text-xs">{item.label}</span>
            </button>
          ))}

          <div className="mt-auto px-2 hidden md:block">
            <div className="p-3 rounded-xl text-[10px] space-y-1"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-white/25 uppercase tracking-widest">Статус модели</div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-emerald-400">{config.model_name || "Не настроена"}</span>
              </div>
              <div className="text-white/30">{training.length} обучающих примеров</div>
              <div className="text-white/30">{docs.length} документов</div>
            </div>
          </div>
        </aside>

        <main className="flex-1 ml-16 md:ml-56 p-5">
          {tab === "models" && (
            <ModelsCatalog
              models={models}
              selectedModelId={config.base_model_id}
              onSelect={id => { setConfig(p => ({ ...p, base_model_id: id })); setTab("config"); }}
            />
          )}
          {tab === "config" && (
            <ModelConfigTab
              config={config}
              selectedModel={selectedModel}
              loading={loading}
              onConfigChange={setConfig}
              onSave={saveConfig}
              onSwitchModel={() => setTab("models")}
            />
          )}
          {tab === "training" && (
            <ModelTraining
              training={training}
              loading={loading}
              newInstruction={newInstruction}
              newResponse={newResponse}
              newCategory={newCategory}
              newScore={newScore}
              onInstructionChange={setNewInstruction}
              onResponseChange={setNewResponse}
              onCategoryChange={setNewCategory}
              onScoreChange={setNewScore}
              onAdd={addTraining}
              onDelete={deleteTraining}
            />
          )}
          {tab === "document" && (
            <ModelDocumentsTab
              docs={docs}
              generatedDoc={generatedDoc}
              loading={loading}
              onGenerate={generateDoc}
              onDownload={downloadDoc}
            />
          )}
          {tab === "log" && (
            <ModelLogTab logs={logs} />
          )}
        </main>
      </div>
    </div>
  );
}
