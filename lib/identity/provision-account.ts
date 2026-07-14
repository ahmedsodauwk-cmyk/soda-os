/**
 * Login account provisioning — Crew SoT only (Mission 04.4.3).
 * person_id is required; never create Auth without a crew member.
 */

import {
  getCompanyEmailDomain,
  companyEmailForUsername,
} from "@/lib/auth/company-email";
import {
  buildProvisionUserMetadata,
  generateTemporaryPassword,
} from "@/lib/auth/temp-password";
import { personAlreadyLinked } from "@/lib/identity/identity-link";
import { isSodaRole, type SodaRole } from "@/lib/identity/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export type ProvisionCredentials = {
  username: string;
  email: string;
  temporaryPassword: string;
};

export type ProvisionResult =
  | { ok: true; credentials: ProvisionCredentials; profileId: string }
  | { ok: false; error: string };

export async function provisionLoginAccountForPerson(input: {
  personId: string;
  fullName: string;
  username: string;
  email?: string;
  role: string;
}): Promise<ProvisionResult> {
  const personId = input.personId.trim();
  const fullName = input.fullName.trim();
  const username = input.username.trim().toLowerCase();

  if (!personId) {
    return { ok: false, error: "Crew member is required — accounts never exist without Crew." };
  }
  if (!fullName) return { ok: false, error: "Full name is required." };
  if (!username) return { ok: false, error: "Username is required." };
  if (!isSodaRole(input.role)) return { ok: false, error: "Invalid role." };

  if (await personAlreadyLinked(personId)) {
    return {
      ok: false,
      error: "This crew member already has a linked login account.",
    };
  }

  const domain = await getCompanyEmailDomain();
  const email = (
    input.email?.trim() || companyEmailForUsername(username, domain)
  ).toLowerCase();

  try {
    const admin = createAdminClient();

    const { data: existingUser } = await admin
      .from("profiles")
      .select("id, person_id")
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

    const profilePatch = {
      id: created.data.user.id,
      email,
      full_name: fullName,
      role: input.role as SodaRole,
      is_active: true,
      username,
      must_change_password: true,
      person_id: personId,
      password_reset_at: new Date().toISOString(),
    };

    const { error: profileErr } = await admin
      .from("profiles")
      .upsert(profilePatch);
    if (profileErr) {
      return { ok: false, error: profileErr.message };
    }

    return {
      ok: true,
      profileId: created.data.user.id,
      credentials: { username, email, temporaryPassword: temp },
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
