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
import { getRecentlyViewed } from "@/lib/identity/recent";
import {
  isAuthStrict,
  resolveSessionForApp,
} from "@/lib/identity/session";

interface AppShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  showBreadcrumbs?: boolean;
}

export async function AppShell({
  title,
  subtitle,
  children,
  showBreadcrumbs = true,
}: AppShellProps) {
  const headerList = await headers();
  const pathname =
    headerList.get("x-pathname") ||
    headerList.get("x-invoke-path") ||
    headerList.get("next-url") ||
    "/";

  // Parallelize shell data — session is React-cached when pages also call it.
  const [session, events, recent] = await Promise.all([
    resolveSessionForApp(),
    refreshBusinessEventsFromDb(20).catch(() => []),
    getRecentlyViewed(),
  ]);

  if (!session && isAuthStrict()) {
    redirect("/login");
  }

  const notifications = hydrateNotificationsFromEvents(events);

  const user = session
    ? {
        fullName: session.profile.fullName,
        role: session.profile.role,
        avatarInitials: session.profile.avatarInitials,
        email: session.profile.email,
      }
    : undefined;

  return (
    <main className="flex min-h-screen bg-background">
      <Sidebar user={user} />

      <section className="flex flex-1 flex-col overflow-y-auto">
        <Header
          title={title}
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
