import Link from "next/link";

import { RelationshipEmptyState } from "@/components/clients/relationship-empty-state";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Badge } from "@/components/ui/badge";
import { getClientDailyWork } from "@/lib/clients/aggregators";

function egp(n: number) {
  return `${n.toLocaleString("en-EG")} EGP`;
}

interface ClientDailyWorkPanelProps {
  clientId: string;
}

/** Year → Month → Orders for monthly closing. */
export function ClientDailyWorkPanel({ clientId }: ClientDailyWorkPanelProps) {
  const view = getClientDailyWork(clientId);

  if (view.orderCount === 0) {
    return (
      <RelationshipEmptyState
        title="Daily Work"
        question="What work together outside named Projects?"
        detail={view.belongingNote}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="font-heading text-base font-semibold">Daily Work</h3>
          <p className="text-sm text-muted-foreground">{view.belongingNote}</p>
        </div>
        <Badge variant="outline">{view.orderCount} orders</Badge>
      </div>

      {view.years.map((year) => (
        <section key={year.year} className="space-y-4">
          <h4 className="font-heading text-lg font-semibold tracking-tight text-soda-purple dark:text-soda-pink">
            {year.year}
          </h4>
          {year.months.map((month) => (
            <div
              key={month.monthKey}
              className="space-y-2 rounded-2xl border border-border/60 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-heading text-sm font-semibold">{month.label}</p>
                <p className="text-xs text-muted-foreground">
                  {month.orderCount} · {egp(month.totalPrice)}
                </p>
              </div>
              <ul className="space-y-2">
                {month.orders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/orders/${order.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/50 px-3.5 py-3 transition-colors hover:border-soda-pink/35"
                    >
                      <div>
                        <p className="font-medium">{order.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.shootDate} · {order.location || "—"} ·{" "}
                          {egp(order.price)}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
