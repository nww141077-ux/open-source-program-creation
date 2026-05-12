import Icon from "@/components/ui/icon";

interface DalanShiftProps {
  shiftInput: string;
  setShiftInput: (v: string) => void;
  shiftResult: { nominal: number; actual: number; delta: number } | null;
  onRun: () => void;
}

const DalanShift = ({ shiftInput, setShiftInput, shiftResult, onRun }: DalanShiftProps) => {
  return (
    <div className="bg-[#060d1f] border border-[#FFD700]/20 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <Icon name="FlaskConical" size={15} className="text-[#FFD700]" />
        <span className="text-[#FFD700] font-bold text-sm">СДВИГ НИКОЛАЕВА · ЯДРО DALAN</span>
      </div>
      <p className="text-gray-600 text-xs mb-5">Авторская методика Николаева В.В. · Коэффициент ×1.1 · Зарегистрировано в ЕЦСУ</p>
      <div className="flex gap-3 items-end mb-4">
        <div className="flex-1">
          <div className="text-gray-400 text-xs mb-1">Входное значение (номинал)</div>
          <input
            type="number"
            value={shiftInput}
            onChange={(e) => setShiftInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onRun()}
            placeholder="Введите число..."
            className="w-full bg-black border border-[#FFD700]/30 text-white rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#FFD700]"
          />
        </div>
        <button
          onClick={onRun}
          className="bg-[#FFD700] hover:bg-[#e6c200] text-black px-5 py-2.5 rounded-lg font-bold text-sm transition-colors"
        >
          Применить ×1.1
        </button>
      </div>
      {shiftResult && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Номинал", value: shiftResult.nominal, color: "#fff" },
            { label: "Результат", value: shiftResult.actual.toFixed(2), color: "#00FF41" },
            { label: "Прирост", value: `+${shiftResult.delta.toFixed(2)}`, color: "#FFD700" },
          ].map((r) => (
            <div key={r.label} className="bg-black/50 rounded-lg p-3 text-center">
              <div className="text-gray-500 text-xs mb-1">{r.label}</div>
              <div className="font-mono font-bold text-lg" style={{ color: r.color }}>{r.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DalanShift;
