"use client";

import Link from "next/link";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { ClientTypeBadge } from "@/components/clients/client-type-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SodaLogo } from "@/components/brand/soda-logo";
import { getEmptyState } from "@/lib/brand/soda-voice";
import { UI_ACTIONS } from "@/lib/brand/ui-actions";
import type { Client } from "@/lib/clients/types";
import {
  formatDate,
  getClientContactLabel,
  getClientDisplayName,
  getInitials,
} from "@/lib/clients/utils";

interface ClientsTableProps {
  clients: Client[];
  onEdit?: (client: Client) => void;
  onDelete?: (client: Client) => void;
}

export function ClientsTable({
  clients,
  onEdit,
  onDelete,
}: ClientsTableProps) {
  if (clients.length === 0) {
    const empty = getEmptyState("clients");
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
        <SodaLogo placement="empty" showWord={false} />
        <p className="text-sm font-medium" dir="rtl">
          {empty.title}
        </p>
        <p
          className="mt-0 max-w-sm text-xs leading-relaxed text-muted-foreground"
          dir="rtl"
        >
          {empty.description}
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-10">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => {
          const displayName = getClientDisplayName(client);

          return (
            <TableRow key={client.id}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {client.id}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <Avatar size="sm">
                    <AvatarFallback className="text-xs">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <Link
                    href={`/clients/${client.id}`}
                    className="font-medium hover:text-soda-pink"
                  >
                    {displayName}
                  </Link>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {client.phone}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {client.email ?? "—"}
              </TableCell>
              <TableCell>{getClientContactLabel(client)}</TableCell>
              <TableCell>
                <ClientTypeBadge type={client.type} />
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    client.isActive
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-zinc-500/30 bg-zinc-500/10 text-zinc-400"
                  }
                >
                  {client.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(client.createdAt)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" className="size-7" />
                    }
                  >
                    <MoreHorizontal />
                    <span className="sr-only">Open menu</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      render={<Link href={`/clients/${client.id}`} />}
                      nativeButton={false}
                    >
                      <Eye />
                      View details
                    </DropdownMenuItem>
                    {onEdit ? (
                      <DropdownMenuItem onClick={() => onEdit(client)}>
                        <Pencil />
                        {UI_ACTIONS.edit}
                      </DropdownMenuItem>
                    ) : null}
                    {onDelete ? (
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onDelete(client)}
                      >
                        <Trash2 />
                        {UI_ACTIONS.delete}
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
