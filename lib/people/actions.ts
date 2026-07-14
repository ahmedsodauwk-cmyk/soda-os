"use server";

/**
 * Crew Workspace Founder Actions — server mutations.
 * Never creates Auth users or fake people. Gates on owner/founder/admin.
 */

import { revalidatePath } from "next/cache";

import {
  companyEmailForUsername,
  getCompanyEmailDomain,
} from "@/lib/auth/company-email";
import { generateTemporaryPassword } from "@/lib/auth/temp-password";
import { personAlreadyLinked } from "@/lib/identity/identity-link";
import { provisionLoginAccountForPerson } from "@/lib/identity/provision-account";
import { suggestRoleFromPerson } from "@/lib/identity/role-suggest";
import { suggestUsernameFromPerson } from "@/lib/identity/username-suggest";
import { canMutateCrewProfile } from "@/lib/people/access";
import { resolveSessionForApp } from "@/lib/identity/session";
import { isSodaRole, type SodaRole } from "@/lib/identity/roles";
import {
  fetchPersonById,
  updatePerson,
  type UpdatePersonInput,
} from "@/lib/people/repository";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type CrewActionResult = {
  ok: boolean;
  error?: string;
  message?: string;
  tempPassword?: string;
  credentials?: {
    username: string;
    email: string;
    temporaryPassword: string;
  };
};

async function requireFounderSession() {
  const session = await resolveSessionForApp();
  if (!session || !canMutateCrewProfile(session.profile.role)) {
    return null;
  }
  return session;
}

function revalidateCrew(personId: string) {
  revalidatePath("/people");
  revalidatePath(`/people/${personId}`);
  revalidatePath(`/people/${personId}`, "layout");
  revalidatePath("/settings/authority");
}

export async function updateCrewProfileAction(
  personId: string,
  patch: UpdatePersonInput
): Promise<CrewActionResult> {
  const session = await requireFounderSession();
  if (!session) return { ok: false, error: "Unauthorized." };

  try {
    const existing = await fetchPersonById(personId);
    if (!existing) return { ok: false, error: "Crew member not found." };

    await updatePerson(personId, patch);
    revalidateCrew(personId);
    return { ok: true, message: "Profile saved." };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update profile.",
    };
  }
}

export async function setCrewStatusAction(
  personId: string,
  status: "active" | "inactive" | "on_leave",
  mode: "archive" | "deactivate" | "reactivate"
): Promise<CrewActionResult> {
  const session = await requireFounderSession();
  if (!session) return { ok: false, error: "Unauthorized." };

  try {
    await updatePerson(personId, { status });

    if (mode === "deactivate" || mode === "reactivate") {
      try {
        const admin = createAdminClient();
        await admin
          .from("profiles")
          .update({ is_active: mode === "reactivate" })
          .eq("person_id", personId);
      } catch {
        /* profile link optional — people.status already updated */
      }
    }

    revalidateCrew(personId);
    return {
      ok: true,
      message:
        mode === "archive"
          ? "Member archived (inactive)."
          : mode === "deactivate"
            ? "Member deactivated."
            : "Member reactivated.",
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update status.",
    };
  }
}

export async function resetCrewPasswordAction(
  personId: string
): Promise<CrewActionResult> {
  const session = await requireFounderSession();
  if (!session) return { ok: false, error: "Unauthorized." };

  try {
    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("id, email, username")
      .eq("person_id", personId)
      .maybeSingle();

    if (error) {
      return { ok: false, error: error.message };
    }
    if (!profile?.id) {
      return {
        ok: false,
        error:
          "No linked Auth account for this crew member yet. Reset password waits until the Founder provisions their login.",
      };
    }

    const temp = generateTemporaryPassword();
    const { error: updErr } = await admin.auth.admin.updateUserById(
      profile.id,
      { password: temp }
    );
    if (updErr) {
      return { ok: false, error: updErr.message };
    }

    const resetAt = new Date().toISOString();
    await admin
      .from("profiles")
      .update({
        must_change_password: true,
        password_reset_at: resetAt,
      })
      .eq("id", profile.id);

    revalidateCrew(personId);

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
      error:
        err instanceof Error
          ? err.message.includes("SUPABASE_SERVICE_ROLE_KEY")
            ? "Server admin key is not configured — cannot reset password here."
            : err.message
          : "Reset password failed.",
    };
  }
}

