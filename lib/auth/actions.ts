"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { homePathForPermissions } from "@/lib/identity/nav";
import { permissionsForAccessLevel } from "@/lib/identity/access-levels";
import { accessLevelFromLegacyRole } from "@/lib/identity/access-levels";
import { parseSodaRole, type SodaRole } from "@/lib/identity/roles";
import { getSodaSession, sessionHomeAsync } from "@/lib/identity/session";
import { can } from "@/lib/identity/permissions";
import { resolveLoginEmail } from "@/lib/auth/resolve-login";
import {
  companyEmailForUsername,
  getCompanyEmailDomain,
} from "@/lib/auth/company-email";
import {
  buildProvisionUserMetadata,
  generateTemporaryPassword,
} from "@/lib/auth/temp-password";

export type AuthActionResult = {
  ok: boolean;
  error?: string;
  message?: string;
};

function formString(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function signInAction(
  _prev: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  // Field may be username OR email (name kept as "email" for form compat / autocomplete).
  const identifier =
    formString(formData, "email") || formString(formData, "identifier");
  const password = formString(formData, "password");
  if (!identifier || !password) {
    return { ok: false, error: "Username/email and password are required." };
  }

  try {
    const email = await resolveLoginEmail(identifier);
    if (!email) {
      return { ok: false, error: "Enter a username or email." };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return {
        ok: false,
        error:
          error.message.includes("Email logins are disabled") ||
          error.message.includes("Email provider")
            ? "Email sign-in is disabled in Supabase. Enable Email under Authentication → Providers (one step)."
            : error.message,
      };
    }

    const session = await getSodaSession();
    if (session?.profile.mustChangePassword) {
      redirect("/settings/password?forced=1");
    }
    const dest = session ? await sessionHomeAsync(session) : "/";
    redirect(dest);
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: string }).digest === "string" &&
      (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Sign-in failed.",
    };
  }
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    // Still leave the app so Founder can switch accounts even if remote
    // revoke fails — local cookies are cleared by the client cookie writes.
    console.error("[auth] signOut:", error.message);
  }
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function forgotPasswordAction(
  _prev: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const identifier =
    formString(formData, "email") || formString(formData, "identifier");
  if (!identifier) {
    return { ok: false, error: "Username or email is required." };
  }

  try {
    const email = await resolveLoginEmail(identifier);
    if (!email) return { ok: false, error: "Username or email is required." };

    const supabase = await createClient();
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/settings/password`,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return {
      ok: true,
      message: "If that account exists, a reset link is on the way.",
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Reset failed.",
    };
  }
}

export async function changePasswordAction(
  _prev: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const password = formString(formData, "password");
  const confirm = formString(formData, "confirm");
  if (!password || password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { ok: false, error: "Passwords do not match." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, error: error.message };

    // Clear force-change flag (RPC when migration applied; direct update as fallback).
    const { error: rpcErr } = await supabase.rpc("clear_must_change_password");
    if (rpcErr) {
      const session = await getSodaSession();
      if (session) {
        await supabase
          .from("profiles")
          .update({
            must_change_password: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.userId);
      }
    }

    revalidatePath("/", "layout");
    return { ok: true, message: "Password updated." };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed.",
    };
  }
}

export async function updateCompanyEmailDomainAction(
  _prev: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const session = await getSodaSession();
  if (!session || !can(session.profile.accessLevel, "settings.users")) {
    return {
      ok: false,
      error: "Only the Founder / Owner can change the email domain.",
    };
  }

  const domain = formString(formData, "domain");
  const { setCompanyEmailDomain } = await import("@/lib/auth/company-email");
  const result = await setCompanyEmailDomain(domain);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath("/settings");
  return {
    ok: true,
    message: `Company email domain set to ${domain.replace(/^@/, "")}.`,
  };
}

/**
 * One-time first-owner bootstrap. Only succeeds when zero active owners exist.
 * Requires SUPABASE_SERVICE_ROLE_KEY on the server (Vercel env for production).
 * IDENTITY ONLY — creates Auth user + profile + owner role; never business entities.
 * See docs/SODA_MASTER/FOUNDER_DATA_POLICY.md.
 */
export async function bootstrapOwnerAction(
  _prev: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formString(formData, "email");
  const password = formString(formData, "password");
  const confirm = formString(formData, "confirm");
  const fullName =
    formString(formData, "fullName") || email.split("@")[0] || "SODA Owner";

  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { ok: false, error: "Passwords do not match." };
  }

  try {
    const admin = createAdminClient();

    const { data: ownerRole, error: roleErr } = await admin
      .from("roles")
      .select("id")
      .eq("id", "owner")
      .maybeSingle();
    if (roleErr || !ownerRole) {
      return {
        ok: false,
        error:
          "Identity SQL not applied. Run SODA_IDENTITY_NAV.sql in Supabase SQL Editor, then retry.",
      };
    }

    const { count: ownerCount, error: countErr } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "owner")
      .eq("is_active", true);
    if (countErr) {
      return { ok: false, error: countErr.message };
    }
    if ((ownerCount ?? 0) > 0) {
      return {
        ok: false,
        error: "An owner already exists. Bootstrap is disabled.",
      };
    }

    const { data: listed } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const existing = listed?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    const username = email.includes("@")
      ? email.split("@")[0]!.toLowerCase()
      : email.toLowerCase();

    let userId: string;
    if (existing) {
      const { error: updErr } = await admin.auth.admin.updateUserById(
        existing.id,
        {
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            role: "owner",
            username,
            must_change_password: false,
          },
        }
      );
      if (updErr) return { ok: false, error: updErr.message };
      userId = existing.id;
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
        return {
          ok: false,
          error: created.error?.message ?? "Failed to create auth user.",
        };
      }
      userId = created.data.user.id;
    }

    const { error: upsertErr } = await admin.from("profiles").upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        role: "owner" as SodaRole,
        access_level: "founder",
        is_active: true,
        username,
        must_change_password: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    if (upsertErr) return { ok: false, error: upsertErr.message };

    const supabase = await createClient();
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signErr) {
      return {
        ok: true,
        message: `Owner created. Sign-in failed (${signErr.message}). Use /login.`,
      };
    }

    redirect(homePathForPermissions(permissionsForAccessLevel("founder")));
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: string }).digest === "string" &&
      (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message.includes("SUPABASE_SERVICE_ROLE_KEY")
            ? "SUPABASE_SERVICE_ROLE_KEY is not set on this server. Add it in Vercel → Settings → Environment Variables (Production), redeploy, then retry /bootstrap."
            : err.message
          : "Bootstrap failed.",
    };
  }
}

/**
 * Invite / provision a user (Founder only).
 * Sets must_change_password when a temporary password is issued.
 * Do not invent crew — only invite people the Founder names.
 */
export async function inviteUserAction(
  _prev: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const session = await getSodaSession();
  if (!session || !can(session.profile.accessLevel, "settings.users")) {
    return { ok: false, error: "You cannot invite users." };
  }

  const role = parseSodaRole(formString(formData, "role"), "crew_member");
  // Invite must never grant Founder — clamp to Team if role maps to Founder.
  let accessLevel = accessLevelFromLegacyRole(role);
  if (accessLevel === "founder") accessLevel = "team";
  const fullName = formString(formData, "fullName");
  let email = formString(formData, "email");
  const usernameRaw = formString(formData, "username");

  const domain = await getCompanyEmailDomain();
  const username = (
    usernameRaw ||
    (email.includes("@") ? email.split("@")[0] : "") ||
    fullName.toLowerCase().replace(/\s+/g, ".")
  )
    .trim()
    .toLowerCase();

  if (!email && username) {
    email = companyEmailForUsername(username, domain);
  }

  if (!email) return { ok: false, error: "Email or username is required." };
  if (!fullName) return { ok: false, error: "Full name is required." };

  try {
    const admin = createAdminClient();
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const meta = buildProvisionUserMetadata({
      full_name: fullName,
      role,
      username: username || email.split("@")[0]!,
    });

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/settings/password`,
      data: meta,
    });

    if (error) {
      // Fallback: create user with temp password when invite emails need Dashboard toggle
      if (
        error.message.toLowerCase().includes("invite") ||
        error.message.toLowerCase().includes("email")
      ) {
        const temp = generateTemporaryPassword();
        const created = await admin.auth.admin.createUser({
          email,
          password: temp,
          email_confirm: true,
          user_metadata: meta,
        });
        if (created.error || !created.data.user) {
          return {
            ok: false,
            error:
              created.error?.message ??
              "Invite failed. Enable Email Auth in Supabase Dashboard → Authentication → Providers.",
          };
        }
        await admin.from("profiles").upsert({
          id: created.data.user.id,
          email,
          full_name: fullName,
          role: role as SodaRole,
          access_level: accessLevel,
          is_active: true,
          username: meta.username,
          must_change_password: true,
        });
        return {
          ok: true,
          message: `User created. Temporary password: ${temp} — share securely. They must change it on first login.`,
        };
      }
      return { ok: false, error: error.message };
    }

    if (data.user) {
      await admin.from("profiles").upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: role as SodaRole,
        access_level: accessLevel,
        is_active: true,
        username: meta.username,
        must_change_password: true,
      });
    }

    return {
      ok: true,
      message:
        "Invite sent. They will set a password from the email link (forced change on first session).",
    };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Invite failed. Ensure SUPABASE_SERVICE_ROLE_KEY is set.",
    };
  }
}
