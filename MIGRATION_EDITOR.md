# ФАЙЛ МИГРАЦИИ РЕДАКТОРА / EDITOR MIGRATION FILE
## ECSU 2.0 — Единая Центральная Система Управления

---

## 🔴 КРИТИЧЕСКИ ВАЖНО: ПРОЧИТАТЬ ПЕРЕД НАЧАЛОМ РАБОТЫ

Этот файл содержит всё необходимое для передачи проекта новому ИИ-редактору,
разработчику или платформе. Сохраните его в надёжном месте.

---

## 1. ВЛАДЕЛЕЦ СИСТЕМЫ

| Поле               | Значение                              |
|--------------------|---------------------------------------|
| ФИО                | Николаев Владимир Владимирович        |
| Дата рождения      | 14.10.1977                            |
| Email              | nikolaevvladimir77@yandex.ru          |
| Система            | ECSU 2.0 (NexaFlow)                   |
| Год создания       | 2026                                  |
| Авторские права    | © 2026 Николаев Владимир Владимирович |
| Лицензия           | Проприетарная (All Rights Reserved)   |

---

## 2. АРХИТЕКТУРА ПРОЕКТА

### Стек технологий
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Python 3.11 (Cloud Functions)
- **База данных:** PostgreSQL (psycopg2, Simple Query Protocol)
- **Файловое хранилище:** S3 (boto3, endpoint: bucket.poehali.dev)
- **Хостинг:** poehali.dev

### Структура папок
```
/src
  /core
    author.ts          ← ЯДРО: авторские данные, НЕ МЕНЯТЬ без ведома владельца
  /pages
    Index.tsx          ← Главная страница (лендинг NexaFlow)
    Dashboard.tsx      ← Личный кабинет (профиль Владимира)
    EgsuDashboard.tsx  ← Центр задач ECSU 2.0
    EgsuFinance.tsx    ← Финансы (WebMoney, QIWI, счета)
    EgsuSecurity.tsx   ← Безопасность
    EgsuOwner.tsx      ← Настройки владельца
    EgsuMigration.tsx  ← Система эмиграции (ручной режим)
    EgsuExport.tsx     ← Экспорт пакета
    EgsuArk.tsx        ← Ковчег (серверы)
    EgsuLegal.tsx      ← Правовая база
    EgsuDocs.tsx       ← Документы
    EgsuApi.tsx        ← API-менеджер
    EgsuAnalytics.tsx  ← Аналитика
    EgsuReport.tsx     ← Отчёты
    EgsuBusiness.tsx   ← Бизнес
    EgsuEmergency.tsx  ← Экстренные протоколы
    EgsuAppeal.tsx     ← Обращения
    EgsuRewards.tsx    ← Вознаграждения
    EgsuNotifications.tsx ← Уведомления
    EgsuCapabilities.tsx  ← Возможности системы
    EgsuForUsers.tsx   ← Для пользователей
    EgsuInstall.tsx    ← Установка
    EgsuCpvoa.tsx      ← ЦПВОА
    AdminLogin.tsx     ← Вход в админку
    AdminPanel.tsx     ← Панель администратора
/backend
  /egsu-admin          ← Бэкенд ECSU (Python)
  /finance             ← Финансовые функции
  /ark-admin           ← Управление серверами
  /export-manager      ← Экспорт/упаковка
```

### Ключевые роуты
```
/                → Index.tsx (лендинг)
/app             → Dashboard.tsx (NexaFlow кабинет)
/egsu/dashboard  → Главный центр управления ECSU
/egsu/finance    → Финансы
/egsu/security   → Безопасность
/egsu/owner      → Настройки владельца
/egsu/migration  → Система эмиграции (РУЧНОЙ РЕЖИМ)
/egsu/export     → Экспорт проекта
/admin           → Административная панель
```

---

## 3. ПРАВИЛА ДЛЯ НОВОГО РЕДАКТОРА

### Обязательно соблюдать:
1. **НЕ менять** данные в `src/core/author.ts` без явного разрешения владельца
2. **НЕ менять** имя владельца с "Николаев Владимир Владимирович" на что-либо другое
3. **НЕ трогать** систему эмиграции (`/egsu/migration`) — блокировка должна оставаться активной по умолчанию
4. **Email владельца:** nikolaevvladimir77@yandex.ru — использовать везде
5. **Год:** 2026 — в копирайтах и авторских отметках
6. **Стиль кода:** React + TypeScript, без лишних комментариев, компактный

### Цветовая схема системы:
- Основной зелёный: `#00ff87`
- Фиолетовый: `#a855f7`
- Синий: `#3b82f6`
- Красный (опасность): `#f43f5e`
- Жёлтый (внимание): `#f59e0b`
- Фон: `#060a12` (тёмный) / `#0d1b2e` (карточки)

### Шрифты:
- Заголовки: `font-display` (Golos Text или аналог)
- Тело: `font-body`
- Моноширинный: `font-mono`

---

## 4. БЭКЕНД: КАК ПОДКЛЮЧАТЬ ФУНКЦИИ

### Формат handler (Python):
```python
def handler(event: dict, context) -> dict:
    """Описание функции на русском."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
        }, 'body': ''}
    # ... логика
    return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(result)}
```

### База данных:
- Переменная: `os.environ['DATABASE_URL']`
- Драйвер: `psycopg2` (только Simple Query, без параметризованных запросов с %s в сложных случаях)

