# ECSU OS — Архивы для полноценной ОС
# Автор: Николаев В.В. | poehali.dev

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## УРОВЕНЬ 1 — УЖЕ ГОТОВО (Electron-приложение)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Текущая ECSU OS уже работает как desktop-приложение:
- Автозапуск при старте Windows ✓
- Иконка в трее ✓
- Полный экран ✓
- AI-ассистент Юра ✓
- Все модули ECSU ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## УРОВЕНЬ 2 — ПОЛНОЦЕННАЯ ОС (загрузочная флешка)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Для создания настоящей загрузочной ОС нужны эти архивы:

---

### 📦 АРХИВ 1 — Ventoy (инструмент для флешки)
Назначение: делает флешку мультизагрузочной — кидаешь ISO и она грузится
Скачать: https://github.com/ventoy/Ventoy/releases/latest
Файл: ventoy-X.X.XX-windows.zip (~15 МБ)
Как использовать:
  1. Распаковать zip
  2. Запустить Ventoy2Disk.exe
  3. Выбрать флешку (8 ГБ+) → Install
  4. Скопировать ISO файлы прямо на флешку

---

### 📦 АРХИВ 2 — Node.js (для запуска Electron)
Назначение: среда выполнения JavaScript — основа Electron
Скачать: https://nodejs.org/dist/latest/node-v22.xx.x-win-x64.zip
Или installer: https://nodejs.org/en/download
Файл: node-v22.x.x-win-x64.zip (~30 МБ)

---

### 📦 АРХИВ 3 — Electron (само приложение)
Назначение: оболочка которая запускает ECSU OS
Скачать: https://github.com/electron/electron/releases/latest
Файл: electron-v28.x.x-win32-x64.zip (~100 МБ)
(выбирать: electron-vXX.X.X-win32-x64.zip)

---

### 📦 АРХИВ 4 — Puppy Linux (легковесная ОС-основа)
Назначение: мини-Linux который грузится с флешки (300 МБ, работает в RAM)
Скачать: https://puppylinux-woof-ce.github.io/
Файл: FossaPup64-9.5.iso (~400 МБ)
Зачем: можно встроить ECSU OS поверх Puppy как оболочку

---

### 📦 АРХИВ 5 — Chromium (браузерное ядро без Chrome)
Назначение: движок для отображения ECSU OS интерфейса без Electron
Скачать: https://chromium.woolyss.com/ (выбрать Windows 64-bit)
Файл: chrome-win.zip (~150 МБ)
Запуск в режиме киоска: chromium.exe --kiosk --app=URL

---

### 📦 АРХИВ 6 — Git (для обновлений кода)
Назначение: скачивать обновления ECSU OS с GitHub
Скачать: https://github.com/git-for-windows/git/releases/latest
Файл: Git-X.XX.X-64-bit.tar.bz2 (~50 МБ)

---

### 📦 АРХИВ 7 — WinPE (Windows в оперативной памяти)
Назначение: минимальный Windows который грузится с флешки
Скачать через Windows ADK:
  https://learn.microsoft.com/ru-ru/windows-hardware/get-started/adk-install
Инструмент: winpe-amd64.zip (создаётся локально через ADK)
Размер: ~500 МБ

---

### 📦 АРХИВ 8 — NSSM (служба автозапуска)
Назначение: запускает ECSU OS как системную службу Windows
Скачать: https://nssm.cc/download
Файл: nssm-2.24.zip (~300 КБ)
Как использовать:
  nssm install "ECSU OS" "путь\к\electron.exe" "путь\к\main.js"
  nssm start "ECSU OS"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ПЛАН СБОРКИ — загрузочная флешка с ECSU OS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ВАРИАНТ А — Windows-киоск (проще, 1-2 дня):
  [Флешка] → WinPE → автозапуск Electron → ECSU OS на весь экран

ВАРИАНТ Б — Linux-киоск (сложнее, неделя):
  [Флешка] → Puppy Linux → автозапуск Chromium --kiosk → ECSU OS

ВАРИАНТ В — Ventoy мультизагрузка (гибкий):
  [Флешка Ventoy] → выбор: Windows / Linux / ECSU OS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ЧТО СКАЧИВАТЬ ПРЯМО СЕЙЧАС (минимум):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Ventoy    → https://github.com/ventoy/Ventoy/releases/latest
2. Node.js   → https://nodejs.org/en/download
3. Git       → https://git-scm.com/download/win
4. NSSM      → https://nssm.cc/download
   (итого ~100 МБ — всё что нужно для установки на ПК)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## СТРУКТУРА ПАПКИ ECSU_OS на флешке:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ECSU_OS/
├── electron/          ← код этого проекта (папка electron/)
│   ├── main.js
│   ├── preload.js
│   ├── package.json
│   └── setup.iss
├── node_modules/      ← после npm install
├── tools/
│   ├── node/          ← распакованный Node.js portable
│   ├── nssm/          ← nssm.exe
│   └── ventoy/        ← ventoy инструмент
├── INSTALL.bat        ← скрипт установки одним кликом
└── START.bat          ← ручной запуск

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
