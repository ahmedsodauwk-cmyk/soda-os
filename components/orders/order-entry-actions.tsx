"use client";

import { useRouter } from "next/navigation";

import { AddOrderDialog } from "@/components/orders/add-order-dialog";
import { refreshAssignments } from "@/lib/assignments/repository";
import { refreshClients } from "@/lib/clients/repository";
import { refreshFinance } from "@/lib/finance/repository";
import { createSmartOrder } from "@/lib/orders/engine";
import { refreshOrders } from "@/lib/orders/repository";
import type { ProjectType, SmartOrderInput } from "@/lib/orders/types";
import { refreshPeople } from "@/lib/people/repository";
import { refreshProjects } from "@/lib/projects/repository";

interface OrderEntryActionsProps {
  defaultProjectType?: ProjectType;
  triggerLabel?: string;
}

export function OrderEntryActions({
  defaultProjectType,
  triggerLabel = "➕ إنشاء أوردر",
}: OrderEntryActionsProps) {
  const router = useRouter();

  async function handleAdd(input: SmartOrderInput) {
    await refreshClients();
    await refreshPeople();
    await refreshProjects();
    await createSmartOrder(input);
    await refreshOrders();
    await refreshAssignments();
    await refreshFinance();
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
