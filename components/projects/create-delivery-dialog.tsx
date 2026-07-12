"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UI_ACTIONS } from "@/lib/brand/ui-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { advanceProjectJourney } from "@/lib/integration";
import { createDelivery } from "@/lib/invoices/repository";
import {
  DELIVERY_STATUSES,
  type DeliveryStatus,
} from "@/lib/invoices/types";
import type { ProjectOrderStub } from "@/lib/projects/types";

interface CreateDeliveryDialogProps {
  projectId: string;
  clientId: string;
  orders: ProjectOrderStub[];
}

export function CreateDeliveryDialog({
  projectId,
  clientId,
  orders,
}: CreateDeliveryDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [orderId, setOrderId] = useState(() => orders[0]?.id ?? "");
  const [label, setLabel] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<DeliveryStatus>("pending");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderId || !label.trim() || !dueDate) return;
    setSaving(true);
    setError(null);
    try {
      await createDelivery({
        orderId,
        projectId,
        clientId,
        label: label.trim(),
        dueDate,
        status,
        notes: notes.trim() || undefined,
        ...(status === "delivered" || status === "accepted"
          ? { deliveredAt: new Date().toISOString() }
          : {}),
      });
      await advanceProjectJourney(projectId, "Delivery");
      setOpen(false);
      setLabel("");
      setNotes("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create delivery");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5" />
        }
      >
        <Plus className="size-3.5" />
        {UI_ACTIONS.createDelivery}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{UI_ACTIONS.createDelivery}</DialogTitle>
            <DialogDescription>
              Track a deliverable against an order on this project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Create an order before adding a delivery.
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label>Order</Label>
                  <Select
                    value={orderId}
                    onValueChange={(v) => v && setOrderId(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select order" />
                    </SelectTrigger>
                    <SelectContent>
                      {orders.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.id} · {o.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="del-label">Label</Label>
                  <Input
                    id="del-label"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Final film"
                    required
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="del-due">Due date</Label>
                    <Input
                      id="del-due"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select
                      value={status}
                      onValueChange={(v) =>
                        v && setStatus(v as DeliveryStatus)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DELIVERY_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="del-notes">Notes</Label>
                  <Textarea
                    id="del-notes"
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
              disabled={
                saving ||
                orders.length === 0 ||
                !orderId ||
                !label.trim() ||
                !dueDate
              }
            >
              {saving ? UI_ACTIONS.saving : UI_ACTIONS.createDelivery}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
