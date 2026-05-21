import Icon from "@/components/ui/icon";
import { LMSettings, DEFAULT_SETTINGS } from "./AcTypes";

interface Props {
  settings: LMSettings;
  saveSettings: (s: LMSettings) => void;
  connected: boolean | null;
  checkConnection: () => void;
  knowledgeLength: number;
  docsLength: number;
  searchesLength: number;
}

const AcSettingsTab = ({
  settings, saveSettings, connected, checkConnection,
  knowledgeLength, docsLength, searchesLength,
}: Props) => {
  return (
    <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">

      <div className="bg-blue-900/10 border border-blue-700/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="Info" size={13} className="text-blue-400" />
          <span className="text-blue-300 text-sm font-semibold">Как подключить LM Studio</span>
        </div>
        <ol className="text-gray-400 text-xs space-y-1.5 list-decimal list-inside">
          <li>Скачай LM Studio: <span className="text-blue-400">lmstudio.ai</span></li>
          <li>Установи на ПК и запусти</li>
          <li>Скачай модель (рекомендую: Mistral 7B или LLaMA 3.1 8B)</li>
          <li>Перейди на вкладку <code className="text-green-400">Local Server</code></li>
          <li>Выбери модель и нажми <code className="text-green-400">Start Server</code></li>
          <li>Сервер запустится на порту 1234 по умолчанию</li>
        </ol>
      </div>

      <div className="bg-[#0a0f1e] border border-blue-900/30 rounded-xl p-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-500 text-[10px] uppercase mb-1.5 block">Хост</label>
            <input value={settings.host} onChange={e => saveSettings({ ...settings, host: e.target.value })}
              className="w-full bg-[#060b18] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white outline-none" />
          </div>
          <div>
            <label className="text-gray-500 text-[10px] uppercase mb-1.5 block">Порт</label>
            <input value={settings.port} onChange={e => saveSettings({ ...settings, port: e.target.value })}
              className="w-full bg-[#060b18] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white outline-none" />
          </div>
        </div>
        <div>
          <label className="text-gray-500 text-[10px] uppercase mb-1.5 block">Название модели (из LM Studio)</label>
          <input value={settings.model} onChange={e => saveSettings({ ...settings, model: e.target.value })}
            placeholder="default (или точное название из LM Studio)"
            className="w-full bg-[#060b18] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-500 text-[10px] uppercase mb-1.5 block">Temperature (0–1)</label>
            <input type="number" step="0.1" min="0" max="1" value={settings.temperature}
              onChange={e => saveSettings({ ...settings, temperature: parseFloat(e.target.value) })}
              className="w-full bg-[#060b18] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white outline-none" />
          </div>
          <div>
            <label className="text-gray-500 text-[10px] uppercase mb-1.5 block">Max Tokens</label>
            <input type="number" step="256" min="256" max="8192" value={settings.maxTokens}
              onChange={e => saveSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
              className="w-full bg-[#060b18] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white outline-none" />
          </div>
        </div>
        <div>
          <label className="text-gray-500 text-[10px] uppercase mb-1.5 block">Системный промпт (личность ИИ)</label>
          <textarea value={settings.systemPrompt}
            onChange={e => saveSettings({ ...settings, systemPrompt: e.target.value })}
            rows={5}
            className="w-full bg-[#060b18] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none" />
        </div>
        <div className="flex gap-2">
          <button onClick={checkConnection}
            className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
            <Icon name="Wifi" size={14} />
            Проверить подключение
          </button>
          <button onClick={() => saveSettings(DEFAULT_SETTINGS)}
            className="px-4 py-2.5 bg-gray-800 text-gray-400 text-sm rounded-lg hover:bg-gray-700 transition-colors">
            Сбросить
          </button>
        </div>
        {connected !== null && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${connected ? "bg-green-900/20 text-green-400" : "bg-red-900/20 text-red-400"}`}>
            <Icon name={connected ? "CheckCircle" : "XCircle"} size={14} />
            {connected ? "LM Studio доступен! Можно работать." : "LM Studio недоступен. Запустите сервер в LM Studio."}
          </div>
        )}
      </div>

      <div className="bg-[#0a0f1e] border border-purple-900/20 rounded-xl p-4">
        <div className="text-purple-300 text-xs font-semibold mb-3 flex items-center gap-2">
          <Icon name="Brain" size={12} />
          Статистика обучения
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Записей в базе", value: knowledgeLength, color: "#a78bfa" },
            { label: "Документов",     value: docsLength,      color: "#60a5fa" },
            { label: "Поисков",        value: searchesLength,  color: "#34d399" },
          ].map(s => (
            <div key={s.label} className="text-center bg-[#060b18] rounded-lg p-3">
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-gray-600 text-[10px] mt-1">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-gray-700 text-[10px]">
          Все данные хранятся локально в браузере (localStorage). ИИ использует их в каждом ответе через RAG.
        </div>
      </div>
    </div>
  );
};

export default AcSettingsTab;
