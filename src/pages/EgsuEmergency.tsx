import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

// ─── Реальные ведомства РФ ───────────────────────────────────────────────────
const AGENCIES = [
  {
    id: "mchs",
    name: "МЧС России",
    fullName: "Министерство РФ по делам гражданской обороны, чрезвычайным ситуациям и ликвидации последствий стихийных бедствий",
    phone: "112",
    phone2: "8-800-775-17-17",
    email: "info@mchs.gov.ru",
    site: "https://mchs.gov.ru",
    address: "121352, г. Москва, ул. Ватутина, д. 1",
    online_appeal: "https://mchs.gov.ru/ministerstvo/grazhdanskaya-oborona-i-zashhita-ot-chrezvychajnykh-situatsij/voprosy-grazhdanin",
    category: "emergency",
    color: "#f43f5e",
    icon: "Flame",
    desc: "Пожары, наводнения, техногенные катастрофы, поиск и спасение, радиационные аварии",
    competence: ["Пожар", "Наводнение", "ЧС техногенного характера", "Поиск и спасение", "Радиационная авария", "Химическая авария"],
  },
  {
    id: "mvd",
    name: "МВД России (Полиция)",
    fullName: "Министерство внутренних дел Российской Федерации",
    phone: "102",
    phone2: "8 (495) 667-58-11",
    email: "mvd@mvd.ru",
    site: "https://мвд.рф",
    address: "119049, г. Москва, ул. Житная, д. 16",
    online_appeal: "https://мвд.рф/request_main",
    category: "law",
    color: "#3b82f6",
    icon: "Shield",
    desc: "Преступления, нарушение правопорядка, мошенничество, угрозы, кражи",
    competence: ["Преступление", "Кража", "Мошенничество", "Угроза жизни", "Дорожное происшествие", "Нарушение порядка"],
  },
  {
    id: "prosecutor",
    name: "Генеральная прокуратура РФ",
    fullName: "Генеральная прокуратура Российской Федерации",
    phone: "8 (800) 250-77-55",
    phone2: "8 (495) 987-56-56",
    email: "genproc@genproc.gov.ru",
    site: "https://genproc.gov.ru",
    address: "125993, г. Москва, ГСП-3, ул. Большая Дмитровка, д. 15А",
    online_appeal: "https://epp.genproc.gov.ru/web/gprf/internet-reception",
    category: "law",
    color: "#a855f7",
    icon: "Scale",
    desc: "Нарушения закона органами власти, коррупция, бездействие должностных лиц",
    competence: ["Коррупция", "Превышение полномочий", "Бездействие власти", "Нарушения прав граждан", "Незаконные решения"],
  },
  {
    id: "skrf",
    name: "Следственный комитет РФ",
    fullName: "Следственный комитет Российской Федерации",
    phone: "8 (800) 100-12-60",
    phone2: "8 (495) 986-97-00",
    email: "priemnaya@sledcom.ru",
    site: "https://sledcom.ru",
    address: "105005, г. Москва, Технический переулок, д. 2",
    online_appeal: "https://sledcom.ru/reception/",
    category: "law",
    color: "#f59e0b",
    icon: "FileSearch",
    desc: "Тяжкие и особо тяжкие преступления, коррупция должностных лиц, убийства",
    competence: ["Убийство", "Тяжкое преступление", "Коррупция чиновников", "Превышение должностных полномочий"],
  },
  {
    id: "fsb",
    name: "ФСБ России",
    fullName: "Федеральная служба безопасности Российской Федерации",
    phone: "8 (495) 224-22-22",
    phone2: "8 (800) 224-22-22",
    email: "fsb@fsb.ru",
    site: "https://www.fsb.ru",
    address: "107031, г. Москва, ул. Большая Лубянка, д. 1/3",
    online_appeal: "https://www.fsb.ru/fsb/comment.htm",
    category: "security",
    color: "#22c55e",
    icon: "ShieldAlert",
    desc: "Терроризм, экстремизм, кибербезопасность, шпионаж, угрозы государственной безопасности",
    competence: ["Терроризм", "Экстремизм", "Кибератака", "Шпионаж", "Угроза государству"],
  },
  {
    id: "rosprirodnadzor",
    name: "Росприроднадзор",
    fullName: "Федеральная служба по надзору в сфере природопользования",
    phone: "8 (499) 252-13-36",
    phone2: "8 (800) 200-34-60",
    email: "rpn@rpn.gov.ru",
    site: "https://rpn.gov.ru",
    address: "123995, г. Москва, ул. Большая Грузинская, д. 4/6",
    online_appeal: "https://rpn.gov.ru/open-service/virtual-reception/",
    category: "ecology",
    color: "#10b981",
    icon: "Leaf",
    desc: "Загрязнение воздуха, воды, почвы, незаконные свалки, экологические нарушения",
    competence: ["Загрязнение воды", "Загрязнение воздуха", "Незаконная свалка", "Вырубка леса", "Экологический ущерб"],
  },
  {
    id: "rospotrebnadzor",
    name: "Роспотребнадзор",
    fullName: "Федеральная служба по надзору в сфере защиты прав потребителей и благополучия человека",
    phone: "8 (800) 555-49-43",
    phone2: "8 (495) 785-37-41",
    email: "rpn@gsen.ru",
    site: "https://rospotrebnadzor.ru",
    address: "127994, г. Москва, Вадковский переулок, д. 18, строение 5 и 7",
    online_appeal: "https://petition.rospotrebnadzor.ru/",
    category: "health",
    color: "#06b6d4",
    icon: "Heart",
    desc: "Санитарные нарушения, качество продуктов, эпидемии, отравления, нарушения прав потребителей",
    competence: ["Отравление", "Некачественная продукция", "Санитарные нарушения", "Эпидемия", "Нарушение прав потребителей"],
  },
  {
    id: "rostechnadzor",
    name: "Ростехнадзор",
    fullName: "Федеральная служба по экологическому, технологическому и атомному надзору",
    phone: "8 (800) 100-80-40",
    phone2: "8 (499) 322-85-00",
    email: "rtn@gosnadzor.ru",
    site: "https://www.gosnadzor.ru",
    address: "105066, г. Москва, ул. А. Лукьянова, д. 4, строение 1",
    online_appeal: "https://www.gosnadzor.ru/public/reception/",
    category: "tech",
    color: "#f59e0b",
    icon: "Zap",
    desc: "Промышленные аварии, нарушения на объектах повышенной опасности, атомные объекты",
    competence: ["Промышленная авария", "Атомная авария", "Нарушение техбезопасности", "Опасный объект"],
  },
  {
    id: "rosgvard",
    name: "Росгвардия",
    fullName: "Федеральная служба войск национальной гвардии Российской Федерации",
    phone: "8 (495) 620-82-15",
    phone2: "112",
    email: "rosgvardiya@rosgvardiya.ru",
    site: "https://rosgvardiya.ru",
    address: "101990, г. Москва, ул. Мясницкая, д. 40",
    online_appeal: "https://rosgvardiya.ru/public-services/obratitsya-s-voprosom/",
    category: "security",
    color: "#64748b",
    icon: "Users",
    desc: "Охрана общественного порядка, контроль оборота оружия, вневедомственная охрана",
    competence: ["Незаконное оружие", "Массовые беспорядки", "Охрана объектов"],
  },
  {
    id: "minzdrav",
    name: "Минздрав России",
    fullName: "Министерство здравоохранения Российской Федерации",
    phone: "8 (800) 200-03-89",
    phone2: "8 (495) 627-29-44",
    email: "info@rosminzdrav.ru",
    site: "https://minzdrav.gov.ru",
    address: "127994, г. Москва, Рахмановский переулок, д. 3",
    online_appeal: "https://minzdrav.gov.ru/reception",
    category: "health",
    color: "#ef4444",
    icon: "Cross",
    desc: "Некачественная медпомощь, нарушения прав пациентов, лекарственное обеспечение",
    competence: ["Некачественная медпомощь", "Отказ в лечении", "Лекарственные нарушения"],
  },
];

