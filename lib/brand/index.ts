export {
  SODA_OPERATOR,
  SODA_OPERATOR_EN,
  SODA_LAST_VISIT_KEY,
  MODULE_SLOGANS,
  EMPTY_STATES,
  SUCCESS_MESSAGES,
  WARNING_MESSAGES,
  LOADING_MESSAGES,
  NOTIFICATION_COPY,
  DASHBOARD_SECTION_COPY,
  KPI_COPY,
  HUB_SECTION_COPY,
  ABOUT_COPY,
  COMPANY_PULSE_STABLE,
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
  getWelcomeBackCopy,
  getCompanyPulse,
  resolveWelcomeMode,
  getTodayVisitKey,
  getEmptyState,
  getSuccessMessage,
  getWarningMessage,
  getLoadingMessage,
  getRevenueWhisper,
  getOutstandingWhisper,
  getActiveProjectsWhisper,
  getUpcomingShootsWhisper,
} from "@/lib/brand/soda-voice";

export {
  HUMAN_LAYER,
  getHumanLayer,
  isHumanLayerKey,
} from "@/lib/brand/human-layer";

export type { HumanLayerKey } from "@/lib/brand/human-layer";

export { SODA_QUOTES } from "@/lib/brand/quotes";

export {
  buildSodaLiveItems,
  getSodaLiveRotateMs,
} from "@/lib/brand/soda-live";

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
  SODA_BRAND_HEX,
} from "@/lib/brand/tokens";

export {
  SODA_LOGO,
  SODA_LOGO_SIZES,
  SODA_LOGO_PLACEMENTS,
  SODA_PDF_HEADER,
} from "@/lib/brand/logo";

export type { SodaLogoPlacement } from "@/lib/brand/logo";

export type {
  BriefAction,
  BriefCardCopy,
  BriefPriority,
  BriefSummaryStat,
  BusinessMood,
  CompanyPulseInsight,
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
  SodaLiveItem,
  SodaLiveKind,
  SuccessKey,
  VoiceSignals,
  WarningKey,
  WelcomeMode,
} from "@/lib/brand/types";
