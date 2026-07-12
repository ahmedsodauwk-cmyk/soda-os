import type {
  DressCode,
  Order,
  OrderDeliverable,
  OrderPriority,
  OrderStatus,
  PlannedExpenseLine,
  ProjectType,
} from "@/lib/orders/types";
import { ORDER_DELIVERABLES } from "@/lib/orders/types";
import { toPersistedOrderStatus } from "@/lib/orders/status";

export type OrderRow = {
  id: string;
  project_id: string;
  client_id: string | null;
  client_name: string;
  phone: string;
  whatsapp?: string | null;
  project_type: string;
  workspace_id: string;
  subcategory_id: string | null;
  shoot_date: string | null;
  location: string;
  delivery_date: string | null;
  price: number | string;
  deposit: number | string;
  team: string;
  squad_member_ids?: unknown;
  status: string;
  priority?: string | null;
  brief?: string | null;
  dress_code?: string | null;
  late_penalty_enabled?: boolean | null;
  late_penalty_amount?: number | string | null;
  late_penalty_reason?: string | null;
  notes: string;
  package_name?: string | null;
  deliverables?: unknown;
  reel_count?: number | string | null;
  planned_expenses?: unknown;
  created_at?: string;
  updated_at?: string;
};

function asStringIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => String(v ?? "").trim())
    .filter((id) => id.length > 0);
}

function asDeliverables(value: unknown): OrderDeliverable[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<string>(ORDER_DELIVERABLES);
  return value
    .map((v) => String(v ?? "").trim())
    .filter((v): v is OrderDeliverable => allowed.has(v));
}

function asPlannedExpenses(value: unknown): PlannedExpenseLine[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const row = raw as Record<string, unknown>;
      const kind = String(row.kind ?? "other");
      const amount = Number(row.amount) || 0;
      if (amount < 0) return null;
      return {
        kind: kind as PlannedExpenseLine["kind"],
        amount,
        ...(row.label ? { label: String(row.label) } : {}),
        ...(row.notes ? { notes: String(row.notes) } : {}),
      } satisfies PlannedExpenseLine;
    })
    .filter((x): x is PlannedExpenseLine => x != null);
}

export function rowToOrder(row: OrderRow): Order {
  const dress = row.dress_code?.trim();
  const priority = (row.priority?.trim() || "normal") as OrderPriority;
  return {
    id: row.id,
    projectId: row.project_id,
    ...(row.client_id ? { clientId: row.client_id } : {}),
    clientName: row.client_name,
    phone: row.phone ?? "",
    whatsapp: row.whatsapp ?? "",
    projectType: row.project_type as ProjectType,
    workspaceId: row.workspace_id,
    ...(row.subcategory_id ? { subcategoryId: row.subcategory_id } : {}),
    shootDate: row.shoot_date ?? "",
    location: row.location ?? "",
    deliveryDate: row.delivery_date ?? "",
    price: Number(row.price) || 0,
    deposit: Number(row.deposit) || 0,
    team: row.team ?? "",
    squadMemberIds: asStringIds(row.squad_member_ids),
    status: row.status as OrderStatus,
    priority,
    brief: row.brief ?? "",
    ...(dress ? { dressCode: dress as DressCode } : {}),
    latePenaltyEnabled: Boolean(row.late_penalty_enabled),
    latePenaltyAmount: Number(row.late_penalty_amount) || 0,
    latePenaltyReason: row.late_penalty_reason ?? "",
    notes: row.notes ?? "",
    packageName: row.package_name ?? "",
    deliverables: asDeliverables(row.deliverables),
    reelCount: Number(row.reel_count) || 0,
    plannedExpenses: asPlannedExpenses(row.planned_expenses),
  };
}

/** Full V3+ row (requires smart order + smart ops + order business flow migrations). */
export function orderToRow(order: Order): Record<string, unknown> {
  return {
    id: order.id,
    project_id: order.projectId,
    client_id: order.clientId ?? null,
    client_name: order.clientName,
    phone: order.phone ?? "",
    whatsapp: order.whatsapp ?? "",
    project_type: order.projectType,
    workspace_id: order.workspaceId,
    subcategory_id: order.subcategoryId ?? null,
    shoot_date: order.shootDate || null,
    location: order.location ?? "",
    delivery_date: order.deliveryDate || null,
    price: order.price,
    deposit: order.deposit,
    team: order.team ?? "",
    squad_member_ids: order.squadMemberIds ?? [],
    status: order.status,
    priority: order.priority ?? "normal",
    brief: order.brief ?? "",
    dress_code: order.dressCode ?? null,
    late_penalty_enabled: order.latePenaltyEnabled ?? false,
    late_penalty_amount: order.latePenaltyAmount ?? 0,
    late_penalty_reason: order.latePenaltyReason ?? "",
    notes: order.notes ?? "",
    package_name: order.packageName || null,
    deliverables: order.deliverables ?? [],
    reel_count: order.reelCount ?? 0,
    planned_expenses: order.plannedExpenses ?? [],
  };
}

/**
 * Legacy-compatible row when V3 migration is not yet applied.
 * Maps Holding/Confirmed/Completed → Pending/Scheduled/Delivered and
 * omits columns that do not exist on the base schema.
 */
export function orderToLegacyRow(order: Order): Record<string, unknown> {
  return {
    id: order.id,
    project_id: order.projectId,
    client_id: order.clientId ?? null,
    client_name: order.clientName,
    phone: order.phone ?? "",
    project_type: order.projectType,
    workspace_id: order.workspaceId,
    subcategory_id: order.subcategoryId ?? null,
    shoot_date: order.shootDate || null,
    location: order.location ?? "",
    delivery_date: order.deliveryDate || null,
    price: order.price,
    deposit: order.deposit,
    team: order.team ?? "",
    status: toPersistedOrderStatus(order.status),
    notes: [
      order.notes,
      order.brief ? `[brief] ${order.brief}` : "",
      order.dressCode ? `[dress] ${order.dressCode}` : "",
      order.latePenaltyEnabled
        ? `[late-penalty] ${order.latePenaltyAmount} — ${order.latePenaltyReason}`
        : "",
      order.squadMemberIds?.length
        ? `[squad] ${order.squadMemberIds.join(",")}`
        : "",
      order.whatsapp ? `[whatsapp] ${order.whatsapp}` : "",
      order.packageName ? `[package] ${order.packageName}` : "",
      order.deliverables?.length
        ? `[deliverables] ${order.deliverables.join(",")}`
        : "",
      order.reelCount > 0 ? `[reels] ${order.reelCount}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export function isMissingColumnError(message: string): boolean {
  return (
    /column/i.test(message) &&
    (/does not exist|schema cache|Could not find/i.test(message) ||
      /whatsapp|brief|dress_code|late_penalty|squad_member|priority|package_name|deliverables|reel_count|planned_expenses/i.test(
        message
      ))
  );
}

export function isStatusCheckError(message: string): boolean {
  return /status|check constraint|violates/i.test(message);
}
