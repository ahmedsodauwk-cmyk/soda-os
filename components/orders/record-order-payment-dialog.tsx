"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { emitOrderClientPayment } from "@/lib/integration";
import type { Order } from "@/lib/orders/types";
import { createPayment } from "@/lib/payments/repository";
import type { PaymentKind, PaymentStatus } from "@/lib/payments/types";
import type { PaymentMethod } from "@/lib/wallets/types";

const KINDS: PaymentKind[] = ["deposit", "installment", "final", "refund"];
const STATUSES: PaymentStatus[] = ["pending", "paid", "failed", "waived"];
const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "instapay", label: "Instapay" },
  { value: "vodafone_cash", label: "Vodafone Cash" },
];

interface RecordOrderPaymentDialogProps {
  order: Order;
  /** Prefill amount (e.g. outstanding) */
  defaultAmount?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  triggerLabel?: string;
  onRecorded?: () => void;
}

/**
 * Order-scoped payment recording — reuses createPayment + emitOrderClientPayment.
 */
export function RecordOrderPaymentDialog({
  order,
  defaultAmount,
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
  triggerLabel = "Collect payment",
  onRecorded,
}: RecordOrderPaymentDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [amount, setAmount] = useState(
    defaultAmount && defaultAmount > 0 ? String(defaultAmount) : ""
  );
  const [kind, setKind] = useState<PaymentKind>("installment");
  const [status, setStatus] = useState<PaymentStatus>("paid");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [reference, setReference] = useState("");
  const [receiver, setReceiver] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) return;
    setSaving(true);
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const payment = await createPayment({
        orderId: order.id,
        projectId: order.projectId,
        clientId: order.clientId ?? "",
        workspaceId: order.workspaceId,
        amount: value,
        currency: "EGP",
        kind,
        status,
        paidAt: status === "paid" ? today : undefined,
        note: note.trim() || undefined,
        label: `${kind} — ${order.clientName}`,
        method,
        reference: reference.trim() || undefined,
        receiver: receiver.trim() || undefined,
      });
      if (status === "paid" && kind !== "refund") {
        await emitOrderClientPayment({
          orderId: order.id,
          amount: value,
          paymentId: payment.id,
          notes: note.trim() || `Payment on order ${order.id}`,
        });
      }
      setAmount("");
      setNote("");
      setReference("");
      setReceiver("");
      setMethod("cash");
      setOpen(false);
      onRecorded?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger ? (
        <DialogTrigger
          render={
            <Button type="button" size="sm" className="gap-1.5" />
          }
        >
          <Wallet className="size-3.5" />
          {triggerLabel}
        </DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Collect payment</DialogTitle>
          <DialogDescription>
            Record money in for {order.clientName} · {order.id}. Method is
            required for wallet truth.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="ord-pay-amount">Amount (EGP)</Label>
            <Input
              id="ord-pay-amount"
              type="number"
              min={1}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1.5">
              <Label>Kind</Label>
              <Select
                value={kind}
                onValueChange={(v) => setKind(v as PaymentKind)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KINDS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as PaymentStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Method</Label>
            <Select
              value={method}
              onValueChange={(v) => setMethod(v as PaymentMethod)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1.5">
              <Label htmlFor="ord-pay-ref">Reference</Label>
              <Input
                id="ord-pay-ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ord-pay-recv">Receiver</Label>
              <Input
                id="ord-pay-recv"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ord-pay-note">Note</Label>
            <Textarea
              id="ord-pay-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Record payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
