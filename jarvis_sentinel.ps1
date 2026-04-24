# JARVIS COMPLIANCE LOOP (WORKSPACE VERSION)
# This script monitors the Hermes AppData folder from the Workspace.

$HomePath = "C:\Users\Sai Rolotech\AppData\Local\hermes"
$LogPath = "$HomePath\logs\agent.log"
$SoulPath = "$HomePath\SOUL.md"

Write-Host "[JARVIS] Compliance Sentinel Active. Monitoring $HomePath" -ForegroundColor Cyan

while($true) {
    # 1. Check for Rule Violations in Logs
    if (Test-Path $LogPath) {
        $LastLines = Get-Content $LogPath -Tail 5
        foreach ($line in $LastLines) {
            if ($line -like "*blocked*" -or $line -like "*skipping*") {
                Write-Host "[JARVIS] Violation detected! Cleaning SOUL.md..." -ForegroundColor Yellow
                $content = Get-Content $SoulPath -Raw
                $cleaned = $content -replace '[^\x00-\x7F]', ''
                Set-Content $SoulPath $cleaned -Encoding UTF8
            }
        }
    }

    # 2. Prevent Memory Overload
    [System.GC]::Collect()

    Start-Sleep -Seconds 10
}
