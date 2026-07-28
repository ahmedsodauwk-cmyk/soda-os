"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FileText } from "lucide-react";

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
import { UI_ACTIONS } from "@/lib/brand/ui-actions";
import { getClients } from "@/lib/clients/repository";
import type { ClientSegment } from "@/lib/clients/types";
import { createQuotationAction } from "@/lib/quotations/actions";
import { cn } from "@/lib/utils";

interface AddQuotationDrawerProps {
  triggerLabel?: string;
  triggerClassName?: string;
}

export function AddQuotationDrawer({
  triggerLabel = "Add Quotation",
  triggerClassName,
}: AddQuotationDrawerProps) {
  const router = useRouter();
  const clients = getClients();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [segment, setSegment] = useState<ClientSegment>("commercial");
  const [category, setCategory] = useState("");
  const [assignedSales, setAssignedSales] = useState("Junior Soda");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function applyClient(id: string) {
    setClientId(id);
    const client = clients.find((c) => c.id === id);
    if (!client) return;
    setClientName(client.name);
    setCompany(client.company ?? "");
    setContactName(client.contactPerson ?? client.name);
    setContactPhone(client.phone);
    setContactEmail(client.email ?? "");
    setSegment(client.segment);
  }

  function resetForm() {
    setClientId("");
    setClientName("");
    setCompany("");
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setSegment("commercial");
    setCategory("");
    setAssignedSales("Junior Soda");
    setNotes("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim() || !contactName.trim()) {
      setError("Client and contact are required");
      return;
    }
    setSaving(true);
    try {
      const createdResult = await createQuotationAction({
        clientId: clientId || undefined,
        clientName,
        company: company || undefined,
        contactName,
        contactPhone: contactPhone || undefined,
        contactEmail: contactEmail || undefined,
        segment,
        category: category || "General",
        assignedSales,
        notes,
      });
      if (!createdResult.ok) {
        setError(createdResult.error);
        return;
      }
      resetForm();
      setOpen(false);
      router.push(`/quotations/${createdResult.data!.id}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setError(null);
      triggerRef.current?.focus();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        ref={triggerRef}
        render={
          <Button
            size="sm"
            variant="outline"
            className={cn(
              "soda-creation-quotation h-9 gap-1.5 border-soda-pink/25 text-[15px] font-semibold",
              triggerClassName
            )}
          />
        }
      >
        <FileText className="size-4" aria-hidden />
        <span>{triggerLabel}</span>
      </DialogTrigger>

      <DialogContent className="soda-creation-drawer soda-creation-quotation flex max-h-[100dvh] flex-col overflow-y-auto p-0 sm:max-w-none">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>New Quotation</DialogTitle>
          <DialogDescription>
            Starts in New Inquiry. Add line items in the builder after creation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="soda-stagger-children grid flex-1 gap-4 overflow-y-auto px-5 py-4">
            <div className="space-y-1.5">
              <Label>Link existing client (optional)</Label>
              <Select
                value={clientId || undefined}
                onValueChange={(v) => {
                  if (v) applyClient(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client…" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.segment === "commercial" ? " · Commercial" : " · Wedding"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Client name</Label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Contact</Label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Segment</Label>
                <Select
                  value={segment}
                  onValueChange={(v) => {
                    if (v) setSegment(v as ClientSegment);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="wedding">Wedding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Product campaign"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Assigned sales</Label>
                <Input
                  value={assignedSales}
                  onChange={(e) => setAssignedSales(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <DialogFooter className="sticky bottom-0 border-t bg-card/95 px-5 py-4 backdrop-blur-sm">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {UI_ACTIONS.cancel}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? UI_ACTIONS.creating : UI_ACTIONS.createQuotation}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
