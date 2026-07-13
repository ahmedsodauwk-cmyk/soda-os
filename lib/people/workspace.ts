/**
 * Crew Workspace — architectural Source of Truth (Mission 04.4 / 04.4.1).
 *
 * Every person is a real SODA VISUALS crew member with a personal operational workspace.
 * Routes stay under `/people` — UI branding is Crew.
 *
 * Hierarchy:
 * ```
 * Person (Crew Workspace)
 *  ├── Overview            — Crew dashboard (ops status)
 *  ├── Assigned Orders     — Active / open assignments
 *  ├── Completed Orders    — Delivered history (never invented)
 *  ├── Calendar            — Personal schedule surface
 *  ├── Tasks               — Future task engine hook
 *  ├── Wallet              — Crew pay / earnings
 *  ├── Bonuses             — Bonus ledger hook
 *  ├── Penalties           — Penalties hook
 *  ├── Attendance          — Attendance hook
 *  ├── Performance         — Data-backed metrics
 *  ├── Notifications       — Person-scoped alerts
 *  ├── Files               — Personal / assigned files
 *  └── Activity Timeline   — Real events only
 * ```
 *
 * Designed for future Internal Chat, Order/Project Assignment, Approvals,
 * Wallet, Payroll, Performance — without redesigning this shell.
 *
 * Rules:
 * - Prefer honest empty states over invented people, KPIs, or timeline events.
 * - No Auth accounts created here — profiles link later via Founder crew list.
 * - Prefer extending `public.people` over inventing a parallel User entity.
 */

/** Workspace sections owned by every Person. */
export const PEOPLE_WORKSPACE_SECTIONS = [
  "overview",
  "assigned-orders",
  "completed-orders",
  "calendar",
  "tasks",
  "wallet",
  "bonuses",
  "penalties",
  "attendance",
  "performance",
  "notifications",
  "files",
  "activity",
] as const;

export type PeopleWorkspaceSectionId =
  (typeof PEOPLE_WORKSPACE_SECTIONS)[number];

export type PeopleWorkspaceSection = {
  id: PeopleWorkspaceSectionId;
  /** URL segment under `/people/[id]/…` (empty for overview). */
  path: string;
  label: string;
  description: string;
  /** What this section owns conceptually (for later module wiring). */
  owns: string;
  /** Honest empty copy when no real data exists yet. */
  emptyTitle: string;
  emptyDetail: string;
};

/**
 * Canonical People Workspace tree — single import point for nav + routes.
 */
export const PEOPLE_WORKSPACE_TREE: readonly PeopleWorkspaceSection[] = [
  {
    id: "overview",
    path: "",
    label: "Dashboard",
    description: "Operational status — real assignments only, nothing invented",
    owns: "crew dashboard, profile cards, founder actions",
    emptyTitle: "Workspace ready",
    emptyDetail:
      "Ops signals stay empty until this crew member has real assigned work.",
  },
  {
    id: "assigned-orders",
    path: "assigned-orders",
    label: "Assigned Orders",
    description: "Active order assignments for this member",
    owns: "order_assignments (active)",
    emptyTitle: "No assigned orders",
    emptyDetail:
      "Orders appear here when this person is assigned on real work.",
  },
  {
    id: "completed-orders",
    path: "completed-orders",
    label: "Completed Orders",
    description: "Finished assignments — history stays forever",
    owns: "order_assignments (completed)",
    emptyTitle: "No completed orders yet",
    emptyDetail: "Completed assignments will list here after real deliveries.",
  },
  {
    id: "calendar",
    path: "calendar",
    label: "Calendar",
    description: "Personal shoot / delivery schedule surface",
    owns: "calendar filtered by person_id",
    emptyTitle: "Calendar is quiet",
    emptyDetail: "Shoot and delivery dates show once orders are assigned.",
  },
  {
    id: "tasks",
    path: "tasks",
    label: "Tasks",
    description: "Personal task inbox — shell for future task engine",
    owns: "tasks (future)",
    emptyTitle: "No tasks yet",
    emptyDetail: "Task assignments will live here without redesigning Crew Workspace.",
  },
  {
    id: "wallet",
    path: "wallet",
    label: "Wallet",
    description: "Crew pay, earnings, and outstanding balance",
    owns: "crew wallet / earnings",
    emptyTitle: "Wallet empty",
    emptyDetail: "Earnings appear from order assignments — never entered manually.",
  },
  {
    id: "bonuses",
    path: "bonuses",
    label: "Bonuses",
    description: "Bonus ledger for this member",
    owns: "bonuses (me.bonus / future payroll)",
    emptyTitle: "No bonuses recorded",
    emptyDetail: "Bonuses stay empty until real studio awards exist.",
  },
  {
    id: "penalties",
    path: "penalties",
    label: "Penalties",
    description: "Penalty ledger for this member",
    owns: "penalties",
    emptyTitle: "No penalties recorded",
    emptyDetail: "Penalties stay empty until Founder-entered records exist.",
  },
  {
    id: "attendance",
    path: "attendance",
    label: "Attendance",
    description: "Attendance / presence surface",
    owns: "attendance (future)",
    emptyTitle: "No attendance yet",
    emptyDetail: "Attendance will plug in here without a shell redesign.",
  },
  {
    id: "performance",
    path: "performance",
    label: "Performance",
    description: "Data-backed workload and delivery metrics",
    owns: "performance aggregators",
    emptyTitle: "No performance signal yet",
    emptyDetail: "Metrics appear from real completed assignments only.",
  },
  {
    id: "notifications",
    path: "notifications",
    label: "Notifications",
    description: "Alerts scoped to this member",
    owns: "notifications.user_id / person_id",
    emptyTitle: "No notifications",
    emptyDetail: "Alerts appear when this member has a linked auth identity.",
  },
  {
    id: "files",
    path: "files",
    label: "Files",
    description: "Personal and assigned files",
    owns: "files / me.files",
    emptyTitle: "No files yet",
    emptyDetail: "Files stay empty until something is attached for this person.",
  },
  {
    id: "activity",
    path: "activity",
    label: "Activity Timeline",
    description: "Over time — real events only",
    owns: "activity / business events",
    emptyTitle: "Timeline empty",
    emptyDetail: "Only real studio events appear here — never invented.",
  },
] as const;

export function peopleWorkspaceHref(
  personId: string,
  section: PeopleWorkspaceSectionId = "overview"
): string {
  const entry = PEOPLE_WORKSPACE_TREE.find((s) => s.id === section);
  const base = `/people/${personId}`;
  if (!entry || !entry.path) return base;
  return `${base}/${entry.path}`;
}

export function isPeopleWorkspaceSection(
  value: string
): value is PeopleWorkspaceSectionId {
  return (PEOPLE_WORKSPACE_SECTIONS as readonly string[]).includes(value);
}

/** Profile fields every Crew Workspace member supports (schema + UI). */
export const PEOPLE_PROFILE_FIELDS = [
  "avatarUrl",
  "fullName",
  "displayName",
  "position",
  "department",
  "employmentStatus",
  "phone",
  "email",
  "emergencyContact",
  "notes",
  "joinDate",
] as const;

export type PeopleProfileFieldId = (typeof PEOPLE_PROFILE_FIELDS)[number];
