import Link from "next/link";

import { SodaSectionHeader } from "@/components/brand/soda-section-header";
import type { HumanLayerKey } from "@/lib/brand/human-layer";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

type HomePanelCardProps = {
  title: string;
  layer: HumanLayerKey;
  href?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  children: React.ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
};

/** Shared V3 panel card — substitutes in same visual slots across roles. */
export function HomePanelCard({
  title,
  layer,
  href,
  viewAllHref,
  viewAllLabel = "View All",
  children,
  emptyMessage,
  isEmpty,
}: HomePanelCardProps) {
  return (
    <Card className="soda-founder-panel soda-cc-card h-full min-w-0">
      <CardHeader className="flex-row items-start justify-between space-y-0 px-3 py-2.5 pb-1.5">
        {href ? (
          <Link href={href} className="min-w-0 flex-1">
            <SodaSectionHeader title={title} layer={layer} as="h2" size="card" />
          </Link>
        ) : (
          <SodaSectionHeader title={title} layer={layer} as="h2" size="card" />
        )}
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="shrink-0 text-sm font-semibold text-soda-pink hover:underline"
          >
            {viewAllLabel}
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="px-3 pb-2.5 pt-0">
        {isEmpty && emptyMessage ? (
          <p className="rounded-lg border border-border/50 bg-muted/20 px-3 py-4 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
