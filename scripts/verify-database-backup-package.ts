/**
 * Verify an existing database backup ZIP + sibling manifest (no new backup).
 * Never touches Production or secrets.
 *
 * Usage:
 *   npx tsx scripts/verify-database-backup-package.ts --zip <path> --manifest <path> --digest sha256:...
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

function parseArgs(argv: string[]): {
  zip?: string;
  manifest?: string;
  digest?: string;
  minTables?: number;
  mode?: string;
} {
  const out: ReturnType<typeof parseArgs> = { minTables: 84, mode: "pg_dump" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--zip" && argv[i + 1]) out.zip = argv[++i];
    if (a === "--manifest" && argv[i + 1]) out.manifest = argv[++i];
    if (a === "--digest" && argv[i + 1]) out.digest = argv[++i];
    if (a === "--min-tables" && argv[i + 1])
      out.minTables = Number(argv[++i]);
    if (a === "--mode" && argv[i + 1]) out.mode = argv[++i];
  }
  return out;
}

function sha256File(path: string): string {
  const buf = readFileSync(path);
  return `sha256:${createHash("sha256").update(buf).digest("hex")}`;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.zip || !args.manifest) {
    console.error("FAIL  --zip and --manifest required.");
    process.exit(1);
  }

  console.log("verify-database-backup-package\n");
  console.log(`  zip:      ${args.zip}`);
  console.log(`  manifest: ${args.manifest}`);

  if (!existsSync(args.zip)) {
    console.error("FAIL  ZIP not found.");
    process.exit(1);
  }
  if (!existsSync(args.manifest)) {
    console.error("FAIL  manifest not found.");
    process.exit(1);
  }

  const actualDigest = sha256File(args.zip);
  if (args.digest && actualDigest !== args.digest) {
    console.error(`FAIL  digest mismatch: expected ${args.digest}, got ${actualDigest}`);
    process.exit(1);
  }
  console.log(`PASS  zip digest ${actualDigest}`);

  const manifest = JSON.parse(readFileSync(args.manifest, "utf8")) as {
    mode?: string;
    tableCount?: number;
    limitations?: string[];
    zipDigest?: string;
  };

  if (args.mode && manifest.mode !== args.mode) {
    console.error(
      `FAIL  mode mismatch: expected ${args.mode}, got ${manifest.mode}`
    );
    process.exit(1);
  }
  console.log(`PASS  manifest mode=${manifest.mode ?? "(missing)"}`);

  const tableCount = manifest.tableCount ?? 0;
  const minTables = args.minTables ?? 84;
  if (tableCount < minTables) {
    console.error(
      `FAIL  tableCount ${tableCount} < minimum ${minTables}`
    );
    process.exit(1);
  }
  console.log(`PASS  tableCount=${tableCount} (>= ${minTables})`);

  const limitations = manifest.limitations ?? [];
  if (limitations.length !== 0) {
    console.error(`FAIL  limitations not empty: ${JSON.stringify(limitations)}`);
    process.exit(1);
  }
  console.log("PASS  limitations=[]");

  if (manifest.zipDigest && manifest.zipDigest !== actualDigest) {
    console.error("FAIL  manifest zipDigest does not match ZIP file.");
    process.exit(1);
  }
  if (manifest.zipDigest) {
    console.log("PASS  manifest zipDigest matches ZIP");
  }

  console.log("\nPASS  backup package verification complete.");
}

main().catch((err: unknown) => {
  console.error(`FAIL  ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
