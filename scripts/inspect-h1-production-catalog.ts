/**
 * Read-only Production catalog inspection for H1 partial-apply state.
 * Never prints secrets, emails, or row data.
 *
 * Run: npx tsx scripts/inspect-h1-production-catalog.ts
 */
import { loadEnvLocal, maskSecret } from "./load-env-local";

function projectRefFromUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.split(".")[0] || undefined;
  } catch {
    return undefined;
  }
}

async function resolveConnectionString(): Promise<string | null> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const password =
    process.env.SUPABASE_DB_PASSWORD?.trim() ||
    process.env.POSTGRES_PASSWORD?.trim();
  const ref = projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);

  if (databaseUrl) return databaseUrl;
  if (password && ref) {
    return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
  }
  return null;
}

async function queryCatalog(connectionString: string) {
  const { default: pg } = await import("pg");
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    const personId = await client.query(`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'person_id'
    `);

    const functions = await client.query(`
      SELECT p.proname
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname IN (
          'connect_list_directory_peers',
          'connect_get_peers_by_ids',
          'connect_shares_active_conversation'
        )
      ORDER BY 1
    `);

    const policy = await client.query(`
      SELECT count(*)::int AS cnt
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'profiles'
        AND policyname = 'profiles_select_connect_peers'
    `);

    return {
      personIdType: personId.rows[0]?.data_type ?? "(missing)",
      h1Functions: functions.rows.map((r) => r.proname as string),
      legacyPolicyCount: policy.rows[0]?.cnt ?? 0,
    };
  } finally {
    await client.end();
  }
}

async function main() {
  loadEnvLocal();
  console.log("=== H1 Production catalog (read-only) ===");
  console.log(`  DATABASE_URL: ${maskSecret(process.env.DATABASE_URL)}`);
  console.log(
    `  project ref: ${projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) ?? "(unknown)"}`
  );

  const cs = await resolveConnectionString();
  if (!cs) {
    console.log("\nSKIPPED: no DATABASE_URL or SUPABASE_DB_PASSWORD.");
    process.exit(2);
  }

  try {
    const catalog = await queryCatalog(cs);
    console.log(`\nprofiles.person_id type: ${catalog.personIdType}`);
    console.log(
      `H1 functions present: ${catalog.h1Functions.length ? catalog.h1Functions.join(", ") : "(none)"}`
    );
    console.log(
      `profiles_select_connect_peers policy count: ${catalog.legacyPolicyCount}`
    );

    if (catalog.h1Functions.length === 0 && catalog.legacyPolicyCount > 0) {
      console.log("\nPartial apply: NO — H1 not applied (legacy policy intact).");
    } else if (catalog.h1Functions.length > 0 && catalog.h1Functions.length < 3) {
      console.log("\nPartial apply: POSSIBLE — some H1 functions exist.");
    } else if (catalog.h1Functions.length === 3 && catalog.legacyPolicyCount === 0) {
      console.log("\nPartial apply: FULL — H1 already applied.");
    } else {
      console.log("\nPartial apply: indeterminate — review counts above.");
    }
  } catch (err) {
    console.error(
      `Catalog query failed: ${err instanceof Error ? err.message : err}`
    );
    process.exit(1);
  }
}

main();
