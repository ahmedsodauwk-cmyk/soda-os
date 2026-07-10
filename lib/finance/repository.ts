/**
 * Finance repository stub — rollups will use lib/payments + lib/business.
 */
import type { FinanceSummary, Invoice } from "@/lib/finance/types";

export function getInvoices(): Invoice[] {
  return [];
}

export function getFinanceSummary(): FinanceSummary {
  return {
    revenuePaid: 0,
    revenuePending: 0,
    outstandingBalance: 0,
    currency: "EGP",
  };
}
