# SODA OS - Secure end-to-end Production release runner
# Founder command: npm run release:production:secure
#
# - Prompts once for Production DATABASE_URL (masked); never persists credentials
# - Stops on any phase failure and reports the failed phase
# - Does NOT use .env.local for release DB operations

$ErrorActionPreference = "Stop"

$ExpectedBranch = "feature/unified-profile-settings-i18n"
$ExpectedHeadPrefix = "4fd924e"
$ProductionUrl = "https://soda-os.vercel.app"

$BackupZip = $null
$BackupManifest = $null
$BackupDigest = $null

$FailedPhase = $null
$MergeCommit = $null
$DeployId = $null
$DocCommit = $null
$Migration034Applied = "skipped"
$Migration035Applied = "skipped"
$Migration036Applied = "skipped"
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

function Parse-RlsProbeStructuredResult {
  param([System.Collections.IEnumerable]$OutputLines)
  $marker = "SODA_RLS_PROBE_RESULT_JSON:"
  $lines = @($OutputLines)
  for ($i = $lines.Length - 1; $i -ge 0; $i--) {
    $line = [string]$lines[$i]
    if ($line.StartsWith($marker)) {
      $jsonText = $line.Substring($marker.Length)
      return ($jsonText | ConvertFrom-Json)
    }
  }
  return $null
}

function Invoke-RlsLiveProbes {
  param(
    [string]$Migration034AppliedThisRun
  )
  Write-Host "  > npx tsx scripts/verify-founder-only-rls-live.ts" -ForegroundColor DarkGray
  $probeOutput = & npx tsx scripts/verify-founder-only-rls-live.ts 2>&1
  $probeExit = $LASTEXITCODE
  if ($null -eq $probeExit) { $probeExit = 1 }
  $probeOutput | ForEach-Object { Write-Host $_ }

  $structured = Parse-RlsProbeStructuredResult -OutputLines $probeOutput
  if ($null -eq $structured) {
    throw "founder-only RLS live probes failed - structured JSON result missing"
  }

  $classifiedExit = [int]$structured.exitCode
  if ($classifiedExit -ne $probeExit) {
    Write-Host "  WARNING  probe exit code ($probeExit) differs from structured exitCode ($classifiedExit); using structured result." -ForegroundColor Yellow
  }

  if ($structured.status -eq "pass") {
    if ($classifiedExit -ne 0) {
      throw "founder-only RLS live probes reported pass but exitCode=$classifiedExit"
    }
    return $structured
  }

  Write-Host ""
  Write-Host "  RLS probe failure summary:" -ForegroundColor Red
  if ($structured.failedProbeId) {
    Write-Host "    failedProbeId: $($structured.failedProbeId)" -ForegroundColor Red
  }
  if ($structured.table) {
    Write-Host "    table: $($structured.table)" -ForegroundColor Red
  }
  if ($structured.operation) {
    Write-Host "    operation: $($structured.operation)" -ForegroundColor Red
  }
  if ($structured.stage) {
    Write-Host "    stage: $($structured.stage)" -ForegroundColor Red
  }
  if ($structured.sqlState) {
    Write-Host "    sqlState: $($structured.sqlState)" -ForegroundColor Red
  }
  Write-Host "    governedBy000034: $($structured.governedBy000034)" -ForegroundColor Red
  Write-Host "    cleanupCompleted: $($structured.cleanupCompleted)" -ForegroundColor Red
  Write-Host "    migrationRollbackRecommended: $($structured.migrationRollbackRecommended)" -ForegroundColor Red

  if ($structured.sr02InsertGap -eq $true) {
    $script:RlsResult = "FAIL (SR-02 INSERT security gap - 000034 not rolled back)"
    throw "SR-02 INSERT security gap detected - stop before merge"
  }

  if ($classifiedExit -eq 3) {
    $script:RlsResult = "FAIL (fixture/identity defect - 000034 not rolled back)"
    Write-Host "  Probe fixture or identity defect - NOT an RLS policy failure; 000034 rollback skipped." -ForegroundColor Red
    throw "RLS probe fixture or identity defect - fix verifier, do not rollback migration"
  }

  $shouldRollback = $false
  if (
    $Migration034AppliedThisRun -eq "applied this run" -and
    $structured.cleanupCompleted -eq $true -and
    $structured.migrationRollbackRecommended -eq $true -and
    $structured.governedBy000034 -eq $true
  ) {
    $shouldRollback = $true
  }

  if ($shouldRollback) {
    Write-Host "  Founder UPDATE/DELETE governed by 000034 failed after correct setup - rolling back 000034..." -ForegroundColor Red
    try {
      Invoke-Tsx -ScriptArgs @("scripts/apply-founder-only-rls-secure.ts", "--rollback") -Label "rollback 000034"
    }
    catch {
      Write-Host "  Rollback command failed - manual intervention required." -ForegroundColor Red
    }
    $script:RlsResult = "FAIL (founder mutation denied - 000034 rolled back)"
    throw "RLS assertions failed (founder UPDATE/DELETE denied by 000034)"
  }

  if ($classifiedExit -eq 2) {
    $script:RlsResult = "FAIL (exit 2 but rollback not recommended - 000034 kept)"
    throw "RLS probe exit 2 without migration rollback recommendation - fix verifier classification"
  }

  $script:RlsResult = "FAIL (exit $classifiedExit)"
  throw "founder-only RLS live probes failed (exit $classifiedExit)"
}

