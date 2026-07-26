"use client";

import { useRouter } from "next/navigation";

import { AddClientDialog } from "@/components/clients/add-client-dialog";
import { useShellOptional } from "@/components/layout/shell-context";
import { useUiActions } from "@/lib/brand/use-ui-actions";
import { createClientAction } from "@/lib/clients/actions";
import type { ClientType, NewClientInput } from "@/lib/clients/types";

interface ClientEntryActionsProps {
  defaultType?: ClientType;
  defaultSegment?: NewClientInput["segment"];
  triggerLabel?: string;
}

export function ClientEntryActions({
  defaultType,
  defaultSegment,
  triggerLabel,
}: ClientEntryActionsProps) {
  const router = useRouter();
  const actions = useUiActions();
  const shell = useShellOptional();
  const isFounder = shell?.user?.accessLevel === "founder";

  if (!isFounder) return null;

  async function handleAdd(input: NewClientInput) {
    const result = await createClientAction(input);
    if (!result.ok) throw new Error(result.error);
    router.refresh();
  }

  return (
    <AddClientDialog
      onAdd={handleAdd}
      defaultType={defaultType}
      defaultSegment={defaultSegment}
      triggerLabel={triggerLabel ?? actions.createClient}
    />
  );
}
