"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

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
  type NewOrderInput,
  type OrderStatus,
  type ProjectType,
} from "@/lib/orders/types";
import { workspaceIdFromProjectType } from "@/lib/orders/utils";
import { getSuccessMessage } from "@/lib/brand/soda-voice";

const emptyForm: NewOrderInput = {
  clientName: "",
  phone: "",
  projectType: "Wedding",
  workspaceId: workspaceIdFromProjectType("Wedding"),
  shootDate: "",
  location: "",
  deliveryDate: "",
  price: 0,
  deposit: 0,
  team: "Wedding Squad",
  status: "Pending",
  notes: "",
};

type FormFields = keyof NewOrderInput;

interface AddOrderDialogProps {
  onAdd: (order: NewOrderInput) => void;
}

export function AddOrderDialog({ onAdd }: AddOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewOrderInput>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<FormFields, string>>>({});
  const [successNote, setSuccessNote] = useState<string | null>(null);

  function updateField<K extends FormFields>(field: K, value: NewOrderInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): boolean {
    const nextErrors: Partial<Record<FormFields, string>> = {};

    if (!form.clientName.trim()) nextErrors.clientName = "Client name is required";
    if (!form.phone.trim()) nextErrors.phone = "Phone number is required";
    if (!form.projectType) nextErrors.projectType = "Project type is required";
    if (!form.shootDate) nextErrors.shootDate = "Shoot date is required";
    if (!form.location.trim()) nextErrors.location = "Location is required";
    if (!form.deliveryDate) nextErrors.deliveryDate = "Delivery date is required";
    if (!form.price || form.price <= 0) nextErrors.price = "Price must be greater than 0";
    if (form.deposit < 0) nextErrors.deposit = "Deposit cannot be negative";
    if (!form.team) nextErrors.team = "Team is required";
    if (!form.status) nextErrors.status = "Status is required";
    if (!form.notes.trim()) nextErrors.notes = "Notes are required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    onAdd(form);
    setForm(emptyForm);
    setErrors({});
    setSuccessNote(getSuccessMessage("orderCreated"));
    setOpen(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setForm(emptyForm);
      setErrors({});
    } else {
      setSuccessNote(null);
    }
  }

  return (
    <>
      {successNote ? (
        <p
          role="status"
          className="order-first w-full text-center text-xs text-emerald-500 sm:order-none sm:w-auto sm:text-right"
        >
          {successNote}
        </p>
      ) : null}
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button className="gap-1.5" />}
      >
        <Plus />
        Add Order
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add New Order</DialogTitle>
          <DialogDescription>
            Create a new photography order. All fields are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={form.clientName}
                onChange={(e) => updateField("clientName", e.target.value)}
                aria-invalid={!!errors.clientName}
                placeholder="Client name"
              />
              {errors.clientName && (
                <p className="text-xs text-destructive">{errors.clientName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                aria-invalid={!!errors.phone}
                placeholder="+20 100 000 0000"
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Project Type</Label>
              <Select
                value={form.projectType}
                onValueChange={(value) => {
                  if (!value) return;
                  const projectType = value as ProjectType;
                  setForm((prev) => ({
                    ...prev,
                    projectType,
                    workspaceId: workspaceIdFromProjectType(projectType),
                  }));
                  if (errors.projectType) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.projectType;
                      return next;
                    });
                  }
                }}
              >
                <SelectTrigger aria-invalid={!!errors.projectType}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectType && (
                <p className="text-xs text-destructive">{errors.projectType}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => {
                  if (value) updateField("status", value as OrderStatus);
                }}
              >
                <SelectTrigger aria-invalid={!!errors.status}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-xs text-destructive">{errors.status}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="shootDate">Shoot Date</Label>
              <Input
                id="shootDate"
                type="date"
                value={form.shootDate}
                onChange={(e) => updateField("shootDate", e.target.value)}
                aria-invalid={!!errors.shootDate}
              />
              {errors.shootDate && (
                <p className="text-xs text-destructive">{errors.shootDate}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deliveryDate">Delivery Date</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={form.deliveryDate}
                onChange={(e) => updateField("deliveryDate", e.target.value)}
                aria-invalid={!!errors.deliveryDate}
              />
              {errors.deliveryDate && (
                <p className="text-xs text-destructive">{errors.deliveryDate}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
              aria-invalid={!!errors.location}
              placeholder="Four Seasons Nile Plaza, Cairo"
            />
            {errors.location && (
              <p className="text-xs text-destructive">{errors.location}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price (EGP)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={form.price || ""}
                onChange={(e) =>
                  updateField("price", Number(e.target.value) || 0)
                }
                aria-invalid={!!errors.price}
                placeholder="50000"
              />
              {errors.price && (
                <p className="text-xs text-destructive">{errors.price}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deposit">Deposit (EGP)</Label>
              <Input
                id="deposit"
                type="number"
                min={0}
                value={form.deposit || ""}
                onChange={(e) =>
                  updateField("deposit", Number(e.target.value) || 0)
                }
                aria-invalid={!!errors.deposit}
                placeholder="15000"
              />
              {errors.deposit && (
                <p className="text-xs text-destructive">{errors.deposit}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Team</Label>
              <Select
                value={form.team}
                onValueChange={(value) => {
                  if (value) updateField("team", value);
                }}
              >
                <SelectTrigger aria-invalid={!!errors.team}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAMS.map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.team && (
                <p className="text-xs text-destructive">{errors.team}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              aria-invalid={!!errors.notes}
              placeholder="Special requirements, deliverables, etc."
              rows={3}
            />
            {errors.notes && (
              <p className="text-xs text-destructive">{errors.notes}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Order</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
