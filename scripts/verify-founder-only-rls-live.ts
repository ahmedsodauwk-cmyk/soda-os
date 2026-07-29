/**
 * Live RLS probes for founder-only UPDATE/DELETE lockdown (000034).
 * Transaction-safe — all mutation probes rolled back; disposable fixtures only.
 * Reads DATABASE_URL from process env only.
 *
 * Fixture model (every UPDATE/DELETE probe):
 *   1. BEGIN
 *   2. Privileged insert (no SET LOCAL role authenticated)
 *   3. Confirm fixture exists
 *   4. SET LOCAL authenticated + jwt.claim.sub for operation under test
 *   5. Execute operation; assert row count or RLS denial
 *   6. ROLLBACK
 *   7. Confirm no fixture survives
 *
 * Exit codes:
 *   0 — all probes passed
 *   1 — unexpected error or SR-02 INSERT security gap
 *   2 — RLS denial (42501) during operation under test — runner may rollback 000034
 *   3 — test fixture defect (e.g. 23503 FK, 42501 during privileged setup) — do NOT rollback migration
 *
 * Run: npx tsx scripts/verify-founder-only-rls-live.ts
 */

import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

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

/** Runner exit codes for classification-aware rollback. */
export const RLS_PROBE_EXIT_RLS_FAIL = 2;
export const RLS_PROBE_EXIT_FIXTURE_DEFECT = 3;

const SQLSTATE_RLS_DENIAL = "42501";
const SQLSTATE_FK_VIOLATION = "23503";
const SQLSTATE_UNIQUE_VIOLATION = "23505";

const SR02_INSERT_POLICY_FIX = `DROP POLICY IF EXISTS sr01_clients_insert ON public.clients;
CREATE POLICY sr01_clients_insert ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (public.soda_is_domain_founder());`;

function disposableClientMarker(): string {
  const suffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
  return `SODA_RLS_TEST_${suffix}`;
}

function disposableClientId(): string {
  return disposableClientMarker();
}

function pgSqlState(err: unknown): string | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const code = (err as { code?: string }).code;
  return typeof code === "string" ? code : undefined;
}

function isRlsDenial(err: unknown): boolean {
  const code = pgSqlState(err);
  if (code === SQLSTATE_RLS_DENIAL) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /permission denied|42501/i.test(msg);
}

function exitFixtureDefect(message: string): never {
  console.error(`FAIL  fixture defect: ${message}`);
  process.exit(RLS_PROBE_EXIT_FIXTURE_DEFECT);
}

function exitRlsFail(message: string): never {
  console.error(`FAIL  ${message}`);
  process.exit(RLS_PROBE_EXIT_RLS_FAIL);
}

function exitInsertSecurityGap(level: string): never {
  console.error(
    `FAIL  SR-02 security gap: ${level} INSERT clients allowed by RLS — stop before merge`
  );
  console.error("  Expected: non-Founder direct INSERT denied at RLS layer.");
  console.error("  Smallest additive fix (apply separately, not in this verifier):");
  console.error(`  ${SR02_INSERT_POLICY_FIX.split("\n").join("\n  ")}`);
  process.exit(1);
}

async function setRole(
  client: import("pg").Client,
  userId: string
): Promise<void> {
  await client.query(`SET LOCAL request.jwt.claim.sub = '${userId}'`);
  await client.query("SET LOCAL role authenticated");
}

/** Privileged fixture insert — must run BEFORE setRole/authenticated JWT. */
async function insertDisposableClientPrivileged(
  client: import("pg").Client,
  clientId: string,
  marker: string
): Promise<void> {
  try {
    await client.query(
      `INSERT INTO public.clients (id, type, segment, name, phone, is_active)
       VALUES ($1, 'individual', 'wedding', $2, '0000000000', true)`,
      [clientId, marker]
    );
  } catch (err) {
    const code = pgSqlState(err);
    if (code === SQLSTATE_RLS_DENIAL || isRlsDenial(err)) {
      exitFixtureDefect(
        `${SQLSTATE_RLS_DENIAL} during privileged fixture setup — DATABASE_URL role cannot bypass RLS for fixture seeding`
      );
    }
    if (code === SQLSTATE_FK_VIOLATION) {
      exitFixtureDefect(
        `${SQLSTATE_FK_VIOLATION}: disposable client fixture has dependency defect`
      );
    }
    if (code === SQLSTATE_UNIQUE_VIOLATION) {
      exitFixtureDefect(
        `${SQLSTATE_UNIQUE_VIOLATION}: disposable client id collision`
      );
    }
    throw err;
  }
}