const MORSE_TABLE: Record<string, string> = {
  A:"·—", B:"—···", C:"—·—·", D:"—··", E:"·", F:"··—·", G:"——·", H:"····",
  I:"··", J:"·———", K:"—·—", L:"·—··", M:"——", N:"—·", O:"———", P:"·——·",
  Q:"——·—", R:"·—·", S:"···", T:"—", U:"··—", V:"···—", W:"·——", X:"—··—",
  Y:"·———", Z:"——··",
  "0":"—————","1":"·————","2":"··———","3":"···——","4":"····—","5":"·····",
  "6":"—····","7":"——···","8":"———··","9":"————·",
  " ":"/"
};

function textToMorse(text: string): string {
  return text.toUpperCase().split("").map(c => MORSE_TABLE[c] || "").filter(Boolean).join(" ");
}

function playMorse(morse: string) {
  const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const DOT = 0.08, DASH = 0.24, GAP = 0.08, WORD = 0.32;
  let t = ctx.currentTime + 0.1;
  morse.split("").forEach(char => {
    if (char === "/") { t += WORD; return; }
    if (char === " ") { t += GAP * 2; return; }
    const dur = char === "·" ? DOT : DASH;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 750;
    gain.gain.setValueAtTime(0.3, t);
    osc.start(t); osc.stop(t + dur);
    gain.gain.setValueAtTime(0, t + dur);
    t += dur + GAP;
  });
}

