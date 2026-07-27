/**
 * Founder Home mission verification — structure, nav, motion, brain isolation.
 * Run: npx tsx scripts/verify-founder-home-mission.ts
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { v2Motion } from "../lib/visual/v2";
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
const founderActions = read("components/dashboard/founder-home-actions.tsx");
const founderFolders = read("components/dashboard/founder-folder-grid.tsx");
const companyUpdates = read("components/dashboard/founder-company-updates.tsx");
const routeTransition = read("components/layout/route-transition.tsx");
const shellFrame = read("components/layout/shell-frame.tsx");
const globalsCss = read("app/globals.css");
const navSource = read("lib/identity/nav.ts");

console.log("verify-founder-home-mission\n");

check("1: single action group component exists on Home", () => {
  assert.match(founderHome, /FounderHomeActions/);
  assert.match(founderActions, /Add Quotation/);
  assert.match(founderActions, /OrderEntryActions/);
  assert.doesNotMatch(founderHome, /FounderActionStrip/);
});

check("2: header has no duplicate action buttons", () => {
  assert.doesNotMatch(founderHeader, /New Order/);
  assert.doesNotMatch(founderHeader, /Add Client/);
  assert.match(founderHeader, /soda-founder-clock/);
});

check("3: folder grid covers required destinations (no SODA Brain)", () => {
  for (const href of [
    "/orders",
    "/clients",
    "/quotations",
    "/calendar",
    "/people",
    "/finance",
    "/connect",
    "/notifications",
  ]) {
    assert.match(founderFolders, new RegExp(`href: "${href}"`));
  }
  assert.doesNotMatch(founderFolders, /\/brain/);
  assert.match(founderFolders, /ArrowRight/);
});

check("4: Studio Activity replaced by Latest Company Updates", () => {
  assert.match(founderHome, /FounderCompanyUpdates/);
  assert.match(companyUpdates, /Latest Company Updates/);
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

check("11: Motion route timing ~650ms total", () => {
  assert.equal(v2Motion.routeExitMs + v2Motion.routeEnterMs, 650);
  assert.match(routeTransition, /v2Motion\.routeExitMs/);
  assert.match(globalsCss, /translateX/);
});

check("12: prefers-reduced-motion in globals", () => {
  assert.match(globalsCss, /prefers-reduced-motion: reduce/);
  assert.match(globalsCss, /soda-fade-only/);
});

check("13: hover and press durations in V2 range", () => {
  assert.ok(v2Motion.hoverMs >= 220 && v2Motion.hoverMs <= 300);
  assert.ok(v2Motion.pressMs >= 120 && v2Motion.pressMs <= 160);
});

check("14: Add Quotation links to existing flow", () => {
  assert.match(founderActions, /\/quotations\/new/);
});

check("15: brain rail in shell (not sidebar)", () => {
  assert.match(shellFrame, /SodaBrainPanelClient/);
  assert.match(navSource, /nav\.brain/);
  assert.match(navSource, /"nav.brain"/);
});

console.log(`\n${passed}/15 PASS`);
if (passed !== 15) process.exit(1);
