@echo off
title SAI Rolotech - Creating Desktop Shortcuts
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║  SAI ROLO TECH - Desktop Shortcuts Creator              ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

:: Get Desktop path
set DESKTOP=%USERPROFILE%\Desktop

echo Creating Desktop Shortcuts...
echo.

:: 1. Dashboard Shortcut (URL)
echo Creating: SAI Rolotech Dashboard...
set DASHBOARD=%DESKTOP%\SAI Rolotech Dashboard.url
(
echo [InternetShortcut]
echo URL=http://localhost:18789
echo IconFile=shell32.dll,21
) > "%DASHBOARD%"

:: 2. Engine Terminal Shortcut
echo Creating: SAI Rolotech Terminal...
set TERMINAL=%DESKTOP%\SAI Rolotech Terminal.lnk
powershell -Command "$s=New-Object -ComObject WScript.Shell; $l=$s.CreateShortcut('%TERMINAL%'); $l.TargetPath='cmd.exe'; $l.Arguments='/k cd \"%CD%\" ^&^& npx tsx cmd.js'; $l.Description='SAI Rolotech Terminal'; $l.Save()"

:: 3. Dashboard Server Shortcut
echo Creating: SAI Rolotech Server...
set SERVER=%DESKTOP%\SAI Rolotech Server.lnk
powershell -Command "$s=New-Object -ComObject WScript.Shell; $l=$s.CreateShortcut('%SERVER%'); $l.TargetPath='cmd.exe'; $l.Arguments='/k npx serve . -p 3333'; $l.Description='SAI Rolotech Server'; $l.WorkingDirectory='%CD%'; $l.Save()"

:: 4. WhatsApp Setup Shortcut
echo Creating: SAI Rolotech WhatsApp...
set WHATSAPP=%DESKTOP%\SAI Rolotech WhatsApp.lnk
powershell -Command "$s=New-Object -ComObject WScript.Shell; $l=$s.CreateShortcut('%WHATSAPP%'); $l.TargetPath='cmd.exe'; $l.Arguments='/k setup-whatsapp.bat'; $l.Description='SAI Rolotech WhatsApp Setup'; $l.WorkingDirectory='%CD%'; $l.Save()"

:: 5. OpenClaw Gateway Shortcut
echo Creating: OpenClaw Gateway...
set GATEWAY=%DESKTOP%\OpenClaw Gateway.lnk
powershell -Command "$s=New-Object -ComObject WScript.Shell; $l=$s.CreateShortcut('%GATEWAY%'); $l.TargetPath='cmd.exe'; $l.Arguments='/k openclaw gateway'; $l.Description='OpenClaw Gateway'; $l.Save()"

:: 6. Engine Folder Shortcut
echo Creating: SAI Rolotech Engine Folder...
set FOLDER=%DESKTOP%\SAI Rolotech Engine.lnk
powershell -Command "$s=New-Object -ComObject WScript.Shell; $l=$s.CreateShortcut('%FOLDER%'); $l.TargetPath='explorer.exe'; $l.Arguments='.'; $l.Description='Open SAI Rolotech Engine Folder'; $l.WorkingDirectory='%CD%'; $l.Save()"

echo.
echo ════════════════════════════════════════════════════════════
echo ✅ All Shortcuts Created!
echo ════════════════════════════════════════════════════════════
echo.
echo Shortcuts on Desktop:
echo   📌 SAI Rolotech Dashboard     - Opens web dashboard
echo   💻 SAI Rolotech Terminal      - Opens command terminal
echo   🌐 SAI Rolotech Server        - Starts local web server
echo   📱 SAI Rolotech WhatsApp      - WhatsApp setup
echo   🦞 OpenClaw Gateway           - Starts OpenClaw gateway
echo   📁 SAI Rolotech Engine        - Opens engine folder
echo.
echo Note: Start OpenClaw Gateway first before using other tools!
echo.

pause
