/**
 * SR-00 — Production auth must always fail closed.
 * Verifies isAuthStrict() + signed-out fallback gate (no Next/Supabase runtime).
 * Does not touch Production, Supabase, or secrets.
 *
 * Run: npx tsx scripts/verify-auth-strict.ts
 */

import assert from "node:assert/strict";

import {
  allowsSignedOutOwnerFallback,
  isAuthStrict,
} from "../lib/identity/auth-strict";

const ENV_KEYS = ["VERCEL_ENV", "SODA_AUTH_STRICT"] as const;

type EnvSnapshot = Record<(typeof ENV_KEYS)[number], string | undefined>;

function snapshotEnv(): EnvSnapshot {
  const snap = {} as EnvSnapshot;
  for (const key of ENV_KEYS) {
    snap[key] = process.env[key];
  }
  return snap;
}

function restoreEnv(snap: EnvSnapshot): void {
  for (const key of ENV_KEYS) {
    const value = snap[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function withEnv(
  values: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>,
  fn: () => void
): void {
  const snap = snapshotEnv();
  try {
    for (const key of ENV_KEYS) {
      if (!(key in values)) continue;
      const value = values[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    fn();
  } finally {
    restoreEnv(snap);
  }
}

let passed = 0;

function check(label: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`PASS  ${label}`);
}

console.log("SR-00 verify-auth-strict\n");

// A. VERCEL_ENV=production + SODA_AUTH_STRICT=0 => strict
check("A: production + SODA_AUTH_STRICT=0 => strict", () => {
  withEnv({ VERCEL_ENV: "production", SODA_AUTH_STRICT: "0" }, () => {
    assert.equal(isAuthStrict(), true);
  });
});

// B. VERCEL_ENV=production + SODA_AUTH_STRICT unset => strict
check("B: production + SODA_AUTH_STRICT unset => strict", () => {
  withEnv({ VERCEL_ENV: "production", SODA_AUTH_STRICT: undefined }, () => {
    assert.equal(isAuthStrict(), true);
  });
});

// C. VERCEL_ENV=production + SODA_AUTH_STRICT=1 => strict
check("C: production + SODA_AUTH_STRICT=1 => strict", () => {
  withEnv({ VERCEL_ENV: "production", SODA_AUTH_STRICT: "1" }, () => {
    assert.equal(isAuthStrict(), true);
  });
});

// D. Preview / Development behavior preserved
check("D1: preview + SODA_AUTH_STRICT=0 => not strict (fallback allowed)", () => {
  withEnv({ VERCEL_ENV: "preview", SODA_AUTH_STRICT: "0" }, () => {
    assert.equal(isAuthStrict(), false);
    assert.equal(allowsSignedOutOwnerFallback(), true);
  });
});

check("D2: preview + unset => not strict (default local/Preview fallback)", () => {
  withEnv({ VERCEL_ENV: "preview", SODA_AUTH_STRICT: undefined }, () => {
    assert.equal(isAuthStrict(), false);
    assert.equal(allowsSignedOutOwnerFallback(), true);
  });
});

check("D3: development + SODA_AUTH_STRICT=1 => strict", () => {
  withEnv({ VERCEL_ENV: "development", SODA_AUTH_STRICT: "1" }, () => {
    assert.equal(isAuthStrict(), true);
    assert.equal(allowsSignedOutOwnerFallback(), false);
  });
});

check("D4: no VERCEL_ENV + SODA_AUTH_STRICT=0 => not strict", () => {
  withEnv({ VERCEL_ENV: undefined, SODA_AUTH_STRICT: "0" }, () => {
    assert.equal(isAuthStrict(), false);
    assert.equal(allowsSignedOutOwnerFallback(), true);
  });
});

// E. Production cannot synthesize a Founder fallback session
check("E: production + SODA_AUTH_STRICT=0 => owner fallback forbidden", () => {
  withEnv({ VERCEL_ENV: "production", SODA_AUTH_STRICT: "0" }, () => {
    assert.equal(isAuthStrict(), true);
    assert.equal(allowsSignedOutOwnerFallback(), false);
  });
});

console.log(`\n${passed} checks passed.`);
