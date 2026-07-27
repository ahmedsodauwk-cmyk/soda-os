/**
 * P0 — Founder Home must not crash when backup FS is unavailable.
 * Run: npx tsx scripts/verify-backup-home-resilience.ts
 */

import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import { getBackupDashboardStatus } from "../lib/backup/status";
import { readBackupIndex } from "../lib/backup/store";
import { isAuthStrict } from "../lib/identity/auth-strict";

let passed = 0;

async function check(label: string, fn: () => void | Promise<void>): Promise<void> {
  await fn();
  passed += 1;
  console.log(`PASS  ${label}`);
}

async function run(): Promise<void> {
  console.log("verify-backup-home-resilience\n");

  const founderHomeSource = readFileSync(
    path.join(process.cwd(), "components/dashboard/founder-home-stream.tsx"),
    "utf8"
  );
  const storeSource = readFileSync(
    path.join(process.cwd(), "lib/backup/store.ts"),
    "utf8"
  );
  const statusSource = readFileSync(
    path.join(process.cwd(), "lib/backup/status.ts"),
    "utf8"
  );

  await check("1: Founder Home does not call backup FS on critical path", async () => {
    assert.doesNotMatch(founderHomeSource, /getBackupDashboardStatus/);
    const status = await getBackupDashboardStatus();
    assert.equal(typeof status.systemStatus, "string");
  });

  await check("2: getBackupDashboardStatus has fail-soft fallback (Home survives throws)", async () => {
    assert.match(statusSource, /fallbackBackupDashboardStatus/);
    assert.match(statusSource, /catch\s*\{/);
    const status = await getBackupDashboardStatus();
    assert.equal(typeof status.systemStatus, "string");
  });

  await check("3: readBackupIndex returns [] when backup dir missing", () => {
    const tmp = mkdtempSync(path.join(os.tmpdir(), "soda-backup-missing-"));
    const prev = process.cwd();
    try {
      process.chdir(tmp);
      assert.deepEqual(readBackupIndex(), []);
    } finally {
      process.chdir(prev);
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  await check("4: readBackupIndex returns [] when index unreadable (corrupt JSON)", () => {
    const tmp = mkdtempSync(path.join(os.tmpdir(), "soda-backup-corrupt-"));
    const backupsRoot = path.join(tmp, "data", "backups");
    mkdirSync(backupsRoot, { recursive: true });
    writeFileSync(path.join(backupsRoot, "index.json"), "not-json{{{", "utf8");
    const prev = process.cwd();
    try {
      process.chdir(tmp);
      assert.deepEqual(readBackupIndex(), []);
    } finally {
      process.chdir(prev);
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  await check("5: readBackupIndex does not call mkdirSync / ensureRoot", () => {
    const fnMatch = storeSource.match(
      /export function readBackupIndex\(\)[\s\S]*?(?=\nexport |\nfunction |\Z)/
    );
    assert.ok(fnMatch, "readBackupIndex function body found");
    const body = fnMatch[0];
    assert.doesNotMatch(body, /ensureRoot/);
    assert.doesNotMatch(body, /mkdirSync/);
  });

  await check("6: getBackupDashboardStatus never throws (isolated cwd)", async () => {
    const tmp = mkdtempSync(path.join(os.tmpdir(), "soda-backup-status-"));
    const prev = process.cwd();
    try {
      process.chdir(tmp);
      const status = await getBackupDashboardStatus();
      assert.equal(typeof status.systemStatus, "string");
      assert.equal(status.totalBackups, 0);
    } finally {
      process.chdir(prev);
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  await check("7: auth remains fail-closed in production", () => {
    const prev = process.env.VERCEL_ENV;
    const prevStrict = process.env.SODA_AUTH_STRICT;
    try {
      process.env.VERCEL_ENV = "production";
      delete process.env.SODA_AUTH_STRICT;
      assert.equal(isAuthStrict(), true);
    } finally {
      if (prev === undefined) delete process.env.VERCEL_ENV;
      else process.env.VERCEL_ENV = prev;
      if (prevStrict === undefined) delete process.env.SODA_AUTH_STRICT;
      else process.env.SODA_AUTH_STRICT = prevStrict;
    }
  });

  console.log(`\n${passed}/7 PASS`);
  if (passed !== 7) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
