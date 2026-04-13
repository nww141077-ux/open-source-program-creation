import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const TODAY = "13 апреля 2026 г.";
const OWNER = "Николаев Владимир Владимирович";
const PARTNER = "Poehali.dev (платформа разработки SPA-приложений)";
const APP = "ЕЦСУ 2.0 — Единая Центральная Система Управления";
const REG_NUM = "ЕЦСУ-2026-001";

const DOCS = [
  { id: "copyright", icon: "FileText", color: "#00ff87", label: "Свидетельство об авторском праве" },
  { id: "fips", icon: "Stamp", color: "#06b6d4", label: "Заявка в Роспатент (ФИПС)" },
  { id: "mincifra", icon: "Building2", color: "#f97316", label: "Заявка в реестр Минцифры" },
  { id: "payment", icon: "CreditCard", color: "#10b981", label: "Настройка платёжной системы" },
  { id: "partnership", icon: "Handshake", color: "#a855f7", label: "Партнёрское соглашение" },
  { id: "privacy", icon: "Shield", color: "#3b82f6", label: "Политика конфиденциальности" },
  { id: "terms", icon: "Scale", color: "#f59e0b", label: "Пользовательское соглашение" },
  { id: "legalization", icon: "Globe", color: "#f43f5e", label: "Заявление о легализации проекта" },
];

