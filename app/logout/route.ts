import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from "next/cache";

import { requireSupabaseEnv } from "@/lib/supabase/env";

/**
 * Real logout — destroys Supabase session cookies and redirects to /login.
 * Supports GET (direct /logout) and POST (forms).
 */
async function signOutAndRedirect(request: NextRequest) {
  const { url, anonKey } = requireSupabaseEnv();
  const loginUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(loginUrl);

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  return response;
}

export async function GET(request: NextRequest) {
  return signOutAndRedirect(request);
}

export async function POST(request: NextRequest) {
  return signOutAndRedirect(request);
}
