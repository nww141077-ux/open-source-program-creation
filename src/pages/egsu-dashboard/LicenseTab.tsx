import { useState } from "react";
import Icon from "@/components/ui/icon";

const PLANS = [
  {
    id: "trial", name: "Пробный период", price: "Бесплатно", period: "14 дней",
    color: "#f59e0b", icon: "Clock",
    features: ["Доступ к основным модулям", "До 5 инцидентов в день", "Аналитика (только чтение)", "Без экспорта данных"],
    limits: ["ИИ-модули недоступны", "Без API-доступа", "Без резервного копирования"],
  },
  {
    id: "standard", name: "Стандарт", price: "$490", period: "/ месяц",
    color: "#3b82f6", icon: "Package",
    features: ["До 500 инцидентов в месяц", "3 ИИ-алгоритма", "API 10 000 запросов/день", "Резервное копирование раз в сутки", "Email-поддержка 5×9"],
    limits: ["Без прогнозных модулей", "До 10 пользователей"],
  },
  {
    id: "professional", name: "Профессионал", price: "$1 490", period: "/ месяц",
    color: "#a855f7", icon: "Zap", current: true,
    features: ["Неограниченные инциденты", "Все ИИ-модули", "API без лимитов", "Резервное копирование каждые 4 часа", "Поддержка 24/7", "RBAC до 50 ролей", "Прогнозный модуль"],
    limits: [],
  },
  {
    id: "enterprise", name: "Корпоративный", price: "По запросу", period: "",
    color: "#00ff87", icon: "Building2",
    features: ["Выделенный сервер", "SLA 99.99%", "Неограниченные роли и пользователи", "On-premise установка", "Интеграция с CRM/ERP", "Персональный менеджер", "Кастомные ИИ-модели"],
    limits: [],
  },
];

const LICENSE_INFO = {
  key: "ECSU-2026-PROF-XXXX-XXXX-7841",
  plan: "Профессионал",
  owner: "Николаев В.В.",
  activatedAt: "01.04.2026",
  expiresAt: "01.04.2027",
  devices: 3,
  maxDevices: 5,
  daysLeft: 352,
};

const PAYMENT_METHODS = [
  { name: "Visa / MasterCard", icon: "CreditCard", enabled: true },
  { name: "SWIFT / IBAN-перевод", icon: "Building", enabled: true },
  { name: "Криптовалюта (USDT, BTC)", icon: "Bitcoin", enabled: true },
  { name: "Корпоративный договор", icon: "FileText", enabled: true },
];

const USAGE_STATS = [
  { label: "Инцидентов в этом месяце", value: 847, max: null, color: "#a855f7" },
  { label: "API-запросов сегодня", value: 12450, max: null, color: "#3b82f6" },
  { label: "Активных устройств", value: 3, max: 5, color: "#f59e0b" },
  { label: "Хранилище данных", value: 67, max: 100, color: "#00ff87", unit: "ГБ" },
];

