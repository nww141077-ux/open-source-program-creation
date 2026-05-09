import Icon from "@/components/ui/icon";

const docs = [
  {
    id: "license",
    title: "ЛИЦЕНЗИЯ SYNERGON-ALPHA",
    icon: "FileCheck",
    color: "#FFD700",
    fields: [
      { label: "Автор и правообладатель (UBO)", value: "Николаев В.В." },
      { label: "License ID", value: "SYNERGON-ALPHA-5052834788" },
      { label: "Математическое ядро", value: "DALAN · Сдвиг Николаева (исключительные права)" },
      { label: "Статус", value: "АКТИВНА · Верифицировано ЕЦСУ" },
    ],
    body: `Настоящий документ подтверждает, что математический протокол «Сдвиг Николаева» (коэффициент оптимизации ×1.1), а также программный движок DALAN, реализующий логику оптимизации в системе ЕЦСУ, являются авторской разработкой Николаева В.В.

Все права на методику, алгоритм и его применение принадлежат автору. Использование без разрешения правообладателя запрещено.`,
  },
  {
    id: "protocol",
    title: "ПРОТОКОЛ «СДВИГ НИКОЛАЕВА»",
    icon: "FlaskConical",
    color: "#00FF41",
    fields: [
      { label: "Версия", value: "1.0 · DALAN CORE" },
      { label: "Коэффициент", value: "×1.1 (11/10)" },
      { label: "Применение", value: "Оптимизация входящих потоков данных ЕЦСУ" },
    ],
    body: `Фундаментальное уравнение:
V_out = V_in × 1.1

Принцип: любой входящий поток данных, ресурс или показатель умножается на коэффициент Николаева (1.1), что обеспечивает прирост эффективности на 10% от номинала.

Методика зарегистрирована как базовый алгоритм движка DALAN и применяется во всех расчётах системы ЕЦСУ.`,
  },
  {
    id: "contract",
    title: "КОНТРАКТ № 5052834788",
    icon: "FileText",
    color: "#e94560",
    fields: [
      { label: "Номер", value: "5052834788" },
      { label: "Организация", value: "SYNERGON GLOBAL" },
      { label: "Ответственный", value: "Николаев В.В." },
      { label: "Статус", value: "В исполнении" },
    ],
    body: `Контракт на внедрение и эксплуатацию системы ЕЦСУ с применением авторской методики «Сдвиг Николаева» в рамках стратегической программы SYNERGON GLOBAL.

Исполнение контролируется через панель управления DALAN.`,
  },
];

const DocsTab = () => {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
        <Icon name="FolderOpen" size={20} className="text-[#e94560]" />
        Документы ЕЦСУ
      </h2>
      <p className="text-gray-500 text-xs mb-6">Лицензии, протоколы и контракты системы SYNERGON</p>

      <div className="space-y-5">
        {docs.map((doc) => (
          <div
            key={doc.id}
            className="bg-[#0a0a0f] rounded-xl p-5"
            style={{ border: `1px solid ${doc.color}33` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon name={doc.icon} size={16} style={{ color: doc.color }} />
              <span className="font-bold tracking-widest text-sm" style={{ color: doc.color }}>
                {doc.title}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1 mb-4">
              {doc.fields.map((f) => (
                <div key={f.label} className="flex gap-2 text-xs">
                  <span className="text-gray-500 min-w-48">{f.label}:</span>
                  <span className="text-white font-medium">{f.value}</span>
                </div>
              ))}
            </div>

            <div
              className="text-xs text-gray-400 whitespace-pre-line leading-relaxed border-t pt-3"
              style={{ borderColor: `${doc.color}20` }}
            >
              {doc.body}
            </div>

            <div className="text-right text-gray-600 text-xs italic mt-3">
              Verified by UBO: Николаев В.В.
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocsTab;
