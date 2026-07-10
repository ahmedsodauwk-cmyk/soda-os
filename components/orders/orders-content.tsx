"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { AddOrderDialog } from "@/components/orders/add-order-dialog";
import { OrdersTable } from "@/components/orders/orders-table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockOrders } from "@/lib/orders/mock-data";
import { ORDER_STATUSES, type NewOrderInput } from "@/lib/orders/types";
import { filterOrders, generateOrderId } from "@/lib/orders/utils";

export function OrdersContent() {
  const [orders, setOrders] = useState(mockOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredOrders = useMemo(
    () => filterOrders(orders, search, statusFilter),
    [orders, search, statusFilter]
  );

  function handleAddOrder(input: NewOrderInput) {
    setOrders((prev) => [
      { id: generateOrderId(prev.length), ...input },
      ...prev,
    ]);
  }

  return (
    <div className="space-y-6">
      <Card className="transition-colors hover:bg-muted/30">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-full sm:w-40" size="sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AddOrderDialog onAdd={handleAddOrder} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <OrdersTable orders={filteredOrders} />
        </CardContent>
      </Card>
    </div>
  );
}
