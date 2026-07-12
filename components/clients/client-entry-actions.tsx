"use client";

import { useRouter } from "next/navigation";

import { AddClientDialog } from "@/components/clients/add-client-dialog";
import { createClient } from "@/lib/clients/repository";
import type { ClientType, NewClientInput } from "@/lib/clients/types";

interface ClientEntryActionsProps {
  defaultType?: ClientType;
  defaultSegment?: NewClientInput["segment"];
  triggerLabel?: string;
}

export function ClientEntryActions({
  defaultType,
  defaultSegment,
  triggerLabel = "➕ إنشاء عميل",
}: ClientEntryActionsProps) {
  const router = useRouter();

  async function handleAdd(input: NewClientInput) {
    await createClient(input);
    router.refresh();
  }

  return (
    <AddClientDialog
      onAdd={handleAdd}
      defaultType={defaultType}
      defaultSegment={defaultSegment}
      triggerLabel={triggerLabel}
    />
  );
}
