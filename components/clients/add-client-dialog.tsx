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
  CLIENT_TYPES,
  type ClientType,
  type NewClientInput,
} from "@/lib/clients/types";
import { formatClientType } from "@/lib/clients/utils";
import { getSuccessMessage } from "@/lib/brand/soda-voice";
import { UI_ACTIONS } from "@/lib/brand/ui-actions";

const emptyForm: NewClientInput = {
  type: "individual",
  segment: "wedding",
  name: "",
  phone: "",
  email: "",
  contactPerson: "",
  company: "",
  notes: "",
};

type FormFields = keyof NewClientInput;

interface AddClientDialogProps {
  onAdd: (client: NewClientInput) => void | Promise<void>;
  /** Prefill type (wedding → individual, commercial → company). */
  defaultType?: ClientType;
  defaultSegment?: NewClientInput["segment"];
  triggerLabel?: string;
}

function buildEmptyForm(
  defaultType?: ClientType,
  defaultSegment?: NewClientInput["segment"]
): NewClientInput {
  const type = defaultType ?? "individual";
  return {
    ...emptyForm,
    type,
    segment:
      defaultSegment ?? (type === "company" ? "commercial" : "wedding"),
  };
}

export function AddClientDialog({
  onAdd,
  defaultType,
  defaultSegment,
  triggerLabel = UI_ACTIONS.createClient,
}: AddClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewClientInput>(() =>
    buildEmptyForm(defaultType, defaultSegment)
  );
  const [errors, setErrors] = useState<Partial<Record<FormFields, string>>>({});
  const [successNote, setSuccessNote] = useState<string | null>(null);

  function updateField<K extends FormFields>(
    field: K,
    value: NewClientInput[K]
  ) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "type") {
        if (value === "individual") {
          next.contactPerson = "";
          next.company = "";
        }
      }

      return next;
    });

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

    if (!form.type) nextErrors.type = "Client type is required";
    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!form.phone.trim()) nextErrors.phone = "Phone number is required";

    if (form.type === "company" && !form.contactPerson?.trim()) {
      nextErrors.contactPerson = "Contact person is required for companies";
    }

    if (form.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Enter a valid email address";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function buildClientInput(): NewClientInput {
    const trimmedEmail = form.email?.trim();
    const trimmedNotes = form.notes?.trim();
    const segment =
      form.segment ||
      (form.type === "company" ? "commercial" : "wedding");

    if (form.type === "company") {
      return {
        type: "company",
        segment,
        name: form.name.trim(),
        phone: form.phone.trim(),
        contactPerson: form.contactPerson?.trim(),
        company: form.company?.trim() || form.name.trim(),
        ...(trimmedEmail ? { email: trimmedEmail } : {}),
        ...(trimmedNotes ? { notes: trimmedNotes } : {}),
      };
    }

    return {
      type: "individual",
      segment,
      name: form.name.trim(),
      phone: form.phone.trim(),
      ...(trimmedEmail ? { email: trimmedEmail } : {}),
      ...(trimmedNotes ? { notes: trimmedNotes } : {}),
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    await onAdd(buildClientInput());
    setForm(buildEmptyForm(defaultType, defaultSegment));
    setErrors({});
    setSuccessNote(getSuccessMessage("clientCreated"));
    setOpen(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setForm(buildEmptyForm(defaultType, defaultSegment));
      setErrors({});
    } else {
      setSuccessNote(null);
    }
  }

  const isCompany = form.type === "company";

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
      <DialogTrigger render={<Button className="cursor-pointer gap-1.5" />}>
        {triggerLabel}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>
            Create a new individual or company client. Name and phone are
            required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Client Type</Label>
              <Select
                value={form.type}
                onValueChange={(value) =>
                  updateField("type", value as ClientType)
                }
              >
                <SelectTrigger aria-invalid={!!errors.type}>
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
              {errors.type && (
                <p className="text-xs text-destructive">{errors.type}</p>
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

          <div className="space-y-1.5">
            <Label htmlFor="name">
              {isCompany ? "Company Name" : "Full Name"}
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              aria-invalid={!!errors.name}
              placeholder={isCompany ? "Company name" : "Client name"}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          {isCompany && (
            <div className="space-y-1.5">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                value={form.contactPerson ?? ""}
                onChange={(e) => updateField("contactPerson", e.target.value)}
                aria-invalid={!!errors.contactPerson}
                placeholder="Hassan Nabil"
              />
              {errors.contactPerson && (
                <p className="text-xs text-destructive">
                  {errors.contactPerson}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              value={form.email ?? ""}
              onChange={(e) => updateField("email", e.target.value)}
              aria-invalid={!!errors.email}
              placeholder="client@email.com"
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={form.notes ?? ""}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Preferences, referrals, special requirements..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {UI_ACTIONS.cancel}
            </Button>
            <Button type="submit">{UI_ACTIONS.create}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
