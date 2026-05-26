import { useState } from "react";
import Icon from "@/components/ui/icon";

const transactions = [
  { id: "TXN-5052", desc: "Контракт SYNERGON GLOBAL", amount: "+₽ 12 500 000", date: "09.05.2026", status: "completed", category: "Доход", details: "Ежемесячный платёж по контракту № 5052834788 с корпорацией SYNERGON GLOBAL. Партнёрское соглашение по обеспечению технологической инфраструктуры ЕЦСУ.", account: "ООО «ЕЦСУ Технологии»", ref: "SYNG-2026-05-001" },
  { id: "TXN-5051", desc: "Операционные расходы ЕЦСУ", amount: "-₽ 3 200 000", date: "08.05.2026", status: "completed", category: "Расход", details: "Ежемесячные операционные расходы: аренда серверных мощностей, коммунальные платежи региональных штабов, текущее обслуживание оборудования.", account: "Операционный счёт ЕЦСУ", ref: "OPS-2026-05-08" },
  { id: "TXN-5050", desc: "Лицензия DALAN (Николаев В.В.)", amount: "+₽ 5 000 000", date: "07.05.2026", status: "completed", category: "Доход", details: "Лицензионный платёж за использование ИИ-модуля DALAN в системе ЕЦСУ. Правообладатель: Николаев Владимир Владимирович. Ежеквартальный платёж.", account: "Лицензионный счёт", ref: "DALAN-Q2-2026" },
  { id: "TXN-5049", desc: "Инфраструктура серверов", amount: "-₽ 1 800 000", date: "06.05.2026", status: "pending", category: "Расход", details: "Оплата облачной инфраструктуры и хостинга. В обработке банка. Ожидаемое подтверждение: 11.05.2026.", account: "Технический счёт", ref: "INFRA-2026-05-06" },
  { id: "TXN-5048", desc: "Стратегический резерв", amount: "+₽ 8 000 000", date: "05.05.2026", status: "completed", category: "Резерв", details: "Пополнение стратегического резервного фонда ЕЦСУ согласно регламенту финансового управления. Накопительный счёт.", account: "Резервный фонд ЕЦСУ", ref: "RSV-2026-Q2" },
];

const EcsuFinance = () => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
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
        <div className="space-y-2">
          {transactions.map((t) => {
            const isOpen = selected === t.id;
            const isIncome = t.amount.startsWith("+");
            const amountColor = isIncome ? "#00c896" : "#e94560";
            return (
              <div key={t.id}>
                <div
                  onClick={() => setSelected(isOpen ? null : t.id)}
                  className="flex items-center justify-between py-3 px-2 rounded-lg cursor-pointer hover:bg-blue-900/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: amountColor + "15" }}>
                      <Icon name={isIncome ? "ArrowDownLeft" : "ArrowUpRight"} size={15} style={{ color: amountColor }} />
                    </div>
                    <div>
                      <div className="text-white text-sm">{t.desc}</div>
                      <div className="text-gray-500 text-xs">{t.id} · {t.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-sm" style={{ color: amountColor }}>{t.amount}</div>
                      <div className={`text-xs ${t.status === "completed" ? "text-gray-500" : "text-[#f59e0b]"}`}>
                        {t.status === "completed" ? "Проведено" : "В обработке"}
                      </div>
                    </div>
                    <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={13} className="text-gray-600" />
                  </div>
                </div>
                {isOpen && (
                  <div className="bg-[#060d1f] border rounded-lg px-4 py-3 space-y-3 mb-1" style={{ borderColor: amountColor + "30" }}>
                    <p className="text-gray-300 text-sm">{t.details}</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-[#0d1225] rounded-lg p-2">
                        <div className="text-gray-500 text-xs">Категория</div>
                        <div className="text-white text-sm font-medium">{t.category}</div>
                      </div>
                      <div className="bg-[#0d1225] rounded-lg p-2">
                        <div className="text-gray-500 text-xs">Счёт</div>
                        <div className="text-white text-xs font-medium">{t.account}</div>
                      </div>
                      <div className="bg-[#0d1225] rounded-lg p-2">
                        <div className="text-gray-500 text-xs">Референс</div>
                        <div className="text-white text-xs font-medium">{t.ref}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EcsuFinance;
