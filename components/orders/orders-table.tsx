"use client";

import Link from "next/link";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { getEmptyState } from "@/lib/brand/soda-voice";
import { UI_ACTIONS } from "@/lib/brand/ui-actions";
import { formatDate, formatPrice, getInitials } from "@/lib/orders/utils";
import type { Order } from "@/lib/orders/types";

interface OrdersTableProps {
  orders: Order[];
  onEdit?: (order: Order) => void;
  onDelete?: (order: Order) => void;
}

export function OrdersTable({ orders, onEdit, onDelete }: OrdersTableProps) {
  if (orders.length === 0) {
    const empty = getEmptyState("orders");
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <p className="text-sm font-medium" dir="rtl">
          {empty.title}
        </p>
        <p
          className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground"
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
          <TableHead>Order ID</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Project Type</TableHead>
          <TableHead>Shoot Date</TableHead>
          <TableHead>Delivery Date</TableHead>
          <TableHead>Team</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-10">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => {
          const viewHref = `/orders/${order.id}`;
          return (
            <TableRow key={order.id}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                <Link
                  href={viewHref}
                  className="hover:text-soda-pink hover:underline"
                >
                  {order.id}
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <Avatar size="sm">
                    <AvatarFallback className="text-xs">
                      {getInitials(order.clientName)}
                    </AvatarFallback>
                  </Avatar>
                  <Link
                    href={viewHref}
                    className="font-medium hover:text-soda-pink"
                  >
                    {order.clientName}
                  </Link>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {order.phone}
              </TableCell>
              <TableCell>{order.projectType}</TableCell>
              <TableCell>{formatDate(order.shootDate) || "—"}</TableCell>
              <TableCell>{formatDate(order.deliveryDate) || "—"}</TableCell>
              <TableCell>{order.team}</TableCell>
              <TableCell className="text-right font-medium">
                {formatPrice(order.price)}
              </TableCell>
              <TableCell>
                <OrderStatusBadge status={order.status} />
              </TableCell>
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
                      render={<Link href={viewHref} />}
                      nativeButton={false}
                    >
                      <Eye />
                      View order
                    </DropdownMenuItem>
                    {onEdit ? (
                      <DropdownMenuItem onClick={() => onEdit(order)}>
                        <Pencil />
                        {UI_ACTIONS.edit}
                      </DropdownMenuItem>
                    ) : null}
                    {onDelete ? (
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onDelete(order)}
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
