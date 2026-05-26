import { useState } from "react";
import Icon from "@/components/ui/icon";

const history = [
  { name: "incidents_april_2026.csv", size: "2.4 МБ", status: "success", rows: 1247, date: "09.05.2026 18:33" },
  { name: "regions_update.json", size: "0.8 МБ", status: "success", rows: 89, date: "08.05.2026 14:11" },
  { name: "threat_matrix_v3.xlsx", size: "5.1 МБ", status: "error", rows: 0, date: "07.05.2026 09:44" },
  { name: "organs_data.csv", size: "1.2 МБ", status: "success", rows: 312, date: "06.05.2026 22:05" },
];

const EcsuLoader = () => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFake = () => {
    setUploading(true);
    setTimeout(() => setUploading(false), 2000);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
        <Icon name="Upload" size={20} className="text-blue-400" />
        Загрузчик данных
      </h2>
      <p className="text-gray-500 text-sm mb-6">Импорт данных инцидентов, регионов и справочников</p>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFake(); }}
        onClick={handleFake}
        className={`border-2 border-dashed rounded-xl p-10 text-center mb-6 cursor-pointer transition-all ${
          dragging ? "border-blue-400 bg-blue-900/20" : "border-blue-900/40 hover:border-blue-700/60 hover:bg-blue-900/10"
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <div className="text-blue-400 font-medium">Загрузка...</div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Icon name="UploadCloud" size={40} className="text-blue-400/50" />
            <div className="text-white font-medium">Перетащите файл или нажмите для выбора</div>
            <div className="text-gray-500 text-sm">Поддерживаются: CSV, JSON, XLSX · Макс. 50 МБ</div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
        <div className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <Icon name="History" size={15} className="text-blue-400" />
          История загрузок
        </div>
        <div className="space-y-2">
          {history.map((h) => (
            <div key={h.name} className="flex items-center gap-3 bg-[#060d1f] rounded-lg p-3">
              <Icon
                name={h.status === "success" ? "FileCheck" : "FileX"}
                size={16}
                style={{ color: h.status === "success" ? "#00c896" : "#e94560" }}
              />
              <div className="flex-1">
                <div className="text-white text-sm font-medium">{h.name}</div>
                <div className="text-gray-500 text-xs">{h.size}{h.rows > 0 ? ` · ${h.rows} строк` : " · Ошибка обработки"}</div>
              </div>
              <div className="text-gray-600 text-xs shrink-0">{h.date}</div>
              <span className="text-xs font-bold px-2 py-0.5 rounded shrink-0"
                style={{
                  color: h.status === "success" ? "#00c896" : "#e94560",
                  background: (h.status === "success" ? "#00c896" : "#e94560") + "20"
                }}>
                {h.status === "success" ? "Успех" : "Ошибка"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EcsuLoader;
