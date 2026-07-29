# SODA OS - Secure end-to-end Production release runner
# Founder command: npm run release:production:secure
#
# - Prompts once for Production DATABASE_URL (masked); never persists credentials
# - Stops on any phase failure and reports the failed phase
# - Does NOT use .env.local for release DB operations

$ErrorActionPreference = "Stop"

$ExpectedBranch = "global-role-home-preview"
$ProductionUrl = "https://soda-os.vercel.app"

$BackupZip = "D:\SODA OS\Database\SODA_Database_2026-07-28_080153.zip"
$BackupManifest = "D:\SODA OS\Database\SODA_Database_2026-07-28_080153.manifest.json"
$BackupDigest = "sha256:14e2c564514407255b3d128f790354fc571f3f477cac518ceeaf1ef9a299f592"

$FailedPhase = $null
$MergeCommit = $null
$DeployId = $null
$DocCommit = $null
$Migration034Applied = "skipped"
$Migration033Applied = "not applied"
$MigrationHistoryStatus = "not checked"
$RlsResult = "not run"
$FinalStatus = "BLOCKED"

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

function Test-InputRedirected {
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
  return $inputRedirected
}

function Invoke-Npm {
  param(
    [string[]]$NpmArgs,
    [string]$Label
  )
  Write-Host "  > npm $($NpmArgs -join ' ')" -ForegroundColor DarkGray
  & npm @NpmArgs
  $code = $LASTEXITCODE
  if ($null -eq $code) { $code = 1 }
  if ($code -ne 0) {
    throw "$Label failed (exit $code)"
  }
}

function Invoke-Tsx {
  param(
    [string[]]$ScriptArgs,
    [string]$Label,
    [int[]]$AllowedExitCodes = @(0)
  )
  $all = @("tsx") + $ScriptArgs
  Write-Host "  > npx $($all -join ' ')" -ForegroundColor DarkGray
  & npx @all
  $code = $LASTEXITCODE
  if ($null -eq $code) { $code = 1 }
  if ($AllowedExitCodes -notcontains $code) {
    throw "$Label failed (exit $code)"
  }
  return $code
}

function Run-Phase0-Baseline {
  Write-Host ""
  Write-Host "=== Phase 0: Baseline ===" -ForegroundColor Cyan

  & git fetch origin
  if ($LASTEXITCODE -ne 0) { throw "git fetch origin failed" }

  $branch = (& git branch --show-current).Trim()
  $head = (& git rev-parse HEAD).Trim()
  $originPreview = (& git rev-parse "origin/$ExpectedBranch").Trim()
  $originMain = (& git rev-parse origin/main).Trim()

  Write-Host "  branch:          $branch"
  Write-Host "  HEAD:            $head"
  Write-Host "  origin/$ExpectedBranch`: $originPreview"
  Write-Host "  origin/main:     $originMain"

  if ($branch -ne $ExpectedBranch) {
    throw "expected branch $ExpectedBranch, got $branch"
  }
  if ($head -ne $originPreview) {
    throw "HEAD must match origin/$ExpectedBranch ($originPreview) - run git pull"
  }

  $stateScript = Get-Content -LiteralPath "scripts/verify-live-migration-state.ts" -Raw -Encoding UTF8
  if ($stateScript -notmatch "migrationHistoryAvailable") {
    throw "release runner fix missing - pull latest $ExpectedBranch"
  }

  Write-Host "PASS  baseline confirmed (unrelated working-tree files preserved)" -ForegroundColor Green
}

function Run-Phase1-BackupVerify {
  Write-Host ""
  Write-Host "=== Phase 1: Backup verification ===" -ForegroundColor Cyan

  Invoke-Tsx -ScriptArgs @(
    "scripts/verify-database-backup-package.ts",
    "--zip", $BackupZip,
    "--manifest", $BackupManifest,
    "--digest", $BackupDigest,
    "--mode", "pg_dump",
    "--min-tables", "84"
  ) -Label "backup verification"

  Write-Host "PASS  existing backup verified (no new backup created)" -ForegroundColor Green
}

