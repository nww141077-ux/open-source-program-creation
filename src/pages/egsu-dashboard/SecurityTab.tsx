import { useState } from "react";
import Icon from "@/components/ui/icon";

const MFA_METHODS = [
  { id: "totp", label: "Приложение-аутентификатор", desc: "Google Authenticator, Authy, Microsoft Authenticator", icon: "Smartphone", enabled: true, color: "#00ff87" },
  { id: "sms", label: "SMS-код", desc: "Одноразовый код на зарегистрированный номер телефона", icon: "MessageSquare", enabled: true, color: "#3b82f6" },
  { id: "biometric", label: "Биометрия", desc: "Отпечаток пальца или Face ID через WebAuthn API", icon: "Fingerprint", enabled: false, color: "#a855f7" },
  { id: "hardware", label: "Аппаратный ключ", desc: "YubiKey, FIDO2-устройства", icon: "Key", enabled: false, color: "#f59e0b" },
];

const ROLES = [
  { name: "Суперадминистратор", users: 2, color: "#f43f5e", icon: "Crown", permissions: ["Полный доступ ко всем модулям", "Управление ролями и пользователями", "Удалённая деактивация лицензий", "Доступ к секретным ключам"] },
  { name: "Координатор", users: 15, color: "#a855f7", icon: "Shield", permissions: ["Просмотр и редактирование инцидентов", "Запуск реагирования СБР", "Доступ к ИИ-аналитике", "Создание отчётов"] },
  { name: "Аналитик", users: 47, color: "#3b82f6", icon: "BarChart3", permissions: ["Просмотр инцидентов (только чтение)", "Доступ к статистике и графикам", "Экспорт данных в CSV/JSON", "Доступ к прогнозам"] },
  { name: "Оператор ОГР", users: 120, color: "#f59e0b", icon: "Search", permissions: ["Просмотр назначенных инцидентов", "Обновление статусов расследования", "Загрузка материалов дел", "Без доступа к финансам"] },
  { name: "Наблюдатель", users: 312, color: "#00ff87", icon: "Eye", permissions: ["Просмотр публичных данных", "Без права редактирования", "Без доступа к критическим разделам"] },
];

const ANOMALY_EVENTS = [
  { time: "14:32", ip: "91.142.74.12", action: "5 неудачных попыток входа", severity: "high", country: "RU", blocked: true },
  { time: "13:58", ip: "103.21.244.0", action: "Массовые запросы к API (2400/мин)", severity: "critical", country: "CN", blocked: true },
  { time: "12:17", ip: "185.234.219.4", action: "Вход с нового устройства", severity: "medium", country: "DE", blocked: false },
  { time: "11:44", ip: "45.76.23.190", action: "Попытка SQL-инъекции в форму", severity: "critical", country: "US", blocked: true },
  { time: "10:02", ip: "194.165.16.3", action: "Сканирование портов", severity: "high", country: "UA", blocked: true },
];

const SEV_COLORS: Record<string, string> = { critical: "#f43f5e", high: "#f59e0b", medium: "#3b82f6" };
const SEV_LABELS: Record<string, string> = { critical: "Критично", high: "Высокий", medium: "Средний" };

const ENCRYPTION_MODULES = [
  { name: "AES-256-GCM", scope: "Хранение данных БД", status: "active", keyAge: "14 дней" },
  { name: "TLS 1.3", scope: "Передача данных (HTTPS)", status: "active", keyAge: "90 дней" },
  { name: "RSA-4096", scope: "Подпись токенов JWT", status: "active", keyAge: "30 дней" },
  { name: "bcrypt (cost=12)", scope: "Хэширование паролей", status: "active", keyAge: "—" },
];

