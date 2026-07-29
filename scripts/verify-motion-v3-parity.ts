/**
 * Motion V3 token parity — `lib/visual/motion.ts` ↔ `app/globals.css`.
 * Run: npx tsx scripts/verify-motion-v3-parity.ts
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { motionV3 } from "../lib/visual/motion";

let passed = 0;

function check(label: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`PASS  ${label}`);
}

const globalsCss = readFileSync(
  path.join(process.cwd(), "app/globals.css"),
  "utf8"
);

function cssToken(name: string, ms: number): void {
  const pattern = new RegExp(`--${name}:\\s*${ms}ms`);
  assert.match(
    globalsCss,
    pattern,
    `globals.css missing --${name}: ${ms}ms`
  );
}

console.log("verify-motion-v3-parity\n");

check("1: route total ~820ms (240 + 580)", () => {
  assert.equal(motionV3.routeExitMs, 240);
  assert.equal(motionV3.routeEnterMs, 580);
  assert.equal(motionV3.routeTotalMs, 820);
  assert.equal(motionV3.routeExitMs + motionV3.routeEnterMs, motionV3.routeTotalMs);
});

check("2: route tokens in globals.css", () => {
  cssToken("soda-duration-route-exit", motionV3.routeExitMs);
  cssToken("soda-duration-route", motionV3.routeEnterMs);
});

check("3: card hover/press tokens", () => {
  cssToken("soda-duration-hover", motionV3.cardHoverMs);
  cssToken("soda-duration-press", motionV3.cardPressMs);
  assert.equal(motionV3.cardHoverMs, 260);
  assert.equal(motionV3.cardPressMs, 140);
});

check("4: sidebar + workspace tokens", () => {
  cssToken("soda-duration-sidebar-pill", motionV3.sidebarIndicatorMs);
  cssToken("soda-duration-my-workspace", motionV3.myWorkspaceMs);
});

check("5: hero transition token", () => {
  cssToken("soda-duration-hero", motionV3.heroTransitionMs);
  assert.equal(motionV3.heroTransitionMs, 675);
});

check("6: hero JS timers (greeting/brief)", () => {
  assert.equal(motionV3.heroGreetingMs, 3750);
  assert.equal(motionV3.heroBriefMs, 5500);
});

check("7: creation workspace tokens", () => {
  cssToken("soda-duration-creation-order", motionV3.creationOrderMs);
  cssToken("soda-duration-creation-order-close", motionV3.creationOrderCloseMs);
  cssToken("soda-duration-creation-quotation", motionV3.creationQuotationMs);
  cssToken("soda-duration-creation-client", motionV3.creationClientMs);
  cssToken("soda-duration-creation-client-close", motionV3.creationClientCloseMs);
  assert.equal(motionV3.creationOrderMs, 720);
});

check("8: route translate px parity", () => {
  assert.match(globalsCss, new RegExp(`translateX\\(-${motionV3.routeExitTranslatePx}px\\)`));
  assert.match(globalsCss, new RegExp(`translateX\\(${motionV3.routeEnterTranslatePx}px\\)`));
});

check("9: ease curve in globals", () => {
  assert.match(globalsCss, /--soda-ease:\s*cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\)/);
  assert.equal(motionV3.ease, "cubic-bezier(0.22, 1, 0.36, 1)");
});

console.log(`\n${passed}/9 PASS`);
if (passed !== 9) process.exit(1);
