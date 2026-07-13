/**
 * Multi-module CRUD smoke: equipment, projects/orders, quotations, payments, invoices.
 * Run: npm run smoke:modules
 */
import { createClient, deleteClient, refreshClients } from "../lib/clients/repository";
import {
  createEquipment,
  deleteEquipment,
  refreshEquipment,
} from "../lib/equipment/repository";
import {
  createInvoice,
  deleteInvoice,
  refreshInvoices,
} from "../lib/invoices/repository";
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
  createProject,
  deleteProject,
  refreshProjects,
} from "../lib/projects/repository";
import {
  createQuotation,
  refreshQuotations,
  updateQuotation,
} from "../lib/quotations/repository";
import { createQuotationsDb } from "../lib/quotations/db";
import { ensureTaxonomyPersisted } from "../lib/taxonomy/persist";
import { loadEnvLocal } from "./load-env-local";
import { assertNonProductionTarget } from "./assert-non-production";

async function main() {
  loadEnvLocal();
  assertNonProductionTarget("smoke-modules-crud");
  console.log("=== Modules CRUD smoke ===");
  await ensureTaxonomyPersisted();
  console.log("taxonomy ok");

  // Equipment
  await refreshEquipment();
  const eq = await createEquipment({
    name: `Smoke EQ ${Date.now()}`,
    type: "Lens",
    acquiredAt: new Date().toISOString().slice(0, 10),
  });
  await deleteEquipment(eq.id);
  console.log("equipment ok");

  // Client + Project + Order + Payment + Invoice
  await refreshClients();
  const client = await createClient({
    type: "company",
    segment: "commercial",
    name: `Smoke Co ${Date.now()}`,
    phone: "01009998888",
  });
  await refreshProjects();
  const project = await createProject({
    name: `Smoke Project ${Date.now()}`,
    workspaceId: "commercial",
    clientId: client.id,
    clientName: client.name,
    status: "Active",
    progress: 0,
    ordersCount: 0,
    revenue: 0,
    team: [],
    upcomingShoots: [],
    lastActivity: new Date().toISOString(),
    isActive: true,
    overview: { summary: "", milestones: [], nextAction: "" },
    orders: [],
    calendar: [],
    files: [],
    payments: [],
    timeline: [],
    notes: [],
    activity: [],
    deliverables: [],
  });
  console.log("project ok", project.id);

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
    deliveryDate: "2026-08-15",
    price: 10000,
    deposit: 2000,
    team: "Commercial Team",
    squadMemberIds: [],
    status: "Scheduled",
    brief: "",
    latePenaltyEnabled: false,
    latePenaltyAmount: 0,
    latePenaltyReason: "",
    notes: "smoke",
  });
  console.log("order ok", order.id);

  const payment = await createPayment({
    orderId: order.id,
    projectId: project.id,
    clientId: client.id,
    workspaceId: "commercial",
    amount: 2000,
    currency: "EGP",
    kind: "deposit",
    status: "paid",
    paidAt: new Date().toISOString().slice(0, 10),
    label: "Smoke deposit",
  });
  console.log("payment ok", payment.id);

  const invoice = await createInvoice({
    clientId: client.id,
    projectId: project.id,
    orderId: order.id,
    number: `INV-SMOKE-${Date.now()}`,
    issueDate: "2026-07-11",
    dueDate: "2026-08-15",
    amount: 10000,
    paidAmount: 2000,
    status: "partial",
    periodMonth: "2026-07",
  });
  console.log("invoice ok", invoice.id);

  // Quotation
  await refreshQuotations();
  const quot = await createQuotation({
    clientId: client.id,
    clientName: client.name,
    contactName: "Smoke Contact",
    segment: "commercial",
    category: "Campaign",
    assignedSales: "Junior Soda",
  });
  await updateQuotation(quot.id, { notes: "smoke-updated" }, { saveVersion: false });
  console.log("quotation ok", quot.id);

  // Cleanup (FK order)
  const db = createQuotationsDb();
  await db.from("quotations").delete().eq("id", quot.id);
  await deletePayment(payment.id);
  await deleteInvoice(invoice.id);
  await deleteOrder(order.id);
  await deleteProject(project.id);
  await deleteClient(client.id);

  await refreshPayments();
  await refreshInvoices();
  await refreshOrders();
  await refreshProjects();
  console.log("=== PASS ===");
}

main().catch((e) => {
  console.error("=== FAIL ===", e instanceof Error ? e.message : e);
  process.exit(1);
});
