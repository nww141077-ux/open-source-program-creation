/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Icon from "@/components/ui/icon";

const WEEKLY = [
  { day: "Пн", count: 12 },
  { day: "Вт", count: 19 },
  { day: "Ср", count: 8 },
  { day: "Чт", count: 24 },
  { day: "Пт", count: 16 },
  { day: "Сб", count: 9 },
  { day: "Вс", count: 14 },
];

const BY_TYPE = [
  { type: "Экология", count: 45, color: "#00ff87" },
  { type: "Вода", count: 28, color: "#3b82f6" },
  { type: "Воздух", count: 19, color: "#f59e0b" },
  { type: "Кибер", count: 8, color: "#f43f5e" },
];

const STATUS_COLORS: Record<string, string> = { active: "#f43f5e", investigating: "#f59e0b", resolved: "#00ff87" };
const STATUS_LABELS: Record<string, string> = { active: "Активен", investigating: "Расследование", resolved: "Решён" };

const KPI_DETAILS = [
  {
    label: "Всего инцидентов", value: "1 247", delta: "+12%", icon: "AlertTriangle", color: "#f43f5e",
    description: "Общее число зафиксированных инцидентов в системе ECSU за текущий месяц. Включает все категории угроз — экологические, кибер-, водные и воздушные нарушения.",
    breakdown: [
      { label: "Экологические", value: "561", pct: 45 },
      { label: "Водные", value: "349", pct: 28 },
      { label: "Воздушные", value: "237", pct: 19 },
      { label: "Кибератаки", value: "100", pct: 8 },
    ],
    trend: "Рост на 12% по сравнению с мартом 2026 года. Основной вклад — Юго-Восточная Азия (+34%).",
  },
  {
    label: "Решено", value: "893", delta: "+8%", icon: "CheckCircle", color: "#00ff87",
    description: "Количество инцидентов, по которым завершено расследование, приняты меры реагирования и закрыто дело. Решение подтверждается координатором и вносится в базу ECSU.",
    breakdown: [
      { label: "В срок (< 72ч)", value: "621", pct: 70 },
      { label: "Затяжные (> 72ч)", value: "272", pct: 30 },
    ],
    trend: "Эффективность выросла на 8%. Среднее время закрытия инцидента — 41 час.",
  },
  {
    label: "Активных", value: "241", delta: "-3%", icon: "Activity", color: "#f59e0b",
    description: "Инциденты в статусе «Активен» или «Расследование», требующие внимания операторов и органов реагирования прямо сейчас. Снижение показателя — положительная динамика.",
    breakdown: [
      { label: "Критические", value: "18", pct: 7 },
      { label: "Высокий приоритет", value: "89", pct: 37 },
      { label: "Средний приоритет", value: "134", pct: 56 },
    ],
    trend: "Снижение на 3% — результат работы СБР в Нигерии и Канаде.",
  },
  {
    label: "Стран-участниц", value: "47", delta: "+2", icon: "Globe", color: "#a855f7",
    description: "Число государств, которые официально подписали соглашение ECSU 2.0 и ведут активную отчётность. В апреле к системе присоединились Эфиопия и Боливия.",
    breakdown: [
      { label: "Европа", value: "18", pct: 38 },
      { label: "Азия", value: "14", pct: 30 },
      { label: "Африка", value: "9", pct: 19 },
      { label: "Америки", value: "6", pct: 13 },
    ],
    trend: "В апреле 2026 присоединились Эфиопия и Боливия. Ещё 12 стран на стадии ратификации.",
  },
];

const maxCount = Math.max(...WEEKLY.map(w => w.count));
const total = BY_TYPE.reduce((a, b) => a + b.count, 0);

