import { useState } from "react";
import EcsuSystem from "@/pages/EcsuSystem";

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
      <div className="min-h-screen flex items-center justify-center bg-[#080c1a]">
        <div className="bg-[#0d1225] border border-blue-900/40 rounded-xl p-8 w-full max-w-sm shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="text-white text-2xl font-bold">ЕЦСУ 2.0</div>
            <div className="text-blue-400 text-sm mt-1">Единая Центральная Система Управления</div>
            <div className="text-gray-500 text-xs mt-2">DALAN · Авторизация</div>
          </div>
          <div className="mb-3">
            <div className="text-gray-500 text-xs mb-1">Логин</div>
            <input
              type="text"
              defaultValue="Admin"
              readOnly
              className="w-full bg-[#060d1f] border border-blue-900/30 text-gray-400 rounded-lg px-4 py-3 text-sm"
            />
          </div>
          <div className="mb-3">
            <div className="text-gray-500 text-xs mb-1">Пароль</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Введите пароль..."
              className="w-full bg-[#060d1f] border border-blue-900/30 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-700"
            />
          </div>
          {error && (
            <div className="bg-[#e94560]/10 border border-[#e94560]/30 text-[#e94560] text-sm px-3 py-2 rounded-lg mb-3 flex items-center gap-2">
              <span>⚠</span> {error}
            </div>
          )}
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors mt-1"
          >
            Войти
          </button>
          <div className="text-center text-gray-700 text-xs mt-4">SYNERGON GLOBAL · УБО: Николаев В.В.</div>
        </div>
      </div>
    );
  }

  return <EcsuSystem onLogout={() => setAuthenticated(false)} />;
};

export default Index;
