"use client";

/**
 * Client frame for persistent shell chrome.
 * Sidebar + Header mount once; only {children} swaps on soft navigation.
 * Founder desktop: fixed right SODA Brain rail (xl+).
 */

import { usePathname } from "next/navigation";

import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { PageAtmosphere } from "@/components/brand/page-atmosphere";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { RecentlyViewed } from "@/components/navigation/recently-viewed";
import { NotificationLiveProvider } from "@/components/notifications/notification-live-store";
import { useShell } from "@/components/layout/shell-context";
import { SodaBrainPanelClient } from "@/components/layout/soda-brain-panel-client";
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
  const { user, notifications, meta, brainPanel } = useShell();
  const pathname = usePathname() || "/";
  const section = resolveSectionPersonality(meta.layer);
  const showBreadcrumbs = meta.showBreadcrumbs !== false;
  const compactChrome = meta.compactChrome === true;
  const showBrainRail =
    user?.accessLevel === "founder" && brainPanel && pathname !== "/brain";

  return (
    <NotificationLiveProvider userId={user?.userId} initial={notifications}>
      <main
        data-soda-section={section}
        className={cn(
          "soda-brand-wash relative flex min-h-screen bg-transparent",
          showBrainRail ? "soda-shell-3col" : "soda-shell-2col"
        )}
      >
        <PageAtmosphere section={section} />
        <Sidebar user={user} />

        <div className="relative z-[1] flex min-h-0 min-w-0 flex-1">
          <section
            data-soda-main-scroll
            className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto"
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

          {showBrainRail ? (
            <SodaBrainPanelClient data={brainPanel} variant="rail" />
          ) : null}
        </div>
      </main>
    </NotificationLiveProvider>
  );
}
