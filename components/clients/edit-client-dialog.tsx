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
import { UI_ACTIONS } from "@/lib/brand/ui-actions";
import {
  CLIENT_SEGMENTS,
  CLIENT_TYPES,
  type Client,
  type ClientSegment,
  type ClientType,
  type NewClientInput,
} from "@/lib/clients/types";
import { formatClientType } from "@/lib/clients/utils";

interface EditClientDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    id: string,
    patch: Partial<NewClientInput> & { isActive?: boolean }
  ) => void | Promise<void>;
}

function EditClientForm({
  client,
  onOpenChange,
  onSave,
}: {
  client: Client;
  onOpenChange: (open: boolean) => void;
  onSave: EditClientDialogProps["onSave"];
}) {
  const [form, setForm] = useState<NewClientInput>({
    type: client.type,
    segment: client.segment,
    name: client.name,
    phone: client.phone,
    email: client.email ?? "",
    contactPerson: client.contactPerson ?? "",
    company: client.company ?? "",
    notes: client.notes ?? "",
  });
  const [isActive, setIsActive] = useState(client.isActive);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [saving, setSaving] = useState(false);

  function updateField<K extends keyof NewClientInput>(
    field: K,
    value: NewClientInput[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate(): boolean {
    const next: Partial<Record<string, string>> = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.phone.trim()) next.phone = "Phone is required";
    if (form.type === "company" && !form.contactPerson?.trim()) {
      next.contactPerson = "Contact person is required";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(client.id, {
        type: form.type,
        segment: form.segment,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email?.trim() || undefined,
        contactPerson: form.contactPerson?.trim() || undefined,
        company: form.company?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
        isActive,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  const isCompany = form.type === "company";

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select
            value={form.type}
            onValueChange={(v) => updateField("type", v as ClientType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLIENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {formatClientType(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Segment</Label>
          <Select
            value={form.segment}
            onValueChange={(v) => updateField("segment", v as ClientSegment)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLIENT_SEGMENTS.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-name">{isCompany ? "Company Name" : "Name"}</Label>
        <Input
          id="edit-name"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          aria-invalid={!!errors.name}
        />
        {errors.name ? (
          <p className="text-xs text-destructive">{errors.name}</p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-phone">Phone</Label>
        <Input
          id="edit-phone"
          value={form.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          aria-invalid={!!errors.phone}
        />
        {errors.phone ? (
          <p className="text-xs text-destructive">{errors.phone}</p>
        ) : null}
      </div>
      {isCompany ? (
        <div className="space-y-1.5">
          <Label htmlFor="edit-contact">Contact Person</Label>
          <Input
            id="edit-contact"
            value={form.contactPerson ?? ""}
            onChange={(e) => updateField("contactPerson", e.target.value)}
            aria-invalid={!!errors.contactPerson}
          />
          {errors.contactPerson ? (
            <p className="text-xs text-destructive">{errors.contactPerson}</p>
          ) : null}
        </div>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="edit-email">Email</Label>
        <Input
          id="edit-email"
          type="email"
          value={form.email ?? ""}
          onChange={(e) => updateField("email", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-notes">Notes</Label>
        <Textarea
          id="edit-notes"
          value={form.notes ?? ""}
          onChange={(e) => updateField("notes", e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select
          value={isActive ? "active" : "inactive"}
          onValueChange={(v) => setIsActive(v === "active")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
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

export function EditClientDialog({
  client,
  open,
  onOpenChange,
  onSave,
}: EditClientDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>Update client details.</DialogDescription>
        </DialogHeader>
        {client ? (
          <EditClientForm
            key={client.id}
            client={client}
            onOpenChange={onOpenChange}
            onSave={onSave}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
