/**
 * Refresh all domain caches from Supabase (server pages / dashboard).
 */
import { refreshAssignments } from "@/lib/assignments/repository";
import { refreshClients } from "@/lib/clients/repository";
import { refreshEquipment } from "@/lib/equipment/repository";
import { refreshInvoices } from "@/lib/invoices/repository";
import { refreshOrders } from "@/lib/orders/repository";
import { refreshPayments } from "@/lib/payments/repository";
import { refreshPeople } from "@/lib/people/repository";
import { refreshProjects } from "@/lib/projects/repository";
import { refreshQuotations } from "@/lib/quotations/repository";
import { ensureTaxonomyPersisted } from "@/lib/taxonomy/persist";

export async function refreshAllDomainData(): Promise<void> {
  await ensureTaxonomyPersisted();
  await Promise.all([
    refreshClients(),
    refreshPeople(),
    refreshEquipment(),
    refreshProjects(),
    refreshOrders(),
    refreshAssignments(),
    refreshQuotations(),
    refreshPayments(),
    refreshInvoices(),
  ]);
}
