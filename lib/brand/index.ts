export {
  SODA_OPERATOR,
  SODA_OPERATOR_EN,
  MODULE_SLOGANS,
  EMPTY_STATES,
  SUCCESS_MESSAGES,
  WARNING_MESSAGES,
  LOADING_MESSAGES,
  NOTIFICATION_COPY,
  DASHBOARD_SECTION_COPY,
  KPI_COPY,
  HUB_SECTION_COPY,
  toEasternDigits,
  getDayPeriod,
  getGreeting,
  getModuleSlogan,
  getWorkspaceSlogan,
  extractVoiceSignals,
  deriveBusinessMood,
  getMoodLabel,
  getMoodMessage,
  getBriefCopy,
  getEmptyState,
  getSuccessMessage,
  getWarningMessage,
  getLoadingMessage,
  getRevenueWhisper,
  getOutstandingWhisper,
  getActiveProjectsWhisper,
  getUpcomingShootsWhisper,
} from "@/lib/brand/soda-voice";

export { getTeamDisplayName } from "@/lib/brand/team-names";

export {
  sodaColors,
  sodaSemantic,
  sodaType,
  sodaSpace,
  sodaRadius,
  sodaElevation,
  sodaMotion,
  sodaStatus,
  sodaChartPalette,
} from "@/lib/brand/tokens";

export {
  SODA_LOGO,
  SODA_LOGO_SIZES,
  SODA_LOGO_PLACEMENTS,
} from "@/lib/brand/logo";

export type { SodaLogoPlacement } from "@/lib/brand/logo";

export type {
  BriefAction,
  BriefCardCopy,
  BriefPriority,
  BriefSummaryStat,
  BusinessMood,
  DashboardSectionKey,
  DashboardVoiceInput,
  DayPeriod,
  EmptyStateCopy,
  EmptyStateKey,
  HubSectionCopyKey,
  KpiCopyKey,
  LoadingKey,
  ModuleSloganKey,
  SectionCopy,
  SuccessKey,
  VoiceSignals,
  WarningKey,
} from "@/lib/brand/types";
