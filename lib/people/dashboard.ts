/**
 * Crew dashboard aggregates — real orders/assignments only.
 */

import {
  getAssignmentsByPerson,
  type OrderAssignment,
} from "@/lib/assignments/repository";
import { getOrderById } from "@/lib/orders/repository";
import type { Order } from "@/lib/orders/types";
import { isOrderActiveWorkload, isOrderCompleted } from "@/lib/orders/status";
import { getPersonPerformance } from "@/lib/people/repository";
import { buildCrewTimeline, type CrewTimelineItem } from "@/lib/people/timeline";
import type { Person, PersonPerformance } from "@/lib/people/types";

export type CrewDashboardSnapshot = {
  person: Person;
  currentOrders: Array<{ assignment: OrderAssignment; order: Order }>;
  assignedWork: Array<{ assignment: OrderAssignment; order: Order }>;
  pendingReviews: Array<{ assignment: OrderAssignment; order: Order }>;
  performance: PersonPerformance;
  lastActivity: CrewTimelineItem | null;
  attendanceEmpty: true;
};

export function getCrewDashboardSnapshot(
  person: Person
): CrewDashboardSnapshot {
  const assignments = getAssignmentsByPerson(person.id);
  const withOrders = assignments
    .map((assignment) => {
      const order = getOrderById(assignment.orderId);
      if (!order) return null;
      return { assignment, order };
    })
    .filter((x): x is { assignment: OrderAssignment; order: Order } =>
      Boolean(x)
    );

  const currentOrders = withOrders.filter(({ order, assignment }) => {
    if (assignment.assignmentStatus === "cancelled") return false;
    return isOrderActiveWorkload(order.status);
  });

  const assignedWork = withOrders.filter(
    ({ assignment }) =>
      assignment.assignmentStatus === "assigned" ||
      assignment.assignmentStatus === "confirmed" ||
      assignment.assignmentStatus === "checked_in"
  );

  const pendingReviews = withOrders.filter(
    ({ assignment, order }) =>
      assignment.assignmentStatus === "assigned" &&
      !isOrderCompleted(order.status)
  );

  const timeline = buildCrewTimeline(person, 5);

  return {
    person,
    currentOrders,
    assignedWork,
    pendingReviews,
    performance: getPersonPerformance(person.id),
    lastActivity: timeline[0] ?? null,
    attendanceEmpty: true,
  };
}
