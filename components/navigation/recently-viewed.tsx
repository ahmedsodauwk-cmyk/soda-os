import Link from "next/link";
import { Clock } from "lucide-react";

import type { RecentRecord } from "@/lib/identity/recent";

interface RecentlyViewedProps {
  items: RecentRecord[];
}

export function RecentlyViewed({ items }: RecentlyViewedProps) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Clock className="size-3.5" />
        Recently viewed
      </div>
      <ul className="flex flex-wrap gap-2">
        {items.slice(0, 8).map((item) => (
          <li key={`${item.entityType}-${item.entityId}`}>
            <Link
              href={item.href}
              className="inline-flex rounded-md border border-border/70 bg-background/60 px-2 py-1 text-xs hover:border-soda-pink/40 hover:text-soda-pink"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
