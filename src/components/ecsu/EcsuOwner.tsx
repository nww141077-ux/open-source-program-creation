import { useState } from "react";
import Icon from "@/components/ui/icon";

const EcsuOwner = () => {
  const [tab, setTab] = useState<"profile" | "access" | "auth" | "log">("profile");
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    lastName: "Николаев",
    firstName: "Владимир",
    middleName: "Владимирович",
    sex: "Мужской",
    birthDate: "14.10.1977",
    birthPlace: "С. Александровка, Баганский р-н, Красноярский край",
    citizenship: "Российская Федерация",
    role: "Владелец · Главный администратор ECSU 2.0",
    // Паспорт РФ
    passportSeries: "01.22",
    passportNumber: "040088",
    passportIssued: "30.10.2022",
    passportIssuedBy: "ГУ МВД России по Алтайскому краю",
    passportDivision: "320-044",
    // Документ УФМС
    ufmsDoc: "ст. 334 УПК",
    ufmsNumber: "5040-865-637584-ЕЦСУ",
    email: "nikolaevvladimir77@yandex.ru",
    phone: "+7 (XXX) XXX-XX-XX",
    company: "SYNERGON GLOBAL",
    contract: "№ 5052834788",
  });

  const [form, setForm] = useState({ ...profile });

  const handleSave = () => {
    setProfile({ ...form });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCancel = () => {
    setForm({ ...profile });
    setEditing(false);
  };

  const Field = ({ label, field }: { label: string; field: keyof typeof form }) => (
    <div>
      <div className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">{label}</div>
      {editing ? (
        <input
          value={form[field]}
          onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
          className="w-full bg-[#060d1f] border border-blue-700/50 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
        />
      ) : (
        <div className="text-white text-sm font-medium">{profile[field] || "—"}</div>
      )}
    </div>
  );

  const accessLog = [
    { date: "25.05.2026 · 10:53", user: "nikolaev", action: "Авторизация владельца", status: "success" },
    { date: "25.05.2026 · 07:12", user: "nikolaev", action: "Просмотр финансового раздела", status: "success" },
    { date: "24.05.2026 · 23:40", user: "nikolaev", action: "Обновление конфигурации системы", status: "success" },
    { date: "24.05.2026 · 15:47", user: "Неизвестный", action: "Попытка несанкционированного входа", status: "error" },
    { date: "23.05.2026 · 09:22", user: "nikolaev", action: "Просмотр финансовых операций", status: "success" },
    { date: "22.05.2026 · 14:11", user: "nikolaev", action: "Изменение настроек безопасности", status: "success" },
  ];

  return (
    <div className="flex h-full">
      {/* Боковое меню */}
      <div className="w-48 bg-[#090e1e] border-r border-blue-900/20 flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-blue-900/20">
          <div className="text-blue-400 text-[9px] font-bold uppercase tracking-widest">ПАНЕЛЬ ВЛАДЕЛЬЦА</div>
          <div className="text-gray-600 text-[8px] mt-0.5">ECSU 2.0 · Управление системой</div>
        </div>
        <div className="py-2">
          {[
            { id: "profile" as const, label: "Профиль", icon: "User" },
            { id: "access"  as const, label: "Полномочия", icon: "ShieldCheck" },
            { id: "auth"    as const, label: "Авторизация", icon: "KeyRound" },
            { id: "log"     as const, label: "Журнал доступа", icon: "ScrollText" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-all ${
                tab === t.id
                  ? "bg-blue-900/30 text-white border-r-2 border-blue-400"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              <Icon name={t.icon} size={13} />
              {t.label}
            </button>
          ))}
        </div>
        <div className="mt-auto p-3 space-y-1.5">
          <button className="w-full flex items-center gap-2 px-3 py-2 bg-green-900/30 border border-green-700/30 text-green-400 text-xs rounded-lg hover:bg-green-900/50 transition-colors">
            <Icon name="Plus" size={11} /> Зона
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 bg-blue-900/30 border border-blue-700/30 text-blue-400 text-xs rounded-lg hover:bg-blue-900/50 transition-colors">
            <Icon name="RefreshCw" size={11} /> Восстановл.
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 bg-red-900/30 border border-red-700/30 text-red-400 text-xs rounded-lg hover:bg-red-900/50 transition-colors">
            <Icon name="RotateCcw" size={11} /> ИИ-Синхроника
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 bg-purple-900/30 border border-purple-700/30 text-purple-400 text-xs rounded-lg hover:bg-purple-900/50 transition-colors">
            <Icon name="Zap" size={11} /> Юрист
          </button>
        </div>
      </div>

      {/* Основная область */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Профиль ── */}
        {tab === "profile" && (
          <div className="p-6 max-w-5xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-white">ПРОФИЛЬ ВЛАДЕЛЬЦА</h1>
                <p className="text-gray-500 text-sm">Системная информация и статус</p>
              </div>
              <div className="flex gap-2">
                {saved && (
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-green-900/30 border border-green-600/30 text-green-400 text-sm rounded-lg">
                    <Icon name="Check" size={14} /> Сохранено
                  </div>
                )}
                {editing ? (
                  <>
                    <button onClick={handleCancel} className="px-4 py-2 bg-gray-800 border border-gray-600/30 text-gray-300 text-sm rounded-lg hover:bg-gray-700 transition-colors">
                      Отмена
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-1.5">
                      <Icon name="Save" size={14} /> Сохранить
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditing(true)} className="px-4 py-2 bg-[#0d1225] border border-blue-700/40 text-blue-400 text-sm rounded-lg hover:border-blue-500 transition-colors flex items-center gap-1.5">
                    <Icon name="Edit2" size={14} /> Редактировать
                  </button>
                )}
              </div>
            </div>

            {/* Карточка владельца */}
            <div className="bg-[#0d1225] border border-blue-900/40 rounded-xl p-5 mb-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#FFD700] to-[#f97316] rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                  <Icon name="Crown" size={30} className="text-black" />
                </div>
                <div className="flex-1">
                  <div className="text-white text-lg font-bold">
                    {profile.lastName} {profile.firstName} {profile.middleName}
                  </div>
                  <div className="text-yellow-400 text-sm">{profile.role}</div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-green-400 text-xs font-bold">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" />
                      АКТИВЕН
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-yellow-900/30 border border-yellow-600/30 text-yellow-400 rounded-full">ADMIN</span>
                    <span className="text-[10px] px-2 py-0.5 bg-purple-900/30 border border-purple-600/30 text-purple-400 rounded-full">PRIVATE</span>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-600">
                  <div>Последний вход: 25.05.2026</div>
                  <div className="mt-0.5">ID: OWNER-001-NVV</div>
                </div>
              </div>

              {/* Подтверждающие документы */}
              <div className="border-t border-blue-900/20 pt-4">
                <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-3 flex items-center justify-between">
                  ПОДТВЕРЖДАЮЩИЕ ДОКУМЕНТЫ
                  <span className="text-green-400 text-[9px]">✓ ВЕРИФИЦИРОВАНО</span>
                </div>
                <div className="space-y-2">
                  {/* Паспорт */}
                  <div className="bg-[#060d1f] border border-blue-900/20 rounded-lg p-3 flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <Icon name="CreditCard" size={14} className="text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">Паспорт РФ</div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        Серия {profile.passportSeries} № {profile.passportNumber} · Выдан {profile.passportIssued}
                      </div>
                      <div className="text-gray-600 text-[10px]">Действителен до 30.10.2032</div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 bg-green-900/30 border border-green-700/30 text-green-400 rounded-full shrink-0">АКТИВ</span>
                  </div>
                  {/* УФМС */}
                  <div className="bg-[#060d1f] border border-blue-900/20 rounded-lg p-3 flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <Icon name="FileText" size={14} className="text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">Документ УФМС · {profile.ufmsDoc}</div>
                      <div className="text-gray-500 text-xs mt-0.5">№ {profile.ufmsNumber}</div>
                      <div className="text-gray-600 text-[10px]">Действителен до 18.05.2028</div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 bg-orange-900/30 border border-orange-700/30 text-orange-400 rounded-full shrink-0">АКТИВ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Идентификационные данные */}
            <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-5 mb-4">
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <Icon name="User" size={11} />
                ИДЕНТИФИКАЦИОННЫЕ ДАННЫЕ
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <Field label="Фамилия" field="lastName" />
                <Field label="Имя" field="firstName" />
                <Field label="Отчество" field="middleName" />
                <Field label="Дата рождения" field="birthDate" />
                <Field label="Пол" field="sex" />
                <Field label="Гражданство" field="citizenship" />
                <div className="col-span-2">
                  <Field label="Место рождения" field="birthPlace" />
                </div>
                <div className="col-span-2">
                  <Field label="Роль в системе" field="role" />
                </div>
              </div>
              {editing && (
                <div className="mt-2 text-right">
                  <span className="text-[10px] text-yellow-500">АДМИНИСТРАТОР</span>
                </div>
              )}
            </div>

            {/* Паспорт РФ */}
            <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-5 mb-4">
              <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <Icon name="CreditCard" size={11} />
                ПАСПОРТ РФ
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <Field label="Серия и номер" field="passportSeries" />
                <Field label="Номер" field="passportNumber" />
                <Field label="Дата выдачи" field="passportIssued" />
                <Field label="Кем выдан" field="passportIssuedBy" />
                <Field label="Код подразделения" field="passportDivision" />
              </div>

              {/* Место для скана */}
              <div className="mt-4 bg-[#060d1f] border-2 border-dashed border-blue-900/30 rounded-lg p-6 text-center">
                <Icon name="Image" size={28} className="text-gray-700 mx-auto mb-2" />
                <div className="text-gray-600 text-sm">Скан паспорта</div>
                <div className="text-gray-700 text-xs mt-1">Нажмите для загрузки</div>
              </div>
            </div>

            {/* Документ УФМС */}
            <div className="bg-[#0d1225] border border-orange-900/20 rounded-xl p-5">
              <div className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <Icon name="AlertTriangle" size={11} />
                ДОКУМЕНТ УФМС · {profile.ufmsDoc}
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <Field label="Дата рождения" field="birthDate" />
                <Field label="Номер документа" field="ufmsNumber" />
                <Field label="Email" field="email" />
                <Field label="Компания" field="company" />
                <Field label="Контракт" field="contract" />
              </div>
            </div>
          </div>
        )}

        {/* ── Полномочия ── */}
        {tab === "access" && (
          <div className="p-6 max-w-3xl">
            <h2 className="text-xl font-bold text-white mb-1">Полномочия владельца</h2>
            <p className="text-gray-500 text-sm mb-6">Права доступа и управление системой ECSU 2.0</p>
            <div className="bg-[#0d1225] border border-yellow-600/20 rounded-xl p-5 mb-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Полный доступ ко всем разделам ECSU",
                  "Управление правами пользователей",
                  "Просмотр финансовых операций",
                  "Управление конфигурацией системы",
                  "Доступ к Dalan ИИ-движку",
                  "Управление TahkaOS и Ковчегом",
                  "Экспорт любых данных системы",
                  "Сброс и восстановление системы",
                  "Изменение профиля и документов",
                  "Управление серверами ECSU",
                ].map(p => (
                  <div key={p} className="flex items-center gap-2 text-xs text-gray-400 py-1.5 border-b border-white/5 last:border-0">
                    <Icon name="Check" size={12} className="text-green-400 shrink-0" />
                    {p}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Авторизация ── */}
        {tab === "auth" && (
          <div className="p-6 max-w-xl">
            <h2 className="text-xl font-bold text-white mb-1">Параметры безопасности</h2>
            <p className="text-gray-500 text-sm mb-6">Управление авторизацией владельца</p>
            <div className="bg-[#0d1225] border border-blue-900/30 rounded-xl p-5 space-y-5">
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-700 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors">
                  <Icon name="ShieldCheck" size={15} /> Авторизирован
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-700/80 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
                  <Icon name="ShieldOff" size={15} /> Сбросить сессию
                </button>
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-2">Роль</label>
                <input
                  defaultValue="owner"
                  className="w-full bg-[#060d1f] border border-blue-900/30 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-2">Псевдоним</label>
                <input
                  defaultValue="nikolaev"
                  className="w-full bg-[#060d1f] border border-blue-900/30 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center justify-between py-2 border-t border-blue-900/20">
                <div>
                  <div className="text-white text-sm">Анонимный режим</div>
                  <div className="text-gray-500 text-xs">Скрыть данные владельца от операторов</div>
                </div>
                <div className="w-2 h-2 rounded-full bg-blue-400" />
              </div>
              <button className="w-full py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors">
                Применить параметры безопасности
              </button>
            </div>
          </div>
        )}

        {/* ── Журнал ── */}
        {tab === "log" && (
          <div className="p-6 max-w-3xl">
            <h2 className="text-xl font-bold text-white mb-1">Журнал доступа</h2>
            <p className="text-gray-500 text-sm mb-6">Последние события авторизации в системе ECSU</p>
            <div className="space-y-2">
              {accessLog.map((e, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-[#0d1225] border border-white/5 rounded-xl">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    e.status === "success" ? "bg-green-400" :
                    e.status === "error" ? "bg-red-400 animate-pulse" : "bg-yellow-400"
                  }`} />
                  <div className="flex-1">
                    <div className="text-white text-xs font-medium">{e.action}</div>
                    <div className="text-gray-600 text-[11px]">{e.user}</div>
                  </div>
                  <div className="text-gray-700 text-[10px] shrink-0">{e.date}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EcsuOwner;
