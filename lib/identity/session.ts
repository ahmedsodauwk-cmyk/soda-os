/**
 * Session + profile resolution for SODA identity.
 * Authorization uses Access Level — never role/job-title, never owner fallback.
 */

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import {
  accessLevelCan,
  parseAccessLevel,
  permissionsForAccessLevel,
  resolveAccessLevel,
  type AccessLevel,
} from "@/lib/identity/access-levels";
import {
  parseSodaRole,
  ROLE_LABELS,
  type SodaRole,
} from "@/lib/identity/roles";
import type { Permission } from "@/lib/identity/permissions";
import {
  homePathForPermissions,
} from "@/lib/identity/nav";
import { permissionsForAsync } from "@/lib/identity/permission-service";

export type SodaProfile = {
  id: string;
  email: string;
  /** Login username (local-part); may match email local-part. */
  username: string | null;
  /** Display name for greetings — never role. Mirrors full_name. */
  fullName: string;
  /**
   * Preferred greeting name (same as fullName until a dedicated column exists).
   * Human Experience Layer always uses this over role labels.
   */
  displayName: string;
  /** Legacy / operational role label — NOT used for authorization. */
  role: SodaRole;
  /** Authorization tier — Source of Truth for nav & gates. */
  accessLevel: AccessLevel;
  personId: string | null;
  avatarInitials: string;
  isActive: boolean;
  /** When true, AppShell forces /settings/password until cleared. */
  mustChangePassword: boolean;
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
  access_level?: string | null;
  person_id: string | null;
  is_active: boolean | null;
  username?: string | null;
  must_change_password?: boolean | null;
};

const PROFILE_SELECT_FULL =
  "id, email, full_name, role, access_level, person_id, is_active, username, must_change_password";
const PROFILE_SELECT_LEGACY =
  "id, email, full_name, role, person_id, is_active";

/**
 * Map DB row → profile.
 * Unresolved role → crew_member (NOT owner). Access Level derived; never founder from null.
 */
function mapProfileRow(
  row: ProfileRow,
  emailFallback: string,
  roleFallback: SodaRole = "crew_member"
): SodaProfile {
  const email = row.email ?? emailFallback;
  const name = row.full_name?.trim() || email.split("@")[0] || "User";
  const username =
    row.username?.trim() ||
    (email.includes("@") ? email.split("@")[0]! : null);
  const role = parseSodaRole(row.role, roleFallback);
  const accessLevel = resolveAccessLevel({
    accessLevel: row.access_level,
    role: row.role ?? role,
  });
  return {
    id: row.id,
    email,
    username,
    fullName: name,
    displayName: name,
    role,
    accessLevel,
    personId: row.person_id,
    avatarInitials: initialsFrom(name, email),
    isActive: row.is_active !== false,
    mustChangePassword: row.must_change_password === true,
  };
}

async function fetchProfileRow(
  userId: string
): Promise<{ row: ProfileRow | null; recursion: boolean }> {
  try {
    const supabase = await createClient();
    const full = await supabase
      .from("profiles")
      .select(PROFILE_SELECT_FULL)
      .eq("id", userId)
      .maybeSingle();

    if (!full.error && full.data) {
      return { row: full.data as ProfileRow, recursion: false };
    }

    const recursion =
      !!full.error &&
      /42P17|infinite recursion|recursion detected/i.test(full.error.message);

    // Columns may be missing until access-level migration is applied.
    const legacy = await supabase
      .from("profiles")
      .select(PROFILE_SELECT_LEGACY)
      .eq("id", userId)
      .maybeSingle();

    if (!legacy.error && legacy.data) {
      return { row: legacy.data as ProfileRow, recursion: false };
    }

    const legacyRecursion =
      !!legacy.error &&
      /42P17|infinite recursion|recursion detected/i.test(legacy.error.message);

    return { row: null, recursion: recursion || legacyRecursion };
  } catch {
    return { row: null, recursion: false };
  }
}

