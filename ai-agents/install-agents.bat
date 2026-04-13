@echo off
title SAI Rolotech - AI Agents Launcher
color 0A

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║  SAI ROLO TECH - AI AGENTS LAUNCHER                   ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

set AGENTS_DIR=%~dp0ai-agents

echo Select an AI Agent to install:
echo.
echo   [1] Goose Agent (41k stars) - Extensible AI agent
echo   [2] AgenticSeek (25k stars) - Fully Local, No API bills
echo   [3] Roo Code - AI coding in VS Code
echo   [4] LibreChat (35k stars) - Enhanced ChatGPT Clone
echo   [5] Open GitHub AI Agents page
echo   [6] Install ALL agents
echo   [0] Exit
echo.

set /p choice="Enter choice (0-6): "

if "%choice%"=="1" goto GOOSE
if "%choice%"=="2" goto AGENTICSEEK
if "%choice%"=="3" goto ROOCODE
if "%choice%"=="4" goto LIBRECHAT
if "%choice%"=="5" goto GITHUB
if "%choice%"=="6" goto ALL
if "%choice%"=="0" goto END

:GOOSE
echo.
echo Installing Goose Agent...
git clone https://github.com/aaif-goose/goose.git "%AGENTS_DIR%\goose"
cd "%AGENTS_DIR%\goose"
call npm install
echo.
echo ✅ Goose Agent installed!
echo Run: cd "%AGENTS_DIR%\goose" ^&^& npx goose
pause
goto END

:AGENTICSEEK
echo.
echo Installing AgenticSeek (Fully Local AI)...
git clone https://github.com/Fosowl/agenticSeek.git "%AGENTS_DIR%\agenticseek"
echo.
echo ✅ AgenticSeek cloned!
echo Install Python deps and run manually
pause
goto END

:ROOCODE
echo.
echo Opening VS Code to install Roo Code extension...
start code --install-extension roocode.roo-code
echo.
echo ✅ VS Code opened - Roo Code will install automatically!
pause
goto END

:LIBRECHAT
echo.
echo Installing LibreChat...
git clone https://github.com/badlogic/LibreChat.git "%AGENTS_DIR%\librechat"
cd "%AGENTS_DIR%\librechat"
call npm install
echo.
echo ✅ LibreChat installed!
pause
goto END

:GITHUB
echo.
echo Opening GitHub AI Agents page...
start https://github.com/topics/ai-agent
pause
goto END

:ALL
echo.
echo Cloning all agents...
git clone https://github.com/aaif-goose/goose.git "%AGENTS_DIR%\goose"
git clone https://github.com/Fosowl/agenticSeek.git "%AGENTS_DIR%\agenticseek"
git clone https://github.com/badlogic/LibreChat.git "%AGENTS_DIR%\librechat"
echo.
echo ✅ All agents cloned to: %AGENTS_DIR%
pause
goto END

:END
exit
