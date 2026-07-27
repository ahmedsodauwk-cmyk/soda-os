"use client";

import { useLayoutEffect, type ReactNode } from "react";

import type { HumanLayerKey } from "@/lib/brand/human-layer";
import type { DictKey } from "@/lib/i18n/dictionaries";
import { useShellOptional } from "@/components/layout/shell-context";

type Props = {
  titleKey?: DictKey;
  title?: string;
  layer: HumanLayerKey;
  subtitle?: string;
  showBreadcrumbs?: boolean;
  compactChrome?: boolean;
  children: ReactNode;
};

/**
 * Thin page chrome — updates header title/layer without remounting Sidebar/Header.
 * Used by AppShell when rendered inside app/(shell)/layout.
 */
export function ShellPageMeta({
  titleKey,
  title,
  layer,
  subtitle,
  showBreadcrumbs = true,
  compactChrome = false,
  children,
}: Props) {
  const shell = useShellOptional();
  const setMeta = shell?.setMeta;

  useLayoutEffect(() => {
    if (!setMeta) return;
    setMeta({
      titleKey,
      title,
      layer,
      subtitle,
      showBreadcrumbs,
      compactChrome,
    });
  }, [setMeta, titleKey, title, layer, subtitle, showBreadcrumbs, compactChrome]);

  return <>{children}</>;
}