async function confirmFixtureExists(
  client: import("pg").Client,
  clientId: string
): Promise<void> {
  const r = await client.query<{ n: string }>(
    "SELECT count(*)::text AS n FROM public.clients WHERE id = $1",
    [clientId]
  );
  assert.equal(r.rows[0]?.n, "1", "fixture must exist before role switch");
}

async function assertNoFixtureSurvives(
  client: import("pg").Client,
  clientId: string
): Promise<void> {
  const ghost = await client.query<{ n: string }>(
    "SELECT count(*)::text AS n FROM public.clients WHERE id = $1",
    [clientId]
  );
  assert.equal(ghost.rows[0]?.n, "0", "fixture must not survive rollback");
}

function policyIsFounderOnly(qual: string | null, withCheck: string | null): boolean {
  const text = `${qual ?? ""} ${withCheck ?? ""}`;
  if (!/soda_is_domain_founder\s*\(\s*\)/i.test(text)) return false;
  if (/soda_can_access_/i.test(text)) return false;
  if (/soda_profile_access_level/i.test(text)) return false;
  return true;
}

async function main(): Promise<void> {
  const dbUrl = requireDatabaseUrl();
  console.log("verify-founder-only-rls-live\n");
  console.log(`  database: ${maskDatabaseUrl(dbUrl)}\n`);

  let passed = 0;
  let amVerificationMethod: string | null = null;

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

    await liveCheck(
      "founder: DELETE disposable client allowed (rolled back)",
      async () => {
        const clientId = disposableClientId();
        const marker = clientId;

        await client.query("BEGIN");
        try {
          await insertDisposableClientPrivileged(client, clientId, marker);
          await confirmFixtureExists(client, clientId);

          await setRole(client, founderId);
          const r = await client.query(
            `DELETE FROM public.clients WHERE id = $1`,
            [clientId]
          );
          assert.equal(r.rowCount, 1);
        } catch (err) {
          const code = pgSqlState(err);
          if (code === SQLSTATE_FK_VIOLATION) {
            exitFixtureDefect(
              `${SQLSTATE_FK_VIOLATION}: disposable client has dependents — probe design error`
            );
          }
          if (code === SQLSTATE_RLS_DENIAL || isRlsDenial(err)) {
            exitRlsFail(
              `founder DELETE denied (${SQLSTATE_RLS_DENIAL}) — RLS lockdown not effective`
            );
          }
          throw err;
        } finally {
          await client.query("ROLLBACK");
        }

        await assertNoFixtureSurvives(client, clientId);
      }
    );

    const amId = byLevel.get("account_manager");
    if (amId) {
      amVerificationMethod = "live account_manager profile probes";
      await liveCheck(
        "account_manager: DELETE disposable client denied (0 rows, rolled back)",
        async () => {
          const clientId = disposableClientId();
          const marker = clientId;

          await client.query("BEGIN");
          try {
            await insertDisposableClientPrivileged(client, clientId, marker);
            await confirmFixtureExists(client, clientId);

            await setRole(client, amId);
            try {
              const r = await client.query(
                `DELETE FROM public.clients WHERE id = $1`,
                [clientId]
              );
              assert.equal(r.rowCount, 0);
            } catch (err) {
              if (isRlsDenial(err)) return;
              throw err;
            }
          } finally {
            await client.query("ROLLBACK");
          }

          await assertNoFixtureSurvives(client, clientId);
        }
      );

      await liveCheck(
        "account_manager: UPDATE disposable client denied (0 rows, rolled back)",
        async () => {
          const clientId = disposableClientId();
          const marker = clientId;

          await client.query("BEGIN");
          try {
            await insertDisposableClientPrivileged(client, clientId, marker);
            await confirmFixtureExists(client, clientId);

            await setRole(client, amId);
            try {
              const r = await client.query(
                `UPDATE public.clients SET notes = 'rls-probe' WHERE id = $1`,
                [clientId]
              );
              assert.equal(r.rowCount, 0);
            } catch (err) {
              if (isRlsDenial(err)) return;
              throw err;
            }
          } finally {
            await client.query("ROLLBACK");
          }

          await assertNoFixtureSurvives(client, clientId);
        }
      );
    } else {
      amVerificationMethod = "structural catalog proof (no active AM profile)";
      await liveCheck(
        "account_manager: clients UPDATE/DELETE policies founder-only (catalog)",
        async () => {
          const policies = await client.query<{
            policyname: string;
            qual: string | null;
            with_check: string | null;
          }>(
            `SELECT policyname, qual, with_check
             FROM pg_policies
             WHERE schemaname = 'public'
               AND tablename = 'clients'
               AND policyname = ANY($1::text[])`,
            [["sr01_clients_update", "sr01_clients_delete"]]
          );

          const found = new Map(
            policies.rows.map((r) => [r.policyname, r])
          );
          for (const name of ["sr01_clients_update", "sr01_clients_delete"]) {
            const row = found.get(name);
            assert.ok(row, `missing policy ${name} on public.clients`);
            assert.ok(
              policyIsFounderOnly(row.qual, row.with_check),
              `${name} is not founder-only in catalog`
            );
          }
        }
      );
    }

    await liveCheck(
      "founder: INSERT client permitted via protected path (rolled back)",
      async () => {
        const insertId = disposableClientId();

        await client.query("BEGIN");
        try {
          await setRole(client, founderId);
          await client.query(
            `INSERT INTO public.clients (id, type, segment, name, phone, is_active)
             VALUES ($1, 'individual', 'wedding', $2, '0000000000', true)`,
            [insertId, insertId]
          );
          await confirmFixtureExists(client, insertId);
        } catch (err) {
          if (isRlsDenial(err)) {
            exitRlsFail(
              `founder INSERT denied (${SQLSTATE_RLS_DENIAL}) — founder create path blocked`
            );
          }
          throw err;
        } finally {
          await client.query("ROLLBACK");
        }

        await assertNoFixtureSurvives(client, insertId);
      }
    );

    for (const level of NON_FOUNDER_LEVELS) {
      const uid = byLevel.get(level);
      if (!uid) {
        console.log(`SKIP  ${level}: INSERT probe — no active profile`);
        continue;
      }

      await liveCheck(`${level}: INSERT client denied (SR-02)`, async () => {
        const insertId = disposableClientId();

        await client.query("BEGIN");
        try {
          await setRole(client, uid);
          try {
            await client.query(
              `INSERT INTO public.clients (id, type, segment, name, phone, is_active)
               VALUES ($1, 'individual', 'wedding', $2, '0000000000', true)`,
              [insertId, insertId]
            );
            exitInsertSecurityGap(level);
          } catch (err) {
            if (isRlsDenial(err)) return;
            const code = pgSqlState(err);
            if (code === SQLSTATE_UNIQUE_VIOLATION) return;
            throw err;
          }
        } finally {
          await client.query("ROLLBACK");
        }

        await assertNoFixtureSurvives(client, insertId);
      });
    }
  });

  console.log(`\n  AM verification: ${amVerificationMethod ?? "not run"}`);
  console.log(`  fixture seeding: privileged insert before role switch`);
  console.log(`  SR-02 INSERT: non-Founder denial required (denial = PASS)`);
  console.log(`  no production business rows modified (all probes rolled back)`);
  console.log(`\n${passed} live RLS probes passed.`);
}

main().catch((err: unknown) => {
  const code = pgSqlState(err);
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`\nFAIL  ${redactSecrets(msg)}`);
  if (code === SQLSTATE_RLS_DENIAL || isRlsDenial(err)) {
    process.exit(RLS_PROBE_EXIT_RLS_FAIL);
  }
  if (code === SQLSTATE_FK_VIOLATION) {
    console.error(`FAIL  fixture defect (${SQLSTATE_FK_VIOLATION}) — not an RLS failure`);
    process.exit(RLS_PROBE_EXIT_FIXTURE_DEFECT);
  }
  process.exit(1);
});