const COUNTRY_COORDS: Record<string, [number, number]> = {
  "Бразилия": [280, 340], "Германия": [490, 165], "Китай": [730, 210],
  "Кения": [540, 310], "Норвегия": [490, 130], "Нигерия": [480, 290],
  "Канада": [210, 155], "Индия": [650, 250], "Россия": [620, 145],
  "США": [185, 210], "Австралия": [790, 380], "Франция": [470, 175],
  "Япония": [800, 205], "Аргентина": [265, 400], "ЮАР": [510, 370],
  // English names from real DB
  "Japan": [800, 205], "Australia": [790, 380], "Indonesia": [755, 310],
  "China": [730, 210], "India": [650, 250], "Russia": [620, 145],
  "USA": [185, 210], "United States": [185, 210], "Canada": [210, 155],
  "Brazil": [280, 340], "Germany": [490, 165], "France": [470, 175],
  "Kenya": [540, 310], "Nigeria": [480, 290], "Norway": [490, 130],
  "New Zealand": [840, 415], "Solomon Islands": [830, 320],
  "Tonga": [860, 355], "Costa Rica": [210, 295], "Mongolia": [720, 180],
  "Mongolia, China": [720, 185], "Nevada": [155, 215],
  "South Of Kermadec Islands": [855, 380], "SOUTH OF KERMADEC ISLANDS": [855, 380],
  "Carlsberg Ridge": [590, 265], "CARLSBERG RIDGE": [590, 265],
  "OFF EAST COAST OF HONSHU, JAPAN": [810, 200],
  "MOLUCCA SEA": [760, 295], "KURIL ISLANDS": [820, 165],
  "Timor-Leste": [775, 320], "Philippines": [775, 270],
  "Chile": [255, 380], "Mexico": [190, 265], "Argentina": [265, 400],
  "Global": [500, 250],
};

// Сферические координаты (lon, lat) для 3D-глобуса
const COUNTRY_GEO: Record<string, [number, number]> = {
  "Бразилия": [-52, -14], "Германия": [10, 51], "Китай": [104, 35],
  "Кения": [37, 1], "Норвегия": [10, 62], "Нигерия": [8, 9],
  "Канада": [-96, 56], "Индия": [78, 22], "Россия": [60, 60],
  "США": [-98, 38], "Австралия": [134, -25], "Франция": [2, 46],
  "Япония": [138, 36], "Аргентина": [-64, -34], "ЮАР": [25, -29],
  // English names from real DB
  "Japan": [138, 36], "Australia": [134, -25], "Indonesia": [117, -2],
  "China": [104, 35], "India": [78, 22], "Russia": [60, 60],
  "USA": [-98, 38], "United States": [-98, 38], "Canada": [-96, 56],
  "Brazil": [-52, -14], "Germany": [10, 51], "France": [2, 46],
  "Kenya": [37, 1], "Nigeria": [8, 9], "Norway": [10, 62],
  "New Zealand": [172, -41], "Solomon Islands": [160, -9],
  "Tonga": [-175, -21], "Costa Rica": [-84, 10], "Mongolia": [105, 46],
  "Mongolia, China": [105, 44], "Nevada": [-117, 39],
  "South Of Kermadec Islands": [-178, -32], "SOUTH OF KERMADEC ISLANDS": [-178, -32],
  "Carlsberg Ridge": [63, 7], "CARLSBERG RIDGE": [63, 7],
  "OFF EAST COAST OF HONSHU, JAPAN": [142, 37],
  "MOLUCCA SEA": [127, 1], "KURIL ISLANDS": [151, 46],
  "Timor-Leste": [125, -8], "Philippines": [122, 13],
  "Chile": [-71, -30], "Mexico": [-102, 24], "Argentina": [-64, -34],
  "Global": [0, 0],
};

const SEV_COLOR: Record<string, string> = {
  critical: "#f43f5e", high: "#f59e0b", medium: "#a855f7", low: "#3b82f6",
};

const SEV_LABEL: Record<string, string> = {
  critical: "Критический", high: "Высокий", medium: "Средний", low: "Низкий",
};

// Видео по типу инцидента (демо — YouTube embed)
const TYPE_VIDEOS: Record<string, string> = {
  ecology: "https://www.youtube.com/embed/IFBF9j2A4sg",
  water: "https://www.youtube.com/embed/uFwGZHHqHTE",
  air: "https://www.youtube.com/embed/DCCGKd7DqEk",
  cyber: "https://www.youtube.com/embed/AQDCe585Lnc",
};

