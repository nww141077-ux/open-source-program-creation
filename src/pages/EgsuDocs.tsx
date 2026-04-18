import { useState } from "react";
import Icon from "@/components/ui/icon";
import DocsLayout from "./egsu-docs/DocsLayout";

const TODAY = "13 апреля 2026 г.";
const OWNER = "Николаев Владимир Владимирович";
const PARTNER = "—";
const APP = "ECSU 2.0 — Единая Центральная Система Управления";
const REG_NUM = "ECSU-2026-001";


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
          <li>Модуль мониторинга и центра задач (ЦЗ) координатора ECSU</li>
          <li>Модуль верификации инцидентов по алгоритму МГП</li>
          <li>Модуль ИИ-ассистента (встроенная база знаний)</li>
          <li>Система управления инцидентами (REST API, PostgreSQL)</li>
          <li>Модуль голосового управления (Яндекс SpeechKit)</li>
          <li>Платформа «Система Управления» ECSU (цифровой реестр)</li>
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

function DocModification() {
  return (
    <div className="doc-print">
      <div className="text-center mb-8">
        <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">Российская Федерация</div>
        <h1 className="text-2xl font-bold uppercase">Право на модификацию и гибридное моделирование</h1>
        <div className="text-sm text-gray-500 mt-1">программного обеспечения «{APP}»</div>
        <div className="mt-3 text-lg font-semibold border-b-2 border-black pb-2 inline-block px-8">№ ECSU-2026-MOD-001</div>
      </div>

      <p className="mb-4 leading-relaxed">
        Настоящий документ подтверждает, что программное обеспечение <strong>«{APP}»</strong>,
        правообладателем которого является <strong>{OWNER}</strong>, имеет официально
        зафиксированное право на модификацию, адаптацию и применение гибридных видов
        моделирования в соответствии с действующим законодательством.
      </p>

      <div className="border border-gray-300 rounded p-4 mb-6 bg-gray-50">
        <table className="w-full text-sm">
          <tbody>
            {[
              ["Наименование ПО", APP],
              ["Правообладатель", OWNER],
              ["Дата регистрации права", TODAY],
              ["Номер документа", "ECSU-2026-MOD-001"],
              ["Тип права", "Право на модификацию и гибридное моделирование"],
              ["Правовое основание", "ГК РФ ст. 1261, 1266, 1280"],
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
        <h3 className="font-bold mb-3 text-lg">1. Право на модификацию</h3>
        <p className="text-sm leading-relaxed text-gray-700 mb-3">
          Правообладатель оставляет за собой исключительное право вносить любые изменения
          в архитектуру, функциональность, пользовательский интерфейс и логику программного
          обеспечения «{APP}», включая:
        </p>
        <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
          <li>Добавление новых модулей и компонентов системы</li>
          <li>Изменение алгоритмов обработки и верификации данных</li>
          <li>Расширение интеграций с внешними сервисами и API</li>
          <li>Адаптацию интерфейса под новые требования и устройства</li>
          <li>Оптимизацию и рефакторинг программного кода</li>
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="font-bold mb-3 text-lg">2. Право на гибридное моделирование</h3>
        <p className="text-sm leading-relaxed text-gray-700 mb-3">
          Программное обеспечение имеет право применять гибридные виды моделирования,
          сочетающие различные подходы и технологии:
        </p>
        <div className="grid grid-cols-1 gap-3 text-sm">
          {[
            { title: "ИИ-моделирование", desc: "Применение моделей машинного обучения и нейронных сетей для предсказания инцидентов и анализа угроз" },
            { title: "Геопространственное моделирование", desc: "Интеграция спутниковых данных и ГИС-систем для визуализации и анализа географических объектов" },
            { title: "Статистическое моделирование", desc: "Обработка массивов данных для выявления закономерностей и построения прогностических моделей" },
            { title: "Сценарное моделирование", desc: "Разработка и тестирование различных сценариев реагирования на инциденты и кризисные ситуации" },
            { title: "Гибридные архитектурные модели", desc: "Комбинирование монолитной и микросервисной архитектур для обеспечения масштабируемости системы" },
          ].map((item) => (
            <div key={item.title} className="border border-gray-200 rounded p-3 bg-white">
              <div className="font-semibold text-gray-800 mb-1">{item.title}</div>
              <div className="text-gray-600">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-bold mb-3 text-lg">3. Ограничения и условия</h3>
        <p className="text-sm leading-relaxed text-gray-700">
          Любые модификации и применение гибридных моделей осуществляются исключительно
          правообладателем или уполномоченными им лицами. Партнёр (Poehali.dev) вправе
          производить технические изменения только по письменному согласованию с правообладателем
          в рамках Партнёрского соглашения № ECSU-2026-001.
        </p>
      </div>

      <div className="mb-6">
        <h3 className="font-bold mb-3 text-lg">4. Отражение в реестре</h3>
        <p className="text-sm leading-relaxed text-gray-700">
          Настоящее право зарегистрировано в реестре программного обеспечения системы ECSU 2.0
          и подлежит отражению в государственном реестре программ для ЭВМ Федерального института
          промышленной собственности (ФИПС) при Роспатенте.
        </p>
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
        Дата составления: {TODAY} · № ECSU-2026-MOD-001
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
          <li>Определение концепции, функциональных требований и стратегии развития ECSU</li>
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
                ["ECSU-токены и транзакции", "51%", "49%"],
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
          Все права на интеллектуальную собственность, концепцию и торговую марку «ECSU»
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
          text: `Настоящая Политика конфиденциальности определяет порядок сбора, обработки, хранения и защиты персональных данных пользователей платформы «${APP}». Правообладатель — ${OWNER}. Обработка данных осуществляется в соответствии с Федеральным законом № 152-ФЗ «О персональных данных», Регламентом GDPR (ЕС) 2016/679 и принципами ECSU.`,
        },
        {
          title: "2. Собираемые данные",
          text: "Система собирает: контактный email (при добровольном указании), описание инцидентов, геолокацию (при согласии пользователя), загруженные фотографии и видеоматериалы, технические данные (IP-адрес, тип браузера). Анонимная подача инцидентов полностью поддерживается — личные данные в этом случае не собираются.",
        },
        {
          title: "3. Цели обработки данных",
          text: "Данные используются исключительно для: регистрации и расследования инцидентов в системе ECSU, уведомления заявителя о статусе обращения, улучшения качества ИИ-верификации, формирования публичной отчётности (в обезличенном виде). Данные не передаются третьим лицам без согласия пользователя, за исключением случаев, предусмотренных законодательством.",
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
          text: "Используя платформу ECSU 2.0, вы принимаете настоящее Пользовательское соглашение в полном объёме. Если вы не согласны с условиями — прекратите использование платформы.",
        },
        {
          title: "2. Описание сервиса",
          text: `«${APP}» — цифровая платформа для мониторинга, верификации и реагирования на инциденты в сфере экологии, кибербезопасности, прав человека и международного права. Платформа находится в стадии пилотного развёртывания (Этап 1 согласно Регламенту ECSU, Раздел 6).`,
        },
        {
          title: "3. Правила подачи инцидентов",
          text: "Пользователь обязуется подавать только достоверные сведения, подкреплённые реальными доказательствами. Подача заведомо ложных инцидентов (фейков) запрещена и может повлечь юридическую ответственность согласно законодательству РФ (ст. 207.1, 207.3 УК РФ). Система автоматически отклоняет инциденты с недостаточной доказательной базой.",
        },
        {
          title: "4. Ограничение ответственности",
          text: "На текущем этапе (пилотный режим) ECSU не является официально признанным международным органом. Все автоматические действия носят рекомендательный и информационный характер. Правообладатель не несёт ответственности за решения, принятые на основе данных платформы без надлежащей юридической проверки.",
        },
        {
          title: "5. Интеллектуальная собственность",
          text: `Все права на программное обеспечение, дизайн, алгоритмы и концепцию ECSU принадлежат ${OWNER}. Запрещается копирование, модификация, распространение или коммерческое использование без письменного разрешения Правообладателя.`,
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
        партнёров о правовом статусе, целях и этапах легализации проекта ECSU.
      </div>

      <div className="mb-6">
        <h3 className="font-bold mb-2">1. Текущий правовой статус</h3>
        <p className="text-sm leading-relaxed text-gray-700 mb-3">
          Проект «{APP}» является программным обеспечением, охраняемым авторским
          правом РФ (ГК РФ, часть IV). На текущем этапе платформа функционирует как
          <strong> технологический прототип и концепт</strong> международной системы управления.
        </p>
        <div className="border border-orange-300 bg-orange-50 rounded p-3 text-sm text-orange-800">
          ⚠ Важно: ECSU находится в стадии пилотного развёртывания (Этап 1). Применение
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
              desc: "Создать некоммерческую организацию или ассоциацию для институционального оформления ECSU. Альтернатива: регистрация в юрисдикции с благоприятным законодательством (Швейцария, Нидерланды).",
              status: "todo",
            },
            {
              step: "Шаг 3", title: "Соглашения с государствами-участниками",
              desc: "Заключить меморандумы о взаимопонимании (MoU) с заинтересованными государствами. Начать с пилотных стран-добровольцев согласно Регламенту ECSU, Раздел 6.",
              status: "todo",
            },
            {
              step: "Шаг 4", title: "Сертификация ИИ-системы",
              desc: "Пройти аудит алгоритмов верификации на соответствие этическим стандартам (ISO/IEC 42001 — ИИ-менеджмент). Получить заключение КЭН ECSU.",
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
          <li>Разработано и развёрнуто полнофункциональное веб-приложение ECSU 2.0</li>
          <li>Создана база данных инцидентов с системой верификации по алгоритму МГП</li>
          <li>Разработан регламент системы (7 разделов, включая меры ответственности)</li>
          <li>Создана концепция торгового оборота ECSU с ECSU-токеном</li>
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
              <td className="border border-gray-400 px-2 py-2 text-gray-400 italic">—</td>
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
              <td className="border border-gray-400 px-2 py-2 font-bold">«ECSU 2.0 — Единая Центральная Система Управления»</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 bg-gray-50 font-medium">3.2. Сокращённое наименование</td>
              <td className="border border-gray-400 px-2 py-2 font-bold">ECSU 2.0</td>
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
              <td className="border border-gray-400 px-2 py-2">Веб-приложение (SPA — Single Page Application), облачный сервис; поддерживает автономный режим работы (PWA — Progressive Web App) без подключения к интернету</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 bg-gray-50 font-medium">3.7. Объём программы</td>
              <td className="border border-gray-400 px-2 py-2">Более 15 000 строк исходного кода</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-2 bg-gray-50 font-medium">3.8. Операционная система / среда</td>
              <td className="border border-gray-400 px-2 py-2">Кроссплатформенная (Windows, macOS, Linux, Android, iOS) — работает в браузере и автономно в режиме PWA (без подключения к интернету, с локальным кэшированием данных)</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Раздел 4 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">
          Раздел IV. Реферат (назначение и функции программы)
        </div>
        <div className="border border-gray-400 p-3 text-xs leading-relaxed space-y-2">
          <p>
            Программа <strong>«ECSU 2.0 — Единая Центральная Система Управления»</strong> предназначена для автоматизированного мониторинга, верификации и реагирования на инциденты в сфере: <strong>экологии; кибербезопасности; прав человека; международного права; стратегического развития человечества.</strong>
          </p>
          <p><strong>Основные функции программы:</strong></p>
          <p><strong>1. Приём и регистрация сообщений об инцидентах</strong> от: граждан; НКО; государственных органов. Предусмотрена многоуровневая система валидации поступающих данных, включая проверку электронной подписи и геотегирование источника сообщения.</p>
          <p><strong>2. Автоматическая верификация</strong> достоверности инцидентов по алгоритму МГП (принципы различия, соразмерности, необходимости) с присвоением балла доверия (0–100). Алгоритм учитывает: корреляцию с данными из доверенных источников (спутниковые снимки, датчики экологического мониторинга, базы данных МВД, ВОЗ и др.); лингвистический анализ текста сообщения (выявление признаков фейков, манипулятивных конструкций); сопоставление с историческими данными по региону.</p>
          <p><strong>3. Формирование рекомендаций по реагированию</strong> с указанием правовой основы: международные конвенции (например, Рамочная конвенция ООН об изменении климата); протоколы и соглашения (Киотский протокол, Парижское соглашение); национальное законодательство (кодексы, федеральные законы, постановления правительства). Рекомендации генерируются с учётом сценария развития инцидента и допустимых мер воздействия.</p>
          <p><strong>4. Автоматическое применение допустимых мер реагирования:</strong> уведомления заинтересованных органов (МЧС, Роспотребнадзор, местные власти) через интегрированные каналы связи (SMS, email, API госуслуг); мониторинг ситуации в режиме реального времени (анализ потоков данных с датчиков, камер видеонаблюдения, соцсетей); запросы дополнительных данных (автоматический сбор информации у операторов связи, энергетических компаний, транспортных служб).</p>
          <p><strong>5. ИИ-ассистент</strong> на основе встроенной базы знаний международного права: консультирование операторов по правовым аспектам реагирования; генерация юридических формулировок для официальных документов; поддержка диалога на 10+ языках с использованием моделей машинного перевода.</p>
          <p><strong>6. Голосовое управление дашбордом</strong> (интеграция с Яндекс SpeechKit): голосовая активация сценариев реагирования; аудиторный обзор ключевых показателей системы; диктовка комментариев и распоряжений с автоматической транскрипцией.</p>
          <p><strong>7. Хранение данных</strong> в реляционной СУБД PostgreSQL с ведением журнала действий: шифрование чувствительных данных (AES-256); резервное копирование в распределённые хранилища; аудит изменений с фиксацией IP-адреса и учётной записи пользователя.</p>
          <p><strong>8. Публичная отчётность</strong> в режиме реального времени: интерактивные дашборды с визуализацией статистики; открытые API для интеграции с сайтами госорганов и СМИ; еженедельные отчёты в формате PDF/Excel.</p>
          <p><strong>9. Дополнительные возможности:</strong> прогнозирование развития инцидентов с использованием моделей машинного обучения; симуляционный модуль для отработки сценариев реагирования; система ранжирования операторов по эффективности; интеграция с ГИС-системами (ArcGIS, QGIS); поддержка блокчейн-технологий для неизменяемого хранения критически важных данных.</p>
          <p>Программа реализует концепцию цифровой платформы международного управления с опорой на научные данные (статистика, результаты исследований, открытые датасеты), ИИ-аналитику (машинное обучение, нейронные сети, естественный язык), междисциплинарный подход (сочетание юридических, экологических, технических знаний). Работает в соответствии с Регламентом ECSU (Разделы 1–7) и соответствует международным стандартам информационной безопасности (ISO 27001, GDPR).</p>
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
              { n: "6", doc: "Реферат программы (Раздел IV настоящей заявки)", check: "☑" },
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
              ["2.1", "Наименование ПО", "ECSU 2.0 — Единая Центральная Система Управления"],
              ["2.2", "Версия", "2.0"],
              ["2.3", "Класс ПО (по реестру)", "Системы управления · Аналитические системы · Платформы данных"],
              ["2.4", "Дата первого выпуска", "13 апреля 2026 г."],
              ["2.5", "Язык интерфейса", "Русский (основной), многоязычный"],
              ["2.6", "Тип лицензии", "Проприетарное ПО с лицензированием"],
              ["2.7", "Способ распространения", "Веб-приложение (SaaS), доступ через браузер"],
              ["2.8", "Поддерживаемые ОС", "Кроссплатформенное (Windows, macOS, Linux, Android, iOS)"],
              ["2.9", "№ свидетельства о рег. ПО (ФИПС)", "ECSU-2026-001 (в процессе регистрации)"],
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
            «ECSU 2.0» — цифровая платформа для мониторинга, верификации и автоматизированного
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
        <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">ECSU 2.0 — Единая Центральная Система Управления</div>
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
          <Row label="Ответственный по проекту ECSU" value={OWNER} />
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

function DocAiHub() {
  return (
    <div className="doc-print text-sm">
      <div className="text-center mb-6">
        <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">Техническое задание</div>
        <div className="border-2 border-black inline-block px-6 py-2 mb-3">
          <div className="font-bold text-base uppercase">ИИ‑хаб: командный центр</div>
          <div className="text-xs">Многофункциональный ИИ‑ассистент</div>
        </div>
        <div className="text-xs text-gray-500">Версия 1.0 · {TODAY} · Правообладатель: Николаев В.В.</div>
      </div>

      {[
        {
          title: "1. Цель проекта",
          content: "Создать многофункциональный ИИ‑ассистент с открытым исходным кодом для обработки текстовых запросов, голосовых команд, изображений и документов. Интерфейс — компактная панель справа (десктоп) или выплывающая панель (мобильная версия).",
        },
        {
          title: "2. Основные функции",
          list: [
            "Основной чат с ИИ‑ассистентом — диалог с сохранением контекста",
            "Голосовой ввод — преобразование речи в текст",
            "Анализ фото — распознавание объектов и текста (OCR)",
            "Работа с документами — анализ PDF, DOCX, TXT",
            "Пакетная загрузка — отправка до 5 файлов одновременно",
            "История файлов — доступ к последним 20 загрузкам",
            "Настройки ИИ — персонализация стиля ответов и параметров",
          ],
        },
      ].map(sec => (
        <div key={sec.title} className="mb-5">
          <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">{sec.title}</div>
          <div className="border border-gray-400 p-3 text-xs leading-relaxed">
            {sec.content && <p>{sec.content}</p>}
            {sec.list && <ul className="list-disc list-inside space-y-1">{sec.list.map(l => <li key={l}>{l}</li>)}</ul>}
          </div>
        </div>
      ))}

      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">3. Используемые технологии (открытый код)</div>
        <div className="border border-gray-400 p-3">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-2 py-1 text-left">Функция</th>
                <th className="border border-gray-300 px-2 py-1 text-left">Инструмент</th>
                <th className="border border-gray-300 px-2 py-1 text-left">Назначение</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Генерация текста", "Qwen", "Многофункциональная модель для генерации текста, поиска, программирования, работы с изображениями"],
                ["Генерация текста", "DeepSeek", "Генерация текстов, перевод, ответы на вопросы, работа с кодом (поддержка русского языка)"],
                ["Анализ изображений", "OmniFusion", "Распознавание и описание изображений, визуальный диалог"],
                ["Анализ изображений", "MiVOLO", "Определение пола и возраста по фото (даже при частичном отсутствии лица)"],
                ["Работа с документами", "Khoj", "Поиск информации в файлах (PDF, Word, Markdown и др.)"],
                ["Работа с документами", "Chat2DB", "Конвертация естественного языка в SQL, генерация отчётов"],
                ["Голосовые технологии", "Vikhr Salt", "Преобразование речи в текст и текста в аудио"],
                ["Фреймворки", "LangChain", "Построение пользовательских потоков управления ИИ‑агентами"],
                ["Фреймворки", "Ollama", "Локальный запуск больших языковых моделей (LLM)"],
                ["Фреймворки", "n8n", "Визуальный конструктор рабочих процессов с ИИ"],
              ].map(([f, t, d]) => (
                <tr key={t}>
                  <td className="border border-gray-300 px-2 py-1">{f}</td>
                  <td className="border border-gray-300 px-2 py-1 font-semibold">{t}</td>
                  <td className="border border-gray-300 px-2 py-1 text-gray-600">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">4. Технические требования</div>
        <div className="border border-gray-400 p-3 text-xs leading-relaxed space-y-1">
          <p>• Язык программирования: Python 3.10+</p>
          <p>• Фреймворк: FastAPI (бэкенд), React (фронтенд)</p>
          <p>• База данных: SQLite (история чатов и файлов)</p>
          <p>• Хранение файлов: локальное хранилище (до 1 ГБ) с возможностью масштабирования</p>
          <p>• Изображения: JPG, PNG (до 20 МБ) · Документы: PDF, DOC, DOCX, TXT (до 100 МБ) · Аудио: WAV, MP3 (до 50 МБ)</p>
          <p>• Языки интерфейса: русский, английский</p>
          <p>• Совместимость: Chrome, Firefox, Safari; iOS, Android</p>
        </div>
      </div>

      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">5. Структура меню (UI)</div>
        <div className="border border-gray-400 p-3 text-xs font-mono leading-relaxed">
          <p>ИИ‑ХАБ: КОМАНДНЫЙ ЦЕНТР</p>
          <p>├── 🤖 ИИ‑ассистент (основной чат)</p>
          <p>├── 🎤 Голосовой ввод</p>
          <p>├── 📸 Анализ фото</p>
          <p>├── 📄 Работа с документами</p>
          <p>├── 💼 Пакетная загрузка</p>
          <p>├── 🗂️ История файлов</p>
          <p>└── ⚙️ Настройки ИИ</p>
        </div>
      </div>

      <div className="border border-gray-300 p-4 text-xs mt-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center"><div className="border-t border-black pt-1">Дата</div><div className="text-gray-400 mt-1">___ . ___ . 2026</div></div>
          <div className="text-center"><div className="border-t border-black pt-1">Подпись</div><div className="text-gray-300 mt-4 text-lg">_______________</div></div>
          <div className="text-center"><div className="border-t border-black pt-1">Правообладатель</div><div className="text-gray-600 mt-1 font-semibold text-[10px]">Николаев В.В.</div></div>
        </div>
      </div>
      <div className="mt-4 text-center text-[10px] text-gray-400">{APP} · {REG_NUM} · {TODAY}</div>
    </div>
  );
}

function DocGrafium() {
  return (
    <div className="doc-print text-sm">
      <div className="text-center mb-6">
        <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">Техническое задание</div>
        <div className="border-2 border-black inline-block px-6 py-2 mb-3">
          <div className="font-bold text-base uppercase">Ежедневник «Графиум»</div>
          <div className="text-xs">Система ежедневных задач · надёжный инструмент продуктивности</div>
        </div>
        <div className="text-xs text-gray-500">Версия 1.0 · {TODAY} · Правообладатель: Николаев В.В.</div>
      </div>

      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">1. Общие требования</div>
        <div className="border border-gray-400 p-3 text-xs leading-relaxed space-y-1">
          <p>• Формат: А5 (148×210 мм), альбомная ориентация разворотов</p>
          <p>• Обложка: твёрдая, матовая ламинация, тиснение названия</p>
          <p>• Бумага: офсет 80 г/м², слегка тонированная (кремовый оттенок), без бликов</p>
          <p>• Переплёт: пружинный или скрепление на кольцах (для возможности замены блоков)</p>
          <p>• Комплектация: набор маркеров‑текстовыделителей (8 цветов), цветные стикеры, закладки‑ленты (8 шт.), прозрачный карман</p>
        </div>
      </div>

      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">2. Структура ежедневника</div>
        <div className="border border-gray-400 p-3 text-xs leading-relaxed">
          <ul className="list-disc list-inside space-y-1">
            {[
              "Титульный лист — место для имени, года, контактов",
              "Цели на год — 2 страницы: таблица по сферам + шкала прогресса",
              "Обзор года — календарная сетка на разворот (12 месяцев)",
              "Месячный планинг — разворот на месяц: сетка + цели, бюджет, привычки",
              "Ежедневные развороты — дата, главная цель, список дел, временная шкала (7:00–23:00), заметки, итоги",
              "Еженедельный обзор — анализ, перенос задач, рефлексия",
              "Контакты (10 стр.), список книг/фильмов (4 стр.), финансы (6 стр.), трекер привычек",
              "Прозрачный карман для мелочей, линейка‑шаблон",
            ].map(l => <li key={l}>{l}</li>)}
          </ul>
        </div>
      </div>

      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">3. Функционал «Редактора подсветки» — цветовая схема</div>
        <div className="border border-gray-400 p-3">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-2 py-1 text-left">Цвет</th>
                <th className="border border-gray-300 px-2 py-1 text-left">Назначение</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Красный", "Срочные и важные задачи"],
                ["Синий", "Рабочие задачи и проекты"],
                ["Зелёный", "Здоровье, спорт, питание"],
                ["Жёлтый", "Обучение, саморазвитие"],
                ["Фиолетовый", "Личные дела и семья"],
                ["Оранжевый", "Творчество, хобби, отдых"],
                ["Розовый", "Социальные события, встречи"],
                ["Серый", "Рутинные дела, напоминания"],
              ].map(([c, d]) => (
                <tr key={c}>
                  <td className="border border-gray-300 px-2 py-1 font-semibold">{c}</td>
                  <td className="border border-gray-300 px-2 py-1 text-gray-600">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">4. Визуальные маркеры и элементы разметки</div>
        <div className="border border-gray-400 p-3 text-xs leading-relaxed">
          <p className="mb-2"><strong>Значки задач:</strong> ! (срочно) · ⭐ (приоритет) · 🔄 (повторяющаяся) · 💡 (идея) · ✅ (выполнено) · ⏳ (отложено) · ❓ (требует уточнения)</p>
          <p className="mb-2"><strong>Элементы разметки:</strong> вертикальная полоса слева — для цветового приоритета; кружки рядом с пунктами — для маркировки сферы жизни; цветные зоны в «Итогах дня»: зелёное поле (успехи), жёлтое поле (зоны роста); прозрачные вкладки‑разделители между месяцами.</p>
          <p><strong>Интерактивные элементы:</strong> стикеры‑индикаторы (прозрачные, цветные, разной формы); закладки‑ленты с нумерацией; линейка‑шаблон для быстрого создания таблиц.</p>
        </div>
      </div>

      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">5. Требования к дизайну</div>
        <div className="border border-gray-400 p-3 text-xs leading-relaxed space-y-1">
          <p>• Шрифт: чёткий, без засечек (Open Sans, Roboto)</p>
          <p>• Поля: широкие (20 мм) для заметок и подсветки</p>
          <p>• Сетка: лёгкая разметка, не мешает подсветке маркерами</p>
          <p>• Иконки: минималистичные, чёрно‑белые</p>
          <p>• Цветовые зоны: мягкие пастельные оттенки, не конфликтуют с маркерами</p>
          <p>• Инструкция: краткая памятка в начале (как использовать подсветку, советы для дальтоников)</p>
          <p>• Мотивационные цитаты в начале месяцев, мини‑задания на развитие привычек</p>
        </div>
      </div>

      <div className="border border-gray-300 p-4 text-xs mt-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center"><div className="border-t border-black pt-1">Дата</div><div className="text-gray-400 mt-1">___ . ___ . 2026</div></div>
          <div className="text-center"><div className="border-t border-black pt-1">Подпись</div><div className="text-gray-300 mt-4 text-lg">_______________</div></div>
          <div className="text-center"><div className="border-t border-black pt-1">Правообладатель</div><div className="text-gray-600 mt-1 font-semibold text-[10px]">Николаев В.В.</div></div>
        </div>
      </div>
      <div className="mt-4 text-center text-[10px] text-gray-400">{APP} · {REG_NUM} · {TODAY}</div>
    </div>
  );
}

function DocCpvoa() {
  return (
    <div className="doc-print text-sm">
      <div className="text-center mb-6">
        <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">Техническое задание</div>
        <div className="border-2 border-black inline-block px-6 py-2 mb-3">
          <div className="font-bold text-base uppercase">ЦПВОА</div>
          <div className="text-xs">Центральная Платформа Всеканального Обнаружения Аномалий</div>
        </div>
        <div className="text-xs text-gray-500">Интерфейс навигации в формате поисковика · Версия 1.0 · {TODAY}</div>
        <div className="text-xs text-gray-500 mt-1">Правообладатель: {OWNER}</div>
      </div>

      {/* Раздел 1 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">
          1. Цель и назначение системы
        </div>
        <div className="border border-gray-400 p-3 text-xs leading-relaxed">
          <p className="mb-2">Создать интуитивно понятный интерфейс, сочетающий функционал поисковой строки с инструментами мониторинга аномалий и инцидентов. Система обеспечивает: интуитивный доступ для неопытных пользователей; полный функционал в офлайн‑режиме; быстрый доступ к экстренным функциям; соответствие требованиям безопасности и конфиденциальности.</p>
        </div>
      </div>

      {/* Раздел 2 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">
          2. Основные элементы интерфейса
        </div>
        <div className="border border-gray-400 p-3 text-xs leading-relaxed space-y-3">
          <div>
            <p className="font-bold mb-1">2.1. Поисковая строка ЦПВОА</p>
            <p>Расположение: верхняя часть экрана (по центру). Префикс активации: <code className="bg-gray-100 px-1 rounded">ЦПВОА:</code> — появляется автоматически при фокусе. Placeholder: «Введите запрос для анализа через ЦПВОА (например: "ЦПВОА: проверить аномалии в эфире на 101.2 МГц")». Поддерживает автодополнение с подсказками по форматам запросов.</p>
          </div>
          <div>
            <p className="font-bold mb-1">2.2. Панель быстрого доступа</p>
            <p>Расположена под строкой поиска. Кнопки: <strong>📻 Мониторинг эфира</strong> — запуск сканирования радиочастот; <strong>📷 Визуальный анализ</strong> — активация камеры для детектирования световых сигналов; <strong>🌐 Меш‑сеть</strong> — подключение к локальной сети ЦПВОА; <strong>🔒 Оффлайн‑режим</strong> — переключение в автономный режим; <strong>⚠️ Экстренный сигнал</strong> — генерация SOS‑сообщения.</p>
          </div>
          <div>
            <p className="font-bold mb-1">2.3. Область результатов</p>
            <p>Отображается под панелью быстрого доступа. Содержит: сводку по инцидентам (категория, уровень угрозы, геолокация); источники данных (радио, ТВ, соцсети и др.); рекомендации по реагированию; таймлайн событий (хронология аномалий).</p>
          </div>
          <div>
            <p className="font-bold mb-1">2.4. Статусная панель (правый верхний угол)</p>
            <p>Индикатор связи (интернет / меш / офлайн); уровень заряда батареи; статус датчиков (активны/неактивны); индикатор обработки (круговой прогресс‑бар).</p>
          </div>
          <div>
            <p className="font-bold mb-1">2.5. Боковая панель (слева, свёрнута по умолчанию)</p>
            <p>«История запросов» — журнал последних операций; «Кэшированные данные» — доступ к офлайн‑базам; «Настройки мониторинга» — выбор частот, источников, фильтров; «Буфер сообщений» — неотправленные экстренные сигналы.</p>
          </div>
        </div>
      </div>

      {/* Раздел 3 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">
          3. Форматы запросов поисковой строки
        </div>
        <div className="border border-gray-400 p-3">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-2 py-1 text-left">Запрос</th>
                <th className="border border-gray-300 px-2 py-1 text-left">Действие</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["ЦПВОА: проверить аномалии на частоте 101.2 МГц", "Сканирование радиоэфира"],
                ["ЦПВОА: проанализировать световые сигналы", "Активация Li‑Fi‑модуля"],
                ["ЦПВОА: отправить SOS через меш", "Генерация экстренного сообщения"],
                ["ЦПВОА: показать последние инциденты в радиусе 5 км", "Запрос к локальному журналу"],
                ["ЦПВОА: синхронизировать буфер", "Отправка накопленных данных при появлении связи"],
              ].map(([q, a]) => (
                <tr key={q}>
                  <td className="border border-gray-300 px-2 py-1.5 font-mono text-[10px] text-blue-700">{q}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-gray-600">{a}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Раздел 4 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">
          4. Режимы отображения интерфейса
        </div>
        <div className="border border-gray-400 p-3">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-2 py-1 text-left">Режим</th>
                <th className="border border-gray-300 px-2 py-1 text-left">Условие</th>
                <th className="border border-gray-300 px-2 py-1 text-left">Описание</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Стандартный", "По умолчанию", "Поисковая строка + панель быстрого доступа"],
                ["Расширенный", "При вводе «ЦПВОА:»", "Появляются фильтры, таймлайн, статус датчиков"],
                ["Экстренный", "Критическая угроза", "Полноэкранное оповещение (красный фон), кнопка SOS в центре, автовключение датчиков"],
                ["Оффлайн", "Отсутствие связи", "Индикатор «Оффлайн», приоритет локальных данных, кнопка «Синхронизировать»"],
              ].map(([m, c, d]) => (
                <tr key={m}>
                  <td className="border border-gray-300 px-2 py-1.5 font-semibold">{m}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-gray-500 text-[10px]">{c}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-gray-600">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Раздел 5 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">
          5. Визуальное оформление
        </div>
        <div className="border border-gray-400 p-3 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-bold mb-2">Цветовая схема:</p>
              {[
                { color: "#2B2B2B", label: "Фон", hex: "#2B2B2B" },
                { color: "#FFFFFF", label: "Текст", hex: "#FFFFFF", dark: true },
                { color: "#4CAF50", label: "Нормальный режим", hex: "#4CAF50" },
                { color: "#FFC107", label: "Предупреждение", hex: "#FFC107" },
                { color: "#F44336", label: "Критическая угроза", hex: "#F44336" },
                { color: "#2196F3", label: "Служебные сообщения", hex: "#2196F3" },
              ].map(({ color, label, hex, dark }) => (
                <div key={hex} className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded border border-gray-300 flex-shrink-0" style={{ background: color }} />
                  <span className="text-gray-600">{label}</span>
                  <span className="text-gray-400 font-mono text-[10px]">{hex}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="font-bold mb-2">Шрифты:</p>
              <p className="mb-1">• Основной: Roboto, 14 px</p>
              <p className="mb-1">• Заголовки: Roboto Bold, 18 px</p>
              <p className="mb-3">• Предупреждения: Roboto Medium, 16 px</p>
              <p className="font-bold mb-2">Иконки:</p>
              <p className="mb-1">📻 Радио / Мониторинг эфира</p>
              <p className="mb-1">📷 Камера / Визуальный анализ</p>
              <p className="mb-1">🌐 Меш‑сеть</p>
              <p className="mb-1">⚠️ SOS / Экстренный сигнал</p>
              <p>🔒 Оффлайн‑режим</p>
            </div>
          </div>
        </div>
      </div>

      {/* Раздел 6 */}
      <div className="mb-5">
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 font-bold text-xs uppercase mb-3">
          6. Технические требования
        </div>
        <div className="border border-gray-400 p-3 text-xs leading-relaxed space-y-1">
          <p><strong>Платформы:</strong> Android 10+; iOS 14+; Windows 10+; веб (Chrome, Firefox, Safari)</p>
          <p><strong>Производительность:</strong> отклик ≤ 200 мс · загрузка модулей ≤ 1 сек · потребление ОЗУ ≤ 200 МБ</p>
          <p><strong>Безопасность:</strong> анонимизация данных в интерфейсе; шифрование служебных сообщений (AES‑256); защита от несанкционированного доступа (PIN/биометрия)</p>
          <p><strong>Адаптивность:</strong> мобильная версия — вертикальная компоновка, свайпы для боковой панели; десктоп — горизонтальная компоновка, drag‑and‑drop элементов</p>
        </div>
      </div>

      <div className="border border-gray-300 p-4 text-xs mt-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center"><div className="border-t border-black pt-1">Дата</div><div className="text-gray-400 mt-1">___ . ___ . 2026</div></div>
          <div className="text-center"><div className="border-t border-black pt-1">Подпись</div><div className="text-gray-300 mt-4 text-lg">_______________</div></div>
          <div className="text-center"><div className="border-t border-black pt-1">Правообладатель</div><div className="text-gray-600 mt-1 font-semibold text-[10px]">Николаев В.В.</div></div>
        </div>
      </div>
      <div className="mt-4 text-center text-[10px] text-gray-400">{APP} · {REG_NUM} · {TODAY}</div>
    </div>
  );
}

const DOC_COMPONENTS: Record<string, () => JSX.Element> = {
  copyright: DocCopyright,
  modification: DocModification,
  fips: DocFips,
  mincifra: DocMincifra,
  payment: DocPayment,
  partnership: DocPartnership,
  privacy: DocPrivacy,
  terms: DocTerms,
  legalization: DocLegalization,
  aihub: DocAiHub,
  grafium: DocGrafium,
  cpvoa: DocCpvoa,
};

export default function EgsuDocs() {
  const [activeDoc, setActiveDoc] = useState("copyright");

  const DocComponent = DOC_COMPONENTS[activeDoc];

  return (
    <DocsLayout activeDoc={activeDoc} setActiveDoc={setActiveDoc}>
      <DocComponent />
    </DocsLayout>
  );
}