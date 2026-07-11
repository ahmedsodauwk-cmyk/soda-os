/**
 * Business Rules Engine — registry + sequential executor.
 */

import type { BusinessEvent, BusinessEventType } from "@/lib/core/types";
import type {
  BusinessRule,
  RuleGroupId,
  RuleRunResult,
} from "@/lib/core/rules/types";

const rules: BusinessRule[] = [];
const lastResults: RuleRunResult[] = [];
const MAX_RESULTS = 200;

export function registerRule(rule: BusinessRule): void {
  if (rules.some((r) => r.id === rule.id)) return;
  rules.push(rule);
}

export function listRegisteredRules(): BusinessRule[] {
  return [...rules];
}

export function listRulesByGroup(group: RuleGroupId): BusinessRule[] {
  return rules.filter((r) => r.group === group);
}

export function clearRegisteredRules(): void {
  rules.length = 0;
  lastResults.length = 0;
}

function matches(rule: BusinessRule, type: BusinessEventType): boolean {
  return rule.events.includes("*") || rule.events.includes(type);
}

/**
 * Execute every matching rule for an event.
 * Failures are isolated — one rule must not block the rest.
 */
export async function executeRulesForEvent(
  event: BusinessEvent
): Promise<RuleRunResult[]> {
  const matched = rules.filter((r) => matches(r, event.type));
  const results: RuleRunResult[] = [];

  for (const rule of matched) {
    const started = Date.now();
    try {
      await rule.run({
        event,
        correlationId: event.correlationId ?? event.id,
      });
      results.push({
        ruleId: rule.id,
        group: rule.group,
        ok: true,
        durationMs: Date.now() - started,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[business-rules] ${rule.id} failed on ${event.type}:`,
        message
      );
      results.push({
        ruleId: rule.id,
        group: rule.group,
        ok: false,
        error: message,
        durationMs: Date.now() - started,
      });
    }
  }

  for (const r of results) {
    lastResults.unshift(r);
  }
  if (lastResults.length > MAX_RESULTS) {
    lastResults.length = MAX_RESULTS;
  }

  return results;
}

export function getRecentRuleResults(limit = 50): RuleRunResult[] {
  return lastResults.slice(0, limit);
}
