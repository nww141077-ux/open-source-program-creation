@echo off
chcp 65001 >nul
title ECSU Мусон-Агент
echo ============================================
echo   ECSU Мусон-Агент — установка и запуск
echo ============================================
echo.

:: Проверяем Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ОШИБКА] Python не установлен!
    echo Скачай с https://python.org и установи
    pause
    exit /b 1
)

:: Устанавливаем зависимости
echo [1/2] Устанавливаю зависимости...
pip install flask flask-cors requests psutil watchdog --quiet

:: Создаём папку Мусон если нет
if not exist "D:\Мусон" (
    echo [INFO] Создаю папку D:\Мусон...
    mkdir "D:\Мусон"
)

:: Запускаем агент
echo [2/2] Запускаю агент...
echo.
echo Агент работает на http://localhost:7749
echo Закрой это окно чтобы остановить агент
echo.
python agent.py

pause
