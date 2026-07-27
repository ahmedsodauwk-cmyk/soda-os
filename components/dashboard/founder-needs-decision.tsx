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
import type { AttentionItem } from "@/lib/dashboard/types";
import { formatPrice } from "@/lib/orders/utils";
import { cn } from "@/lib/utils";

const categoryIcon = {
  overdue_delivery: Clock,
  unpaid_client: CreditCard,
  waiting_payment: CreditCard,
  unassigned_team: UserX,
  deadline_soon: AlertTriangle,
} as const;

/** Subtle priority — no loud warning reds. */
const severityStyles: Record<AttentionItem["severity"], string> = {
  critical:
    "border-soda-pink/25 bg-soda-pink/8 text-foreground",
  warning:
    "border-primary/20 bg-primary/6 text-foreground",
  info: "border-border/60 bg-muted/30 text-muted-foreground",
};

const severityLabel: Record<AttentionItem["severity"], string> = {
  critical: "عاجل",
  warning: "متابعة",
  info: "معلومة",
};

function priorityScore(item: AttentionItem): number {
  const base =
    item.severity === "critical" ? 100 : item.severity === "warning" ? 50 : 10;
  const cat =
    item.category === "unpaid_client"
      ? 30
      : item.category === "overdue_delivery"
        ? 25
        : item.category === "unassigned_team"
          ? 20
          : 10;
  return base + cat;
}

interface FounderNeedsDecisionProps {
  items: AttentionItem[];
  limit?: number;
}

/** Needs Your Decision — approvals, delays, collections, crew gaps. */
export function FounderNeedsDecision({
  items,
  limit = 5,
}: FounderNeedsDecisionProps) {
  const sorted = [...items].sort((a, b) => priorityScore(b) - priorityScore(a));
  const visible = sorted.slice(0, limit);
  const remaining = Math.max(0, sorted.length - visible.length);

  return (
    <Card className="soda-founder-panel soda-cc-card h-full">
      <CardHeader className="flex-row items-start justify-between space-y-0 px-3 py-2.5 pb-1.5">
        <div>
          <CardTitle className="font-ar text-sm font-semibold" dir="rtl">
            محتاج قرارك
          </CardTitle>
          <CardDescription className="font-ar text-[11px]" dir="rtl">
            موافقات، تأخير، تحصيل، وطاقم ناقص — بالأولوية
          </CardDescription>
        </div>
        <Link href="/attention">
          <Badge
            variant="outline"
            className="border-soda-pink/25 bg-soda-pink/8 font-mono text-[10px] tabular-nums text-soda-pink"
          >
            {items.length}
          </Badge>
        </Link>
      </CardHeader>
      <CardContent className="space-y-1 px-3 pb-2.5 pt-0">
        {visible.length === 0 ? (
          <p
            className="font-ar rounded-lg border border-border/50 bg-muted/20 px-3 py-3 text-center text-xs text-muted-foreground"
            dir="rtl"
          >
            كل حاجة ماشية — مفيش قرارات مستنية دلوقتي.
          </p>
        ) : (
          visible.map((item) => {
            const Icon = categoryIcon[item.category];
            const body = (
              <div
                className={cn(
                  "flex items-start gap-2 rounded-md border px-2 py-1.5 transition-colors",
                  severityStyles[item.severity],
                  item.href && "hover:bg-muted/30"
                )}
              >
                <Icon className="mt-0.5 size-3.5 shrink-0 opacity-70" />
                <div className="min-w-0 flex-1" dir="rtl">
                  <div className="flex flex-wrap items-center gap-1">
                    <p className="font-ar text-xs font-medium leading-snug">
                      {item.title}
                    </p>
                    <span className="font-ar text-[9px] text-muted-foreground">
                      {severityLabel[item.severity]}
                    </span>
                  </div>
                  <p className="font-ar text-[10px] leading-relaxed text-muted-foreground">
                    {item.detail}
                    {item.amount != null ? ` · ${formatPrice(item.amount)}` : ""}
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
          <Link
            href="/attention"
            className="font-ar block pt-0.5 text-center text-[10px] text-soda-pink hover:underline"
            dir="rtl"
          >
            +{remaining} تانية — عرض الكل
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
