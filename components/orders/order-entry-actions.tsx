"use client";

import { useRouter } from "next/navigation";

import { AddOrderDialog } from "@/components/orders/add-order-dialog";
import { useShellOptional } from "@/components/layout/shell-context";
import { useUiActions } from "@/lib/brand/use-ui-actions";
import { refreshAssignments } from "@/lib/assignments/repository";
import { refreshClients } from "@/lib/clients/repository";
import { refreshFinance } from "@/lib/finance/repository";
import { createSmartOrderAction } from "@/lib/orders/actions";
import { refreshOrders } from "@/lib/orders/repository";
import type { ProjectType, SmartOrderInput } from "@/lib/orders/types";
import { refreshPeople } from "@/lib/people/repository";
import { refreshProjects } from "@/lib/projects/repository";

interface OrderEntryActionsProps {
  defaultProjectType?: ProjectType;
  triggerLabel?: string;
  triggerClassName?: string;
}

export function OrderEntryActions({
  defaultProjectType,
  triggerLabel,
  triggerClassName,
}: OrderEntryActionsProps) {
  const router = useRouter();
  const actions = useUiActions();
  const shell = useShellOptional();
  const isFounder = shell?.user?.accessLevel === "founder";

  if (!isFounder) return null;

  async function handleAdd(input: SmartOrderInput) {
    const result = await createSmartOrderAction(input);
    if (!result.ok) {
      throw new Error(result.error);
    }
    await refreshClients();
    await refreshPeople();
    await refreshProjects();
    await refreshOrders();
    await refreshAssignments();
    await refreshFinance();
    router.refresh();
  }

  return (
    <AddOrderDialog
      onAdd={handleAdd}
      defaultProjectType={defaultProjectType}
      triggerLabel={triggerLabel ?? actions.createOrder}
      triggerClassName={triggerClassName}
      allowInlineClientCreate
    />
  );
}
