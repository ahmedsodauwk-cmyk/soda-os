/**
 * Global role-aware Home verification harness.
 * Run: npx tsx scripts/verify-global-role-home.ts
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

let passed = 0;

function check(label: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`PASS  ${label}`);
}

const root = process.cwd();
const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");

const page = read("app/(shell)/page.tsx");
const roleHome = read("components/dashboard/role-aware-home-stream.tsx");
const registry = read("lib/dashboard/home-registry.ts");
const roleData = read("lib/dashboard/role-home-data.ts");
const scopedSnapshot = read("lib/dashboard/scoped-snapshot.ts");
const shellFrame = read("components/layout/shell-frame.tsx");
const shellLayout = read("app/(shell)/layout.tsx");
const brainAdapter = read("lib/personal-brain/shell-adapter.ts");
const accessLevelHome = read("components/dashboard/access-level-home.tsx");

console.log("verify-global-role-home\n");

check("1: Home page uses shared V3 shell for all roles", () => {
  assert.match(page, /RoleAwareHomeStream/);
  assert.match(page, /FounderHomeStream/);
  assert.match(page, /compactChrome/);
  assert.match(page, /SkeletonDashboardHome/);
  assert.match(page, /loadRoleHomeData/);
  assert.doesNotMatch(page, /AccessLevelHome/);
});

check("2: Non-Founder uses scoped snapshot loader (no company finance)", () => {
  assert.match(roleData, /loadScopedDashboardSnapshot/);
  assert.match(scopedSnapshot, /payments: \[\]/);
  assert.doesNotMatch(roleHome, /DeferredFinancialOverview/);
  assert.doesNotMatch(roleHome, /loadDashboardSnapshot/);
});

check("3: Home registry filters finance attention for non-Founder", () => {
  assert.match(registry, /FINANCE_ATTENTION_CATEGORIES/);
  assert.match(registry, /filterAttentionForHome/);
  assert.match(registry, /canShowCompanyFinance/);
  assert.match(registry, /activityFeedScopeFromDataScope/);
  assert.match(registry, /includePayments: false/);
});

check("4: Role-aware panels substitute in V3 grid slots", () => {
  assert.match(roleHome, /soda-founder-home/);
  assert.match(roleHome, /soda-founder-ops-row/);
  assert.match(roleHome, /soda-founder-mgmt-row/);
  assert.match(roleHome, /soda-founder-lower-panels/);
  assert.match(roleHome, /FounderCommandHeader/);
  assert.match(roleHome, /FounderLiveClock/);
  assert.match(roleHome, /RoleAwareKpiRow/);
  assert.match(roleHome, /HomePanelCard/);
});

check("5: All four access levels have registry coverage", () => {
  assert.match(registry, /account_manager:/);
  assert.match(registry, /team_leader:/);
  assert.match(registry, /team:/);
  assert.match(roleHome, /accessLevel === "account_manager"/);
  assert.match(roleHome, /accessLevel === "team_leader"/);
  assert.match(roleHome, /accessLevel === "team"/);
});

check("6: Brain rail Founder-only; no Personal Brain UI leakage", () => {
  assert.match(shellFrame, /user\?\.accessLevel === "founder"/);
  assert.match(shellFrame, /showBrainRail \? "soda-shell-3col" : "soda-shell-2col"/);
  assert.match(shellLayout, /accessLevel === "founder"/);
  assert.match(shellLayout, /brainPanel/);
  assert.match(brainAdapter, /resolvePersonalBrainShell/);
  assert.match(brainAdapter, /DEFERRED BY FOUNDER/);
  assert.match(brainAdapter, /visible: false/);
  assert.doesNotMatch(brainAdapter, /coming soon/i);
  assert.doesNotMatch(roleHome, /brain_entries/);
  assert.doesNotMatch(roleHome, /listBrainEntries/);
  assert.doesNotMatch(roleHome, /Personal Brain/i);
  assert.doesNotMatch(roleHome, /SodaBrainPanel/);
});

check("6b: Personal Brain route redirects when deferred", () => {
  const personalBrainPage = read("app/(shell)/me/personal-brain/page.tsx");
  assert.match(personalBrainPage, /isPersonalBrainUiEnabled/);
  assert.match(personalBrainPage, /redirect\("\/me"\)/);
  assert.match(personalBrainPage, /accessLevel !== "founder"/);
});

check("7: Quick actions permission-gated (not hard-coded role labels only)", () => {
  const quickPanel = read("components/dashboard/role-aware-quick-actions-panel.tsx");
  assert.match(quickPanel, /setHasAny/);
  assert.match(quickPanel, /allowedPermissions/);
  assert.doesNotMatch(quickPanel, /requireFounder/);
});

check("8: Legacy AccessLevelHome retained but not wired to Home route", () => {
  assert.match(accessLevelHome, /Role-scoped Home/);
  assert.doesNotMatch(page, /AccessLevelHome/);
});

check("9: Scoped activity feed — no payment signals for non-Founder", () => {
  const scopedUpdates = read("components/dashboard/scoped-home-updates.tsx");
  assert.match(scopedUpdates, /activityFeedScopeFromDataScope/);
  assert.match(scopedUpdates, /buildActivityFeed/);
});

check("10: Hero uses shared rotating brief (FounderHero via FounderCommandHeader)", () => {
  assert.match(roleHome, /FounderCommandHeader/);
  assert.match(roleHome, /scopeVoiceInputForHome/);
});

console.log(`\n${passed}/11 checks passed`);
