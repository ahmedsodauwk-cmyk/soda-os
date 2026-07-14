/**
 * AppShell — thin page meta + children (Mission 06.0).
 * Chrome (Sidebar/Header/notifications) lives in app/(shell)/layout and stays mounted.
 * Passing `session` is accepted for backwards compatibility; layout already resolves it.
 */

import { ShellPageMeta } from "@/components/layout/shell-page-meta";
import type { HumanLayerKey } from "@/lib/brand/human-layer";
import type { SodaSession } from "@/lib/identity/session";
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
  /** @deprecated Layout resolves session — kept for page call-site compatibility. */
  session?: SodaSession | null;
}

export async function AppShell({
  titleKey,
  title,
  layer,
  subtitle,
  children,
  showBreadcrumbs = true,
}: AppShellProps) {
  return (
    <ShellPageMeta
      titleKey={titleKey}
      title={title}
      layer={layer}
      subtitle={subtitle}
      showBreadcrumbs={showBreadcrumbs}
    >
      {children}
    </ShellPageMeta>
  );
}
