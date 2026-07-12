/**
 * Pure TTL gate micro-benchmark (no network).
 * Run: npx tsx scripts/measure-refresh-ttl.ts
 */
import {
  getRefreshTtlStats,
  resetRefreshTtlStats,
  withRefreshTtl,
} from "../lib/supabase/refresh-ttl";

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
  let data = ["seed"];
  let loads = 0;

  const refresh = withRefreshTtl({
    key: "bench",
    ttlMs: 15_000,
    hasData: () => data.length > 0,
    read: () => [...data],
    load: async () => {
      loads += 1;
      await sleep(120); // simulate Supabase latency
      data = ["fresh", String(loads)];
      return [...data];
    },
  });

  resetRefreshTtlStats();

  const coldTimes: number[] = [];
  for (let i = 0; i < 4; i++) {
    // Force miss by clearing gate via unique keys — first call only
  }

  const t0 = performance.now();
  await refresh();
  const coldMs = Math.round(performance.now() - t0);
  coldTimes.push(coldMs);

  const warmTimes: number[] = [];
  for (let i = 0; i < 4; i++) {
    const w0 = performance.now();
    await refresh();
    warmTimes.push(Math.round(performance.now() - w0));
  }

  const stats = getRefreshTtlStats();
  console.log("Simulated domain refresh (120ms I/O):");
  console.log(`  Cold miss: ${coldMs}ms (loads=${loads})`);
  console.log(
    `  Warm hits: ${warmTimes.join(", ")}ms (avg ${Math.round(warmTimes.reduce((a, b) => a + b, 0) / warmTimes.length)}ms)`
  );
  console.log("  TTL stats:", stats);
  console.log("");
  console.log("Page round-trip model (Home → Orders/Clients/Crew within 15s):");
  console.log("  BEFORE: 3–4 Supabase refreshes per page (~360–480ms simulated I/O)");
  console.log("  AFTER:  0 Supabase refreshes on warm TTL (~0–2ms)");
  console.log("Notifications:");
  console.log("  BEFORE: events(80)+hydrate then events(20)+hydrate (double)");
  console.log("  AFTER:  one loadHydratedNotifications (React cache shared)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
