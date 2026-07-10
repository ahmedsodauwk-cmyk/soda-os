import { computeProgressFromOrders } from "@/lib/business/progress";
import { BUSINESS_TODAY } from "@/lib/business/types";
import type { ProjectComputedStats } from "@/lib/business/types";
import type { Order } from "@/lib/orders/types";
import type {
  Project,
  ProjectOrderStub,
  ProjectShoot,
  ProjectTeamMember,
} from "@/lib/projects/types";

function toUpcomingShoot(order: Order): ProjectShoot {
  return {
    id: `shoot-${order.id}`,
    title: `${order.clientName} — ${order.projectType}`,
    date: order.shootDate,
    location: order.location,
    status: order.status,
  };
}

export function toProjectOrderStub(order: Order): ProjectOrderStub {
  return {
    id: order.id,
    clientName: order.clientName,
    status: order.status,
    shootDate: order.shootDate,
    price: order.price,
  };
}

export function computeUpcomingShoots(
  orders: Order[],
  today: string = BUSINESS_TODAY
): ProjectShoot[] {
  return orders
    .filter(
      (o) =>
        o.status !== "Cancelled" &&
        o.status !== "Delivered" &&
        o.shootDate >= today
    )
    .sort((a, b) => a.shootDate.localeCompare(b.shootDate))
    .map(toUpcomingShoot);
}

export function computeLastActivity(
  project: Pick<Project, "updatedAt" | "activity">,
  orders: Order[]
): string {
  const candidates: string[] = [project.updatedAt];

  if (project.activity?.length) {
    for (const event of project.activity) {
      candidates.push(event.createdAt);
    }
  }

  for (const order of orders) {
    candidates.push(`${order.shootDate}T12:00:00Z`);
    candidates.push(`${order.deliveryDate}T12:00:00Z`);
  }

  return candidates.reduce((latest, iso) => (iso > latest ? iso : latest));
}

export function computeProjectStats(
  project: Pick<Project, "updatedAt" | "activity" | "team">,
  orders: Order[]
): ProjectComputedStats {
  const billable = orders.filter((o) => o.status !== "Cancelled");
  const upcomingShoots = computeUpcomingShoots(orders);
  const assignedTeam: ProjectTeamMember[] = project.team ?? [];

  return {
    ordersCount: orders.length,
    revenue: billable.reduce((acc, o) => acc + o.price, 0),
    progress: computeProgressFromOrders(orders),
    assignedTeam,
    upcomingShoot: upcomingShoots[0] ?? null,
    upcomingShoots,
    lastActivity: computeLastActivity(project, orders),
  };
}
