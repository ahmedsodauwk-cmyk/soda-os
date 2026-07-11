import {
  assignmentFinalAmount,
  assignmentRemaining,
  getAssignmentsByPerson,
} from "@/lib/assignments/repository";
import { getBusinessToday } from "@/lib/business/types";
import { getOrders } from "@/lib/orders/repository";
import type { Order } from "@/lib/orders/types";
import { createPeopleDb } from "@/lib/people/db";
import { personToRow, rowToPerson, type PersonRow } from "@/lib/people/mappers";
import type {
  NewPersonInput,
  Person,
  PersonPaymentLine,
  PersonPaymentSummary,
  PersonPerformance,
} from "@/lib/people/types";
import { getProjects } from "@/lib/projects/repository";

import { isOrderActiveWorkload, isOrderCompleted } from "@/lib/orders/status";

const ACTIVE_ORDER = new Set([
  "Confirmed",
  "Scheduled",
  "Shooting",
  "Editing",
]);

/**
 * In-memory mirror so sync callers (payments, performance, crew history) keep working.
 * Source of truth is `public.people` — call `refreshPeople()` / async CRUD from UI.
 */
let peopleCache: Person[] = [];

function sortByCreatedDesc(a: Person, b: Person): number {
  return b.createdAt.localeCompare(a.createdAt);
}

function setCache(people: Person[]): Person[] {
  peopleCache = [...people].sort(sortByCreatedDesc);
  return peopleCache;
}

function upsertCache(person: Person): void {
  const next = peopleCache.filter((p) => p.id !== person.id);
  next.unshift(person);
  peopleCache = next;
}

function removeFromCache(id: string): void {
  peopleCache = peopleCache.filter((p) => p.id !== id);
}

function newPersonId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `tm-${crypto.randomUUID()}`;
  }
  return `tm-${Date.now().toString(36)}`;
}

function initialsFromName(nameEn: string): string {
  return nameEn
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

async function selectAllRows(): Promise<PersonRow[]> {
  const db = createPeopleDb();
  const { data, error } = await db
    .from("people")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load people: ${error.message}`);
  }
  return (data ?? []) as PersonRow[];
}

/** Load all people from Supabase into the sync cache. */
export async function refreshPeople(): Promise<Person[]> {
  const rows = await selectAllRows();
  return setCache(rows.map(rowToPerson));
}

export function getPeople(): Person[] {
  return peopleCache.filter((p) => p.status !== "inactive");
}

export function getAllPeople(): Person[] {
  return [...peopleCache];
}

export function getPersonById(id: string): Person | undefined {
  return peopleCache.find((p) => p.id === id);
}

/** Fetch one person from Supabase (updates cache on hit). */
export async function fetchPersonById(
  id: string
): Promise<Person | undefined> {
  const db = createPeopleDb();
  const { data, error } = await db
    .from("people")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load person ${id}: ${error.message}`);
  }
  if (!data) return undefined;
  const person = rowToPerson(data as PersonRow);
  upsertCache(person);
  return person;
}

/** Persist a new person to Supabase and the sync cache. */
export async function createPerson(input: NewPersonInput): Promise<Person> {
  const initials = input.initials ?? initialsFromName(input.nameEn);
  const person: Person = {
    ...input,
    id: newPersonId(),
    initials,
    createdAt: new Date().toISOString(),
  };

  const db = createPeopleDb();
  const { data, error } = await db
    .from("people")
    .insert(personToRow(person))
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create person: ${error.message}`);
  }

  const saved = rowToPerson(data as PersonRow);
  upsertCache(saved);
  return { ...saved };
}

export type UpdatePersonInput = Partial<
  Omit<Person, "id" | "createdAt">
>;

/** Update an existing person in Supabase and the sync cache. */
export async function updatePerson(
  id: string,
  patch: UpdatePersonInput
): Promise<Person> {
  const existing = getPersonById(id) ?? (await fetchPersonById(id));
  if (!existing) {
    throw new Error(`Person not found: ${id}`);
  }

  const merged: Person = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
  };

  const db = createPeopleDb();
  const row = personToRow(merged);
  delete row.id;
  delete row.created_at;

  const { data, error } = await db
    .from("people")
    .update(row)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update person: ${error.message}`);
  }

  const saved = rowToPerson(data as PersonRow);
  upsertCache(saved);
  return { ...saved };
}

/** Hard-delete a person from Supabase and the sync cache. */
export async function deletePerson(id: string): Promise<void> {
  const db = createPeopleDb();
  const { error } = await db.from("people").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete person: ${error.message}`);
  }
  removeFromCache(id);
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
  asOf: string = getBusinessToday()
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
  asOf: string = getBusinessToday()
): PersonPerformance {
  const orders = orderMap();
  const assignments = getAssignmentsByPerson(personId);

  const completedOrders = new Set(
    assignments
      .map((a) => orders.get(a.orderId))
      .filter(
        (o): o is Order => o != null && isOrderCompleted(o.status)
      )
      .map((o) => o.id)
  );

  const completedProjects = new Set(
    [...completedOrders]
      .map((id) => orders.get(id)?.projectId)
      .filter((id): id is string => Boolean(id))
  );

  const workload = assignments.filter((a) => {
    const o = orders.get(a.orderId);
    return o && (ACTIVE_ORDER.has(o.status) || isOrderActiveWorkload(o.status));
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

export function getPeopleOwedSummary(asOf: string = getBusinessToday()) {
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
