import {
  assignmentFinalAmount,
  assignmentRemaining,
  getAssignmentsByPerson,
} from "@/lib/assignments/repository";
import { BUSINESS_TODAY } from "@/lib/business/types";
import { getOrders } from "@/lib/orders/repository";
import type { Order } from "@/lib/orders/types";
import { mockPeople } from "@/lib/people/seed";
import type {
  NewPersonInput,
  Person,
  PersonPaymentLine,
  PersonPaymentSummary,
  PersonPerformance,
} from "@/lib/people/types";
import { getProjects } from "@/lib/projects/repository";

const ACTIVE_ORDER = new Set(["Pending", "Scheduled", "Shooting", "Editing"]);

let peopleStore: Person[] = [...mockPeople];

export function getPeople(): Person[] {
  return peopleStore.filter((p) => p.status !== "inactive");
}

export function getAllPeople(): Person[] {
  return [...peopleStore];
}

export function getPersonById(id: string): Person | undefined {
  return peopleStore.find((p) => p.id === id);
}

export function createPerson(input: NewPersonInput): Person {
  const id = `tm-${Date.now().toString(36)}`;
  const initials =
    input.initials ??
    input.nameEn
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  const person: Person = {
    ...input,
    id,
    initials,
    createdAt: new Date().toISOString(),
  };
  peopleStore = [...peopleStore, person];
  return person;
}

function orderMap(): Map<string, Order> {
  return new Map(getOrders().map((o) => [o.id, o]));
}

export function buildPersonPaymentLines(personId: string): PersonPaymentLine[] {
  const orders = orderMap();
  const projects = new Map(getProjects().map((p) => [p.id, p]));
  const assignments = getAssignmentsByPerson(personId);

  return assignments
    .map((a) => {
      const order = orders.get(a.orderId);
      if (!order) return null;
      const project = projects.get(order.projectId);
      const finalAmount = assignmentFinalAmount(a);
      const remaining = assignmentRemaining(a);
      return {
        assignmentId: a.id,
        orderId: a.orderId,
        projectId: order.projectId,
        projectName: project?.name ?? order.clientName,
        clientId: order.clientId ?? "",
        clientName: order.clientName,
        workspaceId: order.workspaceId,
        role: a.role,
        employeePrice: a.employeePrice,
        bonus: a.bonus,
        deduction: a.deduction,
        finalAmount,
        paidAmount: a.paidAmount,
        remaining,
        paid: remaining <= 0 && finalAmount > 0,
        shootDate: order.shootDate,
      } satisfies PersonPaymentLine;
    })
    .filter((x): x is PersonPaymentLine => Boolean(x))
    .sort((a, b) => b.shootDate.localeCompare(a.shootDate));
}

export function getPersonPaymentSummary(
  personId: string,
  asOf: string = BUSINESS_TODAY
): PersonPaymentSummary {
  const lines = buildPersonPaymentLines(personId);
  const totalEarned = lines.reduce((s, l) => s + l.finalAmount, 0);
  const totalPaid = lines.reduce((s, l) => s + l.paidAmount, 0);
  const totalOutstanding = lines.reduce((s, l) => s + l.remaining, 0);

  const monthMap = new Map<
    string,
    { earned: number; paid: number; remaining: number }
  >();
  const yearMap = new Map<
    string,
    { earned: number; paid: number; remaining: number }
  >();

  for (const line of lines) {
    const month = line.shootDate.slice(0, 7);
    const year = line.shootDate.slice(0, 4);
    const m = monthMap.get(month) ?? { earned: 0, paid: 0, remaining: 0 };
    m.earned += line.finalAmount;
    m.paid += line.paidAmount;
    m.remaining += line.remaining;
    monthMap.set(month, m);

    const y = yearMap.get(year) ?? { earned: 0, paid: 0, remaining: 0 };
    y.earned += line.finalAmount;
    y.paid += line.paidAmount;
    y.remaining += line.remaining;
    yearMap.set(year, y);
  }

  const currentMonth = asOf.slice(0, 7);
  const current = monthMap.get(currentMonth) ?? {
    earned: 0,
    paid: 0,
    remaining: 0,
  };
  const previousBalance = Math.max(0, totalOutstanding - current.remaining);

  return {
    personId,
    lines,
    monthly: [...monthMap.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, v]) => ({ month, ...v })),
    yearly: [...yearMap.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([year, v]) => ({ year, ...v })),
    totalEarned,
    totalPaid,
    totalOutstanding,
    previousBalance,
    currentBalance: current.remaining,
  };
}

