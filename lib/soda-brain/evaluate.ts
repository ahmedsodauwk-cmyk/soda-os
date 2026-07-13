/**
 * SODA Brain — Order Decision Engine (V1).
 *
 * Business Data → evaluate once → OrderOperationalTruth
 * UI must not derive health / do-now / FA / decisions independently.
 *
 * Orchestrates existing Mission 02 signal helpers; does not reimplement
 * payment math, order engine, or assignment status.
 */

import { getBusinessToday } from "@/lib/business/types";
import type { Expense } from "@/lib/finance/expenses";
import type { OrderOperatingView } from "@/lib/integration";
import {
  generateDoNowActions,
  generateNeedsDecision,
  generateWhatsNext,
  type DoNowAction,
  type NeedsDecisionItem,
  type WhatsNextItem,
  type WorkspaceCapabilities,
} from "@/lib/soda-brain/do-now";
import {
  deriveFinancialAssistantPrompt,
  type FinancialAssistantPrompt,
} from "@/lib/soda-brain/financial-assistant";
import {
  deriveOrderHealth,
  orderLane,
  type OrderHealthLevel,
} from "@/lib/soda-brain/health";

/** Founder-facing health bands (Mission 03). */
export type OrderHealthBand = "healthy" | "attention" | "critical";

export interface OrderHealthTruth {
  /** Internal severity used by styles / ranking */
  level: OrderHealthBand;
  /** Display label: Healthy | Attention | Critical */
  label: string;
  reason: string;
}

export interface OrderOperationalTruth {
  asOf: string;
  lane: "Wedding" | "Commercial";
  health: OrderHealthTruth;
  needsDecision: NeedsDecisionItem[];
  doNow: DoNowAction[];
  whatsNext: WhatsNextItem[];
  financialAssistant: FinancialAssistantPrompt;
  /** Quiet assurance when the order is under control */
  humanMessage: string | null;
}

export interface EvaluateOrderBrainInput {
  view: OrderOperatingView;
  expenses?: Expense[];
  fileCount?: number;
  /** Studio-local YYYY-MM-DD; defaults to getBusinessToday() */
  asOf?: string;
  capabilities: WorkspaceCapabilities;
}

function mapHealthBand(level: OrderHealthLevel): OrderHealthBand {
  if (level === "critical") return "critical";
  if (level === "healthy") return "healthy";
  // watch | at_risk → Attention
  return "attention";
}

function bandLabel(band: OrderHealthBand): string {
  switch (band) {
    case "healthy":
      return "Healthy";
    case "attention":
      return "Attention";
    case "critical":
      return "Critical";
  }
}

/**
 * Single evaluation entry — ONE operational truth for the Order Workspace.
 */
export function evaluateOrderOperationalTruth(
  input: EvaluateOrderBrainInput
): OrderOperationalTruth | null {
  const order = input.view.order;
  if (!order) return null;

  const asOf = input.asOf ?? getBusinessToday();
  const expenses = input.expenses ?? [];
  const fileCount = input.fileCount ?? 0;
  const postedExpenseCount = expenses.filter((e) => e.status === "posted").length;
  const { capabilities } = input;
  const { view } = input;

  const healthRaw = deriveOrderHealth({
    order,
    finance: view.finance,
    assignments: view.assignments,
    deliveries: view.deliveries,
    expenseCount: postedExpenseCount,
    fileCount,
    asOf,
  });

  const band = mapHealthBand(healthRaw.level);
  const health: OrderHealthTruth = {
    level: band,
    label: bandLabel(band),
    reason: healthRaw.reason,
  };

  const doNowInput = {
    order,
    finance: {
      outstanding: view.finance.outstanding,
      collected: view.finance.collected,
      agreed: view.finance.agreed,
    },
    assignments: view.assignments,
    deliveries: view.deliveries,
    payments: view.payments,
    expenseCount: postedExpenseCount,
    fileCount,
    asOf,
    capabilities,
  };

  const doNow = generateDoNowActions(doNowInput);
  const needsDecision = generateNeedsDecision(doNowInput);
  const whatsNext = generateWhatsNext(doNowInput);
  const financialAssistant = deriveFinancialAssistantPrompt({
    order,
    finance: view.finance,
    payments: view.payments,
    assignments: view.assignments,
    expenses,
    asOf,
    canSeeMoneyPrompts: capabilities.canSeeFullMoney,
  });

  const humanMessage =
    band === "healthy" && doNow.length === 0 && needsDecision.length === 0
      ? "This order is fully under control."
      : band === "healthy"
        ? "This order is under control — no critical blockers."
        : null;

  return {
    asOf,
    lane: orderLane(order.projectType),
    health,
    needsDecision,
    doNow,
    whatsNext,
    financialAssistant,
    humanMessage,
  };
}
