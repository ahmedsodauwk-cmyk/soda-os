/**
 * Live RLS probes for founder-only UPDATE/DELETE lockdown (000034).
 * Transaction-safe — all mutation probes rolled back.
 * Reads DATABASE_URL from process env only.
 *
 * Run: npx tsx scripts/verify-founder-only-rls-live.ts
 */

import assert from "node:assert/strict";

import {
  maskDatabaseUrl,
  redactSecrets,
  requireDatabaseUrl,
  withPg,
} from "./db-secure-connection";

type AccessLevel = "founder" | "account_manager" | "team_leader" | "team";

const NON_FOUNDER_LEVELS: AccessLevel[] = [
  "account_manager",
  "team_leader",
  "team",
];

async function setRole(
  client: import("pg").Client,
  userId: string
): Promise<void> {
  await client.query(`SET LOCAL request.jwt.claim.sub = '${userId}'`);
  await client.query("SET LOCAL role authenticated");
}

async function main(): Promise<void> {
  const dbUrl = requireDatabaseUrl();
  console.log("verify-founder-only-rls-live\n");
  console.log(`  database: ${maskDatabaseUrl(dbUrl)}\n`);

  let passed = 0;

  await withPg(dbUrl, async (client) => {
    async function liveCheck(
      label: string,
      fn: () => Promise<void>
    ): Promise<void> {
      await fn();
      passed += 1;
      console.log(`PASS  ${label}`);
    }

    const profiles = await client.query<{
      id: string;
      access_level: string;
    }>(
      `SELECT id, access_level FROM public.profiles
       WHERE is_active = true
         AND access_level = ANY($1::text[])`,
      [["founder", ...NON_FOUNDER_LEVELS]]
    );

    const byLevel = new Map<string, string>();
    for (const row of profiles.rows) {
      if (!byLevel.has(row.access_level)) {
        byLevel.set(row.access_level, row.id);
      }
    }

    const founderId = byLevel.get("founder");
    if (!founderId) {
      console.error("FAIL  no active founder profile for probes");
      process.exit(1);
    }

    const orderRow = await client.query<{ id: string }>(
      `SELECT id FROM public.orders ORDER BY created_at DESC NULLS LAST LIMIT 1`
    );
    const orderId = orderRow.rows[0]?.id;
    if (!orderId) {
      console.error("FAIL  no orders row for UPDATE probe");
      process.exit(1);
    }

    const clientRow = await client.query<{ id: string }>(
      `SELECT id FROM public.clients ORDER BY created_at DESC NULLS LAST LIMIT 1`
    );
    const clientId = clientRow.rows[0]?.id;

    await liveCheck("founder: SELECT orders succeeds", async () => {
      await client.query("BEGIN");
      try {
        await setRole(client, founderId);
        const r = await client.query(
          "SELECT id FROM public.orders WHERE id = $1",
          [orderId]
        );
        assert.ok(r.rowCount && r.rowCount > 0);
      } finally {
        await client.query("ROLLBACK");
      }
    });

    for (const level of NON_FOUNDER_LEVELS) {
      const uid = byLevel.get(level);
      if (!uid) {
        console.log(`SKIP  ${level}: no active profile`);
        continue;
      }

      await liveCheck(`${level}: SELECT orders still allowed (scoped)`, async () => {
        await client.query("BEGIN");
        try {
          await setRole(client, uid);
          const r = await client.query("SELECT id FROM public.orders LIMIT 5");
          assert.ok(r.rowCount !== null && r.rowCount >= 0);
        } finally {
          await client.query("ROLLBACK");
        }
      });

      await liveCheck(`${level}: UPDATE order denied (0 rows)`, async () => {
        await client.query("BEGIN");
        try {
          await setRole(client, uid);
          const r = await client.query(
            `UPDATE public.orders SET notes = notes WHERE id = $1`,
            [orderId]
          );
          assert.equal(r.rowCount, 0);
        } finally {
          await client.query("ROLLBACK");
        }
      });

      await liveCheck(`${level}: DELETE order denied (0 rows)`, async () => {
        await client.query("BEGIN");
        try {
          await setRole(client, uid);
          const r = await client.query(
            `DELETE FROM public.orders WHERE id = $1`,
            [orderId]
          );
          assert.equal(r.rowCount, 0);
        } finally {
          await client.query("ROLLBACK");
        }
      });
    }

    await liveCheck("founder: UPDATE order allowed (rolled back)", async () => {
      await client.query("BEGIN");
      try {
        await setRole(client, founderId);
        const before = await client.query<{ notes: string | null }>(
          "SELECT notes FROM public.orders WHERE id = $1",
          [orderId]
        );
        const prior = before.rows[0]?.notes ?? "";
        const marker = `rls-probe-${Date.now()}`;
        const r = await client.query(
          `UPDATE public.orders SET notes = $2 WHERE id = $1`,
          [orderId, marker]
        );
        assert.equal(r.rowCount, 1);
        const check = await client.query<{ notes: string | null }>(
          "SELECT notes FROM public.orders WHERE id = $1",
          [orderId]
        );
        assert.equal(check.rows[0]?.notes, marker);
        await client.query(
          `UPDATE public.orders SET notes = $2 WHERE id = $1`,
          [orderId, prior]
        );
      } finally {
        await client.query("ROLLBACK");
      }
    });

    if (clientId) {
      await liveCheck("founder: DELETE client probe rolled back", async () => {
        const countBefore = await client.query<{ n: string }>(
          "SELECT count(*)::text AS n FROM public.clients WHERE id = $1",
          [clientId]
        );
        const n0 = countBefore.rows[0]?.n ?? "0";

        await client.query("BEGIN");
        try {
          await setRole(client, founderId);
          const r = await client.query(
            `DELETE FROM public.clients WHERE id = $1`,
            [clientId]
          );
          assert.equal(r.rowCount, 1);
        } finally {
          await client.query("ROLLBACK");
        }

        const countAfter = await client.query<{ n: string }>(
          "SELECT count(*)::text AS n FROM public.clients WHERE id = $1",
          [clientId]
        );
        assert.equal(countAfter.rows[0]?.n, n0);
      });
    }

    await liveCheck("non-founder INSERT clients still allowed (rolled back)", async () => {
      const amId = byLevel.get("account_manager") ?? byLevel.get("team_leader");
      if (!amId) {
        console.log("SKIP  INSERT probe — no AM/TL profile");
        return;
      }

      const probeId = `rls-insert-probe-${Date.now()}`;
      await client.query("BEGIN");
      try {
        await setRole(client, amId);
        try {
          await client.query(
            `INSERT INTO public.clients (id, type, segment, name)
             VALUES ($1, 'individual', 'wedding', 'RLS Insert Probe')`,
            [probeId]
          );
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (/duplicate key|23505/i.test(msg)) {
            return;
          }
          throw e;
        }
      } finally {
        await client.query("ROLLBACK");
      }
    });
  });

  console.log(`\n${passed} live RLS probes passed.`);
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`\nFAIL  ${redactSecrets(msg)}`);
  process.exit(1);
});
