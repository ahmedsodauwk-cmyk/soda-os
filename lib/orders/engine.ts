/**
 * Smart Order Engine V3 — single orchestrator.
 * Order is the source of truth: create / edit / confirm / complete / cancel
 * auto-sync Client → Project → Assignments → Calendar → Finance → Dashboard.
 * Reuses lib/integration, lib/finance, assignments, calendar (derived).
 */

import {
  createAssignment,
  deleteAssignment,
  getAssignmentsByOrder,
  type OrderAssignment,
} from "@/lib/assignments/repository";
import { ensureOrderProjectLink } from "@/lib/business/link-order";
import {
  createClient,
  getClientById,
  updateClient,
} from "@/lib/clients/repository";
import type { Client } from "@/lib/clients/types";
import {
  getEquipmentAssignmentsByPerson,
  releaseEquipmentAssignment,
} from "@/lib/equipment/repository";
import {
  createFinancialEvent,
  listFinancialEvents,
} from "@/lib/finance/repository";
import type { FinancialEvent } from "@/lib/finance/types";
import {
  assignCrewToOrder,
  emitOrderClientPayment,
} from "@/lib/integration/flows";
import { getClientOperatingView } from "@/lib/integration/queries";
import {
  createOrder,
  fetchOrderById,
  getOrderById,
  updateOrder,
} from "@/lib/orders/repository";
import {
  isOrderBillable,
  isOrderCompleted,
  isOrderHolding,
  mapOrderStatusToProjectStatus,
} from "@/lib/orders/status";
import type {
  NewOrderInput,
  Order,
  OrderStatus,
  SmartOrderInput,
} from "@/lib/orders/types";
import { workspaceIdFromProjectType } from "@/lib/orders/utils";
import {
  assertValidOrThrow,
  validateSmartOrderInput,
} from "@/lib/orders/validation";
import { getPersonById } from "@/lib/people/repository";
import {
  createProject,
  getProjectSeedById,
  getProjectsByClient,
  updateProject,
} from "@/lib/projects/repository";
import type { Project } from "@/lib/projects/types";
import { ensureTaxonomyPersisted } from "@/lib/taxonomy/persist";

export interface ClientOrderContext {
  client: Client;
  previousOrders: Order[];
  projects: Project[];
  revenue: number;
  outstanding: number;
  lastShoot: string | null;
  collectionStatus: "clear" | "partial" | "outstanding" | "none";
}

export interface SmartOrderResult {
  order: Order;
  clientId: string;
  projectId: string;
  assignments: OrderAssignment[];
  financeEvents: FinancialEvent[];
  createdClient: boolean;
  createdProject: boolean;
}

export interface OrderTransitionResult {
  order: Order;
  assignments: OrderAssignment[];
  releasedAssignmentIds: string[];
  releasedEquipmentIds: string[];
  financeEvents: FinancialEvent[];
}

function emptyHub(): Pick<
  Project,
  | "overview"
  | "orders"
  | "calendar"
  | "files"
  | "payments"
  | "timeline"
  | "notes"
  | "activity"
  | "deliverables"
> {
  return {
    overview: { summary: "", milestones: [], nextAction: "" },
    orders: [],
    calendar: [],
    files: [],
    payments: [],
    timeline: [],
    notes: [],
    activity: [],
    deliverables: [],
  };
}

function normalizeInput(input: SmartOrderInput): SmartOrderInput {
  return {
    ...input,
    clientName: input.clientName.trim(),
    phone: input.phone.trim(),
    whatsapp: (input.whatsapp ?? input.phone ?? "").trim(),
    location: input.location?.trim() ?? "",
    deliveryDate: input.deliveryDate?.trim() ?? "",
    notes: input.notes?.trim() ?? "",
    brief: input.brief?.trim() ?? "",
    latePenaltyReason: input.latePenaltyReason?.trim() ?? "",
    squadMemberIds: [...new Set(input.squadMemberIds ?? [])],
    workspaceId:
      input.workspaceId || workspaceIdFromProjectType(input.projectType),
  };
}

