@echo off
title StartIn Frontend (React + Vite)
echo ========================================================
echo       Iniciando Frontend StartIn (Porta 3000)
echo ========================================================
cd /d %~dp0
set NODE_ENV=development
npm run dev
pause
