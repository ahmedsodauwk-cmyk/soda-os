import Link from "next/link";
import { isOrderCompleted } from "@/lib/orders/status";
import { getOrders } from "@/lib/orders/repository";
import { getAssignmentsByPerson } from "@/lib/assignments/repository";
import { PeopleEmptyState } from "@/components/people/people-empty-state";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";

interface PersonOrdersPanelProps {
  personId: string;
  mode: "assigned" | "completed";
}

/**
 * Live assignment lists when data exists; honest empty otherwise.
 */
export function PersonOrdersPanel({ personId, mode }: PersonOrdersPanelProps) {
  const orders = new Map(getOrders().map((o) => [o.id, o]));
  const assignments = getAssignmentsByPerson(personId);

  const rows = assignments
    .map((a) => {
      const order = orders.get(a.orderId);
      if (!order) return null;
      const completed = isOrderCompleted(order.status);
      if (mode === "completed" && !completed) return null;
      if (mode === "assigned" && completed) return null;
      return { assignment: a, order };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .sort((a, b) => b.order.shootDate.localeCompare(a.order.shootDate));

  if (rows.length === 0) {
    return (
      <PeopleEmptyState
        title={
          mode === "assigned"
            ? "No assigned orders"
            : "No completed orders yet"
        }
        detail={
          mode === "assigned"
            ? "Orders appear here when this person is assigned on real work."
            : "Completed assignments will list here after real deliveries."
        }
      />
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map(({ assignment, order }) => (
        <li key={assignment.id}>
          <Link
            href={`/orders/${order.id}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 px-3.5 py-3 hover:border-primary/35"
          >
            <div>
              <p className="font-medium">{order.clientName}</p>
              <p className="text-xs text-muted-foreground">
                {assignment.role} · shoot {order.shootDate}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{assignment.role}</Badge>
              <OrderStatusBadge status={order.status} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
