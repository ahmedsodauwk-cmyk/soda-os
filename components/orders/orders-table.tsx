"use client";

import { Eye, MoreHorizontal, Pencil } from "lucide-react";

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
import { formatDate, formatPrice, getInitials } from "@/lib/orders/utils";
import type { Order } from "@/lib/orders/types";

interface OrdersTableProps {
  orders: Order[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <p className="text-sm font-medium">No orders found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Try adjusting your search or filters.
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
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {order.id}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2.5">
                <Avatar size="sm">
                  <AvatarFallback className="text-xs">
                    {getInitials(order.clientName)}
                  </AvatarFallback>
                </Avatar>
                <p className="font-medium">{order.clientName}</p>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">{order.phone}</TableCell>
            <TableCell>{order.projectType}</TableCell>
            <TableCell>{formatDate(order.shootDate)}</TableCell>
            <TableCell>{formatDate(order.deliveryDate)}</TableCell>
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
                  <DropdownMenuItem>
                    <Eye />
                    View details
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Pencil />
                    Edit order
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
