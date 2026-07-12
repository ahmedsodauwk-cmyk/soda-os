import { getAssignmentsByOrder } from "@/lib/assignments/repository";
import { getAllClients, getClientById } from "@/lib/clients/repository";
import { getOrders } from "@/lib/orders/repository";
import type { NewOrderInput, Order, SmartOrderInput } from "@/lib/orders/types";
import { ORDER_STATUSES, PROJECT_TYPES, DRESS_CODES } from "@/lib/orders/types";
import { getPersonById } from "@/lib/people/repository";
import { getProjectSeedById } from "@/lib/projects/repository";

export type OrderValidationErrors = Partial<
  Record<keyof NewOrderInput | "form" | "squadMemberIds" | "reelCount", string>
>;

export function validateOrderFinancials(input: {
  price: number;
  deposit: number;
  latePenaltyEnabled?: boolean;
  latePenaltyAmount?: number;
}): OrderValidationErrors {
  const errors: OrderValidationErrors = {};
  if (!Number.isFinite(input.price) || input.price <= 0) {
    errors.price = "Price must be greater than 0";
  }
  if (!Number.isFinite(input.deposit) || input.deposit < 0) {
    errors.deposit = "Deposit cannot be negative";
  }
  if (
    Number.isFinite(input.price) &&
    Number.isFinite(input.deposit) &&
    input.deposit > input.price
  ) {
    errors.deposit = "Deposit cannot exceed price";
  }
  if (input.latePenaltyEnabled) {
    if (
      !Number.isFinite(input.latePenaltyAmount) ||
      (input.latePenaltyAmount ?? 0) <= 0
    ) {
      errors.latePenaltyAmount = "Late penalty amount must be greater than 0";
    }
  }
  return errors;
}

export function validateRequiredOrderFields(
  input: Partial<NewOrderInput>
): OrderValidationErrors {
  const errors: OrderValidationErrors = {};
  if (!input.clientName?.trim() && !input.clientId) {
    errors.clientName = "Client is required";
  }
  if (!input.projectType || !PROJECT_TYPES.includes(input.projectType)) {
    errors.projectType = "Project type is required";
  }
  if (!input.status || !ORDER_STATUSES.includes(input.status)) {
    errors.status = "Order status is required";
  }
  if (!input.shootDate?.trim()) {
    errors.shootDate = "Shoot date is required";
  }
  if (!input.team?.trim()) {
    errors.team = "Squad is required";
  }
  // Delivery date + location are optional — never block creation
  if (input.dressCode && !DRESS_CODES.includes(input.dressCode)) {
    errors.dressCode = "Invalid dress code";
  }
  return errors;
}

/** Prevent duplicate active orders for same client + shoot date + project type. */
export function findDuplicateOrder(
  input: Pick<NewOrderInput, "clientId" | "clientName" | "phone" | "shootDate" | "projectType">,
  excludeOrderId?: string
): Order | undefined {
  const shoot = input.shootDate?.trim();
  if (!shoot) return undefined;

  return getOrders().find((o) => {
    if (excludeOrderId && o.id === excludeOrderId) return false;
    if (o.status === "Cancelled") return false;
    if (o.shootDate !== shoot) return false;
    if (o.projectType !== input.projectType) return false;

    if (input.clientId && o.clientId === input.clientId) return true;

    const sameName =
      o.clientName.trim().toLowerCase() ===
      (input.clientName ?? "").trim().toLowerCase();
    const samePhone =
      Boolean(input.phone?.trim()) && o.phone.trim() === input.phone.trim();
    return sameName && samePhone;
  });
}

export function validateSquadMembers(
  memberIds: string[] | undefined
): OrderValidationErrors {
  const errors: OrderValidationErrors = {};
  if (!memberIds || memberIds.length === 0) return errors;
  const missing = memberIds.filter((id) => !getPersonById(id));
  if (missing.length > 0) {
    errors.squadMemberIds = `Unknown team members: ${missing.join(", ")}`;
  }
  return errors;
}

export function validateSmartOrderInput(
  input: SmartOrderInput,
  options?: { excludeOrderId?: string; allowDuplicate?: boolean }
): OrderValidationErrors {
  const errors: OrderValidationErrors = {
    ...validateRequiredOrderFields(input),
    ...validateOrderFinancials(input),
    ...validateSquadMembers(input.squadMemberIds),
  };

  if (input.deliverables?.includes("Reels")) {
    if (!Number.isFinite(input.reelCount) || (input.reelCount ?? 0) <= 0) {
      errors.reelCount = "Reel count is required when Reels is selected";
    }
  }

  if (input.clientId && !getClientById(input.clientId)) {
    errors.clientId = `Client not found: ${input.clientId}`;
  }

  if (input.projectId && !getProjectSeedById(input.projectId)) {
    // Allow if createNewProject will replace — only error when linking existing
    if (!input.createNewProject) {
      errors.projectId = `Project not found: ${input.projectId}`;
    }
  }

  if (input.createNewClient) {
    if (!input.clientName?.trim()) {
      errors.clientName = "Client name is required to create a client";
    }
    if (!input.phone?.trim()) {
      errors.phone = "Phone is required when creating a new client";
    }
    const dupClient = getAllClients().find(
      (c) =>
        c.isActive &&
        (c.phone === input.phone.trim() ||
          c.name.toLowerCase() === input.clientName.trim().toLowerCase())
    );
    if (dupClient) {
      errors.clientName = `Client already exists (${dupClient.name}). Select them instead.`;
    }
  }

  if (!options?.allowDuplicate) {
    const dup = findDuplicateOrder(input, options?.excludeOrderId);
    if (dup) {
      errors.form = `Duplicate order: ${dup.clientName} already has a ${dup.projectType} on ${dup.shootDate} (${dup.id})`;
    }
  }

  return errors;
}

/** Ensure no orphan assignments remain for cancelled orders (caller deletes). */
export function listOrphanAssignmentRisk(orderId: string): string[] {
  const assignments = getAssignmentsByOrder(orderId);
  return assignments
    .filter((a) => a.paidAmount <= 0)
    .map((a) => a.id);
}

export function assertValidOrThrow(errors: OrderValidationErrors): void {
  const messages = Object.values(errors).filter(Boolean);
  if (messages.length > 0) {
    throw new Error(messages.join("; "));
  }
}
