# SR-01 - Disposable PostgreSQL 18 rehearsal wrapper (Gate 3+)
# Delegates to scripts/sr01-disposable-rehearsal.ts (timeout-wrapped PG commands)
#
# Usage:
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/sr01-disposable-rehearsal.ps1

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
Set-Location -LiteralPath $RepoRoot

$PgBin = "C:\Program Files\PostgreSQL\18\bin"
if (Test-Path -LiteralPath $PgBin) {
  $env:Path = "$PgBin;$env:Path"
}

# Pre-flight: refuse if localhost:5432 would be touched (read-only check)
$prodListen = Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue
if ($prodListen) {
  Write-Host "[SR-01] pre-flight: localhost:5432 is in use (production/local PG) - will NOT touch it" -ForegroundColor DarkGray
}

# Pre-flight: warn if disposable port still occupied
foreach ($p in 55432..55439) {
  $occ = Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort $p -State Listen -ErrorAction SilentlyContinue
  if ($occ) {
    Write-Host "[SR-01] pre-flight: port $p in use (pid $($occ.OwningProcess)) - TS runner will pick next free port" -ForegroundColor Yellow
    break
  }
}

Write-Host "[SR-01] step 0: launching disposable rehearsal harness (timeouts enabled)" -ForegroundColor Cyan
& npx tsx scripts/sr01-disposable-rehearsal.ts
exit $LASTEXITCODE
