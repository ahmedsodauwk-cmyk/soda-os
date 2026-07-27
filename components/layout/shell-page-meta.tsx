"use client";

import { useLayoutEffect, type ReactNode } from "react";

import { SodaLanguage } from "@/components/brand/soda-language";
import type { HumanLayerKey } from "@/lib/brand/human-layer";
import type { DictKey } from "@/lib/i18n/dictionaries";
import { operationalT } from "@/lib/i18n/operational";
import { useShellOptional } from "@/components/layout/shell-context";

type Props = {
  titleKey?: DictKey;
  title?: string;
  layer: HumanLayerKey;
  /** SODA Language override — Egyptian Arabic guidance (route-aware via callers). */
  subtitle?: string;
  /** Inline SODA Language under page body chrome when needed. */
  showGuidance?: boolean;
  showBreadcrumbs?: boolean;
  compactChrome?: boolean;
  children: ReactNode;
};

/** Reusable SODA Language block for page sections (English title lives elsewhere). */
export function ShellSodaGuidance({
  layer,
  children,
  className,
}: {
  layer?: HumanLayerKey;
  children?: string;
  className?: string;
}) {
  return (
    <SodaLanguage layer={layer} size="section" className={className}>
      {children}
    </SodaLanguage>
  );
}

/**
 * Thin page chrome — updates header title/layer without remounting Sidebar/Header.
 * Used by AppShell when rendered inside app/(shell)/layout.
 */
export function ShellPageMeta({
  titleKey,
  title,
  layer,
  subtitle,
  showGuidance = false,
  showBreadcrumbs = true,
  compactChrome = false,
  children,
}: Props) {
  const shell = useShellOptional();
  const setMeta = shell?.setMeta;
  const resolvedTitle =
    title ?? (titleKey ? operationalT(titleKey) : undefined);

  useLayoutEffect(() => {
    if (!setMeta) return;
    setMeta({
      titleKey,
      title: resolvedTitle,
      layer,
      subtitle,
      showBreadcrumbs,
      compactChrome,
    });
  }, [
    setMeta,
    titleKey,
    resolvedTitle,
    layer,
    subtitle,
    showBreadcrumbs,
    compactChrome,
  ]);

  return (
    <>
      {showGuidance && !compactChrome ? (
        <ShellSodaGuidance layer={layer} className="mb-3">
          {subtitle}
        </ShellSodaGuidance>
      ) : null}
      {children}
    </>
  );
}
