# Mission 08.2.1 - Secure interactive Production database backup launcher
# - Prompts for DATABASE_URL (masked); never prints or persists the value
# - Never writes credentials to history, temp files, .env, code, Git, logs, manifest, or ZIP
# - Passes DATABASE_URL only to the child process environment for the dump run

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

# Resolve project root (parent of scripts/)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
Set-Location -LiteralPath $RepoRoot

$PgDumpDir = "C:\Program Files\PostgreSQL\18\bin"
$PgDumpExe = Join-Path $PgDumpDir "pg_dump.exe"
if (-not (Test-Path -LiteralPath $PgDumpExe)) {
  Write-Host "ERROR: pg_dump not found at: $PgDumpExe" -ForegroundColor Red
  Write-Host "Install PostgreSQL 18 client tools, or update this launcher path." -ForegroundColor Red
  exit 1
}

# Prepend PostgreSQL 18 bin for this process and children
$env:Path = "$PgDumpDir;$env:Path"

$dbUrlPlain = $null
$exitCode = 1

try {
  Write-Host ""
  Write-Host "SODA OS - Secure Production Database Backup" -ForegroundColor Cyan
  Write-Host "Credentials are never displayed, logged, or written to disk by this launcher." -ForegroundColor DarkGray
  Write-Host ""

  # Detect non-interactive / redirected stdin (Cursor agent shells, pipes, etc.)
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
    Write-Host "Founder must run the secure command in a local interactive terminal." -ForegroundColor Red
    Write-Host "  npm run backup:database:secure" -ForegroundColor Yellow
    exit 2
  }

  Write-Host -NoNewline "Paste Production DATABASE_URL: "
  $secureUrl = Read-Host -AsSecureString
  if ($null -eq $secureUrl -or $secureUrl.Length -eq 0) {
    Write-Host "ERROR: DATABASE_URL was empty." -ForegroundColor Red
    exit 1
  }

  $dbUrlPlain = ConvertFrom-SecureStringPlain -Secure $secureUrl
  # Trim CR/LF/whitespace; never echo the value
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

  # Use -match (regex) so brackets are literal; -like treats [] as a character class
  if ($dbUrlPlain -match '\[YOUR-PASSWORD\]') {
    Write-Host "ERROR: Connection string still contains the literal placeholder [YOUR-PASSWORD]." -ForegroundColor Red
    Write-Host "Replace [YOUR-PASSWORD] with your real database password, then run again." -ForegroundColor Red
    Write-Host "(The URL itself is never displayed.)" -ForegroundColor DarkGray
    exit 1
  }

  # Pass DATABASE_URL only to the child process env - not written anywhere
  $env:DATABASE_URL = $dbUrlPlain

  Write-Host "Running live database backup (pg_dump preferred)..." -ForegroundColor Cyan
  Write-Host "  pg_dump: $PgDumpExe" -ForegroundColor DarkGray
  Write-Host "  cwd:     $RepoRoot" -ForegroundColor DarkGray
  Write-Host ""

  & npm run backup:database
  $exitCode = $LASTEXITCODE
  if ($null -eq $exitCode) { $exitCode = 1 }
}
catch {
  Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
  $exitCode = 1
}
finally {
  # Wipe plain string reference and clear sensitive env (success or failure)
  if ($null -ne $dbUrlPlain) {
    $dbUrlPlain = $null
  }
  Clear-SensitiveEnv
}

exit $exitCode
