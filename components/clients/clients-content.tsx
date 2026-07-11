"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { AddClientDialog } from "@/components/clients/add-client-dialog";
import { ClientsTable } from "@/components/clients/clients-table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient, getAllClients } from "@/lib/clients/repository";
import { CLIENT_TYPES, type NewClientInput } from "@/lib/clients/types";
import { filterClients, formatClientType } from "@/lib/clients/utils";

export function ClientsContent() {
  const [clients, setClients] = useState(getAllClients);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredClients = useMemo(
    () => filterClients(clients, search, typeFilter),
    [clients, search, typeFilter]
  );

  function handleAddClient(input: NewClientInput) {
    createClient(input);
    setClients(getAllClients());
  }

  return (
    <div className="space-y-6">
      <Card className="transition-colors hover:bg-muted/30">
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

          <AddClientDialog onAdd={handleAddClient} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <ClientsTable clients={filteredClients} />
        </CardContent>
      </Card>
    </div>
  );
}
