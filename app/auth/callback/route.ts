import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/** Reject protocol-relative and non-path redirects (audit H3). */
function safeRelativeRedirect(next: string): string {
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  if (next.includes("\\") || next.includes("\0")) return "/";
  return next;
}

/**
 * Auth callback — exchange code for session (invite / password reset).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth_callback`);
    }
  }

  return NextResponse.redirect(`${origin}${safeRelativeRedirect(next)}`);
}
