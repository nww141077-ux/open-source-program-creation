import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

interface Threat {
  id: string;
  time: string;
  source: string;
  type: string;
  target: string;
  status: "absorbed" | "blocking" | "fined" | "monitoring";
  fine: string;
  details: string;
}

const STATUS_COLOR: Record<string, string> = {
  absorbed:   "#34d399",
  blocking:   "#f59e0b",
  fined:      "#a78bfa",
  monitoring: "#60a5fa",
};
const STATUS_LABEL: Record<string, string> = {
  absorbed:   "Поглощён",
  blocking:   "Блокировка",
  fined:      "Штраф наложен",
  monitoring: "Мониторинг",
};

const INITIAL_THREATS: Threat[] = [
  { id: "ABS-001", time: "25.05.2026 · 11:43", source: "185.220.101.47", type: "Копирование файлов",    target: "ecsu-nww.com/api/docs",  status: "fined",      fine: "₽ 850 000",  details: "Попытка массового копирования документов через API. Канал поглощён, источник идентифицирован. Штраф выставлен по ст. 272 УК РФ." },
  { id: "ABS-002", time: "25.05.2026 · 10:21", source: "45.142.212.100", type: "Незаконное вторжение", target: "ЕЦСУ · база данных",      status: "absorbed",   fine: "₽ 1 200 000", details: "SQL-инъекция через форму авторизации. Канал агрессора поглощён системой. Трафик перенаправлен в honeypot." },
  { id: "ABS-003", time: "25.05.2026 · 09:55", source: "104.21.38.210",  type: "Парсинг данных",       target: "Реестр инцидентов",       status: "blocking",   fine: "Расчёт...",   details: "Автоматический сбор данных реестра. Активна блокировка канала. Штраф рассчитывается." },
  { id: "ABS-004", time: "24.05.2026 · 23:10", source: "91.108.56.130",  type: "DDoS атака",           target: "5.129.207.35:443",        status: "absorbed",   fine: "₽ 2 500 000", details: "Распределённая атака с 1 400 узлов. Весь трафик поглощён и перенаправлен обратно к источнику. Штраф выставлен." },
  { id: "ABS-005", time: "24.05.2026 · 18:44", source: "Email-спуфинг",  type: "Фишинг файлов",        target: "nikolaevvladimir77@ya.ru", status: "fined",      fine: "₽ 300 000",  details: "Попытка получить доступ к документам через фишинговое письмо. Отправитель идентифицирован, штраф выставлен." },
];

