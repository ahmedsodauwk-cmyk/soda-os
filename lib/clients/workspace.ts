/**
 * Client Workspace — architectural Source of Truth (Mission 04.1).
 *
 * The Client is the central business entity. Home / Finance / Orders / Projects /
 * Reports will eventually read through this tree. This module defines the
 * structure and route map only — no duplicated business logic, no full UI.
 *
 * Hierarchy:
 * ```
 * Client
 *  ├── Overview
 *  ├── Daily Work → Orders
 *  ├── Projects → Orders
 *  ├── Financial History
 *  ├── Partnership History
 *  ├── Timeline
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
    description: "Client snapshot and operating summary",
    owns: "profile, stats, related records",
  },
  {
    id: "daily-work",
    path: "daily-work",
    label: "Daily Work",
    description: "Ad-hoc / ongoing Orders under this Client (not a named Project)",
    owns: "orders (daily_work belonging)",
  },
  {
    id: "projects",
    path: "projects",
    label: "Projects",
    description: "Named Projects that belong to this Client; each Project owns Orders",
    owns: "projects → orders (project belonging)",
  },
  {
    id: "financial-history",
    path: "financial-history",
    label: "Financial History",
    description: "Payments, invoices, balances for this Client",
    owns: "finance ledger views",
  },
  {
    id: "partnership-history",
    path: "partnership-history",
    label: "Partnership History",
    description: "Partner-side collaborations when businessRole includes partner",
    owns: "partnership records",
  },
  {
    id: "timeline",
    path: "timeline",
    label: "Timeline",
    description: "Chronological activity across the Client",
    owns: "timeline events",
  },
  {
    id: "files",
    path: "files",
    label: "Files",
    description: "Files attached at Client scope",
    owns: "files",
  },
  {
    id: "notes",
    path: "notes",
    label: "Notes",
    description: "Internal notes for this Client",
    owns: "notes",
  },
  {
    id: "contacts",
    path: "contacts",
    label: "Contacts",
    description: "People and contact channels for this Client",
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
 * Foundation helper — uses project linkage available today.
 * When `projectId` is absent / empty, treat as daily work; otherwise project.
 */
export function resolveOrderClientBelonging(input: {
  projectId?: string | null;
}): OrderClientBelonging {
  const id = input.projectId?.trim();
  return id ? "project" : "daily_work";
}
