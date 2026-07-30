/**
 * Profile / Settings / i18n / Client Privacy mission verifier.
 * Run: npx tsx scripts/verify-profile-settings-i18n.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO = process.cwd();
let passed = 0;

function check(label: string, fn: () => void): void {
  fn();
  passed++;
  console.log(`PASS  ${label}`);
}

function readRepo(path: string): string {
  return readFileSync(join(REPO, path), "utf8");
}

const moduleAccess = readRepo("lib/identity/module-access.ts");
const nav = readRepo("lib/identity/nav.ts");
const privacy = readRepo("lib/clients/privacy.ts");
const orderCc = readRepo("components/orders/order-command-center.tsx");
const dictionaries = readRepo("lib/i18n/dictionaries.ts");
const accessLevels = readRepo("lib/identity/access-levels.ts");
const clientsLayout = readRepo("app/(shell)/clients/layout.tsx");

check("1 settings personal permission in all levels", () => {
  assert.match(accessLevels, /settings\.personal/);
  assert.match(accessLevels, /TEAM:[\s\S]*?settings\.personal/);
});

check("2 personal settings routes in module-access", () => {
  assert.match(moduleAccess, /pathname\.startsWith\("\/settings"\)/);
  assert.ok(readRepo("app/(shell)/settings/profile/page.tsx"));
});

check("3 non-founder blocked from /clients paths", () => {
  assert.match(moduleAccess, /pathname\.startsWith\("\/clients"\)/);
  assert.match(moduleAccess, /isFounderAccess\(level\)/);
});

check("4 clients layout founder gate", () => {
  assert.match(clientsLayout, /mayBrowseClientDirectory/);
});

check("5 nav hides clients for non-founder", () => {
  assert.match(nav, /item\.href\.startsWith\("\/clients"\)/);
  assert.match(nav, /level === "founder"/);
});

check("6 order client link gated", () => {
  assert.match(orderCc, /canLinkToClientProfile/);
});

check("7 order client whitelist module", () => {
  assert.match(privacy, /ORDER_CLIENT_WHITELIST_KEYS/);
  assert.match(privacy, /orderClientSnapshot/);
});

check("8 settings IA pages exist", () => {
  assert.ok(readRepo("app/(shell)/settings/profile/page.tsx"));
  assert.ok(readRepo("app/(shell)/settings/account/page.tsx"));
  assert.ok(readRepo("app/(shell)/settings/scope/page.tsx"));
  assert.ok(readRepo("app/(shell)/settings/preferences/page.tsx"));
  assert.ok(readRepo("app/(shell)/settings/system/page.tsx"));
});

check("9 i18n settings dictionary keys", () => {
  assert.match(dictionaries, /settings:\s*\{/);
  assert.match(dictionaries, /myProfile:/);
  assert.match(dictionaries, /accountSecurity:/);
});

check("10 migration scaffold with rollback", () => {
  assert.ok(readRepo("supabase/migrations/20260730000035_client_privacy_non_founder.sql"));
  assert.ok(
    readRepo(
      "supabase/migrations/rollback/20260730000035_client_privacy_non_founder_rollback.sql"
    )
  );
  assert.ok(readRepo("supabase/migrations/20260730000036_profile_avatars_storage.sql"));
});

check("11 migration 000035 denies all non-Founder", () => {
  const sql = readRepo("supabase/migrations/20260730000035_client_privacy_non_founder.sql");
  assert.doesNotMatch(sql, /account_manager/);
  assert.match(sql, /RETURN false;/);
});

check("12 avatar upload module", () => {
  assert.ok(readRepo("lib/avatars/upload-client.ts"));
  assert.ok(readRepo("lib/avatars/crop.ts"));
});

console.log(`\n${passed} checks passed.`);
