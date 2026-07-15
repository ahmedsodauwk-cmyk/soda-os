import { NextResponse, NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PREFIXES = [
  "/login",
  "/forgot-password",
  "/bootstrap",
  "/auth",
  "/about",
  "/logout",
];

function isPublicPath(pathname: string): boolean {
  if (
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/bootstrap" ||
    pathname === "/logout"
  ) {
    return true;
  }
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function isAuthStrict(): boolean {
  if (process.env.SODA_AUTH_STRICT === "0") return false;
  if (process.env.SODA_AUTH_STRICT === "1") return true;
  return process.env.VERCEL_ENV === "production";
}

/** True when request likely carries a Supabase auth cookie. */
function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some(
      (c) =>
        c.name.includes("auth-token") ||
        c.name.startsWith("sb-") ||
        c.name.includes("supabase")
    );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass pathname to Server Components (breadcrumbs)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  const requestWithPath = new NextRequest(request.url, {
    headers: requestHeaders,
  });

  const authStrict = isAuthStrict();
  const publicPath = isPublicPath(pathname);
  const hasAuth = hasSupabaseAuthCookie(request);

  // Fast path: no session cookie ΓÇö skip Supabase round-trip when possible.
  if (!hasAuth) {
    const passthrough = NextResponse.next({
      request: { headers: requestHeaders },
    });
    if (!authStrict) return passthrough;
    if (publicPath) return passthrough;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const { response, user } = await updateSession(requestWithPath);

  if (!authStrict) {
    return response;
  }

  if (publicPath) {
    if (
      user &&
      (pathname === "/login" ||
        pathname === "/forgot-password" ||
        pathname === "/bootstrap")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
