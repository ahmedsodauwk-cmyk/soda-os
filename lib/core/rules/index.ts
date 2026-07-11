/**
 * Business Rules Engine — public barrel.
 */

export type {
  BusinessRule,
  BusinessRuleContext,
  BusinessRuleHandler,
  RuleGroupId,
  RuleRunResult,
} from "@/lib/core/rules/types";

export {
  clearRegisteredRules,
  executeRulesForEvent,
  getRecentRuleResults,
  listRegisteredRules,
  listRulesByGroup,
  registerRule,
} from "@/lib/core/rules/engine";

export {
  areBusinessRulesRegistered,
  registerAllBusinessRules,
} from "@/lib/core/rules/register";

export {
  getBusinessCoreHealth,
  getClientProfileStats,
  getDashboardFromBusinessCore,
  getFinancialOverviewFromCore,
  getFinancialReportSnapshot,
  refreshDashboardAggregator,
} from "@/lib/core/rules/aggregators";

export {
  ensureOrderForecast,
  markRevenueReadyForCollection,
  reverseOrderForecast,
  syncProjectCalendarFromOrder,
} from "@/lib/core/rules/order-effects";
