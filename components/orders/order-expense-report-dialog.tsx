"use client";

import { useState } from "react";
import { Receipt } from "lucide-react";

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
  createExpense,
  ORDER_EXPENSE_REPORT_KINDS,
  type OrderExpenseReportKind,
} from "@/lib/finance/expenses";
import { formatPrice } from "@/lib/orders/utils";

type LineState = Record<OrderExpenseReportKind, number>;

function emptyLines(): LineState {
  return {
    transportation: 0,
    rental: 0,
    freelancer: 0,
    parking: 0,
    food: 0,
    misc: 0,
  };
}

interface OrderExpenseReportDialogProps {
  orderId: string;
  orderLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: () => void;
  /** Show a trigger button when uncontrolled */
  showTrigger?: boolean;
}

export function OrderExpenseReportDialog({
  orderId,
  orderLabel,
  open: controlledOpen,
  onOpenChange,
  onSaved,
  showTrigger = true,
}: OrderExpenseReportDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [lines, setLines] = useState<LineState>(emptyLines);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = ORDER_EXPENSE_REPORT_KINDS.reduce(
    (acc, k) => acc + (Number(lines[k]) || 0),
    0
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const positive = ORDER_EXPENSE_REPORT_KINDS.filter(
      (k) => (Number(lines[k]) || 0) > 0
    );
    if (positive.length === 0) {
      setError("Enter at least one expense amount");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      for (const kind of positive) {
        await createExpense({
          category: kind,
          amount: lines[kind],
          orderId,
          notes: `Post-shoot expense report · ${kind}`,
        });
      }
      setLines(emptyLines());
      setOpen(false);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save expenses");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger ? (
        <DialogTrigger
          render={
            <Button type="button" variant="outline" size="sm" className="gap-1.5" />
          }
        >
          <Receipt className="size-3.5" />
          Expense Report
        </DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Expense Report</DialogTitle>
          <DialogDescription>
            Log actual shoot costs for {orderLabel ?? orderId}. Linked to this
            order — required before profit can be calculated.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-3">
          {ORDER_EXPENSE_REPORT_KINDS.map((kind) => (
            <div
              key={kind}
              className="grid grid-cols-[1fr_7rem] items-center gap-2"
            >
              <Label className="capitalize">{kind}</Label>
              <Input
                type="number"
                min={0}
                value={lines[kind] || ""}
                onChange={(e) =>
                  setLines((prev) => ({
                    ...prev,
                    [kind]: Number(e.target.value) || 0,
                  }))
                }
                placeholder="0"
              />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Total: {formatPrice(total)}
          </p>
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
              {saving ? "Saving…" : "Save expenses"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