function toNewOrderInput(input: SmartOrderInput): NewOrderInput {
  return {
    clientId: input.clientId,
    projectId: input.projectId,
    clientName: input.clientName,
    phone: input.phone,
    whatsapp: input.whatsapp ?? "",
    projectType: input.projectType,
    workspaceId: input.workspaceId,
    subcategoryId: input.subcategoryId,
    shootDate: input.shootDate,
    location: input.location ?? "",
    deliveryDate: input.deliveryDate ?? "",
    price: input.price,
    deposit: input.deposit,
    team: input.team,
    squadMemberIds: input.squadMemberIds ?? [],
    status: input.status,
    brief: input.brief ?? "",
    dressCode: input.dressCode,
    latePenaltyEnabled: input.latePenaltyEnabled ?? false,
    latePenaltyAmount: input.latePenaltyAmount ?? 0,
    latePenaltyReason: input.latePenaltyReason ?? "",
    notes: input.notes ?? "",
  };
}

/** Snapshot used by Smart Client autocomplete fill. */
export function getClientOrderContext(clientId: string): ClientOrderContext | null {
  const client = getClientById(clientId);
  if (!client) return null;
  const view = getClientOperatingView(clientId);
  const shoots = view.orders
    .map((o) => o.shootDate)
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));
  const outstanding = view.finance.outstanding;
  const paid = view.finance.paid;
  let collectionStatus: ClientOrderContext["collectionStatus"] = "none";
  if (view.orders.length === 0) collectionStatus = "none";
  else if (outstanding <= 0) collectionStatus = "clear";
  else if (paid > 0) collectionStatus = "partial";
  else collectionStatus = "outstanding";

  return {
    client,
    previousOrders: view.orders,
    projects: view.projects,
    revenue: view.finance.obligatedTotal,
    outstanding,
    lastShoot: shoots[0] ?? null,
    collectionStatus,
  };
}

async function resolveClient(
  input: SmartOrderInput
): Promise<{ clientId: string; created: boolean }> {
  if (input.createNewClient) {
    const segment =
      input.projectType === "Wedding" || input.projectType === "Engagement"
        ? "wedding"
        : "commercial";
    const client = await createClient({
      type: segment === "commercial" ? "company" : "individual",
      segment,
      name: input.clientName,
      phone: input.phone,
      whatsapp: input.whatsapp || input.phone,
    });
    return { clientId: client.id, created: true };
  }

  if (input.clientId && getClientById(input.clientId)) {
    return { clientId: input.clientId, created: false };
  }

  // Fall through to ensureOrderProjectLink resolve/create
  return { clientId: input.clientId ?? "", created: false };
}

async function resolveProject(
  input: SmartOrderInput,
  clientId: string
): Promise<{ projectId?: string; created: boolean }> {
  if (input.projectId && getProjectSeedById(input.projectId)) {
    return { projectId: input.projectId, created: false };
  }

  if (input.createNewProject || (!input.projectId && clientId)) {
    // Prefer linking an existing open project for this client when not forcing new
    if (!input.createNewProject && clientId) {
      const existing = getProjectsByClient(clientId).find(
        (p) =>
          p.isActive &&
          p.status !== "Cancelled" &&
          p.status !== "Completed" &&
          p.workspaceId ===
            (input.workspaceId || workspaceIdFromProjectType(input.projectType))
      );
      if (existing) {
        return { projectId: existing.id, created: false };
      }
    }

    if (input.createNewProject) {
      const workspaceId =
        input.workspaceId || workspaceIdFromProjectType(input.projectType);
      const project = await createProject({
        name:
          input.projectName?.trim() ||
          `${input.clientName} — ${input.projectType}`,
        workspaceId,
        subcategoryId: input.subcategoryId,
        clientName: input.clientName,
        clientId,
        status: mapOrderStatusToProjectStatus(input.status),
        progress: 0,
        ordersCount: 0,
        revenue: 0,
        team: [],
        upcomingShoots: [],
        lastActivity: new Date().toISOString(),
        description: input.brief || input.notes,
        isActive: true,
        ...emptyHub(),
      });
      return { projectId: project.id, created: true };
    }
  }

  return { projectId: input.projectId, created: false };
}

async function syncSquadAssignments(
  order: Order,
  options?: { role?: string; employeePrice?: number }
): Promise<OrderAssignment[]> {
  if (isOrderHolding(order.status) || order.status === "Cancelled") {
    return getAssignmentsByOrder(order.id);
  }

  const existing = getAssignmentsByOrder(order.id);
  const existingPeople = new Set(existing.map((a) => a.personId));
  const created: OrderAssignment[] = [];
  const role = options?.role ?? "Crew";
  const employeePrice = options?.employeePrice ?? 0;

  for (const personId of order.squadMemberIds) {
    if (existingPeople.has(personId)) continue;
    if (!getPersonById(personId)) continue;
    const assignment = await assignCrewToOrder({
      orderId: order.id,
      personId,
      role,
      employeePrice,
      bonus: 0,
      deduction: 0,
    });
    created.push(assignment);
    existingPeople.add(personId);
  }

  return [...existing, ...created];
}

