import { useState } from "react";
import { Zap, ArrowRight } from "lucide-react";
import NexaflowDashboard from "@/components/nexaflow/NexaflowDashboard";

export default function Index() {
  const [showLogin, setShowLogin] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (password === "nww.") {
      setAuthenticated(true);
      setShowLogin(false);
    } else {
      setError("Неверный пароль");
      setPassword("");
    }
  };

  if (authenticated) {
    return <NexaflowDashboard onLogout={() => setAuthenticated(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-black" />
          </div>
          <span className="font-bold text-white text-lg tracking-wide">NEXAFLOW</span>
        </div>
        <button
          onClick={() => setShowLogin(true)}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
        >
          Войти
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col px-5 pt-8 pb-10">
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-medium">Платформа интеграций нового поколения</span>
          </div>
          <h1 className="text-5xl font-black leading-none mb-2">
            <span className="text-white">ОБЪЕДИНИТЕ</span><br />
            <span className="bg-gradient-to-r from-green-400 to-purple-500 bg-clip-text text-transparent">ВСЁ В ОДНОМ</span><br />
            <span className="text-gray-500">ПОТОКЕ</span><br />
            <span className="text-gray-600">ДАННЫХ</span>
          </h1>
        </div>

        <p className="text-gray-400 text-base leading-relaxed mb-10">
          NexaFlow — единая платформа для интеграции всех ваших сервисов, автоматизации процессов и управления данными в реальном времени.
        </p>

        {/* CTA блок */}
        <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
          <button className="w-full bg-gradient-to-r from-green-400 to-teal-400 text-black font-bold py-4 rounded-xl text-base flex items-center justify-center gap-2">
            Начать бесплатно <ArrowRight size={18} />
          </button>
          <button className="w-full bg-white/5 border border-white/10 text-white font-semibold py-4 rounded-xl text-base">
            Связаться с командой
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-5 py-6 border-t border-white/5 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-black" />
          </div>
          <span className="font-bold text-white tracking-wide">NEXAFLOW</span>
        </div>
        <p className="text-gray-600 text-xs text-center">© 2026 NexaFlow. Все права защищены.</p>
      </footer>

      {/* Модальный вход для владельца */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-sm">
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-3">
                <Zap size={22} className="text-black" />
              </div>
              <div className="text-xl font-bold text-white">NEXAFLOW</div>
              <div className="text-gray-500 text-sm mt-1">Панель владельца</div>
            </div>
            <div className="bg-[#1a1d27] border border-white/10 rounded-2xl p-6">
              <div className="text-white font-semibold mb-4">Вход</div>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Пароль"
                autoFocus
                className="w-full bg-[#0f1117] border border-white/10 text-white rounded-lg px-4 py-3 mb-3 focus:outline-none focus:border-green-500/50 placeholder-gray-600 transition-colors"
              />
              {error && <div className="text-red-400 text-sm mb-3">{error}</div>}
              <button
                onClick={handleLogin}
                className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-3 rounded-lg transition-colors mb-3"
              >
                Войти
              </button>
              <button
                onClick={() => { setShowLogin(false); setPassword(""); setError(""); }}
                className="w-full text-gray-500 hover:text-white text-sm transition-colors py-1"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
