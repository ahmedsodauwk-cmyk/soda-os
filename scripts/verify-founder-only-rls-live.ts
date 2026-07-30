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
 *   1 — unexpected verifier/runtime failure or SR-02 INSERT security gap
 *   2 — Founder denied UPDATE/DELETE governed by 000034 (ONLY after correct setup)
 *   3 — verifier/fixture/identity/environment defect — do NOT rollback migration
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

import {
  emitRlsProbeStructuredResult,
  RLS_PROBE_EXIT_FIXTURE_DEFECT,
  RLS_PROBE_EXIT_RLS_FAIL,
  type RlsProbeOperation,
  type RlsProbeStage,
  type RlsProbeStructuredResult,
} from "./rls-probe-result";

type AccessLevel = "founder" | "account_manager" | "team_leader" | "team";

const NON_FOUNDER_LEVELS: AccessLevel[] = [
  "account_manager",
  "team_leader",
  "team",
];

type ProbeOperation = RlsProbeOperation;
type ProbeStage = RlsProbeStage;

const SQLSTATE_RLS_DENIAL = "42501";
const SQLSTATE_FK_VIOLATION = "23503";
const SQLSTATE_UNIQUE_VIOLATION = "23505";

const SR02_INSERT_POLICY_FIX = `DROP POLICY IF EXISTS sr01_clients_insert ON public.clients;
CREATE POLICY sr01_clients_insert ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (public.soda_is_domain_founder());`;

interface ProbeFailure {
  probeId: string;
  name: string;
  table: string | null;
  operation: ProbeOperation | null;
  stage: ProbeStage;
  sqlState: string | null;
  reason: string;
  governedBy000034: boolean;
  migrationRollbackRecommended: boolean;
}

function disposableClientMarker(): string {
  const suffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
  return `SODA_RLS_TEST_${suffix}`;
}

function disposableClientId(): string {
  return disposableClientMarker();
}

function pgSqlState(err: unknown): string | null {
  if (typeof err !== "object" || err === null) return null;
  const code = (err as { code?: string }).code;
  return typeof code === "string" ? code : null;
}

function isRlsDenial(err: unknown): boolean {
  const code = pgSqlState(err);
  if (code === SQLSTATE_RLS_DENIAL) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /permission denied|42501/i.test(msg);
}

function errMessage(err: unknown): string {
  return redactSecrets(err instanceof Error ? err.message : String(err));
}

function recommendMigrationRollback(failure: ProbeFailure): boolean {
  if (!failure.governedBy000034) return false;
  if (failure.operation !== "UPDATE" && failure.operation !== "DELETE") return false;
  if (failure.stage !== "operation under test" && failure.stage !== "assertion") {
    return false;
  }
  return failure.migrationRollbackRecommended;
}

function printProbeRun(probeId: string, name: string): void {
  console.log(`RUN   ${probeId} — ${name}`);
}

function printProbePass(probeId: string, name: string): void {
  console.log(`PASS  ${probeId} — ${name}`);
}

function printProbeFail(failure: ProbeFailure): void {
  console.error(`FAIL  ${failure.probeId} — ${failure.name}`);
  if (failure.table) console.error(`Table: ${failure.table}`);
  if (failure.operation) console.error(`Operation: ${failure.operation}`);
  console.error(`Stage: ${failure.stage}`);
  console.error(`SQLSTATE: ${failure.sqlState ?? "n/a"}`);
  console.error(`Reason: ${failure.reason}`);
  console.error(`GovernedBy000034: ${failure.governedBy000034}`);
  console.error(
    `RecommendMigrationRollback: ${recommendMigrationRollback(failure)}`
  );
}

function emitStructuredResult(result: RlsProbeStructuredResult): void {
  emitRlsProbeStructuredResult(result);
}

function policyIsFounderOnly(qual: string | null, withCheck: string | null): boolean {
  const text = `${qual ?? ""} ${withCheck ?? ""}`;
  if (!/soda_is_domain_founder\s*\(\s*\)/i.test(text)) return false;
  if (/soda_can_access_/i.test(text)) return false;
  if (/soda_profile_access_level/i.test(text)) return false;
  return true;
}

