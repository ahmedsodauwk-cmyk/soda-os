/**
 * Access Level → module visibility (Mission 04.5.0 Phase 1).
 * Consumes Access Level only — does not mutate permission templates.
 */

import type { AccessLevel } from "@/lib/identity/access-levels";

/** Exact nav hrefs allowed per Access Level (Personal Workspace handled via /me). */
const NAV_HREFS: Record<AccessLevel, ReadonlySet<string> | "all"> = {
  founder: "all",
  account_manager: new Set([
    "/",
    "/quotations",
    "/orders",
    "/projects",
    "/commercial",
    "/clients",
    "/people",
    "/calendar",
    "/notifications",
  ]),
  team_leader: new Set([
    "/",
    "/orders",
    "/people",
    "/calendar",
    "/notifications",
  ]),
  team: new Set(["/", "/orders", "/calendar", "/notifications"]),
};

/**
 * Path prefixes allowed for deep links / RoleGate denial.
 * Personal password change always allowed when signed in.
 */
const PATH_PREFIXES: Record<AccessLevel, readonly string[] | "all"> = {
  founder: "all",
  account_manager: [
    "/",
    "/quotations",
    "/orders",
    "/projects",
    "/commercial",
    "/workspaces",
    "/clients",
    "/people",
    "/crew",
    "/calendar",
    "/notifications",
    "/me",
    "/schedule",
    "/attention",
    "/settings/password",
  ],
  team_leader: [
    "/",
    "/orders",
    "/people",
    "/crew",
    "/calendar",
    "/notifications",
    "/me",
    "/schedule",
    "/settings/password",
  ],
  team: [
    "/",
    "/orders",
    "/calendar",
    "/notifications",
    "/me",
    "/settings/password",
  ],
};

function prefixAllows(pathname: string, prefix: string): boolean {
  if (prefix === "/") return pathname === "/";
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Whether a sidebar nav href is visible for this Access Level. */
export function isNavHrefAllowed(
  level: AccessLevel,
  href: string
): boolean {
  const allowed = NAV_HREFS[level];
  if (allowed === "all") return true;
  if (href.startsWith("/me/") || href === "/me") return true;
  return allowed.has(href);
}

/** Route-level denial for hidden modules (URL hits). */
export function canAccessPath(level: AccessLevel, pathname: string): boolean {
  const prefixes = PATH_PREFIXES[level];
  if (prefixes === "all") return true;
  if (!pathname || pathname === "") return true;
  // Always allow auth chrome + public meta.
  if (
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/about" ||
    pathname === "/bootstrap"
  ) {
    return true;
  }
  if (pathname.startsWith("/settings/password")) return true;
  return prefixes.some((p) => prefixAllows(pathname, p));
}

/** True when Access Level may see company financial surfaces. */
export function maySeeCompanyFinance(level: AccessLevel): boolean {
  return level === "founder";
}

/** True when dashboards may show company-wide pulse / ops. */
export function maySeeCompanyPulse(level: AccessLevel): boolean {
  return level === "founder";
}
