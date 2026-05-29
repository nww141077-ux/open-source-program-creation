import { useState } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  onLogin: () => void;
}

export default function EcsuLogin({ onLogin }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (password === "2134") {
      onLogin();
    } else {
      setError("Доступ запрещён");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-[#080c1a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Icon name="Shield" size={28} className="text-white" />
          </div>
          <div className="text-2xl font-bold text-white tracking-widest">ECSU</div>
          <div className="text-blue-400 text-xs mt-1 tracking-widest">СИСТЕМА КОНТРОЛЯ · 2026</div>
        </div>

        <div className="bg-[#0d1225] border border-blue-900/40 rounded-2xl p-6">
          <div className="text-white font-semibold mb-1">Авторизация</div>
          <div className="text-gray-500 text-xs mb-5">Только для владельца системы</div>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Пароль"
            className="w-full bg-[#060d1f] border border-blue-900/40 text-white rounded-lg px-4 py-3 mb-3 focus:outline-none focus:border-blue-500/60 placeholder-gray-600 transition-colors"
          />
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm mb-3">
              <Icon name="AlertCircle" size={14} />
              {error}
            </div>
          )}
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Войти в систему
          </button>
        </div>

        <div className="text-center mt-6 text-gray-700 text-xs">
          SYNERGON GLOBAL · Николаев В.В. · 2026
        </div>
      </div>
    </div>
  );
}