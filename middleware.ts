import { NextResponse, NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PREFIXES = [
  "/login",
  "/forgot-password",
  "/bootstrap",
  "/auth",
  "/about",
];

function isPublicPath(pathname: string): boolean {
  if (
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/bootstrap"
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass pathname to Server Components (breadcrumbs)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  const requestWithPath = new NextRequest(request.url, {
    headers: requestHeaders,
  });

  const { response, user } = await updateSession(requestWithPath);

  if (!isAuthStrict()) {
    return response;
  }

  if (isPublicPath(pathname)) {
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
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
