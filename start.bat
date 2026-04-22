@echo off
SETLOCAL EnableDelayedExpansion

echo ==========================================
echo    AFE - Autonomous Finance Engine
echo ==========================================
echo.

:: Check for pnpm
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] pnpm is not installed. Please install it first.
    pause
    exit /b
)

:: Start Backend Engine
echo [1/2] Starting Python Engine on port 8000...
start "AFE Engine" cmd /k "cd services\engine && .venv\Scripts\activate && uvicorn src.main:app --reload --port 8000"

:: Start Frontend Web
echo [2/2] Starting Next.js Web on port 3000...
start "AFE Web" cmd /k "pnpm dev"

echo.
echo ==========================================
echo    AFE is booting up!
echo.
echo    - Engine: http://localhost:8000/docs
echo    - Web UI: http://localhost:3000
echo ==========================================
echo.
pause
