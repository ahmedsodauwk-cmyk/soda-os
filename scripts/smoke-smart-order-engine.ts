/**
 * Smart Order Engine V3 smoke against real Supabase.
 * Create client → order (Holding) → assign team → confirm → verify syncs → complete → cancel path.
 *
 * Run: NODE_OPTIONS=--use-system-ca npx tsx scripts/smoke-smart-order-engine.ts
 */
import { getAssignmentsByOrder } from "../lib/assignments/repository";
import { refreshAssignments } from "../lib/assignments/repository";
import { getCalendarEventsByOrder } from "../lib/calendar/repository";
import {
  deleteClient,
  refreshClients,
} from "../lib/clients/repository";
import { listFinancialEvents, refreshFinance } from "../lib/finance/repository";
import {
  cancelOrder,
  completeOrder,
  confirmOrder,
  createSmartOrder,
} from "../lib/orders/engine";
import {
  deleteOrder,
  getOrderById,
  refreshOrders,
} from "../lib/orders/repository";
import {
  isOrderBillable,
  isOrderCalendarVisible,
  isOrderCompleted,
} from "../lib/orders/status";
import {
  createPerson,
  deletePerson,
  refreshPeople,
} from "../lib/people/repository";
import { deleteProject, refreshProjects } from "../lib/projects/repository";
import { createDomainDb } from "../lib/supabase/domain-db";
import { ensureTaxonomyPersisted } from "../lib/taxonomy/persist";
import { loadEnvLocal } from "./load-env-local";

async function cleanupLedgerForOrder(orderId: string) {
  const db = createDomainDb();
  const { data: events } = await db
    .from("financial_events")
    .select("id")
    .eq("parent_type", "order")
    .eq("parent_id", orderId);
  for (const row of events ?? []) {
    await db
      .from("financial_allocations")
      .delete()
      .eq("financial_event_id", row.id);
    await db.from("financial_events").delete().eq("id", row.id);
  }
}

