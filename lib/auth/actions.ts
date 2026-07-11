"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { homePathForRole } from "@/lib/identity/nav";
import { parseSodaRole, type SodaRole } from "@/lib/identity/roles";
import { getSodaSession } from "@/lib/identity/session";
import { can } from "@/lib/identity/permissions";

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
  const email = formString(formData, "email");
  const password = formString(formData, "password");
  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }

  try {
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
    const dest = session
      ? homePathForRole(session.profile.role)
      : "/";
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
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function forgotPasswordAction(
  _prev: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formString(formData, "email");
  if (!email) return { ok: false, error: "Email is required." };

  try {
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
      message: "If that email exists, a reset link is on the way.",
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
    return { ok: true, message: "Password updated." };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed.",
    };
  }
}

/**
 * One-time first-owner bootstrap. Only succeeds when zero active owners exist.
 * Requires SUPABASE_SERVICE_ROLE_KEY on the server (Vercel env for production).
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

    let userId: string;
    if (existing) {
      const { error: updErr } = await admin.auth.admin.updateUserById(
        existing.id,
        {
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName, role: "owner" },
        }
      );
      if (updErr) return { ok: false, error: updErr.message };
      userId = existing.id;
    } else {
      const created = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role: "owner" },
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
        is_active: true,
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

    redirect(homePathForRole("owner"));
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

export async function inviteUserAction(
  _prev: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const session = await getSodaSession();
  if (!session || !can(session.profile.role, "settings.users")) {
    return { ok: false, error: "You cannot invite users." };
  }

  const email = formString(formData, "email");
  const role = parseSodaRole(formString(formData, "role"), "crew_member");
  const fullName = formString(formData, "fullName") || email.split("@")[0] || "User";

  if (!email) return { ok: false, error: "Email is required." };

  try {
    const admin = createAdminClient();
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/settings/password`,
      data: { full_name: fullName, role },
    });

    if (error) {
      // Fallback: create user with temp password when invite emails need Dashboard toggle
      if (
        error.message.toLowerCase().includes("invite") ||
        error.message.toLowerCase().includes("email")
      ) {
        const temp = `Soda-${Math.random().toString(36).slice(2, 10)}!1`;
        const created = await admin.auth.admin.createUser({
          email,
          password: temp,
          email_confirm: true,
          user_metadata: { full_name: fullName, role },
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
          is_active: true,
        });
        return {
          ok: true,
          message: `User created. Temporary password: ${temp} — share securely and ask them to change it.`,
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
        is_active: true,
      });
    }

    return {
      ok: true,
      message: "Invite sent. They will set a password from the email link.",
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
