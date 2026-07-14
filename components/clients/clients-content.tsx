"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { ClientsTable } from "@/components/clients/clients-table";
import { EditClientDialog } from "@/components/clients/edit-client-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteClient,
  getAllClients,
  refreshClients,
  updateClient,
} from "@/lib/clients/repository";
import {
  CLIENT_TYPES,
  type Client,
  type NewClientInput,
} from "@/lib/clients/types";
import { filterClients, formatClientType } from "@/lib/clients/utils";
import { filterClientsByScopeIds } from "@/lib/identity/data-scope";

export function ClientsContent({
  initialClients,
  allowedClientIds = null,
}: {
  initialClients?: Client[];
  allowedClientIds?: string[] | null;
}) {
  const router = useRouter();
  const [clients, setClients] = useState(
    () =>
      initialClients ??
      filterClientsByScopeIds(getAllClients(), allowedClientIds)
  );
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Client | null>(null);

  useEffect(() => {
    let cancelled = false;
    void refreshClients()
      .then(() => {
        if (!cancelled) {
          setClients(
            filterClientsByScopeIds(getAllClients(), allowedClientIds)
          );
        }
      })
      .catch((err) => {
        console.error(err);
      });
    return () => {
      cancelled = true;
    };
  }, [allowedClientIds]);

  const filteredClients = useMemo(
    () => filterClients(clients, search, typeFilter),
    [clients, search, typeFilter]
  );

  async function handleSaveClient(
    id: string,
    patch: Partial<NewClientInput> & { isActive?: boolean }
  ) {
    await updateClient(id, patch);
    setClients(filterClientsByScopeIds(getAllClients(), allowedClientIds));
    router.refresh();
  }

  async function handleDeleteClient(client: Client) {
    if (
      !window.confirm(
        `Delete client “${client.name}”? This cannot be undone.`
      )
    ) {
      return;
    }
    await deleteClient(client.id);
    setClients(filterClientsByScopeIds(getAllClients(), allowedClientIds));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8"
              />
            </div>

            <Select
              value={typeFilter}
              onValueChange={(value) => {
                if (value) setTypeFilter(value);
              }}
            >
              <SelectTrigger className="h-8 w-full sm:w-40" size="sm">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {CLIENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {formatClientType(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <ClientsTable
            clients={filteredClients}
            onEdit={setEditing}
            onDelete={handleDeleteClient}
          />
        </CardContent>
      </Card>

      <EditClientDialog
        client={editing}
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSave={handleSaveClient}
      />
    </div>
  );
}
