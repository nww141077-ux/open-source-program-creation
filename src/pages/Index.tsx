import { useState } from "react";
import AdminPanel from "@/components/AdminPanel";

const ADMIN_PASSWORD = "admin123";

const Index = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError("");
    } else {
      setError("Неверный пароль");
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d1a]">
        <div className="bg-[#1a1a2e] border border-[#e94560]/30 rounded-xl p-8 w-full max-w-sm shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-[#e94560] text-3xl font-bold tracking-widest">ECSU</div>
            <div className="text-white text-lg font-semibold mt-1">DALAN — Панель управления</div>
            <div className="text-gray-500 text-sm mt-1">Введите пароль администратора</div>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Пароль"
            className="w-full bg-[#0d0d1a] border border-[#e94560]/30 text-white rounded-lg px-4 py-3 mb-3 focus:outline-none focus:border-[#e94560] placeholder-gray-600"
          />
          {error && <div className="text-red-400 text-sm mb-3">{error}</div>}
          <button
            onClick={handleLogin}
            className="w-full bg-[#e94560] hover:bg-[#c73550] text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  return <AdminPanel onLogout={() => setAuthenticated(false)} />;
};

export default Index;
