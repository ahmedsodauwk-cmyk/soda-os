/**
 * Authority Center — account provisioning & lifecycle (Mission 04.4.2).
 * Founder/Admin only. Never creates demo/fake users.
 * Temp password is returned ONCE to the Founder UI and never stored.
 */

"use server";

import { revalidatePath } from "next/cache";

import {
  getCompanyEmailDomain,
  companyEmailForUsername,
} from "@/lib/auth/company-email";
import {
  buildProvisionUserMetadata,
  generateTemporaryPassword,
} from "@/lib/auth/temp-password";
import { can } from "@/lib/identity/permissions";
import { isSodaRole, type SodaRole } from "@/lib/identity/roles";
import { resolveSessionForApp } from "@/lib/identity/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AuthorityActionResult = {
  ok: boolean;
  error?: string;
  message?: string;
  /** Shown once after Create Account / Reset Password — never persisted. */
  credentials?: {
    username: string;
    email: string;
    temporaryPassword: string;
  };
};

async function requireAuthorityOperator() {
  const session = await resolveSessionForApp();
  if (!session || !can(session.profile.role, "settings.users")) {
    return null;
  }
  return session;
}

function revalidateAuthority() {
  revalidatePath("/settings/authority");
  revalidatePath("/settings/permissions");
  revalidatePath("/settings");
  revalidatePath("/people");
}

export type AuthorityAccountRow = {
  id: string;
  email: string | null;
  username: string | null;
  fullName: string | null;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  personId: string | null;
  lastSignInAt: string | null;
  createdAt: string | null;
};

/** List Auth-linked profiles for Authority Center. No fake rows. */
export async function listAuthorityAccounts(): Promise<AuthorityAccountRow[]> {
  const session = await requireAuthorityOperator();
  if (!session) return [];

  try {
    const admin = createAdminClient();
    const { data: profiles, error } = await admin
      .from("profiles")
      .select(
        "id, email, username, full_name, role, is_active, must_change_password, person_id, created_at"
      )
      .order("full_name", { ascending: true });

    if (error || !profiles) return [];

    const authUsers = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const lastSignIn = new Map<string, string | null>();
    for (const u of authUsers.data?.users ?? []) {
      lastSignIn.set(u.id, u.last_sign_in_at ?? null);
    }

    return profiles.map((row) => ({
      id: String(row.id),
      email: typeof row.email === "string" ? row.email : null,
      username: typeof row.username === "string" ? row.username : null,
      fullName: typeof row.full_name === "string" ? row.full_name : null,
      role: typeof row.role === "string" ? row.role : "crew_member",
      isActive: row.is_active !== false,
      mustChangePassword: row.must_change_password === true,
      personId: typeof row.person_id === "string" ? row.person_id : null,
      lastSignInAt: lastSignIn.get(String(row.id)) ?? null,
      createdAt: typeof row.created_at === "string" ? row.created_at : null,
    }));
  } catch {
    return [];
  }
}

/**
 * Create Account from inside SODA OS.
 * Generates username email if needed, issues temp password once, forces change.
 * Does not invent names — Founder supplies them.
 */
export async function createAuthorityAccountAction(input: {
  fullName: string;
  username: string;
  email?: string;
  role: string;
  personId?: string;
}): Promise<AuthorityActionResult> {
  const session = await requireAuthorityOperator();
  if (!session) return { ok: false, error: "Not authorized." };

  const fullName = input.fullName.trim();
  const username = input.username.trim().toLowerCase();
  if (!fullName) return { ok: false, error: "Full name is required." };
  if (!username) return { ok: false, error: "Username is required." };
  if (!isSodaRole(input.role)) return { ok: false, error: "Invalid role." };

  const domain = await getCompanyEmailDomain();
  const email = (
    input.email?.trim() || companyEmailForUsername(username, domain)
  ).toLowerCase();

  try {
    const admin = createAdminClient();

    const { data: existingUser } = await admin
      .from("profiles")
      .select("id")
      .or(`username.eq.${username},email.eq.${email}`)
      .maybeSingle();
    if (existingUser?.id) {
      return {
        ok: false,
        error: "Username or email already exists.",
      };
    }

    const temp = generateTemporaryPassword();
    const meta = buildProvisionUserMetadata({
      full_name: fullName,
      role: input.role,
      username,
    });

    const created = await admin.auth.admin.createUser({
      email,
      password: temp,
      email_confirm: true,
      user_metadata: meta,
    });

    if (created.error || !created.data.user) {
      return {
        ok: false,
        error: created.error?.message ?? "Failed to create account.",
      };
    }

    const profilePatch: Record<string, unknown> = {
      id: created.data.user.id,
      email,
      full_name: fullName,
      role: input.role as SodaRole,
      is_active: true,
      username,
      must_change_password: true,
    };
    if (input.personId?.trim()) {
      profilePatch.person_id = input.personId.trim();
    }

    const { error: profileErr } = await admin
      .from("profiles")
      .upsert(profilePatch);
    if (profileErr) {
      return { ok: false, error: profileErr.message };
    }

    revalidateAuthority();
    return {
      ok: true,
      message:
        "Account created. Copy credentials now — the temporary password will not be shown again.",
      credentials: {
        username,
        email,
        temporaryPassword: temp,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message.includes("SUPABASE_SERVICE_ROLE_KEY")
            ? "Server admin key is not configured."
            : err.message
          : "Create account failed.",
    };
  }
}

export async function setAccountActiveAction(
  profileId: string,
  active: boolean
): Promise<AuthorityActionResult> {
  const session = await requireAuthorityOperator();
  if (!session) return { ok: false, error: "Not authorized." };
  if (profileId === session.profile.id && !active) {
    return { ok: false, error: "You cannot disable your own account." };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ is_active: active })
      .eq("id", profileId);
    if (error) return { ok: false, error: error.message };

    if (!active) {
      try {
        await admin.auth.admin.updateUserById(profileId, {
          ban_duration: "876000h",
        });
      } catch {
        /* ban optional — is_active is primary gate */
      }
    } else {
      try {
        await admin.auth.admin.updateUserById(profileId, {
          ban_duration: "none",
        });
      } catch {
        /* ignore */
      }
    }

    revalidateAuthority();
    return {
      ok: true,
      message: active ? "Account enabled." : "Account disabled.",
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed.",
    };
  }
}

