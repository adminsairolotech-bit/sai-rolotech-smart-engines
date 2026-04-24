@echo off
chcp 65001 >nul
title SAI ROLOTECH SMART ENGINES - HEAVY 3D MODE

echo.
echo #####################################################################
echo #                                                                   #
echo #     SAI ROLOTECH SMART ENGINES v2.3.0                           #
echo #     HEAVY 3D ACCELERATED MODE                                    #
echo #                                                                   #
echo #####################################################################
echo.

REM ============================================================
REM HARDWARE DETECTION
REM ============================================================

echo [1/5] Detecting hardware...

REM Check for NVIDIA GPU
nvidia-smi --query-gpu=name --format=csv,noheader >nul 2>&1
if %errorlevel%==0 (
    set GPU_TYPE=NVIDIA
    for /f "delims=" %%i in ('nvidia-smi --query-gpu=name --format=csv,noheader') do set GPU_NAME=%%i
    echo      GPU: %GPU_NAME%
    nvidia-smi --query-gpu=memory.total --format=csv,noheader > temp_gpu_mem.txt
    set /p GPU_MEM=<temp_gpu_mem.txt
    del temp_gpu_mem.txt
    echo      VRAM: %GPU_MEM%
) else (
    echo      GPU: Using integrated/default graphics
    set GPU_TYPE=OTHER
)

REM Check RAM
wmic OS get TotalVisibleMemorySize /Value | find "TotalVisibleMemorySize" > temp_ram.txt
set /p RAM_TOTAL=<temp_ram.txt
del temp_ram.txt
set RAM_TOTAL=%RAM_TOTAL:TotalVisibleMemorySize=%
set /a RAM_GB=%RAM_TOTAL:~0,-3% / 1024
echo      RAM: %RAM_GB% GB

echo.
echo [2/5] Setting power mode to HIGH PERFORMANCE...

REM Set High Performance Power Plan
powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8f635c 2>nul
if %errorlevel% neq 0 (
    powercfg /setactive SCHEME_MIN 2>nul
)

echo      Power mode: HIGH PERFORMANCE

echo.
echo [3/5] Optimizing GPU settings...

REM NVIDIA-specific optimizations
if "%GPU_TYPE%"=="NVIDIA" (
    nvidia-smi -pm 1 >nul 2>&1
    nvidia-smi -pl 350 >nul 2>&1
    nvidia-smi --auto-boost-default=0 >nul 2>&1
    echo      NVIDIA GPU: Performance mode enabled
)

REM Disable Windows Game Mode
reg add "HKCU\Software\Microsoft\GameBar" /v "AllowGameDVR" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKCU\Software\Microsoft\GameBar" /v "GameBarPresenceManager" /t REG_DWORD /d 0 /f >nul 2>&1

REM Hardware-accelerated GPU scheduling
reg add "HKCU\System\GameConfigStore" /v "GameDVR_DXGIHonorRefCounting" /t REG_DWORD /d 0 /f >nul 2>&1

echo      Windows optimizations applied

echo.
echo [4/5] Starting application with MAXIMUM resources...

REM Calculate max memory (leave 4GB for system)
set /a MAX_MEM_MB=%RAM_GB% * 1024 - 4096

REM Change to app directory
cd /d "%~dp0"

REM Set environment variables
set NODE_OPTIONS=--max-old-space-size=%MAX_MEM_MB%
set ELECTRON_ENABLE_GPU=1
set ELECTRON_OZONE_PLATFORM_HINT=auto
set THREEJS_ALLOW_GPU=1

REM Start with heavy mode flag
set HEAVY_3D_MODE=true

echo      Memory allocated: %MAX_MEM_MB% MB
echo      GPU acceleration: ENABLED
echo      3D Quality: ULTRA

echo.
echo #####################################################################
echo #                                                                   #
echo #     Starting SAI ROLOTECH SMART ENGINES...                       #
echo #     Press any key to exit                                         #
echo #                                                                   #
echo #####################################################################
echo.

REM Check if npm is available and start dev server
if exist "package.json" (
    echo Starting development server...
    start "SAI ROLOTECH" cmd /c "pnpm run dev"
) else (
    if exist "..\package.json" (
        cd /d ".."
        echo Starting development server...
        start "SAI ROLOTECH" cmd /c "pnpm run dev"
    ) else (
        echo ERROR: package.json not found!
        echo Make sure you are running this from the project directory.
        pause
        exit /b 1
    )
)

REM Wait for user input to close
pause >nul

REM Cleanup on exit
echo.
echo Closing SAI ROLOTECH...
echo.
exit
