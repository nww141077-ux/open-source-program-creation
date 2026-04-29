@echo off
chcp 65001 >nul
title ECSU OS v2.0 — Установка
color 0A

echo.
echo  ████████╗ ██████╗███████╗██╗   ██╗     ██████╗ ███████╗
echo  ██╔════╝██╔════╝██╔════╝██║   ██║    ██╔═══██╗██╔════╝
echo  █████╗  ██║     ███████╗██║   ██║    ██║   ██║███████╗
echo  ██╔══╝  ██║     ╚════██║██║   ██║    ██║   ██║╚════██║
echo  ███████╗╚██████╗███████║╚██████╔╝    ╚██████╔╝███████║
echo  ╚══════╝ ╚═════╝╚══════╝ ╚═════╝      ╚═════╝ ╚══════╝
echo.
echo  ECSU OS v2.0 — Установщик | Николаев В.В.
echo  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

:: Проверка Node.js
echo [1/4] Проверка Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ✗ Node.js не найден!
    echo  Скачай с https://nodejs.org и установи, затем запусти снова.
    pause
    exit /b 1
)
echo  ✓ Node.js найден

:: Установка зависимостей
echo.
echo [2/4] Установка зависимостей Electron...
cd /d "%~dp0"
call npm install --silent
if %errorlevel% neq 0 (
    echo  ✗ Ошибка установки зависимостей!
    pause
    exit /b 1
)
echo  ✓ Зависимости установлены

:: Создание ярлыка автозапуска в реестре
echo.
echo [3/4] Настройка автозапуска при старте Windows...
set "APP_PATH=%~dp0"
set "ELECTRON_EXE=%~dp0node_modules\.bin\electron.cmd"
set "MAIN_JS=%~dp0main.js"

reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" ^
    /v "ECSU OS" ^
    /t REG_SZ ^
    /d "\"%ELECTRON_EXE%\" \"%MAIN_JS%\" --autostart" ^
    /f >nul 2>&1

if %errorlevel% equ 0 (
    echo  ✓ Автозапуск настроен
) else (
    echo  ! Автозапуск настроится при первом запуске приложения
)

:: Создание ярлыка на рабочем столе
echo.
echo [4/4] Создание ярлыка на рабочем столе...
set "SHORTCUT=%USERPROFILE%\Desktop\ECSU OS.lnk"
set "ELECTRON=%~dp0node_modules\.bin\electron.cmd"

powershell -Command ^
    "$WS = New-Object -ComObject WScript.Shell; " ^
    "$S = $WS.CreateShortcut('%SHORTCUT%'); " ^
    "$S.TargetPath = '%ELECTRON%'; " ^
    "$S.Arguments = '%MAIN_JS%'; " ^
    "$S.WorkingDirectory = '%APP_PATH%'; " ^
    "$S.Description = 'ECSU OS v2.0'; " ^
    "$S.Save()" >nul 2>&1

echo  ✓ Ярлык создан на рабочем столе

:: Готово
echo.
echo  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo  ✓ ECSU OS v2.0 успешно установлена!
echo.
echo  Запуск сейчас? (Y/N)
echo  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
set /p LAUNCH="> "
if /i "%LAUNCH%"=="Y" (
    echo  Запускаю ECSU OS...
    start "" "%ELECTRON_EXE%" "%MAIN_JS%"
)
echo.
echo  Готово. Нажми любую клавишу для выхода.
pause >nul
