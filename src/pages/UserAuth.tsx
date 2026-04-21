import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/68edf934-46c9-41f7-abd0-1d3120606821";

type Mode = "login" | "register";

export default function UserAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setEmail("");
    setUsername("");
    setPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body: Record<string, string> = { action: mode, email, password };
      if (mode === "register") body.username = username;

      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("user_token", data.token);
        localStorage.setItem("user_email", data.email);
        localStorage.setItem("user_name", data.username);
        navigate("/egsu/start");
      } else {
        setError(data.error || "Ошибка. Попробуйте ещё раз.");
      }
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #060a12 0%, #0f1f0a 50%, #060a12 100%)",
      padding: 16,
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Лого */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: "linear-gradient(135deg, #00c864, #0ea5e9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", fontSize: 32,
          }}>🌍</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>ЕЦСУ</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
            Единая цифровая система управления
          </div>
        </div>

        {/* Карточка */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: "32px 28px",
          backdropFilter: "blur(20px)",
        }}>

          {/* Переключатель */}
          <div style={{
            display: "flex", background: "rgba(0,0,0,0.3)",
            borderRadius: 12, padding: 4, marginBottom: 28,
          }}>
            {(["login", "register"] as Mode[]).map(m => (
              <button key={m} onClick={() => switchMode(m)}
                style={{
                  flex: 1, padding: "8px 0",
                  background: mode === m ? "linear-gradient(135deg,#00c864,#0ea5e9)" : "none",
                  border: "none", borderRadius: 9,
                  color: mode === m ? "#000" : "rgba(255,255,255,0.4)",
                  fontWeight: mode === m ? 800 : 400,
                  fontSize: 14, cursor: "pointer", transition: "all 0.2s",
                }}>
                {m === "login" ? "Вход" : "Регистрация"}
              </button>
            ))}
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit}>

            {mode === "register" && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
                  Имя пользователя
                </label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                    <Icon name="User" size={16} color="rgba(255,255,255,0.25)" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="username"
                    required
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10, padding: "11px 12px 11px 38px",
                      color: "#fff", fontSize: 14, outline: "none",
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
                Email
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                  <Icon name="Mail" size={16} color="rgba(255,255,255,0.25)" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10, padding: "11px 12px 11px 38px",
                    color: "#fff", fontSize: 14, outline: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
                Пароль {mode === "register" && <span style={{ color: "rgba(255,255,255,0.2)" }}>(мин. 6 символов)</span>}
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                  <Icon name="Lock" size={16} color="rgba(255,255,255,0.25)" />
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10, padding: "11px 44px 11px 38px",
                    color: "#fff", fontSize: 14, outline: "none",
                  }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <Icon name={showPass ? "EyeOff" : "Eye"} size={16} color="rgba(255,255,255,0.25)" />
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)",
                borderRadius: 10, padding: "10px 14px", marginBottom: 18,
                fontSize: 13, color: "#f43f5e", display: "flex", alignItems: "center", gap: 8,
              }}>
                <Icon name="AlertCircle" size={14} color="#f43f5e" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{
                width: "100%", padding: "13px 0",
                background: loading ? "rgba(0,200,100,0.3)" : "linear-gradient(135deg,#00c864,#0ea5e9)",
                border: "none", borderRadius: 12,
                color: loading ? "rgba(255,255,255,0.5)" : "#000",
                fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.2s",
              }}>
              {loading
                ? <><Icon name="Loader" size={16} /> Подождите...</>
                : mode === "login"
                  ? <><Icon name="LogIn" size={16} /> Войти</>
                  : <><Icon name="UserPlus" size={16} /> Создать аккаунт</>
              }
            </button>
          </form>
        </div>

        {/* Ссылка на главную */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button onClick={() => navigate("/")}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 12, cursor: "pointer" }}>
            ← На главную
          </button>
        </div>
      </div>
    </div>
  );
}
