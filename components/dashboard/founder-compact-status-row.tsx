import Link from "next/link";
import {
  Activity,
  Bell,
  CheckSquare,
  HardDrive,
} from "lucide-react";

import { SodaLanguage } from "@/components/brand/soda-language";
import type { AttentionItem, TeamPerformanceRow } from "@/lib/dashboard/types";
import type { HealthStatus } from "@/lib/backup/types";
import { cn } from "@/lib/utils";

type CompactTileProps = {
  href: string;
  label: string;
  value: string;
  layer: "teamActivity" | "pendingApprovals" | "unreadNotifications" | "storageStatus";
  icon: typeof Activity;
  tone?: string;
};

function CompactTile({
  href,
  label,
  value,
  layer,
  icon: Icon,
  tone,
}: CompactTileProps) {
  return (
    <Link
      href={href}
      className={cn(
        "soda-founder-metric group flex min-w-0 flex-col gap-1 rounded-lg border border-border/60 bg-card/60 px-3 py-2.5 transition-colors",
        "hover:border-soda-pink/35 hover:bg-soda-pink/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="soda-kpi-icon-pink flex size-7 shrink-0 items-center justify-center rounded-md">
          <Icon className="size-3.5" aria-hidden />
        </div>
        <p className="truncate text-sm font-semibold text-foreground">{label}</p>
      </div>
      <p
        className={cn(
          "font-mono text-lg font-bold tabular-nums leading-none",
          tone
        )}
      >
        {value}
      </p>
      <SodaLanguage layer={layer} size="compact" className="hidden truncate sm:block" />
    </Link>
  );
}

function storageTone(status: HealthStatus | null): string {
  if (status === "OK") return "text-emerald-600 dark:text-emerald-400";
  if (status === "DEGRADED") return "text-amber-600 dark:text-amber-400";
  if (status === "UNAVAILABLE") return "text-rose-600 dark:text-rose-400";
  return "text-muted-foreground";
}

interface FounderCompactStatusRowProps {
  team: TeamPerformanceRow[];
  attention: AttentionItem[];
  unreadNotifications: number;
  storageStatus: HealthStatus | null;
  showStorage?: boolean;
}

/** Compact lower row — team activity, approvals, notifications, storage (real only). */
export function FounderCompactStatusRow({
  team,
  attention,
  unreadNotifications,
  storageStatus,
  showStorage = false,
}: FounderCompactStatusRowProps) {
  const activeTeam = team.filter((t) => t.currentWorkload > 0).length;
  const pendingApprovals = attention.filter(
    (a) =>
      a.severity === "critical" ||
      a.severity === "warning" ||
      a.category === "deadline_soon"
  ).length;

  const tiles: CompactTileProps[] = [
    {
      href: "/people",
      label: "Team Activity",
      value: `${activeTeam} / ${team.length}`,
      layer: "teamActivity",
      icon: Activity,
    },
    {
      href: "/attention",
      label: "Pending Approvals",
      value: String(pendingApprovals),
      layer: "pendingApprovals",
      icon: CheckSquare,
    },
    {
      href: "/notifications",
      label: "Unread Notifications",
      value: String(unreadNotifications),
      layer: "unreadNotifications",
      icon: Bell,
    },
  ];

  if (showStorage && storageStatus) {
    tiles.push({
      href: "/settings/backup",
      label: "Storage",
      value: storageStatus,
      layer: "storageStatus",
      icon: HardDrive,
      tone: storageTone(storageStatus),
    });
  }

  return (
    <section aria-label="Studio status">
      <div
        className={cn(
          "soda-founder-status-row soda-stagger-children grid gap-2",
          showStorage && storageStatus
            ? "grid-cols-2 lg:grid-cols-4"
            : "grid-cols-2 lg:grid-cols-3"
        )}
      >
        {tiles.map((tile) => (
          <CompactTile key={tile.label} {...tile} />
        ))}
      </div>
    </section>
  );
}
