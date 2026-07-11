/**
 * Register all Business Rule groups (1–12) on the rules engine.
 */

import { getAssignmentsByOrder } from "@/lib/assignments/repository";
import {
  executeRulesForEvent,
  registerRule,
} from "@/lib/core/rules/engine";
import {
  getClientProfileStats,
  getFinancialReportSnapshot,
  refreshDashboardAggregator,
} from "@/lib/core/rules/aggregators";
import {
  ensureOrderForecast,
  markRevenueReadyForCollection,
  reverseOrderForecast,
  syncProjectCalendarFromOrder,
} from "@/lib/core/rules/order-effects";
import { subscribe } from "@/lib/core/bus";
import type { BusinessEvent } from "@/lib/core/types";
import {
  assignEquipmentToPerson,
  getEquipment,
} from "@/lib/equipment/repository";
import { isOrderBillable, isOrderOperational } from "@/lib/orders/status";
import type { Order } from "@/lib/orders/types";
import { getOrderById } from "@/lib/orders/repository";
import { getPaymentById } from "@/lib/payments/repository";
import { isPaymentMethod } from "@/lib/wallets/types";
import {
  ensureDefaultCashAccounts,
  recordCashMovement,
} from "@/lib/wallets/cash-accounts";
import {
  ensureMonthlyTargetBonus,
  getCrewWallet,
  markCrewEarningPaid,
  syncPendingEarningsForOrder,
} from "@/lib/wallets/crew-wallet";

function orderFromEvent(event: BusinessEvent): Order | undefined {
  const fromData = event.payload.data?.order as Order | undefined;
  if (fromData?.id) return fromData;
  const orderId =
    event.payload.orderId ??
    (event.payload.entityType === "order" ? event.payload.entityId : undefined);
  if (!orderId) return undefined;
  return getOrderById(orderId);
}

let registered = false;