async function main() {
  loadEnvLocal();
  console.log("=== Smart Order Engine V3 smoke ===");
  await ensureTaxonomyPersisted();
  await refreshClients();
  await refreshPeople();
  await refreshProjects();
  await refreshOrders();
  await refreshAssignments();
  await refreshFinance();

  const stamp = Date.now();
  const ids: Record<string, string> = {};

  try {
    const person = await createPerson({
      nameAr: "محرك",
      nameEn: `SOE Crew ${stamp}`,
      jobTitle: "Photographer",
      jobDescription: "Smart order smoke",
      employmentType: "freelance",
      responsibilities: ["Photography"],
      phone: `010${String(stamp).slice(-8)}`,
      email: `soe-${stamp}@example.com`,
      joinDate: new Date().toISOString().slice(0, 10),
      status: "active",
    });
    ids.person = person.id;
    console.log("1. crew", person.id);

    const shootDate = `2099-0${(stamp % 8) + 1}-15`;
    const result = await createSmartOrder({
      createNewClient: true,
      createNewProject: true,
      clientName: `SOE Client ${stamp}`,
      phone: `011${String(stamp).slice(-8)}`,
      whatsapp: `011${String(stamp).slice(-8)}`,
      projectType: "Wedding",
      workspaceId: "weddings",
      shootDate,
      location: "Giza",
      deliveryDate: "",
      price: 40000,
      deposit: 10000,
      team: "Wedding Squad",
      squadMemberIds: [person.id],
      status: "Holding",
      brief: "Golden hour portraits",
      dressCode: "Formal",
      latePenaltyEnabled: true,
      latePenaltyAmount: 500,
      latePenaltyReason: "Per day after delivery date",
      notes: "smart order smoke",
      projectName: `SOE Project ${stamp}`,
      assignmentRole: "Lead Photographer",
      assignmentPrice: 3000,
    });

    ids.client = result.clientId;
    ids.project = result.projectId;
    ids.order = result.order.id;
    console.log("2. holding order", result.order.id, result.order.status);

    if (result.order.status !== "Holding") {
      throw new Error("Expected Holding status");
    }
    if (isOrderCalendarVisible(result.order.status)) {
      throw new Error("Holding must not be calendar-visible");
    }
    if (isOrderBillable(result.order.status)) {
      throw new Error("Holding must not be billable");
    }
    if (getAssignmentsByOrder(result.order.id).length === 0) {
      throw new Error("Holding should lock-in crew assignments (rates) from create");
    }
    if (getCalendarEventsByOrder(result.order.id).length > 0) {
      throw new Error("Holding must not appear on calendar");
    }
    console.log("3. holding gates ok (assignments locked, calendar/billable off)");

    const confirmed = await confirmOrder(result.order.id);
    console.log("4. confirmed", confirmed.order.status, "assignments", confirmed.assignments.length);

    if (confirmed.order.status !== "Confirmed") {
      throw new Error("Expected Confirmed");
    }
    if (confirmed.assignments.length < 1) {
      throw new Error("Expected squad assignment on confirm");
    }
    if (!isOrderCalendarVisible(confirmed.order.status)) {
      throw new Error("Confirmed must be calendar-visible");
    }
    const cal = getCalendarEventsByOrder(confirmed.order.id);
    if (cal.length < 1) {
      throw new Error("Expected calendar shoot event after confirm");
    }
    const forecasts = listFinancialEvents().filter(
      (e) =>
        e.parent.parentId === confirmed.order.id &&
        e.metadata?.kind === "order_forecast"
    );
    if (forecasts.length < 1) {
      throw new Error("Expected finance forecast on confirm");
    }
    console.log("5. confirm syncs ok (calendar + assignments + forecast)");

    const completed = await completeOrder(confirmed.order.id);
    if (!isOrderCompleted(completed.order.status)) {
      throw new Error("Expected Completed");
    }
    console.log("6. completed", completed.order.status);

    // Second order to exercise cancel path
    const hold2 = await createSmartOrder({
      clientId: result.clientId,
      clientName: result.order.clientName,
      phone: result.order.phone,
      whatsapp: result.order.whatsapp,
      projectId: result.projectId,
      projectType: "Wedding",
      workspaceId: "weddings",
      shootDate: `2099-1${(stamp % 8) + 1}-20`,
      location: "",
      deliveryDate: "",
      price: 15000,
      deposit: 0,
      team: "Wedding Squad",
      squadMemberIds: [person.id],
      status: "Holding",
      brief: "",
      latePenaltyEnabled: false,
      latePenaltyAmount: 0,
      latePenaltyReason: "",
      notes: "cancel path",
    });
    ids.order2 = hold2.order.id;
    await confirmOrder(hold2.order.id);
    const cancelled = await cancelOrder(hold2.order.id);
    if (cancelled.order.status !== "Cancelled") {
      throw new Error("Expected Cancelled");
    }
    if (getCalendarEventsByOrder(hold2.order.id).length > 0) {
      throw new Error("Cancelled order must leave calendar");
    }
    const still = getOrderById(hold2.order.id);
    if (still?.status !== "Cancelled") {
      throw new Error("Cancel not persisted in cache");
    }
    console.log("7. cancel syncs ok", cancelled.releasedAssignmentIds.length, "assignments released");

    console.log("=== Smart Order Engine V3 smoke PASSED ===");
  } catch (err) {
    console.error("FAILED", err);
    process.exitCode = 1;
  } finally {
    for (const orderId of [ids.order2, ids.order].filter(Boolean)) {
      try {
        await cleanupLedgerForOrder(orderId);
        await deleteOrder(orderId);
      } catch (e) {
        console.warn("cleanup order", orderId, e);
      }
    }
    if (ids.project) {
      try {
        await deleteProject(ids.project);
      } catch (e) {
        console.warn("cleanup project", e);
      }
    }
    if (ids.client) {
      try {
        await deleteClient(ids.client);
      } catch (e) {
        console.warn("cleanup client", e);
      }
    }
    if (ids.person) {
      try {
        await deletePerson(ids.person);
      } catch (e) {
        console.warn("cleanup person", e);
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
