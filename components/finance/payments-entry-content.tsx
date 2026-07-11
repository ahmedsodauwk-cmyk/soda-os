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
import { getOrders, refreshOrders } from "@/lib/orders/repository";
import type { Order } from "@/lib/orders/types";
import {
  createPayment,
  deletePayment,
  getPayments,
  refreshPayments,
  updatePayment,
} from "@/lib/payments/repository";
import type { Payment, PaymentKind, PaymentStatus } from "@/lib/payments/types";
import type { PaymentMethod } from "@/lib/wallets/types";

const KINDS: PaymentKind[] = ["deposit", "installment", "final", "refund"];
const STATUSES: PaymentStatus[] = ["pending", "paid", "failed", "waived"];
const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "instapay", label: "Instapay" },
  { value: "vodafone_cash", label: "Vodafone Cash" },
];

function egp(n: number) {
  return `${n.toLocaleString("en-EG")} EGP`;
}

function RecordPaymentDialog({
  orders,
  onRecorded,
}: {
  orders: Order[];
  onRecorded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<PaymentKind>("installment");
  const [status, setStatus] = useState<PaymentStatus>("paid");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [reference, setReference] = useState("");
  const [receiver, setReceiver] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const order = orders.find((o) => o.id === orderId);
    const value = Number(amount);
    if (!order || !value || value <= 0) return;
    setSaving(true);
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
      onRecorded();
      setOrderId("");
      setAmount("");
      setNote("");
      setReference("");
      setReceiver("");
      setMethod("cash");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-1.5" />}>
        <Plus className="size-4" />
        + New Payment
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment against an order. Paid amounts update the finance
              ledger.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <div className="space-y-1.5">
              <Label>Order</Label>
              <Select value={orderId} onValueChange={(v) => v && setOrderId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select order" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.clientName} · {o.projectType} · {o.shootDate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="pay-amount">Amount (EGP)</Label>
                <Input
                  id="pay-amount"
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
                  onValueChange={(v) => v && setStatus(v as PaymentStatus)}
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
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Method</Label>
                <Select
                  value={method}
                  onValueChange={(v) => v && setMethod(v as PaymentMethod)}
                >
                  <SelectTrigger>
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
              <div className="space-y-1.5">
                <Label htmlFor="pay-ref">Reference</Label>
                <Input
                  id="pay-ref"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Transfer / receipt #"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pay-receiver">Receiver</Label>
                <Input
                  id="pay-receiver"
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  placeholder="Who received"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay-note">Note</Label>
              <Textarea
                id="pay-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving || !orderId}>
              {saving ? "Saving…" : "Record payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PaymentsEntryContent() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refreshOrders();
      await refreshPayments();
      if (!cancelled) {
        setOrders(getOrders());
        setPayments(getPayments());
      }
    })().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p) =>
      [p.id, p.orderId, p.clientId, p.kind, p.status, p.label ?? "", p.note ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [payments, search]);

  function reload() {
    setPayments(getPayments());
    router.refresh();
  }

  async function handleStatus(id: string, status: PaymentStatus) {
    const patch: Partial<Payment> = { status };
    if (status === "paid") {
      patch.paidAt = new Date().toISOString().slice(0, 10);
    }
    await updatePayment(id, patch);
    reload();
  }

  async function handleDelete(payment: Payment) {
    if (
      !window.confirm(
        "Void this payment? Financial records are never deleted — this marks it voided."
      )
    ) {
      return;
    }
    await deletePayment(payment.id);
    reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payments…"
            className="pl-9"
          />
        </div>
        <RecordPaymentDialog orders={orders} onRecorded={reload} />
      </div>

      <Card>
        <CardContent className="space-y-2 p-4">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No payments recorded yet.
            </p>
          ) : (
            filtered.map((p) => {
              const order = orders.find((o) => o.id === p.orderId);
              return (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 px-3.5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {p.label ?? p.kind}
                      {order ? (
                        <span className="ms-2 font-normal text-muted-foreground">
                          · {order.clientName}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.kind} · order {p.orderId.slice(0, 12)}…
                      {p.paidAt ? ` · paid ${p.paidAt}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm">{egp(p.amount)}</span>
                    <Select
                      value={p.status}
                      onValueChange={(v) => {
                        if (v) void handleStatus(p.id, v as PaymentStatus);
                      }}
                    >
                      <SelectTrigger className="h-7 w-28">
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
                    <Badge variant="outline">{p.kind}</Badge>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="size-7 text-destructive"
                      onClick={() => void handleDelete(p)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
