/**
 * Mission 04.3 — Founder-authorized create of Reference Client **RTM**.
 *
 * NOT a smoke / seed / demo script.
 * Creates ONE Client named exactly "RTM" with no invented business fields.
 * Idempotent: if a client named "RTM" already exists, returns it and creates nothing else.
 *
 * Policy: docs/SODA_MASTER/FOUNDER_DATA_POLICY.md
 *
 * Required env:
 *   SODA_FOUNDER_CREATE_RTM=1
 *   When targeting Production Supabase, also:
 *   SODA_CONFIRM_PRODUCTION_RTM=1
 *
 * Run (PowerShell):
 *   $env:SODA_FOUNDER_CREATE_RTM="1"; $env:SODA_CONFIRM_PRODUCTION_RTM="1"; npm run founder:create-rtm
 *
 * Uses PostgREST directly (curl) so the create path stays reliable when Node
 * fetch to Supabase hangs on some Windows environments. Payload matches
 * `createClient` / `clientToRow` schema — no fake phone/email/notes.
 */

import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";

import { getSupabaseAnonKey, getSupabaseUrl } from "../lib/supabase/env";
import { isProductionSupabaseUrl } from "./assert-non-production";
import { loadEnvLocal, maskSecret } from "./load-env-local";

const REFERENCE_CLIENT_NAME = "RTM";

type ClientListRow = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  segment?: string;
  type?: string;
  is_active?: boolean;
  created_at?: string;
};

function assertFounderAuthorized(url: string | undefined): void {
  if (process.env.SODA_FOUNDER_CREATE_RTM !== "1") {
    throw new Error(
      "[create-founder-rtm-client] REFUSED: set SODA_FOUNDER_CREATE_RTM=1. " +
        "This is an intentional Founder Reference Client create — not smoke."
    );
  }

  if (isProductionSupabaseUrl(url)) {
    if (process.env.SODA_CONFIRM_PRODUCTION_RTM !== "1") {
      throw new Error(
        "[create-founder-rtm-client] REFUSED: Production Supabase detected. " +
          "Set SODA_CONFIRM_PRODUCTION_RTM=1 to create RTM on Production intentionally. " +
          "See docs/SODA_MASTER/FOUNDER_DATA_POLICY.md"
      );
    }
    console.warn(
      "[create-founder-rtm-client] Production write authorized by Founder flags. " +
        "Creating Reference Client RTM only — no projects/orders/finance."
    );
  }
}

function restGetClients(url: string, anon: string): ClientListRow[] {
  const endpoint =
    `${url}/rest/v1/clients?select=id,name,phone,email,segment,type,is_active,created_at` +
    `&order=created_at.desc`;
  let out: string;
  try {
    out = execFileSync(
      "curl.exe",
      [
        "-sS",
        "--ssl-no-revoke",
        "-H",
        `apikey: ${anon}`,
        "-H",
        `Authorization: Bearer ${anon}`,
        endpoint,
      ],
      { encoding: "utf8", windowsHide: true }
    );
  } catch (err) {
    throw new Error(
      `Failed to list clients via curl (ssl/network). ${err instanceof Error ? err.message.split("\n")[0] : err}`
    );
  }
  const parsed = JSON.parse(out) as ClientListRow[] | { message?: string; code?: string };
  if (!Array.isArray(parsed)) {
    throw new Error(`Failed to list clients: ${JSON.stringify(parsed)}`);
  }
  return parsed;
}

function restCreateRtm(
  url: string,
  anon: string,
  id: string,
  createdAt: string
): ClientListRow {
  const body = JSON.stringify({
    id,
    type: "company",
    segment: "commercial",
    name: REFERENCE_CLIENT_NAME,
    phone: "",
    email: null,
    contact_person: null,
    company: null,
    logo_url: null,
    avatar_url: null,
    notes: null,
    contacts: [],
    is_active: true,
    created_at: createdAt,
  });

  let out: string;
  try {
    out = execFileSync(
      "curl.exe",
      [
        "-sS",
        "--ssl-no-revoke",
        "-X",
        "POST",
        "-H",
        `apikey: ${anon}`,
        "-H",
        `Authorization: Bearer ${anon}`,
        "-H",
        "Content-Type: application/json",
        "-H",
        "Prefer: return=representation",
        "-d",
        body,
        `${url}/rest/v1/clients`,
      ],
      { encoding: "utf8", windowsHide: true }
    );
  } catch (err) {
    throw new Error(
      `Failed to create RTM via curl. ${err instanceof Error ? err.message.split("\n")[0] : err}`
    );
  }

  const parsed = JSON.parse(out) as ClientListRow[] | { message?: string };
  if (!Array.isArray(parsed) || !parsed[0]) {
    throw new Error(`Failed to create RTM: ${out.slice(0, 200)}`);
  }
  return parsed[0];
}

function main() {
  loadEnvLocal();
  const url = getSupabaseUrl();
  const anon = getSupabaseAnonKey();
  assertFounderAuthorized(url);

  if (!url || !anon) {
    throw new Error(
      "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
  }

  console.log("=== Founder Reference Client: RTM ===");
  console.log(`  URL: ${maskSecret(url)}`);
  console.log(`  production_target: ${isProductionSupabaseUrl(url)}`);

  const before = restGetClients(url, anon);
  const existing = before.find(
    (c) => c.name.trim().toUpperCase() === REFERENCE_CLIENT_NAME
  );

  if (existing) {
    console.log("\nRTM already exists — idempotent no-op.");
    console.log(`  id=${existing.id}`);
    console.log(`  name=${existing.name}`);
    console.log(`  segment=${existing.segment}`);
    console.log(`  phone=${existing.phone ? "(set)" : "(empty)"}`);
    console.log(`  email=${existing.email ?? "(empty)"}`);
    console.log(`\nWorkspace: /clients/${existing.id}`);
    return;
  }

  console.log("\nCreating RTM (minimal Founder payload — no invented fields)…");
  const id = `client-${randomUUID()}`;
  const createdAt = new Date().toISOString();
  const created = restCreateRtm(url, anon, id, createdAt);

  const after = restGetClients(url, anon);
  const beforeIds = new Set(before.map((c) => c.id));
  const added = after.filter((c) => !beforeIds.has(c.id));

  console.log(`  id=${created.id}`);
  console.log(`  name=${created.name}`);
  console.log(`  type=${created.type}`);
  console.log(`  segment=${created.segment}`);
  console.log(`  phone=${created.phone ? "(set)" : "(empty)"}`);
  console.log(`  email=${created.email ?? "(empty)"}`);

  if (added.length !== 1 || added[0]?.id !== created.id) {
    console.warn(
      `WARNING: expected exactly 1 new client (RTM); saw ${added.length} new id(s):`,
      added.map((c) => `${c.id}:${c.name}`)
    );
  } else {
    console.log("\nVerified: only RTM was added among new client records.");
  }

  console.log(`\nWorkspace: /clients/${created.id}`);
  if (isProductionSupabaseUrl(url)) {
    console.log(
      `Production URL: https://soda-os.vercel.app/clients/${created.id}`
    );
  }
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
