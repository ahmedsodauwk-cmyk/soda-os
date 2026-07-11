/**
 * Full business workflow smoke against real Supabase.
 * Create Client → Project → Order → Assign Crew → Assign Equipment →
 * Upload File → Mark Shoot Complete → Delivery → Invoice → Payment → Finished
 * Then cleanup throwaway IDs.
 *
 * Run: NODE_OPTIONS=--use-system-ca npm run smoke:workflow
 */
import { deleteAssignment } from "../lib/assignments/repository";
import {
  createClient,
  deleteClient,
  refreshClients,
} from "../lib/clients/repository";
import {
  assignEquipmentToPerson,
  createEquipment,
  deleteEquipment,
  refreshEquipment,
} from "../lib/equipment/repository";
import { createFile, deleteFile, refreshFiles } from "../lib/files/repository";
import {
  createDelivery,
  createInvoice,
  deleteDelivery,
  deleteInvoice,
  refreshInvoices,
} from "../lib/invoices/repository";
import {
  assignCrewToOrder,
  emitOrderClientPayment,
  finishProject,
  markShootComplete,
} from "../lib/integration/flows";
import {
  createOrder,
  deleteOrder,
  refreshOrders,
} from "../lib/orders/repository";
import {
  createPayment,
  deletePayment,
  refreshPayments,
} from "../lib/payments/repository";
import {
  createPerson,
  deletePerson,
  refreshPeople,
} from "../lib/people/repository";
import {
  createProject,
  deleteProject,
  fetchProjectById,
  refreshProjects,
} from "../lib/projects/repository";
import { createDomainDb } from "../lib/supabase/domain-db";
import { ensureTaxonomyPersisted } from "../lib/taxonomy/persist";
import { loadEnvLocal } from "./load-env-local";