function Run-Phase0-Baseline {
  Write-Host ""
  Write-Host "=== Phase 0: Baseline ===" -ForegroundColor Cyan

  & git fetch origin
  if ($LASTEXITCODE -ne 0) { throw "git fetch origin failed" }

  $branch = (& git branch --show-current).Trim()
  $head = (& git rev-parse HEAD).Trim()
  $originMain = (& git rev-parse origin/main).Trim()
  $originFeature = $null
  try {
    $originFeature = (& git rev-parse "origin/$ExpectedBranch" 2>$null).Trim()
  } catch {
    $originFeature = $null
  }

  Write-Host "  branch:          $branch"
  Write-Host "  HEAD:            $head"
  if ($originFeature) {
    Write-Host "  origin/$ExpectedBranch`: $originFeature"
  } else {
    Write-Host "  origin/$ExpectedBranch`: (not on remote yet)"
  }
  Write-Host "  origin/main:     $originMain"

  if ($branch -ne $ExpectedBranch) {
    throw "expected branch $ExpectedBranch, got $branch"
  }
  if (-not $head.StartsWith($ExpectedHeadPrefix)) {
    throw "HEAD must include logo parity commit $ExpectedHeadPrefix (got $head)"
  }

  $dirty = (& git status --porcelain)
  if ($dirty) {
    throw "working tree must be clean before release"
  }

  if (-not (Test-Path -LiteralPath "scripts/verify-profile-settings-migration-state.ts")) {
    throw "profile-settings migration verifier missing - pull latest $ExpectedBranch"
  }

  Write-Host "PASS  baseline confirmed" -ForegroundColor Green
}

function Parse-BackupOutput {
  param([System.Collections.IEnumerable]$OutputLines)
  $zip = $null
  $manifest = $null
  $digest = $null
  foreach ($line in $OutputLines) {
    $text = [string]$line
    if ($text -match '^\s*zip:\s+(.+)$') { $zip = $Matches[1].Trim() }
    if ($text -match '^\s*manifest:\s+(.+)$') { $manifest = $Matches[1].Trim() }
    if ($text -match '^\s*digest:\s+(.+)$') { $digest = $Matches[1].Trim() }
  }
  return @{ Zip = $zip; Manifest = $manifest; Digest = $digest }
}

