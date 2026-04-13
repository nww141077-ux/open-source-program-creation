/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/c71047de-6e10-499a-aa1c-e9fdba33e7bd";

const INCIDENT_TYPES = [
  { key: "ecology", label: "Вырубка леса", icon: "Leaf", color: "#00ff87" },
  { key: "water", label: "Загрязнение воды", icon: "Droplets", color: "#3b82f6" },
  { key: "air", label: "Загрязнение воздуха", icon: "Wind", color: "#f59e0b" },
  { key: "cyber", label: "Кибератака", icon: "Shield", color: "#f43f5e" },
  { key: "human_rights", label: "Права человека", icon: "Users", color: "#a855f7" },
  { key: "weapons", label: "Запрещённое оружие", icon: "AlertTriangle", color: "#ef4444" },
];

const SEVERITIES = [
  { key: "low", label: "Низкий", color: "#6b7280" },
  { key: "medium", label: "Средний", color: "#3b82f6" },
  { key: "high", label: "Высокий", color: "#f59e0b" },
  { key: "critical", label: "Критический", color: "#f43f5e" },
];

const EMPTY_FORM = {
  type: "", severity: "", title: "", description: "",
  country: "", location: "", useGeo: false,
  photo: null as string | null, contact: "", anonymous: false,
  has_photo: false, has_video: false, has_witnesses: false,
  has_satellite: false, has_official_source: false,
  mgp_distinction: false, mgp_proportionality: false, mgp_necessity: false,
};