async function ensureProfile(
  userId: string,
  email: string,
  fullName?: string | null
): Promise<SodaProfile | null> {
  const fetched = await fetchProfileRow(userId);
  if (fetched.row) {
    return mapProfileRow(fetched.row, email);
  }

  const name =
    fullName?.trim() || email.split("@")[0] || ROLE_LABELS.crew_member;
  const username = email.includes("@") ? email.split("@")[0]! : null;

  // Recursive profiles RLS (42P17) — SELECT always fails; inserting cannot heal it.
  // Soft Team session breaks middleware↔shell /login redirect loop. Never invent Founder.
  if (fetched.recursion) {
    console.error(
      "[session] profiles RLS recursion (42P17); soft Team session to stop redirect loop"
    );
    return {
      id: userId,
      email,
      username,
      fullName: name,
      displayName: name,
      role: "crew_member",
      accessLevel: "team",
      personId: null,
      avatarInitials: initialsFrom(name, email),
      isActive: true,
      mustChangePassword: false,
    };
  }

  const supabase = await createClient();

  // First profile in the system becomes Founder; later self-signups default to Team.
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  const isFirst = (count ?? 0) === 0;
  const role: SodaRole = isFirst ? "founder" : "crew_member";
  const accessLevel: AccessLevel = isFirst ? "founder" : "team";
  const resolvedName =
    fullName?.trim() || email.split("@")[0] || ROLE_LABELS[role];

  const insertPayload: Record<string, unknown> = {
    id: userId,
    email,
    full_name: resolvedName,
    role,
    access_level: accessLevel,
    is_active: true,
  };

  insertPayload.username = username;
  insertPayload.must_change_password = false;

  let inserted: ProfileRow | null = null;
  let error: { message: string } | null = null;

  {
    const result = await supabase
      .from("profiles")
      .insert(insertPayload)
      .select(PROFILE_SELECT_FULL)
      .maybeSingle();
    if (!result.error && result.data) {
      inserted = result.data as ProfileRow;
    } else {
      const legacyInsert = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email,
          full_name: resolvedName,
          role,
          is_active: true,
        })
        .select(PROFILE_SELECT_LEGACY)
        .maybeSingle();
      error = legacyInsert.error;
      inserted = legacyInsert.data as ProfileRow | null;
    }
  }

  if (error || !inserted) {
    // NEVER invent Founder/owner grants when profile write fails.
    if (isAuthStrict()) return null;
    // Local/dev soft profile — Team only (deny company admin).
    return {
      id: userId,
      email,
      username,
      fullName: resolvedName,
      displayName: resolvedName,
      role: "crew_member",
      accessLevel: "team",
      personId: null,
      avatarInitials: initialsFrom(resolvedName, email),
      isActive: true,
      mustChangePassword: false,
    };
  }

  return mapProfileRow(inserted, email, role);
}

/** Verified session + profile. Null when signed out. Deduped per request. */
export const getSodaSession = cache(async (): Promise<SodaSession | null> => {
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

    // Coerce — never null an authenticated profile (middleware↔login redirect loop).
    const accessLevel =
      parseAccessLevel(profile.accessLevel) ??
      resolveAccessLevel({ role: profile.role });

    return {
      userId: data.user.id,
      email,
      profile: { ...profile, accessLevel },
    };
  } catch {
    return null;
  }
});

export async function requireSodaSession(): Promise<SodaSession> {
  const session = await getSodaSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

/** Sync permission check — Access Level only. */
export function sessionCan(
  session: SodaSession | null,
  permission: Permission
): boolean {
  if (!session) return false;
  return accessLevelCan(session.profile.accessLevel, permission);
}

export function sessionHome(session: SodaSession): string {
  return homePathForPermissions(
    permissionsForAccessLevel(session.profile.accessLevel)
  );
}

/** Async home — prefers DB permission set keyed by Access Level. */
export async function sessionHomeAsync(session: SodaSession): Promise<string> {
  const { permissions } = await permissionsForAsync(
    session.profile.accessLevel
  );
  if (permissions.length > 0) {
    return homePathForPermissions(permissions);
  }
  return homePathForPermissions(
    permissionsForAccessLevel(session.profile.accessLevel)
  );
}

/**
 * Local/dev fallback ONLY when auth is not configured.
 * Strict production never uses this. Kept as Founder for solo local setup.
 */
export function fallbackOwnerSession(): SodaSession {
  return {
    userId: "local-owner",
    email: "owner@sodavisuals.com",
    profile: {
      id: "local-owner",
      email: "owner@sodavisuals.com",
      username: "owner",
      fullName: "جونيور صودا",
      displayName: "جونيور صودا",
      role: "owner",
      accessLevel: "founder",
      personId: null,
      avatarInitials: "جص",
      isActive: true,
      mustChangePassword: false,
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
 * Non-strict: local founder fallback so local/dev keeps working before Auth enable.
 * Deduped per request via getSodaSession cache.
 */
export const resolveSessionForApp = cache(
  async (): Promise<SodaSession | null> => {
    const session = await getSodaSession();
    if (session) return session;
    if (!isAuthStrict()) return fallbackOwnerSession();
    return null;
  }
);