function Run-Phase1-FreshBackup {
  param([string]$DbUrlPlain)

  Write-Host ""
  Write-Host "=== Phase 1: Fresh Production backup ===" -ForegroundColor Cyan

  $env:DATABASE_URL = $DbUrlPlain
  Write-Host "  > npm run backup:database" -ForegroundColor DarkGray
  $backupOutput = & npm run backup:database 2>&1
  $backupCode = $LASTEXITCODE
  if ($null -eq $backupCode) { $backupCode = 1 }
  $backupOutput | ForEach-Object { Write-Host $_ }
  if ($backupCode -ne 0) {
    throw "fresh Production backup failed (exit $backupCode)"
  }

  $parsed = Parse-BackupOutput -OutputLines $backupOutput
  if (-not $parsed.Zip -or -not $parsed.Manifest -or -not $parsed.Digest) {
    throw "backup output missing zip/manifest/digest paths"
  }

  $script:BackupZip = $parsed.Zip
  $script:BackupManifest = $parsed.Manifest
  $script:BackupDigest = $parsed.Digest

  Invoke-Tsx -ScriptArgs @(
    "scripts/verify-database-backup-package.ts",
    "--zip", $BackupZip,
    "--manifest", $BackupManifest,
    "--digest", $BackupDigest,
    "--mode", "pg_dump",
    "--min-tables", "84"
  ) -Label "backup package verification"

  Write-Host "PASS  fresh Production backup verified" -ForegroundColor Green
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

  $null = Invoke-RlsLiveProbes -Migration034AppliedThisRun $script:Migration034Applied
  $script:RlsResult = "PASS"

  $profileOutput = & npx tsx scripts/verify-profile-settings-migration-state.ts 2>&1
  $profileCode = $LASTEXITCODE
  if ($null -eq $profileCode) { $profileCode = 1 }
  $profileOutput | ForEach-Object { Write-Host $_ }

  if ($profileCode -eq 11) {
    throw "000033 Personal Brain foundation present on Production - aborting"
  }
  if ($profileCode -notin @(0, 10, 12)) {
    throw "profile-settings migration state failed (exit $profileCode)"
  }

  if ($profileCode -eq 10) {
    Write-Host "  Applying migration 000035 (client privacy)..." -ForegroundColor Yellow
    Invoke-Tsx -ScriptArgs @("scripts/apply-client-privacy-secure.ts") -Label "apply 000035"
    $script:Migration035Applied = "applied this run"
    $profileCode = Invoke-Tsx -ScriptArgs @("scripts/verify-profile-settings-migration-state.ts") -Label "verify 000035" -AllowedExitCodes @(0, 12)
    if ($profileCode -eq 10) {
      Write-Host "  Rolling back 000035 (policy unsafe)..." -ForegroundColor Red
      Invoke-Tsx -ScriptArgs @("scripts/apply-client-privacy-secure.ts", "--rollback") -Label "rollback 000035"
      throw "000035 client privacy verification failed after apply"
    }
  } else {
    $script:Migration035Applied = "skipped (catalog match)"
  }

  if ($profileCode -eq 12) {
    Write-Host "  Applying migration 000036 (profile-avatars storage)..." -ForegroundColor Yellow
    Invoke-Tsx -ScriptArgs @("scripts/apply-profile-avatars-secure.ts") -Label "apply 000036"
    $script:Migration036Applied = "applied this run"
    Invoke-Tsx -ScriptArgs @("scripts/verify-profile-settings-migration-state.ts") -Label "verify 000036" -AllowedExitCodes @(0)
  } else {
    $script:Migration036Applied = "skipped (catalog match)"
  }

  Write-Host "PASS  migration reconciliation (000033 not applied; 000035/000036 OK)" -ForegroundColor Green
}

