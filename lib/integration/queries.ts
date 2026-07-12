/**
 * Cross-module operating views — aggregate existing repos + finance calculators.
 * Empty-safe: missing entities yield empty arrays / zero finance.
 */

import {
  assignmentFinalAmount,
  getAssignmentsByOrder,
  getAssignmentsByPerson,
  type OrderAssignment,
} from "@/lib/assignments/repository";
import { getClientById } from "@/lib/clients/repository";
import type { Client } from "@/lib/clients/types";
import {
  calculateClientOutstandingBalance,
  calculateClientPaid,
  calculatePersonBalance,
  calculatePersonPaid,
  calculateProjectFinance,
  type ProjectFinanceResult,
} from "@/lib/finance/calculators";
import { getOrderFinancialSnapshot } from "@/lib/finance/order-status";
import { listFinancialEvents } from "@/lib/finance/repository";
import type { Currency, FinancialEvent } from "@/lib/finance/types";
import { getDeliveriesByOrder } from "@/lib/invoices/repository";
import type { OrderDelivery } from "@/lib/invoices/types";
import { getOrders, getOrdersByClient, getOrdersByProject } from "@/lib/orders/repository";
import { getCrewMonthlyBonus } from "@/lib/orders/crew-bonus";
import type { Order } from "@/lib/orders/types";
import {
  getPayments,
  getPaymentsByClient,
  getPaymentsByProject,
} from "@/lib/payments/repository";
import type { Payment } from "@/lib/payments/types";
import { getPersonById } from "@/lib/people/repository";
import type { Person } from "@/lib/people/types";
import {
  getProjectById,
  getProjects,
  getProjectsByClient,
} from "@/lib/projects/repository";
import type { Project } from "@/lib/projects/types";
import {
  getQuotations,
  getQuotationsByClient,
} from "@/lib/quotations/repository";
import type { Quotation } from "@/lib/quotations/types";

const DEFAULT_CURRENCY: Currency = "EGP";

export interface ClientOperatingView {
  clientId: string;
  client: Client | undefined;
  quotations: Quotation[];
  orders: Order[];
  projects: Project[];
  payments: Payment[];
  finance: {
    currency: Currency;
    obligatedTotal: number;
    paid: number;
    outstanding: number;
    events: FinancialEvent[];
  };
}

export interface ProjectOperatingView {
  projectId: string;
  project: Project | undefined;
  quotations: Quotation[];
  orders: Order[];
  assignments: OrderAssignment[];
  payments: Payment[];
  deliveries: OrderDelivery[];
  finance: ProjectFinanceResult & {
    events: FinancialEvent[];
  };
}

export interface CrewOperatingView {
  personId: string;
  person: Person | undefined;
  assignments: OrderAssignment[];
  orders: Order[];
  projects: Project[];
  finance: {
    currency: Currency;
    obligatedTotal: number;
    /** Cash paid from ledger (crew_payment events). */
    ledgerPaid: number;
    /** Sum of assignment.paidAmount (operational). */
    assignmentPaid: number;
    /** Remaining owed: obligated − ledger paid. */
    balance: number;
    events: FinancialEvent[];
  };
  /** Monthly bonus: 20 completed orders → 3500 EGP */
  monthlyBonus: {
    monthKey: string;
    completedCount: number;
    bonusEgp: number;
    qualified: boolean;
  };
}

export interface OrderOperatingView {
  orderId: string;
  order: Order | undefined;
  client: Client | undefined;
  project: Project | undefined;
  assignments: OrderAssignment[];
  payments: Payment[];
  deliveries: OrderDelivery[];
  finance: {
    currency: Currency;
    agreed: number;
    collected: number;
    /** Revenue = collected only */
    revenue: number;
    outstanding: number;
    profit: number | null;
    status: string;
  };
}

/** Client → orders, projects, payments, quotations + finance rollup. */
export function getClientOperatingView(
  clientId: string,
  currency: Currency = DEFAULT_CURRENCY
): ClientOperatingView {
  const client = getClientById(clientId);
  const projects = getProjectsByClient(clientId);
  const projectIds = new Set(projects.map((p) => p.id));
  const orders = getOrders().filter(
    (o) =>
      o.clientId === clientId ||
      (o.projectId != null && projectIds.has(o.projectId))
  );
  const payments = getPaymentsByClient(clientId);
  const quotations = getQuotationsByClient(clientId);

  const obligatedTotal = orders
    .filter(
      (o) =>
        o.status !== "Cancelled" &&
        o.status !== "Holding" &&
        o.status !== "Pending"
    )
    .reduce((acc, o) => acc + o.price, 0);

  const paid = calculateClientPaid(clientId, currency);
  const paymentPaid = payments
    .filter((p) => p.status === "paid" && p.kind !== "refund")
    .reduce((acc, p) => acc + p.amount, 0);

  // Prefer ledger when it has events; otherwise fall back to payments module.
  const events = listFinancialEvents({
    parentType: "client",
    parentId: clientId,
  }).filter((e) => e.currency === currency);

  const effectivePaid = events.length > 0 ? paid : paymentPaid;
  const outstanding =
    events.length > 0
      ? calculateClientOutstandingBalance(clientId, obligatedTotal, currency)
      : Math.max(0, obligatedTotal - paymentPaid);

  return {
    clientId,
    client,
    quotations,
    orders,
    projects,
    payments,
    finance: {
      currency,
      obligatedTotal,
      paid: effectivePaid,
      outstanding,
      events,
    },
  };
}

