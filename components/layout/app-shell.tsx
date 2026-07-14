import { headers } from "next/headers";
import { redirect } from "next/navigation";

import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { PageAtmosphere } from "@/components/brand/page-atmosphere";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { RecentlyViewed } from "@/components/navigation/recently-viewed";
import { loadHydratedNotifications } from "@/lib/core/notifications/load";
import type { HumanLayerKey } from "@/lib/brand/human-layer";
import { resolveSectionPersonality } from "@/lib/brand/tokens";
import { getRecentlyViewed } from "@/lib/identity/recent";
import { permissionsForAsync } from "@/lib/identity/permission-service";
import {
  isAuthStrict,
  resolveSessionForApp,
  type SodaSession,
} from "@/lib/identity/session";
import type { DictKey } from "@/lib/i18n/dictionaries";

interface AppShellProps {
  /** i18n page title key — switches with UI language. */
  titleKey?: DictKey;
  /** Raw title when entity name is dynamic (project / lane). */
  title?: string;
  /** SODA Side Language key — always Egyptian Arabic. */
  layer: HumanLayerKey;
  /** Optional Side Language override (still Egyptian Arabic). */
  subtitle?: string;
  children: React.ReactNode;
  showBreadcrumbs?: boolean;
  /** Pass a resolved session to skip a duplicate auth fetch (e.g. Home). */
  session?: SodaSession | null;
}

export async function AppShell({
  titleKey,
  title,
  layer,
  subtitle,
  children,
  showBreadcrumbs = true,
  session: sessionProp,
}: AppShellProps) {
  const headerList = await headers();
  const pathname =
    headerList.get("x-pathname") ||
    headerList.get("x-invoke-path") ||
    headerList.get("next-url") ||
    "/";

  const [sessionResolved, notifications, recent] = await Promise.all([
    sessionProp !== undefined
      ? Promise.resolve(sessionProp)
      : resolveSessionForApp(),
    loadHydratedNotifications(),
    getRecentlyViewed(),
  ]);

  const session = sessionResolved;

  if (!session && isAuthStrict()) {
    redirect("/login");
  }

  // Force password change gate (temp-password / invite policy).
  if (
    session?.profile.mustChangePassword &&
    !pathname.startsWith("/settings/password") &&
    pathname !== "/login" &&
    pathname !== "/forgot-password"
  ) {
    redirect("/settings/password?forced=1");
  }

  const permissionResult = session
    ? await permissionsForAsync(session.profile.accessLevel)
    : null;
  const allowedPermissions =
    permissionResult && Array.isArray(permissionResult.permissions)
      ? [...permissionResult.permissions]
      : undefined;

  const user = session
    ? {
        fullName: session.profile.displayName || session.profile.fullName,
        role: session.profile.role,
        accessLevel: session.profile.accessLevel,
        avatarInitials: session.profile.avatarInitials,
        email: session.profile.email,
        personId: session.profile.personId,
        allowedPermissions,
      }
    : undefined;

  const section = resolveSectionPersonality(layer);

  return (
    <main
      data-soda-section={section}
      className="soda-brand-wash relative flex min-h-screen overflow-hidden bg-transparent"
    >
      <PageAtmosphere section={section} />
      <Sidebar user={user} />

      <section className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Header
          titleKey={titleKey}
          title={title}
          layer={layer}
          subtitle={subtitle}
          notifications={notifications}
          user={user}
        />

        <div className="soda-page-enter mx-auto w-full max-w-[1600px] p-4 sm:p-5 lg:p-6">
          {showBreadcrumbs ? <Breadcrumbs pathname={pathname} /> : null}
          {recent.length > 0 ? (
            <div className="mb-3">
              <RecentlyViewed items={recent} />
            </div>
          ) : null}
          {children}
        </div>
      </section>
    </main>
  );
}
