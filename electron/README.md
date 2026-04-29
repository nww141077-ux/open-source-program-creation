# ECSU OS v2.0 — Установка на ПК

## Требования
- Node.js 18+ (https://nodejs.org)
- Windows 10/11, macOS 12+, Ubuntu 20+

## Шаги установки

### 1. Скачай код проекта
Opublikovat → Скачать → Скачать код (ZIP)

### 2. Распакуй и перейди в папку electron/
```
cd electron
npm install
```

### 3. Запуск (без сборки)
```
npm start
```

### 4. Сборка установщика для Windows (.exe)
```
npm run build-win
```
Готовый файл появится в `electron/dist/ECSU OS Setup.exe`

### 5. Сборка для macOS (.dmg)
```
npm run build-mac
```

### 6. Сборка для Linux (.AppImage)
```
npm run build-linux
```

## Горячие клавиши
- F11 — Полный экран
- Ctrl+R — Обновить
- Ctrl+Home — ECSU OS главный
- Ctrl+1..5 — Быстрый переход по модулям

## Системный трей
После запуска иконка появится в трее Windows. 
Двойной клик — открыть окно. Правый клик — меню.
