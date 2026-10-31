import Icon from "@/components/ui/icon";

type Stats = {
  mode: string; absorption_balance_usd: number; total_events: number;
  blocked_threats: number; critical_events: number; total_penalties_usd: number;
  blocked_ips_count: number; top_attack_types: { event_type: string; count: number }[];
  protection_level: string;
};

const G = (s: string) => `linear-gradient(135deg, ${s})`;

type Props = {
  stats: Stats;
  fmt: (n: number) => string;
  eventLabels: Record<string, string>;
  penaltyRates: Record<string, number>;
};

export default function SecurityOverview({ stats, fmt, eventLabels, penaltyRates }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white uppercase">Режим Поглощения</h1>
        <p className="text-white/30 text-sm mt-1">Все атаки монетизируются — средства зачисляются на счёт системы</p>
      </div>

      <div className="p-6 rounded-2xl relative overflow-hidden"
        style={{ background: "rgba(244,63,94,0.06)", border: "2px solid rgba(244,63,94,0.25)" }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-5"
          style={{ background: G("#f43f5e, #f59e0b"), transform: "translate(30%, -30%)" }} />
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Icon name="Vault" size={16} className="text-red-400" />
              <span className="text-white/40 text-xs uppercase tracking-widest">Счёт поглощения · EGSU-ABS-9999</span>
            </div>
            <div className="font-display text-4xl font-bold mt-2" style={{ color: "#f59e0b" }}>
              {fmt(stats.absorption_balance_usd)}
            </div>
            <div className="text-white/40 text-sm mt-1">Накоплено штрафных начислений</div>
          </div>
          <div className="text-right">
            <div className="text-white/30 text-xs mb-1">Всего штрафов</div>
            <div className="font-bold text-xl" style={{ color: "#f43f5e" }}>{fmt(stats.total_penalties_usd)}</div>
            <div className="mt-2 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: "rgba(244,63,94,0.15)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.3)" }}>
              ABSORPTION MODE ON
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4 relative z-10">
          <div>
            <div className="text-white/30 text-xs mb-0.5">Начальный баланс</div>
            <div className="font-bold text-white/60">$0.00</div>
          </div>
          <div>
            <div className="text-white/30 text-xs mb-0.5">Все начисления — штрафы за атаки</div>
            <div className="font-bold" style={{ color: "#00ff87" }}>+{fmt(stats.absorption_balance_usd)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Всего угроз", val: stats.total_events, icon: "Activity", color: "#f43f5e" },
          { label: "Заблокировано", val: stats.blocked_threats, icon: "ShieldOff", color: "#f59e0b" },
          { label: "Критических", val: stats.critical_events, icon: "Zap", color: "#f43f5e" },
          { label: "IP в блоклисте", val: stats.blocked_ips_count, icon: "Ban", color: "#a855f7" },
        ].map(k => (
          <div key={k.label} className="p-4 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${k.color}20` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${k.color}15` }}>
              <Icon name={k.icon as "Activity"} size={16} style={{ color: k.color }} />
            </div>
            <div className="font-display text-3xl font-bold" style={{ color: k.color }}>{k.val}</div>
            <div className="text-white/35 text-xs mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 className="font-display text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Тарифная сетка штрафов</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {Object.entries(penaltyRates).map(([type, rate]) => (
            <div key={type} className="flex items-center justify-between px-3 py-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-2">
                <Icon name="AlertTriangle" size={13} className="text-red-400/60" />
                <span className="text-white/60 text-xs">{eventLabels[type] ?? type}</span>
              </div>
              <span className="font-bold text-xs" style={{ color: "#f59e0b" }}>{fmt(rate)}</span>
            </div>
          ))}
        </div>
        <p className="text-white/25 text-xs mt-3">* За повторные атаки с одного IP применяется коэффициент +50%. За 3+ атак — x2.</p>
      </div>

      {stats.top_attack_types.length > 0 && (
        <div className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 className="font-display text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Топ угроз</h2>
          <div className="space-y-2">
            {stats.top_attack_types.map((t, i) => {
              const colors = ["#f43f5e","#f59e0b","#a855f7","#3b82f6","#00ff87"];
              const c = colors[i];
              const max = stats.top_attack_types[0].count;
              return (
                <div key={t.event_type}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/60">{eventLabels[t.event_type] ?? t.event_type}</span>
                    <span style={{ color: c }}>{t.count} атак</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${(t.count / max) * 100}%`, background: c }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="p-5 rounded-2xl" style={{ background: "rgba(0,255,135,0.04)", border: "1px solid rgba(0,255,135,0.15)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Shield" size={18} className="text-green-400" />
          <h2 className="font-display text-sm font-bold text-green-400 uppercase tracking-widest">Активная защита системы</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { icon: "Lock", label: "Защита данных", desc: "Правозащитное копирование заблокировано на уровне браузера" },
            { icon: "EyeOff", label: "Антискрейпинг", desc: "Массовый парсинг данных фиксируется и монетизируется" },
            { icon: "Ban", label: "Автоблокировка IP", desc: "Атакующий IP мгновенно вносится в блок-лист" },
            { icon: "Vault", label: "Режим поглощения", desc: "Каждая атака = штраф на счёт EGSU-ABS-9999" },
            { icon: "Database", label: "Шифрование БД", desc: "Данные хранятся в зашифрованной PostgreSQL-среде" },
            { icon: "Network", label: "CORS-политика", desc: "Все API-запросы проходят проверку источника" },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: "rgba(0,255,135,0.05)" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(0,255,135,0.15)" }}>
                <Icon name={item.icon as "Lock"} size={14} className="text-green-400" />
              </div>
              <div>
                <div className="text-white/80 text-sm font-semibold">{item.label}</div>
                <div className="text-white/35 text-xs mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
