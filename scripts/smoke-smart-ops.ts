/**
 * Smart Ops smoke — order command view, calendar conflicts, search, stats.
 * Run: NODE_OPTIONS=--use-system-ca npx tsx scripts/smoke-smart-ops.ts
 */
import { loadEnvLocal } from "./load-env-local";
import { assertNonProductionTarget } from "./assert-non-production";

loadEnvLocal();
assertNonProductionTarget("smoke-smart-ops");

async function main() {
  const { bootstrapBusinessCore } = await import("../lib/core/bootstrap");
  const { refreshAllDomainData } = await import("../lib/supabase/refresh-all");
  const {
    createSmartOrder,
    updateSmartOrder,
    getOrderOperatingView,
  } = await import("../lib/integration");
  const { detectCrewScheduleConflicts } = await import(
    "../lib/calendar/conflicts"
  );
  const { buildGlobalSearchHits } = await import("../lib/search");
  const { getOperationsStatistics } = await import("../lib/ops/stats");
  const { getCalendarEvents } = await import("../lib/calendar/repository");
  const { getPeople, refreshPeople } = await import(
    "../lib/people/repository"
  );
  const { assignCrewToOrder } = await import("../lib/integration");
  const { deleteOrder } = await import("../lib/orders/repository");
  const { deleteClient } = await import("../lib/clients/repository");

  console.log("=== Smart Ops smoke ===");
  bootstrapBusinessCore();
  await refreshAllDomainData();
  await refreshPeople();

  const stamp = Date.now().toString(36);
  const phone = `010${String(Date.now()).slice(-8)}`;

  const created = await createSmartOrder({
    clientName: `Ops Smoke ${stamp}`,
    phone,
    whatsapp: phone,
    createNewClient: true,
    createNewProject: true,
    projectName: `Ops Project ${stamp}`,
    projectType: "Portrait",
    workspaceId: "fashion",
    shootDate: new Date().toISOString().slice(0, 10),
    location: "Studio A",
    deliveryDate: "",
    price: 5000,
    deposit: 1000,
    team: "Studio A",
    squadMemberIds: [],
    status: "Confirmed",
    priority: "high",
    brief: "Smart ops smoke brief",
    latePenaltyEnabled: false,
    latePenaltyAmount: 0,
    latePenaltyReason: "",
    notes: "smoke",
  });

  console.log(`  ✓ order ${created.order.id} priority=${created.order.priority}`);

  const people = getPeople().filter((p) => p.status === "active").slice(0, 2);
  if (people.length >= 1) {
    await assignCrewToOrder({
      orderId: created.order.id,
      personId: people[0].id,
      role: "Photographer",
      employeePrice: 1200,
      bonus: 0,
      deduction: 0,
      callTime: "08:30",
      meetingPoint: "Lobby",
      assignmentStatus: "confirmed",
    });
    console.log(`  ✓ crew assigned with call/meeting fields`);
  }

  // Second order same day + same crew → conflict detection (use Event type to avoid duplicate rule)
  let order2Id: string | undefined;
  if (people.length >= 1) {
    const created2 = await createSmartOrder({
      clientId: created.clientId,
      projectId: created.projectId,
      clientName: created.order.clientName,
      phone,
      whatsapp: phone,
      projectType: "Event",
      workspaceId: "events",
      shootDate: created.order.shootDate,
      location: "Studio B",
      deliveryDate: "",
      price: 3000,
      deposit: 0,
      team: "Studio A",
      squadMemberIds: [],
      status: "Confirmed",
      brief: "",
      latePenaltyEnabled: false,
      latePenaltyAmount: 0,
      latePenaltyReason: "",
      notes: "conflict pair",
    });
    order2Id = created2.order.id;
    await assignCrewToOrder({
      orderId: created2.order.id,
      personId: people[0].id,
      role: "Photographer",
      employeePrice: 1000,
      bonus: 0,
      deduction: 0,
    });
  }

  const view = getOrderOperatingView(created.order.id);
  if (!view.order) throw new Error("order operating view missing");
  console.log(
    `  ✓ command view finance status=${view.finance.status} crew=${view.assignments.length}`
  );

  const conflicts = detectCrewScheduleConflicts();
  console.log(`  ✓ calendar conflicts detected: ${conflicts.length}`);

  await updateSmartOrder(created.order.id, {
    shootDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  });
  console.log(`  ✓ reschedule published`);

  const hits = buildGlobalSearchHits(created.order.clientName.slice(0, 8));
  console.log(`  ✓ global search hits: ${hits.length}`);

  const stats = getOperationsStatistics();
  console.log(
    `  ✓ stats completion=${Math.round(stats.completionRate * 100)}% topClients=${stats.topClients.length}`
  );

  const events = getCalendarEvents().filter(
    (e) => e.orderId === created.order.id
  );
  console.log(`  ✓ calendar events for order: ${events.length}`);

  // cleanup
  if (order2Id) await deleteOrder(order2Id).catch(() => undefined);
  await deleteOrder(created.order.id).catch(() => undefined);
  if (created.clientId) {
    await deleteClient(created.clientId).catch(() => undefined);
  }

  console.log("Smart Ops smoke OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
