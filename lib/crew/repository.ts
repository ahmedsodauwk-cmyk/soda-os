/**
 * Crew repository — aliases over lib/people + work-history helpers.
 */
export {
  getPeople as getCrew,
  getAllPeople as getAllCrew,
  getPersonById as getCrewMemberById,
  fetchPersonById as fetchCrewMemberById,
  refreshPeople as refreshCrew,
  createPerson as createCrewMember,
  updatePerson as updateCrewMember,
  deletePerson as deleteCrewMember,
  buildPersonPaymentLines as buildCrewPaymentLines,
  getPersonPaymentSummary as getCrewPaymentSummary,
  getPersonPerformance as getCrewPerformance,
  getPeopleOwedSummary as getCrewOwedSummary,
} from "@/lib/people/repository";

export { mockPeople as mockCrew } from "@/lib/people/seed";

import { getAssignmentsByPerson } from "@/lib/assignments/repository";
import { getClientById } from "@/lib/clients/repository";
import { getOrders } from "@/lib/orders/repository";
import { getProjects } from "@/lib/projects/repository";

/** Work history derived from order assignments — commercial + wedding. */
export function getCrewWorkHistory(personId: string) {
  const orders = new Map(getOrders().map((o) => [o.id, o]));
  const projects = new Map(getProjects().map((p) => [p.id, p]));
  const assignments = getAssignmentsByPerson(personId);

  return assignments
    .map((a) => {
      const order = orders.get(a.orderId);
      if (!order) return null;
      const project = projects.get(order.projectId);
      const client = order.clientId ? getClientById(order.clientId) : undefined;
      const isWedding =
        order.workspaceId === "weddings" ||
        order.projectType === "Wedding" ||
        client?.segment === "wedding";
      return {
        assignmentId: a.id,
        orderId: order.id,
        projectId: order.projectId,
        projectName: project?.name ?? order.clientName,
        clientId: order.clientId ?? "",
        clientName: order.clientName,
        clientSegment: isWedding ? ("wedding" as const) : ("commercial" as const),
        commercialLane: order.workspaceId,
        role: a.role,
        shootDate: order.shootDate,
        deliveryDate: order.deliveryDate,
        status: order.status,
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .sort((a, b) => b.shootDate.localeCompare(a.shootDate));
}