export function getPersonPerformance(
  personId: string,
  asOf: string = BUSINESS_TODAY
): PersonPerformance {
  const orders = orderMap();
  const assignments = getAssignmentsByPerson(personId);

  const completedOrders = new Set(
    assignments
      .map((a) => orders.get(a.orderId))
      .filter((o): o is Order => o != null && o.status === "Delivered")
      .map((o) => o.id)
  );

  const completedProjects = new Set(
    [...completedOrders]
      .map((id) => orders.get(id)?.projectId)
      .filter((id): id is string => Boolean(id))
  );

  const workload = assignments.filter((a) => {
    const o = orders.get(a.orderId);
    return o && ACTIVE_ORDER.has(o.status);
  }).length;

  const deliverySpeeds: number[] = [];
  for (const orderId of completedOrders) {
    const o = orders.get(orderId);
    if (!o) continue;
    const shoot = Date.parse(`${o.shootDate}T12:00:00Z`);
    const delivery = Date.parse(`${o.deliveryDate}T12:00:00Z`);
    if (!Number.isNaN(shoot) && !Number.isNaN(delivery) && delivery >= shoot) {
      deliverySpeeds.push(
        Math.round((delivery - shoot) / (1000 * 60 * 60 * 24))
      );
    }
  }

  const avgDeliverySpeedDays =
    deliverySpeeds.length > 0
      ? Math.round(
          deliverySpeeds.reduce((a, b) => a + b, 0) / deliverySpeeds.length
        )
      : null;

  const summary = getPersonPaymentSummary(personId, asOf);
  const achievements: string[] = [];
  const warnings: string[] = [];

  let lateDeliveries = 0;
  for (const orderId of completedOrders) {
    const o = orders.get(orderId);
    if (!o) continue;
    const shoot = Date.parse(`${o.shootDate}T12:00:00Z`);
    const delivery = Date.parse(`${o.deliveryDate}T12:00:00Z`);
    if (
      !Number.isNaN(shoot) &&
      !Number.isNaN(delivery) &&
      (delivery - shoot) / (1000 * 60 * 60 * 24) > 45
    ) {
      lateDeliveries += 1;
    }
  }

  if (completedOrders.size >= 3) {
    achievements.push(
      `${completedOrders.size} orders delivered with this person assigned`
    );
  }
  if (workload >= 4) {
    warnings.push(`High workload: ${workload} active order assignments`);
  }
  if (summary.totalOutstanding > 10000) {
    warnings.push(
      `Outstanding crew pay: ${summary.totalOutstanding.toLocaleString("en-EG")} EGP`
    );
  }
  if (lateDeliveries > 0) {
    warnings.push(`${lateDeliveries} long-cycle deliveries (>45 days)`);
  }

  return {
    personId,
    projectsCompleted: completedProjects.size,
    ordersCompleted: completedOrders.size,
    currentWorkload: workload,
    avgDeliverySpeedDays,
    lateDeliveries,
    clientRating: null,
    totalEarned: summary.totalEarned,
    totalPaid: summary.totalPaid,
    totalOutstanding: summary.totalOutstanding,
    achievements,
    warnings,
  };
}

export function getPeopleOwedSummary(asOf: string = BUSINESS_TODAY) {
  return getAllPeople()
    .map((person) => {
      const summary = getPersonPaymentSummary(person.id, asOf);
      return {
        person,
        outstanding: summary.totalOutstanding,
        summary,
      };
    })
    .filter((row) => row.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding);
}
