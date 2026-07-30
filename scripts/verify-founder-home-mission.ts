/**
 * Founder Home mission verification — structure, nav, motion, brain isolation.
 * Run: npx tsx scripts/verify-founder-home-mission.ts
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { motionV3 } from "../lib/visual/motion";
import { NAV_ITEMS, SIDEBAR_FOUNDER_HIDDEN_ME_KEYS } from "../lib/identity/nav";
import { isPersonalBrainUiEnabled } from "../lib/personal-brain/feature-flag";

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
const quickActions = read("components/dashboard/founder-quick-actions-panel.tsx");
const companyUpdates = read("components/dashboard/founder-company-updates.tsx");
const routeTransition = read("components/layout/route-transition.tsx");
const shellFrame = read("components/layout/shell-frame.tsx");
const globalsCss = read("app/globals.css");
const navSource = read("lib/identity/nav.ts");

console.log("verify-founder-home-mission\n");

check("1: single quick actions panel on Home (management row)", () => {
  assert.match(founderHome, /FounderQuickActionsPanel/);
  assert.match(quickActions, /New Quotation/);
  assert.match(quickActions, /New Order/);
  assert.match(quickActions, /New Client/);
  assert.doesNotMatch(founderHome, /FounderHomeActions/);
  assert.doesNotMatch(founderHome, /FounderActionStrip/);
});

check("2: header has no duplicate action buttons or inline clock", () => {
  assert.doesNotMatch(founderHeader, /New Order/);
  assert.doesNotMatch(founderHeader, /Add Client/);
  assert.doesNotMatch(founderHeader, /soda-founder-clock/);
});

check("3: Home V3 panels — KPI, ops, management, lower", () => {
  assert.match(founderHome, /FounderKpiRow/);
  assert.match(founderHome, /FounderFollowUpOrders/);
  assert.match(founderHome, /SodaLiveFeed/);
  assert.match(founderHome, /CompanyPulse/);
  assert.doesNotMatch(founderHome, /FounderFolderGrid/);
});

check("4: Latest Updates panel (not Studio Activity)", () => {
  assert.match(founderHome, /FounderCompanyUpdates/);
  assert.match(companyUpdates, /Latest Updates/);
  assert.doesNotMatch(founderHome, /FounderStudioActivity/);
  assert.match(founderHome, /soda-founder-lower-panels/);
});

check("5: no backup FS on Founder Home critical path", () => {
  assert.doesNotMatch(founderHome, /getBackupDashboardStatus/);
});

check("6: personal nav clutter removed from NAV_ITEMS", () => {
  const removed = ["nav.myFiles", "nav.briefs", "nav.dressCode"];
  for (const key of removed) {
    assert.equal(
      NAV_ITEMS.some((i) => i.titleKey === key),
      false,
      `${key} should be removed`
    );
  }
});

check("7: approved personal nav entries present", () => {
  const approved = [
    "nav.myTasks",
    "nav.myAssignedOrders",
    "nav.mySchedule",
    "nav.myWallet",
    "nav.myPerformance",
  ];
  for (const key of approved) {
    assert.equal(
      NAV_ITEMS.some((i) => i.titleKey === key),
      true,
      `${key} should exist`
    );
  }
});

check("8: Founder hides crew-only personal nav duplicates", () => {
  assert.ok(SIDEBAR_FOUNDER_HIDDEN_ME_KEYS.has("nav.myTasks"));
  assert.ok(SIDEBAR_FOUNDER_HIDDEN_ME_KEYS.has("nav.myAssignedOrders"));
});

check("9: SODA Brain remains Founder-only in nav", () => {
  assert.match(navSource, /level === "founder"/);
  assert.match(navSource, /accent === "brain"/);
});

check("10: brain isolation — personal brain UI disabled", () => {
  assert.equal(isPersonalBrainUiEnabled(), false);
});

function cssToken(name: string, ms: number): void {
  assert.match(
    globalsCss,
    new RegExp(`--${name}:\\s*${ms}ms`),
    `globals.css missing --${name}: ${ms}ms`
  );
}

check("11: Motion V3 route timing ~820ms total", () => {
  assert.equal(motionV3.routeTotalMs, 820);
  assert.equal(motionV3.routeExitMs + motionV3.routeEnterMs, motionV3.routeTotalMs);
  assert.match(routeTransition, /motionV3\.routeExitMs/);
  assert.match(routeTransition, /motionV3\.routeEnterMs/);
  cssToken("soda-duration-route-exit", motionV3.routeExitMs);
  cssToken("soda-duration-route", motionV3.routeEnterMs);
});

check("12: prefers-reduced-motion in globals", () => {
  assert.match(globalsCss, /prefers-reduced-motion: reduce/);
  assert.match(globalsCss, /soda-fade-only/);
});

check("13: card hover and press durations (Motion V3 token parity)", () => {
  assert.equal(motionV3.cardHoverMs, 260);
  assert.equal(motionV3.cardPressMs, 140);
  cssToken("soda-duration-hover", motionV3.cardHoverMs);
  cssToken("soda-duration-press", motionV3.cardPressMs);
});

check("14: New Quotation links to existing flow", () => {
  assert.match(quickActions, /\/quotations\/new/);
});

check("15: brain rail in shell (not sidebar)", () => {
  assert.match(shellFrame, /SodaBrainPanelClient/);
  assert.match(navSource, /nav\.brain/);
  assert.match(navSource, /"nav.brain"/);
});

check("16: Motion V3 motion.ts ↔ globals.css token parity", () => {
  cssToken("soda-duration-sidebar-pill", motionV3.sidebarIndicatorMs);
  cssToken("soda-duration-my-workspace", motionV3.myWorkspaceMs);
  cssToken("soda-duration-hero", motionV3.heroTransitionMs);
  cssToken("soda-duration-creation-order", motionV3.creationOrderMs);
  cssToken("soda-duration-creation-order-close", motionV3.creationOrderCloseMs);
  cssToken("soda-duration-creation-quotation", motionV3.creationQuotationMs);
  cssToken("soda-duration-creation-client", motionV3.creationClientMs);
  cssToken("soda-duration-creation-client-close", motionV3.creationClientCloseMs);
  assert.match(
    globalsCss,
    /--soda-ease:\s*cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\)/
  );
  assert.equal(motionV3.ease, "cubic-bezier(0.22, 1, 0.36, 1)");
});

console.log(`\n${passed}/16 PASS`);
if (passed !== 16) process.exit(1);
