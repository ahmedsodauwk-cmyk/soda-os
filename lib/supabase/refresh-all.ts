import { refreshAssignments } from "@/lib/assignments/repository";
import { refreshClients } from "@/lib/clients/repository";
import { bootstrapBusinessCore } from "@/lib/core/bootstrap";
import { refreshEquipment } from "@/lib/equipment/repository";
import { refreshFiles } from "@/lib/files/repository";
import { refreshPeriodClosings } from "@/lib/finance/closing";
import { refreshExpenses } from "@/lib/finance/expenses";
import { refreshFinance } from "@/lib/finance/repository";
import { refreshTransfers } from "@/lib/finance/transfers";
import { refreshInvoices } from "@/lib/invoices/repository";
import { refreshOrders } from "@/lib/orders/repository";
import { refreshPayments } from "@/lib/payments/repository";
import { refreshPeople } from "@/lib/people/repository";
import { refreshProjects } from "@/lib/projects/repository";
import { refreshQuotations } from "@/lib/quotations/repository";
import { ensureTaxonomyPersisted } from "@/lib/taxonomy/persist";
import {
  ensureDefaultCashAccounts,
  refreshCashAccounts,
  refreshCashMovements,
} from "@/lib/wallets/cash-accounts";
import { refreshCrewEarnings } from "@/lib/wallets/crew-wallet";

export async function refreshAllDomainData(): Promise<void> {
  bootstrapBusinessCore();
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
    refreshFinance(),
    refreshFiles(),
    refreshCashAccounts(),
    refreshCashMovements(),
    refreshCrewEarnings(),
    refreshExpenses(),
    refreshTransfers(),
    refreshPeriodClosings(),
  ]);
  await ensureDefaultCashAccounts();
}
