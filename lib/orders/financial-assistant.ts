/**
 * Order Workspace — Financial Assistant prompts.
 * UX copy derived from real order money/crew/expense state.
 * Not an accounting engine — diagnoses; Do Now executes.
 */

import {
  assignmentRemaining,
  type OrderAssignment,
} from "@/lib/assignments/types";
import type { Expense } from "@/lib/finance/expenses";
import { isOrderCompleted } from "@/lib/orders/status";
import type { Order } from "@/lib/orders/types";
import { formatPrice } from "@/lib/orders/utils";
import type { Payment } from "@/lib/payments/types";

export interface FinancialAssistantPrompt {
  /** Primary question — one at a time when pressure exists */
  question: string;
  /** Supporting certainty line */
  detail: string;
  /** Quiet when coherent */
  silent: boolean;
}

export interface FinancialAssistantInput {
  order: Order;
  finance: {
    agreed: number;
    collected: number;
    outstanding: number;
    status: string;
    profit: number | null;
  };
  payments: Payment[];
  assignments: OrderAssignment[];
  expenses: Expense[];
  asOf: string;
  /** Role may see full money prompts */
  canSeeMoneyPrompts: boolean;
}

/**
 * One primary money question from live state.
 * Silence when outstanding clear, payables clear, no implied unrecorded cost.
 */
export function deriveFinancialAssistantPrompt(
  input: FinancialAssistantInput
): FinancialAssistantPrompt {
  if (!input.canSeeMoneyPrompts) {
    return {
      question: "",
      detail: "",
      silent: true,
    };
  }

  const { order, finance, payments, assignments, expenses, asOf } = input;

  if (order.status === "Cancelled") {
    return { question: "", detail: "", silent: true };
  }

  const overdue =
    finance.outstanding > 0.009 &&
    Boolean(
      (order.deliveryDate || order.shootDate) &&
        (order.deliveryDate || order.shootDate)! < asOf
    );

  if (finance.outstanding > 0.009) {
    return {
      silent: false,
      question: overdue
        ? "Has this overdue balance been collected?"
        : "Has the remaining payment been collected?",
      detail: `Outstanding ${formatPrice(finance.outstanding)} · Agreed ${formatPrice(finance.agreed)} · Collected ${formatPrice(finance.collected)}`,
    };
  }

  const paidMissingMethod = payments.filter(
    (p) => p.status === "paid" && p.kind !== "refund" && !p.method
  );
  if (paidMissingMethod.length > 0) {
    return {
      silent: false,
      question: "Which payment method was used?",
      detail: `${paidMissingMethod.length} paid movement(s) without method — needed for wallet truth.`,
    };
  }

  const unpaidCrew = assignments.filter(
    (a) =>
      (a.assignmentStatus === "completed" ||
        a.assignmentStatus === "checked_in" ||
        isOrderCompleted(order.status)) &&
      assignmentRemaining(a) > 0
  );
  if (unpaidCrew.length > 0) {
    const due = unpaidCrew.reduce((acc, a) => acc + assignmentRemaining(a), 0);
    return {
      silent: false,
      question: "Is the freelancer paid?",
      detail: `${unpaidCrew.length} assignment(s) still owed · ${formatPrice(due)}`,
    };
  }

  const plannedRental = (order.plannedExpenses ?? []).some(
    (l) => l.kind === "rentals" && l.amount > 0
  );
  const hasRentalExpense = expenses.some(
    (e) => e.category === "rental" && e.status === "posted"
  );
  if (plannedRental && !hasRentalExpense) {
    return {
      silent: false,
      question: "Is this rental paid / recorded?",
      detail: "Planned rental cost on the order — no rental expense posted yet.",
    };
  }

  const postShoot =
    order.status === "Shooting" ||
    order.status === "Editing" ||
    isOrderCompleted(order.status);
  if (postShoot && expenses.filter((e) => e.status === "posted").length === 0) {
    return {
      silent: false,
      question: "Should an expense be recorded?",
      detail: "Shoot/production advanced — margin lies if cost stays off-book.",
    };
  }

  if (finance.outstanding <= 0.009 && finance.collected > 0) {
    return {
      silent: true,
      question: "",
      detail: `Collections clear · ${finance.status}`,
    };
  }

  return { question: "", detail: "", silent: true };
}
