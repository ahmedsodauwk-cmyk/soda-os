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
import { createInvoice } from "@/lib/invoices/repository";
import type { ProjectOrderStub } from "@/lib/projects/types";

interface CreateInvoiceDialogProps {
  projectId: string;
  clientId: string;
  orders: ProjectOrderStub[];
}

export function CreateInvoiceDialog({
  projectId,
  clientId,
  orders,
}: CreateInvoiceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [orderId, setOrderId] = useState(() => orders[0]?.id ?? "");
  const [number, setNumber] = useState(
    () => `INV-${Date.now().toString(36).toUpperCase()}`
  );
  const [amount, setAmount] = useState(() =>
    orders[0] ? String(orders[0].price) : ""
  );
  const [issueDate, setIssueDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!number.trim() || !issueDate || !dueDate || !value || value <= 0) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const periodMonth = issueDate.slice(0, 7);
      await createInvoice({
        clientId,
        projectId,
        ...(orderId ? { orderId } : {}),
        number: number.trim(),
        issueDate,
        dueDate,
        amount: value,
        paidAmount: 0,
        status: "sent",
        periodMonth,
        notes: notes.trim() || undefined,
      });
      await advanceProjectJourney(projectId, "Invoice");
      setOpen(false);
      setNotes("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invoice");
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
        {UI_ACTIONS.createInvoice}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{UI_ACTIONS.createInvoice}</DialogTitle>
            <DialogDescription>
              Issue an invoice for this project / order.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {orders.length > 0 ? (
              <div className="space-y-1.5">
                <Label>Order</Label>
                <Select
                  value={orderId}
                  onValueChange={(v) => {
                    if (!v) return;
                    setOrderId(v);
                    const o = orders.find((x) => x.id === v);
                    if (o) setAmount(String(o.price));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select order" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.id} · {o.price.toLocaleString("en-EG")} EGP
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="inv-number">Invoice number</Label>
              <Input
                id="inv-number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-amount">Amount (EGP)</Label>
              <Input
                id="inv-amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="inv-issue">Issue date</Label>
                <Input
                  id="inv-issue"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inv-due">Due date</Label>
                <Input
                  id="inv-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-notes">Notes</Label>
              <Textarea
                id="inv-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={
                saving || !number.trim() || !amount || !issueDate || !dueDate
              }
            >
              {saving ? UI_ACTIONS.saving : UI_ACTIONS.createInvoice}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