function Run-Phase3-CodeGates {
  Write-Host ""
  Write-Host "=== Phase 3: Code release gates ===" -ForegroundColor Cyan

  Invoke-Npm -NpmArgs @("run", "typecheck") -Label "typecheck"

  $eslintFiles = @(
    "scripts/run-final-production-release-secure.ps1",
    "scripts/verify-live-migration-state.ts",
    "scripts/verify-profile-settings-migration-state.ts",
    "scripts/apply-founder-only-rls-secure.ts",
    "scripts/apply-client-privacy-secure.ts",
    "scripts/apply-profile-avatars-secure.ts",
    "scripts/verify-founder-only-rls-live.ts",
    "scripts/verify-live-release-state.ts",
    "scripts/verify-database-backup-package.ts",
    "scripts/db-secure-connection.ts",
    "scripts/verify-motion-v3-parity.ts",
    "lib/domain/mutation-auth.ts",
    "lib/clients/privacy.ts",
    "lib/avatars/config.ts",
    "components/orders/orders-content.tsx",
    "components/dashboard/role-aware-home-stream.tsx",
    "supabase/migrations/20260728000034_founder_only_update_delete.sql",
    "supabase/migrations/20260730000035_client_privacy_non_founder.sql",
    "supabase/migrations/20260730000036_profile_avatars_storage.sql"
  )
  Write-Host "  > eslint (release files)" -ForegroundColor DarkGray
  & npx eslint @eslintFiles
  $eslintCode = $LASTEXITCODE
  if ($null -eq $eslintCode) { $eslintCode = 1 }
  if ($eslintCode -ne 0) { throw "ESLint failed (exit $eslintCode)" }

  Invoke-Tsx -ScriptArgs @("scripts/verify-live-migration-state.ts", "--static") -Label "live migration state (static)"
  Invoke-Tsx -ScriptArgs @("scripts/verify-profile-settings-migration-state.ts", "--static") -Label "profile-settings migration (static)"

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
    "scripts/verify-orders-action-menu.ts",
    "scripts/verify-profile-settings-i18n.ts",
    "scripts/verify-client-privacy.ts",
    "scripts/verify-i18n-hardcoded.ts"
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

  & git merge --no-ff $ExpectedBranch -m "Merge ${ExpectedBranch}: unified profile/settings, client privacy, avatars, i18n."
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

  if ($content -notmatch "PROFILE SETTINGS I18N PRODUCTION RELEASE") {
    $insert = @(
      ""
      "---"
      ""
      "## RELEASE - Profile Settings / Client Privacy / Avatars ($stamp)"
      ""
      "| Field | Value |"
      "|--------|--------|"
      "| **Status** | **PRODUCTION RELEASED - PROFILE SETTINGS ACTIVE - MANUAL ROLE CHECK PENDING** |"
      "| **Branch merged** | ``$ExpectedBranch`` -> ``main`` |"
      "| **Merge commit** | ``$ReleaseCommit`` ($short) |"
      "| **Migration 000035** | Client privacy (non-Founder denied client SELECT) |"
      "| **Migration 000036** | profile-avatars storage bucket + ownership policies |"
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

  & git commit -m "docs: record profile settings production release ($short)."
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

  if ($canPromptDb) {
    $dbUrlPlain = Prompt-DatabaseUrl
    Run-Phase1-FreshBackup -DbUrlPlain $dbUrlPlain
    Run-Phase2-MigrationReconciliation -DbUrlPlain $dbUrlPlain
    $phase2Done = $true

    Run-Phase3-CodeGates
    Run-Phase4-SafeMerge
    Run-Phase5-ProductionDeploy -ExpectedCommit $MergeCommit
    Run-Phase6-SmokeTest
    Run-Phase7-Documentation -ReleaseCommit $MergeCommit

    $FinalStatus = "PRODUCTION RELEASED - PROFILE SETTINGS ACTIVE - MANUAL ROLE CHECK PENDING"
  } else {
    Run-Phase3-CodeGates
    $FinalStatus = "BLOCKED"
    Write-Host ""
    Write-Host "Phase 0 + 3 completed. Phases 1-2, 4-7 require interactive DATABASE_URL prompt." -ForegroundColor Yellow
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
if ($BackupZip) { Write-Host "Backup ZIP: $BackupZip" } else { Write-Host "Backup ZIP: (not created - blocked)" }
Write-Host "000033: $Migration033Applied"
Write-Host "000034: $Migration034Applied"
Write-Host "000035: $Migration035Applied"
Write-Host "000036: $Migration036Applied"
Write-Host "Migration history: $MigrationHistoryStatus"
Write-Host "RLS live probes: $RlsResult"
if ($MergeCommit) { Write-Host "Merge commit: $MergeCommit" }
if ($DeployId) { Write-Host "Deploy ID: $DeployId" }
if ($DocCommit) { Write-Host "Doc commit: $DocCommit" }
Write-Host "===================================="

if ($FinalStatus -eq "FAILED") { exit 1 }
if ($FinalStatus -eq "BLOCKED") { exit 2 }
exit 0
