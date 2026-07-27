"use client";

/**
 * Client frame for persistent shell chrome.
 * Sidebar + Header mount once; only {children} swaps on soft navigation.
 */

import { usePathname } from "next/navigation";

import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { PageAtmosphere } from "@/components/brand/page-atmosphere";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { RecentlyViewed } from "@/components/navigation/recently-viewed";
import { NotificationLiveProvider } from "@/components/notifications/notification-live-store";
import { useShell } from "@/components/layout/shell-context";
import { resolveSectionPersonality } from "@/lib/brand/tokens";
import { cn } from "@/lib/utils";
import type { RecentRecord } from "@/lib/identity/recent";

export function ShellFrame({
  recent,
  children,
}: {
  recent: RecentRecord[];
  children: React.ReactNode;
}) {
  const { user, notifications, meta } = useShell();
  const pathname = usePathname() || "/";
  const section = resolveSectionPersonality(meta.layer);
  const showBreadcrumbs = meta.showBreadcrumbs !== false;
  const compactChrome = meta.compactChrome === true;

  return (
    <NotificationLiveProvider userId={user?.userId} initial={notifications}>
      <main
        data-soda-section={section}
        className="soda-brand-wash relative flex min-h-screen bg-transparent"
      >
        <PageAtmosphere section={section} />
        <Sidebar user={user} />

        <section
          data-soda-main-scroll
          className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          <Header
            titleKey={compactChrome ? undefined : meta.titleKey}
            title={compactChrome ? undefined : meta.title}
            layer={meta.layer}
            subtitle={compactChrome ? undefined : meta.subtitle}
            notifications={notifications}
            user={user}
            compact={compactChrome}
          />

          <div
            className={cn(
              "mx-auto w-full max-w-[1600px]",
              compactChrome ? "p-3 sm:p-4 lg:p-4" : "p-4 sm:p-5 lg:p-6"
            )}
          >
            {showBreadcrumbs && !compactChrome ? (
              <Breadcrumbs pathname={pathname} />
            ) : null}
            {recent.length > 0 && !compactChrome ? (
              <div className="mb-3">
                <RecentlyViewed items={recent} />
              </div>
            ) : null}
            {children}
          </div>
        </section>
      </main>
    </NotificationLiveProvider>
  );
}