async function syncProjectFromOrder(order: Order): Promise<void> {
  if (!order.projectId) return;
  const calendar =
    isOrderHolding(order.status) || order.status === "Cancelled"
      ? []
      : [
          ...(order.shootDate
            ? [
                {
                  id: `ord-shoot-${order.id}`,
                  title: `Shoot · ${order.clientName}`,
                  startsAt: `${order.shootDate}T09:00:00Z`,
                  kind: "shoot" as const,
                  location: order.location || undefined,
                },
              ]
            : []),
          ...(order.deliveryDate
            ? [
                {
                  id: `ord-delivery-${order.id}`,
                  title: `Delivery · ${order.clientName}`,
                  startsAt: `${order.deliveryDate}T17:00:00Z`,
                  kind: "delivery" as const,
                },
              ]
            : []),
        ];

  await updateProject(order.projectId, {
    status: mapOrderStatusToProjectStatus(order.status),
    clientName: order.clientName,
    ...(order.clientId ? { clientId: order.clientId } : {}),
    calendar,
    lastActivity: new Date().toISOString(),
  });
}

async function emitForecastIfNeeded(
  order: Order,
  events: FinancialEvent[]
): Promise<void> {
  if (!isOrderBillable(order.status)) return;
  const remaining = Math.max(0, order.price - order.deposit);
  if (remaining <= 0) return;

  const existing = listFinancialEvents().find(
    (e) =>
      e.parent.parentType === "order" &&
      e.parent.parentId === order.id &&
      e.metadata?.kind === "order_forecast"
  );
  if (existing) {
    events.push(existing);
    return;
  }

  const event = await createFinancialEvent({
    type: "adjustment",
    amount: remaining,
    currency: "EGP",
    direction: "inflow",
    notes: `Forecast remaining for order ${order.id}`,
    parent: { parentType: "order", parentId: order.id },
    metadata: {
      kind: "order_forecast",
      clientId: order.clientId,
      projectId: order.projectId,
      forecast: true,
    },
  });
  events.push(event);
}

async function reverseForecast(
  orderId: string,
  events: FinancialEvent[]
): Promise<void> {
  const forecasts = listFinancialEvents().filter(
    (e) =>
      e.parent.parentType === "order" &&
      e.parent.parentId === orderId &&
      e.metadata?.kind === "order_forecast"
  );
  for (const forecast of forecasts) {
    const alreadyReversed = listFinancialEvents().some(
      (e) =>
        e.metadata?.kind === "order_forecast_reversal" &&
        e.metadata?.reversesEventId === forecast.id
    );
    if (alreadyReversed) continue;
    const event = await createFinancialEvent({
      type: "adjustment",
      amount: forecast.amount,
      currency: "EGP",
      direction: "outflow",
      notes: `Reverse forecast for cancelled order ${orderId}`,
      parent: { parentType: "order", parentId: orderId },
      metadata: {
        kind: "order_forecast_reversal",
        reversesEventId: forecast.id,
        forecast: false,
      },
    });
    events.push(event);
  }
}

/**
 * Create order via engine — validates, links Client→Project→Order,
 * optionally creates assignments when Confirmed+, emits deposit + forecast.
 */
export async function createSmartOrder(
  raw: SmartOrderInput
): Promise<SmartOrderResult> {
  await ensureTaxonomyPersisted();
  const input = normalizeInput(raw);
  assertValidOrThrow(validateSmartOrderInput(input));

  const clientRes = await resolveClient(input);
  let clientId = clientRes.clientId;

  const projectRes = await resolveProject(
    { ...input, clientId: clientId || input.clientId },
    clientId
  );

  const orderInput = toNewOrderInput({
    ...input,
    clientId: clientId || input.clientId,
    projectId: projectRes.projectId,
  });

  // ensureOrderProjectLink fills client/project if still missing
  const order = await createOrder(orderInput);
  clientId = order.clientId ?? clientId;

  const financeEvents: FinancialEvent[] = [];

  if (order.deposit > 0 && !isOrderHolding(order.status)) {
    const { event } = await emitOrderClientPayment({
      orderId: order.id,
      amount: order.deposit,
      notes: `Deposit on order ${order.id}`,
    });
    financeEvents.push(event);
  }

  await emitForecastIfNeeded(order, financeEvents);
  await syncProjectFromOrder(order);

  const assignments = await syncSquadAssignments(order, {
    role: input.assignmentRole,
    employeePrice: input.assignmentPrice,
  });

  return {
    order,
    clientId: clientId || order.clientId || "",
    projectId: order.projectId,
    assignments,
    financeEvents,
    createdClient: clientRes.created,
    createdProject: projectRes.created,
  };
}

