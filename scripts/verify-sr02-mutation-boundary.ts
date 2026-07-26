/**
 * SR-02 — Client-side domain mutation boundary verifier.
 * Fails when "use client" modules import domain-db, mutation engines/repos,
 * or call DML patterns directly.
 *
 * Run: npx tsx scripts/verify-sr02-mutation-boundary.ts
 */

import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const REPO = process.cwd();

const CLIENT_ROOTS = ["components", "app"] as const;

const FORBIDDEN_IMPORT_PATTERNS: RegExp[] = [
  /from\s+["']@\/lib\/supabase\/domain-db["']/,
  /from\s+["'][^"']*\/domain-db["']/,
  /from\s+["']@\/lib\/orders\/engine["']/,
  /from\s+["']@\/lib\/integration\/flows["']/,
  /import\s*\{[^}]*\b(createSmartOrder|updateSmartOrder|applyOrderStatus|createClientInline)\b[^}]*\}\s*from\s+["']@\/lib\/integration["']/,
  /import\s*\{[^}]*\b(create|update|delete|assignCrewToOrder|emitOrderClientPayment|markShootComplete|finishProject|advanceProjectJourney|runQuotationConversionFlow|createPayment|updatePayment|deletePayment|createInvoice|createDelivery|createEquipment|updateEquipment|deleteEquipment|assignEquipmentToPerson|moveQuotationStage|markDepositReceived|restoreQuotationVersion|setQuotationApprovalStatus)\b[^}]*\}\s*from\s+["']@\/lib\/(orders|clients|projects|quotations|payments|invoices|equipment|integration)(\/repository|["'])/,
];

const FORBIDDEN_CALL_PATTERNS: RegExp[] = [
  /\bcreateSmartOrder\s*\(/,
  /\bupdateSmartOrder\s*\(/,
  /\bdeleteOrder\s*\(/,
  /\bcreateClient\s*\(\s*\{/,
  /\bupdateClient\s*\(/,
  /\bdeleteClient\s*\(/,
  /\bcreateProject\s*\(/,
  /\bupdateProject\s*\(/,
  /\bdeleteProject\s*\(/,
  /\bcreateQuotation\s*\(/,
  /\bdeleteQuotation\s*\(/,
  /\bassignCrewToOrder\s*\(/,
  /\bemitOrderClientPayment\s*\(/,
  /\bcreatePayment\s*\(/,
  /\bupdatePayment\s*\(/,
  /\bdeletePayment\s*\(/,
  /\.from\([^)]+\)\.(insert|update|upsert|delete)\s*\(/,
];

const ACTION_FILES = [
  "lib/orders/actions.ts",
  "lib/clients/actions.ts",
  "lib/projects/actions.ts",
  "lib/quotations/actions.ts",
  "lib/payments/actions.ts",
  "lib/invoices/actions.ts",
  "lib/equipment/actions.ts",
  "lib/integration/actions.ts",
  "lib/domain/mutation-auth.ts",
] as const;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      walk(p, out);
    } else if (/\.(tsx?|jsx?)$/.test(name)) {
      out.push(p);
    }
  }
  return out;
}

function isClientFile(path: string, source: string): boolean {
  if (path.includes(`${join("app", "api")}${""}`)) return false;
  return (
    source.includes('"use client"') || source.includes("'use client'")
  );
}

function rel(p: string): string {
  return relative(REPO, p).replace(/\\/g, "/");
}

let passed = 0;

function check(label: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`PASS  ${label}`);
}

function runClientBoundaryChecks(): void {
  const files: string[] = [];
  for (const root of CLIENT_ROOTS) {
    walk(join(REPO, root), files);
  }

  const violations: string[] = [];

  for (const file of files) {
    const source = readFileSync(file, "utf8");
    if (!isClientFile(file, source)) continue;

    for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
      if (pattern.test(source)) {
        violations.push(`${rel(file)}: forbidden import (${pattern})`);
      }
    }

    for (const pattern of FORBIDDEN_CALL_PATTERNS) {
      if (!pattern.test(source)) continue;
      const lines = source.split(/\r?\n/).filter((l) => pattern.test(l));
      for (const line of lines) {
        if (/Action\s*\(/.test(line)) continue;
        if (
          pattern.source.includes("createClient") &&
          /@\/lib\/supabase\/client/.test(source) &&
          line.includes("createClient()")
        ) {
          continue;
        }
        violations.push(`${rel(file)}: forbidden client DML (${pattern})`);
        break;
      }
    }
  }

  check("no client-side domain mutation imports or DML", () => {
    assert.equal(
      violations.length,
      0,
      violations.slice(0, 20).join("\n")
    );
  });
}

function runActionAuthChecks(): void {
  for (const file of ACTION_FILES) {
    const source = readFileSync(join(REPO, file), "utf8");
    if (file.endsWith("mutation-auth.ts")) {
      check(`${file} is server-only`, () => {
        assert.match(source, /server-only-guard/);
        assert.match(source, /resolveSessionForApp|requirePermission/);
      });
      continue;
    }
    check(`${file} has use server`, () => {
      assert.match(source, /["']use server["']/);
    });
    check(`${file} uses mutation-auth or session gate`, () => {
      assert.match(
        source,
        /mutation-auth|resolveSessionForApp|requirePermission|requireFounder|assertOrderAccess|assertClientAccess|requireFounderSession|requireBrainFounder|requireConnect/
      );
    });
  }
}

function main(): void {
  console.log("SR-02 mutation boundary verifier\n");
  runClientBoundaryChecks();
  runActionAuthChecks();
  console.log(`\n${passed} checks passed.`);
}

main();