/** Project → quotations, orders, crew assignments, payments + finance. */
export function getProjectOperatingView(
  projectId: string,
  currency: Currency = DEFAULT_CURRENCY
): ProjectOperatingView {
  const project = getProjectById(projectId);
  const orders = getOrdersByProject(projectId);
  const orderIds = new Set(orders.map((o) => o.id));
  const assignments = orders.flatMap((o) => getAssignmentsByOrder(o.id));
  const payments = getPaymentsByProject(projectId);
  const deliveries = orders.flatMap((o) => getDeliveriesByOrder(o.id));
  const quotations = getQuotations().filter(
    (q) => q.convertedProjectId === projectId
  );

  const finance = calculateProjectFinance(projectId, currency);

  const events = listFinancialEvents().filter((e) => {
    if (e.currency !== currency) return false;
    if (e.parent.parentType === "project" && e.parent.parentId === projectId) {
      return true;
    }
    if (
      e.parent.parentType === "order" &&
      orderIds.has(e.parent.parentId)
    ) {
      return true;
    }
    const metaProject = e.metadata?.projectId;
    return typeof metaProject === "string" && metaProject === projectId;
  });

  return {
    projectId,
    project,
    quotations,
    orders,
    assignments,
    payments,
    deliveries,
    finance: {
      ...finance,
      events,
    },
  };
}

/** Crew member → assigned projects/orders + financial balance. */
export function getCrewOperatingView(
  personId: string,
  currency: Currency = DEFAULT_CURRENCY
): CrewOperatingView {
  const person = getPersonById(personId);
  const assignments = getAssignmentsByPerson(personId);
  const orderMap = new Map(getOrders().map((o) => [o.id, o]));
  const orders = assignments
    .map((a) => orderMap.get(a.orderId))
    .filter((o): o is Order => Boolean(o));

  const projectIds = [...new Set(orders.map((o) => o.projectId).filter(Boolean))];
  const projects = projectIds
    .map((id) => getProjectById(id))
    .filter((p): p is Project => Boolean(p));

  const obligatedTotal = assignments.reduce(
    (acc, a) => acc + assignmentFinalAmount(a),
    0
  );
  const assignmentPaid = assignments.reduce((acc, a) => acc + a.paidAmount, 0);
  const ledgerPaid = calculatePersonPaid(personId, currency);
  const balance = calculatePersonBalance(personId, obligatedTotal, currency);
  const events = listFinancialEvents({
    parentType: "crew",
    parentId: personId,
  }).filter((e) => e.currency === currency);

  const monthKey = new Date().toISOString().slice(0, 7);
  const monthlyBonus = {
    monthKey,
    ...getCrewMonthlyBonus(personId, monthKey),
  };

  return {
    personId,
    person,
    assignments,
    orders,
    projects,
    finance: {
      currency,
      obligatedTotal,
      ledgerPaid,
      assignmentPaid,
      balance,
      events,
    },
    monthlyBonus,
  };
}

/** Order command center — compose client/project/team/finance without new engines. */
export function getOrderOperatingView(
  orderId: string,
  currency: Currency = DEFAULT_CURRENCY
): OrderOperatingView {
  const order = getOrders().find((o) => o.id === orderId);
  const client = order?.clientId ? getClientById(order.clientId) : undefined;
  const project = order?.projectId
    ? getProjectById(order.projectId)
    : undefined;
  const assignments = getAssignmentsByOrder(orderId);
  const payments = getPayments().filter((p) => p.orderId === orderId);
  const deliveries = getDeliveriesByOrder(orderId);

  const snap = getOrderFinancialSnapshot(orderId);
  const agreed = snap?.agreed ?? order?.price ?? 0;
  const collected = snap?.collected ?? 0;
  const outstanding =
    snap?.outstanding ??
    Math.max(
      0,
      agreed -
        payments
          .filter((p) => p.status === "paid" && p.kind !== "refund")
          .reduce((acc, p) => acc + p.amount, 0)
    );
  const status = snap?.status ?? (outstanding <= 0 && agreed > 0 ? "Collected" : "Agreed");

  void currency;

  return {
    orderId,
    order,
    client,
    project,
    assignments,
    payments,
    deliveries,
    finance: {
      currency,
      agreed,
      collected,
      revenue: collected,
      outstanding,
      profit: snap?.profit ?? null,
      status,
    },
  };
}

/** Convenience: all projects for a person via assignments. */
export function getAssignedProjectsForPerson(personId: string): Project[] {
  return getCrewOperatingView(personId).projects;
}

/** Convenience: client orders via operating view. */
export function getClientOrders(clientId: string): Order[] {
  return getOrdersByClient(clientId);
}

/** All active projects (for diagnostics). */
export function listLinkedProjects(): Project[] {
  return getProjects();
}

/** Payments module snapshot (no fake data). */
export function listAllPayments(): Payment[] {
  return getPayments();
}
