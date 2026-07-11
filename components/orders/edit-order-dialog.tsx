"use client";

import { useState } from "react";

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
import {
  ORDER_STATUSES,
  PROJECT_TYPES,
  TEAMS,
  type Order,
  type OrderStatus,
  type ProjectType,
} from "@/lib/orders/types";
import { workspaceIdFromProjectType } from "@/lib/orders/utils";

type OrderPatch = Partial<Omit<Order, "id" | "projectId" | "clientId">>;

interface EditOrderDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, patch: OrderPatch) => void | Promise<void>;
}

function EditOrderForm({
  order,
  onOpenChange,
  onSave,
}: {
  order: Order;
  onOpenChange: (open: boolean) => void;
  onSave: EditOrderDialogProps["onSave"];
}) {
  const [form, setForm] = useState<OrderPatch>({
    clientName: order.clientName,
    phone: order.phone,
    projectType: order.projectType,
    workspaceId: order.workspaceId,
    shootDate: order.shootDate,
    location: order.location,
    deliveryDate: order.deliveryDate,
    price: order.price,
    deposit: order.deposit,
    team: order.team,
    status: order.status,
    notes: order.notes,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  function updateField<K extends keyof OrderPatch>(
    field: K,
    value: OrderPatch[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate(): boolean {
    const next: Partial<Record<string, string>> = {};
    if (!form.clientName?.trim()) next.clientName = "Required";
    if (!form.phone?.trim()) next.phone = "Required";
    if (!form.shootDate) next.shootDate = "Required";
    if (!form.location?.trim()) next.location = "Required";
    if (!form.deliveryDate) next.deliveryDate = "Required";
    if (!form.price || form.price <= 0) next.price = "Must be > 0";
    if (!form.notes?.trim()) next.notes = "Required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(order.id, {
        ...form,
        clientName: form.clientName!.trim(),
        phone: form.phone!.trim(),
        location: form.location!.trim(),
        notes: form.notes!.trim(),
        workspaceId: workspaceIdFromProjectType(
          form.projectType as ProjectType
        ),
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Client Name</Label>
          <Input
            value={form.clientName ?? ""}
            onChange={(e) => updateField("clientName", e.target.value)}
            aria-invalid={!!errors.clientName}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input
            value={form.phone ?? ""}
            onChange={(e) => updateField("phone", e.target.value)}
            aria-invalid={!!errors.phone}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Project Type</Label>
          <Select
            value={form.projectType}
            onValueChange={(v) => {
              if (!v) return;
              const projectType = v as ProjectType;
              setForm((prev) => ({
                ...prev,
                projectType,
                workspaceId: workspaceIdFromProjectType(projectType),
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => {
              if (v) updateField("status", v as OrderStatus);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Shoot Date</Label>
          <Input
            type="date"
            value={form.shootDate ?? ""}
            onChange={(e) => updateField("shootDate", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Delivery Date</Label>
          <Input
            type="date"
            value={form.deliveryDate ?? ""}
            onChange={(e) => updateField("deliveryDate", e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Location</Label>
        <Input
          value={form.location ?? ""}
          onChange={(e) => updateField("location", e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Price</Label>
          <Input
            type="number"
            min={0}
            value={form.price ?? ""}
            onChange={(e) => updateField("price", Number(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Deposit</Label>
          <Input
            type="number"
            min={0}
            value={form.deposit ?? ""}
            onChange={(e) =>
              updateField("deposit", Number(e.target.value) || 0)
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label>Team</Label>
          <Select
            value={form.team}
            onValueChange={(v) => {
              if (v) updateField("team", v);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEAMS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea
          value={form.notes ?? ""}
          onChange={(e) => updateField("notes", e.target.value)}
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function EditOrderDialog({
  order,
  open,
  onOpenChange,
  onSave,
}: EditOrderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Order</DialogTitle>
          <DialogDescription>Update order details.</DialogDescription>
        </DialogHeader>
        {order ? (
          <EditOrderForm
            key={order.id}
            order={order}
            onOpenChange={onOpenChange}
            onSave={onSave}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
