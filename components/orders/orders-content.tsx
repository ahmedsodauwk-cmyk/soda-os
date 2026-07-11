"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { AddOrderDialog } from "@/components/orders/add-order-dialog";
import { EditOrderDialog } from "@/components/orders/edit-order-dialog";
import { OrdersTable } from "@/components/orders/orders-table";
import { WorkspaceSidePanel } from "@/components/orders/workspace-side-panel";
import { WorkspaceTabs } from "@/components/orders/workspace-tabs";
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
  applyOrderStatus,
  createSmartOrder,
  updateSmartOrder,
} from "@/lib/orders/engine";
import {
  deleteOrder,
  getOrders,
  refreshOrders,
} from "@/lib/orders/repository";
import { refreshProjects } from "@/lib/projects/repository";
import { refreshClients } from "@/lib/clients/repository";
import { refreshPeople } from "@/lib/people/repository";
import { refreshAssignments } from "@/lib/assignments/repository";
import { refreshFinance } from "@/lib/finance/repository";
import {
  ORDER_STATUSES,
  type Order,
  type SmartOrderInput,
} from "@/lib/orders/types";
import {
  filterOrders,
  WORKSPACE_TAB_ORDER,
} from "@/lib/orders/utils";
import {
  getSubcategories,
  getWorkspaces,
} from "@/lib/taxonomy/repository";

export function OrdersContent() {
  const router = useRouter();
  const [orders, setOrders] = useState(getOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [workspaceFilter, setWorkspaceFilter] = useState<string>("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string | null>(
    null
  );
  const [editing, setEditing] = useState<Order | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refreshClients();
      await refreshPeople();
      await refreshProjects();
      await refreshOrders();
      await refreshAssignments();
      await refreshFinance();
      if (!cancelled) setOrders(getOrders());
    })().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, []);

  const workspaces = useMemo(() => {
    const byId = new Map(getWorkspaces().map((w) => [w.id, w]));
    return WORKSPACE_TAB_ORDER.map((id) => byId.get(id)).filter(
      (w): w is NonNullable<typeof w> => Boolean(w)
    );
  }, []);

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === workspaceFilter),
    [workspaces, workspaceFilter]
  );

  const showSidePanel = Boolean(
    activeWorkspace?.hasSubcategories && workspaceFilter === "rtm"
  );

  const rtmSubcategories = useMemo(
    () => (showSidePanel ? getSubcategories("rtm") : []),
    [showSidePanel]
  );

  const filteredOrders = useMemo(
    () =>
      filterOrders(
        orders,
        search,
        statusFilter,
        workspaceFilter,
        subcategoryFilter
      ),
    [orders, search, statusFilter, workspaceFilter, subcategoryFilter]
  );

  function handleWorkspaceSelect(id: string) {
    setWorkspaceFilter(id);
    setSubcategoryFilter(null);
  }

  async function handleAddOrder(input: SmartOrderInput) {
    await createSmartOrder(input);
    setOrders(getOrders());
    router.refresh();
  }

  async function handleSaveOrder(id: string, patch: Partial<SmartOrderInput>) {
    const existing = getOrders().find((o) => o.id === id);
    if (
      patch.status &&
      existing &&
      patch.status !== existing.status &&
      (patch.status === "Confirmed" ||
        patch.status === "Completed" ||
        patch.status === "Delivered" ||
        patch.status === "Cancelled")
    ) {
      const { status, ...rest } = patch;
      if (Object.keys(rest).length > 0) {
        await updateSmartOrder(id, rest);
      }
      await applyOrderStatus(id, status);
    } else {
      await updateSmartOrder(id, patch);
    }
    setOrders(getOrders());
    router.refresh();
  }

  async function handleDeleteOrder(order: Order) {
    if (
      !window.confirm(
        `Delete order for “${order.clientName}”? This cannot be undone.`
      )
    ) {
      return;
    }
    await deleteOrder(order.id);
    setOrders(getOrders());
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <WorkspaceTabs
        workspaces={workspaces}
        activeId={workspaceFilter}
        onSelect={handleWorkspaceSelect}
      />

      <div className={showSidePanel ? "flex flex-col gap-4 sm:flex-row" : undefined}>
        {showSidePanel && (
          <Card className="h-fit sm:w-52">
            <CardContent className="p-3">
              <WorkspaceSidePanel
                title="RTM"
                subcategories={rtmSubcategories}
                activeId={subcategoryFilter}
                onSelect={setSubcategoryFilter}
              />
            </CardContent>
          </Card>
        )}

        <div className="min-w-0 flex-1 space-y-4">
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

                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    if (value) setStatusFilter(value);
                  }}
                >
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
              <OrdersTable
                orders={filteredOrders}
                onEdit={setEditing}
                onDelete={handleDeleteOrder}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <EditOrderDialog
        order={editing}
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSave={handleSaveOrder}
      />
    </div>
  );
}
