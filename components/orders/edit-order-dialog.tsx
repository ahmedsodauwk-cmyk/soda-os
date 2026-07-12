"use client";

import { useMemo, useState } from "react";

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
import {
  DRESS_CODES,
  ORDER_STATUSES,
  PROJECT_TYPES,
  TEAMS,
  type DressCode,
  type Order,
  type OrderStatus,
  type ProjectType,
  type SmartOrderInput,
} from "@/lib/orders/types";
import { workspaceIdFromProjectType } from "@/lib/orders/utils";
import { validateSmartOrderInput } from "@/lib/orders/validation";
import { getPeople } from "@/lib/people/repository";

type OrderPatch = Partial<SmartOrderInput>;

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
    whatsapp: order.whatsapp,
    projectType: order.projectType,
    workspaceId: order.workspaceId,
    shootDate: order.shootDate,
    location: order.location,
    deliveryDate: order.deliveryDate,
    price: order.price,
    deposit: order.deposit,
    team: order.team,
    squadMemberIds: order.squadMemberIds,
    status: order.status,
    brief: order.brief,
    dressCode: order.dressCode,
    latePenaltyEnabled: order.latePenaltyEnabled,
    latePenaltyAmount: order.latePenaltyAmount,
    latePenaltyReason: order.latePenaltyReason,
    notes: order.notes,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const people = useMemo(
    () => getPeople().filter((p) => p.status === "active"),
    []
  );

  function updateField<K extends keyof OrderPatch>(
    field: K,
    value: OrderPatch[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleSquadMember(personId: string) {
    setForm((prev) => {
      const set = new Set(prev.squadMemberIds ?? []);
      if (set.has(personId)) set.delete(personId);
      else set.add(personId);
      return { ...prev, squadMemberIds: [...set] };
    });
  }

  function validate(): boolean {
    const next = validateSmartOrderInput(
      {
        clientName: form.clientName ?? order.clientName,
        phone: form.phone ?? order.phone,
        whatsapp: form.whatsapp ?? order.whatsapp,
        projectType: (form.projectType ?? order.projectType) as ProjectType,
        workspaceId: form.workspaceId ?? order.workspaceId,
        shootDate: form.shootDate ?? order.shootDate,
        location: form.location ?? "",
        deliveryDate: form.deliveryDate ?? "",
        price: form.price ?? order.price,
        deposit: form.deposit ?? order.deposit,
        team: form.team ?? order.team,
        squadMemberIds: form.squadMemberIds ?? order.squadMemberIds,
        status: (form.status ?? order.status) as OrderStatus,
        brief: form.brief ?? "",
        dressCode: form.dressCode,
        latePenaltyEnabled: form.latePenaltyEnabled ?? false,
        latePenaltyAmount: form.latePenaltyAmount ?? 0,
        latePenaltyReason: form.latePenaltyReason ?? "",
        notes: form.notes ?? "",
        clientId: order.clientId,
        projectId: order.projectId,
      },
      { excludeOrderId: order.id }
    );
    // Phone not required on edit (managed from profile)
    delete next.phone;
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
        location: (form.location ?? "").trim(),
        notes: (form.notes ?? "").trim(),
        workspaceId: workspaceIdFromProjectType(
          form.projectType as ProjectType
        ),
      });
      onOpenChange(false);
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : "Failed to save",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {errors.form ? (
        <p className="text-xs text-destructive">{errors.form}</p>
      ) : null}
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
          <Label>Phone (managed in Client Profile)</Label>
          <Input value={form.phone ?? ""} disabled />
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
          <Label>Delivery Date (optional)</Label>
          <Input
            type="date"
            value={form.deliveryDate ?? ""}
            onChange={(e) => updateField("deliveryDate", e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Location (optional)</Label>
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
          <Label>Squad</Label>
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

      <div className="space-y-2">
        <Label>Team Members</Label>
        <div className="max-h-28 space-y-1 overflow-y-auto rounded-md border border-border/50 p-2">
          {people.map((p) => {
            const checked = (form.squadMemberIds ?? []).includes(p.id);
            return (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSquadMember(p.id)}
                />
                <span>{p.nickname || p.nameEn}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Brief</Label>
        <Textarea
          value={form.brief ?? ""}
          onChange={(e) => updateField("brief", e.target.value)}
          rows={2}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Dress Code</Label>
          <Select
            value={form.dressCode ?? ""}
            onValueChange={(v) => {
              if (!v) return;
              updateField("dressCode", v as DressCode);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              {DRESS_CODES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.latePenaltyEnabled ?? false}
              onChange={(e) =>
                updateField("latePenaltyEnabled", e.target.checked)
              }
            />
            Late Penalty
          </Label>
          {form.latePenaltyEnabled ? (
            <div className="grid gap-2">
              <Input
                type="number"
                min={0}
                value={form.latePenaltyAmount || ""}
                onChange={(e) =>
                  updateField("latePenaltyAmount", Number(e.target.value) || 0)
                }
              />
              <Input
                placeholder="Reason"
                value={form.latePenaltyReason ?? ""}
                onChange={(e) =>
                  updateField("latePenaltyReason", e.target.value)
                }
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea
          value={form.notes ?? ""}
          onChange={(e) => updateField("notes", e.target.value)}
          rows={2}
        />
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          {UI_ACTIONS.cancel}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? UI_ACTIONS.saving : UI_ACTIONS.saveChanges}
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Order</DialogTitle>
          <DialogDescription>
            Status changes sync calendar, crew, and finance automatically.
          </DialogDescription>
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