// ─── Модальное окно инцидента ─────────────────────────────────────────────────
function IncidentDetailModal({ inc, onClose }: { inc: any; onClose: () => void }) {
  const [tab, setTab] = useState<"info" | "video">("info");
  const color = SEV_COLOR[inc.severity] || "#a855f7";
  const videoUrl = TYPE_VIDEOS[inc.type] || TYPE_VIDEOS.ecology;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
      onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: "#080e1a", border: `1px solid ${color}40`, boxShadow: `0 0 80px ${color}25, 0 20px 60px rgba(0,0,0,0.7)` }}
        onClick={e => e.stopPropagation()}>

        {/* Шапка */}
        <div className="px-5 py-4 flex items-start justify-between"
          style={{ background: `linear-gradient(135deg, ${color}15, rgba(255,255,255,0.02))`, borderBottom: `1px solid ${color}25` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
              <Icon name={inc.type === "cyber" ? "Shield" : inc.type === "water" ? "Droplets" : inc.type === "air" ? "Wind" : "Leaf"} size={20} style={{ color }} />
            </div>
            <div>
              <div className="text-white font-bold text-base leading-tight">{inc.title}</div>
              <div className="text-white/40 text-xs mt-0.5">{inc.id} · {inc.country} · {inc.date}</div>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 transition-colors shrink-0"
            style={{ background: "rgba(255,255,255,0.06)" }}>
            <Icon name="X" size={14} />
          </button>
        </div>

        {/* Табы */}
        <div className="flex" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {([["info", "Детали", "FileText"], ["video", "Видео", "Play"]] as const).map(([id, label, icon]) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all"
              style={{
                color: tab === id ? color : "rgba(255,255,255,0.3)",
                borderBottom: tab === id ? `2px solid ${color}` : "2px solid transparent",
                background: tab === id ? `${color}08` : "transparent",
              }}>
              <Icon name={icon as any} size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Контент: Детали */}
        {tab === "info" && (
          <div className="p-5 space-y-4">
            {/* Статус + Уровень */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Уровень", value: SEV_LABEL[inc.severity] || inc.severity, color },
                { label: "Статус", value: inc.status === "active" ? "Активен" : inc.status === "investigating" ? "Расследование" : "Решён", color: STATUS_COLORS[inc.status] || "#fff" },
                { label: "ИИ-оценка", value: `${inc.ai}%`, color: inc.ai >= 85 ? "#00ff87" : "#f59e0b" },
              ].map(item => (
                <div key={item.label} className="rounded-xl p-3 text-center"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="text-[10px] text-white/35 mb-1">{item.label}</div>
                  <div className="font-bold text-sm" style={{ color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Инфо */}
            <div className="space-y-2.5 text-sm">
              {[
                ["Ответственный орган", inc.responsible],
                ["Тип инцидента", inc.type === "ecology" ? "🌿 Экология" : inc.type === "water" ? "💧 Водные ресурсы" : inc.type === "air" ? "🌬️ Атмосфера" : "🛡️ Кибербезопасность"],
                ["Дата регистрации", inc.date],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="text-white/40 text-xs">{k}</span>
                  <span className="text-white/80 text-xs font-medium">{v}</span>
                </div>
              ))}
            </div>

            {/* ИИ-шкала */}
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-white/40">Достоверность ИИ-верификации</span>
                <span style={{ color: inc.ai >= 85 ? "#00ff87" : "#f59e0b" }}>{inc.ai}%</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-2 rounded-full transition-all"
                  style={{ width: `${inc.ai}%`, background: `linear-gradient(90deg, ${color}, ${inc.ai >= 85 ? "#00ff87" : "#f59e0b"})` }} />
              </div>
            </div>

            <button onClick={() => setTab("video")}
              className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:scale-[1.01]"
              style={{ background: `linear-gradient(135deg, ${color}30, rgba(255,255,255,0.05))`, color, border: `1px solid ${color}40` }}>
              <Icon name="Play" size={14} />
              Смотреть видео по инциденту
            </button>
          </div>
        )}

        {/* Контент: Видео */}
        {tab === "video" && (
          <div className="p-5">
            <div className="rounded-xl overflow-hidden mb-3" style={{ background: "#000", aspectRatio: "16/9" }}>
              <iframe
                src={videoUrl}
                title={inc.title}
                width="100%" height="100%"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ border: "none", display: "block" }}
              />
            </div>
            <div className="text-xs text-white/30 text-center">
              Документальный материал по категории: {inc.type === "ecology" ? "Экология" : inc.type === "water" ? "Водные ресурсы" : inc.type === "air" ? "Атмосфера" : "Кибербезопасность"}
            </div>
            <button onClick={() => setTab("info")}
              className="w-full mt-3 py-2 rounded-xl text-xs font-semibold text-white/40 hover:text-white/70 transition-colors"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              ← Назад к деталям
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Вспомогательные SVG-контуры континентов ─────────────────────────────────
const CONTINENTS = [
  { d: "M 80,100 Q 150,70 220,85 L 330,80 L 360,190 L 330,270 L 280,295 L 230,290 L 200,265 L 145,225 L 100,165 Z", label: "С.Америка" },
  { d: "M 218,295 L 320,285 L 345,355 L 310,435 Q 280,460 250,455 L 215,405 L 212,345 Z", label: "Ю.Америка" },
  { d: "M 432,98 Q 480,82 545,88 L 565,92 L 572,168 L 520,198 L 460,195 L 432,155 Z", label: "Европа" },
  { d: "M 445,207 L 572,197 L 592,258 L 565,372 L 505,412 L 448,382 L 428,308 L 438,248 Z", label: "Африка" },
  { d: "M 568,78 Q 680,62 800,68 L 862,72 L 872,195 L 825,248 L 752,262 L 665,232 L 600,218 L 570,172 Z", label: "Азия" },
  { d: "M 738,338 Q 790,322 858,328 L 882,408 L 822,442 L 752,422 L 730,380 Z", label: "Австралия" },
];

// ─── ВИД 1: Плоская карта ────────────────────────────────────────────────────
function FlatMap({ points, onSelect }: { points: any[]; onSelect: (inc: any) => void }) {
  const [hovered, setHovered] = useState<any | null>(null);
  return (
    <div className="relative" style={{ paddingBottom: "50%" }}>
      <svg viewBox="0 0 1000 500" className="absolute inset-0 w-full h-full">
        {/* Фон-сетка */}
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="1000" height="500" fill="url(#grid)" />
        {/* Линии экватора и тропиков */}
        <line x1="0" y1="250" x2="1000" y2="250" stroke="rgba(59,130,246,0.15)" strokeWidth="1" strokeDasharray="6,4" />
        <line x1="0" y1="185" x2="1000" y2="185" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="4,6" />
        <line x1="0" y1="315" x2="1000" y2="315" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="4,6" />
        <text x="8" y="248" fontSize="8" fill="rgba(59,130,246,0.4)">экватор</text>
        {/* Континенты */}
        {CONTINENTS.map(c => (
          <path key={c.label} d={c.d}
            fill="rgba(99,102,241,0.07)" stroke="rgba(99,102,241,0.25)" strokeWidth="1" />
        ))}
        {/* Точки */}
        {points.map((inc, i) => {
          const [cx, cy] = inc.flatCoords;
          const color = SEV_COLOR[inc.severity] || "#a855f7";
          const isHov = hovered?.id === inc.id;
          return (
            <g key={i} style={{ cursor: "pointer" }}
              onClick={() => onSelect(inc)}
              onMouseEnter={() => setHovered(inc)}
              onMouseLeave={() => setHovered(null)}>
              {/* Пульс для активных */}
              {inc.status === "active" && (
                <circle cx={cx} cy={cy} r="16" fill={color} opacity="0.08">
                  <animate attributeName="r" values="8;20;8" dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.12;0.03;0.12" dur="2.5s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={cx} cy={cy} r={isHov ? 9 : 7} fill={color}
                stroke={isHov ? "white" : "rgba(255,255,255,0.4)"} strokeWidth={isHov ? 2 : 1}
                style={{ transition: "r 0.15s" }} />
              {isHov && (
                <>
                  <rect x={cx + 12} y={cy - 20} width={inc.country.length * 6 + 8} height={28} rx="4"
                    fill="#0d1220" stroke={`${color}80`} strokeWidth="1" />
                  <text x={cx + 16} y={cy - 7} fontSize="9" fill="white" fontWeight="bold">{inc.title.slice(0, 18)}{inc.title.length > 18 ? "…" : ""}</text>
                  <text x={cx + 16} y={cy + 4} fontSize="8" fill="rgba(255,255,255,0.5)">{inc.country}</text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── ВИД 2: 3D-Глобус (CSS perspective + SVG эллипс) ──────────────────────
function GlobeMap({ points, onSelect }: { points: any[]; onSelect: (inc: any) => void }) {
  const [rot, setRot] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [rotStart, setRotStart] = useState(0);
  const [hovered, setHovered] = useState<any | null>(null);

  const R = 200; // радиус глобуса в SVG-единицах

  // Перевод geo(lon,lat) → 3D → 2D с учётом поворота
  const project = (lon: number, lat: number): { x: number; y: number; visible: boolean } => {
    const φ = (lat * Math.PI) / 180;
    const λ = ((lon + rot) * Math.PI) / 180;
    const x = R * Math.cos(φ) * Math.sin(λ);
    const y = -R * Math.sin(φ);
    const z = R * Math.cos(φ) * Math.cos(λ);
    return { x: x + 250, y: y + 250, visible: z > 0 };
  };

  const onMouseDown = (e: React.MouseEvent) => { setDragging(true); setStartX(e.clientX); setRotStart(rot); };
  const onMouseMove = (e: React.MouseEvent) => { if (dragging) setRot(rotStart + (e.clientX - startX) * 0.4); };
  const onMouseUp = () => setDragging(false);

  // Меридианы и параллели
  const meridians = Array.from({ length: 12 }, (_, i) => i * 30);
  const parallels = [-60, -30, 0, 30, 60];

  return (
    <div className="relative flex items-center justify-center" style={{ height: 420 }}>
      {/* Подсветка-сфера */}
      <div className="absolute rounded-full pointer-events-none"
        style={{
          width: 420, height: 420,
          background: "radial-gradient(circle at 35% 35%, rgba(99,102,241,0.18) 0%, rgba(168,85,247,0.08) 50%, transparent 70%)",
          boxShadow: "0 0 80px rgba(99,102,241,0.12), inset 0 0 60px rgba(0,0,50,0.5)",
          borderRadius: "50%",
        }} />

      <svg viewBox="0 0 500 500" width="420" height="420"
        style={{ cursor: dragging ? "grabbing" : "grab", userSelect: "none" }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>

        {/* Тень */}
        <defs>
          <radialGradient id="globeShadow" cx="45%" cy="45%" r="55%">
            <stop offset="0%" stopColor="rgba(99,102,241,0.15)" />
            <stop offset="60%" stopColor="rgba(30,40,80,0.4)" />
            <stop offset="100%" stopColor="rgba(5,10,25,0.95)" />
          </radialGradient>
          <radialGradient id="globeShine" cx="30%" cy="25%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.07)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <clipPath id="globeClip">
            <circle cx="250" cy="250" r={R} />
          </clipPath>
        </defs>

        {/* Основной круг */}
        <circle cx="250" cy="250" r={R} fill="url(#globeShadow)" stroke="rgba(99,102,241,0.3)" strokeWidth="1.5" />

        <g clipPath="url(#globeClip)">
          {/* Параллели */}
          {parallels.map(lat => {
            const φ = (lat * Math.PI) / 180;
            const ry = R * Math.cos(φ);
            const cy2 = 250 - R * Math.sin(φ);
            return <ellipse key={lat} cx="250" cy={cy2} rx={ry} ry={ry * 0.12}
              fill="none" stroke={lat === 0 ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.06)"} strokeWidth={lat === 0 ? 1 : 0.5} />;
          })}
          {/* Меридианы */}
          {meridians.map(lon => {
            const pts: string[] = [];
            for (let lat = -90; lat <= 90; lat += 5) {
              const p = project(lon, lat);
              if (p.visible) pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
            }
            return pts.length > 2 ? (
              <polyline key={lon} points={pts.join(" ")} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            ) : null;
          })}

          {/* Континенты (упрощённые заливки) */}
          {[
            { points: [[-82,70],[-140,60],[-135,50],[-120,32],[-85,20],[-77,8],[-80,25],[-65,45],[-52,46],[-55,50],[-62,62],[-72,67]] },
            { points: [[-34,-6],[-70,-18],[-75,-32],[-68,-55],[-56,-52],[-46,-24],[-35,-8]] },
            { points: [[2,51],[10,54],[14,50],[18,60],[28,72],[10,72],[5,62],[2,57]] },
            { points: [[10,5],[15,22],[25,37],[35,37],[42,12],[40,-2],[28,-28],[15,-34],[10,-18],[10,5]] },
            { points: [[60,70],[90,70],[130,50],[145,40],[135,25],[100,5],[80,10],[70,35],[55,45],[45,42],[35,37]] },
            { points: [[115,-25],[135,-18],[150,-25],[148,-38],[138,-38],[122,-34],[115,-25]] },
          ].map((cont, ci) => {
            const visible = cont.points.filter(([lon]) => {
              const λ = ((lon + rot) * Math.PI) / 180;
              return Math.cos(λ) > -0.3;
            });
            if (visible.length < 3) return null;
            const d = cont.points.map(([lon, lat], idx) => {
              const p = project(lon, lat);
              return `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
            }).join(" ") + " Z";
            return <path key={ci} d={d} fill="rgba(99,102,241,0.18)" stroke="rgba(99,102,241,0.4)" strokeWidth="0.8" />;
          })}
        </g>

        {/* Точки инцидентов */}
        {points.map((inc, i) => {
          const [lon, lat] = inc.geoCoords;
          const p = project(lon, lat);
          if (!p.visible) return null;
          const color = SEV_COLOR[inc.severity] || "#a855f7";
          const isHov = hovered?.id === inc.id;
          return (
            <g key={i} style={{ cursor: "pointer" }}
              onClick={() => onSelect(inc)}
              onMouseEnter={() => setHovered(inc)}
              onMouseLeave={() => setHovered(null)}>
              {inc.status === "active" && (
                <circle cx={p.x} cy={p.y} r="14" fill={color} opacity="0.1">
                  <animate attributeName="r" values="6;16;6" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={p.x} cy={p.y} r={isHov ? 7 : 5}
                fill={color} stroke="white" strokeWidth={isHov ? 2 : 1} />
              {isHov && (
                <text x={p.x + 10} y={p.y + 4} fontSize="9" fill="white" fontWeight="bold"
                  style={{ pointerEvents: "none", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.9))" }}>
                  {inc.country}
                </text>
              )}
            </g>
          );
        })}

        {/* Блик */}
        <circle cx="250" cy="250" r={R} fill="url(#globeShine)" />
        <circle cx="250" cy="250" r={R} fill="none" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5" />
      </svg>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <span className="text-[10px] text-white/25">← перетащи для вращения →</span>
      </div>

      {hovered && (
        <div className="absolute top-4 left-4 px-3 py-2 rounded-xl text-xs pointer-events-none z-10"
          style={{ background: "#0d1220", border: `1px solid ${SEV_COLOR[hovered.severity]}60`, minWidth: 170 }}>
          <div className="font-bold text-white mb-0.5">{hovered.title}</div>
          <div className="text-white/50">{hovered.country} · {hovered.date}</div>
          <div className="text-[10px] mt-1" style={{ color: SEV_COLOR[hovered.severity] }}>{SEV_LABEL[hovered.severity]}</div>
        </div>
      )}
    </div>
  );
}

// ─── ВИД 3: Тепловая карта (Heatmap) ─────────────────────────────────────────
function HeatMap({ points, onSelect }: { points: any[]; onSelect: (inc: any) => void }) {
  const [hovered, setHovered] = useState<any | null>(null);
  return (
    <div className="relative" style={{ paddingBottom: "50%" }}>
      <svg viewBox="0 0 1000 500" className="absolute inset-0 w-full h-full">
        <defs>
          {points.map((inc, i) => {
            const [cx, cy] = inc.flatCoords;
            const color = SEV_COLOR[inc.severity] || "#a855f7";
            const r = inc.severity === "critical" ? 80 : inc.severity === "high" ? 65 : 50;
            return (
              <radialGradient key={i} id={`heat${i}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={color} stopOpacity="0.55" />
                <stop offset="60%" stopColor={color} stopOpacity="0.12" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </radialGradient>
            );
          })}
        </defs>
        {/* Тёмный фон с сеткой */}
        <rect width="1000" height="500" fill="rgba(4,8,18,0.9)" />
        {[100, 200, 300, 400].map(y => (
          <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
        ))}
        {[200, 400, 600, 800].map(x => (
          <line key={x} x1={x} y1="0" x2={x} y2="500" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
        ))}
        {/* Континенты — тонкий контур */}
        {CONTINENTS.map(c => (
          <path key={c.label} d={c.d} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
        ))}
        {/* Тепловые пятна */}
        {points.map((inc, i) => {
          const [cx, cy] = inc.flatCoords;
          const r = inc.severity === "critical" ? 80 : inc.severity === "high" ? 65 : 50;
          return (
            <circle key={`heat-${i}`} cx={cx} cy={cy} r={r} fill={`url(#heat${i})`} />
          );
        })}
        {/* Точки поверх */}
        {points.map((inc, i) => {
          const [cx, cy] = inc.flatCoords;
          const color = SEV_COLOR[inc.severity] || "#a855f7";
          const isHov = hovered?.id === inc.id;
          return (
            <g key={i} style={{ cursor: "pointer" }}
              onClick={() => onSelect(inc)}
              onMouseEnter={() => setHovered(inc)}
              onMouseLeave={() => setHovered(null)}>
              <circle cx={cx} cy={cy} r={isHov ? 8 : 5} fill={color}
                stroke="white" strokeWidth={isHov ? 2 : 1} />
              {isHov && (
                <>
                  <rect x={cx + 12} y={cy - 22} width={inc.country.length * 6 + 10} height={30} rx="4"
                    fill="rgba(8,14,26,0.95)" stroke={`${color}80`} strokeWidth="1" />
                  <text x={cx + 17} y={cy - 8} fontSize="9" fill="white" fontWeight="bold">{inc.title.slice(0, 16)}{inc.title.length > 16 ? "…" : ""}</text>
                  <text x={cx + 17} y={cy + 4} fontSize="8" fill="rgba(255,255,255,0.5)">{inc.country}</text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Основной компонент карты с переключением ─────────────────────────────────
function IncidentMap({ incidents, onSelectIncident }: { incidents: any[]; onSelectIncident: (inc: any) => void }) {
  const [mapMode, setMapMode] = useState<"flat" | "globe" | "heat">("flat");
  const [selectedInc, setSelectedInc] = useState<any | null>(null);

  const points = incidents.map(inc => ({
    ...inc,
    flatCoords: COUNTRY_COORDS[inc.country] || null,
    geoCoords: COUNTRY_GEO[inc.country] || null,
  })).filter(inc => inc.flatCoords && inc.geoCoords);

  const handleSelect = (inc: any) => setSelectedInc(inc);

  const MODES = [
    { id: "flat", label: "Плоская", icon: "Map" },
    { id: "globe", label: "3D Глобус", icon: "Globe" },
    { id: "heat", label: "Тепловая", icon: "Flame" },
  ] as const;

  return (
    <>
      {selectedInc && (
        <IncidentDetailModal inc={selectedInc} onClose={() => setSelectedInc(null)} />
      )}

      <div className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Шапка */}
        <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2">
            <Icon name="Map" size={15} className="text-purple-400" />
            <h3 className="font-display text-sm font-semibold text-white/70 uppercase tracking-wider">Карта инцидентов</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full text-white/30"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {points.length} объектов
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Переключатель вида */}
            <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              {MODES.map(m => (
                <button key={m.id} onClick={() => setMapMode(m.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all"
                  style={{
                    background: mapMode === m.id ? "rgba(168,85,247,0.2)" : "transparent",
                    color: mapMode === m.id ? "#c084fc" : "rgba(255,255,255,0.35)",
                    borderRight: m.id !== "heat" ? "1px solid rgba(255,255,255,0.06)" : "none",
                  }}>
                  <Icon name={m.icon as any} size={12} />
                  {m.label}
                </button>
              ))}
            </div>

            {/* Легенда */}
            <div className="flex items-center gap-2 text-[10px]">
              {Object.entries(SEV_COLOR).map(([k, c]) => (
                <span key={k} className="flex items-center gap-1 text-white/35">
                  <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                  {k === "critical" ? "Крит." : k === "high" ? "Выс." : k === "medium" ? "Ср." : "Низ."}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Карта */}
        <div style={{ background: mapMode === "globe" ? "radial-gradient(ellipse at center, #050b1a 60%, #020408)" : "#040810" }}>
          {mapMode === "flat" && <FlatMap points={points} onSelect={handleSelect} />}
          {mapMode === "globe" && <GlobeMap points={points} onSelect={handleSelect} />}
          {mapMode === "heat" && <HeatMap points={points} onSelect={handleSelect} />}
        </div>

        {/* Подвал */}
        <div className="px-5 py-2 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <span className="text-[10px] text-white/20">
            {mapMode === "flat" && "Нажми на точку → детали и видео"}
            {mapMode === "globe" && "Тяни для вращения · нажми на точку → детали и видео"}
            {mapMode === "heat" && "Тепловая карта угроз · нажми на точку → детали и видео"}
          </span>
          <span className="text-[10px] text-white/20">
            {points.filter(p => p.status === "active").length} активных · пульсируют
          </span>
        </div>
      </div>
    </>
  );
}

type Props = {
  incidents: any[];
  onShowAll: () => void;
  onSelectIncident: (inc: any) => void;
};

export default function DashboardOverview({ incidents, onShowAll, onSelectIncident }: Props) {
  const [selectedKpi, setSelectedKpi] = useState<typeof KPI_DETAILS[0] | null>(null);

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-bold text-white uppercase">Обзор системы</h1>
        <p className="text-white/30 text-sm mt-0.5">Апрель 2026 · Все регионы</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPI_DETAILS.map((kpi) => (
          <button key={kpi.label} onClick={() => setSelectedKpi(kpi)}
            className="p-4 rounded-2xl text-left transition-all hover:scale-[1.02] cursor-pointer w-full"
            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${kpi.color}20` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${kpi.color}15` }}>
                <Icon name={kpi.icon as any} size={16} style={{ color: kpi.color }} />
              </div>
              <span className="text-xs font-semibold" style={{ color: kpi.delta.startsWith("+") ? "#00ff87" : "#f43f5e" }}>
                {kpi.delta}
              </span>
            </div>
            <div className="font-display text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="text-white/40 text-xs mt-0.5">{kpi.label}</div>
          </button>
        ))}
      </div>

      {/* Модальное окно KPI */}
      {selectedKpi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={() => setSelectedKpi(null)}>
          <div className="w-full max-w-md rounded-2xl p-6"
            style={{ background: "#0d1220", border: `1px solid ${selectedKpi.color}40`, boxShadow: `0 0 60px ${selectedKpi.color}20` }}
            onClick={e => e.stopPropagation()}>
            {/* Заголовок */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${selectedKpi.color}20` }}>
                  <Icon name={selectedKpi.icon as any} size={20} style={{ color: selectedKpi.color }} />
                </div>
                <div>
                  <h2 className="text-white font-bold text-base">{selectedKpi.label}</h2>
                  <p className="text-xs mt-0.5 font-semibold" style={{ color: selectedKpi.delta.startsWith("+") ? "#00ff87" : "#f43f5e" }}>
                    {selectedKpi.delta} к прошлому месяцу
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedKpi(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 transition-colors"
                style={{ background: "rgba(255,255,255,0.05)" }}>
                <Icon name="X" size={14} />
              </button>
            </div>

            {/* Значение */}
            <div className="text-center py-4 mb-5 rounded-xl"
              style={{ background: `${selectedKpi.color}08`, border: `1px solid ${selectedKpi.color}20` }}>
              <div className="font-display text-5xl font-bold" style={{ color: selectedKpi.color }}>{selectedKpi.value}</div>
              <div className="text-white/40 text-xs mt-1">{selectedKpi.label} · Апрель 2026</div>
            </div>

            {/* Описание */}
            <p className="text-white/60 text-sm leading-relaxed mb-5">{selectedKpi.description}</p>

            {/* Разбивка */}
            <div className="mb-4">
              <h4 className="text-white/40 text-[10px] uppercase tracking-widest mb-3">Разбивка</h4>
              <div className="space-y-2.5">
                {selectedKpi.breakdown.map(b => (
                  <div key={b.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{b.label}</span>
                      <span style={{ color: selectedKpi.color }}>{b.value} ({b.pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${b.pct}%`, background: selectedKpi.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Тренд */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Icon name="TrendingUp" size={13} className="text-white/30 mt-0.5 shrink-0" />
              <p className="text-white/50 text-xs leading-relaxed">{selectedKpi.trend}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Карта инцидентов ── */}
      <IncidentMap incidents={incidents} onSelectIncident={onSelectIncident} />

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Weekly chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 className="font-display text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Инциденты за неделю</h3>
          <div className="flex items-end gap-3 h-28">
            {WEEKLY.map((w) => (
              <div key={w.day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-white/40 text-[10px]">{w.count}</span>
                <div className="w-full rounded-t-md transition-all"
                  style={{ height: `${(w.count / maxCount) * 96}px`, background: "linear-gradient(to top, #a855f7, #3b82f6)" }} />
                <span className="text-white/30 text-[10px]">{w.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By type */}
        <div className="p-5 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 className="font-display text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">По типам</h3>
          <div className="space-y-3">
            {BY_TYPE.map((item) => (
              <div key={item.type}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/60">{item.type}</span>
                  <span style={{ color: item.color }}>{item.count} ({Math.round(item.count / total * 100)}%)</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${item.count / total * 100}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <h3 className="font-display text-sm font-semibold text-white/70 uppercase tracking-wider">Последние инциденты</h3>
          <button onClick={onShowAll} className="text-xs text-white/30 hover:text-white/60 transition-colors">Все →</button>
        </div>
        {incidents.slice(0, 4).map((inc) => (
          <div key={inc.id}
            onClick={() => onSelectIncident(inc)}
            className="flex items-center gap-4 px-5 py-3 cursor-pointer transition-colors"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(168,85,247,0.07)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[inc.status] }} />
            <span className="text-white/30 text-xs w-20 shrink-0">{inc.id}</span>
            <span className="text-white/80 text-sm flex-1 truncate">{inc.title}</span>
            <span className="text-white/30 text-xs hidden md:block">{inc.country}</span>
            <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
              style={{ background: `${STATUS_COLORS[inc.status]}15`, color: STATUS_COLORS[inc.status] }}>
              {STATUS_LABELS[inc.status]}
            </span>
            <Icon name="ChevronRight" size={12} className="text-purple-400 opacity-50 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}