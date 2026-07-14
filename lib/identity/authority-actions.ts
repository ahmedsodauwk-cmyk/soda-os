/**
 * Authority Center — account provisioning & lifecycle (Mission 04.4.2).
 * Founder/Admin only. Never creates demo/fake users.
 * Temp password is returned ONCE to the Founder UI and never stored.
 */

"use server";

import { revalidatePath } from "next/cache";

import { generateTemporaryPassword } from "@/lib/auth/temp-password";
import { personIdTakenByOtherProfile } from "@/lib/identity/identity-link";
import { provisionLoginAccountForPerson } from "@/lib/identity/provision-account";
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
  passwordResetAt: string | null;
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
        "id, email, username, full_name, role, is_active, must_change_password, person_id, created_at, password_reset_at"
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
      passwordResetAt:
        typeof row.password_reset_at === "string"
          ? row.password_reset_at
          : null,
    }));
  } catch {
    return [];
  }
}

/**
 * @deprecated Account creation moved to Crew Workspace (Mission 04.4.3).
 * Kept for internal compatibility — requires personId; use createCrewLoginAccountAction.
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

  const personId = input.personId?.trim();
  if (!personId) {
    return {
      ok: false,
      error:
        "Account creation belongs in Crew Workspace. Open the crew member and use Create Login Account.",
    };
  }

  const result = await provisionLoginAccountForPerson({
    personId,
    fullName: input.fullName,
    username: input.username,
    email: input.email,
    role: input.role,
  });

  if (!result.ok) return { ok: false, error: result.error };

  revalidateAuthority();
  revalidatePath(`/people/${personId}`);
  return {
    ok: true,
    message:
      "Account created. Copy credentials now — the temporary password will not be shown again.",
    credentials: result.credentials,
  };
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

    const resetAt = new Date().toISOString();
    await admin
      .from("profiles")
      .update({
        must_change_password: true,
        password_reset_at: resetAt,
      })
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

/** Link profile ↔ people row — enforces one-to-one. */
export async function linkAccountToPersonAction(
  profileId: string,
  personId: string | null
): Promise<AuthorityActionResult> {
  const session = await requireAuthorityOperator();
  if (!session) return { ok: false, error: "Not authorized." };

  try {
    if (personId) {
      const taken = await personIdTakenByOtherProfile(personId, profileId);
      if (taken) {
        return {
          ok: false,
          error:
            "That crew member already has a linked account. One person ↔ one profile.",
        };
      }
    }

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

/** @deprecated Create Account moved to Crew Workspace — kept for type exports only. */
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