export default function EgsuReport() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleGeo = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setForm(f => ({ ...f, location: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`, useGeo: true }));
      });
    }
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setForm(f => ({ ...f, photo: ev.target?.result as string, has_photo: true }));
      reader.readAsDataURL(file);
    }
  };

  const toggle = (field: keyof typeof EMPTY_FORM) =>
    setForm(f => ({ ...f, [field]: !f[field] }));

  const canNext1 = form.type && form.severity;
  const canNext2 = form.title && form.description && form.country;

  // Подсчёт балла верификации для показа пользователю
  const calcScore = () => {
    const weights: Record<string, number> = {
      has_photo: 20, has_video: 25, has_witnesses: 20,
      has_satellite: 25, has_official_source: 30,
      mgp_distinction: 15, mgp_proportionality: 15, mgp_necessity: 15,
    };
    return Math.min(Object.entries(weights).reduce((s, [k, w]) => s + ((form as any)[k] ? w : 0), 0), 100);
  };
  const score = calcScore();

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        type: form.type,
        severity: form.severity,
        title: form.title,
        description: form.description,
        country: form.country,
        location: form.location,
        contact_email: form.contact || null,
        is_anonymous: form.anonymous,
        has_photo: form.has_photo,
        has_video: form.has_video,
        has_witnesses: form.has_witnesses,
        has_satellite: form.has_satellite,
        has_official_source: form.has_official_source,
        mgp_distinction: form.mgp_distinction,
        mgp_proportionality: form.mgp_proportionality,
        mgp_necessity: form.mgp_necessity,
      };
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.status === 422) {
        setError(data.reason || "Недостаточно доказательств для принятия инцидента");
        setLoading(false);
        return;
      }
      setResult(data);
    } catch {
      setError("Ошибка соединения с сервером ЕГСУ. Попробуйте ещё раз.");
    }
    setLoading(false);
  };

  // Успешная отправка
  if (result) {
    const inc = result.incident;
    const isVerified = inc.status === "verified";
    return (
      <div className="min-h-screen font-body flex items-center justify-center px-4" style={{ background: "#060a12" }}>
        <div className="max-w-sm w-full text-center animate-fade-up">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: isVerified ? "rgba(0,255,135,0.1)" : "rgba(245,158,11,0.1)", border: `2px solid ${isVerified ? "rgba(0,255,135,0.3)" : "rgba(245,158,11,0.3)"}` }}>
            <Icon name={isVerified ? "CheckCircle" : "Clock"} size={40} style={{ color: isVerified ? "#00ff87" : "#f59e0b" }} />
          </div>

          <h2 className="font-display text-2xl font-bold text-white uppercase mb-2">
            {isVerified ? "Инцидент принят!" : "На проверке"}
          </h2>
          <p className="text-white/40 text-sm mb-4">
            {isVerified
              ? `Верификация пройдена. Балл доверия: ${inc.verification_score}/100. ОГР направлена на место.`
              : `Балл доверия: ${inc.verification_score}/100. Требуется дополнительная проверка.`}
          </p>

          {/* Номер */}
          <div className="p-4 rounded-2xl mb-4" style={{ background: isVerified ? "rgba(0,255,135,0.06)" : "rgba(245,158,11,0.06)", border: `1px solid ${isVerified ? "rgba(0,255,135,0.15)" : "rgba(245,158,11,0.15)"}` }}>
            <div className="text-white/40 text-xs mb-1">Номер инцидента в системе ЕГСУ</div>
            <div className="font-display text-2xl font-bold" style={{ color: isVerified ? "#00ff87" : "#f59e0b" }}>{inc.incident_code}</div>
            <div className="text-white/30 text-xs mt-1">Сохраните для отслеживания</div>
          </div>

          {/* Автоматические действия */}
          {result.actions_applied?.length > 0 && (
            <div className="p-4 rounded-2xl mb-4 text-left" style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)" }}>
              <div className="text-white/50 text-xs uppercase tracking-wider font-semibold mb-2">Автоматически применено</div>
              {result.actions_applied.map((a: any) => (
                <div key={a.id} className="flex items-start gap-2 mb-1.5">
                  <Icon name="CheckCircle" size={12} style={{ color: "#00ff87" }} className="mt-0.5 shrink-0" />
                  <span className="text-white/60 text-xs">{a.action_label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button onClick={() => navigate("/egsu/dashboard")}
              className="w-full py-3 rounded-xl font-semibold text-black text-sm"
              style={{ background: "linear-gradient(135deg, #00ff87, #3b82f6)" }}>
              Перейти в дашборд
            </button>
            <button onClick={() => { setResult(null); setStep(1); setForm(EMPTY_FORM); }}
              className="w-full py-3 rounded-xl font-semibold text-white/60 text-sm"
              style={{ background: "rgba(255,255,255,0.05)" }}>
              Подать ещё одно сообщение
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-body" style={{ background: "#060a12" }}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3"
        style={{ background: "rgba(6,10,18,0.97)", borderBottom: "1px solid rgba(244,63,94,0.15)", backdropFilter: "blur(20px)" }}>
        <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate("/egsu")}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.05)" }}>
          <Icon name="ChevronLeft" size={16} />
        </button>
        <div className="flex-1">
          <div className="font-display text-base font-bold text-white leading-none">Сообщить о нарушении</div>
          <div className="text-white/30 text-[10px]">ЕГСУ 2.0 · Шаг {step} из 4</div>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-1.5 w-7 rounded-full transition-all"
              style={{ background: n <= step ? "#f43f5e" : "rgba(255,255,255,0.1)" }} />
          ))}
        </div>
      </nav>

      <div className="pt-16 px-4 pb-8 max-w-lg mx-auto">

        {/* STEP 1 — тип и серьёзность */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-up">
            <div className="pt-4">
              <h2 className="font-display text-xl font-bold text-white uppercase">Тип нарушения</h2>
              <p className="text-white/40 text-sm mt-1">Выберите категорию инцидента</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {INCIDENT_TYPES.map((t) => (
                <button key={t.key} onClick={() => setForm(f => ({ ...f, type: t.key }))}
                  className="p-4 rounded-2xl text-left transition-all hover:scale-[1.02]"
                  style={{
                    background: form.type === t.key ? `${t.color}12` : "rgba(255,255,255,0.03)",
                    border: form.type === t.key ? `2px solid ${t.color}60` : "2px solid rgba(255,255,255,0.06)",
                  }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${t.color}18` }}>
                    <Icon name={t.icon as any} size={18} style={{ color: t.color }} />
                  </div>
                  <div className="text-white/80 text-sm font-medium">{t.label}</div>
                </button>
              ))}
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Уровень угрозы</h3>
              <div className="grid grid-cols-2 gap-2">
                {SEVERITIES.map((s) => (
                  <button key={s.key} onClick={() => setForm(f => ({ ...f, severity: s.key }))}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{
                      background: form.severity === s.key ? `${s.color}12` : "rgba(255,255,255,0.03)",
                      border: form.severity === s.key ? `2px solid ${s.color}60` : "2px solid rgba(255,255,255,0.06)",
                    }}>
                    <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                    <span className="text-sm font-medium" style={{ color: form.severity === s.key ? s.color : "rgba(255,255,255,0.6)" }}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setStep(2)} disabled={!canNext1}
              className="w-full py-4 rounded-xl font-bold text-sm transition-all"
              style={{ background: canNext1 ? "linear-gradient(135deg, #f43f5e, #f59e0b)" : "rgba(255,255,255,0.06)", color: canNext1 ? "#000" : "rgba(255,255,255,0.2)" }}>
              Далее →
            </button>
          </div>
        )}

        {/* STEP 2 — описание */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-up">
            <div className="pt-4">
              <h2 className="font-display text-xl font-bold text-white uppercase">Описание</h2>
              <p className="text-white/40 text-sm mt-1">Опишите что произошло</p>
            </div>
            {[
              { label: "Заголовок *", field: "title", placeholder: "Кратко опишите нарушение" },
              { label: "Страна *", field: "country", placeholder: "Страна где произошёл инцидент" },
            ].map(({ label, field, placeholder }) => (
              <div key={field}>
                <label className="text-white/40 text-xs mb-1.5 block font-semibold uppercase tracking-wider">{label}</label>
                <input value={(form as any)[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  placeholder={placeholder} />
              </div>
            ))}
            <div>
              <label className="text-white/40 text-xs mb-1.5 block font-semibold uppercase tracking-wider">Подробное описание *</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4} className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none resize-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                placeholder="Подробно опишите что произошло, когда и при каких обстоятельствах..." />
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1.5 block font-semibold uppercase tracking-wider">Местоположение</label>
              <div className="flex gap-2">
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="flex-1 px-4 py-3 rounded-xl text-sm text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  placeholder="Адрес или координаты" />
                <button onClick={handleGeo}
                  className="px-3 rounded-xl transition-all hover:scale-105"
                  style={{ background: form.useGeo ? "rgba(0,255,135,0.15)" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <Icon name="MapPin" size={16} style={{ color: form.useGeo ? "#00ff87" : "rgba(255,255,255,0.4)" }} />
                </button>
              </div>
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1.5 block font-semibold uppercase tracking-wider">Фото доказательство</label>
              <label className="flex flex-col items-center justify-center p-5 rounded-xl cursor-pointer transition-all"
                style={{ background: "rgba(255,255,255,0.03)", border: "2px dashed rgba(255,255,255,0.1)" }}>
                {form.photo
                  ? <img src={form.photo} alt="preview" className="max-h-36 rounded-lg object-cover" />
                  : <><Icon name="Upload" size={22} className="text-white/20 mb-2" /><span className="text-white/30 text-xs">Нажмите для загрузки</span></>
                }
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handlePhoto} />
              </label>
            </div>
            <button onClick={() => setStep(3)} disabled={!canNext2}
              className="w-full py-4 rounded-xl font-bold text-sm transition-all"
              style={{ background: canNext2 ? "linear-gradient(135deg, #f43f5e, #f59e0b)" : "rgba(255,255,255,0.06)", color: canNext2 ? "#000" : "rgba(255,255,255,0.2)" }}>
              Далее →
            </button>
          </div>
        )}

        {/* STEP 3 — доказательства и МГП (защита от фейков) */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-up">
            <div className="pt-4">
              <h2 className="font-display text-xl font-bold text-white uppercase">Доказательства</h2>
              <p className="text-white/40 text-sm mt-1">Система ЕГСУ проверяет достоверность. Минимальный балл: 40</p>
            </div>

            {/* Балл верификации */}
            <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${score >= 60 ? "rgba(0,255,135,0.25)" : score >= 40 ? "rgba(245,158,11,0.25)" : "rgba(244,63,94,0.25)"}` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/50 text-xs uppercase tracking-wider font-semibold">Балл достоверности МГП</span>
                <span className="font-bold text-lg" style={{ color: score >= 60 ? "#00ff87" : score >= 40 ? "#f59e0b" : "#f43f5e" }}>{score}/100</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-2 rounded-full transition-all duration-500"
                  style={{ width: `${score}%`, background: score >= 60 ? "#00ff87" : score >= 40 ? "#f59e0b" : "#f43f5e" }} />
              </div>
              <p className="text-white/30 text-xs mt-2">
                {score >= 60 ? "Инцидент будет автоматически верифицирован" : score >= 40 ? "Будет принят на дополнительную проверку" : "Недостаточно доказательств — добавьте источники"}
              </p>
            </div>

            {/* Источники доказательств */}
            <div>
              <h3 className="text-white/50 text-xs uppercase tracking-wider font-semibold mb-3">Источники доказательств</h3>
              <div className="space-y-2">
                {[
                  { field: "has_photo", label: "Фото/видео материалы", pts: "+20", icon: "Camera", color: "#3b82f6" },
                  { field: "has_video", label: "Видеозапись события", pts: "+25", icon: "Video", color: "#a855f7" },
                  { field: "has_witnesses", label: "Показания свидетелей", pts: "+20", icon: "Users", color: "#00ff87" },
                  { field: "has_satellite", label: "Спутниковые/дроновые снимки", pts: "+25", icon: "Satellite", color: "#f59e0b" },
                  { field: "has_official_source", label: "Официальный источник / СМИ", pts: "+30", icon: "Newspaper", color: "#f43f5e" },
                ].map(({ field, label, pts, icon, color }) => (
                  <button key={field} onClick={() => toggle(field as any)}
                    className="flex items-center gap-3 w-full p-3 rounded-xl transition-all text-left"
                    style={{
                      background: (form as any)[field] ? `${color}10` : "rgba(255,255,255,0.02)",
                      border: `1px solid ${(form as any)[field] ? color + "40" : "rgba(255,255,255,0.06)"}`,
                    }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
                      <Icon name={icon as any} size={15} style={{ color }} />
                    </div>
                    <span className="text-white/70 text-sm flex-1">{label}</span>
                    <span className="text-xs font-bold" style={{ color }}>{pts}</span>
                    <div className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                      style={{ background: (form as any)[field] ? color : "rgba(255,255,255,0.08)" }}>
                      {(form as any)[field] && <Icon name="Check" size={11} className="text-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Принципы МГП */}
            <div>
              <h3 className="text-white/50 text-xs uppercase tracking-wider font-semibold mb-1">Критерии МГП</h3>
              <p className="text-white/25 text-xs mb-3">Международное гуманитарное право — принципы различия, соразмерности, необходимости</p>
              <div className="space-y-2">
                {[
                  { field: "mgp_distinction", label: "Принцип различия", desc: "Нарушение направлено против гражданских объектов/лиц", pts: "+15" },
                  { field: "mgp_proportionality", label: "Принцип соразмерности", desc: "Ущерб несоразмерен военной/иной необходимости", pts: "+15" },
                  { field: "mgp_necessity", label: "Принцип необходимости", desc: "Действие не было необходимо для достижения законной цели", pts: "+15" },
                ].map(({ field, label, desc, pts }) => (
                  <button key={field} onClick={() => toggle(field as any)}
                    className="flex items-start gap-3 w-full p-3 rounded-xl transition-all text-left"
                    style={{
                      background: (form as any)[field] ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${(form as any)[field] ? "rgba(168,85,247,0.35)" : "rgba(255,255,255,0.06)"}`,
                    }}>
                    <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: (form as any)[field] ? "#a855f7" : "rgba(255,255,255,0.08)" }}>
                      {(form as any)[field] && <Icon name="Check" size={11} className="text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm font-medium">{label}</span>
                        <span className="text-xs font-bold text-purple-400">{pts}</span>
                      </div>
                      <span className="text-white/30 text-xs">{desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setStep(4)}
              className="w-full py-4 rounded-xl font-bold text-sm transition-all"
              style={{ background: "linear-gradient(135deg, #f43f5e, #f59e0b)", color: "#000" }}>
              Далее →
            </button>
          </div>
        )}

        {/* STEP 4 — контакт и отправка */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-up">
            <div className="pt-4">
              <h2 className="font-display text-xl font-bold text-white uppercase">Отправка</h2>
              <p className="text-white/40 text-sm mt-1">Проверьте данные и отправьте в систему ЕГСУ</p>
            </div>

            {/* Итоговый балл */}
            <div className="p-4 rounded-2xl flex items-center gap-4"
              style={{ background: score >= 60 ? "rgba(0,255,135,0.06)" : "rgba(245,158,11,0.06)", border: `1px solid ${score >= 60 ? "rgba(0,255,135,0.2)" : "rgba(245,158,11,0.2)"}` }}>
              <Icon name={score >= 60 ? "ShieldCheck" : "ShieldAlert"} size={28} style={{ color: score >= 60 ? "#00ff87" : "#f59e0b" }} />
              <div>
                <div className="text-white/70 text-sm font-semibold">Балл верификации МГП: <span style={{ color: score >= 60 ? "#00ff87" : "#f59e0b" }}>{score}/100</span></div>
                <div className="text-white/30 text-xs">{score >= 60 ? "Автоматическая верификация ✓" : score >= 40 ? "Принят на дополнительную проверку" : "Риск отклонения — вернитесь и добавьте доказательства"}</div>
              </div>
            </div>

            {/* Превью */}
            <div className="p-4 rounded-2xl space-y-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {[
                { label: "Тип", value: INCIDENT_TYPES.find(t => t.key === form.type)?.label },
                { label: "Угроза", value: SEVERITIES.find(s => s.key === form.severity)?.label },
                { label: "Заголовок", value: form.title },
                { label: "Страна", value: form.country },
                { label: "Локация", value: form.location || "Не указана" },
              ].map(row => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-white/30">{row.label}</span>
                  <span className="text-white/70 text-right max-w-[60%] truncate">{row.value}</span>
                </div>
              ))}
            </div>

            <div>
              <label className="text-white/40 text-xs mb-1.5 block font-semibold uppercase tracking-wider">Контактный email (необязательно)</label>
              <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                placeholder="для уведомления о статусе расследования" />
            </div>

            <button onClick={() => setForm(f => ({ ...f, anonymous: !f.anonymous }))}
              className="flex items-center gap-3 w-full p-4 rounded-xl transition-all"
              style={{ background: form.anonymous ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${form.anonymous ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.07)"}` }}>
              <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: form.anonymous ? "#a855f7" : "rgba(255,255,255,0.08)" }}>
                {form.anonymous && <Icon name="Check" size={12} className="text-white" />}
              </div>
              <div className="text-left">
                <div className="text-white/70 text-sm font-medium">Анонимная подача</div>
                <div className="text-white/30 text-xs">Контактные данные не будут переданы третьим лицам</div>
              </div>
            </button>

            <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.12)" }}>
              <Icon name="Scale" size={14} style={{ color: "#a855f7" }} className="mt-0.5 shrink-0" />
              <p className="text-white/40 text-xs">Инцидент будет зарегистрирован в блокчейн-реестре ЕГСУ. Ответственная группа ОГР получит уведомление в течение 2 часов. Расследование — до 7 дней, решение МС — до 14 дней.</p>
            </div>

            {error && (
              <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)" }}>
                <Icon name="AlertTriangle" size={14} style={{ color: "#f43f5e" }} className="mt-0.5 shrink-0" />
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading || score < 40}
              className="w-full py-4 rounded-xl font-bold text-black text-sm transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: score >= 40 ? "linear-gradient(135deg, #f43f5e, #f59e0b)" : "rgba(255,255,255,0.06)", boxShadow: score >= 40 ? "0 0 30px rgba(244,63,94,0.3)" : "none", color: score >= 40 ? "#000" : "rgba(255,255,255,0.2)" }}>
              {loading ? <><Icon name="Loader" size={16} className="animate-spin" /> Отправка в ЕГСУ...</> : score < 40 ? "Добавьте больше доказательств" : "Отправить в систему ЕГСУ"}
            </button>

            {score < 40 && (
              <button onClick={() => setStep(3)} className="w-full py-3 rounded-xl text-sm font-semibold text-white/50"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                ← Добавить доказательства
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
