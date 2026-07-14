/**
 * Identity Link — People (crew SoT) → Profile → Auth User.
 * Read-only helpers; mutations live in people/actions + authority-actions.
 */

import { isSodaRole, type SodaRole } from "@/lib/identity/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export type LinkedAccountInfo = {
  linked: boolean;
  profileId: string | null;
  username: string | null;
  email: string | null;
  fullName: string | null;
  role: SodaRole | null;
  isActive: boolean;
  mustChangePassword: boolean;
  lastSignInAt: string | null;
  passwordResetAt: string | null;
  createdAt: string | null;
};

/** Fetch linked Auth profile + last login for a crew member. */
export async function fetchLinkedAccountForPerson(
  personId: string
): Promise<LinkedAccountInfo> {
  const empty: LinkedAccountInfo = {
    linked: false,
    profileId: null,
    username: null,
    email: null,
    fullName: null,
    role: null,
    isActive: false,
    mustChangePassword: false,
    lastSignInAt: null,
    passwordResetAt: null,
    createdAt: null,
  };

  try {
    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select(
        "id, email, username, full_name, role, is_active, must_change_password, password_reset_at, created_at"
      )
      .eq("person_id", personId)
      .maybeSingle();

    if (error || !profile?.id) return empty;

    let lastSignInAt: string | null = null;
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(
        String(profile.id)
      );
      lastSignInAt = authUser?.user?.last_sign_in_at ?? null;
    } catch {
      /* auth lookup optional */
    }

    const role = isSodaRole(profile.role) ? profile.role : null;

    return {
      linked: true,
      profileId: String(profile.id),
      username: typeof profile.username === "string" ? profile.username : null,
      email: typeof profile.email === "string" ? profile.email : null,
      fullName:
        typeof profile.full_name === "string" ? profile.full_name : null,
      role,
      isActive: profile.is_active !== false,
      mustChangePassword: profile.must_change_password === true,
      lastSignInAt,
      passwordResetAt:
        typeof profile.password_reset_at === "string"
          ? profile.password_reset_at
          : null,
      createdAt:
        typeof profile.created_at === "string" ? profile.created_at : null,
    };
  } catch {
    return empty;
  }
}

/** True when another profile already owns this person_id. */
export async function personAlreadyLinked(personId: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("person_id", personId)
      .maybeSingle();
    return Boolean(data?.id);
  } catch {
    return false;
  }
}

/** Block linking profile to a second person. */
export async function personIdTakenByOtherProfile(
  personId: string,
  profileId: string
): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("person_id", personId)
      .neq("id", profileId)
      .maybeSingle();
    return Boolean(data?.id);
  } catch {
    return false;
  }
}
