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
    <div className="min-h-screen text-white flex flex-col" style={{ background: "linear-gradient(160deg, #071a12 0%, #0a1a0f 40%, #080f1a 100%)" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-5 md:px-10 py-4">
        <button onClick={handleLogoTap} className="flex items-center gap-2 select-none">
          <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-black" />
          </div>
          <span className="font-bold text-white text-lg tracking-wide">NEXAFLOW</span>
        </button>
        {/* Десктопное меню */}
        <nav className="hidden md:flex items-center gap-6">
          {["Возможности", "Интеграции", "Тарифы"].map(item => (
            <button key={item} className="text-gray-400 hover:text-white text-sm transition-colors">{item}</button>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { resetForm(); setScreen("login"); }}
            className="hidden md:block text-sm text-gray-400 hover:text-white transition-colors"
          >
            Войти
          </button>
          <button
            onClick={() => { resetForm(); setScreen("register"); }}
            className="bg-gradient-to-r from-green-400 to-teal-400 text-black font-bold px-4 py-2 rounded-xl text-sm"
          >
            Начать бесплатно
          </button>
        </div>
      </header>

      {/* Landing */}
      {screen === "landing" && (
        <main className="flex-1 flex flex-col md:flex-row items-center px-5 md:px-10 pt-6 pb-10 gap-10">
          {/* Левая колонка */}
          <div className="flex-1 flex flex-col max-w-xl">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1.5 mb-6 self-start">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-medium">Платформа интеграций нового поколения</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black leading-none mb-6">
              <span className="text-white">ОБЪЕДИНИТЕ</span><br />
              <span className="bg-gradient-to-r from-green-400 to-purple-500 bg-clip-text text-transparent">ВСЁ В ОДНОМ</span><br />
              <span className="text-gray-500">ПОТОКЕ</span><br />
              <span className="text-gray-600">ДАННЫХ</span>
            </h1>
            <p className="text-gray-400 text-base leading-relaxed mb-8">
              NexaFlow — единая платформа для интеграции всех ваших сервисов, автоматизации процессов и управления данными в реальном времени.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                onClick={() => { resetForm(); setScreen("register"); }}
                className="bg-gradient-to-r from-green-400 to-teal-400 text-black font-bold py-3 px-6 rounded-xl text-base flex items-center justify-center gap-2"
              >
                Попробовать бесплатно <ArrowRight size={18} />
              </button>
              <button
                onClick={() => navigate("/ecsu")}
                className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 font-semibold py-3 px-6 rounded-xl text-base flex items-center justify-center gap-2 transition-colors"
              >
                <Shield size={18} />
                Открыть ЕЦСУ
              </button>
            </div>
            <div className="flex items-center gap-5 text-xs text-gray-600">
              <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> 14 дней бесплатно</span>
              <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Без карты</span>
              <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Отмена в любое время</span>
            </div>
          </div>

          {/* Правая колонка — картинка нейросети */}
          <div className="hidden md:flex flex-1 items-center justify-center max-w-lg">
            <div className="relative w-full aspect-square max-w-sm">
              <div className="absolute inset-0 rounded-3xl overflow-hidden"
                style={{ background: "linear-gradient(135deg, #0a2a1a 0%, #0d1a2e 100%)", border: "1px solid rgba(0,255,135,0.15)" }}>
                <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 400 400">
                  {/* Узлы нейросети */}
                  {[
                    [80,80],[200,60],[320,100],[60,200],[160,180],[260,160],[340,220],
                    [100,300],[200,280],[300,300],[220,380],[380,340]
                  ].map(([x,y], i) => (
                    <g key={i}>
                      <circle cx={x} cy={y} r="6" fill="#00ff87" opacity="0.7" />
                      <circle cx={x} cy={y} r="12" fill="#00ff87" opacity="0.15" />
                    </g>
                  ))}
                  {/* Линии */}
                  {[
                    [80,80,200,60],[200,60,320,100],[80,80,60,200],[200,60,160,180],
                    [320,100,340,220],[60,200,160,180],[160,180,260,160],[260,160,340,220],
                    [60,200,100,300],[160,180,200,280],[260,160,300,300],[340,220,380,340],
                    [100,300,200,280],[200,280,300,300],[200,280,220,380],[300,300,380,340],
                  ].map(([x1,y1,x2,y2], i) => (
                    <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#00ff87" strokeWidth="0.8" opacity="0.25" />
                  ))}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                    <Zap size={28} className="text-green-400" />
                  </div>
                </div>
              </div>
              {/* Декоративные блоки */}
              <div className="absolute -top-4 -right-4 bg-[#111827] border border-white/10 rounded-xl px-4 py-2 text-xs text-green-400 font-semibold">
                +12% скорость
              </div>
              <div className="absolute -bottom-4 -left-4 bg-[#111827] border border-white/10 rounded-xl px-4 py-2 text-xs text-blue-400 font-semibold">
                1 247 интеграций
              </div>
            </div>
          </div>

          {/* Мобильные кнопки */}
          <div className="md:hidden w-full bg-[#111827]/80 border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
            <button
              onClick={() => { resetForm(); setScreen("login"); }}
              className="w-full bg-white/5 border border-white/10 text-white font-semibold py-4 rounded-xl text-base"
            >
              Войти в аккаунт
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
            <div className="text-xl font-bold text-white">Вход в ЕЦСУ 2.0</div>
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
          <p className="text-gray-700 text-xs">© 2026 Николаев В.В. Все права защищены.</p>
        </footer>
      )}

      {/* Вход владельца (5 тапов по логотипу) — полноэкранный */}
      {showOwnerModal && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between px-6 py-12" style={{ background: "#0a0f1e" }}>
          {/* Логотип */}
          <div className="flex flex-col items-center gap-3 mt-8">
            <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/50">
              <Shield size={40} className="text-white" />
            </div>
            <div className="text-white font-black text-4xl tracking-widest mt-2">ECSU</div>
            <div className="text-blue-400 text-xs font-semibold tracking-[0.25em] uppercase">Система контроля · 2026</div>
          </div>

          {/* Форма */}
          <div className="w-full max-w-sm">
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-1">
                <div className="text-white font-bold text-lg">Авторизация</div>
                <button onClick={() => { setShowOwnerModal(false); setOwnerPassword(""); setOwnerError(""); }}
                  className="text-gray-600 hover:text-white"><X size={18} /></button>
              </div>
              <div className="text-gray-500 text-sm mb-5">Только для владельца системы</div>
              <input
                type="password"
                value={ownerPassword}
                onChange={e => { setOwnerPassword(e.target.value); setOwnerError(""); }}
                onKeyDown={e => e.key === "Enter" && handleOwnerLogin()}
                placeholder="Пароль"
                autoFocus
                className="w-full bg-[#0d1117] border border-white/10 text-white rounded-xl px-4 py-4 mb-3 focus:outline-none focus:border-blue-500/50 placeholder-gray-600 text-base"
              />
              {ownerError && (
                <div className="text-red-400 text-sm mb-3 flex items-center gap-2">
                  <span>⊘</span> Доступ запрещён
                </div>
              )}
              <button
                onClick={handleOwnerLogin}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors text-base"
              >
                {loading ? "Проверка..." : "Войти в систему"}
              </button>
            </div>
          </div>

          {/* Футер */}
          <div className="text-gray-600 text-xs tracking-widest text-center">
            SYNERGON GLOBAL · Николаев В.В. · 2026
          </div>
        </div>
      )}
    </div>
  );
}