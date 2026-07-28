"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { EditClientDialog } from "@/components/clients/edit-client-dialog";
import { Button } from "@/components/ui/button";
import { UI_ACTIONS } from "@/lib/brand/ui-actions";
import {
  deleteClientAction,
  updateClientAction,
} from "@/lib/clients/actions";
import type { Client, NewClientInput } from "@/lib/clients/types";
import { useCanFounderMutateExisting } from "@/lib/identity/use-founder-mutation";

interface ClientProfileActionsProps {
  client: Client;
}

export function ClientProfileActions({ client }: ClientProfileActionsProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const canMutateExisting = useCanFounderMutateExisting();

  if (!canMutateExisting) {
    return null;
  }

  async function handleSave(
    id: string,
    patch: Partial<NewClientInput> & { isActive?: boolean }
  ) {
    const result = await updateClientAction(id, patch);
    if (!result.ok) throw new Error(result.error);
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm(`Delete client “${client.name}”?`)) return;
    const result = await deleteClientAction(client.id);
    if (!result.ok) throw new Error(result.error);
    router.push("/clients");
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => setEditing(true)}
        >
          {UI_ACTIONS.edit}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-destructive"
          onClick={() => void handleDelete()}
        >
          {UI_ACTIONS.delete}
        </Button>
      </div>
      <EditClientDialog
        client={editing ? client : null}
        open={editing}
        onOpenChange={setEditing}
        onSave={handleSave}
      />
    </>
  );
}
