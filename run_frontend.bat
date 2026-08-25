@echo off
title Billa ai - Frontend Web (Port 5180)
cd /d "G:\Ai\frontend"

echo ===================================================
echo 🐱 Starting Billa ai Frontend Web UI (Port 5180)...
echo ===================================================

if not exist "node_modules" (
    echo [INFO] Installing frontend packages...
    call npm.cmd install
)

echo [INFO] Launching Vite dev server on http://localhost:5180 ...
call npm.cmd run dev
pause
