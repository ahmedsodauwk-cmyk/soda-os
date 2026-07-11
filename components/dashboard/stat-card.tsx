import Link from "next/link";
import { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type StatCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: string;
  trend?: "up" | "down" | "neutral";
  /** Soft Egyptian Arabic line under the English title */
  whisper?: string;
  /** Next logical page — required by navigation engine */
  href?: string;
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  change,
  trend = "neutral",
  whisper,
  href,
}: StatCardProps) {
  const card = (
    <Card
      className={cn(
        "soda-cc-card border-border/70 transition-colors hover:border-primary/30 hover:bg-primary/[0.04]",
        href && "cursor-pointer"
      )}
    >
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {whisper ? (
            <p
              className="font-ar text-[13px] leading-[1.75] text-muted-foreground"
              dir="rtl"
            >
              {whisper}
            </p>
          ) : null}
        </div>

        <div className="soda-kpi-icon flex size-8 shrink-0 items-center justify-center rounded-md">
          <Icon className="size-4" />
        </div>
      </CardHeader>

      <CardContent>
        <p className="font-mono text-2xl font-semibold tracking-tight">
          {value}
        </p>

        {change && (
          <p
            className={cn(
              "mt-1 text-xs",
              trend === "up" && "text-emerald-500",
              trend === "down" && "text-red-500",
              trend === "neutral" && "text-muted-foreground"
            )}
          >
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (!href) return card;
  return (
    <Link href={href} className="block focus-visible:outline-none">
      {card}
    </Link>
  );
}