export function registerAllBusinessRules(): void {
  if (registered) return;
  registered = true;

  // ── Group 1: Order Created ──────────────────────────────────────────
  registerRule({
    id: "order-created.relations-calendar-forecast",
    group: "order-created",
    name: "Sync project/calendar/forecast on OrderCreated",
    events: ["OrderCreated", "OrderUpdated"],
    async run({ event }) {
      const order = orderFromEvent(event);
      if (!order) return;
      // Relations (client/project) already written by Smart Order engine.
      await syncProjectCalendarFromOrder(order, event.occurredAt);
      if (isOrderBillable(order.status)) {
        await ensureOrderForecast(order);
      } else if (
        order.status === "Holding" ||
        order.status === "Pending" ||
        order.status === "Cancelled"
      ) {
        await reverseOrderForecast(order.id);
      }
      if (order.clientId) {
        getClientProfileStats(order.clientId);
      }
      refreshDashboardAggregator();
      getFinancialReportSnapshot();
    },
  });

  // ── Group 2: Order Confirmed ────────────────────────────────────────
  registerRule({
    id: "order-confirmed.activate-calendar-earnings-revenue",
    group: "order-confirmed",
    name: "Activate assignments, calendar, pending earnings, expected revenue",
    events: ["OrderConfirmed"],
    async run({ event }) {
      const order = orderFromEvent(event);
      if (!order) return;

      await syncProjectCalendarFromOrder(order, event.occurredAt);
      await ensureOrderForecast(order);
      await syncPendingEarningsForOrder(order.id);

      // Reserve one available equipment item per assigned crew (best-effort)
      const assignments = getAssignmentsByOrder(order.id);
      const available = getEquipment().filter((e) => e.status === "available");
      let eqIdx = 0;
      for (const a of assignments) {
        if (eqIdx >= available.length) break;
        const item = available[eqIdx++];
        await assignEquipmentToPerson(
          item.id,
          a.personId,
          `Reserved for order ${order.id}`
        );
      }

      refreshDashboardAggregator();
      getFinancialReportSnapshot();
    },
  });

  registerRule({
    id: "crew-assigned.pending-earnings",
    group: "crew-wallet",
    name: "Create pending earnings when crew assigned",
    events: ["CrewAssigned"],
    async run({ event }) {
      const orderId = event.payload.orderId;
      if (!orderId) return;
      const order = getOrderById(orderId);
      if (!order || !isOrderOperational(order.status)) return;
      await syncPendingEarningsForOrder(orderId);
    },
  });

  // ── Group 3: Order Completed ────────────────────────────────────────
  registerRule({
    id: "order-completed.collection-stats-crew",
    group: "order-completed",
    name: "Ready for collection, crew stats, monthly/yearly",
    events: ["OrderCompleted"],
    async run({ event }) {
      const order = orderFromEvent(event);
      if (!order) return;

      await syncProjectCalendarFromOrder(order, event.occurredAt);
      await markRevenueReadyForCollection(order);
      await syncPendingEarningsForOrder(order.id);

      // Monthly target bonus check for each assigned crew
      const monthKey = (
        order.deliveryDate ||
        order.shootDate ||
        event.occurredAt
      ).slice(0, 7);
      for (const a of getAssignmentsByOrder(order.id)) {
        await ensureMonthlyTargetBonus(a.personId, monthKey);
        getCrewWallet(a.personId);
      }

      if (order.clientId) getClientProfileStats(order.clientId);
      refreshDashboardAggregator();
      getFinancialReportSnapshot();
    },
  });

  // ── Group 4: Payment Received ───────────────────────────────────────
  registerRule({
    id: "payment-received.wallets-balances-reports",
    group: "payment-received",
    name: "Update outstanding/collected/cash by method",
    events: ["PaymentReceived"],
    async run({ event }) {
      await ensureDefaultCashAccounts();

      const paymentId = event.payload.paymentId ?? event.payload.entityId;
      const payment = paymentId ? getPaymentById(paymentId) : undefined;
      const amount =
        payment?.amount ??
        (typeof event.payload.data?.amount === "number"
          ? event.payload.data.amount
          : 0);
      if (!amount || amount <= 0) {
        refreshDashboardAggregator();
        return;
      }

      const methodRaw =
        payment?.method ??
        event.payload.data?.method ??
        "cash";
      const method = isPaymentMethod(methodRaw) ? methodRaw : "cash";

      await recordCashMovement({
        method,
        direction: "inflow",
        amount,
        occurredAt: payment?.paidAt ?? event.occurredAt,
        paymentId: payment?.id,
        financialEventId:
          typeof event.payload.data?.financialEventId === "string"
            ? event.payload.data.financialEventId
            : undefined,
        notes: payment?.note ?? event.payload.summary,
        metadata: {
          reference: payment?.reference,
          receiver: payment?.receiver,
          orderId: payment?.orderId ?? event.payload.orderId,
          clientId: payment?.clientId ?? event.payload.clientId,
        },
      });

      if (payment?.clientId || event.payload.clientId) {
        getClientProfileStats(
          payment?.clientId ?? event.payload.clientId!
        );
      }
      refreshDashboardAggregator();
      getFinancialReportSnapshot();
    },
  });

  // ── Group 5: Financial safety (audit already on * via core) ─────────
  registerRule({
    id: "financial-safety.refresh-on-safety-events",
    group: "financial-safety",
    name: "Refresh finance aggregators after reverse/void/correction",
    events: ["FinancialReversed", "FinancialVoided", "FinancialCorrected"],
    async run() {
      refreshDashboardAggregator();
      getFinancialReportSnapshot();
    },
  });

  // ── Group 6–8: Crew wallet / payment / monthly target ───────────────
  registerRule({
    id: "crew-payment.wallet-dashboard-finance",
    group: "crew-payment",
    name: "Move pending→paid and refresh wallet/dashboard/finance",
    events: ["CrewPaid"],
    async run({ event }) {
      const assignmentId = event.payload.assignmentId;
      const amount =
        typeof event.payload.data?.amount === "number"
          ? event.payload.data.amount
          : 0;
      const financialEventId =
        typeof event.payload.data?.financialEventId === "string"
          ? event.payload.data.financialEventId
          : undefined;

      if (assignmentId && amount > 0) {
        await markCrewEarningPaid({
          assignmentId,
          amount,
          financialEventId,
          paidAt: event.occurredAt.slice(0, 10),
        });
      }

      // Crew payments reduce cash safe by default (outflow)
      if (amount > 0) {
        await ensureDefaultCashAccounts();
        await recordCashMovement({
          method: "cash",
          direction: "outflow",
          amount,
          occurredAt: event.occurredAt,
          financialEventId,
          notes: event.payload.summary,
          metadata: {
            kind: "crew_payment",
            assignmentId,
            personId: event.payload.personId,
          },
        });
      }

      if (event.payload.personId) {
        getCrewWallet(event.payload.personId);
        const monthKey = event.occurredAt.slice(0, 7);
        await ensureMonthlyTargetBonus(event.payload.personId, monthKey);
      }

      if (event.payload.orderId) {
        await syncPendingEarningsForOrder(event.payload.orderId);
      }

      refreshDashboardAggregator();
      getFinancialReportSnapshot();
    },
  });

  registerRule({
    id: "monthly-target.on-order-completed",
    group: "monthly-target",
    name: "Track monthly/yearly orders and auto 20→3500 bonus",
    events: ["OrderCompleted", "CrewBonusGenerated"],
    async run({ event }) {
      if (event.type === "CrewBonusGenerated") {
        refreshDashboardAggregator();
        return;
      }
      const order = orderFromEvent(event);
      if (!order) return;
      const monthKey = (
        order.deliveryDate ||
        order.shootDate ||
        event.occurredAt
      ).slice(0, 7);
      for (const a of getAssignmentsByOrder(order.id)) {
        const bonus = await ensureMonthlyTargetBonus(a.personId, monthKey);
        if (bonus && bonus.status === "pending") {
          // Bonus already persisted; wallet reads it
          getCrewWallet(a.personId);
        }
      }
    },
  });

  // ── Group 9: Client profile ─────────────────────────────────────────
  registerRule({
    id: "client-profile.auto-stats",
    group: "client-profile",
    name: "Maintain client profile statistics",
    events: [
      "ClientCreated",
      "ClientUpdated",
      "OrderCreated",
      "OrderUpdated",
      "OrderConfirmed",
      "OrderCompleted",
      "OrderCancelled",
      "PaymentReceived",
      "PaymentUpdated",
    ],
    async run({ event }) {
      const clientId =
        event.payload.clientId ??
        (event.payload.entityType === "client"
          ? event.payload.entityId
          : undefined);
      if (!clientId) return;
      getClientProfileStats(clientId);
    },
  });

  // ── Group 10: Financial reporting ───────────────────────────────────
  registerRule({
    id: "financial-reporting.aggregates",
    group: "financial-reporting",
    name: "Maintain monthly/yearly/wallet/pending-crew aggregates",
    events: [
      "PaymentReceived",
      "PaymentUpdated",
      "OrderConfirmed",
      "OrderCompleted",
      "OrderCancelled",
      "CrewPaid",
      "InvoicePaid",
      "FinancialReversed",
      "FinancialVoided",
      "FinancialCorrected",
      "ExpenseRecorded",
      "TransferCompleted",
      "PeriodClosed",
      "PeriodReopened",
    ],
    async run() {
      getFinancialReportSnapshot();
    },
  });

  // ── Group 11: Dashboard ─────────────────────────────────────────────
  registerRule({
    id: "dashboard.refresh-from-core",
    group: "dashboard",
    name: "Refresh Business Core dashboard aggregator",
    events: [
      "OrderCreated",
      "OrderUpdated",
      "OrderConfirmed",
      "OrderCompleted",
      "OrderCancelled",
      "PaymentReceived",
      "CrewPaid",
      "CrewAssigned",
      "ClientCreated",
      "ClientUpdated",
      "ProjectCreated",
      "ProjectUpdated",
      "InvoicePaid",
      "ExpenseRecorded",
      "TransferCompleted",
      "FinancialReversed",
      "FinancialVoided",
      "FinancialCorrected",
      "PeriodClosed",
      "PeriodReopened",
    ],
    async run() {
      refreshDashboardAggregator();
    },
  });

  // ── Group 12: Automation — cancel cleans forecast via OrderCancelled ─
  registerRule({
    id: "order-cancelled.reverse-and-clean",
    group: "automation",
    name: "Reverse forecast and cancel pending earnings on cancel",
    events: ["OrderCancelled"],
    async run({ event }) {
      const order = orderFromEvent(event);
      if (!order) return;
      await reverseOrderForecast(order.id);
      await syncProjectCalendarFromOrder(order, event.occurredAt);
      await syncPendingEarningsForOrder(order.id);
      if (order.clientId) getClientProfileStats(order.clientId);
      refreshDashboardAggregator();
      getFinancialReportSnapshot();
    },
  });

  // ── Expenses / transfers / period closing ───────────────────────────
  registerRule({
    id: "expenses.refresh-aggregators",
    group: "expenses",
    name: "Refresh dashboard/cashflow after expense",
    events: ["ExpenseRecorded"],
    async run() {
      refreshDashboardAggregator();
      getFinancialReportSnapshot();
    },
  });

  registerRule({
    id: "transfers.refresh-wallets",
    group: "transfers",
    name: "Refresh method wallets after transfer",
    events: ["TransferCompleted"],
    async run() {
      refreshDashboardAggregator();
      getFinancialReportSnapshot();
    },
  });

  registerRule({
    id: "period-closing.refresh",
    group: "period-closing",
    name: "Refresh aggregators after period close/reopen",
    events: ["PeriodClosed", "PeriodReopened"],
    async run() {
      refreshDashboardAggregator();
      getFinancialReportSnapshot();
    },
  });

  // Wire rules engine into the event bus (single subscriber)
  subscribe("*", async (event) => {
    await executeRulesForEvent(event);
  });
}

export function areBusinessRulesRegistered(): boolean {
  return registered;
}