export default function LicenseTab() {
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportSent, setReportSent] = useState(false);

  function sendReport(e: React.FormEvent) {
    e.preventDefault();
    setReportSent(true);
    setTimeout(() => { setReportOpen(false); setReportSent(false); setReportText(""); }, 1500);
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-bold text-white uppercase">Лицензирование</h1>
        <p className="text-white/30 text-sm mt-0.5">Управление подпиской · Активация · Защита правообладателя</p>
      </div>

      {/* Текущая лицензия */}
      <div className="p-5 rounded-2xl"
        style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.08), rgba(59,130,246,0.05))", border: "1px solid rgba(168,85,247,0.3)" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
              <Icon name="ShieldCheck" size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-white font-bold text-lg">{LICENSE_INFO.plan}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "rgba(0,255,135,0.15)", color: "#00ff87" }}>● АКТИВНА</span>
              </div>
              <p className="text-white/40 text-xs font-mono">{LICENSE_INFO.key}</p>
              <p className="text-white/30 text-xs mt-0.5">Владелец: {LICENSE_INFO.owner} · Активирована {LICENSE_INFO.activatedAt}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl font-bold" style={{ color: "#a855f7" }}>{LICENSE_INFO.daysLeft}</div>
            <div className="text-white/30 text-xs">дней до истечения</div>
            <div className="text-white/20 text-xs">{LICENSE_INFO.expiresAt}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {USAGE_STATS.map(s => (
            <div key={s.label} className="p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="font-bold text-base" style={{ color: s.color }}>
                {s.value}{s.unit ? ` ${s.unit}` : ""}{s.max ? ` / ${s.max}${s.unit ?? ""}` : ""}
              </div>
              <div className="text-white/30 text-[10px] mt-0.5 leading-tight">{s.label}</div>
              {s.max && (
                <div className="h-1 rounded-full mt-2" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-1 rounded-full" style={{ width: `${(s.value / s.max) * 100}%`, background: s.color }} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-4">
          <button className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 text-white"
            style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
            Продлить лицензию
          </button>
          <button className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
            Добавить устройство ({LICENSE_INFO.devices}/{LICENSE_INFO.maxDevices})
          </button>
        </div>
      </div>

      {/* Тарифы */}
      <div>
        <h3 className="text-white/40 text-[10px] uppercase tracking-widest mb-3">Доступные тарифные планы</h3>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          {PLANS.map(plan => (
            <button key={plan.id} onClick={() => setSelectedPlan(selectedPlan?.id === plan.id ? null : plan)}
              className="p-4 rounded-2xl text-left transition-all hover:scale-[1.02] w-full"
              style={{
                background: plan.current ? `${plan.color}10` : "rgba(255,255,255,0.02)",
                border: `1px solid ${plan.current ? plan.color + "40" : plan.color + "20"}`,
              }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${plan.color}15` }}>
                  <Icon name={plan.icon as "Zap"} size={15} style={{ color: plan.color }} />
                </div>
                {plan.current && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase"
                    style={{ background: `${plan.color}20`, color: plan.color }}>Текущий</span>
                )}
              </div>
              <div className="text-white font-bold text-sm mb-0.5">{plan.name}</div>
              <div className="font-display text-xl font-bold" style={{ color: plan.color }}>{plan.price}
                <span className="text-white/30 text-xs font-normal">{plan.period}</span>
              </div>
              <Icon name={selectedPlan?.id === plan.id ? "ChevronUp" : "ChevronDown"} size={12} className="mt-2 text-white/20" />
            </button>
          ))}
        </div>
        {selectedPlan && (
          <div className="mt-3 p-4 rounded-2xl"
            style={{ background: `${selectedPlan.color}06`, border: `1px solid ${selectedPlan.color}25` }}>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Включено</div>
                {selectedPlan.features.map(f => (
                  <div key={f} className="flex items-start gap-2 text-sm text-white/65 mb-1.5">
                    <Icon name="Check" size={13} className="mt-0.5 shrink-0" style={{ color: selectedPlan.color }} />
                    {f}
                  </div>
                ))}
              </div>
              {selectedPlan.limits.length > 0 && (
                <div>
                  <div className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Ограничения</div>
                  {selectedPlan.limits.map(l => (
                    <div key={l} className="flex items-start gap-2 text-sm text-white/40 mb-1.5">
                      <Icon name="X" size={13} className="mt-0.5 shrink-0" style={{ color: "#f43f5e" }} />
                      {l}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {!selectedPlan.current && (
              <button className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${selectedPlan.color}, ${selectedPlan.color}aa)` }}>
                Перейти на {selectedPlan.name}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Способы оплаты */}
      <div className="p-5 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(59,130,246,0.12)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Icon name="CreditCard" size={16} style={{ color: "#3b82f6" }} />
          <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Способы оплаты</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {PAYMENT_METHODS.map(pm => (
            <div key={pm.name} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(59,130,246,0.1)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(59,130,246,0.12)" }}>
                <Icon name={pm.icon as "CreditCard"} size={15} style={{ color: "#3b82f6" }} />
              </div>
              <span className="text-white/70 text-sm">{pm.name}</span>
              <Icon name="Check" size={13} className="ml-auto" style={{ color: "#00ff87" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Защита правообладателя */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="p-5 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(245,158,11,0.12)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Shield" size={16} style={{ color: "#f59e0b" }} />
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Защита правообладателя</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: "Лицензия привязана к устройству", active: true },
              { label: "Удалённая деактивация при нарушении", active: true },
              { label: "Анонимная телеметрия использования", active: true },
              { label: "Сбор статистики функций (без персданных)", active: true },
              { label: "Оффлайн-активация (до 72 часов)", active: true },
              { label: "Прозрачный отчёт о пиратстве", active: true },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 text-sm text-white/60">
                <Icon name="Check" size={13} style={{ color: "#f59e0b" }} />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(244,63,94,0.12)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon name="AlertOctagon" size={16} style={{ color: "#f43f5e" }} />
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Сообщить о нарушении</h3>
            </div>
          </div>
          <p className="text-white/40 text-xs mb-4">Если вы обнаружили нелицензионное использование ЕЦСУ 2.0 — сообщите нам. Ваша идентичность защищена.</p>
          {!reportOpen ? (
            <button onClick={() => setReportOpen(true)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
              style={{ background: "rgba(244,63,94,0.12)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.25)" }}>
              Подать сообщение о пиратстве
            </button>
          ) : (
            <form onSubmit={sendReport} className="space-y-3">
              <textarea
                value={reportText}
                onChange={e => setReportText(e.target.value)}
                placeholder="Опишите нарушение: URL, название организации, скриншоты..."
                rows={3}
                className="w-full rounded-xl text-sm resize-none text-white/70 placeholder-white/20"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(244,63,94,0.2)", padding: "10px 12px", outline: "none" }}
              />
              <button type="submit"
                className="w-full py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ background: reportSent ? "rgba(0,255,135,0.15)" : "rgba(244,63,94,0.15)", color: reportSent ? "#00ff87" : "#f43f5e", border: `1px solid ${reportSent ? "rgba(0,255,135,0.25)" : "rgba(244,63,94,0.25)"}` }}>
                {reportSent ? "✓ Отправлено — спасибо" : "Отправить сообщение"}
              </button>
            </form>
          )}
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="text-white/20 text-[10px] leading-relaxed">
              © 2026 Николаев Владимир Владимирович. Все права защищены. ЕЦСУ 2.0 является зарегистрированным программным обеспечением. Несанкционированное копирование, распространение и использование преследуется по международному праву.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