async function cleanupLedgerForPayment(paymentId: string) {
  const db = createDomainDb();
  const { data: events, error } = await db
    .from("financial_events")
    .select("id")
    .eq("payment_id", paymentId);
  if (error) {
    console.warn("ledger lookup:", error.message);
    return;
  }
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
  console.log("=== Business workflow smoke ===");
  await ensureTaxonomyPersisted();

  const stamp = Date.now();
  const ids: Record<string, string> = {};

  try {
    await refreshClients();
    const client = await createClient({
      type: "company",
      segment: "commercial",
      name: `WF Co ${stamp}`,
      phone: "01001234567",
    });
    ids.client = client.id;
    console.log("1. client", client.id);

    await refreshProjects();
    const project = await createProject({
      name: `WF Project ${stamp}`,
      workspaceId: "commercial",
      clientId: client.id,
      clientName: client.name,
      status: "Active",
      journeyStage: "PreProduction",
      progress: 0,
      ordersCount: 0,
      revenue: 0,
      team: [],
      upcomingShoots: [],
      lastActivity: new Date().toISOString(),
      isActive: true,
      overview: { summary: "workflow smoke", milestones: [], nextAction: "" },
      orders: [],
      calendar: [],
      files: [],
      payments: [],
      timeline: [],
      notes: [],
      activity: [],
      deliverables: [],
    });
    ids.project = project.id;
    console.log("2. project", project.id);

    await refreshOrders();
    const order = await createOrder({
      clientName: client.name,
      clientId: client.id,
      projectId: project.id,
      phone: client.phone,
      whatsapp: client.phone,
      projectType: "Commercial",
      workspaceId: "commercial",
      shootDate: "2026-08-01",
      location: "Cairo",
      deliveryDate: "2026-08-20",
      price: 25000,
      deposit: 5000,
      team: "Commercial Team",
      squadMemberIds: [],
      status: "Shooting",
      brief: "",
      latePenaltyEnabled: false,
      latePenaltyAmount: 0,
      latePenaltyReason: "",
      notes: "workflow smoke",
    });
    ids.order = order.id;
    console.log("3. order", order.id);

    await refreshPeople();
    const person = await createPerson({
      nameAr: "تجربة",
      nameEn: `WF Crew ${stamp}`,
      jobTitle: "Photographer",
      jobDescription: "Workflow smoke",
      employmentType: "freelance",
      responsibilities: ["Photography"],
      phone: "01000000001",
      email: `wf-crew-${stamp}@example.com`,
      joinDate: new Date().toISOString().slice(0, 10),
      status: "active",
    });
    ids.person = person.id;
    await refreshOrders();
    const assignment = await assignCrewToOrder({
      orderId: order.id,
      personId: person.id,
      role: "Photographer",
      employeePrice: 2000,
      bonus: 0,
      deduction: 0,
    });
    ids.assignment = assignment.id;
    console.log("4. crew assignment", assignment.id);

    await refreshEquipment();
    const equipment = await createEquipment({
      name: `WF Cam ${stamp}`,
      type: "Camera",
      acquiredAt: new Date().toISOString().slice(0, 10),
    });
    ids.equipment = equipment.id;
    const eqAsg = await assignEquipmentToPerson(equipment.id, person.id, "WF");
    if (!eqAsg) throw new Error("Equipment assign failed");
    console.log("5. equipment", equipment.id);

    await refreshFiles();
    const file = await createFile({
      name: `WF brief ${stamp}.pdf`,
      type: "Brief",
      size: "1 MB",
      projectId: project.id,
      orderId: order.id,
      workspaceId: "commercial",
    });
    ids.file = file.id;
    console.log("6. file", file.id);

    const shoot = await markShootComplete(order.id);
    if (shoot.order.status !== "Editing") {
      throw new Error(`Expected Editing, got ${shoot.order.status}`);
    }
    const afterShoot = await fetchProjectById(project.id);
    if (afterShoot?.journeyStage !== "Editing") {
      throw new Error(
        `Expected journey Editing, got ${afterShoot?.journeyStage}`
      );
    }
    console.log("7. shoot complete → Editing");

    await refreshInvoices();
    const delivery = await createDelivery({
      orderId: order.id,
      projectId: project.id,
      clientId: client.id,
      label: `WF Delivery ${stamp}`,
      dueDate: "2026-08-20",
      status: "delivered",
      deliveredAt: new Date().toISOString(),
    });
    ids.delivery = delivery.id;
    console.log("8. delivery", delivery.id);

    const invoice = await createInvoice({
      clientId: client.id,
      projectId: project.id,
      orderId: order.id,
      number: `INV-WF-${stamp}`,
      issueDate: "2026-07-11",
      dueDate: "2026-08-20",
      amount: 25000,
      paidAmount: 0,
      status: "sent",
      periodMonth: "2026-07",
    });
    ids.invoice = invoice.id;
    console.log("9. invoice", invoice.id);

    await refreshPayments();
    const payment = await createPayment({
      orderId: order.id,
      projectId: project.id,
      clientId: client.id,
      workspaceId: "commercial",
      amount: 25000,
      currency: "EGP",
      kind: "final",
      status: "paid",
      paidAt: new Date().toISOString().slice(0, 10),
      label: `WF final ${stamp}`,
    });
    ids.payment = payment.id;
    await emitOrderClientPayment({
      orderId: order.id,
      amount: 25000,
      paymentId: payment.id,
      notes: "workflow smoke payment",
    });
    console.log("10. payment", payment.id);

    const finished = await finishProject(project.id);
    if (finished.status !== "Completed" || finished.journeyStage !== "Closed") {
      throw new Error(
        `Expected Completed/Closed, got ${finished.status}/${finished.journeyStage}`
      );
    }
    console.log("11. project finished", finished.status, finished.journeyStage);

    console.log("=== workflow PASS — cleaning up ===");
  } finally {
    try {
      if (ids.payment) {
        await cleanupLedgerForPayment(ids.payment);
        await deletePayment(ids.payment);
      }
      if (ids.invoice) await deleteInvoice(ids.invoice);
      if (ids.delivery) await deleteDelivery(ids.delivery);
      if (ids.file) await deleteFile(ids.file);
      if (ids.assignment) await deleteAssignment(ids.assignment);
      if (ids.equipment) await deleteEquipment(ids.equipment);
      if (ids.order) await deleteOrder(ids.order);
      if (ids.project) await deleteProject(ids.project);
      if (ids.person) await deletePerson(ids.person);
      if (ids.client) await deleteClient(ids.client);
      console.log("cleanup ok");
    } catch (cleanupErr) {
      console.error(
        "cleanup partial fail",
        cleanupErr instanceof Error ? cleanupErr.message : cleanupErr,
        ids
      );
    }
  }

  console.log("=== PASS ===");
}

main().catch((e) => {
  console.error("=== FAIL ===", e instanceof Error ? e.message : e);
  process.exit(1);
});
