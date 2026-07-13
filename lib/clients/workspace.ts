/**
 * Client Workspace — architectural Source of Truth (Mission 04.1).
 * Reference Client Engine pattern (Mission 04.3) — first live reference: RTM.
 *
 * The Client is the central business entity. Home / Finance / Orders / Projects /
 * Reports will eventually read through this tree. This module defines the
 * structure and route map only — no duplicated business logic, no full UI.
 *
 * Hierarchy:
 * ```
 * Client
 *  ├── Overview          — Who is this relationship?
 *  ├── Daily Work → Orders
 *  ├── Projects → Orders — Active + finished (history never deleted)
 *  ├── Financial History — Money over time
 *  ├── Partnership History — Structure ready; empty until role + work exist
 *  ├── Timeline          — Over time (real events only)
 *  ├── Files
 *  ├── Notes
 *  └── Contacts
 * ```
 *
 * Rules:
 * - Projects always belong to exactly one Client (`project.clientId` required).
 * - Orders belong either to Daily Work OR to a Project under that Client.
 * - Client types for business role: Client | Partner | Client + Partner
 *   (`ClientBusinessRole` on the Client entity — not separate entities).
 * - Prefer honest empty states over invented KPIs, timeline events, or contacts.
 * - Closed / inactive work stays visible in Client history aggregators.
 */

import type { ClientBusinessRole } from "@/lib/clients/types";

/** How an Order sits under a Client. */
export const ORDER_CLIENT_BELONGINGS = ["daily_work", "project"] as const;

export type OrderClientBelonging = (typeof ORDER_CLIENT_BELONGINGS)[number];

/** Workspace sections owned by every Client. */
export const CLIENT_WORKSPACE_SECTIONS = [
  "overview",
  "daily-work",
  "projects",
  "financial-history",
  "partnership-history",
  "timeline",
  "files",
  "notes",
  "contacts",
] as const;

export type ClientWorkspaceSectionId =
  (typeof CLIENT_WORKSPACE_SECTIONS)[number];

export type ClientWorkspaceSection = {
  id: ClientWorkspaceSectionId;
  /** URL segment under `/clients/[id]/…` (empty for overview). */
  path: string;
  label: string;
  description: string;
  /** What this section owns conceptually (for later module wiring). */
  owns: string;
};

/**
 * Canonical Client Workspace tree — single import point for other modules.
 */
export const CLIENT_WORKSPACE_TREE: readonly ClientWorkspaceSection[] = [
  {
    id: "overview",
    path: "",
    label: "Overview",
    description: "Who is this relationship — snapshot without inventing data",
    owns: "profile, relationship questions, related records",
  },
  {
    id: "daily-work",
    path: "daily-work",
    label: "Daily Work",
    description: "What work together outside named Projects",
    owns: "orders (daily_work belonging)",
  },
  {
    id: "projects",
    path: "projects",
    label: "Projects",
    description: "Named Projects — active and finished; history stays forever",
    owns: "projects → orders (project belonging)",
  },
  {
    id: "financial-history",
    path: "financial-history",
    label: "Financial History",
    description: "Money with this relationship over time",
    owns: "finance ledger views",
  },
  {
    id: "partnership-history",
    path: "partnership-history",
    label: "Partnership History",
    description: "Partnerships when businessRole includes partner — empty until real",
    owns: "partnership records",
  },
  {
    id: "timeline",
    path: "timeline",
    label: "Timeline",
    description: "Over time — real openings, work, and money only",
    owns: "timeline events",
  },
  {
    id: "files",
    path: "files",
    label: "Files",
    description: "Attachments and files for this relationship",
    owns: "files",
  },
  {
    id: "notes",
    path: "notes",
    label: "Notes",
    description: "Internal notes the Founder records here",
    owns: "notes",
  },
  {
    id: "contacts",
    path: "contacts",
    label: "Contacts",
    description: "People and channels — empty until Founder enters them",
    owns: "contacts",
  },
] as const;

export function clientWorkspaceHref(
  clientId: string,
  section: ClientWorkspaceSectionId = "overview"
): string {
  const entry = CLIENT_WORKSPACE_TREE.find((s) => s.id === section);
  const base = `/clients/${clientId}`;
  if (!entry || !entry.path) return base;
  return `${base}/${entry.path}`;
}

export function isClientWorkspaceSection(
  value: string
): value is ClientWorkspaceSectionId {
  return (CLIENT_WORKSPACE_SECTIONS as readonly string[]).includes(value);
}

/** Display labels for business role (UI later). */
export const CLIENT_BUSINESS_ROLE_LABELS: Record<ClientBusinessRole, string> = {
  client: "Client",
  partner: "Partner",
  both: "Client + Partner",
};

/**
 * Resolve whether an order conceptually sits under Daily Work or a Project.
 * Uses project linkage + optional taxonomy subcategory available today.
 * Belonging column is not persisted yet (Mission 04.1 deferral).
 */
export function resolveOrderClientBelonging(input: {
  projectId?: string | null;
  subcategoryId?: string | null;
}): OrderClientBelonging {
  const sub = input.subcategoryId?.trim().toLowerCase() ?? "";
  if (sub.includes("daily-work") || sub.includes("daily_work")) {
    return "daily_work";
  }
  const id = input.projectId?.trim();
  return id ? "project" : "daily_work";
}
