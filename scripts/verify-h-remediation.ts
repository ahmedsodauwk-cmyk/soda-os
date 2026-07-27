/**
 * H1–H5 remediation static verification harness.
 * Run: npx tsx scripts/verify-h-remediation.ts
 */

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const REPO = process.cwd();

function read(rel: string): string {
  const p = resolve(REPO, rel);
  assert.ok(existsSync(p), `missing: ${rel}`);
  return readFileSync(p, "utf8");
}

let passed = 0;

function check(label: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`PASS  ${label}`);
}

console.log("H1–H5 remediation verifier\n");

check("H1 migration exists", () => {
  const sql = read("supabase/migrations/20260727000029_h1_connect_peer_directory.sql");
  assert.match(sql, /connect_list_directory_peers/);
  assert.match(sql, /connect_get_peers_by_ids/);
  assert.match(sql, /DROP POLICY IF EXISTS profiles_select_connect_peers/);
});

check("H1 RPC person_id matches profiles.text", () => {
  const sql = read("supabase/migrations/20260727000029_h1_connect_peer_directory.sql");
  assert.match(sql, /person_id text/);
  assert.doesNotMatch(sql, /person_id uuid/);
});

check("H1 rollback exists", () => {
  const sql = read("supabase/rollbacks/20260727000029_h1_connect_peer_directory_rollback.sql");
  assert.match(sql, /profiles_select_connect_peers/);
});

check("H1 repository uses RPC not profiles table", () => {
  const repo = read("lib/connect/repository.ts");
  assert.match(repo, /connect_list_directory_peers/);
  assert.match(repo, /connect_get_peers_by_ids/);
  assert.doesNotMatch(repo, /\.from\("profiles"\)/);
});

check("H2 storage SELECT scoped to owner folder", () => {
  const sql = read("supabase/migrations/20260727000030_h2_connect_storage_select.sql");
  assert.match(sql, /storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/);
});

check("H2 rollback exists", () => {
  assert.ok(existsSync(resolve(REPO, "supabase/rollbacks/20260727000030_h2_connect_storage_select_rollback.sql")));
});

check("H3 auth callback safe redirect", () => {
  const route = read("app/auth/callback/route.ts");
  assert.match(route, /safeRelativeRedirect/);
  assert.match(route, /startsWith\("\/\/"\)/);
  assert.match(route, /exchangeCodeForSession/);
  assert.match(route, /if \(error\)/);
});

check("H4 handle_new_user ignores privileged metadata", () => {
  const sql = read("supabase/migrations/20260727000031_h4_handle_new_user_harden.sql");
  assert.doesNotMatch(sql, /'owner', 'admin'/);
  assert.doesNotMatch(sql, /'founder'/);
  assert.match(sql, /team_leader/);
});

check("H4 rollback exists", () => {
  assert.ok(existsSync(resolve(REPO, "supabase/rollbacks/20260727000031_h4_handle_new_user_harden_rollback.sql")));
});

check("H5 messages UPDATE sender-only", () => {
  const sql = read("supabase/migrations/20260727000032_h5_connect_messages_update.sql");
  assert.match(sql, /sender_id = auth\.uid\(\)/);
  assert.doesNotMatch(sql, /or public\.connect_is_member/);
});

check("H5 rollback exists", () => {
  assert.ok(existsSync(resolve(REPO, "supabase/rollbacks/20260727000032_h5_connect_messages_update_rollback.sql")));
});

console.log(`\n${passed} H remediation checks passed.`);
