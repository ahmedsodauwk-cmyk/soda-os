import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { RecentlyViewed } from "@/components/navigation/recently-viewed";
import {
  hydrateNotificationsFromEvents,
  refreshBusinessEventsFromDb,
} from "@/lib/core";
import type { HumanLayerKey } from "@/lib/brand/human-layer";
import { getRecentlyViewed } from "@/lib/identity/recent";
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

/** Per-request dedupe — AppShell + nested pages share one events hydrate. */
const loadShellNotifications = cache(async () => {
  const events = await refreshBusinessEventsFromDb(20).catch(() => []);
  return hydrateNotificationsFromEvents(events);
});

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
    loadShellNotifications(),
    getRecentlyViewed(),
  ]);

  const session = sessionResolved;

  if (!session && isAuthStrict()) {
    redirect("/login");
  }

  const user = session
    ? {
        fullName: session.profile.displayName || session.profile.fullName,
        role: session.profile.role,
        avatarInitials: session.profile.avatarInitials,
        email: session.profile.email,
      }
    : undefined;

  return (
    <main className="flex min-h-screen bg-background soda-brand-wash">
      <Sidebar user={user} />

      <section className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Header
          titleKey={titleKey}
          title={title}
          layer={layer}
          subtitle={subtitle}
          notifications={notifications}
          user={user}
        />

        <div className="soda-page-enter mx-auto w-full max-w-[1600px] p-5 sm:p-6 lg:p-7">
          {showBreadcrumbs ? <Breadcrumbs pathname={pathname} /> : null}
          {recent.length > 0 ? (
            <div className="mb-4">
              <RecentlyViewed items={recent} />
            </div>
          ) : null}
          {children}
        </div>
      </section>
    </main>
  );
}
