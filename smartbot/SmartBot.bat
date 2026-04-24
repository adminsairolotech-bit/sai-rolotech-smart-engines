@echo off
title SmartBot
cd /d "%~dp0"
echo.
echo  🤖 SmartBot Starting...
echo.
set TELEGRAM_BOT_TOKEN=8765827047:AAF_OTLw9ZZC_pJrCS9zbrxLbw4QiLTZ4_E
set ANTHROPIC_API_KEY=sk-ant-api03-c4bd8b15094be41751f0233d278a229984f445b0dbe4d65a6cfdab8aa8302586-IY1bD3xT2vC6Qv7hK9jL2mN4pR8sU5wX3zA
node smartbot.mjs
pause