function Prompt-DatabaseUrl {
  if (Test-InputRedirected) {
    Write-Host "ERROR: Non-interactive shell - DATABASE_URL prompt unavailable." -ForegroundColor Red
    Write-Host 'Founder must run locally: npm run release:production:secure' -ForegroundColor Yellow
    throw "non-interactive shell"
  }

  Write-Host ""
  Write-Host 'Paste Production DATABASE_URL (masked input; never logged):' -ForegroundColor Cyan
  $secureUrl = Read-Host -AsSecureString
  if ($null -eq $secureUrl -or $secureUrl.Length -eq 0) {
    throw "DATABASE_URL was empty"
  }

  $plain = ConvertFrom-SecureStringPlain -Secure $secureUrl
  $plain = $plain.Trim().Trim("`r", "`n")

  if (
    -not (
      $plain.StartsWith("postgresql://", [StringComparison]::OrdinalIgnoreCase) -or
      $plain.StartsWith("postgres://", [StringComparison]::OrdinalIgnoreCase)
    )
  ) {
    throw "DATABASE_URL must start with postgresql:// or postgres://"
  }
  if ($plain -match '\[YOUR-PASSWORD\]') {
    throw "DATABASE_URL contains placeholder [YOUR-PASSWORD]"
  }

  return $plain
}

function Run-Phase2-MigrationReconciliation {
  param([string]$DbUrlPlain)

  Write-Host ""
  Write-Host "=== Phase 2: Live migration reconciliation ===" -ForegroundColor Cyan

  $env:DATABASE_URL = $DbUrlPlain

  $stateOutput = & npx tsx scripts/verify-live-migration-state.ts 2>&1
  $stateCode = $LASTEXITCODE
  if ($null -eq $stateCode) { $stateCode = 1 }
  $stateOutput | ForEach-Object { Write-Host $_ }

  if ($stateCode -notin @(0, 10, 11)) {
    throw "live migration state failed (exit $stateCode)"
  }

  if ($stateOutput -match "MIGRATION HISTORY TABLE ABSENT") {
    $script:MigrationHistoryStatus = "WARNING - history table absent (catalog used)"
    Write-Host "  WARNING  migration history absent - continuing via PostgreSQL catalog" -ForegroundColor Yellow
    Write-Host "  NOTE  MIGRATION HISTORY TRACKING NOT INITIALIZED - FOLLOW-UP REQUIRED" -ForegroundColor Yellow
  } elseif ($stateOutput -match "migrationHistoryAvailable: false") {
    $script:MigrationHistoryStatus = "WARNING - history unavailable (catalog used)"
    Write-Host "  WARNING  migration history unavailable - catalog verification used" -ForegroundColor Yellow
  } else {
    $script:MigrationHistoryStatus = "available"
  }

  if ($stateCode -eq 11) {
    $script:Migration033Applied = "PRESENT IN CATALOG (fatal)"
    throw "000033 Personal Brain foundation present on Production - aborting"
  }

  $script:Migration033Applied = "not present (catalog verified)"

  if ($stateCode -eq 10) {
    Write-Host "  Applying migration 000034 only (transaction-safe)..." -ForegroundColor Yellow
    Invoke-Tsx -ScriptArgs @("scripts/apply-founder-only-rls-secure.ts") -Label "apply 000034"
    $script:Migration034Applied = "applied this run"
  } else {
    $script:Migration034Applied = "skipped (catalog policies match)"
  }

  try {
    Invoke-Tsx -ScriptArgs @("scripts/verify-founder-only-rls-live.ts") -Label "founder-only RLS live probes"
    $script:RlsResult = "PASS"
  }
  catch {
    Write-Host "  RLS assertions failed - rolling back 000034..." -ForegroundColor Red
    try {
      Invoke-Tsx -ScriptArgs @("scripts/apply-founder-only-rls-secure.ts", "--rollback") -Label "rollback 000034"
    }
    catch {
      Write-Host "  Rollback command failed - manual intervention required." -ForegroundColor Red
    }
    $script:RlsResult = "FAIL (rolled back)"
    throw "RLS assertions failed"
  }

  Write-Host "PASS  migration reconciliation (000033 not applied)" -ForegroundColor Green
}

