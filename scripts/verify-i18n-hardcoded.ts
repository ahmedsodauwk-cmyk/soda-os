/**
 * Detect hardcoded English in mission-scoped settings routes.
 * Run: npx tsx scripts/verify-i18n-hardcoded.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const REPO = process.cwd();

const SCOPED_DIRS = [
  "app/(shell)/settings/profile",
  "app/(shell)/settings/account",
  "app/(shell)/settings/scope",
  "app/(shell)/settings/preferences",
  "app/(shell)/settings/system",
  "components/settings",
  "components/auth/login-form.tsx",
  "components/preferences/reduced-motion-switcher.tsx",
];

const ALLOWLIST = [
  "SODA",
  "SODA VISUALS",
  "SODA Brain",
  "Team Chat",
  "username@",
  "http",
  "https",
  "/people/",
  "/settings/",
  "→",
  "EGP",
  "Founder",
];

const SUSPECT = />\s*[A-Za-z][^<{]*[a-z][^<{]*</g;

function collectFiles(): string[] {
  const out: string[] = [];
  for (const entry of SCOPED_DIRS) {
    const full = join(REPO, entry);
    try {
      const st = statSync(full);
      if (st.isFile()) {
        out.push(entry);
        continue;
      }
      for (const f of readdirSync(full, { recursive: true })) {
        const rel = join(entry, String(f)).replace(/\\/g, "/");
        if (rel.endsWith(".tsx") || rel.endsWith(".ts")) out.push(rel);
      }
    } catch {
      /* skip */
    }
  }
  return out;
}

let violations = 0;

for (const file of collectFiles()) {
  const text = readFileSync(join(REPO, file), "utf8");
  const matches = text.match(SUSPECT) ?? [];
  for (const m of matches) {
    const inner = m.slice(1, -1).trim();
    if (inner.length < 4) continue;
    if (inner.includes("{") || inner.includes("t(")) continue;
    if (ALLOWLIST.some((a) => inner.includes(a))) continue;
    if (/^[A-Z0-9_./:@\-+]+$/.test(inner)) continue;
    console.log(`WARN  ${file}: hardcoded "${inner.slice(0, 60)}"`);
    violations += 1;
  }
}

assert.ok(
  violations <= 3,
  `Too many hardcoded English strings in scoped settings UI (${violations})`
);
console.log(`i18n hardcoded scan: ${violations} warning(s), within threshold.`);
