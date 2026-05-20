@echo off
chcp 65001 >nul
title Установка автозапуска

set SCRIPT_DIR=%~dp0
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT=%STARTUP_DIR%\ECSU-Мусон-Агент.bat

echo Устанавливаю автозапуск агента при входе в Windows...

:: Копируем bat в автозагрузку
(
echo @echo off
echo cd /d "%SCRIPT_DIR%"
echo start /min python agent.py
) > "%SHORTCUT%"

echo.
echo [OK] Агент будет запускаться автоматически при входе в Windows
echo Файл автозапуска: %SHORTCUT%
echo.
pause
