import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "#070c18", color: "white" }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center gap-4 mb-10">
        <div
          className="w-20 h-20 rounded-3xl overflow-hidden shadow-2xl"
          style={{ border: "2px solid rgba(99,102,241,0.4)" }}
        >
          <img
            src="https://cdn.poehali.dev/projects/61a665c2-cff9-41a1-9a78-364c960d2ecc/files/b6febfaf-40c2-4548-8fdd-40a5dead615d.jpg"
            alt="EGSU"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-white tracking-tight">EGSU</div>
          <div className="text-sm text-indigo-400/70 mt-1">
            Единая государственная система управления · 2.0
          </div>
        </div>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm mx-4 p-8 rounded-3xl flex flex-col gap-5"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(99,102,241,0.25)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="text-center mb-1">
          <div className="text-lg font-bold text-white">Добро пожаловать</div>
          <div className="text-sm text-white/40 mt-1">
            Войдите чтобы продолжить работу
          </div>
        </div>

        <button
          onClick={() => navigate("/egsu/dashboard")}
          className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] hover:opacity-95 active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
        >
          <Icon name="LayoutDashboard" size={17} />
          Открыть приложение
        </button>

        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          <span className="text-xs text-white/25">или</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
        </div>

        <button
          onClick={() => navigate("/admin")}
          className="w-full py-3 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 transition-all hover:opacity-80"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          <Icon name="ShieldCheck" size={15} />
          Вход для администратора
        </button>
      </div>

      {/* Footer */}
      <div className="mt-10 text-center text-xs text-white/20 space-y-1">
        <div>© 2026 Николаев Владимир Владимирович</div>
        <div>Все права защищены</div>
      </div>
    </div>
  );
}