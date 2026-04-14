@echo off
title SAI Rolotech Engine - Pro Edition
color 0A

echo.
echo ╔═══════════════════════════════════════════════════════════════════════╗
echo ║                                                                       ║
echo ║   ██████╗ ██████╗ ███╗   ███╗███████╗██╗ ██████╗                  ║
echo ║   ██╔════╝██╔═══██╗████╗ ████║██╔════╝██║██╔════╝                  ║
echo ║   ██║     ██║   ██║██╔████╔██║███████╗██║██║  ███╗                 ║
echo ║   ██║     ██║   ██║██║╚██╔╝██║╚════██║██║██║   ██║                 ║
echo ║   ╚██████╗╚██████╔╝██║ ╚═╝ ██║███████║██║╚██████╔╝                 ║
echo ║    ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝╚═╝ ╚═════╝                  ║
echo ║                                                                       ║
echo ║   PROFESSIONAL AI AGENT - ROLL FORMING + AUTOCAD + VIDEO            ║
echo ║                                                                       ║
echo ╚═══════════════════════════════════════════════════════════════════════╝
echo.

echo Starting SAI Rolotech Engine...
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found! Please install from nodejs.org
    pause
    exit /b 1
)

:: Check if OpenClaw is installed
where openclaw >nul 2>&1
if errorlevel 1 (
    echo [INFO] OpenClaw not found. Installing...
    npm install -g openclaw
)

echo.
echo ┌─────────────────────────────────────────────────────────────────────┐
echo │                           OPTIONS                                    │
echo ├─────────────────────────────────────────────────────────────────────┤
echo │                                                                      │
echo │  [1] START EVERYTHING (Dashboard + Gateway)                           │
echo │  [2] Open Dashboard Only                                              │
echo │  [3] Open Terminal (Interactive Chat)                                  │
echo │  [4] Setup WhatsApp                                                   │
echo │  [5] Start OpenClaw Gateway                                           │
echo │  [6] System Status                                                    │
echo │  [7] Quick Start Guide                                                │
echo │  [0] Exit                                                            │
echo │                                                                      │
echo └─────────────────────────────────────────────────────────────────────┘
echo.

set /p choice="Enter your choice (0-7): "

if "%choice%"=="1" goto START_ALL
if "%choice%"=="2" goto DASHBOARD
if "%choice%"=="3" goto TERMINAL
if "%choice%"=="4" goto WHATSAPP
if "%choice%"=="5" goto GATEWAY
if "%choice%"=="6" goto STATUS
if "%choice%"=="7" goto GUIDE
if "%choice%"=="0" goto EXIT

:START_ALL
echo.
echo [1] Starting OpenClaw Gateway in background...
start cmd /k "openclaw gateway"
timeout /t 3 /nobreak >nul
echo [2] Starting Dashboard Server...
start http://localhost:18789
echo.
echo [OK] Everything Started!
echo.
echo Open browser: http://localhost:18789
echo.
pause
goto EXIT

:DASHBOARD
echo.
echo Opening Dashboard...
start http://localhost:18789
goto EXIT

:TERMINAL
echo.
echo Starting Interactive Terminal...
cd /d "%~dp0"
call npx tsx cmd.js
goto EXIT

:WHATSAPP
echo.
echo Opening WhatsApp Setup...
call setup-whatsapp.bat
goto EXIT

:GATEWAY
echo.
echo Starting OpenClaw Gateway...
openclaw gateway
goto EXIT

:STATUS
echo.
echo ==============================
echo           SYSTEM STATUS
echo ==============================
echo.
echo Node.js:
node --version
echo.
echo OpenClaw:
openclaw --version
echo.
echo Memory:
systeminfo | findstr /C:"Total Physical Memory"
echo.
echo Disk Space:
fsutil volume diskfree c:
echo.
pause
goto EXIT

:GUIDE
echo.
echo ================================================================
echo                          QUICK START GUIDE
echo ================================================================
echo.
echo STEP 1: Start Gateway
echo   Command: openclaw gateway
echo   Or use shortcut: OpenClaw Gateway
echo.
echo STEP 2: Open Dashboard
echo   URL: http://localhost:18789
echo   Or use shortcut: SAI Rolotech Dashboard
echo.
echo STEP 3: Chat with AI
echo   - Type your question
echo   - Available: Roll Forming, AutoCAD, Video Editing
echo.
echo STEP 4: Save Sessions
echo   - Sessions auto-saved
echo   - Memory persists across sessions
echo.
echo SPECIAL COMMANDS:
echo   cad <task>     - AutoCAD help with LISP examples
echo   edit <task>    - Video editing with Filmora techniques
echo   code <task>    - Programming help
echo   ask <question> - Ask anything
echo.
echo ================================================================
echo.
pause
goto EXIT

:EXIT
exit
