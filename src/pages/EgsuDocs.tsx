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
          <li>Платформа «Глобальный закон» (цифровой реестр)</li>
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

const DOC_COMPONENTS: Record<string, () => JSX.Element> = {
  copyright: DocCopyright,
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
