import { useState } from "react";
import { Zap } from "lucide-react";

interface Props {
  onLogin: () => void;
}

export default function NexaflowLogin({ onLogin }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (password === "nww.") {
      onLogin();
    } else {
      setError("Неверный пароль");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4">
            <Zap size={24} className="text-black" />
          </div>
          <div className="text-2xl font-bold text-white tracking-wide">NEXAFLOW</div>
          <div className="text-gray-500 text-sm mt-1">Панель управления</div>
        </div>

        <div className="bg-[#1a1d27] border border-white/10 rounded-2xl p-6">
          <div className="text-white font-semibold mb-4">Вход</div>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Пароль"
            className="w-full bg-[#0f1117] border border-white/10 text-white rounded-lg px-4 py-3 mb-3 focus:outline-none focus:border-green-500/50 placeholder-gray-600 transition-colors"
          />
          {error && <div className="text-red-400 text-sm mb-3">{error}</div>}
          <button
            onClick={handleLogin}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-3 rounded-lg transition-colors"
          >
            Войти
          </button>
        </div>
      </div>
    </div>
  );
}
