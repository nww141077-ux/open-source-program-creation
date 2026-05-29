import { useState } from "react";
import Icon from "@/components/ui/icon";

const EcsuOwner = () => {
  const [tab, setTab] = useState<"profile" | "access" | "log">("profile");

  const accessUsers = [
    { name: "Николаев В.В.", role: "Верховный владелец", level: 10, color: "#FFD700", icon: "Crown" },
    { name: "Администратор системы", role: "Системный администратор", level: 9, color: "#f97316", icon: "Shield" },
    { name: "Оператор ЦПВОА", role: "Сетевой оператор", level: 7, color: "#60a5fa", icon: "Network" },
    { name: "Аналитик ECSU", role: "Аналитик данных", level: 6, color: "#a78bfa", icon: "BarChart2" },
    { name: "Финансовый контролёр", role: "Финансы и отчётность", level: 5, color: "#fbbf24", icon: "DollarSign" },
  ];

  const accessLog = [
    { date: "20.05.2026 · 23:40", user: "Николаев В.В.", action: "Авторизация владельца", status: "success" },
    { date: "20.05.2026 · 22:15", user: "Администратор системы", action: "Изменение прав доступа", status: "success" },
    { date: "20.05.2026 · 18:03", user: "Аналитик ECSU", action: "Экспорт отчёта аналитики", status: "success" },
    { date: "20.05.2026 · 15:47", user: "Неизвестный", action: "Попытка несанкционированного входа", status: "error" },
    { date: "19.05.2026 · 09:22", user: "Финансовый контролёр", action: "Просмотр финансовых операций", status: "success" },
    { date: "18.05.2026 · 14:11", user: "Николаев В.В.", action: "Обновление конфигурации системы", status: "success" },
    { date: "17.05.2026 · 11:30", user: "Оператор ЦПВОА", action: "Переключение провайдера", status: "warning" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-[#FFD700] to-[#f97316] rounded-xl flex items-center justify-center shadow-lg shadow-yellow-900/30">
          <Icon name="Crown" size={24} className="text-black" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Панель владельца</h1>
          <p className="text-gray-500 text-sm">Управление доступом и контроль системы ECSU 2.0</p>
        </div>
        <div className="ml-auto flex items-center gap-2 bg-yellow-900/20 border border-yellow-600/30 rounded-xl px-4 py-2">
          <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          <span className="text-yellow-400 text-xs font-bold">УРОВЕНЬ ДОСТУПА: ВЕРХОВНЫЙ</span>
        </div>
      </div>

      {/* Вкладки */}
      <div className="flex gap-2 mb-6">
        {[
          { id: "profile" as const, label: "Профиль", icon: "User" },
          { id: "access"  as const, label: "Права доступа", icon: "KeyRound" },
          { id: "log"     as const, label: "Журнал входов", icon: "ScrollText" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent"
            }`}
          >
            <Icon name={t.icon} size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Профиль владельца ── */}
      {tab === "profile" && (
        <div className="space-y-4">
          {/* Карточка владельца */}
          <div className="bg-[#0d1225] border border-yellow-600/20 rounded-xl p-5">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FFD700] to-[#f97316] rounded-2xl flex items-center justify-center shadow-lg">
                <Icon name="Crown" size={30} className="text-black" />
              </div>
              <div>
                <div className="text-white text-lg font-bold">Николаев В.В.</div>
                <div className="text-yellow-400 text-sm">Верховный владелец · ECSU 2.0</div>
                <div className="text-gray-500 text-xs mt-0.5">Группа компаний Николаева · SYNERGON GLOBAL</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-green-400 text-xs font-bold">● АКТИВЕН</div>
                <div className="text-gray-600 text-xs mt-1">Последний вход: 20.05.2026</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["ID владельца", "OWNER-001-NVV", "#FFD700"],
                ["Уровень доступа", "10 / 10 (Верховный)", "#f97316"],
                ["Дата регистрации", "01.01.2024", "#60a5fa"],
                ["Статус лицензии", "Активна до 01.01.2027", "#34d399"],
                ["Юрисдикция", "РФ · Группа компаний", "#a78bfa"],
                ["Версия ECSU", "2.0.5 · 20.05.2026", "#94a3b8"],
              ].map(([k, v, c]) => (
                <div key={k} className="bg-[#060d1f] rounded-lg p-3 border border-white/5">
                  <div className="text-gray-500 text-[11px]">{k}</div>
                  <div className="text-sm font-semibold mt-0.5" style={{ color: c }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Права системы */}
          <div className="bg-[#0d1225] border border-blue-900/20 rounded-xl p-4">
            <div className="text-white font-bold text-sm mb-3 flex items-center gap-2">
              <Icon name="ShieldCheck" size={15} className="text-yellow-400" />
              Полномочия владельца
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                "Полный доступ ко всем разделам ECSU",
                "Управление правами пользователей",
                "Просмотр финансовых операций",
                "Управление конфигурацией системы",
                "Доступ к Dalan ИИ-движку",
                "Управление TahkaOS и экстренными каналами",
                "Экспорт любых данных системы",
                "Сброс и восстановление системы",
              ].map(p => (
                <div key={p} className="flex items-center gap-2 text-xs text-gray-400">
                  <Icon name="Check" size={12} className="text-green-400 shrink-0" />
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Права доступа ── */}
      {tab === "access" && (
        <div className="space-y-3">
          <div className="text-gray-500 text-xs mb-2">
            Иерархия доступа к системе ECSU. Уровень 10 — максимальный (владелец).
          </div>
          {accessUsers.map((u, i) => (
            <div key={i} className="flex items-center gap-3 p-4 bg-[#0d1225] border border-white/5 rounded-xl hover:border-white/10 transition-colors">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: u.color + "22" }}
              >
                <Icon name={u.icon} size={18} style={{ color: u.color }} />
              </div>
              <div className="flex-1">
                <div className="text-white text-sm font-semibold">{u.name}</div>
                <div className="text-gray-500 text-xs">{u.role}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold mb-1" style={{ color: u.color }}>
                  Уровень {u.level}
                </div>
                <div className="w-20 h-1.5 bg-white/5 rounded-full">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${u.level * 10}%`, background: u.color }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Журнал входов ── */}
      {tab === "log" && (
        <div className="space-y-2">
          <div className="text-gray-500 text-xs mb-2">
            Последние события авторизации и действий в системе ECSU.
          </div>
          {accessLog.map((e, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-[#0d1225] border border-white/5 rounded-xl">
              <div className={`w-2 h-2 rounded-full shrink-0 ${
                e.status === "success" ? "bg-green-400" :
                e.status === "error"   ? "bg-red-400 animate-pulse" :
                "bg-yellow-400"
              }`} />
              <div className="flex-1">
                <div className="text-white text-xs font-medium">{e.action}</div>
                <div className="text-gray-600 text-[11px]">{e.user}</div>
              </div>
              <div className="text-gray-600 text-[10px] font-mono shrink-0">{e.date}</div>
              <div className={`text-[10px] px-2 py-0.5 rounded font-semibold shrink-0 ${
                e.status === "success" ? "bg-green-900/30 text-green-400" :
                e.status === "error"   ? "bg-red-900/30 text-red-400" :
                "bg-yellow-900/30 text-yellow-400"
              }`}>
                {e.status === "success" ? "ОК" : e.status === "error" ? "БЛОК" : "ВНИМАНИЕ"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EcsuOwner;