const EcsuAbsorption = () => {
  const [threats, setThreats]   = useState<Threat[]>(INITIAL_THREATS);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter]     = useState<"all" | "absorbed" | "blocking" | "fined" | "monitoring">("all");
  const [absorbing, setAbsorbing] = useState<string | null>(null);
  const [stats, setStats]       = useState({ absorbed: 0, fined: 0, total_fine: 0, blocking: 0 });

  useEffect(() => {
    const a = threats.filter(t => t.status === "absorbed").length;
    const f = threats.filter(t => t.status === "fined").length;
    const b = threats.filter(t => t.status === "blocking").length;
    const tf = threats
      .filter(t => t.fine.startsWith("₽"))
      .reduce((sum, t) => sum + parseInt(t.fine.replace(/[^\d]/g, "") || "0"), 0);
    setStats({ absorbed: a, fined: f, total_fine: tf, blocking: b });
  }, [threats]);

  const handleAbsorb = (id: string) => {
    setAbsorbing(id);
    setTimeout(() => {
      setThreats(prev => prev.map(t =>
        t.id === id ? { ...t, status: "absorbed", fine: t.fine === "Расчёт..." ? "₽ 500 000" : t.fine } : t
      ));
      setAbsorbing(null);
    }, 1800);
  };

  const filtered = filter === "all" ? threats : threats.filter(t => t.status === filter);
  const sel = threats.find(t => t.id === selected);

  return (
    <div className="p-6">

      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-[#e94560] to-[#9b1dcc] rounded-xl flex items-center justify-center shadow-lg shadow-red-900/30">
          <Icon name="Zap" size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Система Поглощения</h1>
          <p className="text-gray-500 text-sm">Защита от копирования, вторжений и агрессии · ЕЦСУ 2.0</p>
        </div>
        <div className="ml-auto flex items-center gap-2 bg-green-900/20 border border-green-600/30 rounded-xl px-4 py-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-xs font-bold">ЗАЩИТА АКТИВНА</span>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Поглощено угроз",    value: stats.absorbed,                        color: "#34d399", icon: "ShieldCheck" },
          { label: "Штрафов наложено",   value: stats.fined,                           color: "#a78bfa", icon: "Gavel" },
          { label: "Сумма штрафов",      value: `₽ ${(stats.total_fine/1e6).toFixed(1)}М`, color: "#fbbf24", icon: "DollarSign" },
          { label: "В блокировке",       value: stats.blocking,                        color: "#f59e0b", icon: "Ban" },
        ].map(s => (
          <div key={s.label} className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: s.color + "22" }}>
                <Icon name={s.icon} size={15} style={{ color: s.color }} />
              </div>
            </div>
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-gray-500 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Принцип работы */}
      <div className="bg-gradient-to-r from-[#e94560]/10 to-[#9b1dcc]/10 border border-[#e94560]/20 rounded-xl p-4 mb-6">
        <div className="text-white text-sm font-bold mb-2 flex items-center gap-2">
          <Icon name="Info" size={14} className="text-[#e94560]" />
          Принцип Поглощения
        </div>
        <div className="text-gray-400 text-xs leading-relaxed">
          При обнаружении агрессии (копирование файлов, несанкционированное вторжение, DDoS) система <span className="text-white font-medium">поглощает канал агрессора</span> — перехватывает трафик, перенаправляет его обратно, блокирует источник и автоматически формирует <span className="text-[#a78bfa] font-medium">штраф по ст. 272, 273, 274 УК РФ</span>. Все действия фиксируются в журнале ЕЦСУ.
        </div>
      </div>

      <div className="flex gap-4">

        {/* Список угроз */}
        <div className="flex-1 min-w-0">
          {/* Фильтры */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {([
              ["all",        "Все",          "#94a3b8"],
              ["absorbed",   "Поглощены",    "#34d399"],
              ["blocking",   "Блокировка",   "#f59e0b"],
              ["fined",      "Оштрафованы",  "#a78bfa"],
              ["monitoring", "Мониторинг",   "#60a5fa"],
            ] as const).map(([id, label, color]) => (
              <button key={id} onClick={() => setFilter(id)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all border"
                style={filter === id
                  ? { background: color + "22", color, borderColor: color + "50" }
                  : { background: "transparent", color: "#4b5563", borderColor: "#ffffff10" }
                }>
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filtered.map(t => (
              <div
                key={t.id}
                onClick={() => setSelected(selected === t.id ? null : t.id)}
                className={`bg-[#0d1225] border rounded-xl p-4 cursor-pointer transition-all ${
                  selected === t.id ? "border-[#e94560]/40" : "border-blue-900/20 hover:border-blue-700/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: STATUS_COLOR[t.status] + "22" }}>
                    <Icon name="Zap" size={14} style={{ color: STATUS_COLOR[t.status] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{t.type}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                        style={{ background: STATUS_COLOR[t.status] + "22", color: STATUS_COLOR[t.status] }}>
                        {STATUS_LABEL[t.status]}
                      </span>
                    </div>
                    <div className="text-gray-500 text-xs mt-0.5 truncate">
                      {t.source} → {t.target}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold" style={{ color: "#a78bfa" }}>{t.fine}</div>
                    <div className="text-gray-700 text-[10px]">{t.time.split("·")[1]?.trim()}</div>
                  </div>
                </div>

                {/* Детали */}
                {selected === t.id && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="text-gray-400 text-xs leading-relaxed mb-3">{t.details}</div>
                    <div className="flex gap-2">
                      {t.status === "blocking" && (
                        <button
                          onClick={e => { e.stopPropagation(); handleAbsorb(t.id); }}
                          disabled={absorbing === t.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e94560]/20 border border-[#e94560]/40 text-[#e94560] text-xs rounded-lg hover:bg-[#e94560]/30 transition-colors disabled:opacity-50"
                        >
                          {absorbing === t.id
                            ? <><Icon name="Loader2" size={11} className="animate-spin" /> Поглощаю...</>
                            : <><Icon name="Zap" size={11} /> Поглотить канал</>}
                        </button>
                      )}
                      <button
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#a78bfa]/10 border border-[#a78bfa]/30 text-[#a78bfa] text-xs rounded-lg hover:bg-[#a78bfa]/20 transition-colors"
                      >
                        <Icon name="Gavel" size={11} /> Сформировать штраф
                      </button>
                      <button
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-gray-400 text-xs rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <Icon name="FileText" size={11} /> Протокол
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Правая панель — правовая база */}
        <div className="w-64 shrink-0 space-y-3">
          <div className="bg-[#0d1225] border border-blue-900/20 rounded-xl p-4">
            <div className="text-white text-xs font-bold mb-3 flex items-center gap-2">
              <Icon name="Scale" size={12} className="text-blue-400" />
              Правовая база штрафов
            </div>
            <div className="space-y-2">
              {[
                { art: "Ст. 272 УК РФ", desc: "Неправомерный доступ к компьютерной информации", fine: "до ₽ 500 000" },
                { art: "Ст. 273 УК РФ", desc: "Создание вредоносных программ", fine: "до ₽ 1 000 000" },
                { art: "Ст. 274 УК РФ", desc: "Нарушение правил эксплуатации ЭВМ", fine: "до ₽ 500 000" },
                { art: "Ст. 138 УК РФ", desc: "Нарушение тайны переписки и данных", fine: "до ₽ 200 000" },
              ].map(a => (
                <div key={a.art} className="bg-[#060d1f] rounded-lg p-2.5 border border-blue-900/10">
                  <div className="text-blue-400 text-[10px] font-bold">{a.art}</div>
                  <div className="text-gray-500 text-[10px] mt-0.5">{a.desc}</div>
                  <div className="text-[#a78bfa] text-[10px] font-bold mt-1">{a.fine}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0d1225] border border-blue-900/20 rounded-xl p-4">
            <div className="text-white text-xs font-bold mb-3 flex items-center gap-2">
              <Icon name="Activity" size={12} className="text-green-400" />
              Статус защиты
            </div>
            {[
              ["Поглощение каналов", true],
              ["Авто-штрафование",  true],
              ["Фиксация протокола", true],
              ["Honeypot активен",   true],
              ["Firewall ЕЦСУ",      true],
            ].map(([label, active]) => (
              <div key={String(label)} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <span className="text-gray-400 text-xs">{String(label)}</span>
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
                  <span className={`text-[10px] ${active ? "text-green-400" : "text-gray-600"}`}>
                    {active ? "Вкл" : "Выкл"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcsuAbsorption;
