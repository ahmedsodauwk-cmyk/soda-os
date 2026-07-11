/**
 * CLI health check — run: npx tsx scripts/check-supabase.ts
 * (or: node --import tsx scripts/check-supabase.ts)
 *
 * Does not require tables. Reports whether env is set and API is reachable.
 */

import { checkSupabaseConnection } from "../lib/supabase/health";

async function main() {
  const result = await checkSupabaseConnection();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
