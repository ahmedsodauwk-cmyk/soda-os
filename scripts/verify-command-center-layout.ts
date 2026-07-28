/**
 * Command Center layout verification — three-column shell, brain rail, geometry tokens.
 * Run: npx tsx scripts/verify-command-center-layout.ts
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { v2Motion } from "../lib/visual/v2";

let passed = 0;

function check(label: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`PASS  ${label}`);
}

const root = process.cwd();
const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");

const shellFrame = read("components/layout/shell-frame.tsx");
const brainPanel = read("components/layout/soda-brain-panel-client.tsx");
const layout = read("app/(shell)/layout.tsx");
const globalsCss = read("app/globals.css");
const founderHome = read("components/dashboard/founder-home-stream.tsx");

console.log("verify-command-center-layout\n");

check("1: three-column shell frame with brain rail", () => {
  assert.match(shellFrame, /soda-shell-3col/);
  assert.match(shellFrame, /SodaBrainPanelClient/);
  assert.match(shellFrame, /variant="rail"/);
});

check("2: brain panel hidden on /brain route", () => {
  assert.match(shellFrame, /pathname !== "\/brain"/);
});

check("3: layout loads brain panel data for Founder", () => {
  assert.match(layout, /loadBrainPanelForShell/);
  assert.match(layout, /brainPanel/);
});

check("4: brain rail width ~280px (17.5rem)", () => {
  assert.match(brainPanel, /--soda-brain-rail-width/);
  assert.match(globalsCss, /--soda-brain-rail-width: 17\.5rem/);
});

check("5: sidebar width token 14rem (w-56)", () => {
  assert.match(globalsCss, /--soda-sidebar-width: 14rem/);
});

check("6: lower panels side-by-side on desktop", () => {
  assert.match(founderHome, /soda-founder-lower-panels/);
  assert.match(founderHome, /lg:grid-cols-2/);
  assert.match(founderHome, /FounderNeedsDecision/);
  assert.match(founderHome, /FounderCompanyUpdates/);
});

check("7: route motion ~650ms total", () => {
  assert.equal(v2Motion.routeExitMs + v2Motion.routeEnterMs, 650);
});

check("8: horizontal route keyframes", () => {
  assert.match(globalsCss, /translateX\(-24px\)/);
  assert.match(globalsCss, /translateX\(28px\)/);
});

check("9: brain quick ask Arabic placeholder", () => {
  assert.match(brainPanel, /اسأل سودا/);
  assert.match(brainPanel, /dir="rtl"/);
});

check("10: Open Brain links to /brain", () => {
  assert.match(brainPanel, /href="\/brain"/);
});

console.log(`\n${passed}/10 PASS`);
if (passed !== 10) process.exit(1);