function Run-Phase3-CodeGates {
  Write-Host ""
  Write-Host "=== Phase 3: Code release gates ===" -ForegroundColor Cyan

  Invoke-Npm -NpmArgs @("run", "typecheck") -Label "typecheck"

  $eslintFiles = @(
    "scripts/run-final-production-release-secure.ps1",
    "scripts/verify-live-migration-state.ts",
    "scripts/apply-founder-only-rls-secure.ts",
    "scripts/verify-founder-only-rls-live.ts",
    "scripts/verify-live-release-state.ts",
    "scripts/verify-database-backup-package.ts",
    "scripts/db-secure-connection.ts",
    "scripts/verify-motion-v3-parity.ts",
    "lib/domain/mutation-auth.ts",
    "components/orders/orders-content.tsx",
    "components/dashboard/role-aware-home-stream.tsx",
    "supabase/migrations/20260728000034_founder_only_update_delete.sql"
  )
  Write-Host "  > eslint (release files)" -ForegroundColor DarkGray
  & npx eslint @eslintFiles
  $eslintCode = $LASTEXITCODE
  if ($null -eq $eslintCode) { $eslintCode = 1 }
  if ($eslintCode -ne 0) { throw "ESLint failed (exit $eslintCode)" }

  Invoke-Tsx -ScriptArgs @("scripts/verify-live-migration-state.ts", "--static") -Label "live migration state (static)"

  $verifyScripts = @(
    "scripts/verify-founder-mutation-lockdown.ts",
    "scripts/verify-personal-brain-migration.ts",
    "scripts/verify-global-role-home.ts",
    "scripts/verify-global-role-home-data.ts",
    "scripts/verify-founder-home-mission.ts",
    "scripts/verify-command-center-layout.ts",
    "scripts/verify-home-v3-reference.ts",
    "scripts/verify-motion-v3-parity.ts",
    "scripts/verify-sr01-rls.ts",
    "scripts/verify-sr02-mutation-boundary.ts",
    "scripts/verify-sr02-authz.ts",
    "scripts/verify-auth-strict.ts",
    "scripts/verify-backup-home-resilience.ts",
    "scripts/verify-orders-action-menu.ts"
  )
  foreach ($script in $verifyScripts) {
    Invoke-Tsx -ScriptArgs @($script) -Label $script
  }

  Invoke-Npm -NpmArgs @("run", "build") -Label "build"

  $diffCheckPaths = @(
    "scripts/run-final-production-release-secure.ps1",
    "scripts/verify-live-migration-state.ts",
    "scripts/apply-founder-only-rls-secure.ts",
    "scripts/verify-founder-only-rls-live.ts",
    "scripts/verify-live-release-state.ts",
    "scripts/verify-database-backup-package.ts",
    "scripts/db-secure-connection.ts",
    "scripts/verify-motion-v3-parity.ts",
    "scripts/verify-founder-home-mission.ts",
    "scripts/verify-command-center-layout.ts",
    "package.json"
  )
  & git diff --check -- @diffCheckPaths
  $diffCheck = $LASTEXITCODE
  if ($null -eq $diffCheck) { $diffCheck = 1 }
  if ($diffCheck -ne 0) { throw "git diff --check failed" }

  Write-Host "PASS  code release gates" -ForegroundColor Green
}

