import Icon from "@/components/ui/icon";

const transactions = [
  { id: "TXN-5052", desc: "Контракт SYNERGON GLOBAL", amount: "+₽ 12 500 000", date: "09.05.2026", status: "completed" },
  { id: "TXN-5051", desc: "Операционные расходы ЕЦСУ", amount: "-₽ 3 200 000", date: "08.05.2026", status: "completed" },
  { id: "TXN-5050", desc: "Лицензия DALAN (Николаев В.В.)", amount: "+₽ 5 000 000", date: "07.05.2026", status: "completed" },
  { id: "TXN-5049", desc: "Инфраструктура серверов", amount: "-₽ 1 800 000", date: "06.05.2026", status: "pending" },
  { id: "TXN-5048", desc: "Стратегический резерв", amount: "+₽ 8 000 000", date: "05.05.2026", status: "completed" },
];

const EcsuFinance = () => (
  <div className="p-6">
    <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
      <Icon name="DollarSign" size={20} className="text-[#00c896]" />
      Финансы ЕЦСУ
    </h2>
    <p className="text-gray-500 text-sm mb-6">Бюджет и транзакции · Контракт № 5052834788</p>

    <div className="grid grid-cols-3 gap-4 mb-6">
      {[
        { label: "Бюджет (апрель)", value: "₽ 42.5M", delta: "+10%", color: "#00c896" },
        { label: "Расходы", value: "₽ 18.2M", delta: "-5%", color: "#f59e0b" },
        { label: "Остаток", value: "₽ 24.3M", delta: "+18%", color: "#60a5fa" },
      ].map((s) => (
        <div key={s.label} className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
          <div className="text-gray-500 text-xs mb-1">{s.label}</div>
          <div className="text-2xl font-bold text-white">{s.value}</div>
          <div className="text-xs font-bold mt-1" style={{ color: s.color }}>{s.delta} vs прошлый месяц</div>
        </div>
      ))}
    </div>

    <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
      <div className="text-white font-bold text-sm mb-3">Последние транзакции</div>
      <div className="divide-y divide-blue-900/20">
        {transactions.map((t) => (
          <div key={t.id} className="flex items-center justify-between py-3">
            <div>
              <div className="text-white text-sm">{t.desc}</div>
              <div className="text-gray-500 text-xs">{t.id} · {t.date}</div>
            </div>
            <div className="text-right">
              <div className={`font-bold text-sm ${t.amount.startsWith("+") ? "text-[#00c896]" : "text-[#e94560]"}`}>{t.amount}</div>
              <div className={`text-xs ${t.status === "completed" ? "text-gray-500" : "text-[#f59e0b]"}`}>
                {t.status === "completed" ? "Проведено" : "В обработке"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default EcsuFinance;