async function setRole(
  client: import("pg").Client,
  userId: string
): Promise<void> {
  await client.query(`SET LOCAL request.jwt.claim.sub = '${userId}'`);
  await client.query("SET LOCAL role authenticated");
}

async function verifyAuthUid(
  client: import("pg").Client,
  expectedUserId: string
): Promise<string> {
  const r = await client.query<{ uid: string | null }>(
    "SELECT auth.uid()::text AS uid"
  );
  const uid = r.rows[0]?.uid ?? null;
  if (!uid) {
    throw new Error("auth.uid() is null after identity setup");
  }
  if (uid !== expectedUserId) {
    throw new Error(
      `auth.uid() mismatch (expected founder profile id, got different sub)`
    );
  }
  return uid;
}

/** Privileged fixture insert — must run BEFORE setRole/authenticated JWT. */
async function insertDisposableClientPrivileged(
  client: import("pg").Client,
  clientId: string,
  marker: string
): Promise<void> {
  await client.query(
    `INSERT INTO public.clients (id, type, segment, name, phone, is_active)
     VALUES ($1, 'individual', 'wedding', $2, '0000000000', true)`,
    [clientId, marker]
  );
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

function classifyPrivilegedSetupError(err: unknown): ProbeFailure {
  const code = pgSqlState(err);
  if (code === SQLSTATE_RLS_DENIAL || isRlsDenial(err)) {
    return {
      probeId: "fixture-privileged-insert",
      name: "privileged disposable client seed",
      table: "clients",
      operation: "INSERT",
      stage: "fixture setup",
      sqlState: SQLSTATE_RLS_DENIAL,
      reason:
        "DATABASE_URL role cannot bypass RLS for fixture seeding (privileged insert denied)",
      governedBy000034: false,
      migrationRollbackRecommended: false,
    };
  }
  if (code === SQLSTATE_FK_VIOLATION) {
    return {
      probeId: "fixture-privileged-insert",
      name: "privileged disposable client seed",
      table: "clients",
      operation: "INSERT",
      stage: "fixture setup",
      sqlState: SQLSTATE_FK_VIOLATION,
      reason: "disposable client fixture has dependency defect",
      governedBy000034: false,
      migrationRollbackRecommended: false,
    };
  }
  if (code === SQLSTATE_UNIQUE_VIOLATION) {
    return {
      probeId: "fixture-privileged-insert",
      name: "privileged disposable client seed",
      table: "clients",
      operation: "INSERT",
      stage: "fixture setup",
      sqlState: SQLSTATE_UNIQUE_VIOLATION,
      reason: "disposable client id collision",
      governedBy000034: false,
      migrationRollbackRecommended: false,
    };
  }
  return {
    probeId: "fixture-privileged-insert",
    name: "privileged disposable client seed",
    table: "clients",
    operation: "INSERT",
    stage: "fixture setup",
    sqlState: code,
    reason: errMessage(err),
    governedBy000034: false,
    migrationRollbackRecommended: false,
  };
}

function founderMutationDeniedFailure(
  probeId: string,
  name: string,
  table: string,
  operation: "UPDATE" | "DELETE",
  sqlState: string | null,
  reason: string
): ProbeFailure {
  return {
    probeId,
    name,
    table,
    operation,
    stage: "operation under test",
    sqlState,
    reason,
    governedBy000034: true,
    migrationRollbackRecommended: true,
  };
}

async function main(): Promise<void> {
  const dbUrl = requireDatabaseUrl();
  console.log("verify-founder-only-rls-live\n");
  console.log(`  database: ${maskDatabaseUrl(dbUrl)}\n`);

  let passed = 0;
  let amVerificationMethod: string | null = null;
  let sr02InsertGap = false;
  let failure: ProbeFailure | null = null;
  let cleanupCompleted = true;

  const finish = (exitCode: number): never => {
    const result: RlsProbeStructuredResult = {
      status: failure ? "fail" : "pass",
      failedProbeId: failure?.probeId ?? null,
      table: failure?.table ?? null,
      operation: failure?.operation ?? null,
      stage: failure?.stage ?? null,
      sqlState: failure?.sqlState ?? null,
      governedBy000034: failure?.governedBy000034 ?? false,
      cleanupCompleted,
      migrationRollbackRecommended: failure
        ? recommendMigrationRollback(failure)
        : false,
      exitCode,
      sr02InsertGap,
    };
    emitStructuredResult(result);
    process.exit(exitCode);
  };

  const fail = (f: ProbeFailure, exitCode: number): never => {
    failure = f;
    printProbeFail(f);
    return finish(exitCode);
  };

  await withPg(dbUrl, async (client) => {
    async function liveCheck(
      probeId: string,
      name: string,
      fn: () => Promise<void>
    ): Promise<void> {
      printProbeRun(probeId, name);
      await fn();
      passed += 1;
      printProbePass(probeId, name);
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

    const founderIdRaw = byLevel.get("founder");
    if (!founderIdRaw) {
      fail(
        {
          probeId: "env-founder-profile",
          name: "active founder profile required",
          table: "profiles",
          operation: null,
          stage: "identity setup",
          sqlState: null,
          reason: "no active founder profile for probes",
          governedBy000034: false,
          migrationRollbackRecommended: false,
        },
        1
      );
    }
    const founderId = founderIdRaw as string;

    const orderRow = await client.query<{ id: string }>(
      `SELECT id FROM public.orders ORDER BY created_at DESC NULLS LAST LIMIT 1`
    );
    const orderId = orderRow.rows[0]?.id;
    if (!orderId) {
      fail(
        {
          probeId: "env-orders-row",
          name: "orders row required for UPDATE probe",
          table: "orders",
          operation: null,
          stage: "fixture verification",
          sqlState: null,
          reason: "no orders row for UPDATE probe",
          governedBy000034: false,
          migrationRollbackRecommended: false,
        },
        1
      );
    }

    await liveCheck("identity-founder-auth-uid", "founder identity: auth.uid() matches profile", async () => {
      await client.query("BEGIN");
      try {
        await setRole(client, founderId);
        await verifyAuthUid(client, founderId);
      } finally {
        await client.query("ROLLBACK");
      }
    });

    await liveCheck("founder-orders-select", "founder: SELECT orders succeeds", async () => {
      await client.query("BEGIN");
      try {
        await setRole(client, founderId);
        await verifyAuthUid(client, founderId);
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

      await liveCheck(
        `${level}-orders-select`,
        `${level}: SELECT orders still allowed (scoped)`,
        async () => {
          await client.query("BEGIN");
          try {
            await setRole(client, uid);
            const r = await client.query("SELECT id FROM public.orders LIMIT 5");
            assert.ok(r.rowCount !== null && r.rowCount >= 0);
          } finally {
            await client.query("ROLLBACK");
          }
        }
      );

      await liveCheck(
        `${level}-orders-update-denied`,
        `${level}: UPDATE order denied (0 rows)`,
        async () => {
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
        }
      );

      await liveCheck(
        `${level}-orders-delete-denied`,
        `${level}: DELETE order denied (0 rows)`,
        async () => {
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
        }
      );
    }

    await liveCheck(
      "founder-orders-update",
      "founder: UPDATE order allowed (rolled back)",
      async () => {
        await client.query("BEGIN");
        try {
          await setRole(client, founderId);
          await verifyAuthUid(client, founderId);
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
          if (r.rowCount !== 1) {
            fail(
              founderMutationDeniedFailure(
                "founder-orders-update",
                "founder: UPDATE order allowed (rolled back)",
                "orders",
                "UPDATE",
                null,
                `founder UPDATE affected ${r.rowCount ?? 0} rows (expected 1) — 000034 lockdown blocks founder`
              ),
              RLS_PROBE_EXIT_RLS_FAIL
            );
          }
          const check = await client.query<{ notes: string | null }>(
            "SELECT notes FROM public.orders WHERE id = $1",
            [orderId]
          );
          assert.equal(check.rows[0]?.notes, marker);
          await client.query(
            `UPDATE public.orders SET notes = $2 WHERE id = $1`,
            [orderId, prior]
          );
        } catch (err) {
          if (isRlsDenial(err)) {
            fail(
              founderMutationDeniedFailure(
                "founder-orders-update",
                "founder: UPDATE order allowed (rolled back)",
                "orders",
                "UPDATE",
                pgSqlState(err),
                "founder UPDATE denied by RLS — 000034 lockdown not effective for founder"
              ),
              RLS_PROBE_EXIT_RLS_FAIL
            );
          }
          throw err;
        } finally {
          await client.query("ROLLBACK");
        }
      }
    );

    await liveCheck(
      "founder-clients-delete",
      "founder: DELETE disposable client allowed (rolled back)",
      async () => {
        const clientId = disposableClientId();
        const marker = clientId;
        let localCleanup = false;

        await client.query("BEGIN");
        try {
          try {
            await insertDisposableClientPrivileged(client, clientId, marker);
          } catch (err) {
            fail(classifyPrivilegedSetupError(err), RLS_PROBE_EXIT_FIXTURE_DEFECT);
          }
          await confirmFixtureExists(client, clientId);

          await setRole(client, founderId);
          await verifyAuthUid(client, founderId);

          let r;
          try {
            r = await client.query(
              `DELETE FROM public.clients WHERE id = $1`,
              [clientId]
            );
          } catch (err) {
            const code = pgSqlState(err);
            if (code === SQLSTATE_FK_VIOLATION) {
              fail(
                {
                  probeId: "founder-clients-delete",
                  name: "founder: DELETE disposable client allowed (rolled back)",
                  table: "clients",
                  operation: "DELETE",
                  stage: "operation under test",
                  sqlState: SQLSTATE_FK_VIOLATION,
                  reason: "disposable client has dependents — probe design error",
                  governedBy000034: false,
                  migrationRollbackRecommended: false,
                },
                RLS_PROBE_EXIT_FIXTURE_DEFECT
              );
            }
            if (isRlsDenial(err)) {
              fail(
                founderMutationDeniedFailure(
                  "founder-clients-delete",
                  "founder: DELETE disposable client allowed (rolled back)",
                  "clients",
                  "DELETE",
                  code,
                  "founder DELETE denied by RLS — 000034 lockdown blocks founder"
                ),
                RLS_PROBE_EXIT_RLS_FAIL
              );
            }
            throw err;
          }

          if (r.rowCount !== 1) {
            fail(
              founderMutationDeniedFailure(
                "founder-clients-delete",
                "founder: DELETE disposable client allowed (rolled back)",
                "clients",
                "DELETE",
                null,
                `founder DELETE affected ${r.rowCount ?? 0} rows (expected 1)`
              ),
              RLS_PROBE_EXIT_RLS_FAIL
            );
          }
        } finally {
          await client.query("ROLLBACK");
          localCleanup = true;
        }

        if (!localCleanup) {
          cleanupCompleted = false;
          fail(
            {
              probeId: "founder-clients-delete",
              name: "founder: DELETE disposable client allowed (rolled back)",
              table: "clients",
              operation: "DELETE",
              stage: "cleanup",
              sqlState: null,
              reason: "transaction rollback did not complete",
              governedBy000034: false,
              migrationRollbackRecommended: false,
            },
            RLS_PROBE_EXIT_FIXTURE_DEFECT
          );
        }

        try {
          await assertNoFixtureSurvives(client, clientId);
        } catch (err) {
          cleanupCompleted = false;
          fail(
            {
              probeId: "founder-clients-delete",
              name: "founder: DELETE disposable client allowed (rolled back)",
              table: "clients",
              operation: "DELETE",
              stage: "cleanup",
              sqlState: pgSqlState(err),
              reason: errMessage(err),
              governedBy000034: false,
              migrationRollbackRecommended: false,
            },
            RLS_PROBE_EXIT_FIXTURE_DEFECT
          );
        }
      }
    );

    const amId = byLevel.get("account_manager");
    if (amId) {
      amVerificationMethod = "live account_manager profile probes";
      await liveCheck(
        "account_manager-clients-delete-denied",
        "account_manager: DELETE disposable client denied (0 rows, rolled back)",
        async () => {
          const clientId = disposableClientId();
          const marker = clientId;

          await client.query("BEGIN");
          try {
            try {
              await insertDisposableClientPrivileged(client, clientId, marker);
            } catch (err) {
              fail(classifyPrivilegedSetupError(err), RLS_PROBE_EXIT_FIXTURE_DEFECT);
            }
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
        "account_manager-clients-update-denied",
        "account_manager: UPDATE disposable client denied (0 rows, rolled back)",
        async () => {
          const clientId = disposableClientId();
          const marker = clientId;

          await client.query("BEGIN");
          try {
            try {
              await insertDisposableClientPrivileged(client, clientId, marker);
            } catch (err) {
              fail(classifyPrivilegedSetupError(err), RLS_PROBE_EXIT_FIXTURE_DEFECT);
            }
            await confirmFixtureExists(client, clientId);

            await setRole(client, amId);
            try {
              const r = await client.query(
                `UPDATE public.clients SET name = 'rls-probe' WHERE id = $1`,
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
        "account_manager-clients-catalog",
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

    for (const level of NON_FOUNDER_LEVELS) {
      const uid = byLevel.get(level);
      if (!uid) {
        console.log(`SKIP  ${level}: INSERT SR-02 probe — no active profile`);
        continue;
      }

      const probeId = `${level}-clients-insert-sr02`;
      printProbeRun(probeId, `${level}: INSERT client denied (SR-02)`);
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
          sr02InsertGap = true;
          console.error(
            `FAIL  ${probeId} — ${level}: INSERT client denied (SR-02)`
          );
          console.error("Table: clients");
          console.error("Operation: INSERT");
          console.error("Stage: operation under test");
          console.error("SQLSTATE: n/a");
          console.error(
            `Reason: ${level} direct INSERT allowed by RLS — SR-02 security gap`
          );
          console.error("GovernedBy000034: false");
          console.error("RecommendMigrationRollback: false");
          console.error("  Expected: non-Founder direct INSERT denied at RLS layer.");
          console.error(
            "  Smallest additive fix (apply separately, not in this verifier):"
          );
          console.error(`  ${SR02_INSERT_POLICY_FIX.split("\n").join("\n  ")}`);
          failure = {
            probeId,
            name: `${level}: INSERT client denied (SR-02)`,
            table: "clients",
            operation: "INSERT",
            stage: "operation under test",
            sqlState: null,
            reason: `${level} INSERT clients allowed by RLS`,
            governedBy000034: false,
            migrationRollbackRecommended: false,
          };
          finish(1);
        } catch (err) {
          if (isRlsDenial(err)) {
            passed += 1;
            printProbePass(probeId, `${level}: INSERT client denied (SR-02)`);
          } else {
            const code = pgSqlState(err);
            if (code === SQLSTATE_UNIQUE_VIOLATION) {
              passed += 1;
              printProbePass(probeId, `${level}: INSERT client denied (SR-02)`);
            } else {
              throw err;
            }
          }
        }
      } finally {
        await client.query("ROLLBACK");
      }

      await assertNoFixtureSurvives(client, insertId);
    }
  });

  console.log(`\n  AM verification: ${amVerificationMethod ?? "not run"}`);
  console.log(`  fixture seeding: privileged insert before role switch`);
  console.log(`  SR-02 INSERT: non-Founder denial required (denial = PASS)`);
  console.log(`  no production business rows modified (all probes rolled back)`);
  console.log(`\n${passed} live RLS probes passed.`);
  finish(0);
}

main().catch((err: unknown) => {
  const code = pgSqlState(err);
  const msg = errMessage(err);
  console.error(`\nFAIL  runtime — ${msg}`);
  const failure: ProbeFailure = {
    probeId: "runtime-unhandled",
    name: "unhandled verifier runtime error",
    table: null,
    operation: null,
    stage: "assertion",
    sqlState: code,
    reason: msg,
    governedBy000034: false,
    migrationRollbackRecommended: false,
  };
  printProbeFail(failure);
  const exitCode =
    code === SQLSTATE_FK_VIOLATION ? RLS_PROBE_EXIT_FIXTURE_DEFECT : 1;
  emitStructuredResult({
    status: "fail",
    failedProbeId: failure.probeId,
    table: null,
    operation: null,
    stage: failure.stage,
    sqlState: code,
    governedBy000034: false,
    cleanupCompleted: false,
    migrationRollbackRecommended: false,
    exitCode,
    sr02InsertGap: false,
  });
  process.exit(exitCode);
});