/** Archive = deactivate + soft flag via is_active false (no hard delete). */
export async function archiveAccountAction(
  profileId: string
): Promise<AuthorityActionResult> {
  return setAccountActiveAction(profileId, false);
}

export async function changeAccountRoleAction(
  profileId: string,
  role: string
): Promise<AuthorityActionResult> {
  const session = await requireAuthorityOperator();
  if (!session) return { ok: false, error: "Not authorized." };
  if (!isSodaRole(role)) return { ok: false, error: "Invalid role." };

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ role })
      .eq("id", profileId);
    if (error) return { ok: false, error: error.message };
    revalidateAuthority();
    return { ok: true, message: `Role updated to ${role}.` };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Role change failed.",
    };
  }
}

export async function resetAccountPasswordAction(
  profileId: string
): Promise<AuthorityActionResult> {
  const session = await requireAuthorityOperator();
  if (!session) return { ok: false, error: "Not authorized." };

  try {
    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("id, email, username")
      .eq("id", profileId)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!profile?.id) return { ok: false, error: "Account not found." };

    const temp = generateTemporaryPassword();
    const { error: updErr } = await admin.auth.admin.updateUserById(
      profile.id,
      { password: temp }
    );
    if (updErr) return { ok: false, error: updErr.message };

    await admin
      .from("profiles")
      .update({ must_change_password: true })
      .eq("id", profile.id);

    revalidateAuthority();
    return {
      ok: true,
      message:
        "Temporary password issued. Copy now — it will not be shown again.",
      credentials: {
        username: profile.username ?? "",
        email: profile.email ?? "",
        temporaryPassword: temp,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Reset failed.",
    };
  }
}

/** Link profile ↔ people row (optional). */
export async function linkAccountToPersonAction(
  profileId: string,
  personId: string | null
): Promise<AuthorityActionResult> {
  const session = await requireAuthorityOperator();
  if (!session) return { ok: false, error: "Not authorized." };

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ person_id: personId })
      .eq("id", profileId);
    if (error) return { ok: false, error: error.message };
    revalidateAuthority();
    if (personId) revalidatePath(`/people/${personId}`);
    return { ok: true, message: personId ? "Linked to crew." : "Unlinked." };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Link failed.",
    };
  }
}

/** People without Auth — for Create Account person picker. */
export async function listUnlinkedPeople(): Promise<
  { id: string; name: string }[]
> {
  const session = await requireAuthorityOperator();
  if (!session) return [];

  try {
    const supabase = await createClient();
    const { data: people } = await supabase
      .from("people")
      .select("id, name_en, display_name, status")
      .neq("status", "inactive")
      .order("name_en");
    if (!people?.length) return [];

    const admin = createAdminClient();
    const { data: linked } = await admin
      .from("profiles")
      .select("person_id")
      .not("person_id", "is", null);
    const linkedIds = new Set(
      (linked ?? [])
        .map((r) => (typeof r.person_id === "string" ? r.person_id : null))
        .filter(Boolean)
    );

    return people
      .filter((p) => !linkedIds.has(String(p.id)))
      .map((p) => ({
        id: String(p.id),
        name:
          (typeof p.display_name === "string" && p.display_name) ||
          (typeof p.name_en === "string" ? p.name_en : String(p.id)),
      }));
  } catch {
    return [];
  }
}
