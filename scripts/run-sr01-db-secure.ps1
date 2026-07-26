# SR-01 — Secure interactive Production database launcher
# - Prompts for DATABASE_URL (masked); never prints or persists the value
# - Never writes credentials to history, temp files, .env, code, Git, logs, or chat
# - Passes DATABASE_URL only to the child process environment for the requested run
#
# Usage (interactive terminal only):
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-sr01-db-secure.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-sr01-db-secure.ps1 -- npx tsx scripts/verify-sr01-rls.ts --live
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-sr01-db-secure.ps1 -- psql $env:DATABASE_URL -c "SELECT 1"

$ErrorActionPreference = "Stop"

function Clear-SensitiveEnv {
  foreach ($name in @(
      "DATABASE_URL",
      "SUPABASE_DB_URL",
      "DIRECT_URL",
      "POSTGRES_URL",
      "SUPABASE_DB_PASSWORD",
      "POSTGRES_PASSWORD"
    )) {
    Remove-Item -LiteralPath "Env:$name" -ErrorAction SilentlyContinue
  }
}

function ConvertFrom-SecureStringPlain {
  param([Parameter(Mandatory = $true)][SecureString]$Secure)
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  }
  finally {
    if ($bstr -ne [IntPtr]::Zero) {
      [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
  }
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
Set-Location -LiteralPath $RepoRoot

$PgBinDir = "C:\Program Files\PostgreSQL\18\bin"
if (Test-Path -LiteralPath $PgBinDir) {
  $env:Path = "$PgBinDir;$env:Path"
}

$dbUrlPlain = $null
$exitCode = 1

# Default child: SR-01 live verification harness
$childArgs = @("npx", "tsx", "scripts/verify-sr01-rls.ts", "--live")
$dashIdx = [Array]::IndexOf($args, "--")
if ($dashIdx -ge 0 -and $dashIdx -lt ($args.Count - 1)) {
  $childArgs = $args[($dashIdx + 1)..($args.Count - 1)]
}

try {
  Write-Host ""
  Write-Host "SODA OS - SR-01 Secure Database Launcher" -ForegroundColor Cyan
  Write-Host "Credentials are never displayed, logged, or written to disk by this launcher." -ForegroundColor DarkGray
  Write-Host ""

  $inputRedirected = $false
  try {
    $inputRedirected = [Console]::IsInputRedirected
  } catch {
    $inputRedirected = $false
  }
  if (-not $inputRedirected) {
    try {
      if ($null -eq [Console]::In) { $inputRedirected = $true }
    } catch {
      $inputRedirected = $true
    }
  }
  if ($inputRedirected) {
    Write-Host "ERROR: Non-interactive shell detected (stdin redirected)." -ForegroundColor Red
    Write-Host "Founder must run this command in a local interactive terminal:" -ForegroundColor Red
    Write-Host "  powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-sr01-db-secure.ps1" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or add DATABASE_URL (or SUPABASE_DB_PASSWORD) to .env.local, then re-run SR-01 resume." -ForegroundColor Yellow
    exit 2
  }

  Write-Host -NoNewline "Paste Production DATABASE_URL: "
  $secureUrl = Read-Host -AsSecureString
  if ($null -eq $secureUrl -or $secureUrl.Length -eq 0) {
    Write-Host "ERROR: DATABASE_URL was empty." -ForegroundColor Red
    exit 1
  }

  $dbUrlPlain = ConvertFrom-SecureStringPlain -Secure $secureUrl
  $dbUrlPlain = $dbUrlPlain.Trim().Trim("`r", "`n")

  if (
    -not (
      $dbUrlPlain.StartsWith("postgresql://", [StringComparison]::OrdinalIgnoreCase) -or
      $dbUrlPlain.StartsWith("postgres://", [StringComparison]::OrdinalIgnoreCase)
    )
  ) {
    Write-Host "ERROR: DATABASE_URL must start with postgresql:// or postgres://" -ForegroundColor Red
    exit 1
  }

  if ($dbUrlPlain -match '\[YOUR-PASSWORD\]') {
    Write-Host "ERROR: Connection string still contains the literal placeholder [YOUR-PASSWORD]." -ForegroundColor Red
    exit 1
  }

  $env:DATABASE_URL = $dbUrlPlain

  Write-Host "Running SR-01 database command (credentials in-memory only)..." -ForegroundColor Cyan
  Write-Host "  cwd: $RepoRoot" -ForegroundColor DarkGray
  Write-Host "  cmd: $($childArgs -join ' ')" -ForegroundColor DarkGray
  Write-Host ""

  if ($childArgs.Count -eq 1) {
    & $childArgs[0]
  } else {
    & $childArgs[0] @($childArgs[1..($childArgs.Count - 1)])
  }
  $exitCode = $LASTEXITCODE
  if ($null -eq $exitCode) { $exitCode = 1 }
}
catch {
  Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
  $exitCode = 1
}
finally {
  if ($null -ne $dbUrlPlain) {
    $dbUrlPlain = $null
  }
  Clear-SensitiveEnv
}

exit $exitCode
