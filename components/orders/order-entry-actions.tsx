"use client";

import { useRouter } from "next/navigation";

import { AddOrderDialog } from "@/components/orders/add-order-dialog";
import { refreshClients } from "@/lib/clients/repository";
import { emitOrderClientPayment } from "@/lib/integration";
import { createOrder, refreshOrders } from "@/lib/orders/repository";
import type { NewOrderInput, ProjectType } from "@/lib/orders/types";
import { refreshProjects } from "@/lib/projects/repository";

interface OrderEntryActionsProps {
  defaultProjectType?: ProjectType;
  triggerLabel?: string;
}

export function OrderEntryActions({
  defaultProjectType,
  triggerLabel,
}: OrderEntryActionsProps) {
  const router = useRouter();

  async function handleAdd(input: NewOrderInput) {
    await refreshClients();
    await refreshProjects();
    const order = await createOrder(input);
    if (input.deposit > 0) {
      await emitOrderClientPayment({
        orderId: order.id,
        amount: input.deposit,
        notes: `Deposit on order ${order.id}`,
      });
    }
    await refreshOrders();
    router.refresh();
  }

  return (
    <AddOrderDialog
      onAdd={handleAdd}
      defaultProjectType={defaultProjectType}
      triggerLabel={triggerLabel}
    />
  );
}
