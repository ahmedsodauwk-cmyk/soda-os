/**
 * Financial Core E2E smoke:
 * Client → Order → Deposit → Remaining → Transfer to Bank → Expense → Pay Crew → Reverse one txn.
 * Verify balances / wallets / dashboard / audit / events.
 *
 * Run: NODE_OPTIONS=--use-system-ca npx tsx scripts/smoke-financial-core.ts
 */
import {
  getAssignmentsByOrder,
  refreshAssignments,
} from "../lib/assignments/repository";
import {
  deleteClient,
  refreshClients,
} from "../lib/clients/repository";
import { listAuditLog } from "../lib/core/audit/engine";
import { bootstrapBusinessCore } from "../lib/core/bootstrap";
import {
  getDashboardFromBusinessCore,
  getFinancialReportSnapshot,
} from "../lib/core/rules";
import {
  createExpense,
  getCompanyCashflow,
  getOrderFinancialSnapshot,
  listFinancialEvents,
  refreshExpenses,
  refreshFinance,
  refreshTransfers,
  reverseFinancialEvent,
  transferBetweenAccounts,
} from "../lib/finance";
import {
  emitOrderClientPayment,
  payCrewAssignment,
} from "../lib/integration/flows";
import { confirmOrder, createSmartOrder } from "../lib/orders/engine";
import { deleteOrder, refreshOrders } from "../lib/orders/repository";
import { createPayment, refreshPayments } from "../lib/payments/repository";
import {
  createPerson,
  deletePerson,
  refreshPeople,
} from "../lib/people/repository";
import { deleteProject, refreshProjects } from "../lib/projects/repository";
import { createDomainDb } from "../lib/supabase/domain-db";
import { ensureTaxonomyPersisted } from "../lib/taxonomy/persist";
import {
  ensureDefaultCashAccounts,
  getCompanyMethodWallets,
  refreshCashAccounts,
  refreshCashMovements,
} from "../lib/wallets/cash-accounts";
import {
  getCrewWallet,
  refreshCrewEarnings,
  syncPendingEarningsForOrder,
} from "../lib/wallets/crew-wallet";
import { loadEnvLocal } from "./load-env-local";
import { assertNonProductionTarget } from "./assert-non-production";

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
  // Company-parent events tagged with smoke note
  const { data: companyEvents } = await db
    .from("financial_events")
    .select("id, notes")
    .eq("parent_type", "company");
  for (const row of companyEvents ?? []) {
    if (!row.notes?.includes(`smoke-fc-${orderId}`)) continue;
    await db
      .from("financial_allocations")
      .delete()
      .eq("financial_event_id", row.id);
    await db.from("financial_events").delete().eq("id", row.id);
  }
  await db.from("expenses").delete().eq("notes", `smoke-fc-${orderId}`);
  await db.from("account_transfers").delete().eq("notes", `smoke-fc-${orderId}`);
  await db.from("crew_earnings").delete().eq("order_id", orderId);
  await db.from("cash_account_movements").delete().eq("notes", `smoke-fc-${orderId}`);
  await db.from("payments").delete().eq("order_id", orderId);
}

