$ErrorActionPreference = "Stop"

Write-Host "=== Scanning AI rules files for hidden Unicode ==="

$files = @()
if (Test-Path ".cursorrules") { $files += ".cursorrules" }
if (Test-Path ".cursor/rules") {
  $files += Get-ChildItem -Path ".cursor/rules" -Recurse -File -Filter "*.mdc" | ForEach-Object { $_.FullName }
}

if ($files.Count -eq 0) {
  Write-Host "No rules files found. PASS."
  exit 0
}

# Common invisible characters used in payloads
$pattern = "[\uFEFF\u200B\u200C\u200D\u2060\u200E\u200F\u202A-\u202E]"

$failed = $false
foreach ($f in $files) {
  $content = Get-Content -Path $f -Raw
  if ($content -match $pattern) {
    Write-Host "FAIL: hidden Unicode detected in $f"
    $failed = $true
  } else {
    Write-Host "PASS: $f"
  }
}

if ($failed) {
  Write-Host "Hidden Unicode found. Please remove and re-run."
  exit 1
}

Write-Host "All rules files clean."
exit 0

