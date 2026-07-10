/**
 * The Crew — studio operational database.
 * Builds on lib/people; UI and routes use Crew naming.
 */

export {
  PERSON_STATUSES,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  CREW_RESPONSIBILITIES,
  type PersonStatus,
  type EmploymentType,
  type CrewResponsibility,
  type Person,
  type NewPersonInput,
  type PersonPerformance,
  type PersonPaymentLine,
  type PersonPaymentSummary,
} from "@/lib/people/types";

/** Alias — Crew Member is the product term for Person */
export type CrewMember = import("@/lib/people/types").Person;
export type NewCrewMemberInput = import("@/lib/people/types").NewPersonInput;
export type CrewPerformance = import("@/lib/people/types").PersonPerformance;
export type CrewPaymentLine = import("@/lib/people/types").PersonPaymentLine;
export type CrewPaymentSummary = import("@/lib/people/types").PersonPaymentSummary;
