import { computeClientStats } from "@/lib/business/client-stats";
import { BUSINESS_TODAY } from "@/lib/business/types";
import { getClientById, getClientsBySegment } from "@/lib/clients/repository";
import type { Client } from "@/lib/clients/types";
import {
  getClientInvoiceOutstanding,
  getDeliveriesByClient,
  getInvoicesByClient,
  getInvoicesByPeriod,
  invoiceOutstanding,
} from "@/lib/invoices/repository";
import { getOrdersByClient } from "@/lib/orders/repository";
import type { Order } from "@/lib/orders/types";
import { getPayments } from "@/lib/payments/repository";
import { getProjects } from "@/lib/projects/repository";
import type { Project } from "@/lib/projects/types";

export interface MonthlyAccountLine {
  invoiceId: string;
  number: string;
  orderId?: string;
  projectId?: string;
  amount: number;
  paidAmount: number;
  outstanding: number;
  status: string;
  dueDate: string;
}

export interface MonthlyAccountSummary {
  clientId: string;
  periodMonth: string;
  lines: MonthlyAccountLine[];
  invoiced: number;
  collected: number;
  outstanding: number;
  orderCount: number;
  deliveryCount: number;
}

export interface CommercialClientProfile {
  client: Client;
  projects: Project[];
  orders: Order[];
  stats: ReturnType<typeof computeClientStats>;
  invoiceOutstanding: number;
  invoices: ReturnType<typeof getInvoicesByClient>;
  deliveries: ReturnType<typeof getDeliveriesByClient>;
  monthlyAccount: MonthlyAccountSummary;
  avgProjectValue: number;
  revenue: number;
  projectCount: number;
  orderCount: number;
  totalOutstanding: number;
}

export function buildMonthlyAccount(
  clientId: string,
  periodMonth: string
): MonthlyAccountSummary {
  const invoices = getInvoicesByPeriod(clientId, periodMonth);
  const lines: MonthlyAccountLine[] = invoices.map((inv) => ({
    invoiceId: inv.id,
    number: inv.number,
    orderId: inv.orderId,
    projectId: inv.projectId,
    amount: inv.amount,
    paidAmount: inv.paidAmount,
    outstanding: invoiceOutstanding(inv),
    status: inv.status,
    dueDate: inv.dueDate,
  }));

  const orders = getOrdersByClient(clientId).filter(
    (o) =>
      o.shootDate.startsWith(periodMonth) ||
      o.deliveryDate.startsWith(periodMonth)
  );
  const deliveries = getDeliveriesByClient(clientId).filter((d) =>
    d.dueDate.startsWith(periodMonth)
  );

  return {
    clientId,
    periodMonth,
    lines,
    invoiced: lines.reduce((s, l) => s + l.amount, 0),
    collected: lines.reduce((s, l) => s + l.paidAmount, 0),
    outstanding: lines.reduce((s, l) => s + l.outstanding, 0),
    orderCount: orders.length,
    deliveryCount: deliveries.length,
  };
}

export function getCommercialClientProfile(
  clientId: string,
  periodMonth: string = BUSINESS_TODAY.slice(0, 7)
): CommercialClientProfile | null {
  const client = getClientById(clientId);
  if (!client || client.segment !== "commercial") return null;

  const projects = getProjects().filter((p) => p.clientId === clientId);
  const orders = getOrdersByClient(clientId);
  const stats = computeClientStats(
    clientId,
    getProjects(),
    orders,
    getPayments()
  );
  const invoices = getInvoicesByClient(clientId);
  const deliveries = getDeliveriesByClient(clientId);
  const invoiceOutstandingTotal = getClientInvoiceOutstanding(clientId);
  const monthlyAccount = buildMonthlyAccount(clientId, periodMonth);

  const billable = orders.filter((o) => o.status !== "Cancelled");
  const revenue = billable.reduce((s, o) => s + o.price, 0);
  const avgProjectValue =
    projects.length > 0
      ? Math.round(
          projects.reduce((s, p) => s + p.revenue, 0) / projects.length
        )
      : 0;

  return {
    client,
    projects,
    orders,
    stats,
    invoiceOutstanding: invoiceOutstandingTotal,
    invoices,
    deliveries,
    monthlyAccount,
    avgProjectValue,
    revenue,
    projectCount: projects.length,
    orderCount: orders.length,
    totalOutstanding: Math.max(
      stats.outstandingBalance,
      invoiceOutstandingTotal
    ),
  };
}

export function getCommercialClients(): Client[] {
  return getClientsBySegment("commercial");
}
