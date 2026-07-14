"use client";

/**
 * Persistent shell chrome context (Mission 06.0).
 * Lives in app/(shell)/layout — Sidebar/Header stay mounted across soft navigations.
 * Page title/layer updates without remounting chrome.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { HumanLayerKey } from "@/lib/brand/human-layer";
import type { NotificationRecord } from "@/lib/core/types";
import type { DictKey } from "@/lib/i18n/dictionaries";
import type { SidebarUser } from "@/components/layout/sidebar";

export type ShellPageMeta = {
  titleKey?: DictKey;
  title?: string;
  layer: HumanLayerKey;
  subtitle?: string;
  showBreadcrumbs?: boolean;
};

type ShellContextValue = {
  user?: SidebarUser;
  notifications: NotificationRecord[];
  meta: ShellPageMeta;
  setMeta: (meta: ShellPageMeta) => void;
};

const ShellContext = createContext<ShellContextValue | null>(null);

const DEFAULT_META: ShellPageMeta = {
  titleKey: "pages.home",
  layer: "dashboard",
  showBreadcrumbs: true,
};

export function ShellProvider({
  user,
  notifications,
  children,
}: {
  user?: SidebarUser;
  notifications: NotificationRecord[];
  children: ReactNode;
}) {
  const [meta, setMetaState] = useState<ShellPageMeta>(DEFAULT_META);

  const setMeta = useCallback((next: ShellPageMeta) => {
    setMetaState((prev) => {
      if (
        prev.titleKey === next.titleKey &&
        prev.title === next.title &&
        prev.layer === next.layer &&
        prev.subtitle === next.subtitle &&
        prev.showBreadcrumbs === next.showBreadcrumbs
      ) {
        return prev;
      }
      return {
        showBreadcrumbs: true,
        ...next,
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      notifications,
      meta,
      setMeta,
    }),
    [user, notifications, meta, setMeta]
  );

  return (
    <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
  );
}

export function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext);
  if (!ctx) {
    throw new Error("useShell must be used within ShellProvider");
  }
  return ctx;
}

/** Optional — pages outside shell layout return null. */
export function useShellOptional(): ShellContextValue | null {
  return useContext(ShellContext);
}
