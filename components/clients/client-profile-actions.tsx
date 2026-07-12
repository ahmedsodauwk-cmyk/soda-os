"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { EditClientDialog } from "@/components/clients/edit-client-dialog";
import { Button } from "@/components/ui/button";
import { UI_ACTIONS } from "@/lib/brand/ui-actions";
import {
  deleteClient,
  updateClient,
} from "@/lib/clients/repository";
import type { Client, NewClientInput } from "@/lib/clients/types";

interface ClientProfileActionsProps {
  client: Client;
}

export function ClientProfileActions({ client }: ClientProfileActionsProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  async function handleSave(
    id: string,
    patch: Partial<NewClientInput> & { isActive?: boolean }
  ) {
    await updateClient(id, patch);
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm(`Delete client “${client.name}”?`)) return;
    await deleteClient(client.id);
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
