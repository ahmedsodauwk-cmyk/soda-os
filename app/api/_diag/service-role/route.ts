/**
 * TEMPORARY runtime diagnostic — remove after Production verification.
 * Auth: x-soda-diag header OR ?t=DIAG_TOKEN OR founder/owner session.
 * One-time header token (this run only): 251096cf7069917c9e476d3ab586b318
 */
import { NextResponse } from "next/server";

import { getSodaSession } from "@/lib/identity/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIAG_HEADER_TOKEN = "251096cf7069917c9e476d3ab586b318";

function rpcResult(
  data: unknown,
  error: { message: string; code?: string; details?: string; hint?: string } | null
) {
  if (error) {
    return {
      ok: false as const,
      error: {
        message: error.message,
        code: error.code ?? null,
        details: error.details ?? null,
        hint: error.hint ?? null,
      },
    };
  }
  return { ok: true as const, data: data ?? null };
}

async function isAuthorized(request: Request): Promise<boolean> {
  const header = request.headers.get("x-soda-diag");
  if (header && header === DIAG_HEADER_TOKEN) return true;

  const diagToken = process.env.DIAG_TOKEN?.trim();
  if (diagToken) {
    const t = new URL(request.url).searchParams.get("t");
    if (t && t === diagToken) return true;
  }

  const session = await getSodaSession();
  if (!session) return false;
  const level = session.profile.accessLevel;
  const role = session.profile.role;
  if (level === "founder") return true;
  if (role === "owner" || role === "founder") return true;
  return false;
}

export async function GET(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const keyInfo = {
    exists: key.length > 0 ? ("yes" as const) : ("no" as const),
    length: key.length,
    first6: key.slice(0, 6),
    last4: key.slice(-4),
  };

  if (keyInfo.exists !== "yes") {
    return NextResponse.json({
      key: keyInfo,
      rpcs: null,
      note: "SUPABASE_SERVICE_ROLE_KEY missing; skipped RPCs",
    });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return NextResponse.json({
      key: keyInfo,
      rpcs: null,
      createAdminClientError:
        err instanceof Error ? err.message : String(err),
    });
  }

  const ensureSelf = await admin.rpc("connect_ensure_self");
  const ensureSelfResult = rpcResult(ensureSelf.data, ensureSelf.error);

  let founderId: string | null = null;
  let founderLookupError: string | null = null;
  const founderLookup = await admin
    .from("profiles")
    .select("id")
    .eq("access_level", "founder")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (founderLookup.error) {
    founderLookupError = founderLookup.error.message;
  } else {
    founderId = founderLookup.data?.id ?? null;
  }

  let ensureUserResult: ReturnType<typeof rpcResult> | {
    ok: false;
    error: { message: string };
  };
  if (!founderId) {
    ensureUserResult = {
      ok: false,
      error: {
        message: founderLookupError
          ? `No founder id; lookup error: ${founderLookupError}`
          : "No active founder profile found",
      },
    };
  } else {
    const ensureUser = await admin.rpc("connect_ensure_user", {
      p_user_id: founderId,
    });
    ensureUserResult = rpcResult(ensureUser.data, ensureUser.error);
  }

  const bootstrap = await admin.rpc("connect_bootstrap_all_active");
  const bootstrapResult = rpcResult(bootstrap.data, bootstrap.error);

  return NextResponse.json({
    key: keyInfo,
    founderIdUsed: founderId,
    rpcs: {
      connect_ensure_self: ensureSelfResult,
      connect_ensure_user: ensureUserResult,
      connect_bootstrap_all_active: bootstrapResult,
    },
  });
}
