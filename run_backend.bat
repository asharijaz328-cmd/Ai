@echo off
title Billa ai - Backend Server (Port 8080)
cd /d "G:\Ai\backend"

echo ===================================================
echo 🐱 Starting Billa ai Backend Server (Port 8080)...
echo ===================================================

echo [INFO] Freeing port 8080 if in use...
powershell -Command "$conns = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue; if ($conns) { foreach ($c in $conns) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue } }"

if not exist "venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
    call venv\Scripts\activate
    echo [INFO] Installing dependencies...
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate
)

echo [INFO] Starting FastAPI on http://localhost:8080 ...
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
pause
