import Link from "next/link";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Badge } from "@/components/ui/badge";
import { getClientProjectsWorkspace } from "@/lib/clients/aggregators";
import { clientWorkspaceHref } from "@/lib/clients/workspace";

function egp(n: number) {
  return `${n.toLocaleString("en-EG")} EGP`;
}

interface ClientProjectsPanelProps {
  clientId: string;
}

/** This client's projects → each project's orders (includes closed). */
export function ClientProjectsPanel({ clientId }: ClientProjectsPanelProps) {
  const view = getClientProjectsWorkspace(clientId);

  if (view.projects.length === 0) {
    return (
      <div className="space-y-3 rounded-2xl border border-border/60 px-4 py-6">
        <h3 className="font-heading text-base font-semibold">Projects</h3>
        <p className="text-sm text-muted-foreground">
          No projects for this client yet. Named projects and their orders will
          appear here.
        </p>
        <Link
          href={clientWorkspaceHref(clientId, "daily-work")}
          className="text-sm text-soda-pink hover:underline"
        >
          Check Daily Work →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="font-heading text-base font-semibold">Projects</h3>
          <p className="text-sm text-muted-foreground">
            Client-owned only. Closed projects stay visible for history.
          </p>
        </div>
        <Badge variant="outline">
          {view.projects.length} · {view.closedCount} closed
        </Badge>
      </div>

      {view.projects.map(({ project, orders, collected, outstanding }) => (
        <section
          key={project.id}
          className="space-y-3 rounded-2xl border border-border/60 p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link
                href={`/projects/${project.id}`}
                className="font-heading text-base font-semibold hover:text-soda-pink"
              >
                {project.name}
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">
                {project.status}
                {project.journeyStage ? ` · ${project.journeyStage}` : ""} ·{" "}
                {orders.length} orders
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>Collected {egp(collected)}</p>
              <p className={outstanding > 0 ? "text-soda-pink" : undefined}>
                Outstanding {egp(outstanding)}
              </p>
            </div>
          </div>

          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders on this project.</p>
          ) : (
            <ul className="space-y-2">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/orders/${order.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/50 px-3.5 py-3 transition-colors hover:border-soda-pink/35"
                  >
                    <div>
                      <p className="font-medium">{order.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.shootDate} · {egp(order.price)}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
