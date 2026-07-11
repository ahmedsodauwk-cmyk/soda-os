/**
 * Session + profile resolution for SODA identity.
 */

import { createClient } from "@/lib/supabase/server";
import {
  parseSodaRole,
  ROLE_LABELS,
  type SodaRole,
} from "@/lib/identity/roles";
import { can, type Permission } from "@/lib/identity/permissions";
import { homePathForRole } from "@/lib/identity/nav";

export type SodaProfile = {
  id: string;
  email: string;
  fullName: string;
  role: SodaRole;
  personId: string | null;
  avatarInitials: string;
  isActive: boolean;
};

export type SodaSession = {
  userId: string;
  email: string;
  profile: SodaProfile;
};

function initialsFrom(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0]!.length >= 2) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return (email.slice(0, 2) || "SO").toUpperCase();
}

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  person_id: string | null;
  is_active: boolean | null;
};

async function ensureProfile(
  userId: string,
  email: string,
  fullName?: string | null
): Promise<SodaProfile | null> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, person_id, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    const row = existing as ProfileRow;
    const name = row.full_name?.trim() || email.split("@")[0] || "User";
    return {
      id: row.id,
      email: row.email ?? email,
      fullName: name,
      role: parseSodaRole(row.role, "owner"),
      personId: row.person_id,
      avatarInitials: initialsFrom(name, row.email ?? email),
      isActive: row.is_active !== false,
    };
  }

  // First profile in the system becomes owner; later self-signups default to crew.
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  const role: SodaRole = (count ?? 0) === 0 ? "owner" : "crew_member";
  const name =
    fullName?.trim() || email.split("@")[0] || ROLE_LABELS[role];

  const { data: inserted, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email,
      full_name: name,
      role,
      is_active: true,
    })
    .select("id, email, full_name, role, person_id, is_active")
    .maybeSingle();

  if (error || !inserted) {
    // Table missing or RLS blocked — soft profile for UI until SQL applied.
    return {
      id: userId,
      email,
      fullName: name,
      role: "owner",
      personId: null,
      avatarInitials: initialsFrom(name, email),
      isActive: true,
    };
  }

  const row = inserted as ProfileRow;
  return {
    id: row.id,
    email: row.email ?? email,
    fullName: row.full_name?.trim() || name,
    role: parseSodaRole(row.role, role),
    personId: row.person_id,
    avatarInitials: initialsFrom(row.full_name ?? name, row.email ?? email),
    isActive: row.is_active !== false,
  };
}

/** Verified session + profile. Null when signed out. */
export async function getSodaSession(): Promise<SodaSession | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;

    const email = data.user.email ?? "";
    const profile = await ensureProfile(
      data.user.id,
      email,
      (data.user.user_metadata?.full_name as string | undefined) ??
        (data.user.user_metadata?.name as string | undefined)
    );
    if (!profile || !profile.isActive) return null;

    return {
      userId: data.user.id,
      email,
      profile,
    };
  } catch {
    return null;
  }
}

export async function requireSodaSession(): Promise<SodaSession> {
  const session = await getSodaSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export function sessionCan(
  session: SodaSession | null,
  permission: Permission
): boolean {
  if (!session) return false;
  return can(session.profile.role, permission);
}

export function sessionHome(session: SodaSession): string {
  return homePathForRole(session.profile.role);
}

/** Demo / fallback session when auth is not yet configured (never in production strict). */
export function fallbackOwnerSession(): SodaSession {
  return {
    userId: "local-owner",
    email: "owner@soda.studio",
    profile: {
      id: "local-owner",
      email: "owner@soda.studio",
      fullName: "SODA Owner",
      role: "owner",
      personId: null,
      avatarInitials: "SO",
      isActive: true,
    },
  };
}

export function isAuthStrict(): boolean {
  if (process.env.SODA_AUTH_STRICT === "0") return false;
  if (process.env.SODA_AUTH_STRICT === "1") return true;
  // Strict only on Vercel production — local build/dev keeps owner fallback.
  return process.env.VERCEL_ENV === "production";
}

/**
 * Resolve session for AppShell / pages.
 * Strict: null when signed out (caller redirects).
 * Non-strict: owner fallback so local/dev keeps working before Auth enable.
 */
export async function resolveSessionForApp(): Promise<SodaSession | null> {
  const session = await getSodaSession();
  if (session) return session;
  if (!isAuthStrict()) return fallbackOwnerSession();
  return null;
}
