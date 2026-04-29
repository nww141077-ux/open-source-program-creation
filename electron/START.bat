@echo off
chcp 65001 >nul
title ECSU OS v2.0
cd /d "%~dp0"
start "" node_modules\.bin\electron.cmd main.js
