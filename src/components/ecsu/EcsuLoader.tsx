import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";

const UPLOAD_URL = "https://functions.poehali.dev/0639f989-669a-462c-aac5-7730ba2e2470";

interface UploadRecord {
  name: string;
  size: string;
  status: "success" | "error";
  rows: number;
  date: string;
}

const EcsuLoader = () => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [history, setHistory] = useState<UploadRecord[]>([]);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
    return `${(bytes / 1024).toFixed(0)} КБ`;
  };

  const handleFile = async (file: File) => {
    if (!file) return;
    const allowed = [".csv", ".json", ".xlsx", ".xls"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      setMessage({ text: "Формат не поддерживается. Используйте CSV, JSON или XLSX.", ok: false });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setMessage({ text: "Файл слишком большой. Максимум 50 МБ.", ok: false });
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        setUploadProgress(40);
        const base64 = (e.target?.result as string).split(",")[1];
        setUploadProgress(60);

        try {
          const res = await fetch(UPLOAD_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "upload_file",
              filename: file.name,
              content_base64: base64,
              size: file.size,
            }),
          });
          setUploadProgress(90);
          const data = await res.json();
          const ok = res.ok && !data.error;
          const record: UploadRecord = {
            name: file.name,
            size: formatSize(file.size),
            status: ok ? "success" : "error",
            rows: data.rows || 0,
            date: new Date().toLocaleString("ru-RU").replace(",", ""),
          };
          setHistory(prev => [record, ...prev]);
          setMessage({ text: ok ? `Файл загружен: ${file.name}` : `Ошибка: ${data.error || "неизвестная"}`, ok });
        } catch {
          const record: UploadRecord = {
            name: file.name, size: formatSize(file.size),
            status: "error", rows: 0,
            date: new Date().toLocaleString("ru-RU").replace(",", ""),
          };
          setHistory(prev => [record, ...prev]);
          setMessage({ text: "Ошибка соединения с сервером", ok: false });
        }
        setUploadProgress(100);
        setUploading(false);
        setTimeout(() => setUploadProgress(0), 800);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
      setMessage({ text: "Ошибка чтения файла", ok: false });
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
        <Icon name="Upload" size={20} className="text-blue-400" />
        Загрузчик данных
      </h2>
      <p className="text-gray-500 text-sm mb-6">Импорт данных инцидентов, регионов и справочников</p>

      {/* Сообщение */}
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${message.ok ? "bg-green-900/30 border border-green-700/40 text-green-400" : "bg-red-900/30 border border-red-700/40 text-red-400"}`}>
          <Icon name={message.ok ? "CheckCircle" : "AlertCircle"} size={15} />
          {message.text}
        </div>
      )}

      {/* Drop zone */}
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.json,.xlsx,.xls"
        className="hidden"
        onChange={onInputChange}
      />
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center mb-6 cursor-pointer transition-all ${
          dragging ? "border-blue-400 bg-blue-900/20" : "border-blue-900/40 hover:border-blue-700/60 hover:bg-blue-900/10"
        } ${uploading ? "pointer-events-none" : ""}`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <div className="text-blue-400 font-medium">Загрузка... {uploadProgress}%</div>
            <div className="w-48 h-1.5 bg-blue-900/40 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Icon name="UploadCloud" size={40} className="text-blue-400/50" />
            <div className="text-white font-medium">Перетащите файл или нажмите для выбора</div>
            <div className="text-gray-500 text-sm">Поддерживаются: CSV, JSON, XLSX · Макс. 50 МБ</div>
          </div>
        )}
      </div>

      {/* История */}
      <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-4">
        <div className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <Icon name="History" size={15} className="text-blue-400" />
          История загрузок
        </div>
        {history.length === 0 ? (
          <div className="text-gray-600 text-sm text-center py-6">Загрузок ещё не было</div>
        ) : (
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#060d1f] rounded-lg p-3">
                <Icon
                  name={h.status === "success" ? "FileCheck" : "FileX"}
                  size={16}
                  style={{ color: h.status === "success" ? "#00c896" : "#e94560" }}
                />
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">{h.name}</div>
                  <div className="text-gray-500 text-xs">
                    {h.size}{h.rows > 0 ? ` · ${h.rows} строк` : h.status === "error" ? " · Ошибка обработки" : ""}
                  </div>
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
        )}
      </div>
    </div>
  );
};

export default EcsuLoader;
