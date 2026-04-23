import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const G = (s: string) => `linear-gradient(135deg, ${s})`;

type Tab = "overview" | "events" | "blocked" | "withdraw" | "manual";

type Props = {
  tab: Tab;
  setTab: (t: Tab) => void;
  pulse: boolean;
  absorptionBalance: number | null;
  eventsCount: number;
  blockedCount: number;
  showReport: boolean;
  setShowReport: (v: boolean) => void;
  saving: boolean;
  reportForm: { event_type: string; ip_address: string; description: string; endpoint: string; geo_country: string };
  setReportForm: (f: Props["reportForm"]) => void;
  onReportAttack: () => void;
  toast: string;
  children: React.ReactNode;
  penaltyRates: Record<string, number>;
  eventLabels: Record<string, string>;
  fmt: (n: number) => string;
};

export default function SecurityLayout({
  tab, setTab, pulse, absorptionBalance,
  eventsCount, blockedCount,
  showReport, setShowReport, saving,
  reportForm, setReportForm, onReportAttack,
  toast, children,
  penaltyRates, eventLabels, fmt,
}: Props) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen font-body" style={{ background: "#060a12" }}>

      {toast && (
        <div className="fixed top-20 right-6 z-[100] px-4 py-3 rounded-xl text-sm font-medium shadow-2xl"
          style={{ background: toast.startsWith("✓") ? "rgba(0,255,135,0.15)" : "rgba(244,63,94,0.15)", color: toast.startsWith("✓") ? "#00ff87" : "#f43f5e", border: `1px solid ${toast.startsWith("✓") ? "rgba(0,255,135,0.3)" : "rgba(244,63,94,0.3)"}`, backdropFilter: "blur(12px)" }}>
          {toast}
        </div>
      )}

      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14"
        style={{ background: "rgba(6,10,18,0.95)", borderBottom: "1px solid rgba(244,63,94,0.15)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: G("#f43f5e, #f59e0b") }}>
            <Icon name="ShieldAlert" size={16} className="text-white" />
          </div>
          <div>
            <div className="font-display text-base font-bold text-white tracking-wide leading-none">РЕЖИМ ПОГЛОЩЕНИЯ</div>
            <div className="text-white/30 text-[10px]">ABSORPTION MODE · Защита системы</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {absorptionBalance !== null && (
            <div className="flex items-center gap-3">
              <div className="text-center hidden md:block">
                <div className={`font-bold text-sm transition-all ${pulse ? "scale-110" : ""}`} style={{ color: "#f59e0b" }}>
                  {fmt(absorptionBalance)}
                </div>
                <div className="text-white/25 text-[9px]">Счёт поглощения</div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.3)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-red-400 text-xs font-bold tracking-widest">ACTIVE</span>
              </div>
            </div>
          )}
          <button
            onClick={() => navigate("/egsu/civil-claims")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
            style={{ background: "rgba(0,200,100,0.12)", border: "1px solid rgba(0,200,100,0.30)", color: "#00c864" }}>
            <Icon name="Scale" size={13} />
            <span className="hidden md:inline">Гражданские иски</span>
          </button>
          <button onClick={() => setShowReport(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
            style={{ background: G("#f43f5e, #f59e0b"), color: "white" }}>
            <Icon name="AlertTriangle" size={13} />
            <span className="hidden md:inline">Зафиксировать атаку</span>
          </button>
        </div>
      </nav>

      <div className="pt-14 flex min-h-screen">
        <aside className="fixed left-0 top-14 bottom-0 w-14 md:w-56 flex flex-col py-4 gap-1 px-2"
          style={{ background: "rgba(6,10,18,0.95)", borderRight: "1px solid rgba(244,63,94,0.1)" }}>
          {[
            { id: "overview", icon: "ShieldAlert", label: "Обзор" },
            { id: "events", icon: "Activity", label: `Журнал атак (${eventsCount})` },
            { id: "blocked", icon: "Ban", label: `Блок-лист (${blockedCount})` },
            { id: "withdraw", icon: "ArrowUpFromLine", label: "Вывод средств" },
            { id: "manual", icon: "PlusCircle", label: "Ручное начисление" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as Tab)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left"
              style={{
                background: tab === t.id ? "rgba(244,63,94,0.12)" : "transparent",
                color: tab === t.id ? "#f43f5e" : "rgba(255,255,255,0.4)",
                border: tab === t.id ? "1px solid rgba(244,63,94,0.25)" : "1px solid transparent",
              }}>
              <Icon name={t.icon as "ShieldAlert"} size={16} />
              <span className="hidden md:block text-xs">{t.label}</span>
            </button>
          ))}

          <div className="hidden md:block mt-auto px-3 pb-4">
            <div className="p-3 rounded-xl" style={{ background: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.15)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Shield" size={14} className="text-red-400" />
                <span className="text-white/50 text-[10px] uppercase tracking-widest">Уровень защиты</span>
              </div>
              <div className="font-bold text-red-400 text-sm">МАКСИМАЛЬНЫЙ</div>
              <div className="text-white/30 text-[10px] mt-1">Обновление каждые 15с</div>
            </div>
          </div>
        </aside>

        <main className="flex-1 ml-14 md:ml-56 p-4 md:p-6">
          {children}
        </main>
      </div>

      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setShowReport(false)}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: "#0d1220", border: "1px solid rgba(244,63,94,0.3)" }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ background: "rgba(244,63,94,0.07)", borderBottom: "1px solid rgba(244,63,94,0.15)" }}>
              <div className="flex items-center gap-2">
                <Icon name="AlertTriangle" size={18} className="text-red-400" />
                <span className="text-white font-bold">Зафиксировать атаку</span>
              </div>
              <button onClick={() => setShowReport(false)} className="text-white/30 hover:text-white/70">
                <Icon name="X" size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Тип атаки</label>
                <select value={reportForm.event_type} onChange={e => setReportForm({ ...reportForm, event_type: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {Object.entries(eventLabels).map(([k, v]) => (
                    <option key={k} value={k} style={{ background: "#0d1220" }}>{v} — {fmt(penaltyRates[k] ?? 0)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">IP-адрес атакующего *</label>
                <input value={reportForm.ip_address} onChange={e => setReportForm({ ...reportForm, ip_address: e.target.value })}
                  placeholder="185.220.101.47"
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none font-mono"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Описание *</label>
                <textarea value={reportForm.description} onChange={e => setReportForm({ ...reportForm, description: e.target.value })}
                  placeholder="Что произошло..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Endpoint</label>
                  <input value={reportForm.endpoint} onChange={e => setReportForm({ ...reportForm, endpoint: e.target.value })}
                    placeholder="/egsu/dashboard"
                    className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-wide block mb-1.5">Страна</label>
                  <input value={reportForm.geo_country} onChange={e => setReportForm({ ...reportForm, geo_country: e.target.value })}
                    placeholder="Россия / Unknown"
                    className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
              </div>
              <div className="p-3 rounded-xl flex items-center justify-between"
                style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <span className="text-white/50 text-sm">Штраф будет начислен:</span>
                <span className="font-bold" style={{ color: "#f59e0b" }}>{fmt(penaltyRates[reportForm.event_type] ?? 0)}</span>
              </div>
              <button onClick={onReportAttack} disabled={saving || !reportForm.ip_address || !reportForm.description}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-40"
                style={{ background: G("#f43f5e, #f59e0b"), color: "white" }}>
                {saving ? "Фиксирую..." : "Зафиксировать и начислить штраф"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}