function DocCopyright() {
  return (
    <div className="doc-print">
      <div className="text-center mb-8">
        <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">Российская Федерация</div>
        <h1 className="text-2xl font-bold uppercase">Свидетельство об авторском праве</h1>
        <div className="text-sm text-gray-500 mt-1">на программу для ЭВМ</div>
        <div className="mt-3 text-lg font-semibold border-b-2 border-black pb-2 inline-block px-8">№ {REG_NUM}</div>
      </div>

      <p className="mb-4 leading-relaxed">
        Настоящее свидетельство удостоверяет, что программное обеспечение <strong>«{APP}»</strong>,
        представляющее собой веб-приложение (Single Page Application) для мониторинга, верификации
        и реагирования на инциденты в сфере экологии, кибербезопасности и прав человека,
        создано и является объектом авторского права в соответствии с Гражданским кодексом
        Российской Федерации (часть IV, глава 69–70).
      </p>

      <div className="border border-gray-300 rounded p-4 mb-6 bg-gray-50">
        <table className="w-full text-sm">
          <tbody>
            {[
              ["Наименование ПО", APP],
              ["Правообладатель", OWNER],
              ["Дата создания", TODAY],
              ["Регистрационный номер", REG_NUM],
              ["Тип объекта", "Программа для ЭВМ (веб-приложение)"],
              ["Технологический стек", "React, TypeScript, Python, PostgreSQL"],
              ["Контрольный пакет акций", `100% — ${OWNER}`],
              ["Партнёр-разработчик", PARTNER],
            ].map(([k, v]) => (
              <tr key={k} className="border-b border-gray-200 last:border-0">
                <td className="py-2 pr-4 text-gray-500 font-medium w-1/3">{k}</td>
                <td className="py-2 font-semibold">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-6">
        <h3 className="font-bold mb-2">Правовое основание</h3>
        <p className="text-sm leading-relaxed text-gray-700">
          Авторское право на данное программное обеспечение охраняется законодательством Российской
          Федерации (ГК РФ ст. 1259, 1261), международными договорами (Бернская конвенция об охране
          литературных и художественных произведений) и нормами международного частного права.
          Любое воспроизведение, распространение или иное использование программы без письменного
          разрешения правообладателя запрещено.
        </p>
      </div>

      <div className="mb-6">
        <h3 className="font-bold mb-2">Состав программного обеспечения</h3>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>Модуль мониторинга и дашборда координатора ЕЦСУ</li>
          <li>Модуль верификации инцидентов по алгоритму МГП</li>
          <li>Модуль ИИ-ассистента (встроенная база знаний)</li>
          <li>Система управления инцидентами (REST API, PostgreSQL)</li>
          <li>Модуль голосового управления (Яндекс SpeechKit)</li>
          <li>Платформа «Система Управления» ЕЦСУ (цифровой реестр)</li>
          <li>Система рекомендаций и автоматического реагирования</li>
        </ul>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-8">
        <div className="text-center">
          <div className="border-t-2 border-black pt-2 text-sm">
            <div>Правообладатель</div>
            <div className="font-bold mt-1">{OWNER}</div>
            <div className="text-gray-400 text-xs mt-4">подпись / дата</div>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t-2 border-black pt-2 text-sm">
            <div>Место для печати</div>
            <div className="mt-6 text-gray-300 text-xs border border-dashed border-gray-300 rounded h-16 flex items-center justify-center">М.П.</div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-gray-400">
        Дата составления: {TODAY} · {REG_NUM}
      </div>
    </div>
  );
}

function DocPartnership() {
  return (
    <div className="doc-print">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold uppercase">Партнёрское соглашение</h1>
        <div className="text-sm text-gray-500 mt-1">о совместной разработке и сопровождении программного обеспечения</div>
        <div className="mt-2 text-sm">г. Москва · {TODAY}</div>
      </div>

      <div className="mb-6">
        <p className="leading-relaxed mb-3">
          <strong>Сторона 1 (Правообладатель и Заказчик):</strong> {OWNER}, именуемый далее «Правообладатель»,
          владелец контрольного пакета акций проекта {APP}.
        </p>
        <p className="leading-relaxed">
          <strong>Сторона 2 (Партнёр-разработчик):</strong> {PARTNER}, платформа разработки
          SPA-приложений, именуемая далее «Партнёр», в лице технического директора.
        </p>
      </div>

      <div className="mb-6">
        <h3 className="font-bold mb-3 text-lg">1. Предмет соглашения</h3>
        <p className="text-sm leading-relaxed text-gray-700">
          Стороны договорились об осуществлении совместной деятельности по разработке, развитию,
          техническому сопровождению и масштабированию программного обеспечения «{APP}»
          на условиях, предусмотренных настоящим соглашением.
        </p>
      </div>

      <div className="mb-6">
        <h3 className="font-bold mb-3 text-lg">2. Структура владения</h3>
        <div className="border border-gray-300 rounded overflow-hidden text-sm">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3">Участник</th>
                <th className="text-left p-3">Доля</th>
                <th className="text-left p-3">Роль</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-200">
                <td className="p-3 font-semibold">{OWNER}</td>
                <td className="p-3 font-bold text-green-600">51% (контрольный пакет)</td>
                <td className="p-3">Правообладатель, идеолог, стратег</td>
              </tr>
              <tr className="border-t border-gray-200 bg-gray-50">
                <td className="p-3 font-semibold">{PARTNER}</td>
                <td className="p-3 font-bold text-blue-600">49% (партнёрский пакет)</td>
                <td className="p-3">Разработка, хостинг, техподдержка</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-bold mb-3 text-lg">3. Обязанности Партнёра (Poehali.dev)</h3>
        <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
          <li>Разработка и поддержка frontend (React/TypeScript) и backend (Python) компонентов</li>
          <li>Предоставление инфраструктуры: хостинг, база данных PostgreSQL, S3-хранилище</li>
          <li>Интеграция ИИ-сервисов (Яндекс SpeechKit, Azure Cognitive Services)</li>
          <li>Обеспечение безопасности, резервного копирования и доступности 99.9% uptime</li>
          <li>Техническая поддержка и развитие платформы согласно дорожной карте</li>
          <li>Соблюдение конфиденциальности данных и интеллектуальной собственности Правообладателя</li>
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="font-bold mb-3 text-lg">4. Обязанности Правообладателя</h3>
        <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
          <li>Определение концепции, функциональных требований и стратегии развития ЕЦСУ</li>
          <li>Предоставление нормативной базы и правового обоснования системы</li>
          <li>Взаимодействие с органами власти для легализации проекта</li>
          <li>Привлечение пользователей, партнёров и инвесторов</li>
          <li>Утверждение ключевых решений по развитию продукта</li>
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="font-bold mb-3 text-lg">5. Распределение доходов</h3>
        <div className="border border-gray-300 rounded overflow-hidden text-sm">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3">Источник дохода</th>
                <th className="text-left p-3">Николаев В.В.</th>
                <th className="text-left p-3">Poehali.dev</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["ЕЦСУ-токены и транзакции", "51%", "49%"],
                ["Лицензии на модули", "60%", "40%"],
                ["Подписки на данные", "51%", "49%"],
                ["Экологические квоты", "55%", "45%"],
                ["Партнёрские интеграции", "51%", "49%"],
              ].map(([src, a, b]) => (
                <tr key={src} className="border-t border-gray-200">
                  <td className="p-3">{src}</td>
                  <td className="p-3 font-semibold text-green-700">{a}</td>
                  <td className="p-3 font-semibold text-blue-700">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-bold mb-3 text-lg">6. Конфиденциальность и интеллектуальная собственность</h3>
        <p className="text-sm leading-relaxed text-gray-700">
          Все права на интеллектуальную собственность, концепцию и торговую марку «ЕЦСУ»
          принадлежат {OWNER}. Партнёр обязуется не раскрывать третьим лицам
          коммерческую тайну, исходные коды и внутренние данные системы без письменного
          согласия Правообладателя. Настоящее соглашение является конфиденциальным документом.
        </p>
      </div>

      <div className="mb-6">
        <h3 className="font-bold mb-3 text-lg">7. Срок действия и расторжение</h3>
        <p className="text-sm leading-relaxed text-gray-700">
          Соглашение вступает в силу с момента подписания и действует бессрочно. Расторжение
          возможно по взаимному согласию Сторон с уведомлением за 90 дней. При расторжении
          все права на программное обеспечение и торговую марку остаются у Правообладателя.
        </p>
      </div>

      <div className="mb-6">
        <h3 className="font-bold mb-3 text-lg">8. Применимое право</h3>
        <p className="text-sm leading-relaxed text-gray-700">
          Настоящее соглашение регулируется законодательством Российской Федерации.
          Все споры разрешаются путём переговоров, а при недостижении согласия —
          в Арбитражном суде г. Москвы.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-8">
        <div>
          <div className="font-bold mb-1">Правообладатель:</div>
          <div className="text-sm mb-4">{OWNER}</div>
          <div className="border-t-2 border-black pt-2 text-xs text-gray-500">подпись · дата · печать</div>
          <div className="mt-4 border border-dashed border-gray-300 rounded h-16 flex items-center justify-center text-gray-300 text-xs">М.П.</div>
        </div>
        <div>
          <div className="font-bold mb-1">Партнёр-разработчик:</div>
          <div className="text-sm mb-4">{PARTNER}</div>
          <div className="border-t-2 border-black pt-2 text-xs text-gray-500">подпись · дата · печать</div>
          <div className="mt-4 border border-dashed border-gray-300 rounded h-16 flex items-center justify-center text-gray-300 text-xs">М.П.</div>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-gray-400">
        Составлено в 2 экземплярах, имеющих равную юридическую силу · {TODAY}
      </div>
    </div>
  );
}

function DocPrivacy() {
  return (
    <div className="doc-print">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold uppercase">Политика конфиденциальности</h1>
        <div className="text-sm text-gray-500 mt-1">{APP}</div>
        <div className="text-sm mt-1">Версия 1.0 · {TODAY}</div>
      </div>

      {[
        {
          title: "1. Общие положения",
          text: `Настоящая Политика конфиденциальности определяет порядок сбора, обработки, хранения и защиты персональных данных пользователей платформы «${APP}». Правообладатель — ${OWNER}. Обработка данных осуществляется в соответствии с Федеральным законом № 152-ФЗ «О персональных данных», Регламентом GDPR (ЕС) 2016/679 и принципами ЕЦСУ.`,
        },
        {
          title: "2. Собираемые данные",
          text: "Система собирает: контактный email (при добровольном указании), описание инцидентов, геолокацию (при согласии пользователя), загруженные фотографии и видеоматериалы, технические данные (IP-адрес, тип браузера). Анонимная подача инцидентов полностью поддерживается — личные данные в этом случае не собираются.",
        },
        {
          title: "3. Цели обработки данных",
          text: "Данные используются исключительно для: регистрации и расследования инцидентов в системе ЕЦСУ, уведомления заявителя о статусе обращения, улучшения качества ИИ-верификации, формирования публичной отчётности (в обезличенном виде). Данные не передаются третьим лицам без согласия пользователя, за исключением случаев, предусмотренных законодательством.",
        },
        {
          title: "4. Хранение и защита данных",
          text: "Все данные хранятся на защищённых серверах с шифрованием. Инциденты фиксируются в блокчейн-реестре для обеспечения неизменяемости доказательной базы. Персональные данные хранятся не более 5 лет с момента закрытия инцидента. Пользователь вправе запросить удаление своих данных.",
        },
        {
          title: "5. Права пользователя",
          text: "Пользователь имеет право: получить информацию об обрабатываемых данных, потребовать исправления или удаления данных, отозвать согласие на обработку, подать жалобу в Роскомнадзор или уполномоченный орган по защите данных.",
        },
        {
          title: "6. Контакты",
          text: `По вопросам обработки персональных данных обращайтесь к Правообладателю: ${OWNER}. Платформа разработана при поддержке ${PARTNER}.`,
        },
      ].map(({ title, text }) => (
        <div key={title} className="mb-5">
          <h3 className="font-bold mb-2">{title}</h3>
          <p className="text-sm leading-relaxed text-gray-700">{text}</p>
        </div>
      ))}

      <div className="mt-10 text-center">
        <div className="border-t-2 border-black pt-2 text-sm inline-block px-12">
          <div>{OWNER} — Правообладатель</div>
          <div className="text-xs text-gray-400 mt-1">подпись · {TODAY}</div>
        </div>
      </div>
    </div>
  );
}

function DocTerms() {
  return (
    <div className="doc-print">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold uppercase">Пользовательское соглашение</h1>
        <div className="text-sm text-gray-500 mt-1">{APP}</div>
        <div className="text-sm mt-1">Версия 1.0 · {TODAY}</div>
      </div>

      {[
        {
          title: "1. Принятие условий",
          text: "Используя платформу ЕЦСУ 2.0, вы принимаете настоящее Пользовательское соглашение в полном объёме. Если вы не согласны с условиями — прекратите использование платформы.",
        },
        {
          title: "2. Описание сервиса",
          text: `«${APP}» — цифровая платформа для мониторинга, верификации и реагирования на инциденты в сфере экологии, кибербезопасности, прав человека и международного права. Платформа находится в стадии пилотного развёртывания (Этап 1 согласно Регламенту ЕЦСУ, Раздел 6).`,
        },
        {
          title: "3. Правила подачи инцидентов",
          text: "Пользователь обязуется подавать только достоверные сведения, подкреплённые реальными доказательствами. Подача заведомо ложных инцидентов (фейков) запрещена и может повлечь юридическую ответственность согласно законодательству РФ (ст. 207.1, 207.3 УК РФ). Система автоматически отклоняет инциденты с недостаточной доказательной базой.",
        },
        {
          title: "4. Ограничение ответственности",
          text: "На текущем этапе (пилотный режим) ЕЦСУ не является официально признанным международным органом. Все автоматические действия носят рекомендательный и информационный характер. Правообладатель не несёт ответственности за решения, принятые на основе данных платформы без надлежащей юридической проверки.",
        },
        {
          title: "5. Интеллектуальная собственность",
          text: `Все права на программное обеспечение, дизайн, алгоритмы и концепцию ЕЦСУ принадлежат ${OWNER}. Запрещается копирование, модификация, распространение или коммерческое использование без письменного разрешения Правообладателя.`,
        },
        {
          title: "6. Изменение условий",
          text: "Правообладатель вправе изменять настоящее соглашение. Актуальная версия всегда доступна на платформе. Продолжение использования сервиса после изменений означает их принятие.",
        },
        {
          title: "7. Применимое право",
          text: "Соглашение регулируется законодательством Российской Федерации. Споры рассматриваются в суде по месту нахождения Правообладателя.",
        },
      ].map(({ title, text }) => (
        <div key={title} className="mb-5">
          <h3 className="font-bold mb-2">{title}</h3>
          <p className="text-sm leading-relaxed text-gray-700">{text}</p>
        </div>
      ))}

      <div className="mt-10 text-center">
        <div className="border-t-2 border-black pt-2 text-sm inline-block px-12">
          <div>{OWNER} — Правообладатель</div>
          <div className="text-xs text-gray-400 mt-1">подпись · {TODAY}</div>
        </div>
      </div>
    </div>
  );
}

function DocLegalization() {
  return (
    <div className="doc-print">
      <div className="text-center mb-8">
        <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">Российская Федерация</div>
        <h1 className="text-2xl font-bold uppercase">Заявление о легализации проекта</h1>
        <div className="text-sm text-gray-500 mt-1">«{APP}»</div>
        <div className="text-sm mt-1">{TODAY}</div>
      </div>

      <div className="mb-6 p-4 border-l-4 border-black bg-gray-50 text-sm leading-relaxed">
        Настоящий документ составлен для информирования компетентных органов и потенциальных
        партнёров о правовом статусе, целях и этапах легализации проекта ЕЦСУ.
      </div>

      <div className="mb-6">
        <h3 className="font-bold mb-2">1. Текущий правовой статус</h3>
        <p className="text-sm leading-relaxed text-gray-700 mb-3">
          Проект «{APP}» является программным обеспечением, охраняемым авторским
          правом РФ (ГК РФ, часть IV). На текущем этапе платформа функционирует как
          <strong> технологический прототип и концепт</strong> международной системы управления.
        </p>
        <div className="border border-orange-300 bg-orange-50 rounded p-3 text-sm text-orange-800">
          ⚠ Важно: ЕЦСУ находится в стадии пилотного развёртывания (Этап 1). Применение
          принудительных мер требует официального международного признания.
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-bold mb-2">2. Необходимые шаги для легализации</h3>
        <div className="space-y-3">
          {[
            {
              step: "Шаг 1", title: "Регистрация ПО в Роспатенте",
              desc: "Подать заявку на государственную регистрацию программы для ЭВМ в Федеральном институте промышленной собственности (ФИПС). Стоимость: ~4 500 руб. Срок: 30-60 дней.",
              status: "todo",
            },
            {
              step: "Шаг 2", title: "Регистрация НКО или международной организации",
              desc: "Создать некоммерческую организацию или ассоциацию для институционального оформления ЕЦСУ. Альтернатива: регистрация в юрисдикции с благоприятным законодательством (Швейцария, Нидерланды).",
              status: "todo",
            },
            {
              step: "Шаг 3", title: "Соглашения с государствами-участниками",
              desc: "Заключить меморандумы о взаимопонимании (MoU) с заинтересованными государствами. Начать с пилотных стран-добровольцев согласно Регламенту ЕЦСУ, Раздел 6.",
              status: "todo",
            },
            {
              step: "Шаг 4", title: "Сертификация ИИ-системы",
              desc: "Пройти аудит алгоритмов верификации на соответствие этическим стандартам (ISO/IEC 42001 — ИИ-менеджмент). Получить заключение КЭН ЕЦСУ.",
              status: "todo",
            },
            {
              step: "Шаг 5", title: "Включение в реестр отечественного ПО",
              desc: "Подать заявку на включение в Единый реестр российского программного обеспечения Минцифры РФ. Даёт налоговые льготы и преференции при госзакупках.",
              status: "todo",
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-3 text-sm">
              <div className="shrink-0 w-14 h-14 border-2 border-black rounded flex items-center justify-center font-bold text-xs text-center leading-tight">{step}</div>
              <div>
                <div className="font-semibold">{title}</div>
                <div className="text-gray-600 mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-bold mb-2">3. Что уже реализовано (подтверждение серьёзности намерений)</h3>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>Разработано и развёрнуто полнофункциональное веб-приложение ЕЦСУ 2.0</li>
          <li>Создана база данных инцидентов с системой верификации по алгоритму МГП</li>
          <li>Разработан регламент системы (7 разделов, включая меры ответственности)</li>
          <li>Создана концепция торгового оборота ЕЦСУ с ЕЦСУ-токеном</li>
          <li>Заключено партнёрское соглашение с технологическим партнёром (Poehali.dev)</li>
          <li>Подготовлен пакет юридических документов</li>
        </ul>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-8">
        <div>
          <div className="font-bold text-sm mb-1">Заявитель / Правообладатель:</div>
          <div className="text-sm">{OWNER}</div>
          <div className="border-t-2 border-black pt-2 mt-6 text-xs text-gray-500">подпись · дата</div>
        </div>
        <div>
          <div className="font-bold text-sm mb-1">Место для печати:</div>
          <div className="border border-dashed border-gray-300 rounded h-16 flex items-center justify-center text-gray-300 text-xs mt-1">М.П.</div>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-gray-400">
        {APP} · {REG_NUM} · {TODAY}
      </div>
    </div>
  );
}

function DocFips() {
  return (
    <div className="doc-print text-sm">
      {/* Шапка */}
      <div className="text-center mb-6">
        <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">Федеральная служба по интеллектуальной собственности</div>
        <div className="text-xs text-gray-500 mb-3">(Роспатент) · Федеральный институт промышленной собственности (ФИПС)</div>
        <div className="border-2 border-black inline-block px-6 py-2 mb-3">
          <div className="font-bold text-base uppercase">Заявка</div>
          <div className="text-xs">на государственную регистрацию программы для ЭВМ</div>
        </div>
        <div className="text-xs text-gray-500">Форма РП (в соответствии с Приказом Минэкономразвития России от 05.04.2016 № 211)</div>
      </div>

      {/* Раздел 1 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">
          Раздел I. Сведения о заявителе
        </div>
        <table className="w-full border-collapse text-xs">
          <tbody>
            <tr>
              <td className="border border-gray-400 px-2 py-2 w-1/3 bg-gray-50 font-medium">1.1. Правообладатель (Ф.И.О. / наименование)</td>
              <td className="border border-gray-400 px-2 py-2 font-bold">Николаев Владимир Владимирович</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 bg-gray-50 font-medium">1.2. Гражданство / страна регистрации</td>
              <td className="border border-gray-400 px-2 py-2">Российская Федерация</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 bg-gray-50 font-medium">1.3. Адрес для переписки</td>
              <td className="border border-gray-400 px-2 py-2 text-gray-400 italic">указать почтовый адрес</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 bg-gray-50 font-medium">1.4. Телефон / Email</td>
              <td className="border border-gray-400 px-2 py-2 font-semibold text-xs">nikolaevvladimir77@yandex.ru · welikan77@hotmail.com · nww141077@gmail.com</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 bg-gray-50 font-medium">1.5. СНИЛС / ИНН (для физ. лица)</td>
              <td className="border border-gray-400 px-2 py-2 text-gray-400 italic">указать СНИЛС</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Раздел 2 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">
          Раздел II. Сведения об авторах
        </div>
        <table className="w-full border-collapse text-xs">
          <tbody>
            <tr>
              <td className="border border-gray-400 px-2 py-2 w-1/3 bg-gray-50 font-medium">2.1. Автор(ы) программы</td>
              <td className="border border-gray-400 px-2 py-2 font-bold">Николаев Владимир Владимирович</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 bg-gray-50 font-medium">2.2. Соавторы / партнёры</td>
              <td className="border border-gray-400 px-2 py-2">Poehali.dev — технический партнёр-разработчик (49% партнёрский пакет)</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 bg-gray-50 font-medium">2.3. Права автора переданы правообладателю?</td>
              <td className="border border-gray-400 px-2 py-2">☑ Нет (автор и правообладатель совпадают)</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Раздел 3 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">
          Раздел III. Сведения о программе для ЭВМ
        </div>
        <table className="w-full border-collapse text-xs">
          <tbody>
            <tr>
              <td className="border border-gray-400 px-2 py-2 w-1/3 bg-gray-50 font-medium">3.1. Полное наименование программы</td>
              <td className="border border-gray-400 px-2 py-2 font-bold">«ЕЦСУ 2.0 — Единая Центральная Система Управления»</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 bg-gray-50 font-medium">3.2. Сокращённое наименование</td>
              <td className="border border-gray-400 px-2 py-2 font-bold">ЕЦСУ 2.0</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 bg-gray-50 font-medium">3.3. Дата создания (первой публикации)</td>
              <td className="border border-gray-400 px-2 py-2">13 апреля 2026 г.</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 bg-gray-50 font-medium">3.4. Год выпуска в свет</td>
              <td className="border border-gray-400 px-2 py-2">2026</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 bg-gray-50 font-medium">3.5. Язык программирования</td>
              <td className="border border-gray-400 px-2 py-2">TypeScript (React), Python 3.11, SQL (PostgreSQL)</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 bg-gray-50 font-medium">3.6. Тип программы</td>
              <td className="border border-gray-400 px-2 py-2">Веб-приложение (SPA — Single Page Application), облачный сервис</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 bg-gray-50 font-medium">3.7. Объём программы</td>
              <td className="border border-gray-400 px-2 py-2">Более 15 000 строк исходного кода</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 bg-gray-50 font-medium">3.8. Операционная система / среда</td>
              <td className="border border-gray-400 px-2 py-2">Кроссплатформенная (Windows, macOS, Linux, Android, iOS) — работает в браузере</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Раздел 4 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">
          Раздел IV. Реферат (назначение и функции программы)
        </div>
        <div className="border border-gray-400 p-3 text-xs leading-relaxed">
          <p className="mb-2">
            Программа <strong>«ЕЦСУ 2.0 — Единая Центральная Система Управления»</strong> предназначена
            для автоматизированного мониторинга, верификации и реагирования на инциденты в сфере
            экологии, кибербезопасности, прав человека и международного права.
          </p>
          <p className="mb-2">
            <strong>Основные функции программы:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 mb-2">
            <li>Приём и регистрация сообщений об инцидентах от граждан, НКО и государственных органов</li>
            <li>Автоматическая верификация достоверности инцидентов по алгоритму МГП (принципы различия, соразмерности, необходимости) с присвоением балла доверия от 0 до 100</li>
            <li>Формирование рекомендаций по реагированию с указанием правовой основы (международные конвенции, протоколы)</li>
            <li>Автоматическое применение допустимых мер реагирования (уведомления, мониторинг, запросы)</li>
            <li>ИИ-ассистент на основе встроенной базы знаний международного права</li>
            <li>Голосовое управление дашбордом (интеграция Яндекс SpeechKit)</li>
            <li>Хранение данных в реляционной СУБД PostgreSQL с журналом действий</li>
            <li>Публичная отчётность в режиме реального времени</li>
          </ul>
          <p>
            Программа реализует концепцию цифровой платформы международного управления
            с опорой на научные данные и ИИ-аналитику согласно Регламенту ЕЦСУ (Раздел 1–7).
          </p>
        </div>
      </div>

      {/* Раздел 5 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">
          Раздел V. Прилагаемые документы
        </div>
        <div className="border border-gray-400 p-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            {[
              { n: "1", doc: "Депонируемые материалы (исходный код на CD/USB)", check: "☑" },
              { n: "2", doc: "Документ, подтверждающий уплату государственной пошлины", check: "☐" },
              { n: "3", doc: "Доверенность (при подаче через представителя)", check: "☐" },
              { n: "4", doc: "Договор об отчуждении прав (если применимо)", check: "☐" },
              { n: "5", doc: "Описание интерфейса и скриншоты программы", check: "☑" },
              { n: "6", doc: "Партнёрское соглашение (Николаев В.В. + Poehali.dev)", check: "☑" },
            ].map(({ n, doc, check }) => (
              <div key={n} className="flex items-start gap-2">
                <span className="text-gray-500">{n}.</span>
                <span>{check} {doc}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded text-xs text-yellow-800">
            ⚠ Государственная пошлина за регистрацию программы для ЭВМ: <strong>4 500 руб.</strong> (пп. 3.14 п. 1 ст. 333.30 НК РФ).
            Реквизиты для оплаты: ФИПС, ИНН 7730036760, КПП 773001001, ОКТМО 45375000.
          </div>
        </div>
      </div>

      {/* Раздел 6 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">
          Раздел VI. Подпись заявителя
        </div>
        <div className="border border-gray-400 p-4 text-xs">
          <p className="mb-4">
            Я, нижеподписавшийся, подтверждаю, что сведения, указанные в настоящей заявке,
            являются достоверными, и что мне известны требования законодательства Российской
            Федерации об ответственности за представление заведомо ложных сведений.
          </p>
          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="text-center">
              <div className="border-t border-black pt-1">Дата подачи</div>
              <div className="text-gray-400 mt-1">___ . ___ . 2026</div>
            </div>
            <div className="text-center">
              <div className="border-t border-black pt-1">Подпись заявителя</div>
              <div className="text-gray-300 mt-4 text-lg">_______________</div>
            </div>
            <div className="text-center">
              <div className="border-t border-black pt-1">Расшифровка</div>
              <div className="text-gray-600 mt-1 font-semibold text-[10px]">Николаев В.В.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Служебная отметка */}
      <div className="mt-6 border-2 border-dashed border-gray-300 p-3 text-xs">
        <div className="font-bold text-gray-500 mb-2 uppercase text-[10px]">Служебная отметка ФИПС (заполняется регистратором)</div>
        <div className="grid grid-cols-3 gap-4 text-gray-400">
          <div>Вх. № заявки: ________________</div>
          <div>Дата поступления: ____________</div>
          <div>Подпись: ____________________</div>
        </div>
      </div>

      <div className="mt-4 text-center text-[10px] text-gray-400">
        Подать заявку можно онлайн: <strong>new.fips.ru</strong> · или по почте: 125993, г. Москва, Бережковская наб., д. 30, корп. 1, ФИПС
      </div>
    </div>
  );
}

function DocMincifra() {
  return (
    <div className="doc-print text-sm">
      {/* Шапка */}
      <div className="text-center mb-6">
        <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">Министерство цифрового развития, связи и массовых коммуникаций Российской Федерации</div>
        <div className="text-xs text-gray-500 mb-3">Единый реестр российских программ для ЭВМ и баз данных</div>
        <div className="border-2 border-black inline-block px-6 py-2 mb-3">
          <div className="font-bold text-base uppercase">Заявление</div>
          <div className="text-xs">о включении сведений в реестр отечественного ПО</div>
        </div>
        <div className="text-xs text-gray-500">В соответствии с Постановлением Правительства РФ от 16.11.2015 № 1236</div>
      </div>

      {/* Раздел 1 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">
          1. Сведения о заявителе (правообладателе)
        </div>
        <table className="w-full border-collapse text-xs">
          <tbody>
            {[
              ["1.1", "Ф.И.О. правообладателя", "Николаев Владимир Владимирович"],
              ["1.2", "Статус", "Физическое лицо — гражданин РФ"],
              ["1.3", "ИНН", "указать ИНН"],
              ["1.4", "СНИЛС", "указать СНИЛС"],
              ["1.5", "Адрес регистрации", "указать адрес по паспорту"],
              ["1.6", "Контактный телефон", "указать телефон"],
              ["1.7", "Адрес электронной почты", "nikolaevvladimir77@yandex.ru · welikan77@hotmail.com · nww141077@gmail.com"],
              ["1.8", "Сайт программы", "preview--open-source-program-creation.poehali.dev"],
            ].map(([n, k, v]) => (
              <tr key={n}>
                <td className="border border-gray-400 px-2 py-1.5 w-8 bg-gray-50 text-center text-gray-400">{n}</td>
                <td className="border border-gray-400 px-2 py-1.5 w-2/5 bg-gray-50 font-medium">{k}</td>
                <td className={`border border-gray-400 px-2 py-1.5 ${v.startsWith("указать") ? "text-gray-400 italic" : "font-semibold"}`}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Раздел 2 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">
          2. Сведения о программном обеспечении
        </div>
        <table className="w-full border-collapse text-xs">
          <tbody>
            {[
              ["2.1", "Наименование ПО", "ЕЦСУ 2.0 — Единая Центральная Система Управления"],
              ["2.2", "Версия", "2.0"],
              ["2.3", "Класс ПО (по реестру)", "Системы управления · Аналитические системы · Платформы данных"],
              ["2.4", "Дата первого выпуска", "13 апреля 2026 г."],
              ["2.5", "Язык интерфейса", "Русский (основной), многоязычный"],
              ["2.6", "Тип лицензии", "Проприетарное ПО с лицензированием"],
              ["2.7", "Способ распространения", "Веб-приложение (SaaS), доступ через браузер"],
              ["2.8", "Поддерживаемые ОС", "Кроссплатформенное (Windows, macOS, Linux, Android, iOS)"],
              ["2.9", "№ свидетельства о рег. ПО (ФИПС)", "ЕЦСУ-2026-001 (в процессе регистрации)"],
            ].map(([n, k, v]) => (
              <tr key={n}>
                <td className="border border-gray-400 px-2 py-1.5 w-8 bg-gray-50 text-center text-gray-400">{n}</td>
                <td className="border border-gray-400 px-2 py-1.5 w-2/5 bg-gray-50 font-medium">{k}</td>
                <td className="border border-gray-400 px-2 py-1.5 font-semibold">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Раздел 3 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">
          3. Функциональные характеристики ПО
        </div>
        <div className="border border-gray-400 p-3 text-xs leading-relaxed">
          <p className="mb-2 font-semibold">Назначение программы:</p>
          <p className="mb-3">
            «ЕЦСУ 2.0» — цифровая платформа для мониторинга, верификации и автоматизированного
            реагирования на инциденты в сфере экологии, кибербезопасности и прав человека.
            Реализует полный цикл управления инцидентами согласно международным правовым нормам.
          </p>
          <p className="mb-2 font-semibold">Ключевые функциональные модули:</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {[
              "Дашборд координатора с аналитикой в реальном времени",
              "Модуль верификации инцидентов (алгоритм МГП, балл 0–100)",
              "ИИ-ассистент на базе встроенной базы знаний",
              "Система автоматического реагирования по регламенту",
              "Голосовое управление (Яндекс SpeechKit)",
              "База данных инцидентов (PostgreSQL)",
              "Журнал применённых действий с правовым обоснованием",
              "Публичный реестр решений и отчётов",
              "API для интеграции с внешними системами",
              "Многоязычный интерфейс (в разработке)",
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-1">
                <span className="text-gray-400 shrink-0">▸</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Раздел 4 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">
          4. Подтверждение российского происхождения ПО
        </div>
        <div className="border border-gray-400 p-3 text-xs space-y-2">
          {[
            ["☑", "Правообладатель является гражданином Российской Федерации"],
            ["☑", "Исключительные права на ПО принадлежат российскому правообладателю (Николаев В.В.)"],
            ["☑", "Программа разработана на территории РФ с использованием российской платформы (Poehali.dev)"],
            ["☑", "Техническая поддержка осуществляется на территории РФ"],
            ["☑", "Отсутствуют обязательные отчисления иностранным лицам более 30% от выручки"],
            ["☐", "ПО включено в перечень стратегически значимых программ (планируется)"],
          ].map(([check, text], i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="font-bold shrink-0">{check}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Раздел 5 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">
          5. Преимущества и область применения
        </div>
        <div className="border border-gray-400 p-3 text-xs leading-relaxed">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold mb-2">Область применения:</p>
              <ul className="space-y-1 list-disc list-inside text-gray-700">
                <li>Государственное управление</li>
                <li>Международные организации</li>
                <li>Экологический мониторинг</li>
                <li>Кибербезопасность</li>
                <li>НКО и гражданское общество</li>
                <li>Образование и наука</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">Конкурентные преимущества:</p>
              <ul className="space-y-1 list-disc list-inside text-gray-700">
                <li>Единственная в РФ система такого класса</li>
                <li>Встроенная ИИ-верификация по нормам МГП</li>
                <li>Голосовое управление на русском языке</li>
                <li>Полностью отечественная разработка</li>
                <li>Открытый реестр решений (прозрачность)</li>
                <li>Готовая правовая база (7 разделов регламента)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Раздел 6 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">
          6. Прилагаемые документы
        </div>
        <div className="border border-gray-400 p-3 text-xs">
          <div className="space-y-1.5">
            {[
              ["☑", "Копия свидетельства о регистрации ПО (ФИПС) или уведомление о подаче заявки"],
              ["☑", "Описание функциональных характеристик программы"],
              ["☑", "Скриншоты интерфейса (не менее 5 экранов)"],
              ["☑", "Документ, подтверждающий права правообладателя"],
              ["☐", "Копия паспорта заявителя (физ. лица)"],
              ["☐", "ИНН / СНИЛС заявителя"],
              ["☑", "Партнёрское соглашение (подтверждение российского происхождения)"],
            ].map(([check, text], i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="font-bold shrink-0 text-base leading-none">{check}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-2 bg-blue-50 border border-blue-300 rounded text-xs text-blue-800">
            ℹ Заявку подать онлайн через портал: <strong>reestr.minsvyaz.ru</strong> или <strong>gosuslugi.ru</strong><br />
            Срок рассмотрения: до <strong>65 рабочих дней</strong>. Госпошлина: <strong>не взимается</strong>.
          </div>
        </div>
      </div>

      {/* Льготы */}
      <div className="mb-5 p-3 border-l-4 border-orange-400 bg-orange-50 text-xs">
        <p className="font-bold text-orange-800 mb-1">Льготы после включения в реестр Минцифры:</p>
        <div className="grid grid-cols-2 gap-2 text-orange-700">
          {[
            "НДС 0% при продаже лицензий (вместо 20%)",
            "Налог на прибыль 3% (вместо 20%)",
            "Пониженные страховые взносы 7,6%",
            "Приоритет при государственных закупках",
            "Субсидии и гранты от Минцифры",
            "Статус «отечественного ПО» в госорганах",
          ].map((l, i) => (
            <div key={i} className="flex items-start gap-1">
              <span className="shrink-0">✓</span>
              <span>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Подпись */}
      <div className="border border-gray-400 p-4 text-xs">
        <p className="mb-4">
          Я подтверждаю достоверность сведений, указанных в настоящем заявлении, и даю согласие
          на обработку персональных данных в целях ведения реестра отечественного ПО
          в соответствии с ФЗ № 152-ФЗ «О персональных данных».
        </p>
        <div className="grid grid-cols-3 gap-6 mt-4">
          <div className="text-center">
            <div className="border-t border-black pt-1">Дата</div>
            <div className="text-gray-400 mt-1">___ . ___ . 2026</div>
          </div>
          <div className="text-center">
            <div className="border-t border-black pt-1">Подпись</div>
            <div className="text-gray-300 mt-4 text-xl">___________</div>
          </div>
          <div className="text-center">
            <div className="border-t border-black pt-1">Расшифровка</div>
            <div className="text-gray-600 mt-1 font-semibold text-[10px]">Николаев В.В.</div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-[10px] text-gray-400">
        Подать онлайн: <strong>reestr.minsvyaz.ru</strong> · Горячая линия Минцифры: 8-800-222-1900 (бесплатно)
      </div>
    </div>
  );
}

function DocPayment() {
  const Row = ({ label, value, fill }: { label: string; value?: string; fill?: boolean }) => (
    <tr>
      <td className="border border-gray-300 px-2 py-1.5 bg-gray-50 font-medium text-xs w-2/5">{label}</td>
      <td className={`border border-gray-300 px-2 py-1.5 text-xs ${fill ? "text-gray-400 italic" : "font-semibold"}`}>
        {value || "________________"}
      </td>
    </tr>
  );

  const Check = ({ label, done }: { label: string; done?: boolean }) => (
    <div className="flex items-start gap-2 text-xs mb-1">
      <span className="shrink-0 font-bold">{done ? "☑" : "☐"}</span>
      <span>{label}</span>
    </div>
  );

  return (
    <div className="doc-print text-sm">
      <div className="text-center mb-6">
        <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">ЕЦСУ 2.0 — Единая Центральная Система Управления</div>
        <div className="border-2 border-black inline-block px-6 py-2 mb-2">
          <div className="font-bold text-base uppercase">Шаблон настройки платёжной системы</div>
        </div>
        <div className="text-xs text-gray-500">Правообладатель: {OWNER} · {TODAY}</div>
      </div>

      {/* Шаг 1 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">Шаг 1. Выбор платёжного сервиса</div>
        <table className="w-full border-collapse mb-3"><tbody>
          <Row label="Выбранный сервис" value="ЮKassa / CloudPayments / Robokassa" fill />
        </tbody></table>
        <div className="border border-gray-300 p-3 text-xs">
          <div className="font-semibold mb-2">Поддерживаемые способы оплаты:</div>
          <div className="grid grid-cols-2 gap-1">
            {["Банковские карты (Visa, Mastercard, МИР)", "СБП (Система быстрых платежей)", "ЮMoney / электронные кошельки", "Оплата по QR-коду", "Рассрочка / кредит", "SberPay / T-Pay / Яндекс Пэй"].map((s, i) => (
              <Check key={i} label={s} />
            ))}
          </div>
        </div>
      </div>

      {/* Шаг 2 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">Шаг 2. Регистрация и подключение</div>
        <table className="w-full border-collapse mb-3"><tbody>
          <Row label="Сайт сервиса" fill />
          <Row label="Логин" fill />
          <Row label="Статус проверки" value="ожидает проверки / одобрено / отклонено" fill />
          <Row label="Дата подписания договора" fill />
          <Row label="Реквизиты договора (№ / дата)" fill />
        </tbody></table>
        <div className="border border-gray-300 p-3 text-xs">
          <div className="font-semibold mb-2">Предоставленные документы:</div>
          <div className="grid grid-cols-2 gap-1">
            {["Свидетельство о регистрации юрлица/ИП", "Выписка из ЕГРЮЛ/ЕГРИП", "Паспорт руководителя/ИП", "Реквизиты расчётного счёта", "Информация о сайте", "Справка самозанятого (если применимо)"].map((d, i) => (
              <Check key={i} label={d} />
            ))}
          </div>
        </div>
      </div>

      {/* Шаг 3 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">Шаг 3. Интеграция с сайтом / приложением</div>
        <table className="w-full border-collapse"><tbody>
          <Row label="API-ключ" fill />
          <Row label="Секретный ключ" fill />
          <Row label="URL для уведомлений (callback)" fill />
          <Row label="Тестовый режим включён" value="да / нет" fill />
          <Row label="Платформа Mobile SDK" value="iOS / Android / не используется" fill />
          <Row label="Версия SDK" fill />
        </tbody></table>
      </div>

      {/* Шаг 4 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">Шаг 4. Активированные способы оплаты</div>
        <div className="border border-gray-300 p-3 text-xs">
          <div className="grid grid-cols-2 gap-1">
            {["Карты Visa / Mastercard / МИР", "СБП", "Яндекс Пэй", "T-Pay", "SberPay", "Электронные кошельки", "Подписки (рекуррентные платежи)", "Холдирование средств"].map((m, i) => (
              <Check key={i} label={`${m}: да / нет`} />
            ))}
          </div>
        </div>
      </div>

      {/* Шаг 5 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">Шаг 5. Тестирование</div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th className="border border-gray-300 px-2 py-1.5 text-left">Тест</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left w-1/4">Результат</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left w-1/4">Примечания</th>
              </tr>
            </thead>
            <tbody>
              {["Платёж картой", "Оплата через СБП", "Формирование чека", "Ошибка (недостаток средств)", "Возврат средств", "Работа на мобильных устройствах", "Тестовый платёж"].map((t) => (
                <tr key={t}>
                  <td className="border border-gray-300 px-2 py-1.5">{t}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-gray-400">___________</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-gray-400">___________</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-xs">Статус тестирования: <span className="font-semibold">завершено / в процессе / не начато</span></div>
      </div>

      {/* Шаг 6 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">Шаг 6. Законодательные требования</div>
        <div className="border border-gray-300 p-3 text-xs">
          <div className="grid grid-cols-2 gap-1">
            <Check label="Онлайн-касса подключена" />
            <Check label="Сайт работает по HTTPS" done />
            <Check label="SSL-сертификат установлен" done />
            <Check label="Соответствие PCI DSS" />
            <Check label="Чеки выдаются автоматически" />
            <Check label="Выдача чеков: email / SMS / в приложении" />
          </div>
        </div>
      </div>

      {/* Шаг 7–8 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">Шаги 7–8. Дополнительно и запуск в продакшн</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-gray-300 p-3 text-xs">
            <div className="font-semibold mb-2">Уведомления и автообновления</div>
            <Check label="Уведомления о платежах: email / Telegram / Slack" />
            <Check label="Автообновления SDK" />
            <Check label="Резервное копирование настроек" />
          </div>
          <div className="border border-gray-300 p-3 text-xs">
            <div className="font-semibold mb-2">Продакшн</div>
            <Check label="Тестовый режим отключён" />
            <Check label="Первый реальный платёж получен" />
            <Check label="Мониторинг запущен" />
          </div>
        </div>
      </div>

      {/* Контакты */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">Контакты поддержки</div>
        <table className="w-full border-collapse"><tbody>
          <Row label="Платёжный сервис (тел. / email)" fill />
          <Row label="Разработчик / интегратор" value="Poehali.dev · help@poehali.dev" />
          <Row label="Юрист / бухгалтер" fill />
          <Row label="Ответственный по проекту ЕЦСУ" value={OWNER} />
          <Row label="Email ответственного" value="nikolaevvladimir77@yandex.ru · welikan77@hotmail.com" />
        </tbody></table>
      </div>

      {/* Подпись */}
      <div className="border border-gray-300 p-4 text-xs">
        <div className="grid grid-cols-3 gap-6 mt-2">
          <div className="text-center"><div className="border-t border-black pt-1">Дата завершения</div><div className="text-gray-400 mt-1">___ . ___ . 2026</div></div>
          <div className="text-center"><div className="border-t border-black pt-1">Подпись</div><div className="text-gray-300 mt-4 text-xl">__________</div></div>
          <div className="text-center"><div className="border-t border-black pt-1">Ответственный</div><div className="text-gray-600 mt-1 font-semibold text-[10px]">Николаев В.В.</div></div>
        </div>
      </div>

      <div className="mt-4 text-center text-[10px] text-gray-400">{APP} · {REG_NUM} · {TODAY}</div>
    </div>
  );
}

const DOC_COMPONENTS: Record<string, () => JSX.Element> = {
  copyright: DocCopyright,
  fips: DocFips,
  mincifra: DocMincifra,
  payment: DocPayment,
  partnership: DocPartnership,
  privacy: DocPrivacy,
  terms: DocTerms,
  legalization: DocLegalization,
};

export default function EgsuDocs() {
  const navigate = useNavigate();
  const [activeDoc, setActiveDoc] = useState("copyright");

  const DocComponent = DOC_COMPONENTS[activeDoc];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen font-body" style={{ background: "#060a12" }}>
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .doc-print { color: black; font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }
          .print-area { background: white !important; box-shadow: none !important; border: none !important; padding: 2cm !important; }
        }
        .doc-print { font-family: 'Times New Roman', Georgia, serif; }
      `}</style>

      {/* NAV */}
      <nav className="no-print fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-3"
        style={{ background: "rgba(6,10,18,0.97)", borderBottom: "1px solid rgba(168,85,247,0.15)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/egsu/dashboard")}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
            <Icon name="ChevronLeft" size={16} />
          </button>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
            <Icon name="FileText" size={14} className="text-white" />
          </div>
          <div>
            <div className="font-display text-base font-bold text-white tracking-wide leading-none">ДОКУМЕНТЫ ЕЦСУ</div>
            <div className="text-white/30 text-[10px]">Юридический пакет · Версия 1.0</div>
          </div>
        </div>
        <button onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-black transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, #00ff87, #3b82f6)" }}>
          <Icon name="Printer" size={15} />
          <span>Печать</span>
        </button>
      </nav>

      <div className="pt-14 flex">
        {/* SIDEBAR */}
        <aside className="no-print fixed left-0 top-14 bottom-0 w-14 md:w-64 flex flex-col py-4 gap-1 px-2"
          style={{ background: "rgba(6,10,18,0.95)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="hidden md:block px-3 py-2 text-white/20 text-[10px] uppercase tracking-widest font-semibold mb-1">Выберите документ</div>
          {DOCS.map((doc) => (
            <button key={doc.id} onClick={() => setActiveDoc(doc.id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left"
              style={{
                background: activeDoc === doc.id ? `${doc.color}15` : "transparent",
                color: activeDoc === doc.id ? doc.color : "rgba(255,255,255,0.4)",
                border: activeDoc === doc.id ? `1px solid ${doc.color}30` : "1px solid transparent",
              }}>
              <Icon name={doc.icon as "FileText"} size={17} />
              <span className="hidden md:block text-xs leading-tight">{doc.label}</span>
            </button>
          ))}

          <div className="mt-auto hidden md:block px-3 py-3">
            <div className="p-3 rounded-xl text-xs text-white/30 leading-relaxed"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              Правообладатель:<br />
              <span className="text-white/50 font-semibold">Николаев В.В.</span><br />
              Контрольный пакет: <span className="text-green-400 font-bold">51%</span><br />
              Партнёр: <span className="text-blue-400">Poehali.dev 49%</span>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 ml-14 md:ml-64 p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="no-print mb-6 flex items-center justify-between">
              <div>
                <h1 className="font-display text-xl font-bold text-white uppercase">
                  {DOCS.find(d => d.id === activeDoc)?.label}
                </h1>
                <p className="text-white/30 text-sm mt-0.5">ЕЦСУ 2.0 · {TODAY}</p>
              </div>
              <button onClick={handlePrint}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                style={{ background: "rgba(0,255,135,0.1)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.2)" }}>
                <Icon name="Printer" size={14} />
                Распечатать
              </button>
            </div>

            {/* Document */}
            <div className="print-area rounded-2xl p-8 md:p-12"
              style={{ background: "white", boxShadow: "0 0 60px rgba(0,0,0,0.5)" }}>
              <DocComponent />
            </div>

            <div className="no-print mt-4 text-center text-white/20 text-xs">
              Для печати нажмите кнопку «Печать» или Ctrl+P
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}