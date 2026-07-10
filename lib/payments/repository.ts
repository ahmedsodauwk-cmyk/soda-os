import { mockPayments } from "@/lib/payments/mock-data";
import type { Payment } from "@/lib/payments/types";

export function getPayments(): Payment[] {
  return [...mockPayments];
}

export function getPaymentById(id: string): Payment | undefined {
  return mockPayments.find((p) => p.id === id);
}

export function getPaymentsByOrder(orderId: string): Payment[] {
  return mockPayments.filter((p) => p.orderId === orderId);
}

export function getPaymentsByProject(projectId: string): Payment[] {
  return mockPayments.filter((p) => p.projectId === projectId);
}

export function getPaymentsByClient(clientId: string): Payment[] {
  return mockPayments.filter((p) => p.clientId === clientId);
}

export function getPaidTotal(payments: Payment[]): number {
  return payments
    .filter((p) => p.status === "paid" && p.kind !== "refund")
    .reduce((acc, p) => acc + p.amount, 0);
}

export function getPendingTotal(payments: Payment[]): number {
  return payments
    .filter((p) => p.status === "pending")
    .reduce((acc, p) => acc + p.amount, 0);
}
