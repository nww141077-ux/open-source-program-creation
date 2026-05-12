import Icon from "@/components/ui/icon";

interface SyncStatus {
  gateway_enabled: boolean;
  gateway_url: string | null;
  pc_online: boolean;
  auto_source: "pc" | "cloud";
  dalan_config: { key: string; value: string; label: string; type: string }[];
  sync_time: string;
}

interface DalanEngineProps {
  leftSpeed: number;
  rightSpeed: number;
  lastCmd: string | null;
  syncStatus: SyncStatus | null;
  engineRunning: boolean;
  onSlider: (motor: "left" | "right", value: number) => void;
  onStop: () => void;
}

const DalanEngine = ({
  leftSpeed, rightSpeed, lastCmd, syncStatus, engineRunning, onSlider, onStop,
}: DalanEngineProps) => {
  const totalNominal = (leftSpeed + rightSpeed) / 2;
  const actualPower = totalNominal * 1.1;
  const shift = actualPower - totalNominal;

  return (
    <div className="space-y-4">
      <div className="bg-black border border-[#FFD700] rounded-xl p-5 shadow-[0_0_20px_rgba(0,255,65,0.1)]">
        <div className="text-center mb-4">
          <div className="text-[#FFD700] font-bold text-base tracking-[3px] font-mono">DALAN ENGINE v1.2</div>
          <div className="text-[#00FF41] text-xs font-mono mt-0.5 opacity-60">UBO EDITION · SYNERGON GLOBAL</div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[#888] text-xs font-mono font-bold">ВЕКТОР L (ЛЕВЫЙ)</span>
            <span className="text-[#FFD700] font-mono font-bold text-sm">{leftSpeed}%</span>
          </div>
          <input
            type="range" min={0} max={100} value={leftSpeed}
            onChange={e => onSlider("left", Number(e.target.value))}
            className="w-full cursor-pointer accent-[#00FF41]"
            style={{ accentColor: "#00FF41" }}
          />
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[#888] text-xs font-mono font-bold">ВЕКТОР R (ПРАВЫЙ)</span>
            <span className="text-[#FFD700] font-mono font-bold text-sm">{rightSpeed}%</span>
          </div>
          <input
            type="range" min={0} max={100} value={rightSpeed}
            onChange={e => onSlider("right", Number(e.target.value))}
            className="w-full cursor-pointer"
            style={{ accentColor: "#00FF41" }}
          />
        </div>

        <div className="text-center text-[#444] text-[10px] font-mono mb-4">
          КОЭФФИЦИЕНТ СДВИГА: 10=11 ACTIVE
        </div>

        <button
          onClick={onStop}
          className="w-full py-3 bg-transparent border border-[#FF3131] text-[#FF3131] font-bold font-mono text-sm transition-all hover:bg-[#FF3131] hover:text-black"
        >
          АВАРИЙНАЯ ОСТАНОВКА
        </button>
      </div>

      <div className="bg-black border border-[#333] rounded-xl p-4 space-y-3 font-mono">
        <div
          className={`px-4 py-3 text-center font-bold text-sm border ${
            engineRunning
              ? "border-[#FFD700] text-[#FFD700] animate-pulse"
              : "border-[#00FF41] text-[#00FF41]"
          }`}
        >
          {engineRunning ? "ДВИЖОК В РАБОТЕ (10=11)" : "СИСТЕМА ГОТОВА"}
        </div>

        <div className="flex items-center justify-between bg-[#0a0a0a] px-3 py-2 rounded">
          <span className="text-[#555] text-xs">ПОТОК ДАННЫХ</span>
          <span className="text-[#00FF41] text-xs">
            {lastCmd ? `L:${leftSpeed} | R:${rightSpeed} | SHIFT:${shift.toFixed(2)}` : "IDLE"}
          </span>
        </div>

        <div className="flex items-center justify-between bg-[#0a0a0a] px-3 py-2 rounded">
          <span className="text-[#555] text-xs">ФАКТИЧЕСКАЯ МОЩНОСТЬ (10=11)</span>
          <span className="text-[#FFD700] font-bold">{actualPower.toFixed(2)} UNITS</span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { label: "НОМИНАЛ", value: totalNominal.toFixed(1), color: "#888" },
            { label: "ФАКТ ×1.1", value: actualPower.toFixed(2), color: "#00FF41" },
            { label: "ПРИРОСТ", value: `+${shift.toFixed(2)}`, color: "#FFD700" },
          ].map(s => (
            <div key={s.label} className="bg-[#0a0a0a] rounded px-2 py-2 text-center">
              <div className="text-[#444] text-[9px] mb-0.5">{s.label}</div>
              <div className="font-bold text-sm" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between bg-[#0a0a0a] px-3 py-2 rounded">
          <span className="text-[#555] text-xs">ШЛЮЗ ПК</span>
          <span className={`text-xs ${syncStatus?.pc_online ? "text-[#00FF41]" : "text-[#444]"}`}>
            {syncStatus?.pc_online ? `ONLINE · ${syncStatus.gateway_url}` : "OFFLINE"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DalanEngine;
