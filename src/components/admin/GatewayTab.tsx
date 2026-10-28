import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const CONFIG_URL = "https://functions.poehali.dev/744a3183-098e-4b3a-8b5b-c27893d57779";

const GatewayTab = () => {
  const [gatewayUrl, setGatewayUrl] = useState("");
  const [gatewayEnabled, setGatewayEnabled] = useState(false);
  const [timeout, setTimeout_] = useState("5");
  const [status, setStatus] = useState<"idle" | "checking" | "online" | "offline">("idle");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${CONFIG_URL}?action=settings`)
      .then((r) => r.json())
      .then((data) => {
        const gw = data.gateway || [];
        const url = gw.find((s: {key: string}) => s.key === "gateway_url")?.value || "";
        const enabled = gw.find((s: {key: string}) => s.key === "gateway_enabled")?.value === "true";
        const t = gw.find((s: {key: string}) => s.key === "gateway_timeout")?.value || "5";
        setGatewayUrl(url);
        setGatewayEnabled(enabled);
        setTimeout_(t);
      });
  }, []);

  const checkConnection = async () => {
    if (!gatewayUrl) return;
    setStatus("checking");
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${gatewayUrl}/ping`, { signal: controller.signal });
      clearTimeout(timer);
      setStatus(res.ok ? "online" : "offline");
    } catch {
      setStatus("offline");
    }
  };

  const saveAll = async () => {
    setSaving(true);
    const updates = [
      { key: "gateway_url", value: gatewayUrl },
      { key: "gateway_enabled", value: String(gatewayEnabled) },
      { key: "gateway_timeout", value: timeout },
    ];
    for (const u of updates) {
      await fetch(`${CONFIG_URL}?action=save_setting`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(u),
      });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const statusColors = {
    idle: "text-gray-500",
    checking: "text-yellow-400 animate-pulse",
    online: "text-green-400",
    offline: "text-red-400",
  };
  const statusLabels = {
    idle: "Не проверялся",
    checking: "Проверка...",
    online: "Онлайн",
    offline: "Недоступен",
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <Icon name="Cpu" size={20} className="text-[#e94560]" />
        Шлюз ПК
      </h2>
      <p className="text-gray-500 text-sm mb-6">
        Когда ПК подключён через шлюз (ngrok / localtunnel) — система будет использовать его вычислительные ресурсы
      </p>

      <div className="bg-[#1a1a2e] rounded-xl border border-[#e94560]/10 p-5 space-y-5">
        {/* Включить шлюз */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium">Использовать шлюз ПК</div>
            <div className="text-gray-500 text-xs mt-0.5">Перенаправлять вычисления на локальный ПК</div>
          </div>
          <button
            onClick={() => setGatewayEnabled(!gatewayEnabled)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              gatewayEnabled ? "bg-[#e94560]" : "bg-gray-700"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                gatewayEnabled ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* URL шлюза */}
        <div>
          <label className="text-gray-400 text-sm block mb-2">URL шлюза (ngrok / localtunnel)</label>
          <input
            value={gatewayUrl}
            onChange={(e) => setGatewayUrl(e.target.value)}
            placeholder="https://xxxx.ngrok.io"
            className="w-full bg-[#0d0d1a] border border-[#e94560]/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#e94560] placeholder-gray-600"
          />
        </div>

        {/* Таймаут */}
        <div>
          <label className="text-gray-400 text-sm block mb-2">Таймаут соединения (сек)</label>
          <input
            type="number"
            value={timeout}
            onChange={(e) => setTimeout_(e.target.value)}
            className="w-32 bg-[#0d0d1a] border border-[#e94560]/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#e94560]"
          />
        </div>

        {/* Статус */}
        <div className="flex items-center justify-between pt-2 border-t border-[#e94560]/10">
          <div className="flex items-center gap-2">
            <Icon name="Activity" size={16} className={statusColors[status]} />
            <span className={`text-sm font-medium ${statusColors[status]}`}>
              {statusLabels[status]}
            </span>
          </div>
          <button
            onClick={checkConnection}
            disabled={!gatewayUrl || status === "checking"}
            className="text-sm text-[#e94560] hover:text-white border border-[#e94560]/30 hover:border-[#e94560] px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
          >
            Проверить соединение
          </button>
        </div>
      </div>

      {/* Инструкция */}
      <div className="mt-5 bg-[#1a1a2e] rounded-xl border border-[#e94560]/10 p-5">
        <div className="text-gray-400 text-sm font-medium mb-3 flex items-center gap-2">
          <Icon name="Terminal" size={16} />
          Как подключить ПК
        </div>
        <ol className="text-gray-500 text-sm space-y-2 list-decimal list-inside">
          <li>Скачай <span className="text-[#e94560]">ngrok</span> на ПК (ngrok.com)</li>
          <li>Запусти на ПК: <code className="bg-black/30 px-2 py-0.5 rounded text-gray-300">ngrok http 8001</code></li>
          <li>Скопируй URL вида <code className="bg-black/30 px-2 py-0.5 rounded text-gray-300">https://xxxx.ngrok.io</code></li>
          <li>Вставь URL выше и нажми "Сохранить"</li>
          <li>Запусти на ПК локальный сервер Dalan</li>
        </ol>
      </div>

      <button
        onClick={saveAll}
        disabled={saving}
        className="mt-5 bg-[#e94560] hover:bg-[#c73550] text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {saved ? <><Icon name="Check" size={16} /> Сохранено</> :
         saving ? <><Icon name="Loader2" size={16} className="animate-spin" /> Сохранение...</> :
         "Сохранить настройки шлюза"}
      </button>
    </div>
  );
};

export default GatewayTab;