export default function SecurityTab() {
  const [mfaMethods, setMfaMethods] = useState(MFA_METHODS);
  const [selectedRole, setSelectedRole] = useState<typeof ROLES[0] | null>(null);
  const [bruteforceEnabled, setBruteforceEnabled] = useState(true);
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [lockDuration, setLockDuration] = useState(15);

  function toggleMfa(id: string) {
    setMfaMethods(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-bold text-white uppercase">Безопасность системы</h1>
        <p className="text-white/30 text-sm mt-0.5">Защита данных · Контроль доступа · Мониторинг угроз</p>
      </div>

      {/* Статусные метрики */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Угроз заблокировано", value: "1 847", color: "#00ff87", icon: "ShieldCheck" },
          { label: "Активных сессий", value: "94", color: "#3b82f6", icon: "Users" },
          { label: "Аномалий сегодня", value: "5", color: "#f59e0b", icon: "AlertTriangle" },
          { label: "Уровень защиты", value: "98%", color: "#a855f7", icon: "Lock" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${s.color}20` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
              style={{ background: `${s.color}15` }}>
              <Icon name={s.icon as "Lock"} size={16} style={{ color: s.color }} />
            </div>
            <div className="font-display text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-white/40 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* MFA */}
        <div className="p-5 rounded-2xl space-y-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(168,85,247,0.15)" }}>
          <div className="flex items-center gap-2">
            <Icon name="ShieldCheck" size={16} style={{ color: "#a855f7" }} />
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Многофакторная аутентификация (MFA)</h3>
          </div>
          <div className="space-y-3">
            {mfaMethods.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${m.enabled ? m.color + "25" : "rgba(255,255,255,0.05)"}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${m.color}15` }}>
                    <Icon name={m.icon as "Key"} size={15} style={{ color: m.color }} />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{m.label}</div>
                    <div className="text-white/30 text-xs">{m.desc}</div>
                  </div>
                </div>
                <button onClick={() => toggleMfa(m.id)}
                  className="w-10 h-5 rounded-full relative transition-all shrink-0"
                  style={{ background: m.enabled ? m.color : "rgba(255,255,255,0.1)" }}>
                  <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow"
                    style={{ left: m.enabled ? "calc(100% - 18px)" : "2px" }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Защита от брутфорса */}
        <div className="p-5 rounded-2xl space-y-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(244,63,94,0.15)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="Ban" size={16} style={{ color: "#f43f5e" }} />
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Защита от брутфорса</h3>
            </div>
            <button onClick={() => setBruteforceEnabled(!bruteforceEnabled)}
              className="w-10 h-5 rounded-full relative transition-all"
              style={{ background: bruteforceEnabled ? "#f43f5e" : "rgba(255,255,255,0.1)" }}>
              <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow"
                style={{ left: bruteforceEnabled ? "calc(100% - 18px)" : "2px" }} />
            </button>
          </div>
          <p className="text-white/40 text-xs">Автоматическая временная блокировка аккаунта после превышения лимита попыток входа.</p>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-white/50">Попыток до блокировки</span>
                <span style={{ color: "#f43f5e" }} className="font-bold">{maxAttempts}</span>
              </div>
              <input type="range" min={3} max={10} value={maxAttempts}
                onChange={e => setMaxAttempts(Number(e.target.value))}
                className="w-full accent-red-500" style={{ accentColor: "#f43f5e" }} />
              <div className="flex justify-between text-white/20 text-[10px] mt-1"><span>3</span><span>10</span></div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-white/50">Блокировка на (мин)</span>
                <span style={{ color: "#f59e0b" }} className="font-bold">{lockDuration}</span>
              </div>
              <input type="range" min={5} max={60} step={5} value={lockDuration}
                onChange={e => setLockDuration(Number(e.target.value))}
                className="w-full" style={{ accentColor: "#f59e0b" }} />
              <div className="flex justify-between text-white/20 text-[10px] mt-1"><span>5 мин</span><span>60 мин</span></div>
            </div>
          </div>
          <div className="flex items-start gap-2 px-3 py-2 rounded-xl"
            style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)" }}>
            <Icon name="Info" size={12} className="shrink-0 mt-0.5" style={{ color: "#f43f5e" }} />
            <p className="text-white/50 text-xs">Прогрессивная задержка: каждая следующая блокировка удваивает время.</p>
          </div>
        </div>
      </div>

      {/* Шифрование */}
      <div className="p-5 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,255,135,0.1)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Lock" size={16} style={{ color: "#00ff87" }} />
          <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Шифрование данных</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {ENCRYPTION_MODULES.map(enc => (
            <div key={enc.name} className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,255,135,0.1)" }}>
              <div>
                <div className="text-white font-semibold text-sm">{enc.name}</div>
                <div className="text-white/40 text-xs">{enc.scope}</div>
                {enc.keyAge !== "—" && <div className="text-white/25 text-[10px]">Ключ обновлён: {enc.keyAge} назад</div>}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg"
                style={{ background: "rgba(0,255,135,0.1)", color: "#00ff87" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                Активно
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RBAC */}
      <div className="p-5 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(168,85,247,0.12)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Users" size={16} style={{ color: "#a855f7" }} />
          <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Контроль доступа по ролям (RBAC)</h3>
        </div>
        <div className="space-y-2">
          {ROLES.map(role => (
            <button key={role.name} onClick={() => setSelectedRole(selectedRole?.name === role.name ? null : role)}
              className="w-full flex items-center justify-between p-3 rounded-xl text-left transition-all hover:scale-[1.01]"
              style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${role.color}20` }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${role.color}15` }}>
                  <Icon name={role.icon as "Crown"} size={15} style={{ color: role.color }} />
                </div>
                <div>
                  <div className="text-white font-medium text-sm">{role.name}</div>
                  <div className="text-white/30 text-xs">{role.users} пользователей</div>
                </div>
              </div>
              <Icon name={selectedRole?.name === role.name ? "ChevronUp" : "ChevronDown"} size={14} className="text-white/30" />
            </button>
          ))}
        </div>
        {selectedRole && (
          <div className="mt-3 p-4 rounded-xl space-y-2"
            style={{ background: `${selectedRole.color}08`, border: `1px solid ${selectedRole.color}20` }}>
            <div className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Права доступа — {selectedRole.name}</div>
            {selectedRole.permissions.map(p => (
              <div key={p} className="flex items-start gap-2 text-sm text-white/65">
                <Icon name="Check" size={13} className="mt-0.5 shrink-0" style={{ color: selectedRole.color }} />
                {p}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Мониторинг аномалий */}
      <div className="p-5 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(244,63,94,0.12)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Activity" size={16} style={{ color: "#f43f5e" }} />
          <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Мониторинг аномалий сегодня</h3>
        </div>
        <div className="space-y-2">
          {ANOMALY_EVENTS.map((ev, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${SEV_COLORS[ev.severity]}15` }}>
              <span className="text-white/30 text-xs font-mono w-10 shrink-0">{ev.time}</span>
              <span className="text-white/40 text-xs font-mono w-28 shrink-0">{ev.ip}</span>
              <span className="text-white/70 text-xs flex-1">{ev.action}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0 font-semibold"
                style={{ background: `${SEV_COLORS[ev.severity]}15`, color: SEV_COLORS[ev.severity] }}>
                {SEV_LABELS[ev.severity]}
              </span>
              {ev.blocked
                ? <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0 font-semibold" style={{ background: "rgba(0,255,135,0.1)", color: "#00ff87" }}>Заблокирован</span>
                : <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0 font-semibold" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>Наблюдение</span>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
