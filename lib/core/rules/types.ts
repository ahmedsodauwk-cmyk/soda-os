/**
 * Business Rules Engine — rule contracts.
 * Rules react to Business Events; they never invent a second source of truth.
 */

import type { BusinessEvent, BusinessEventType } from "@/lib/core/types";

export type RuleGroupId =
  | "order-created"
  | "order-confirmed"
  | "order-completed"
  | "payment-received"
  | "financial-safety"
  | "crew-wallet"
  | "crew-payment"
  | "monthly-target"
  | "client-profile"
  | "financial-reporting"
  | "dashboard"
  | "automation";

export interface BusinessRuleContext {
  event: BusinessEvent;
  /** Correlation for multi-rule workflows */
  correlationId?: string;
}

export type BusinessRuleHandler = (
  ctx: BusinessRuleContext
) => void | Promise<void>;

export interface BusinessRule {
  id: string;
  group: RuleGroupId;
  name: string;
  /** Event types this rule listens to (* = all) */
  events: ReadonlyArray<BusinessEventType | "*">;
  run: BusinessRuleHandler;
}

export interface RuleRunResult {
  ruleId: string;
  group: RuleGroupId;
  ok: boolean;
  error?: string;
  durationMs: number;
}
