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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  advanceProjectJourney,
  emitOrderClientPayment,
} from "@/lib/integration";
import { getOrderById, refreshOrders } from "@/lib/orders/repository";
import type { Order } from "@/lib/orders/types";
import { createPayment } from "@/lib/payments/repository";
import type { PaymentKind, PaymentStatus } from "@/lib/payments/types";
import type { ProjectOrderStub } from "@/lib/projects/types";

const KINDS: PaymentKind[] = ["deposit", "installment", "final", "refund"];
const STATUSES: PaymentStatus[] = ["pending", "paid", "failed", "waived"];

interface RecordProjectPaymentDialogProps {
  projectId: string;
  clientId: string;
  workspaceId: string;
  orders: ProjectOrderStub[];
}

export function RecordProjectPaymentDialog({
  projectId,
  clientId,
  workspaceId,
  orders,
}: RecordProjectPaymentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [orderId, setOrderId] = useState(() => orders[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<PaymentKind>("installment");
  const [status, setStatus] = useState<PaymentStatus>("paid");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!orderId || !value || value <= 0) return;
    setSaving(true);
    setError(null);
    try {
      await refreshOrders();
      const order: Order | undefined = getOrderById(orderId);
      const today = new Date().toISOString().slice(0, 10);
      const payment = await createPayment({
        orderId,
        projectId: order?.projectId ?? projectId,
        clientId: order?.clientId ?? clientId,
        workspaceId: order?.workspaceId ?? workspaceId,
        amount: value,
        currency: "EGP",
        kind,
        status,
        paidAt: status === "paid" ? today : undefined,
        note: note.trim() || undefined,
        label: `${kind} — ${order?.clientName ?? "project"}`,
      });
      if (status === "paid" && kind !== "refund") {
        await emitOrderClientPayment({
          orderId,
          amount: value,
          paymentId: payment.id,
          notes: note.trim() || `Payment on order ${orderId}`,
        });
      }
      await advanceProjectJourney(projectId, "Payment");
      setOpen(false);
      setAmount("");
      setNote("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment");
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
        Record payment
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              Register a client payment linked to this project order.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Create an order before recording a payment.
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
                          {o.id} · {o.clientName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="hub-pay-amount">Amount</Label>
                    <Input
                      id="hub-pay-amount"
                      type="number"
                      min={1}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Kind</Label>
                    <Select
                      value={kind}
                      onValueChange={(v) => v && setKind(v as PaymentKind)}
                    >
                      <SelectTrigger>
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
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select
                      value={status}
                      onValueChange={(v) =>
                        v && setStatus(v as PaymentStatus)
                      }
                    >
                      <SelectTrigger>
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
                <div className="space-y-1.5">
                  <Label htmlFor="hub-pay-note">Note</Label>
                  <Textarea
                    id="hub-pay-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
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
              disabled={saving || orders.length === 0 || !orderId || !amount}
            >
              {saving ? "Saving…" : "Record payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