export async function updateLinkedRoleAction(
  personId: string,
  role: string
): Promise<CrewActionResult> {
  const session = await requireFounderSession();
  if (!session) return { ok: false, error: "Unauthorized." };
  if (!isSodaRole(role)) {
    return { ok: false, error: "Invalid role." };
  }

  try {
    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("id")
      .eq("person_id", personId)
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!profile?.id) {
      return {
        ok: false,
        error:
          "No linked Auth profile for this crew member. Role changes apply after the Founder links an account.",
      };
    }

    const { error: updErr } = await admin
      .from("profiles")
      .update({ role: role as SodaRole })
      .eq("id", profile.id);

    if (updErr) return { ok: false, error: updErr.message };

    revalidateCrew(personId);
    revalidatePath("/settings/permissions");
    revalidatePath("/settings/authority");
    return { ok: true, message: `Role updated to ${role}.` };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update role.",
    };
  }
}

/**
 * Create login account from Crew Workspace — crew SoT, username only editable.
 * Credentials returned once; never stored.
 */
export async function createCrewLoginAccountAction(
  personId: string,
  username: string
): Promise<CrewActionResult> {
  const session = await requireFounderSession();
  if (!session) return { ok: false, error: "Unauthorized." };

  try {
    const person = await fetchPersonById(personId);
    if (!person) return { ok: false, error: "Crew member not found." };

    if (await personAlreadyLinked(personId)) {
      return {
        ok: false,
        error: "This crew member already has a linked login account.",
      };
    }

    const domain = await getCompanyEmailDomain();
    const normalizedUsername = username.trim().toLowerCase();
    const email =
      person.email?.trim() ||
      companyEmailForUsername(
        normalizedUsername || suggestUsernameFromPerson(person),
        domain
      );

    const result = await provisionLoginAccountForPerson({
      personId,
      fullName: person.nameEn.trim(),
      username: normalizedUsername || suggestUsernameFromPerson(person),
      email,
      role: suggestRoleFromPerson(person.jobTitle),
    });

    if (!result.ok) return { ok: false, error: result.error };

    revalidateCrew(personId);
    return {
      ok: true,
      message:
        "Account created. Copy credentials now — the temporary password will not be shown again.",
      credentials: result.credentials,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Create account failed.",
    };
  }
}

/** Enable / disable linked Auth account for a crew member. */
export async function setCrewAccountActiveAction(
  personId: string,
  active: boolean
): Promise<CrewActionResult> {
  const session = await requireFounderSession();
  if (!session) return { ok: false, error: "Unauthorized." };

  try {
    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("id")
      .eq("person_id", personId)
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!profile?.id) {
      return {
        ok: false,
        error: "No linked login account for this crew member.",
      };
    }

    if (profile.id === session.profile.id && !active) {
      return { ok: false, error: "You cannot disable your own account." };
    }

    const { error: updErr } = await admin
      .from("profiles")
      .update({ is_active: active })
      .eq("id", profile.id);
    if (updErr) return { ok: false, error: updErr.message };

    try {
      await admin.auth.admin.updateUserById(profile.id, {
        ban_duration: active ? "none" : "876000h",
      });
    } catch {
      /* ban optional */
    }

    revalidateCrew(personId);
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

/** Read linked Auth role for a people row (optional link). */
export async function fetchLinkedRoleForPerson(
  personId: string
): Promise<{ role: SodaRole | null; profileId: string | null }> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("person_id", personId)
      .maybeSingle();
    if (!data) return { role: null, profileId: null };
    const role = isSodaRole(data.role) ? data.role : null;
    return { role, profileId: data.id as string };
  } catch {
    return { role: null, profileId: null };
  }
}
