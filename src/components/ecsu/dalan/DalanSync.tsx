import Icon from "@/components/ui/icon";

interface SyncStatus {
  gateway_enabled: boolean;
  gateway_url: string | null;
  pc_online: boolean;
  auto_source: "pc" | "cloud";
  dalan_config: { key: string; value: string; label: string; type: string }[];
  sync_time: string;
}

interface DalanSyncProps {
  syncStatus: SyncStatus | null;
  syncLoading: boolean;
  syncing: boolean;
  syncMsg: { text: string; ok: boolean } | null;
  autoSync: boolean;
  setAutoSync: (v: boolean) => void;
  onSync: () => void;
}

const DalanSync = ({
  syncStatus, syncLoading, syncing, syncMsg, autoSync, setAutoSync, onSync,
}: DalanSyncProps) => {
  return (
    <div className="space-y-4">
      <div className="bg-[#060d1f] border border-[#00c896]/30 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="RefreshCw" size={15} className="text-[#00c896]" />
          <span className="text-[#00c896] font-bold text-sm tracking-wider">ДИРЕКТИВА АВТОСИНХРОНИЗАЦИИ · DALAN</span>
        </div>
        <p className="text-gray-600 text-xs mb-4">
          При подключении шлюза (ngrok/localtunnel) система автоматически загружает конфигурацию Dalan с ПК.
          Если ПК недоступен — используется облачная конфигурация из базы данных.
        </p>

        {syncLoading ? (
          <div className="text-gray-600 animate-pulse text-sm">Проверка статуса...</div>
        ) : syncStatus ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-black/30 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <Icon name="Cpu" size={16} className={syncStatus.pc_online ? "text-green-400" : "text-blue-400"} />
                <span className="text-white text-sm font-medium">Активный источник</span>
              </div>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                syncStatus.pc_online
                  ? "bg-green-500/15 text-green-400"
                  : "bg-blue-500/15 text-blue-400"
              }`}>
                {syncStatus.pc_online ? "ПК · Локальный шлюз" : "Облако · База данных ЕЦСУ"}
              </span>
            </div>

            <div className="flex items-center justify-between bg-black/30 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <Icon name="Link" size={16} className="text-gray-500" />
                <span className="text-gray-400 text-sm">Шлюз ПК</span>
              </div>
              <span className="text-xs text-gray-500">
                {syncStatus.gateway_enabled
                  ? syncStatus.gateway_url || "URL не задан"
                  : "Отключён"}
              </span>
            </div>

            <div className="flex items-center justify-between bg-black/30 rounded-lg px-4 py-3">
              <div>
                <div className="text-white text-sm font-medium">Автосинхронизация</div>
                <div className="text-gray-600 text-xs mt-0.5">Каждые 30 секунд · автовыбор источника</div>
              </div>
              <button
                onClick={() => setAutoSync(!autoSync)}
                className={`w-12 h-6 rounded-full transition-colors relative ${autoSync ? "bg-[#00c896]" : "bg-gray-700"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${autoSync ? "left-7" : "left-1"}`} />
              </button>
            </div>

            {syncMsg && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${
                syncMsg.ok ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}>
                <Icon name={syncMsg.ok ? "CheckCircle" : "XCircle"} size={15} />
                {syncMsg.text}
              </div>
            )}

            <button
              onClick={onSync}
              disabled={syncing}
              className="w-full bg-[#00c896] hover:bg-[#00a87e] disabled:opacity-50 text-black font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {syncing
                ? <><Icon name="Loader2" size={16} className="animate-spin" /> Синхронизация...</>
                : <><Icon name="RefreshCw" size={16} /> Запустить синхронизацию сейчас</>}
            </button>
          </div>
        ) : (
          <div className="text-red-400 text-sm">Не удалось подключиться к модулю синхронизации</div>
        )}
      </div>

      {syncStatus?.dalan_config && (
        <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
          <div className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <Icon name="Settings2" size={14} className="text-[#FFD700]" />
            Текущая конфигурация DALAN
            <span className="text-gray-600 text-xs font-normal ml-1">
              · источник: {syncStatus.pc_online ? "ПК" : "облако"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {syncStatus.dalan_config.map(cfg => (
              <div key={cfg.key} className="bg-black/30 rounded-lg px-3 py-2 flex items-center justify-between">
                <span className="text-gray-500 text-xs">{cfg.label || cfg.key}</span>
                <span className="text-[#FFD700] font-mono text-xs font-bold">{cfg.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DalanSync;
