/**
 * Home V3 reference layout verification.
 * Run: npx tsx scripts/verify-home-v3-reference.ts
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

const founderHome = read("components/dashboard/founder-home-stream.tsx");
const founderHeader = read("components/dashboard/founder-command-header.tsx");
const founderKpi = read("components/dashboard/founder-kpi-row.tsx");
const financialOverview = read("components/dashboard/financial-overview.tsx");
const brainPanel = read("lib/brain/command-center-panel.ts");
const repository = read("lib/dashboard/repository.ts");
const globalsCss = read("app/globals.css");

console.log("verify-home-v3-reference\n");

check("1: Home V3 layout — no folder grid", () => {
  assert.doesNotMatch(founderHome, /FounderFolderGrid/);
  assert.doesNotMatch(founderHome, /FounderHomeActions/);
  assert.match(founderHome, /FounderKpiRow/);
  assert.match(founderHome, /FounderFollowUpOrders/);
  assert.match(founderHome, /SodaLiveFeed/);
  assert.match(founderHome, /CompanyPulse/);
  assert.match(founderHome, /FounderQuickActionsPanel/);
});

check("2: greeting + live clock card (no actions beside greeting)", () => {
  assert.match(founderHome, /FounderLiveClock/);
  assert.match(founderHome, /soda-founder-hero-row/);
  assert.doesNotMatch(founderHeader, /New Order/);
  assert.doesNotMatch(founderHeader, /soda-founder-clock/);
});

check("3: KPI row — five real-data cards", () => {
  assert.match(founderKpi, /Orders this month/);
  assert.match(founderKpi, /Revenue/);
  assert.match(founderKpi, /Active projects/);
  assert.match(founderKpi, /Pending payments/);
  assert.match(founderKpi, /Team members/);
  assert.match(founderKpi, /lg:grid-cols-5/);
});

check("4: management row — attention, finance, quick actions once", () => {
  const quickActions = read("components/dashboard/founder-quick-actions-panel.tsx");
  assert.match(founderHome, /soda-founder-mgmt-row/);
  assert.match(founderHome, /FounderNeedsDecision/);
  assert.match(founderHome, /DeferredFinancialOverview/);
  assert.match(founderHome, /FounderQuickActionsPanel/);
  assert.match(quickActions, /New Quotation/);
});

check("5: lower row — recent orders + latest updates", () => {
  assert.match(founderHome, /FounderRecentActivity/);
  assert.match(founderHome, /FounderCompanyUpdates/);
  assert.match(founderHome, /soda-founder-lower-panels/);
});

check("6: brain panel — max 4 focus, deduped insights", () => {
  assert.match(brainPanel, /slice\(0, 4\)/);
  assert.match(brainPanel, /seenInsightKeys/);
  assert.match(brainPanel, /insights\.length >= 3/);
});

check("7: dashboard snapshot cached per request", () => {
  assert.match(repository, /cache\(/);
  assert.match(repository, /loadDashboardSnapshot/);
});

check("8: route loading skeletons for key hubs", () => {
  read("app/(shell)/quotations/loading.tsx");
  read("app/(shell)/calendar/loading.tsx");
  read("app/(shell)/orders/loading.tsx");
  read("app/(shell)/clients/loading.tsx");
});

check("9: clock card CSS token", () => {
  assert.match(globalsCss, /soda-founder-clock-card/);
  assert.match(globalsCss, /soda-founder-hero-row/);
});

check("10: financial summary — responsive 2×2 metric grid, LTR currency", () => {
  assert.match(financialOverview, /@container\/metrics/);
  assert.match(financialOverview, /grid-cols-2/);
  assert.match(financialOverview, /max-\[15rem\]:grid-cols-1/);
  assert.match(financialOverview, /\[52rem\]\/metrics:grid-cols-4/);
  assert.match(financialOverview, /dir="ltr"/);
  assert.match(financialOverview, /unicodeBidi: "isolate"/);
  assert.match(financialOverview, /whitespace-nowrap/);
  assert.match(financialOverview, /min-w-0/);
  assert.match(financialOverview, /tabular-nums/);
  assert.match(globalsCss, /soda-financial-metric-amount/);
  assert.match(globalsCss, /clamp\(/);
  assert.doesNotMatch(financialOverview, /lg:grid-cols-4/);
});

check("11: sidebar untouched — w-56 rail", () => {
  const sidebar = read("components/layout/sidebar.tsx");
  assert.match(sidebar, /w-56/);
  assert.match(sidebar, /soda-nav-pill-active/);
});

console.log(`\n${passed}/11 PASS`);
if (passed !== 11) process.exit(1);