function Run-Phase4-SafeMerge {
  Write-Host ""
  Write-Host "=== Phase 4: Safe merge ===" -ForegroundColor Cyan

  & git fetch origin
  if ($LASTEXITCODE -ne 0) { throw "git fetch failed before merge" }

  & git checkout main
  if ($LASTEXITCODE -ne 0) { throw "checkout main failed" }

  & git pull --ff-only origin main
  if ($LASTEXITCODE -ne 0) { throw "pull main failed" }

  & git merge --no-ff $ExpectedBranch -m "Merge ${ExpectedBranch}: global role home + founder-only mutation lockdown."
  if ($LASTEXITCODE -ne 0) { throw "merge failed" }

  $script:MergeCommit = (& git rev-parse HEAD).Trim()
  Write-Host "  merge commit: $MergeCommit"

  & git push origin main
  if ($LASTEXITCODE -ne 0) { throw "push main failed" }

  Write-Host "PASS  merged and pushed to main" -ForegroundColor Green
}

function Run-Phase5-ProductionDeploy {
  param([string]$ExpectedCommit)

  Write-Host ""
  Write-Host "=== Phase 5: Production deployment verification ===" -ForegroundColor Cyan

  $maxWait = 12
  $ready = $false
  for ($i = 1; $i -le $maxWait; $i++) {
    Write-Host "  polling production ($i/$maxWait)..." -ForegroundColor DarkGray
    try {
      $resp = Invoke-WebRequest -Uri $ProductionUrl -Method Head -UseBasicParsing -TimeoutSec 30
      if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 400) {
        $ready = $true
        $script:DeployId = $resp.Headers["x-vercel-id"]
        break
      }
    } catch {
      Start-Sleep -Seconds 15
    }
    Start-Sleep -Seconds 15
  }
  if (-not $ready) { throw "production URL not ready" }

  Invoke-Tsx -ScriptArgs @(
    "scripts/verify-live-release-state.ts",
    "--commit", $ExpectedCommit,
    "--url", $ProductionUrl
  ) -Label "live release state"

  Write-Host "PASS  production deployment verified" -ForegroundColor Green
}

function Run-Phase6-SmokeTest {
  Write-Host ""
  Write-Host "=== Phase 6: Smoke test ===" -ForegroundColor Cyan

  $routes = @("/", "/login")
  foreach ($route in $routes) {
    $url = "$ProductionUrl$route"
    $resp = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing -TimeoutSec 30
    if ($resp.StatusCode -lt 200 -or $resp.StatusCode -ge 400) {
      throw "smoke $route HTTP $($resp.StatusCode)"
    }
    Write-Host "PASS  $route HTTP $($resp.StatusCode)" -ForegroundColor Green
  }
}

function Run-Phase7-Documentation {
  param([string]$ReleaseCommit)

  Write-Host ""
  Write-Host "=== Phase 7: Documentation ===" -ForegroundColor Cyan

  $docPath = "docs/SODA_MASTER/SODA_OS_MASTER_PROJECT_STATE.md"
  if (-not (Test-Path -LiteralPath $docPath)) {
    throw "master project state doc missing"
  }

  $content = Get-Content -LiteralPath $docPath -Raw -Encoding UTF8
  $stamp = (Get-Date).ToString("yyyy-MM-dd")
  $short = $ReleaseCommit.Substring(0, 7)

  if ($content -notmatch "GLOBAL SODA EXPERIENCE") {
    $insert = @(
      ""
      "---"
      ""
      "## RELEASE - Global SODA Experience ($stamp)"
      ""
      "| Field | Value |"
      "|--------|--------|"
      "| **Status** | **PRODUCTION RELEASED - GLOBAL SODA EXPERIENCE ACTIVE - MANUAL ROLE CHECK PENDING** |"
      "| **Branch merged** | ``$ExpectedBranch`` -> ``main`` |"
      "| **Merge commit** | ``$ReleaseCommit`` ($short) |"
      "| **Migration 000034** | Applied on Production (founder-only UPDATE/DELETE RLS) |"
      "| **Migration 000033** | **NOT applied** - Personal Brain UI disabled |"
      "| **Production** | $ProductionUrl |"
      '| **Runner** | ``npm run release:production:secure`` |'
      ""
    ) -join "`n"
    $content = $content -replace "(## CURRENT MISSION)", ($insert + "`n`n## CURRENT MISSION")
    Set-Content -LiteralPath $docPath -Value $content -Encoding UTF8 -NoNewline
  }

  & git add $docPath
  if ($LASTEXITCODE -ne 0) { throw "git add doc failed" }

  & git commit -m "docs: record global SODA experience production release ($short)."
  if ($LASTEXITCODE -ne 0) {
    Write-Host "  no doc changes to commit (already recorded)" -ForegroundColor DarkGray
  } else {
    $script:DocCommit = (& git rev-parse HEAD).Trim()
    & git push origin main
    if ($LASTEXITCODE -ne 0) { throw "push doc commit failed" }
  }

  Write-Host "PASS  documentation updated" -ForegroundColor Green
}