### S3 хранилище:
```python
import boto3
s3 = boto3.client('s3',
    endpoint_url='https://bucket.poehali.dev',
    aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
    aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
```
CDN: `https://cdn.poehali.dev/projects/{AWS_ACCESS_KEY_ID}/bucket/...`

---

## 5. МИГРАЦИЯ НА ДРУГУЮ ПЛАТФОРМУ (ЭКСТРЕННЫЙ СЛУЧАЙ)

### Шаг 1: Экспорт кода
1. Открыть `poehali.dev` → **Скачать → Скачать код** (ZIP с исходниками)
2. Или: **Скачать → Подключить GitHub** → код уйдёт в репозиторий

### Шаг 2: Сборка проекта
```bash
bun install
bun run build
# Результат: папка dist/ — готовый HTML+JS+CSS
```

### Шаг 3: Деплой на бесплатные платформы

#### Вариант A — Netlify (рекомендуется):
1. Зайти на netlify.com
2. Перетащить папку `dist/` в Netlify Drop
3. Или: подключить GitHub → автодеплой
4. Создать файл `dist/_redirects`:
   ```
   /* /index.html 200
   ```

#### Вариант B — Vercel:
1. Зайти на vercel.com
2. Подключить GitHub-репозиторий
3. Build Command: `bun run build`
4. Output Directory: `dist`

#### Вариант C — GitHub Pages:
1. Создать репозиторий на github.com
2. Загрузить содержимое `dist/`
3. Settings → Pages → включить из ветки main

#### Вариант D — Cloudflare Pages (лучший CDN):
1. pages.cloudflare.com
2. Подключить GitHub или загрузить dist/
3. Неограниченный трафик бесплатно

### Шаг 4: Настройка SPA-роутинга
На всех платформах нужен redirect-файл для работы React Router:
```
/* /index.html 200
```
Netlify: `_redirects` в папке `dist/`
Vercel: `vercel.json` → `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
Cloudflare: автоматически

### Шаг 5: Перенос бэкенда
Бэкенд (Python Cloud Functions) переносится на:
- **Railway.app** (бесплатно, Python) — рекомендуется
- **Render.com** (бесплатный тир, Flask/FastAPI)
- **Fly.io** (бесплатно до 3 инстансов)

```bash
# Установить зависимости
pip install -r requirements.txt

# Запустить локально
python index.py
```

### Шаг 6: База данных
Экспорт текущей БД:
```sql
pg_dump $DATABASE_URL > backup_ecsu_2026.sql
```
Импорт на новую платформу:
```sql
psql $NEW_DATABASE_URL < backup_ecsu_2026.sql
```
Бесплатные PostgreSQL: **Supabase**, **Neon.tech**, **Railway**

---

## 6. ИНСТРУКЦИЯ ДЛЯ НОВОГО ИИ-РЕДАКТОРА (Claude / GPT / другой)

### Контекст проекта:
Это **ECSU 2.0** — Единая Центральная Система Управления, созданная для
**Николаева Владимира Владимировича** (nikolaevvladimir77@yandex.ru).

Система включает:
- Личный кабинет NexaFlow (/app) с интеграциями
- Центр задач ECSU (/egsu/dashboard)
- Финансовый модуль с WebMoney и QIWI
- Модуль безопасности и правовой базы
- Систему эмиграции с ручным управлением

### Ключевые принципы при редактировании:
1. Всегда читать существующий код перед правками
2. Сохранять стиль: тёмная тема `#060a12`, градиенты, monospace для кодов
3. Владелец — нетехнический пользователь, объяснять понятно
4. Изменения только с явного согласия владельца
5. Файл `src/core/author.ts` — неприкосновенен

### Команды для нового редактора:
```
# Изучить структуру
ls src/pages/

# Запустить проект
bun dev

# Собрать проект
bun run build

# Проверить ошибки
bun run lint
```

---

## 7. КОНТАКТЫ И ПОДДЕРЖКА

| Ресурс              | Ссылка                              |
|---------------------|-------------------------------------|
| Текущая платформа   | poehali.dev                         |
| Документация деплоя | docs.poehali.dev/deploy/publish     |
| GitHub интеграция   | docs.poehali.dev/deploy/github      |
| Поддержка платформы | poehali.dev/help                    |
| Telegram сообщество | t.me/+QgiLIa1gFRY4Y2Iy              |

---

## 8. ЧЕКЛИСТ ПЕРЕДАЧИ ПРОЕКТА

- [ ] Скачать исходный код (ZIP или GitHub)
- [ ] Скачать production билд (`dist/`)
- [ ] Экспортировать переменные окружения (.env)
- [ ] Сделать дамп базы данных (SQL)
- [ ] Скачать файлы из S3 (медиа, документы)
- [ ] Скопировать DNS-записи домена
- [ ] Задеплоить на новую платформу
- [ ] Проверить все роуты (/egsu/dashboard, /app, /)
- [ ] Настроить SPA-redirect (_redirects)
- [ ] Перенести бэкенд (Python функции)
- [ ] Подключить новую базу данных
- [ ] Обновить URL бэкенда в фронтенде (func2url.json)
- [ ] Протестировать финансовый модуль
- [ ] Протестировать систему безопасности

---

*Документ создан: 2026-04-19*
*Версия системы: ECSU 2.0*
*Владелец: Николаев Владимир Владимирович*
*© 2026 Все права защищены*
