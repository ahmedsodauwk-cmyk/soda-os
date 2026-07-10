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
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  change,
  trend = "neutral",
  whisper,
}: StatCardProps) {
  return (
    <Card className="transition-colors hover:bg-muted/30">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            {title}
          </CardTitle>
          {whisper ? (
            <p
              className="font-ar text-xs leading-[1.65] text-muted-foreground/90"
              dir="rtl"
            >
              {whisper}
            </p>
          ) : null}
        </div>

        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
          <Icon className="size-4 text-muted-foreground" />
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
}