# --- Main ---
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
Set-Location -LiteralPath $RepoRoot

$PgBinDir = "C:\Program Files\PostgreSQL\18\bin"
if (Test-Path -LiteralPath $PgBinDir) {
  $env:Path = "$PgBinDir;$env:Path"
}

$dbUrlPlain = $null
$phase2Done = $false
$canPromptDb = -not (Test-InputRedirected)

try {
  Write-Host ""
  Write-Host "SODA OS - Secure Production Release Runner" -ForegroundColor Cyan
  Write-Host "Credentials are never displayed, logged, or written to disk." -ForegroundColor DarkGray

  Run-Phase0-Baseline
  Run-Phase1-BackupVerify

  if ($canPromptDb) {
    $dbUrlPlain = Prompt-DatabaseUrl
    Run-Phase2-MigrationReconciliation -DbUrlPlain $dbUrlPlain
    $phase2Done = $true

    Run-Phase3-CodeGates
    Run-Phase4-SafeMerge
    Run-Phase5-ProductionDeploy -ExpectedCommit $MergeCommit
    Run-Phase6-SmokeTest
    Run-Phase7-Documentation -ReleaseCommit $MergeCommit

    $FinalStatus = "PRODUCTION RELEASED - GLOBAL SODA EXPERIENCE ACTIVE - MANUAL ROLE CHECK PENDING"
  } else {
    Run-Phase3-CodeGates
    $FinalStatus = "BLOCKED"
    Write-Host ""
    Write-Host "Phases 0, 1, 3 completed. Phases 2, 4-7 require interactive DATABASE_URL prompt." -ForegroundColor Yellow
    Write-Host 'Founder must run locally: npm run release:production:secure' -ForegroundColor Yellow
  }
}
catch {
  $FailedPhase = $_.Exception.Message
  Write-Host ""
  Write-Host "FAILED: $FailedPhase" -ForegroundColor Red
  if ($FailedPhase -match "non-interactive") {
    $FinalStatus = "BLOCKED"
  } else {
    $FinalStatus = "FAILED"
  }
}
finally {
  if ($null -ne $dbUrlPlain) { $dbUrlPlain = $null }
  Clear-SensitiveEnv
}

Write-Host ""
Write-Host "========== RELEASE REPORT ==========" -ForegroundColor Cyan
Write-Host "FINAL STATUS: $FinalStatus"
if ($FailedPhase) { Write-Host "Failed phase: $FailedPhase" }
Write-Host "Runner: scripts/run-final-production-release-secure.ps1"
Write-Host "Backup ZIP: verified existing ($BackupZip)"
Write-Host "000033: $Migration033Applied"
Write-Host "000034: $Migration034Applied"
Write-Host "Migration history: $MigrationHistoryStatus"
Write-Host "RLS live probes: $RlsResult"
if ($MergeCommit) { Write-Host "Merge commit: $MergeCommit" }
if ($DeployId) { Write-Host "Deploy ID: $DeployId" }
if ($DocCommit) { Write-Host "Doc commit: $DocCommit" }
Write-Host "===================================="

if ($FinalStatus -eq "FAILED") { exit 1 }
if ($FinalStatus -eq "BLOCKED") { exit 2 }
exit 0