const CATEGORY_LABELS: Record<string, string> = {
  all: "Все",
  emergency: "ЧС",
  law: "Право",
  security: "Безопасность",
  ecology: "Экология",
  health: "Здоровье",
  tech: "Техника",
};

const OWNER = {
  name: "Николаев Владимир Владимирович",
  address: "Российская Федерация",
  system: "ЕЦСУ 2.0 (Единая Центральная Система Управления)",
  status: "Гражданин РФ, автор системы ЕЦСУ 2.0 (в стадии разработки)",
};

export default function EgsuEmergency() {
  const navigate = useNavigate();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [morseInput, setMorseInput] = useState("SOS");
  const [morseOutput, setMorseOutput] = useState("··· ——— ···");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  useEffect(() => {
    setMorseOutput(textToMorse(morseInput));
  }, [morseInput]);

  const filtered = AGENCIES.filter(a =>
    (category === "all" || a.category === category) &&
    (search === "" || a.name.toLowerCase().includes(search.toLowerCase()) || a.competence.some(c => c.toLowerCase().includes(search.toLowerCase())))
  );

  const SEV: Record<string, string> = { emergency: "#f43f5e", law: "#3b82f6", security: "#22c55e", ecology: "#10b981", health: "#ef4444", tech: "#f59e0b" };

  return (
    <div style={{ minHeight: "100vh", background: "#060a12", color: "#e0e8ff", fontFamily: "monospace" }}>
      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(6,10,18,0.98)", borderBottom: "1px solid rgba(244,63,94,0.25)", backdropFilter: "blur(20px)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate("/egsu/dashboard")} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer" }}>
          <Icon name="ChevronLeft" size={18} />
        </button>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #f43f5e, #f59e0b)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="ShieldAlert" size={16} style={{ color: "#fff" }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: 2, color: "#fff" }}>ЭКСТРЕННЫЕ СЛУЖБЫ</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 1 }}>ЕЦСУ 2.0 · ВЕДОМСТВА РФ</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: isOnline ? "#22c55e" : "#f59e0b", boxShadow: `0 0 6px ${isOnline ? "#22c55e" : "#f59e0b"}` }} />
          <span style={{ color: isOnline ? "#22c55e" : "#f59e0b" }}>{isOnline ? "ОНЛАЙН" : "ОФЛАЙН"}</span>
        </div>
      </nav>

      <div style={{ paddingTop: 64, maxWidth: 900, margin: "0 auto", padding: "64px 16px 32px" }}>

        {/* ОФЛАЙН-БАННЕР */}
        {!isOnline && (
          <div style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 12, padding: 16, marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
            <Icon name="WifiOff" size={20} style={{ color: "#f59e0b", flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, color: "#f59e0b", marginBottom: 4 }}>Офлайн-режим активен</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Экстренные номера работают без интернета. Позвоните 112 — работает всегда.</div>
            </div>
            <a href="tel:112" style={{ marginLeft: "auto", background: "#f43f5e", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 14, textDecoration: "none", whiteSpace: "nowrap" }}>📞 112</a>
          </div>
        )}

        {/* ЭКСТРЕННЫЕ НОМЕРА */}
        <div style={{ background: "rgba(244,63,94,0.08)", border: "2px solid rgba(244,63,94,0.3)", borderRadius: 14, padding: 20, marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 14 }}>Экстренные номера · Работают без интернета</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
            {[
              { num: "112", label: "МЧС/Единый", icon: "🆘", color: "#f43f5e" },
              { num: "101", label: "Пожарная", icon: "🔥", color: "#f59e0b" },
              { num: "102", label: "Полиция", icon: "👮", color: "#3b82f6" },
              { num: "103", label: "Скорая", icon: "🚑", color: "#22c55e" },
              { num: "104", label: "Газ", icon: "⚡", color: "#a855f7" },
            ].map(({ num, label, icon, color }) => (
              <a key={num} href={`tel:${num}`}
                style={{ background: `${color}15`, border: `1px solid ${color}40`, borderRadius: 10, padding: "12px 10px", textAlign: "center", textDecoration: "none", display: "block", transition: "all 0.2s" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color, letterSpacing: 2 }}>{num}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{label}</div>
              </a>
            ))}
          </div>
        </div>

        {/* ПОИСК И ФИЛЬТРЫ */}
        <div style={{ marginBottom: 20 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск ведомства или ситуации..."
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13, marginBottom: 12, outline: "none" }}
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
              <button key={id} onClick={() => setCategory(id)}
                style={{ background: category === id ? "rgba(244,63,94,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${category === id ? "rgba(244,63,94,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: 8, padding: "5px 12px", color: category === id ? "#f43f5e" : "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer", fontWeight: category === id ? 700 : 400 }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* КАРТОЧКИ ВЕДОМСТВ */}
        <div style={{ display: "grid", gap: 14, marginBottom: 32 }}>
          {filtered.map(a => (
            <div key={a.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${a.color}25`, borderRadius: 14, overflow: "hidden" }}>
              {/* Заголовок карточки */}
              <div
                onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${a.color}20`, border: `1px solid ${a.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={a.icon as "Shield"} size={20} style={{ color: a.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", marginBottom: 3 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>{a.desc}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {a.competence.slice(0, 3).map(c => (
                      <span key={c} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: `${a.color}15`, color: a.color, border: `1px solid ${a.color}30` }}>{c}</span>
                    ))}
                    {a.competence.length > 3 && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>+{a.competence.length - 3}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                  <a href={`tel:${a.phone}`} onClick={e => e.stopPropagation()}
                    style={{ background: a.color, color: "#fff", borderRadius: 8, padding: "6px 12px", fontWeight: 900, fontSize: 14, textDecoration: "none", letterSpacing: 1 }}>
                    📞 {a.phone}
                  </a>
                  <Icon name={expandedId === a.id ? "ChevronUp" : "ChevronDown"} size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                </div>
              </div>

              {/* Раскрытые детали */}
              {expandedId === a.id && (
                <div style={{ borderTop: `1px solid rgba(255,255,255,0.06)`, padding: "16px 20px", background: "rgba(0,0,0,0.2)" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 12 }}>{a.fullName}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>Телефон 2</div>
                      <a href={`tel:${a.phone2.replace(/\s/g,'')}`} style={{ color: "#60a5fa", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>{a.phone2}</a>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>Email</div>
                      <a href={`mailto:${a.email}`} style={{ color: "#60a5fa", fontSize: 12, textDecoration: "none" }}>{a.email}</a>
                    </div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 12, marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>Адрес</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{a.address}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <a href={`tel:${a.phone}`} style={{ flex: 1, background: `${a.color}20`, border: `1px solid ${a.color}40`, borderRadius: 8, padding: "9px 14px", color: a.color, fontWeight: 700, fontSize: 13, textDecoration: "none", textAlign: "center" }}>
                      📞 Позвонить
                    </a>
                    <a href={`mailto:${a.email}?subject=Обращение по системе ЕЦСУ 2.0&body=От: ${OWNER.name}%0AСистема: ${OWNER.system}%0A%0AОбращение:%0A`}
                      style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 14px", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 13, textDecoration: "none", textAlign: "center" }}>
                      ✉️ Email
                    </a>
                    <a href={a.online_appeal} target="_blank" rel="noopener noreferrer"
                      style={{ flex: 1, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, padding: "9px 14px", color: "#60a5fa", fontWeight: 600, fontSize: 13, textDecoration: "none", textAlign: "center" }}>
                      🌐 Интернет-приёмная
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* АЗБУКА МОРЗЕ */}
        <div style={{ background: "rgba(255,193,7,0.06)", border: "1px solid rgba(255,193,7,0.2)", borderRadius: 14, padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Icon name="Radio" size={20} style={{ color: "#ffc107" }} />
            <div>
              <div style={{ fontWeight: 700, color: "#ffc107", fontSize: 14 }}>Азбука Морзе · Офлайн-сигнал</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Передача без интернета через любой доступный сигнал</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <input
              value={morseInput}
              onChange={e => setMorseInput(e.target.value)}
              placeholder="Введите текст..."
              style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,193,7,0.3)", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none" }}
            />
            <button onClick={() => playMorse(morseOutput)}
              style={{ background: "rgba(255,193,7,0.2)", border: "1px solid rgba(255,193,7,0.4)", borderRadius: 8, padding: "9px 16px", color: "#ffc107", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
              ▶ Воспроизвести
            </button>
          </div>
          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: 12, fontFamily: "monospace", fontSize: 16, color: "#ffc107", letterSpacing: 3, wordBreak: "break-all", minHeight: 44 }}>
            {morseOutput || "···"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", gap: 4, marginTop: 12 }}>
            {Object.entries(MORSE_TABLE).filter(([k]) => k.length === 1 && /[A-Z0-9]/.test(k)).slice(0, 20).map(([letter, code]) => (
              <div key={letter} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, padding: "6px 4px", textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>{letter}</div>
                <div style={{ fontSize: 10, color: "#ffc107", letterSpacing: 2 }}>{code}</div>
              </div>
            ))}
          </div>
        </div>

        {/* OWNER BADGE */}
        <div style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 12, padding: 16, fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
          <div style={{ fontWeight: 700, color: "#a855f7", marginBottom: 6 }}>Системная информация · ЕЦСУ 2.0</div>
          <div>Владелец системы: <span style={{ color: "#e0e8ff" }}>{OWNER.name}</span></div>
          <div>Статус: <span style={{ color: "#e0e8ff" }}>{OWNER.status}</span></div>
          <div>Обращения направляются от имени владельца системы с указанием правовых оснований.</div>
          <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
            При бездействии ведомств применяются нормы: ФЗ №59 «О порядке рассмотрения обращений граждан», ст.5.59 КоАП РФ (нарушение порядка рассмотрения обращений), ст.315 УК РФ (неисполнение решений).
          </div>
        </div>
      </div>
    </div>
  );
}
