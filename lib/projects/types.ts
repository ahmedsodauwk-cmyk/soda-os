export const PROJECT_STATUSES = [
  "Active",
  "OnHold",
  "Completed",
  "Cancelled",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface ProjectTeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
}

export interface ProjectShoot {
  id: string;
  title: string;
  date: string;
  location: string;
  status: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  type: string;
  size: string;
  updatedAt: string;
}

export interface ProjectPayment {
  id: string;
  label: string;
  amount: number;
  kind: "deposit" | "installment" | "final" | "refund";
  status: "pending" | "paid" | "failed" | "waived" | "voided";
  paidAt?: string;
}

export interface ProjectTimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  type: string;
}

export interface ProjectNote {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface ProjectActivity {
  id: string;
  actor: string;
  action: string;
  createdAt: string;
}

export interface ProjectDeliverable {
  id: string;
  name: string;
  status: "pending" | "in_progress" | "delivered";
  dueDate: string;
}

export interface ProjectCalendarEvent {
  id: string;
  title: string;
  startsAt: string;
  kind: "shoot" | "delivery" | "milestone" | "internal";
  location?: string;
}

export interface ProjectOrderStub {
  id: string;
  clientName: string;
  status: string;
  shootDate: string;
  price: number;
}

export interface ProjectOverview {
  summary: string;
  milestones: string[];
  nextAction: string;
}

/**
 * Core project fields persisted in mock seed.
 * Computed exposures (ordersCount, revenue, progress, upcomingShoots, lastActivity)
 * are filled by lib/business via the projects repository — do not treat seed values as source of truth.
 */
export interface Project {
  id: string;
  name: string;
  workspaceId: string;
  subcategoryId?: string;
  clientName: string;
  /** Required — every Project belongs to exactly one Client */
  clientId: string;
  status: ProjectStatus;
  /** Journey stage — enriched from lib/journey/seed if omitted on raw seed */
  journeyStage?: import("@/lib/journey/types").JourneyStage;
  /** Computed: 0–100 completion from child orders */
  progress: number;
  /** Computed: child orders count */
  ordersCount: number;
  /** Computed: sum of non-cancelled order prices */
  revenue: number;
  /** Assigned team foundation (project-level roster) */
  team: ProjectTeamMember[];
  /** Computed: upcoming shoots from child orders */
  upcomingShoots: ProjectShoot[];
  /** Computed: latest activity across project + orders */
  lastActivity: string;
  description?: string;
  overview: ProjectOverview;
  /** Prefer live stubs from orders repo; seed may hold transitional copies */
  orders: ProjectOrderStub[];
  calendar: ProjectCalendarEvent[];
  files: ProjectFile[];
  payments: ProjectPayment[];
  timeline: ProjectTimelineEvent[];
  notes: ProjectNote[];
  activity: ProjectActivity[];
  deliverables: ProjectDeliverable[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export const PROJECT_HUB_SECTIONS = [
  "overview",
  "orders",
  "calendar",
  "files",
  "payments",
  "timeline",
  "team",
  "notes",
  "activity",
  "deliverables",
] as const;

export type ProjectHubSection = (typeof PROJECT_HUB_SECTIONS)[number];
