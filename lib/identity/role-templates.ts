/**
 * Operational role templates — starting points for Founder customization.
 * DB `roles` / `role_permissions` remains Source of Truth; these document
 * the intended defaults shipped in migrations 000013 + 000015.
 *
 * Does NOT create Auth users or people rows.
 */

import type { SodaRole } from "@/lib/identity/roles";
import type { Permission } from "@/lib/identity/permissions";

export type RoleTemplate = {
  id: SodaRole;
  label: string;
  description: string;
  /** Default permission keys for this template (DB may diverge after Founder edits). */
  defaultPermissionHints: readonly Permission[];
};

const CREW_SURFACE: Permission[] = [
  "dashboard.crew",
  "orders.view",
  "orders.status",
  "calendar.view",
  "notifications.view",
  "me.wallet",
  "me.bonus",
  "me.target",
  "me.penalties",
  "me.files",
  "me.briefs",
  "me.dress_code",
  "me.performance",
];

const PM_SURFACE: Permission[] = [
  "dashboard.team",
  "orders.view",
  "orders.edit",
  "orders.status",
  "orders.create",
  "orders.approve",
  "projects.view",
  "projects.edit",
  "crew.view",
  "crew.stats",
  "people.view",
  "work.assign",
  "crew.manage",
  "clients.manage",
  "calendar.view",
  "calendar.edit",
  "calendar.manage",
  "notifications.view",
  "me.performance",
];

/**
 * Ordered Founder-facing templates (Mission 04.4.2).
 * Includes legacy keys (owner, team_leader, crew_member, client) for existing profiles.
 */
export const ROLE_TEMPLATES: readonly RoleTemplate[] = [
  {
    id: "founder",
    label: "Founder",
    description:
      "SODA VISUALS Founder — full operational authority; customize via Authority Center",
    defaultPermissionHints: [], // all
  },
  {
    id: "owner",
    label: "Owner",
    description: "Legacy full-control equivalent to Founder",
    defaultPermissionHints: [],
  },
  {
    id: "admin",
    label: "Admin",
    description:
      "Studio ops manager — Authority Center access; no order finance unless Founder grants",
    defaultPermissionHints: [],
  },
  {
    id: "project_manager",
    label: "Project Manager",
    description: "Projects, orders, crew coordination",
    defaultPermissionHints: PM_SURFACE,
  },
  {
    id: "team_leader",
    label: "Team Leader",
    description: "Legacy project lead — prefer Project Manager for new accounts",
    defaultPermissionHints: PM_SURFACE,
  },
  {
    id: "photographer",
    label: "Photographer",
    description: "Photography crew — personal workspace, assigned orders, wallet",
    defaultPermissionHints: CREW_SURFACE,
  },
  {
    id: "videographer",
    label: "Videographer",
    description: "Videography crew — personal workspace, assigned orders, wallet",
    defaultPermissionHints: CREW_SURFACE,
  },
  {
    id: "photo_editor",
    label: "Photo Editor",
    description: "Photo post-production crew member",
    defaultPermissionHints: CREW_SURFACE,
  },
  {
    id: "video_editor",
    label: "Video Editor",
    description: "Video post-production crew member",
    defaultPermissionHints: CREW_SURFACE,
  },
  {
    id: "social_media_manager",
    label: "Social Media Manager",
    description: "Social workspace, calendar, publish content — no finance",
    defaultPermissionHints: [
      "social.view",
      "social.edit",
      "content.publish",
      "calendar.view",
      "notifications.view",
      "projects.view",
      "orders.view",
    ],
  },
  {
    id: "sales",
    label: "Sales",
    description: "Quotations, clients, commercial pipeline",
    defaultPermissionHints: [
      "dashboard.company",
      "orders.view",
      "orders.create",
      "projects.view",
      "clients.view",
      "clients.edit",
      "clients.manage",
      "quotations.view",
      "quotations.edit",
      "commercial.view",
      "calendar.view",
      "notifications.view",
    ],
  },
  {
    id: "customer_service",
    label: "Customer Service",
    description: "Client relationships and order visibility",
    defaultPermissionHints: [
      "orders.view",
      "clients.view",
      "projects.view",
      "calendar.view",
      "notifications.view",
    ],
  },
  {
    id: "accountant",
    label: "Accountant",
    description: "Collections, payments, expenses, reports — no ops edit",
    defaultPermissionHints: [
      "dashboard.finance",
      "finance.view",
      "finance.edit",
      "finance.reports",
      "payments.view",
      "payments.edit",
      "payments.approve",
      "expenses.view",
      "expenses.edit",
      "expenses.create",
      "reports.view",
      "reports.manage",
      "statistics.view",
      "orders.view",
      "clients.view",
      "notifications.view",
    ],
  },
  {
    id: "freelancer",
    label: "Freelancer",
    description: "External crew — personal workspace surfaces",
    defaultPermissionHints: CREW_SURFACE,
  },
  {
    id: "crew_member",
    label: "Crew Member",
    description: "Legacy craft role — prefer specialized craft templates",
    defaultPermissionHints: CREW_SURFACE,
  },
  {
    id: "guest",
    label: "Guest",
    description: "Limited guest access",
    defaultPermissionHints: ["notifications.view"],
  },
  {
    id: "client",
    label: "Client",
    description: "External client portal",
    defaultPermissionHints: ["notifications.view"],
  },
];

export const PERMISSION_GROUPS = [
  "Orders",
  "Finance",
  "Crew",
  "Clients",
  "Projects",
  "Calendar",
  "Reports",
  "Notifications",
  "Connect",
  "Commercial",
  "Settings",
  "Social Media",
] as const;

export type PermissionGroup = (typeof PERMISSION_GROUPS)[number];

export type GroupablePermission = {
  id: string;
  label: string;
  permissionGroup: string | null;
};

/** Group permissions for Authority Center UI (client-safe). */
export function groupPermissionsByGroup(
  permissions: GroupablePermission[]
): { group: string; permissions: GroupablePermission[] }[] {
  const order = [...PERMISSION_GROUPS, "Other"];
  const buckets = new Map<string, GroupablePermission[]>();
  for (const p of permissions) {
    const g =
      p.permissionGroup &&
      (PERMISSION_GROUPS as readonly string[]).includes(p.permissionGroup)
        ? p.permissionGroup
        : p.permissionGroup || "Other";
    if (!buckets.has(g)) buckets.set(g, []);
    buckets.get(g)!.push(p);
  }
  const groups: { group: string; permissions: GroupablePermission[] }[] = [];
  for (const name of order) {
    const list = buckets.get(name);
    if (list?.length) {
      groups.push({
        group: name,
        permissions: list.sort((a, b) => a.id.localeCompare(b.id)),
      });
      buckets.delete(name);
    }
  }
  for (const [name, list] of buckets) {
    if (list.length) {
      groups.push({
        group: name,
        permissions: list.sort((a, b) => a.id.localeCompare(b.id)),
      });
    }
  }
  return groups;
}
