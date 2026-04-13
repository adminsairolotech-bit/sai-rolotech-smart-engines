@echo off
REM SAI Rolotech Engine - Windows Install Script

echo ====================================
echo SAI Rolotech Engine - Installation
echo ====================================
echo.

REM Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

REM Check npm
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm not found
    pause
    exit /b 1
)

echo [1/3] Installing dependencies...
npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm install failed
    pause
    exit /b 1
)

echo [2/3] Creating configuration...
if not exist .env (
    copy .env.example .env
    echo [OK] Created .env file
)

echo [3/3] Creating data folders...
if not exist "data" mkdir data
if not exist "data\memory" mkdir "data\memory"
if not exist "data\whatsapp" mkdir "data\whatsapp"
if not exist "temp" mkdir temp

echo.
echo ====================================
echo INSTALLATION COMPLETE!
echo ====================================
echo.
echo NEXT STEPS:
echo 1. Edit .env and add your API keys
echo 2. Run: npm run dev
echo.
pause
