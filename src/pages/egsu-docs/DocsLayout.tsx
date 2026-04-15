import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const TODAY = "13 апреля 2026 г.";

const DOCS = [
  { id: "copyright",    icon: "FileText",   color: "#00ff87", label: "Свидетельство об авторском праве" },
  { id: "modification", icon: "GitBranch",  color: "#e879f9", label: "Право на модификацию и гибридное моделирование" },
  { id: "fips",         icon: "Stamp",      color: "#06b6d4", label: "Заявка в Роспатент (ФИПС)" },
  { id: "mincifra",     icon: "Building2",  color: "#f97316", label: "Заявка в реестр Минцифры" },
  { id: "payment",      icon: "CreditCard", color: "#10b981", label: "Настройка платёжной системы" },
  { id: "partnership",  icon: "Handshake",  color: "#a855f7", label: "Партнёрское соглашение" },
  { id: "privacy",      icon: "Shield",     color: "#3b82f6", label: "Политика конфиденциальности" },
  { id: "terms",        icon: "Scale",      color: "#f59e0b", label: "Пользовательское соглашение" },
  { id: "legalization", icon: "Globe",      color: "#f43f5e", label: "Заявление о легализации проекта" },
  { id: "aihub",        icon: "Bot",        color: "#06b6d4", label: "ТЗ: ИИ‑хаб командный центр" },
  { id: "grafium",      icon: "BookOpen",   color: "#f59e0b", label: "ТЗ: Ежедневник «Графиум»" },
  { id: "cpvoa",        icon: "Radio",      color: "#4CAF50", label: "ТЗ: ЦПВОА — интерфейс поисковика" },
];

type Props = {
  activeDoc: string;
  setActiveDoc: (id: string) => void;
  children: React.ReactNode;
};

export { DOCS };

export default function DocsLayout({ activeDoc, setActiveDoc, children }: Props) {
  const navigate = useNavigate();

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen font-body" style={{ background: "#060a12" }}>
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .doc-print { color: black; font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }
          .print-area { background: white !important; box-shadow: none !important; border: none !important; padding: 2cm !important; }
        }
        .doc-print { font-family: 'Times New Roman', Georgia, serif; }
      `}</style>

      {/* NAV */}
      <nav className="no-print fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-3"
        style={{ background: "rgba(6,10,18,0.97)", borderBottom: "1px solid rgba(168,85,247,0.15)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/egsu/dashboard")}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
            <Icon name="ChevronLeft" size={16} />
          </button>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
            <Icon name="FileText" size={14} className="text-white" />
          </div>
          <div>
            <div className="font-display text-base font-bold text-white tracking-wide leading-none">ДОКУМЕНТЫ ЕЦСУ</div>
            <div className="text-white/30 text-[10px]">Юридический пакет · Версия 1.0</div>
          </div>
        </div>
        <button onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-black transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, #00ff87, #3b82f6)" }}>
          <Icon name="Printer" size={15} />
          <span>Печать</span>
        </button>
      </nav>

      <div className="pt-14 flex">
        {/* SIDEBAR */}
        <aside className="no-print fixed left-0 top-14 bottom-0 w-14 md:w-64 flex flex-col py-4 gap-1 px-2"
          style={{ background: "rgba(6,10,18,0.95)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="hidden md:block px-3 py-2 text-white/20 text-[10px] uppercase tracking-widest font-semibold mb-1">Выберите документ</div>
          {DOCS.map((doc) => (
            <button key={doc.id} onClick={() => setActiveDoc(doc.id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left"
              style={{
                background: activeDoc === doc.id ? `${doc.color}15` : "transparent",
                color: activeDoc === doc.id ? doc.color : "rgba(255,255,255,0.4)",
                border: activeDoc === doc.id ? `1px solid ${doc.color}30` : "1px solid transparent",
              }}>
              <Icon name={doc.icon as "FileText"} size={17} />
              <span className="hidden md:block text-xs leading-tight">{doc.label}</span>
            </button>
          ))}

          <div className="mt-auto hidden md:block px-3 py-3">
            <div className="p-3 rounded-xl text-xs text-white/30 leading-relaxed"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              Правообладатель:<br />
              <span className="text-white/50 font-semibold">Николаев В.В.</span><br />
              <span className="text-white/30">Все права защищены · 2026</span>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 ml-14 md:ml-64 p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
            <div className="no-print mb-6 flex items-center justify-between">
              <div>
                <h1 className="font-display text-xl font-bold text-white uppercase">
                  {DOCS.find(d => d.id === activeDoc)?.label}
                </h1>
                <p className="text-white/30 text-sm mt-0.5">ЕЦСУ 2.0 · {TODAY}</p>
              </div>
              <button onClick={handlePrint}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                style={{ background: "rgba(0,255,135,0.1)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.2)" }}>
                <Icon name="Printer" size={14} />
                Распечатать
              </button>
            </div>

            <div className="print-area rounded-2xl p-8 md:p-12"
              style={{ background: "white", boxShadow: "0 0 60px rgba(0,0,0,0.5)" }}>
              {children}
            </div>

            <div className="no-print mt-4 text-center text-white/20 text-xs">
              Для печати нажмите кнопку «Печать» или Ctrl+P
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}