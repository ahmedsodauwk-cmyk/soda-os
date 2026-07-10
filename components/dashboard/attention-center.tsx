import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  CreditCard,
  UserX,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DASHBOARD_SECTION_COPY,
  getEmptyState,
} from "@/lib/brand/soda-voice";
import type { AttentionItem } from "@/lib/dashboard/types";
import { formatPrice } from "@/lib/orders/utils";
import { cn } from "@/lib/utils";

interface AttentionCenterProps {
  items: AttentionItem[];
  limit?: number;
}

const categoryIcon = {
  overdue_delivery: Clock,
  unpaid_client: CreditCard,
  unassigned_team: UserX,
  deadline_soon: AlertTriangle,
} as const;

const severityStyles: Record<AttentionItem["severity"], string> = {
  critical: "border-red-500/30 bg-red-500/10 text-red-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-400",
};

export default function AttentionCenter({
  items,
  limit = 10,
}: AttentionCenterProps) {
  const visible = items.slice(0, limit);
  const remaining = Math.max(0, items.length - visible.length);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{DASHBOARD_SECTION_COPY.attention.title}</CardTitle>
            <CardDescription>
              {DASHBOARD_SECTION_COPY.attention.description}
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono tabular-nums">
            {items.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {visible.length === 0 ? (
          <div className="rounded-lg bg-emerald-500/10 px-3 py-4 text-emerald-400">
            <p className="text-sm font-medium">
              {getEmptyState("attentionClear").title}
            </p>
            <p className="mt-1 text-xs text-emerald-400/80">
              {getEmptyState("attentionClear").description}
            </p>
          </div>
        ) : (
          visible.map((item) => {
            const Icon = categoryIcon[item.category];
            const body = (
              <div
                className={cn(
                  "flex items-start gap-3 rounded-lg border border-transparent p-3 transition-colors",
                  item.href && "hover:bg-muted/50"
                )}
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{item.title}</p>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px]", severityStyles[item.severity])}
                    >
                      {item.severity}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.detail}
                    {item.amount != null
                      ? ` · ${formatPrice(item.amount)}`
                      : ""}
                  </p>
                </div>
              </div>
            );

            return item.href ? (
              <Link key={item.id} href={item.href} className="block">
                {body}
              </Link>
            ) : (
              <div key={item.id}>{body}</div>
            );
          })
        )}

        {remaining > 0 ? (
          <p className="pt-1 text-xs text-muted-foreground">
            +{remaining} more issue{remaining === 1 ? "" : "s"}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
