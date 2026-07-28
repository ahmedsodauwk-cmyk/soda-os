/**
 * Centered creation workspace verification — Order, Client, Quotation drawer.
 * Run: npx tsx scripts/verify-creation-interactions.ts
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

const root = process.cwd();
const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");

const orderDialog = read("components/orders/add-order-dialog.tsx");
const clientDialog = read("components/clients/add-client-dialog.tsx");
const quotationDrawer = read("components/quotations/add-quotation-drawer.tsx");
const globalsCss = read("app/globals.css");

console.log("verify-creation-interactions\n");

check("1: New Order — centered workspace class (not drawer)", () => {
  assert.match(orderDialog, /soda-creation-workspace soda-creation-order/);
  assert.doesNotMatch(orderDialog, /soda-creation-drawer/);
});

check("2: New Client — centered workspace class (not drawer)", () => {
  assert.match(clientDialog, /soda-creation-workspace soda-creation-client/);
  assert.doesNotMatch(clientDialog, /soda-creation-drawer/);
});

check("3: New Quotation — right drawer unchanged", () => {
  assert.match(quotationDrawer, /soda-creation-drawer soda-creation-quotation/);
  assert.doesNotMatch(quotationDrawer, /soda-creation-workspace/);
});

check("4: Order workspace — centered geometry in CSS", () => {
  const orderBlock = globalsCss.match(
    /\.soda-creation-workspace\.soda-creation-order \{[\s\S]*?\n\}/
  )?.[0];
  assert.ok(orderBlock, "order workspace block missing");
  assert.match(orderBlock!, /translate\(-50%, -50%\)/);
  assert.match(orderBlock!, /min\(1100px, calc\(100vw - 80px\)\)/);
  assert.match(orderBlock!, /max-height: min\(90vh, 90dvh\)/);
  assert.match(orderBlock!, /right: auto/);
  assert.doesNotMatch(orderBlock!, /right: 0/);
});

check("5: Client workspace — centered geometry in CSS", () => {
  const clientBlock = globalsCss.match(
    /\.soda-creation-workspace\.soda-creation-client \{[\s\S]*?\n\}/
  )?.[0];
  assert.ok(clientBlock, "client workspace block missing");
  assert.match(clientBlock!, /translate\(-50%, -50%\)/);
  assert.match(clientBlock!, /min\(720px, calc\(100vw - 80px\)\)/);
  assert.match(clientBlock!, /max-height: min\(85vh, 85dvh\)/);
});

check("6: Order motion — scale + translateY (no right-slide)", () => {
  const keyframe = globalsCss.match(
    /@keyframes soda-creation-order-in \{[\s\S]*?\n\}/
  )?.[0];
  assert.ok(keyframe, "order keyframe missing");
  assert.match(keyframe!, /scale\(0\.96\)/);
  assert.match(keyframe!, /calc\(-50% \+ 20px\)/);
  assert.doesNotMatch(keyframe!, /translateX/);
});

check("7: Client motion — scale + translateY (no right-slide)", () => {
  const keyframe = globalsCss.match(
    /@keyframes soda-creation-client-in \{[\s\S]*?\n\}/
  )?.[0];
  assert.ok(keyframe, "client keyframe missing");
  assert.match(keyframe!, /scale\(0\.96\)/);
  assert.match(keyframe!, /calc\(-50% \+ 16px\)/);
  assert.doesNotMatch(keyframe!, /translateX/);
});

check("8: Close animations defined for Order + Client", () => {
  assert.match(globalsCss, /soda-creation-order-out/);
  assert.match(globalsCss, /soda-creation-client-out/);
  assert.match(globalsCss, /--soda-duration-creation-order-close: 550ms/);
  assert.match(globalsCss, /--soda-duration-creation-client-close: 500ms/);
});

check("9: Motion V3 timing tokens in range", () => {
  assert.ok(motionV3.creationOrderMs >= 680 && motionV3.creationOrderMs <= 760);
  assert.ok(motionV3.creationOrderCloseMs >= 500 && motionV3.creationOrderCloseMs <= 600);
  assert.ok(motionV3.creationClientMs >= 580 && motionV3.creationClientMs <= 660);
  assert.ok(motionV3.creationClientCloseMs >= 450 && motionV3.creationClientCloseMs <= 550);
  assert.equal(motionV3.ease, "cubic-bezier(0.22, 1, 0.36, 1)");
});

check("10: Quotation drawer — right-side slide preserved", () => {
  assert.match(globalsCss, /soda-creation-quotation-in[\s\S]*?translateX\(36px\)/);
  assert.match(globalsCss, /\.soda-creation-drawer\.soda-creation-quotation[\s\S]*?right: 0/);
});

check("11: Form state safety — preserve on close comments", () => {
  assert.match(orderDialog, /Preserve unsaved form data on close/);
  assert.match(clientDialog, /Preserve unsaved form data on close/);
});

check("12: Scrollable body + stable footer structure", () => {
  assert.match(orderDialog, /overflow-y-auto/);
  assert.match(orderDialog, /DialogFooter.*sticky/);
  assert.match(clientDialog, /overflow-y-auto/);
  assert.match(clientDialog, /DialogFooter.*sticky/);
});

check("13: prefers-reduced-motion — workspace centered, opacity only", () => {
  assert.match(globalsCss, /prefers-reduced-motion: reduce[\s\S]*?soda-creation-workspace\.soda-creation-order/);
});

console.log(`\n${passed}/13 PASS`);
if (passed !== 13) process.exit(1);