/**
 * Edit order — re-validates, updates row, re-syncs project calendar + squad.
 * Status transitions to Confirmed/Completed/Cancelled should prefer dedicated APIs.
 */
export async function updateSmartOrder(
  orderId: string,
  patch: Partial<SmartOrderInput>
): Promise<SmartOrderResult> {
  const existing = getOrderById(orderId) ?? (await fetchOrderById(orderId));
  if (!existing) throw new Error(`Order not found: ${orderId}`);

  const merged: SmartOrderInput = normalizeInput({
    ...existing,
    ...patch,
    clientId: patch.clientId ?? existing.clientId,
    projectId: patch.projectId ?? existing.projectId,
    squadMemberIds: patch.squadMemberIds ?? existing.squadMemberIds,
  });

  assertValidOrThrow(
    validateSmartOrderInput(merged, { excludeOrderId: orderId })
  );

  // Phone is managed from Client Profile after first create — ignore phone patch
  // unless creating new client (handled in createSmartOrder).
  const order = await updateOrder(orderId, {
    clientName: merged.clientName,
    whatsapp: merged.whatsapp,
    projectType: merged.projectType,
    workspaceId: merged.workspaceId,
    subcategoryId: merged.subcategoryId,
    shootDate: merged.shootDate,
    location: merged.location ?? "",
    deliveryDate: merged.deliveryDate ?? "",
    price: merged.price,
    deposit: merged.deposit,
    team: merged.team,
    squadMemberIds: merged.squadMemberIds ?? [],
    status: merged.status,
    brief: merged.brief ?? "",
    dressCode: merged.dressCode,
    latePenaltyEnabled: merged.latePenaltyEnabled ?? false,
    latePenaltyAmount: merged.latePenaltyAmount ?? 0,
    latePenaltyReason: merged.latePenaltyReason ?? "",
    notes: merged.notes ?? "",
    ...(merged.clientId ? { clientId: merged.clientId } : {}),
    ...(merged.projectId ? { projectId: merged.projectId } : {}),
  });

  const financeEvents: FinancialEvent[] = [];
  if (isOrderBillable(order.status)) {
    await emitForecastIfNeeded(order, financeEvents);
  } else if (isOrderHolding(order.status)) {
    await reverseForecast(order.id, financeEvents);
  }

  await syncProjectFromOrder(order);
  const assignments = await syncSquadAssignments(order, {
    role: patch.assignmentRole,
    employeePrice: patch.assignmentPrice,
  });

  return {
    order,
    clientId: order.clientId ?? "",
    projectId: order.projectId,
    assignments,
    financeEvents,
    createdClient: false,
    createdProject: false,
  };
}

/** Holding → Confirmed: calendar, crew assignments, pending earnings, finance forecast. */
export async function confirmOrder(
  orderId: string
): Promise<OrderTransitionResult> {
  const existing = getOrderById(orderId) ?? (await fetchOrderById(orderId));
  if (!existing) throw new Error(`Order not found: ${orderId}`);
  if (existing.status === "Cancelled") {
    throw new Error("Cannot confirm a cancelled order");
  }
  if (isOrderCompleted(existing.status)) {
    throw new Error("Cannot confirm a completed order");
  }

  const order = await updateOrder(orderId, { status: "Confirmed" });
  const financeEvents: FinancialEvent[] = [];

  if (order.deposit > 0) {
    const alreadyPaid = listFinancialEvents().some(
      (e) =>
        e.parent.parentType === "order" &&
        e.parent.parentId === order.id &&
        e.type === "client_payment" &&
        e.metadata?.kind !== "order_forecast"
    );
    if (!alreadyPaid) {
      const { event } = await emitOrderClientPayment({
        orderId: order.id,
        amount: order.deposit,
        notes: `Deposit on confirm ${order.id}`,
      });
      financeEvents.push(event);
    }
  }

  await emitForecastIfNeeded(order, financeEvents);
  await syncProjectFromOrder(order);
  const assignments = await syncSquadAssignments(order);

  return {
    order,
    assignments,
    releasedAssignmentIds: [],
    releasedEquipmentIds: [],
    financeEvents,
  };
}

