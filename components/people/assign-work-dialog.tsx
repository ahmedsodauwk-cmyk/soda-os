"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UI_ACTIONS } from "@/lib/brand/ui-actions";
import { getClients, refreshClients } from "@/lib/clients/repository";
import type { Client } from "@/lib/clients/types";
import { assignCrewToOrder } from "@/lib/integration";
import {
  getOrders,
  refreshOrders,
} from "@/lib/orders/repository";
import {
  ORDER_DELIVERABLES,
  ORDER_PRIORITIES,
  type Order,
  type OrderPriority,
} from "@/lib/orders/types";
import type { Person } from "@/lib/people/types";

interface AssignWorkDialogProps {
  person: Person;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Assign Work from existing Orders (Client → Order → Deliverable → Deadline → Priority).
 * Single SoT: `order_assignments` via assignCrewToOrder.
 */
export function AssignWorkDialog({
  person,
  open,
  onOpenChange,
}: AssignWorkDialogProps) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clientId, setClientId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [deliverable, setDeliverable] = useState<string>("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<OrderPriority>("normal");
  const [role, setRole] = useState(person.jobTitle || "Crew");
  const [employeePrice, setEmployeePrice] = useState("0");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void Promise.all([refreshClients(), refreshOrders()])
      .then(() => {
        if (cancelled) return;
        setClients(getClients());
        setOrders(getOrders());
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [open]);

  const clientOrders = useMemo(() => {
    if (!clientId) return orders.filter((o) => o.status !== "Cancelled");
    return orders.filter(
      (o) => o.clientId === clientId && o.status !== "Cancelled"
    );
  }, [orders, clientId]);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === orderId),
    [orders, orderId]
  );

  useEffect(() => {
    if (!selectedOrder) return;
    setDeadline(selectedOrder.deliveryDate || "");
    setPriority(selectedOrder.priority || "normal");
    if (selectedOrder.deliverables?.length === 1) {
      setDeliverable(selectedOrder.deliverables[0]!);
    }
  }, [selectedOrder]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderId) {
      setError("Select an order.");
      return;
    }
    const price = Number(employeePrice);
    if (!Number.isFinite(price) || price < 0) {
      setError("Rate must be a valid number.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const meta = [
        deliverable ? `[deliverable] ${deliverable}` : "",
        deadline ? `[deadline] ${deadline}` : "",
        priority ? `[priority] ${priority}` : "",
        notes.trim(),
      ]
        .filter(Boolean)
        .join("\n");

      await assignCrewToOrder({
        orderId,
        personId: person.id,
        role: role.trim() || person.jobTitle || "Crew",
        employeePrice: price,
        bonus: 0,
        deduction: 0,
        notes: meta || undefined,
      });
      onOpenChange(false);
      setOrderId("");
      setClientId("");
      setNotes("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assign failed.");
    } finally {
      setSaving(false);
    }
  }

  const deliverableOptions: string[] = selectedOrder?.deliverables?.length
    ? selectedOrder.deliverables
    : [...ORDER_DELIVERABLES];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <form onSubmit={(e) => void handleSubmit(e)}>
          <DialogHeader>
            <DialogTitle>Assign Work</DialogTitle>
            <DialogDescription>
              Assign {person.displayName || person.nameEn} from an existing
              order — not a generic task. Saved to order assignments.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {clients.length === 0 && orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No clients or orders yet. Create real studio work before
                assigning crew.
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label>Client</Label>
                  <Select
                    value={clientId || "__all__"}
                    onValueChange={(v) => {
                      const next = v === "__all__" ? "" : (v ?? "");
                      setClientId(next);
                      setOrderId("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All clients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All clients</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Order</Label>
                  <Select
                    value={orderId || undefined}
                    onValueChange={(v) => v && setOrderId(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select order" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientOrders.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.id} · {o.clientName} · {o.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {clientOrders.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No orders for this filter.
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label>Deliverable</Label>
                  <Select
                    value={deliverable || undefined}
                    onValueChange={(v) => v && setDeliverable(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select deliverable" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliverableOptions.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Deadline</Label>
                    <Input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Priority</Label>
                    <Select
                      value={priority}
                      onValueChange={(v) =>
                        v && setPriority(v as OrderPriority)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Role on order</Label>
                    <Input
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Rate (EGP)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={50}
                      value={employeePrice}
                      onChange={(e) => setEmployeePrice(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </>
            )}
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={saving || !orderId}
            >
              {saving ? UI_ACTIONS.saving : "Assign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}