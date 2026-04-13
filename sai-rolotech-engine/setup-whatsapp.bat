@echo off
title SAI Rolotech Engine - WhatsApp Setup
color 0A
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║  SAI ROLO TECH - WhatsApp Configuration                   ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

echo Checking OpenClaw status...
openclaw status --short 2>nul
if errorlevel 1 (
    echo ⚠️  OpenClaw not installed or not in PATH
    echo.
    echo Please install OpenClaw first:
    echo npm install -g openclaw
    pause
    exit /b 1
)

echo.
echo Starting WhatsApp configuration...
echo.

openclaw configure --section channels 2>nul

echo.
echo ════════════════════════════════════════════════════════════
echo WhatsApp Configuration Complete!
echo ════════════════════════════════════════════════════════════
echo.
echo Next steps:
echo 1. Scan QR code with WhatsApp
echo 2. Link your phone
echo.
echo For help: openclaw configure --section channels --help
echo.

pause