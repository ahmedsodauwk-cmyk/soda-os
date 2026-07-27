/**
 * Personal Brain migration — static verification (no Production apply).
 * Run: npx tsx scripts/verify-personal-brain-migration.ts
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { isPersonalBrainUiEnabled } from "../lib/personal-brain/feature-flag";

let passed = 0;

function check(label: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`PASS  ${label}`);
}

const root = process.cwd();
const migration = readFileSync(
  path.join(root, "supabase/migrations/20260728000033_personal_brain_foundation.sql"),
  "utf8"
);
const rollback = readFileSync(
  path.join(
    root,
    "supabase/rollbacks/20260728000033_personal_brain_foundation_rollback.sql"
  ),
  "utf8"
);
const brainMigration = readFileSync(
  path.join(root, "supabase/migrations/20260714000020_soda_brain_foundation.sql"),
  "utf8"
);

console.log("verify-personal-brain-migration\n");

check("1: migration creates personal_brain_entries", () => {
  assert.match(migration, /create table if not exists public\.personal_brain_entries/);
});

check("2: migration creates personal_brain_chat_messages", () => {
  assert.match(
    migration,
    /create table if not exists public\.personal_brain_chat_messages/
  );
});

check("3: migration creates personal_brain_entry_history", () => {
  assert.match(
    migration,
    /create table if not exists public\.personal_brain_entry_history/
  );
});

check("4: owner-only RLS — no is_brain_founder on personal tables", () => {
  assert.match(migration, /is_personal_brain_owner/);
  assert.doesNotMatch(migration, /is_brain_founder/);
});

check("5: personal tables require owner_user_id", () => {
  assert.match(migration, /owner_user_id uuid not null/);
});

check("6: rollback drops personal brain tables", () => {
  assert.match(rollback, /drop table if exists public\.personal_brain_entries/);
  assert.match(rollback, /drop table if exists public\.personal_brain_chat_messages/);
});

check("7: SODA Brain tables remain separate in foundation migration", () => {
  assert.match(brainMigration, /create table if not exists public\.brain_entries/);
  assert.doesNotMatch(brainMigration, /personal_brain_entries/);
});

check("8: Personal Brain UI gated off until migration approved", () => {
  assert.equal(isPersonalBrainUiEnabled(), false);
});

check("9: personal brain gate page exists", () => {
  const gate = readFileSync(
    path.join(root, "components/personal-brain/personal-brain-gate.tsx"),
    "utf8"
  );
  assert.match(gate, /20260728000033/);
  assert.match(gate, /isPersonalBrainUiEnabled/);
});

console.log(`\n${passed}/9 PASS`);
if (passed !== 9) process.exit(1);