/** Mark completed — ready for invoice / payroll stats. */
export async function completeOrder(
  orderId: string
): Promise<OrderTransitionResult> {
  const existing = getOrderById(orderId) ?? (await fetchOrderById(orderId));
  if (!existing) throw new Error(`Order not found: ${orderId}`);
  if (existing.status === "Cancelled") {
    throw new Error("Cannot complete a cancelled order");
  }
  if (isOrderHolding(existing.status)) {
    throw new Error("Confirm the order before completing it");
  }

  const order = await updateOrder(orderId, { status: "Completed" });
  await syncProjectFromOrder(order);
  const assignments = getAssignmentsByOrder(order.id);

  return {
    order,
    assignments,
    releasedAssignmentIds: [],
    releasedEquipmentIds: [],
    financeEvents: [],
  };
}

/**
 * Cancel — release unpaid crew assignments + their equipment,
 * reverse forecast, clear project calendar entries for this order, archive project if sole order.
 */
export async function cancelOrder(
  orderId: string
): Promise<OrderTransitionResult> {
  const existing = getOrderById(orderId) ?? (await fetchOrderById(orderId));
  if (!existing) throw new Error(`Order not found: ${orderId}`);
  if (existing.status === "Cancelled") {
    return {
      order: existing,
      assignments: getAssignmentsByOrder(orderId),
      releasedAssignmentIds: [],
      releasedEquipmentIds: [],
      financeEvents: [],
    };
  }

  const financeEvents: FinancialEvent[] = [];
  await reverseForecast(orderId, financeEvents);

  const releasedAssignmentIds: string[] = [];
  const releasedEquipmentIds: string[] = [];
  const assignments = getAssignmentsByOrder(orderId);

  for (const assignment of assignments) {
    // Keep paid assignments for payroll history; release unpaid
    if (assignment.paidAmount > 0) continue;
    const eqAsgs = getEquipmentAssignmentsByPerson(assignment.personId);
    for (const eq of eqAsgs) {
      await releaseEquipmentAssignment(eq.id);
      releasedEquipmentIds.push(eq.equipmentId);
    }
    await deleteAssignment(assignment.id);
    releasedAssignmentIds.push(assignment.id);
  }

  const order = await updateOrder(orderId, { status: "Cancelled" });
  await syncProjectFromOrder(order);

  return {
    order,
    assignments: getAssignmentsByOrder(orderId),
    releasedAssignmentIds,
    releasedEquipmentIds,
    financeEvents,
  };
}

/**
 * Apply a status change through the correct transition path.
 * Used by edit dialog when status is changed.
 */
export async function applyOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<OrderTransitionResult | SmartOrderResult> {
  if (status === "Confirmed") return confirmOrder(orderId);
  if (status === "Completed" || status === "Delivered") {
    return completeOrder(orderId);
  }
  if (status === "Cancelled") return cancelOrder(orderId);
  return updateSmartOrder(orderId, { status });
}

/** Monthly crew bonus — re-export from dedicated module. */
export { getCrewMonthlyBonus } from "@/lib/orders/crew-bonus";

/** Inline create client for order dialog — returns client ready to select. */
export async function createClientInline(input: {
  name: string;
  phone: string;
  whatsapp?: string;
  projectType: Order["projectType"];
}): Promise<Client> {
  const name = input.name.trim();
  const phone = input.phone.trim();
  if (!name) throw new Error("Client name is required");
  if (!phone) throw new Error("Phone is required when creating a client");

  const segment =
    input.projectType === "Wedding" || input.projectType === "Engagement"
      ? "wedding"
      : "commercial";

  return createClient({
    type: segment === "commercial" ? "company" : "individual",
    segment,
    name,
    phone,
    whatsapp: (input.whatsapp ?? phone).trim(),
  });
}

export async function updateClientWhatsApp(
  clientId: string,
  whatsapp: string
): Promise<Client> {
  return updateClient(clientId, { whatsapp: whatsapp.trim() });
}

// Re-export link helper for callers that still use ensure path
export { ensureOrderProjectLink, createAssignment };
