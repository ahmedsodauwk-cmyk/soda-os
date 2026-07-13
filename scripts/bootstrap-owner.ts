/**
 * Create the first Owner auth user + profile (production bootstrap).
 *
 * IDENTITY ONLY — Auth user + profiles row + owner role.
 * Does NOT create clients, orders, projects, crew, or any business entities.
 * See docs/SODA_MASTER/FOUNDER_DATA_POLICY.md.
 *
 * Run: npm run bootstrap:owner
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Optional: BOOTSTRAP_OWNER_EMAIL, BOOTSTRAP_OWNER_PASSWORD, BOOTSTRAP_OWNER_NAME
 *
 * One-shot: refuses if any active owner profile already exists.
 */
import { createClient } from "@supabase/supabase-js";

import { loadEnvLocal, maskSecret } from "./load-env-local";

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    throw new Error(`Missing ${name}`);
  }
  return v;
}

function defaultPassword(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `Soda-Owner-${rand}!1`;
}

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  console.log("=== Bootstrap first Owner ===");
  console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${maskSecret(url)}`);
  console.log(
    `  SUPABASE_SERVICE_ROLE_KEY: ${maskSecret(serviceKey)}`
  );

  if (!url || url.includes("your-project-ref")) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL in .env.local");
    process.exit(1);
  }
  if (!serviceKey) {
    console.error(`
BLOCKED: SUPABASE_SERVICE_ROLE_KEY is missing.

1. Supabase Dashboard → Project Settings → API → service_role (secret)
2. Add to .env.local:
   SUPABASE_SERVICE_ROLE_KEY=<paste>
3. Vercel → Project → Settings → Environment Variables → add same key
   (Production + Preview) so /bootstrap works on https://soda-os.vercel.app
4. Re-run: npm run bootstrap:owner

OR use Dashboard path (no service role):
  A. SQL Editor → paste/run SODA_IDENTITY_NAV.sql (if not applied)
  B. Authentication → Providers → Email → Enable
  C. Authentication → Users → Add user
     Email: owner@sodavisuals.com  (or your email)
     Password: min 8 chars, include letter + number (e.g. Soda-Owner-ChangeMe1!)
     Auto Confirm User: ON
     User Metadata (JSON): {"full_name":"SODA Owner","role":"owner","username":"owner"}
  D. If profile missing, SQL:
     insert into public.profiles (id, email, full_name, role, is_active, username, must_change_password)
     select id, email, coalesce(raw_user_meta_data->>'full_name','Owner'), 'owner', true,
            lower(split_part(email, '@', 1)), false
     from auth.users
     where email = 'owner@sodavisuals.com'
     on conflict (id) do update set role = 'owner', is_active = true;
  E. Login at https://soda-os.vercel.app/login
`);
    process.exit(1);
  }

  const email =
    process.env.BOOTSTRAP_OWNER_EMAIL?.trim() || "owner@sodavisuals.com";
  const password =
    process.env.BOOTSTRAP_OWNER_PASSWORD?.trim() || defaultPassword();
  const fullName =
    process.env.BOOTSTRAP_OWNER_NAME?.trim() || "SODA Owner";

  if (password.length < 8) {
    console.error("BOOTSTRAP_OWNER_PASSWORD must be at least 8 characters");
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Ensure roles catalog exists (identity migration applied)
  const { data: ownerRole, error: roleErr } = await admin
    .from("roles")
    .select("id")
    .eq("id", "owner")
    .maybeSingle();

  if (roleErr || !ownerRole) {
    console.error(`
Identity SQL not applied (roles.owner missing): ${roleErr?.message ?? "no row"}
Run: npm run db:identity-nav
Or paste SODA_IDENTITY_NAV.sql in Supabase SQL Editor.
`);
    process.exit(1);
  }

  const { count: ownerCount, error: countErr } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "owner")
    .eq("is_active", true);

  if (countErr) {
    console.error(`Cannot read profiles: ${countErr.message}`);
    process.exit(1);
  }
  if ((ownerCount ?? 0) > 0) {
    console.error(
      `Blocked: ${ownerCount} active owner profile(s) already exist. Bootstrap is one-time.`
    );
    process.exit(1);
  }

  const { data: listed } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  const existingUser = listed?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  const username = email.includes("@")
    ? email.split("@")[0]!.toLowerCase()
    : email.toLowerCase();

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
    const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "owner",
        username,
        must_change_password: false,
      },
    });
    if (updErr) {
      console.error(`Failed to update existing user: ${updErr.message}`);
      process.exit(1);
    }
    console.log(`Updated existing auth user ${email}`);
  } else {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "owner",
        username,
        must_change_password: false,
      },
    });
    if (created.error || !created.data.user) {
      console.error(
        `createUser failed: ${created.error?.message ?? "unknown"}`
      );
      process.exit(1);
    }
    userId = created.data.user.id;
    console.log(`Created auth user ${email}`);
  }

  const { error: upsertErr } = await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      full_name: fullName,
      role: "owner",
      is_active: true,
      username,
      must_change_password: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (upsertErr) {
    console.error(`Profile upsert failed: ${upsertErr.message}`);
    process.exit(1);
  }

  // Link permissions: owner role already has all via role_permissions seed.
  const { count: permCount } = await admin
    .from("role_permissions")
    .select("role_id", { count: "exact", head: true })
    .eq("role_id", "owner");

  console.log(`
COMPLETE
  email:    ${email}
  password: ${password}
  user id:  ${userId}
  role:     owner
  owner permissions linked: ${permCount ?? 0}

Login now: https://soda-os.vercel.app/login
Change password after first login: /settings/password
`);
  process.exit(0);
}

void main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
