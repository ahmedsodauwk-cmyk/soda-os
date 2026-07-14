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
import { useShell } from "@/components/layout/shell-context";
import { resolveSectionPersonality } from "@/lib/brand/tokens";
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

  return (
    <main
      data-soda-section={section}
      className="soda-brand-wash relative flex min-h-screen overflow-hidden bg-transparent"
    >
      <PageAtmosphere section={section} />
      <Sidebar user={user} />

      <section
        data-soda-main-scroll
        className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-y-auto"
      >
        <Header
          titleKey={meta.titleKey}
          title={meta.title}
          layer={meta.layer}
          subtitle={meta.subtitle}
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
