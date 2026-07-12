"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  createEquipment,
  deleteEquipment,
  getEquipment,
  refreshEquipment,
  updateEquipment,
  type NewEquipmentInput,
} from "@/lib/equipment/repository";
import {
  EQUIPMENT_STATUSES,
  EQUIPMENT_TYPES,
  type EquipmentItem,
  type EquipmentStatus,
  type EquipmentType,
} from "@/lib/equipment/types";

function EquipmentFormDialog({
  item,
  open,
  onOpenChange,
  onSave,
  mode,
}: {
  item?: EquipmentItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    input: NewEquipmentInput & { status?: EquipmentStatus }
  ) => Promise<void>;
  mode: "create" | "edit";
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open ? (
          <EquipmentFormFields
            key={item?.id ?? "new"}
            item={item}
            mode={mode}
            onOpenChange={onOpenChange}
            onSave={onSave}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EquipmentFormFields({
  item,
  mode,
  onOpenChange,
  onSave,
}: {
  item?: EquipmentItem | null;
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  onSave: (
    input: NewEquipmentInput & { status?: EquipmentStatus }
  ) => Promise<void>;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [type, setType] = useState<EquipmentType>(item?.type ?? "Camera");
  const [serialNumber, setSerialNumber] = useState(item?.serialNumber ?? "");
  const [status, setStatus] = useState<EquipmentStatus>(
    item?.status ?? "available"
  );
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [acquiredAt, setAcquiredAt] = useState(
    item?.acquiredAt ?? new Date().toISOString().slice(0, 10)
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        type,
        serialNumber: serialNumber.trim() || undefined,
        status,
        notes: notes.trim() || undefined,
        acquiredAt,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>
          {mode === "edit" ? "Edit Equipment" : "New Equipment"}
        </DialogTitle>
        <DialogDescription>
          Inventory item for cameras, lenses, and kit.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 py-4">
        <div className="space-y-1.5">
          <Label htmlFor="eq-name">Name</Label>
          <Input
            id="eq-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(v) => v && setType(v as EquipmentType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_TYPES.map((t) => (
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
              value={status}
              onValueChange={(v) => v && setStatus(v as EquipmentStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="eq-serial">Serial</Label>
            <Input
              id="eq-serial"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="eq-acquired">Acquired</Label>
            <Input
              id="eq-acquired"
              type="date"
              value={acquiredAt}
              onChange={(e) => setAcquiredAt(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="eq-notes">Notes</Label>
          <Textarea
            id="eq-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={saving}>
          {saving
            ? UI_ACTIONS.saving
            : mode === "edit"
              ? UI_ACTIONS.save
              : UI_ACTIONS.create}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function EquipmentInventoryContent() {
  const router = useRouter();
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    void refreshEquipment()
      .then(() => {
        if (!cancelled) setItems(getEquipment());
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      [i.name, i.type, i.serialNumber ?? "", i.status, i.notes ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [items, search]);

  async function handleCreate(input: NewEquipmentInput) {
    await createEquipment(input);
    setItems(getEquipment());
    router.refresh();
  }

  async function handleUpdate(
    input: NewEquipmentInput & { status?: EquipmentStatus }
  ) {
    if (!editing) return;
    await updateEquipment(editing.id, input);
    setItems(getEquipment());
    setEditing(null);
    router.refresh();
  }

  async function handleDelete(item: EquipmentItem) {
    if (!window.confirm(`Delete “${item.name}”?`)) return;
    await deleteEquipment(item.id);
    setItems(getEquipment());
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search equipment…"
              className="h-8 pl-8"
            />
          </div>
          <Button className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            + New
          </Button>
        </CardContent>
      </Card>

      <ul className="space-y-2">
        {filtered.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 px-3.5 py-3"
          >
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.type}
                {item.serialNumber ? ` · ${item.serialNumber}` : ""}
                {item.notes ? ` · ${item.notes}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {item.status}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                onClick={() => setEditing(item)}
              >
                {UI_ACTIONS.edit}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7 text-destructive"
                onClick={() => void handleDelete(item)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No equipment yet.</p>
      ) : null}

      <EquipmentFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={handleCreate}
      />
      <EquipmentFormDialog
        mode="edit"
        item={editing}
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSave={handleUpdate}
      />
    </div>
  );
}
