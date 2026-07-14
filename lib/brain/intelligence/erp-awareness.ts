/**
 * ERP Awareness — READ-ONLY client/order summaries for Ops Desk replies.
 * Never creates or mutates ERP records.
 */

import { getClients, refreshClients } from "@/lib/clients/repository";
import { getOrdersByClient } from "@/lib/orders/repository";
import { getProjectsByClient } from "@/lib/projects/repository";
import type { ErpAwarenessHit } from "@/lib/brain/intelligence/types";

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Soft-match Brain labels against ERP clients (cache).
 * Call refreshClients() in the server action before this when possible.
 */
export function findErpAwarenessHits(labels: string[]): ErpAwarenessHit[] {
  const clients = getClients();
  const hits: ErpAwarenessHit[] = [];
  const seen = new Set<string>();

  for (const raw of labels) {
    const needle = normalize(raw);
    if (!needle || needle.length < 2) continue;

    for (const c of clients) {
      if (seen.has(c.id)) continue;
      const name = normalize(c.name);
      const company = c.company ? normalize(c.company) : "";
      const match =
        name.includes(needle) ||
        needle.includes(name) ||
        (company &&
          (company.includes(needle) || needle.includes(company)));
      if (!match) continue;

      seen.add(c.id);
      const orders = getOrdersByClient(c.id).filter(
        (o) => o.status !== "Cancelled"
      );
      const projects = getProjectsByClient(c.id).filter((p) => p.isActive);
      const outstanding = orders.reduce(
        (sum, o) => sum + Math.max(0, (o.price ?? 0) - (o.deposit ?? 0)),
        0
      );

      hits.push({
        clientId: c.id,
        clientName: c.name,
        projectsCount: projects.length,
        ordersCount: orders.length,
        outstandingHint: outstanding > 0 ? outstanding : null,
        noteAr:
          projects.length > 0
            ? `${c.name} عندنا عليه ${projects.length} مشروع${projects.length === 1 ? "" : "ات"} و${orders.length} أوردر${orders.length === 1 ? "" : "ات"} في النظام.`
            : `${c.name} موجود كعميل${orders.length > 0 ? ` · ${orders.length} أوردر` : " من غير مشاريع مفتوحة"}.`,
        noteEn:
          projects.length > 0
            ? `${c.name} has ${projects.length} project(s) and ${orders.length} order(s) in ERP.`
            : `${c.name} is on file as a client${orders.length > 0 ? ` · ${orders.length} order(s)` : " · no open projects"}.`,
      });
    }
  }

  return hits.slice(0, 5);
}

/** Warm client cache then search — used by Ops Desk server actions. */
export async function loadErpAwarenessForLabels(
  labels: string[]
): Promise<ErpAwarenessHit[]> {
  const cleaned = labels.map((l) => l.trim()).filter(Boolean);
  if (cleaned.length === 0) return [];
  try {
    await refreshClients();
  } catch {
    /* cache may still have data */
  }
  return findErpAwarenessHits(cleaned);
}
