import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import type { WeddingMonthGroup } from "@/lib/business/wedding-orders";

function egp(n: number) {
  return `${n.toLocaleString("en-EG")} EGP`;
}

interface WeddingMonthGroupsProps {
  groups: WeddingMonthGroup[];
}

export function WeddingMonthGroups({ groups }: WeddingMonthGroupsProps) {
  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No wedding orders yet.</p>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.monthKey} className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border/60 pb-2">
            <div>
              <h3 className="font-heading text-lg font-semibold tracking-tight">
                {group.label}
              </h3>
              <p className="text-xs text-muted-foreground">
                {group.count} orders · {egp(group.revenue)} booked
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {group.upcoming > 0 ? (
                <Badge variant="outline">{group.upcoming} upcoming</Badge>
              ) : null}
              {group.delayed > 0 ? (
                <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-300">
                  {group.delayed} delayed
                </Badge>
              ) : null}
              {group.delivered > 0 ? (
                <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                  {group.delivered} delivered
                </Badge>
              ) : null}
            </div>
          </div>
          <ul className="space-y-2">
            {group.orders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/40 px-3.5 py-3"
              >
                <div className="min-w-0">
                  {order.clientId ? (
                    <Link
                      href={`/clients/${order.clientId}`}
                      className="cursor-pointer font-medium text-soda-pink hover:underline"
                    >
                      {order.clientName}
                    </Link>
                  ) : (
                    <p className="font-medium">{order.clientName}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {order.projectType} · Shoot {order.shootDate} · Delivery{" "}
                    {order.deliveryDate}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    <Link
                      href={`/orders/${order.id}`}
                      className="cursor-pointer hover:text-soda-pink hover:underline"
                    >
                      {order.id}
                    </Link>
                    {order.projectId ? (
                      <>
                        {" · "}
                        <Link
                          href={`/projects/${order.projectId}`}
                          className="cursor-pointer text-soda-pink hover:underline"
                        >
                          {order.projectId}
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-mono text-xs">{egp(order.price)}</p>
                  <OrderStatusBadge status={order.status} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
