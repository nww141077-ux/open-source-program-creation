import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

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

const LICENSE_COLORS: Record<string, string> = {
  mit: "#00c8a0", apache2: "#3b82f6", open: "#a855f7", gemma: "#4285f4",
};
const LICENSE_ICONS: Record<string, string> = {
  mit: "Unlock", apache2: "Shield", open: "Globe", gemma: "Star",
};
const DOMAINS = [
  { id: "general", label: "Общий ассистент" },
  { id: "legal", label: "Юридическая помощь" },
  { id: "security", label: "Кибербезопасность" },
  { id: "analytics", label: "Аналитика данных" },
  { id: "customer", label: "Поддержка клиентов" },
  { id: "coding", label: "Программирование" },
];

const fmtDate = (iso: string) => new Date(iso).toLocaleString("ru-RU");

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

  // Форма добавления примера
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

          {/* Статус */}
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

          {/* ── КАТАЛОГ БАЗОВЫХ МОДЕЛЕЙ ── */}
          {tab === "models" && (
            <div className="space-y-5 max-w-4xl">
              <div>
                <h2 className="text-2xl font-bold text-white">Базовые модели с открытым кодом</h2>
                <p className="text-white/40 text-sm mt-1">Все модели имеют открытые лицензии — можно использовать, дообучать и распространять</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {models.map(m => {
                  const isSelected = config.base_model_id === m.id;
                  const licColor = LICENSE_COLORS[m.license_type] ?? "#a855f7";
                  const licIcon = LICENSE_ICONS[m.license_type] ?? "Shield";
                  return (
                    <div key={m.id} className="rounded-2xl overflow-hidden transition-all"
                      style={{ border: `1px solid ${isSelected ? m.color + "60" : "rgba(255,255,255,0.07)"}`, background: isSelected ? `${m.color}0c` : "rgba(255,255,255,0.02)" }}>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: `${m.color}20`, border: `1px solid ${m.color}40` }}>
                              <Icon name="BrainCircuit" size={18} style={{ color: m.color }} />
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">{m.name}</div>
                              <div className="text-white/40 text-xs">{m.org} · {m.params}</div>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                              style={{ background: `${m.color}25`, color: m.color }}>ВЫБРАНА</span>
                          )}
                        </div>

                        <p className="text-white/50 text-xs leading-relaxed mb-3">{m.description}</p>

                        {/* Лицензия */}
                        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg"
                          style={{ background: `${licColor}10`, border: `1px solid ${licColor}25` }}>
                          <Icon name={licIcon as "Shield"} size={13} style={{ color: licColor }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold" style={{ color: licColor }}>{m.license}</div>
                            <a href={m.license_url} target="_blank" rel="noreferrer"
                              className="text-[10px] underline opacity-60" style={{ color: licColor }}>
                              Читать лицензию →
                            </a>
                          </div>
                        </div>

                        {/* Права */}
                        <div className="flex gap-2 mb-3">
                          {[
                            { ok: m.commercial_ok, label: "Коммерческое" },
                            { ok: m.finetune_ok, label: "Дообучение" },
                          ].map(r => (
                            <div key={r.label} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg"
                              style={{ background: r.ok ? "rgba(0,200,160,0.1)" : "rgba(239,68,68,0.1)", color: r.ok ? "#00c8a0" : "#f87171", border: `1px solid ${r.ok ? "rgba(0,200,160,0.25)" : "rgba(239,68,68,0.25)"}` }}>
                              <Icon name={r.ok ? "Check" : "X"} size={10} />
                              {r.label}
                            </div>
                          ))}
                          <div className="text-[10px] px-2 py-1 rounded-lg text-white/30"
                            style={{ background: "rgba(255,255,255,0.04)" }}>
                            {m.languages.join(", ").toUpperCase()}
                          </div>
                        </div>

                        <div className="text-[10px] text-white/30 mb-3">
                          Доступна через: <span className="text-white/50">{m.via}</span>
                        </div>

                        <button
                          onClick={() => { setConfig(p => ({ ...p, base_model_id: m.id })); setTab("config"); }}
                          className="w-full py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
                          style={{
                            background: isSelected ? `${m.color}30` : `linear-gradient(135deg, ${m.color}, #6366f1)`,
                            color: isSelected ? m.color : "white",
                            border: isSelected ? `1px solid ${m.color}50` : "none",
                          }}>
                          {isSelected ? "✓ Выбрана — перейти к настройке" : "Выбрать эту модель"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── НАСТРОЙКА МОДЕЛИ ── */}
          {tab === "config" && (
            <div className="max-w-2xl space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-white">Настройка модели</h2>
                <p className="text-white/40 text-sm mt-1">Специализация через системный промпт — это и есть ваше «дообучение»</p>
              </div>

              {selectedModel && (
                <div className="p-4 rounded-2xl flex items-center gap-3"
                  style={{ background: `${selectedModel.color}0f`, border: `1px solid ${selectedModel.color}40` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${selectedModel.color}25` }}>
                    <Icon name="BrainCircuit" size={18} style={{ color: selectedModel.color }} />
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: selectedModel.color }}>{selectedModel.name}</div>
                    <div className="text-white/40 text-xs">{selectedModel.license} · {selectedModel.org}</div>
                  </div>
                  <button onClick={() => setTab("models")} className="ml-auto text-xs text-white/30 hover:text-white/60">Сменить →</button>
                </div>
              )}

              <div className="p-5 rounded-2xl space-y-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Ваше имя (правообладатель)</label>
                    <input type="text" value={config.owner_name} onChange={e => setConfig(p => ({ ...p, owner_name: e.target.value }))}
                      placeholder="Владимир Иванов"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
                    <div className="text-[10px] text-white/25 mt-1">Будет указано в юридическом документе</div>
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Название вашей модели</label>
                    <input type="text" value={config.model_name} onChange={e => setConfig(p => ({ ...p, model_name: e.target.value }))}
                      placeholder="ECSU Assistant v1"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Предметная область</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {DOMAINS.map(d => (
                      <button key={d.id} onClick={() => setConfig(p => ({ ...p, domain: d.id }))}
                        className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
                        style={{
                          background: config.domain === d.id ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                          color: config.domain === d.id ? "#818cf8" : "rgba(255,255,255,0.4)",
                          border: `1px solid ${config.domain === d.id ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.06)"}`,
                        }}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/40 mb-1.5">
                    Системный промпт — специализация модели
                    <span className="ml-2 text-indigo-400">← главный инструмент дообучения</span>
                  </label>
                  <textarea
                    value={config.system_prompt}
                    onChange={e => setConfig(p => ({ ...p, system_prompt: e.target.value }))}
                    placeholder="Ты персональный ИИ-ассистент. Отвечай точно и по делу на русском языке. Специализируешься на юридических вопросах..."
                    rows={5}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none leading-relaxed"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(99,102,241,0.3)", color: "white" }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Температура: {config.temperature}</label>
                    <input type="range" min="0" max="1" step="0.05"
                      value={config.temperature}
                      onChange={e => setConfig(p => ({ ...p, temperature: parseFloat(e.target.value) }))}
                      className="w-full accent-indigo-500" />
                    <div className="flex justify-between text-[10px] text-white/25 mt-0.5">
                      <span>Точный</span><span>Творческий</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Макс. токенов: {config.max_tokens}</label>
                    <input type="range" min="256" max="4096" step="128"
                      value={config.max_tokens}
                      onChange={e => setConfig(p => ({ ...p, max_tokens: parseInt(e.target.value) }))}
                      className="w-full accent-indigo-500" />
                    <div className="flex justify-between text-[10px] text-white/25 mt-0.5">
                      <span>256</span><span>4096</span>
                    </div>
                  </div>
                </div>

                <button onClick={saveConfig} disabled={loading}
                  className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}>
                  Сохранить конфигурацию
                </button>
              </div>

              <div className="p-4 rounded-2xl text-xs text-white/30 space-y-1"
                style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
                <div className="font-semibold text-indigo-400 mb-2">Что такое Instruction Tuning?</div>
                <p>Это способ специализировать модель без изменения её весов — через обучающие примеры (вопрос→ответ) и системный промпт. Это законный и признанный метод адаптации ИИ.</p>
                <p className="mt-2">После сохранения настроек — перейдите в раздел «Обучение» чтобы добавить примеры, затем сформируйте юридический документ.</p>
              </div>
            </div>
          )}

          {/* ── ОБУЧАЮЩИЕ ДАННЫЕ ── */}
          {tab === "training" && (
            <div className="space-y-5 max-w-3xl">
              <div>
                <h2 className="text-2xl font-bold text-white">Обучающие данные</h2>
                <p className="text-white/40 text-sm mt-1">{training.length} примеров — каждый фиксируется в журнале</p>
              </div>

              {/* Форма добавления */}
              <div className="p-5 rounded-2xl space-y-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Добавить обучающий пример</div>

                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Вопрос / Инструкция</label>
                  <textarea value={newInstruction} onChange={e => setNewInstruction(e.target.value)}
                    placeholder="Например: Как подать заявление в суд?"
                    rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Ответ / Результат</label>
                  <textarea value={newResponse} onChange={e => setNewResponse(e.target.value)}
                    placeholder="Для подачи заявления в суд необходимо..."
                    rows={4} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-white/40 mb-1.5">Категория</label>
                    <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)}
                      placeholder="legal, faq, technical..."
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Качество: {newScore}/10</label>
                    <input type="range" min="1" max="10" value={newScore} onChange={e => setNewScore(parseInt(e.target.value))}
                      className="w-32 accent-indigo-500" />
                  </div>
                  <button onClick={addTraining} disabled={loading}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)", marginTop: "20px" }}>
                    <Icon name="Plus" size={15} className="inline mr-1" />
                    Добавить
                  </button>
                </div>
              </div>

              {/* Список примеров */}
              <div className="space-y-3">
                {training.map(t => (
                  <div key={t.id} className="p-4 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}>#{t.id}</span>
                        <span className="text-[10px] text-white/30">{t.category}</span>
                        <span className="text-[10px] text-amber-400">★ {t.quality_score}/10</span>
                        <span className="text-[10px] text-white/20">{fmtDate(t.created_at)}</span>
                      </div>
                      <button onClick={() => deleteTraining(t.id)}
                        className="text-white/20 hover:text-red-400 transition-colors p-1">
                        <Icon name="Trash2" size={13} />
                      </button>
                    </div>
                    <div className="text-sm text-white/80 font-medium mb-1">Q: {t.instruction}</div>
                    <div className="text-xs text-white/45 leading-relaxed">A: {t.response.slice(0, 200)}{t.response.length > 200 ? "..." : ""}</div>
                  </div>
                ))}
                {training.length === 0 && (
                  <div className="text-center py-12 text-white/25">
                    <Icon name="BookOpen" size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Пока нет обучающих примеров</p>
                    <p className="text-xs mt-1">Добавьте пары вопрос-ответ выше</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ДОКУМЕНТЫ ── */}
          {tab === "document" && (
            <div className="space-y-5 max-w-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Юридические документы</h2>
                  <p className="text-white/40 text-sm mt-1">Декларации об использовании открытых моделей</p>
                </div>
                <button onClick={generateDoc} disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all"
                  style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}>
                  <Icon name="FilePlus" size={15} />
                  Новый документ
                </button>
              </div>

              {/* Сгенерированный документ */}
              {generatedDoc && (
                <div className="p-5 rounded-2xl space-y-3"
                  style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.25)" }}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-indigo-400">Последний сформированный документ</div>
                    <button onClick={downloadDoc}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                      style={{ background: "rgba(99,102,241,0.3)", border: "1px solid rgba(99,102,241,0.5)" }}>
                      <Icon name="Download" size={13} />
                      Скачать .txt
                    </button>
                  </div>
                  <pre className="text-xs text-white/60 leading-relaxed overflow-auto max-h-96 font-mono whitespace-pre-wrap"
                    style={{ background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: "8px" }}>
                    {generatedDoc}
                  </pre>
                </div>
              )}

              {/* Список документов */}
              <div className="space-y-3">
                {docs.map(d => (
                  <div key={d.id} className="p-4 rounded-2xl flex items-center gap-4"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(99,102,241,0.15)" }}>
                      <Icon name="FileText" size={16} className="text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-white">{d.title}</div>
                      <div className="text-[10px] text-white/30 mt-0.5">
                        {d.base_model} · {d.owner_name} · {fmtDate(d.created_at)}
                      </div>
                      <div className="text-[10px] font-mono text-white/20 mt-0.5">SHA: {d.doc_hash}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(0,200,160,0.1)", color: "#00c8a0" }}>
                      Декларация
                    </span>
                  </div>
                ))}
                {docs.length === 0 && (
                  <div className="text-center py-12 text-white/25">
                    <Icon name="FileText" size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Документов ещё нет</p>
                    <p className="text-xs mt-1">Сначала сохраните конфигурацию модели, затем нажмите «Новый документ»</p>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl text-xs text-white/30 space-y-2"
                style={{ background: "rgba(0,200,160,0.04)", border: "1px solid rgba(0,200,160,0.15)" }}>
                <div className="font-semibold text-emerald-400">Юридическая справка</div>
                <p>Декларация подтверждает: (1) вы используете легальную open-source модель, (2) соблюдаете её лицензию, (3) все изменения — ваша оригинальная работа. Этого достаточно для защиты от претензий по авторским правам при использовании Apache 2.0 и MIT моделей.</p>
              </div>
            </div>
          )}

          {/* ── ЖУРНАЛ ── */}
          {tab === "log" && (
            <div className="space-y-5 max-w-3xl">
              <div>
                <h2 className="text-2xl font-bold text-white">Журнал дообучения</h2>
                <p className="text-white/40 text-sm mt-1">Все действия с моделью фиксируются с временной меткой</p>
              </div>
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                      <th className="text-left px-4 py-3 text-white/30 text-xs font-medium">Дата</th>
                      <th className="text-left px-4 py-3 text-white/30 text-xs font-medium">Действие</th>
                      <th className="text-left px-4 py-3 text-white/30 text-xs font-medium hidden md:table-cell">Детали</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(l => (
                      <tr key={l.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td className="px-4 py-3 text-white/30 text-xs whitespace-nowrap">{fmtDate(l.created_at)}</td>
                        <td className="px-4 py-3 text-white/80 text-xs">{l.action}</td>
                        <td className="px-4 py-3 text-white/35 text-xs hidden md:table-cell max-w-xs truncate">{l.details || "—"}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-12 text-center text-white/25">
                          <Icon name="ScrollText" size={32} className="mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Журнал пуст</p>
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
