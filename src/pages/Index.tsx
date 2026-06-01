import { useState } from "react";
import EcsuSystem from "@/pages/EcsuSystem";

const USERS: Record<string, { password: string; role: "admin" | "user"; name: string }> = {
  admin: { password: "admin123", role: "admin", name: "Администратор" },
  operator: { password: "ecsu2026", role: "user", name: "Оператор" },
  analyst: { password: "dalan001", role: "user", name: "Аналитик" },
};

const Index = () => {
  const [role, setRole] = useState<"admin" | "user" | null>(null);
  const [userName, setUserName] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const user = USERS[login.toLowerCase()];
    if (user && user.password === password) {
      setRole(user.role);
      setUserName(user.name);
      setError("");
    } else {
      setError("Неверный логин или пароль");
    }
  };

  if (role) {
    return (
      <EcsuSystem
        role={role}
        userName={userName}
        onLogout={() => { setRole(null); setLogin(""); setPassword(""); }}
      />
    );
  }

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
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="Введите логин..."
            className="w-full bg-[#060d1f] border border-blue-900/30 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-700"
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

        <div className="mt-4 bg-[#060d1f] rounded-lg p-3 text-xs text-gray-600 space-y-1">
          <div className="text-gray-500 font-medium mb-1">Доступные аккаунты:</div>
          <div>· <span className="text-gray-400">admin</span> / admin123 — Администратор</div>
          <div>· <span className="text-gray-400">operator</span> / ecsu2026 — Оператор</div>
          <div>· <span className="text-gray-400">analyst</span> / dalan001 — Аналитик</div>
        </div>

        <div className="text-center text-gray-700 text-xs mt-4">SYNERGON GLOBAL · УБО: Николаев В.В.</div>
      </div>
    </div>
  );
};

export default Index;
