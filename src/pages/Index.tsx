import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, ArrowRight, X, Eye, EyeOff, Shield } from "lucide-react";
import NexaflowDashboard from "@/components/nexaflow/NexaflowDashboard";

const AUTH_URL = "https://functions.poehali.dev/ffe35261-9869-478f-8361-946fa981b34a";

type Screen = "landing" | "login" | "register";
type Role = "owner" | "user" | null;

interface UserSession {
  name: string;
  role: Role;
  token: string;
}

export default function Index() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>("landing");
  const [session, setSession] = useState<UserSession | null>(null);

  // owner login state
  const [ownerPassword, setOwnerPassword] = useState("");
  const [ownerError, setOwnerError] = useState("");
  const ownerTapsRef = useRef(0);
  const [showOwnerModal, setShowOwnerModal] = useState(false);

  // user form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // тап по логотипу 5 раз — показывает вход владельца
  const handleLogoTap = () => {
    ownerTapsRef.current += 1;
    if (ownerTapsRef.current >= 5) {
      ownerTapsRef.current = 0;
      setShowOwnerModal(true);
    }
  };

  const handleOwnerLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email: "nikolaevvladimir77@yandex.ru", password: ownerPassword }),
      });
      const data = await res.json();
      if (data.role === "owner") {
        setSession({ name: data.name || "Владимир", role: "owner", token: data.token });
        setShowOwnerModal(false);
        setOwnerPassword("");
      } else {
        setOwnerError("Неверный пароль");
        setOwnerPassword("");
      }
    } catch {
      setOwnerError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const handleUserAuth = async (action: "login" | "register") => {
    setError("");
    if (action === "register" && !name.trim()) { setError("Введите имя"); return; }
    if (!email.trim()) { setError("Введите email"); return; }
    if (!password) { setError("Введите пароль"); return; }

    setLoading(true);
    try {
      const body: Record<string, string> = { action, email, password };
      if (action === "register") body.name = name;

      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = JSON.parse(typeof (await res.clone().text()) === "string" ? await res.text() : "{}");

      if (!res.ok) {
        setError(data.error || "Ошибка");
      } else {
        setSession({ name: data.name, role: "user", token: data.token });
        setName(""); setEmail(""); setPassword("");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName(""); setEmail(""); setPassword(""); setError(""); setShowPass(false);
  };

  // Если залогинен как владелец — дашборд
  if (session?.role === "owner") {
    return <NexaflowDashboard onLogout={() => setSession(null)} />;
  }

  // Если залогинен как пользователь — простой кабинет
  if (session?.role === "user") {
    return (
      <div className="min-h-screen bg-[#0a0f1a] text-white flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
              <Shield size={22} className="text-white" />
            </div>
            <div className="text-xl font-bold">ЕЦСУ 2.0</div>
          </div>
          <div className="bg-[#1a1d27] border border-white/10 rounded-2xl p-6 text-center">
            <div className="w-14 h-14 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-green-400 font-bold text-2xl">{session.name[0].toUpperCase()}</span>
            </div>
            <div className="text-white font-semibold text-lg mb-1">{session.name}</div>
            <div className="text-gray-500 text-xs mb-6">Пользователь ЕЦСУ 2.0</div>
            <div className="bg-[#0f1117] rounded-xl p-4 mb-4 text-left">
              <div className="text-gray-400 text-xs mb-1">Статус аккаунта</div>
              <div className="text-green-400 text-sm font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Активен
              </div>
            </div>
            <button
              onClick={() => navigate("/ecsu")}
              className="w-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 mb-3"
            >
              <Shield size={16} />
              Перейти в ЕЦСУ
            </button>
            <button
              onClick={() => setSession(null)}
              className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4">
        <button onClick={handleLogoTap} className="flex items-center gap-2 select-none">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
            <Shield size={18} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-wide">ЕЦСУ 2.0</span>
        </button>
        <button
          onClick={() => { resetForm(); setScreen("login"); }}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 border border-white/10"
        >
          Войти
        </button>
      </header>

      {/* Landing */}
      {screen === "landing" && (
        <main className="flex-1 flex flex-col px-5 pt-8 pb-10">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1.5 mb-6 self-start">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-purple-400 text-xs font-medium">Цифровая платформа управления нового поколения</span>
          </div>
          <h1 className="text-5xl font-black leading-none mb-6">
            <span className="text-white">ЕДИНАЯ</span><br />
            <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">ЦЕНТРАЛЬНАЯ</span><br />
            <span className="text-gray-500">СИСТЕМА</span><br />
            <span className="text-gray-600">УПРАВЛЕНИЯ</span>
          </h1>
          <p className="text-gray-400 text-base leading-relaxed mb-10">
            ЕЦСУ 2.0 — платформа для мониторинга, верификации и реагирования на инциденты в сфере экологии, кибербезопасности и прав человека. Правообладатель: Николаев Владимир Владимирович.
          </p>
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
            <button
              onClick={() => { resetForm(); setScreen("register"); }}
              className="w-full bg-gradient-to-r from-green-400 to-teal-400 text-black font-bold py-4 rounded-xl text-base flex items-center justify-center gap-2"
            >
              Начать бесплатно <ArrowRight size={18} />
            </button>
            <button
              onClick={() => { resetForm(); setScreen("login"); }}
              className="w-full bg-white/5 border border-white/10 text-white font-semibold py-4 rounded-xl text-base"
            >
              Войти в аккаунт
            </button>
            <button
              onClick={() => navigate("/ecsu")}
              className="w-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 font-semibold py-4 rounded-xl text-base flex items-center justify-center gap-2 transition-colors"
            >
              <Shield size={18} />
              Открыть ЕЦСУ
            </button>
          </div>
        </main>
      )}

      {/* Регистрация */}
      {screen === "register" && (
        <main className="flex-1 flex flex-col px-5 pt-6 pb-10">
          <button onClick={() => setScreen("landing")} className="text-gray-500 hover:text-white text-sm mb-6 self-start flex items-center gap-1">
            ← Назад
          </button>
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-3">
              <Zap size={22} className="text-black" />
            </div>
            <div className="text-xl font-bold text-white">Создать аккаунт</div>
            <div className="text-gray-500 text-sm mt-1">Начните бесплатно</div>
          </div>
          <div className="bg-[#1a1d27] border border-white/10 rounded-2xl p-6 flex flex-col gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Ваше имя</label>
              <input type="text" placeholder="Имя" value={name}
                onChange={e => { setName(e.target.value); setError(""); }}
                className="w-full bg-[#0f1117] border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-green-500/50 placeholder-gray-600"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Email</label>
              <input type="email" placeholder="your@email.com" value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                className="w-full bg-[#0f1117] border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-green-500/50 placeholder-gray-600"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Пароль (минимум 6 символов)</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} placeholder="Пароль" value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleUserAuth("register")}
                  className="w-full bg-[#0f1117] border border-white/10 text-white rounded-lg px-4 py-3 pr-11 focus:outline-none focus:border-green-500/50 placeholder-gray-600"
                />
                <button onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <button
              onClick={() => handleUserAuth("register")}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold py-3 rounded-lg transition-colors mt-1"
            >
              {loading ? "Регистрация..." : "Создать аккаунт"}
            </button>
            <button onClick={() => { resetForm(); setScreen("login"); }}
              className="text-gray-500 hover:text-white text-sm text-center transition-colors">
              Уже есть аккаунт? Войти
            </button>
          </div>
        </main>
      )}

      {/* Вход */}
      {screen === "login" && (
        <main className="flex-1 flex flex-col px-5 pt-6 pb-10">
          <button onClick={() => setScreen("landing")} className="text-gray-500 hover:text-white text-sm mb-6 self-start">
            ← Назад
          </button>
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-3">
              <Zap size={22} className="text-black" />
            </div>
            <div className="text-xl font-bold text-white">Вход в NEXAFLOW</div>
            <div className="text-gray-500 text-sm mt-1">Введите данные аккаунта</div>
          </div>
          <div className="bg-[#1a1d27] border border-white/10 rounded-2xl p-6 flex flex-col gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Email</label>
              <input type="email" placeholder="your@email.com" value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                className="w-full bg-[#0f1117] border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-green-500/50 placeholder-gray-600"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Пароль</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} placeholder="Пароль" value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleUserAuth("login")}
                  className="w-full bg-[#0f1117] border border-white/10 text-white rounded-lg px-4 py-3 pr-11 focus:outline-none focus:border-green-500/50 placeholder-gray-600"
                />
                <button onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <button
              onClick={() => handleUserAuth("login")}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold py-3 rounded-lg transition-colors mt-1"
            >
              {loading ? "Вход..." : "Войти"}
            </button>
            <button onClick={() => { resetForm(); setScreen("register"); }}
              className="text-gray-500 hover:text-white text-sm text-center transition-colors">
              Нет аккаунта? Зарегистрироваться
            </button>
          </div>
        </main>
      )}

      {/* Footer */}
      {screen === "landing" && (
        <footer className="px-5 py-6 border-t border-white/5 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
              <Zap size={12} className="text-black" />
            </div>
            <span className="font-bold text-white text-sm tracking-wide">NEXAFLOW</span>
          </div>
          <p className="text-gray-700 text-xs">© 2026 NexaFlow. Все права защищены.</p>
        </footer>
      )}

      {/* Модальный вход владельца (5 тапов по логотипу) */}
      {showOwnerModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-xs">
            <div className="bg-[#1a1d27] border border-green-500/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <Zap size={15} className="text-black" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">Владелец</div>
                    <div className="text-gray-600 text-xs">Приватный вход</div>
                  </div>
                </div>
                <button onClick={() => { setShowOwnerModal(false); setOwnerPassword(""); setOwnerError(""); }}
                  className="text-gray-600 hover:text-white"><X size={18} /></button>
              </div>
              <input
                type="password"
                value={ownerPassword}
                onChange={e => { setOwnerPassword(e.target.value); setOwnerError(""); }}
                onKeyDown={e => e.key === "Enter" && handleOwnerLogin()}
                placeholder="Пароль"
                autoFocus
                className="w-full bg-[#0f1117] border border-white/10 text-white rounded-lg px-4 py-3 mb-3 focus:outline-none focus:border-green-500/50 placeholder-gray-600"
              />
              {ownerError && <div className="text-red-400 text-sm mb-3">{ownerError}</div>}
              <button onClick={handleOwnerLogin}
                className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-3 rounded-lg transition-colors">
                Войти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}