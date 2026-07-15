/**
 * Mission 08.1 — Ensure Founder local recovery folders on D:\SODA OS\
 *
 * Safe to run on build machines: no-ops with a clear message if D:\ is missing.
 * Run: npm run founder:local-dirs
 */

import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const ROOT = "D:\\SODA OS";
const FOLDERS = [
  "Source",
  "Backups",
  "Database",
  "Storage",
  "Assets",
  "Brand",
  "Documentation",
  "Exports",
  "Restore",
  "Versions",
] as const;

function main() {
  const drive = path.parse(ROOT).root;
  if (!existsSync(drive)) {
    console.log(
      `Founder local dirs: drive ${drive} not available on this machine.`
    );
    console.log(
      `Documented structure (create on Founder PC):\n  ${ROOT}\\`
    );
    for (const name of FOLDERS) {
      console.log(`    ${name}\\`);
    }
    console.log(
      "\nSee docs/SODA_MASTER/SOURCE_PROTECTION.md — no folders created here."
    );
    process.exit(0);
  }

  mkdirSync(ROOT, { recursive: true });
  for (const name of FOLDERS) {
    const dir = path.join(ROOT, name);
    mkdirSync(dir, { recursive: true });
    console.log(`OK  ${dir}`);
  }
  console.log("\nFounder local structure ready.");
}

main();
