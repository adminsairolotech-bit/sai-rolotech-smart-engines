@echo off
REM SAI Rolotech Engine - Start Script (Windows)

echo ====================================
echo SAI Rolotech Engine - Starting
echo ====================================
echo.

REM Load .env file
if exist .env (
    for /f "usebackq tokens=1,* delims==" %%a in (`findstr /v "^#" .env`) do (
        set "%%a=%%b"
    )
)

REM Check for required API key
if "%ANTHROPIC_API_KEY%"=="" if "%CLAUDE_API_KEY%"=="" (
    echo [WARNING] No API key found in .env
    echo    Add ANTHROPIC_API_KEY or CLAUDE_API_KEY to .env
    echo.
)

echo Starting engine...
echo.
npm run dev

pause
