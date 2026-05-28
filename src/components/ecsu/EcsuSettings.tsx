import { useState } from "react";
import Icon from "@/components/ui/icon";

const EcsuSettings = () => {
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [liveData, setLiveData] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState("30");
  const [language, setLanguage] = useState("ru");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-full transition-all relative ${value ? "bg-blue-500" : "bg-gray-700"}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${value ? "left-5" : "left-0.5"}`} />
    </button>
  );

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
        <Icon name="Settings" size={20} className="text-blue-400" />
        Настройки
      </h2>
      <p className="text-gray-500 text-sm mb-6">Персональные настройки системы ЕЦСУ</p>

      <div className="space-y-4">
        {/* Общие */}
        <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
          <div className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <Icon name="Sliders" size={15} className="text-blue-400" />
            Общие
          </div>
          <div className="space-y-3">
            {[
              { label: "Уведомления", desc: "Получать уведомления о критических событиях", value: notifications, onChange: setNotifications },
              { label: "Авто-обновление", desc: "Обновлять данные автоматически", value: autoRefresh, onChange: setAutoRefresh },
              { label: "Тёмная тема", desc: "Использовать тёмное оформление", value: darkMode, onChange: setDarkMode },
              { label: "Live данные", desc: "Подключение к реальной базе данных ЕЦСУ", value: liveData, onChange: setLiveData },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-2 border-b border-blue-900/20 last:border-0">
                <div>
                  <div className="text-white text-sm">{s.label}</div>
                  <div className="text-gray-500 text-xs">{s.desc}</div>
                </div>
                <Toggle value={s.value} onChange={s.onChange} />
              </div>
            ))}
          </div>
        </div>

        {/* Интерфейс */}
        <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
          <div className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <Icon name="Monitor" size={15} className="text-blue-400" />
            Интерфейс
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white text-sm">Интервал обновления</div>
                <div className="text-gray-500 text-xs">Секунды между обновлениями данных</div>
              </div>
              <select
                value={refreshInterval}
                onChange={e => setRefreshInterval(e.target.value)}
                className="bg-[#060d1f] border border-blue-900/30 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="10">10 сек</option>
                <option value="30">30 сек</option>
                <option value="60">1 мин</option>
                <option value="300">5 мин</option>
              </select>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-blue-900/20">
              <div>
                <div className="text-white text-sm">Язык интерфейса</div>
                <div className="text-gray-500 text-xs">Язык системы</div>
              </div>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="bg-[#060d1f] border border-blue-900/30 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* Система */}
        <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
          <div className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <Icon name="Info" size={15} className="text-blue-400" />
            Информация о системе
          </div>
          <div className="space-y-1 text-xs">
            {[
              ["Версия ЕЦСУ", "2.0.4"],
              ["DALAN Engine", "v1.2 UBO Edition"],
              ["База данных", "PostgreSQL 15"],
              ["Последнее обновление", "09.05.2026"],
              ["Разработчик", "SYNERGON GLOBAL · Николаев В.В. · 2026"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5 border-b border-blue-900/10 last:border-0">
                <span className="text-gray-500">{k}</span>
                <span className="text-gray-300">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
            saved ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {saved ? "✓ Сохранено" : "Сохранить настройки"}
        </button>
      </div>
    </div>
  );
};

export default EcsuSettings;