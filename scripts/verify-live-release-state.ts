/**
 * Production release state verification — HTTP smoke + commit alignment.
 * No secrets. No DATABASE_URL required.
 *
 * Usage:
 *   npx tsx scripts/verify-live-release-state.ts --commit <sha>
 *   npx tsx scripts/verify-live-release-state.ts --commit <sha> --url https://soda-os.vercel.app
 */

import { spawnSync } from "node:child_process";

function parseArgs(argv: string[]): { commit?: string; url: string } {
  let commit: string | undefined;
  let url = "https://soda-os.vercel.app";
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--commit" && argv[i + 1]) commit = argv[++i];
    if (argv[i] === "--url" && argv[i + 1]) url = argv[++i];
  }
  return { commit, url };
}

function gitRevParse(ref: string): string | null {
  const r = spawnSync("git", ["rev-parse", ref], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (r.status !== 0) return null;
  return (r.stdout || "").trim() || null;
}

async function fetchHead(url: string): Promise<{
  status: number;
  vercelId?: string;
  server?: string;
}> {
  const res = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: { "User-Agent": "SODA-OS-Release-Runner/1.0" },
  });
  return {
    status: res.status,
    vercelId: res.headers.get("x-vercel-id") ?? undefined,
    server: res.headers.get("server") ?? undefined,
  };
}

async function smokeRoutes(baseUrl: string): Promise<void> {
  const routes = ["/", "/login"];
  for (const route of routes) {
    const target = `${baseUrl.replace(/\/$/, "")}${route}`;
    const res = await fetch(target, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": "SODA-OS-Release-Runner/1.0" },
    });
    if (res.status < 200 || res.status >= 400) {
      throw new Error(`${route} returned HTTP ${res.status}`);
    }
    console.log(`PASS  smoke ${route} HTTP ${res.status}`);
  }
}

async function main(): Promise<void> {
  const { commit, url } = parseArgs(process.argv.slice(2));
  console.log("verify-live-release-state\n");
  console.log(`  production url: ${url}`);

  const head = await fetchHead(url);
  if (head.status < 200 || head.status >= 400) {
    console.error(`FAIL  production HEAD HTTP ${head.status}`);
    process.exit(1);
  }
  console.log(`PASS  production reachable HTTP ${head.status}`);
  if (head.vercelId) console.log(`  x-vercel-id: ${head.vercelId}`);
  if (head.server) console.log(`  server: ${head.server}`);

  await smokeRoutes(url);

  if (commit) {
    const full = gitRevParse(commit) ?? commit;
    const short = full.slice(0, 7);
    const mainHead = gitRevParse("origin/main");
    console.log(`\n  expected commit: ${short} (${full})`);
    if (mainHead) {
      console.log(`  origin/main:     ${mainHead.slice(0, 7)} (${mainHead})`);
      if (mainHead !== full) {
        console.error(
          "FAIL  origin/main does not match expected release commit."
        );
        process.exit(1);
      }
      console.log("PASS  origin/main matches expected commit");
    } else {
      console.log("SKIP  origin/main not available locally");
    }
  }

  console.log("\nPASS  production release state checks complete.");
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`FAIL  ${msg}`);
  process.exit(1);
});
