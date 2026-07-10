import type { Invoice, OrderDelivery } from "@/lib/invoices/types";
import { invoiceOutstanding } from "@/lib/invoices/types";
import { mockDeliveries, mockInvoices } from "@/lib/invoices/seed";

export function getDeliveries(): OrderDelivery[] {
  return [...mockDeliveries];
}

export function getDeliveriesByClient(clientId: string): OrderDelivery[] {
  return mockDeliveries.filter((d) => d.clientId === clientId);
}

export function getDeliveriesByOrder(orderId: string): OrderDelivery[] {
  return mockDeliveries.filter((d) => d.orderId === orderId);
}

export function getInvoices(): Invoice[] {
  return [...mockInvoices];
}

export function getInvoicesByClient(clientId: string): Invoice[] {
  return mockInvoices.filter((i) => i.clientId === clientId);
}

export function getInvoicesByPeriod(
  clientId: string,
  periodMonth: string
): Invoice[] {
  return mockInvoices.filter(
    (i) => i.clientId === clientId && i.periodMonth === periodMonth
  );
}

export function getClientInvoiceOutstanding(clientId: string): number {
  return getInvoicesByClient(clientId).reduce(
    (acc, inv) => acc + invoiceOutstanding(inv),
    0
  );
}

export { invoiceOutstanding };