async function main() {
  loadEnvLocal();
  assertNonProductionTarget("smoke-financial-core");
  console.log("=== Financial Core E2E smoke ===");
  bootstrapBusinessCore();

  await ensureTaxonomyPersisted();
  await refreshClients();
  await refreshPeople();
  await refreshProjects();
  await refreshOrders();
  await refreshAssignments();
  await refreshFinance();
  await refreshPayments();
  await refreshCashAccounts();
  await refreshCashMovements();
  await refreshCrewEarnings();
  await refreshExpenses();
  await refreshTransfers();
  await ensureDefaultCashAccounts();

  const stamp = Date.now();
  const ids: Record<string, string> = {};
  let failed = false;

  try {
    const person = await createPerson({
      nameAr: "مالي",
      nameEn: `FC Crew ${stamp}`,
      jobTitle: "Photographer",
      jobDescription: "Financial core smoke",
      employmentType: "freelance",
      responsibilities: ["Photography"],
      phone: `012${String(stamp).slice(-8)}`,
      email: `fc-${stamp}@example.com`,
      joinDate: new Date().toISOString().slice(0, 10),
      status: "active",
    });
    ids.person = person.id;
    console.log("1. crew", person.id);

    const shootDate = `2099-0${(stamp % 8) + 1}-22`;
    const created = await createSmartOrder({
      createNewClient: true,
      createNewProject: true,
      clientName: `FC Client ${stamp}`,
      phone: `015${String(stamp).slice(-8)}`,
      whatsapp: `015${String(stamp).slice(-8)}`,
      projectType: "Wedding",
      workspaceId: "weddings",
      shootDate,
      location: "Cairo",
      deliveryDate: "",
      price: 10000,
      deposit: 3000,
      team: "Wedding Squad",
      squadMemberIds: [person.id],
      status: "Holding",
      brief: "Financial core smoke",
      dressCode: "Formal",
      latePenaltyEnabled: false,
      latePenaltyAmount: 0,
      latePenaltyReason: "",
      notes: "financial core smoke",
      projectName: `FC Project ${stamp}`,
      assignmentRole: "Lead Photo",
      assignmentPrice: 500,
    });
    ids.order = created.order.id;
    ids.client = created.clientId;
    ids.project = created.projectId;
    console.log("2. order", created.order.id);

    await confirmOrder(created.order.id);
    await syncPendingEarningsForOrder(created.order.id);
    console.log("3. confirmed + pending earnings");

    const deposit = await createPayment({
      orderId: created.order.id,
      projectId: created.projectId,
      clientId: created.clientId,
      workspaceId: "weddings",
      amount: 3000,
      currency: "EGP",
      kind: "deposit",
      status: "paid",
      paidAt: new Date().toISOString().slice(0, 10),
      method: "cash",
      note: `smoke-fc-${created.order.id}`,
      label: "deposit smoke",
    });
    await emitOrderClientPayment({
      orderId: created.order.id,
      amount: 3000,
      paymentId: deposit.id,
    });
    console.log("4. deposit 3000 cash");

    const remaining = await createPayment({
      orderId: created.order.id,
      projectId: created.projectId,
      clientId: created.clientId,
      workspaceId: "weddings",
      amount: 7000,
      currency: "EGP",
      kind: "final",
      status: "paid",
      paidAt: new Date().toISOString().slice(0, 10),
      method: "cash",
      note: `smoke-fc-${created.order.id}`,
      label: "remaining smoke",
    });
    await emitOrderClientPayment({
      orderId: created.order.id,
      amount: 7000,
      paymentId: remaining.id,
    });
    console.log("5. remaining 7000 cash");

    await refreshCashMovements();
    await refreshFinance();
    await refreshPayments();
    await refreshOrders();

    const walletsAfterPay = getCompanyMethodWallets();
    console.log("6. wallets after pay", walletsAfterPay);
    if (walletsAfterPay.cashSafe < 10000) {
      throw new Error(`cashSafe expected >= 10000, got ${walletsAfterPay.cashSafe}`);
    }

    const finStatus = getOrderFinancialSnapshot(created.order.id);
    console.log("7. order financial", finStatus);
    if (!finStatus || finStatus.status !== "Collected") {
      throw new Error(`Expected Collected, got ${finStatus?.status}`);
    }

    await transferBetweenAccounts({
      fromAccountCode: "cash_safe",
      toAccountCode: "bank",
      amount: 4000,
      notes: `smoke-fc-${created.order.id}`,
    });
    await refreshCashMovements();
    const walletsAfterXfer = getCompanyMethodWallets();
    console.log("8. after transfer", {
      cash: walletsAfterXfer.cashSafe,
      bank: walletsAfterXfer.bank,
    });
    if (walletsAfterXfer.bank < 4000) {
      throw new Error(`bank expected >= 4000, got ${walletsAfterXfer.bank}`);
    }

    const expense = await createExpense({
      category: "operations",
      vendor: "Smoke Vendor",
      amount: 500,
      accountCode: "cash_safe",
      notes: `smoke-fc-${created.order.id}`,
    });
    console.log("9. expense", expense.id, expense.financialEventId);

    const assignment = getAssignmentsByOrder(created.order.id)[0];
    if (!assignment) throw new Error("Missing assignment");
    const crewPay = await payCrewAssignment({
      assignmentId: assignment.id,
      amount: 500,
    });
    console.log("10. crew paid", crewPay.finance.event.id);

    await refreshCrewEarnings();
    const crewWallet = getCrewWallet(person.id);
    console.log("11. crew wallet", {
      paid: crewWallet.paidTotal,
      pending: crewWallet.pendingTotal,
    });

    if (!expense.financialEventId) {
      throw new Error("Expense missing financialEventId");
    }
    const reversal = await reverseFinancialEvent({
      eventId: expense.financialEventId,
      reason: "smoke reverse expense",
    });
    console.log("12. reversed", reversal.id);

    await refreshFinance();
    await refreshCashMovements();

    const dashboard = getDashboardFromBusinessCore();
    const report = getFinancialReportSnapshot();
    const cashflow = getCompanyCashflow();
    const audit = listAuditLog(40);
    const events = listFinancialEvents();

    console.log("13. dashboard outstanding", dashboard.financial.outstanding);
    console.log("14. cashflow month", cashflow.month);
    console.log("15. report", {
      netProfitMonth: report.netProfitMonth,
      cashSafe: report.cashSafe,
      bank: report.bank,
    });
    console.log("16. audit count", audit.length, "events", events.length);

    const hasReversal = events.some(
      (e) => e.metadata?.originalEventId === expense.financialEventId
    );
    if (!hasReversal) throw new Error("Reversal missing from ledger");

    const auditHit = audit.some((a) =>
      [
        "ExpenseRecorded",
        "TransferCompleted",
        "FinancialReversed",
        "PaymentReceived",
        "CrewPaid",
      ].includes(a.eventType)
    );
    if (!auditHit) throw new Error("Audit missing financial events");

    console.log("PASS Financial Core smoke");
  } catch (err) {
    failed = true;
    console.error("FAIL", err instanceof Error ? err.message : err);
  } finally {
    if (ids.order) await cleanupLedgerForOrder(ids.order);
    if (ids.order) {
      try {
        await deleteOrder(ids.order);
      } catch {
        /* ignore */
      }
    }
    if (ids.project) {
      try {
        await deleteProject(ids.project);
      } catch {
        /* ignore */
      }
    }
    if (ids.client) {
      try {
        await deleteClient(ids.client);
      } catch {
        /* ignore */
      }
    }
    if (ids.person) {
      try {
        await deletePerson(ids.person);
      } catch {
        /* ignore */
      }
    }
  }

  process.exit(failed ? 1 : 0);
}

main();
