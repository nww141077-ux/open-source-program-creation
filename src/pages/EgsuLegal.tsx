import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/7425192d-b613-4c55-bdb8-01479a9f0d24";

const CAT_LABELS: Record<string, string> = {
  constitution: "Конституция",
  criminal: "Уголовный кодекс",
  civil: "Гражданский кодекс",
  procedural: "Процессуальный кодекс",
  international: "Международное право",
};

const CAT_COLORS: Record<string, string> = {
  constitution: "#00ff87",
  criminal: "#f43f5e",
  civil: "#3b82f6",
  procedural: "#f59e0b",
  international: "#a855f7",
};

const CAT_ICONS: Record<string, string> = {
  constitution: "Landmark",
  criminal: "Gavel",
  civil: "Scale",
  procedural: "ClipboardList",
  international: "Globe",
};

type Jurisdiction = { id: number; code: string; name: string; country: string; type: string; doc_count: number };
type LegalDoc = { id: number; code: string; title: string; category: string; description: string; adopted_year: number; jurisdiction: string; jcode: string; article_count: number };
type Article = { id: number; article_number: string; title: string; content: string; tags: string[]; doc_title: string; doc_code: string; jurisdiction: string };

export default function EgsuLegal() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"docs" | "search" | "jurisdictions">("docs");
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [docs, setDocs] = useState<LegalDoc[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedJur, setSelectedJur] = useState<number | null>(null);
  const [selectedCat, setSelectedCat] = useState<string>("");
  const [selectedDoc, setSelectedDoc] = useState<LegalDoc | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ jurisdictions: number; documents: number; articles: number } | null>(null);

  useEffect(() => {
    fetch(API).then(r => r.json()).then(d => {
      const data = typeof d === "string" ? JSON.parse(d) : d;
      if (data?.stats) setStats(data.stats);
    }).catch(() => {});
    fetch(`${API}/jurisdictions`).then(r => r.json()).then(d => {
      const data = typeof d === "string" ? JSON.parse(d) : d;
      setJurisdictions(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    let url = `${API}/documents?`;
    if (selectedJur) url += `jurisdiction_id=${selectedJur}&`;
    if (selectedCat) url += `category=${selectedCat}`;
    fetch(url).then(r => r.json()).then(d => {
      const data = typeof d === "string" ? JSON.parse(d) : d;
      setDocs(Array.isArray(data) ? data : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selectedJur, selectedCat]);

  const loadArticles = (doc: LegalDoc) => {
    setSelectedDoc(doc);
    setLoading(true);
    fetch(`${API}/articles?document_id=${doc.id}`).then(r => r.json()).then(d => {
      const data = typeof d === "string" ? JSON.parse(d) : d;
      setArticles(Array.isArray(data) ? data : []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  const doSearch = () => {
    if (!searchInput.trim()) return;
    setSearchQ(searchInput);
    setLoading(true);
    fetch(`${API}/articles?q=${encodeURIComponent(searchInput)}`).then(r => r.json()).then(d => {
      const data = typeof d === "string" ? JSON.parse(d) : d;
      setArticles(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  };

  const G = (s: string) => `linear-gradient(135deg, ${s})`;

  return (
    <div className="min-h-screen font-body" style={{ background: "#060a12" }}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-3"
        style={{ background: "rgba(6,10,18,0.97)", borderBottom: "1px solid rgba(168,85,247,0.15)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/egsu/dashboard")}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
            <Icon name="ChevronLeft" size={16} />
          </button>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: G("#a855f7, #3b82f6") }}>
            <Icon name="Scale" size={14} className="text-white" />
          </div>
          <div>
            <div className="font-display text-base font-bold text-white tracking-wide leading-none">ПРАВОВАЯ БАЗА ECSU</div>
            <div className="text-white/30 text-[10px]">Юрисдикции · Кодексы · Статьи</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stats && (
            <div className="hidden md:flex items-center gap-4 mr-4">
              {[
                { label: "Юрисдикций", val: stats.jurisdictions, color: "#00ff87" },
                { label: "Документов", val: stats.documents, color: "#3b82f6" },
                { label: "Статей", val: stats.articles, color: "#a855f7" },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="font-bold text-sm" style={{ color: s.color }}>{s.val}</div>
                  <div className="text-white/30 text-[9px]">{s.label}</div>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => navigate("/egsu/api")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: "rgba(0,255,135,0.1)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.2)" }}>
            <Icon name="Plug" size={13} />
            <span className="hidden md:inline">API</span>
          </button>
        </div>
      </nav>

      <div className="pt-16 flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="fixed left-0 top-14 bottom-0 w-14 md:w-60 flex flex-col py-4 gap-1 px-2 overflow-y-auto"
          style={{ background: "rgba(6,10,18,0.95)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>

          <div className="hidden md:block px-3 py-2 text-white/20 text-[10px] uppercase tracking-widest font-semibold">Разделы</div>
          {[
            { id: "docs", icon: "BookOpen", label: "Документы" },
            { id: "search", icon: "Search", label: "Поиск по статьям" },
            { id: "jurisdictions", icon: "Globe", label: "Юрисдикции" },
          ].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id as typeof tab); setSelectedDoc(null); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left"
              style={{
                background: tab === t.id ? "rgba(168,85,247,0.12)" : "transparent",
                color: tab === t.id ? "#a855f7" : "rgba(255,255,255,0.4)",
                border: tab === t.id ? "1px solid rgba(168,85,247,0.25)" : "1px solid transparent",
              }}>
              <Icon name={t.icon as "BookOpen"} size={16} />
              <span className="hidden md:block">{t.label}</span>
            </button>
          ))}

          <div className="hidden md:block px-3 py-2 mt-3 text-white/20 text-[10px] uppercase tracking-widest font-semibold">Фильтр по типу</div>
          {Object.entries(CAT_LABELS).map(([cat, label]) => (
            <button key={cat} onClick={() => { setSelectedCat(selectedCat === cat ? "" : cat); setSelectedDoc(null); setTab("docs"); }}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all w-full text-left"
              style={{
                background: selectedCat === cat ? `${CAT_COLORS[cat]}15` : "transparent",
                color: selectedCat === cat ? CAT_COLORS[cat] : "rgba(255,255,255,0.35)",
                border: selectedCat === cat ? `1px solid ${CAT_COLORS[cat]}30` : "1px solid transparent",
              }}>
              <Icon name={CAT_ICONS[cat] as "Scale"} size={14} />
              <span className="hidden md:block leading-tight">{label}</span>
            </button>
          ))}

          <div className="hidden md:block px-3 py-2 mt-3 text-white/20 text-[10px] uppercase tracking-widest font-semibold">Фильтр по стране</div>
          {jurisdictions.map(j => (
            <button key={j.id} onClick={() => { setSelectedJur(selectedJur === j.id ? null : j.id); setSelectedDoc(null); setTab("docs"); }}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all w-full text-left"
              style={{
                background: selectedJur === j.id ? "rgba(59,130,246,0.12)" : "transparent",
                color: selectedJur === j.id ? "#3b82f6" : "rgba(255,255,255,0.35)",
                border: selectedJur === j.id ? "1px solid rgba(59,130,246,0.25)" : "1px solid transparent",
              }}>
              <Icon name="Flag" size={14} />
              <span className="hidden md:block leading-tight">{j.name} <span className="text-white/20">({j.doc_count})</span></span>
            </button>
          ))}
        </aside>

        {/* MAIN */}
        <main className="flex-1 ml-14 md:ml-60 p-4 md:p-8">

          {/* Просмотр статей документа */}
          {selectedDoc && tab === "docs" && (
            <div>
              <button onClick={() => setSelectedDoc(null)}
                className="flex items-center gap-2 text-white/40 hover:text-white/70 mb-6 transition-colors text-sm">
                <Icon name="ChevronLeft" size={16} />
                Назад к документам
              </button>
              <div className="mb-6 p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${CAT_COLORS[selectedDoc.category]}20` }}>
                    <Icon name={CAT_ICONS[selectedDoc.category] as "Scale"} size={20} style={{ color: CAT_COLORS[selectedDoc.category] }} />
                  </div>
                  <div>
                    <div className="text-white font-bold text-lg">{selectedDoc.title}</div>
                    <div className="text-white/40 text-sm mt-1">{selectedDoc.description}</div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${CAT_COLORS[selectedDoc.category]}20`, color: CAT_COLORS[selectedDoc.category] }}>
                        {CAT_LABELS[selectedDoc.category]}
                      </span>
                      <span className="text-white/30 text-xs">{selectedDoc.jurisdiction} · {selectedDoc.adopted_year} г.</span>
                      <span className="text-white/30 text-xs">{selectedDoc.article_count} статей</span>
                    </div>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-16 text-white/30">Загружаю статьи...</div>
              ) : (
                <div className="space-y-3">
                  {articles.map(a => (
                    <div key={a.id} className="p-5 rounded-2xl transition-all"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-white/80 text-sm">{a.article_number}</span>
                        {a.title && <span className="text-white/50 text-sm">— {a.title}</span>}
                      </div>
                      <p className="text-white/70 text-sm leading-relaxed">{a.content}</p>
                      {a.tags && a.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {a.tags.map(tag => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full text-white/40"
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {articles.length === 0 && <div className="text-center py-12 text-white/30">Статьи не найдены</div>}
                </div>
              )}
            </div>
          )}

          {/* Список документов */}
          {!selectedDoc && tab === "docs" && (
            <div>
              <div className="mb-6">
                <h1 className="font-display text-2xl font-bold text-white uppercase">Правовая База</h1>
                <p className="text-white/30 text-sm mt-1">Конституции, кодексы, международное право</p>
              </div>
              {loading ? (
                <div className="text-center py-16 text-white/30">Загружаю...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {docs.map(doc => (
                    <button key={doc.id} onClick={() => loadArticles(doc)}
                      className="p-5 rounded-2xl text-left transition-all hover:scale-[1.02] group"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110"
                          style={{ background: `${CAT_COLORS[doc.category]}20` }}>
                          <Icon name={CAT_ICONS[doc.category] as "Scale"} size={20} style={{ color: CAT_COLORS[doc.category] }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-semibold text-sm leading-tight">{doc.title}</div>
                          <div className="text-white/40 text-xs mt-1 line-clamp-2">{doc.description}</div>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${CAT_COLORS[doc.category]}15`, color: CAT_COLORS[doc.category] }}>
                              {CAT_LABELS[doc.category]}
                            </span>
                            <span className="text-white/25 text-[10px]">{doc.adopted_year} г.</span>
                            <span className="text-white/25 text-[10px]">{doc.article_count} ст.</span>
                          </div>
                        </div>
                        <Icon name="ChevronRight" size={16} className="text-white/20 group-hover:text-white/50 transition-colors shrink-0 mt-1" />
                      </div>
                    </button>
                  ))}
                  {docs.length === 0 && <div className="col-span-2 text-center py-16 text-white/30">Документы не найдены</div>}
                </div>
              )}
            </div>
          )}

          {/* Поиск */}
          {tab === "search" && (
            <div>
              <div className="mb-6">
                <h1 className="font-display text-2xl font-bold text-white uppercase">Поиск по статьям</h1>
                <p className="text-white/30 text-sm mt-1">Полнотекстовый поиск по всей правовой базе</p>
              </div>
              <div className="flex gap-3 mb-8">
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && doSearch()}
                  placeholder="Например: экология, кибератака, права человека..."
                  className="flex-1 px-4 py-3 rounded-xl text-white text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
                <button onClick={doSearch}
                  className="px-5 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                  style={{ background: G("#a855f7, #3b82f6"), color: "white" }}>
                  <Icon name="Search" size={18} />
                </button>
              </div>

              {searchQ && <div className="mb-4 text-white/40 text-sm">Результаты по запросу: <span className="text-white/70">«{searchQ}»</span> — {articles.length} статей</div>}

              {loading ? (
                <div className="text-center py-16 text-white/30">Ищу...</div>
              ) : (
                <div className="space-y-3">
                  {articles.map(a => (
                    <div key={a.id} className="p-5 rounded-2xl"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white/50 text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7" }}>{a.doc_code}</span>
                        <span className="text-white/60 text-sm font-semibold">{a.article_number}</span>
                        {a.title && <span className="text-white/40 text-sm">— {a.title}</span>}
                      </div>
                      <p className="text-white/65 text-sm leading-relaxed">{a.content}</p>
                      <div className="text-white/25 text-xs mt-2">{a.jurisdiction} · {a.doc_title}</div>
                      {a.tags && a.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {a.tags.map(tag => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full text-white/35"
                              style={{ background: "rgba(255,255,255,0.05)" }}>{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {searchQ && articles.length === 0 && !loading && (
                    <div className="text-center py-12 text-white/30">Ничего не найдено по запросу «{searchQ}»</div>
                  )}
                  {!searchQ && (
                    <div className="text-center py-16 text-white/20">
                      <Icon name="Search" size={40} className="mx-auto mb-3 opacity-30" />
                      <p>Введите запрос для поиска</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Юрисдикции */}
          {tab === "jurisdictions" && (
            <div>
              <div className="mb-6">
                <h1 className="font-display text-2xl font-bold text-white uppercase">Юрисдикции</h1>
                <p className="text-white/30 text-sm mt-1">Правовые системы и их документы</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jurisdictions.map(j => (
                  <div key={j.id} className="p-5 rounded-2xl cursor-pointer hover:scale-[1.01] transition-all"
                    onClick={() => { setSelectedJur(j.id); setTab("docs"); }}
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: j.type === "international" ? "rgba(168,85,247,0.2)" : "rgba(0,255,135,0.15)" }}>
                        <Icon name={j.type === "international" ? "Globe" : "Flag"} size={18}
                          style={{ color: j.type === "international" ? "#a855f7" : "#00ff87" }} />
                      </div>
                      <div>
                        <div className="text-white font-bold">{j.name}</div>
                        <div className="text-white/40 text-xs">{j.country}</div>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="text-2xl font-bold" style={{ color: j.type === "international" ? "#a855f7" : "#00ff87" }}>{j.doc_count}</div>
                        <div className="text-white/30 text-xs">документов</div>
                      </div>
                    </div>
                    <div className="text-xs px-2 py-0.5 rounded-full inline-block"
                      style={{ background: j.type === "international" ? "rgba(168,85,247,0.15)" : "rgba(0,255,135,0.1)", color: j.type === "international" ? "#a855f7" : "#00ff87" }}>
                      {j.type === "international" ? "Международное" : j.type === "national" ? "Национальное" : "Региональное"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}