import "@/lib/domain/server-only-guard";

import {
  accessLevelCan,
  isFounderAccess,
} from "@/lib/identity/access-levels";
import type { Permission } from "@/lib/identity/permission-ids";
import {
  buildDataScope,
  isOrderIdInScope,
  type DataScope,
} from "@/lib/identity/data-scope";
import {
  resolveSessionForApp,
  type SodaSession,
} from "@/lib/identity/session";
import { getClients, refreshClients } from "@/lib/clients/repository";
import { fetchOrderById, getOrders, refreshOrders } from "@/lib/orders/repository";
import { refreshAssignments } from "@/lib/assignments/repository";
import { refreshQuotations } from "@/lib/quotations/repository";

export type AuthGate =
  | { ok: true; session: SodaSession; scope: DataScope }
  | { ok: false; error: string };

export async function requireAuthenticatedSession(): Promise<
  SodaSession | null
> {
  return resolveSessionForApp();
}

export async function requirePermission(
  permission: Permission
): Promise<AuthGate> {
  const session = await resolveSessionForApp();
  if (!session) return { ok: false, error: "Unauthorized." };
  if (!accessLevelCan(session.profile.accessLevel, permission)) {
    return { ok: false, error: "Forbidden." };
  }
  const scope = await buildServerDataScope(session);
  return { ok: true, session, scope };
}

/** Founder-only mutations (order/client creation). Job title never grants this. */
export async function requireFounder(): Promise<AuthGate> {
  const session = await resolveSessionForApp();
  if (!session) return { ok: false, error: "Unauthorized." };
  if (!isFounderAccess(session.profile.accessLevel)) {
    return { ok: false, error: "Forbidden." };
  }
  const scope = await buildServerDataScope(session);
  return { ok: true, session, scope };
}

/**
 * Canonical guard for UPDATE/DELETE/status/archive/cancel/restore/reassign on
 * existing records. Trusted server session only — never browser role hints.
 */
export async function requireFounderMutationAccess(): Promise<AuthGate> {
  const session = await resolveSessionForApp();
  if (!session) return { ok: false, error: "Unauthorized." };
  if (!isFounderAccess(session.profile.accessLevel)) {
    return { ok: false, error: "Forbidden. Founder-only mutation." };
  }
  const scope = await buildServerDataScope(session);
  return { ok: true, session, scope };
}

export async function buildServerDataScope(
  session: SodaSession
): Promise<DataScope> {
  await Promise.all([
    refreshOrders(),
    refreshClients(),
    refreshAssignments(),
    refreshQuotations(),
  ]);
  return buildDataScope(session, {
    orders: getOrders(),
    clients: getClients(),
  });
}

export function isClientIdInScope(clientId: string, scope: DataScope): boolean {
  if (!scope.clientIds) return true;
  return scope.clientIds.has(clientId);
}

export async function assertOrderAccess(
  orderId: string,
  permission: Permission
): Promise<AuthGate> {
  const gate = await requirePermission(permission);
  if (!gate.ok) return gate;
  if (!isOrderIdInScope(orderId, gate.scope)) {
    return { ok: false, error: "Order not in scope." };
  }
  const order = await fetchOrderById(orderId);
  if (!order) return { ok: false, error: "Order not found." };
  return gate;
}

export async function assertClientAccess(
  clientId: string,
  permission: Permission
): Promise<AuthGate> {
  const gate = await requirePermission(permission);
  if (!gate.ok) return gate;
  if (!isClientIdInScope(clientId, gate.scope)) {
    return { ok: false, error: "Client not in scope." };
  }
  return gate;
}
