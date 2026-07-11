"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
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
  closeMonth,
  closeYear,
  createExpense,
  reopenPeriod,
  transferBetweenAccounts,
} from "@/lib/finance";
import type { CashAccountCode } from "@/lib/wallets/types";

const ACCOUNT_OPTIONS: { value: CashAccountCode; label: string }[] = [
  { value: "cash_safe", label: "Main Cash Safe" },
  { value: "secondary_cash_safe", label: "Secondary Cash Safe" },
  { value: "bank", label: "Bank" },
  { value: "instapay", label: "Instapay" },
  { value: "vodafone_cash", label: "Vodafone Cash" },
];

const EXPENSE_CATS = [
  "operations",
  "equipment",
  "supplier",
  "transport",
  "marketing",
  "rent",
  "utilities",
  "other",
];

export function FinancialOpsPanel({
  monthKey,
  yearKey,
}: {
  monthKey: string;
  yearKey: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Expense form
  const [expCategory, setExpCategory] = useState("operations");
  const [expVendor, setExpVendor] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expAccount, setExpAccount] = useState<CashAccountCode>("cash_safe");
  const [expNotes, setExpNotes] = useState("");

  // Transfer form
  const [fromAcct, setFromAcct] = useState<CashAccountCode>("cash_safe");
  const [toAcct, setToAcct] = useState<CashAccountCode>("bank");
  const [xferAmount, setXferAmount] = useState("");
  const [xferNotes, setXferNotes] = useState("");

  async function run(action: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      setMessage(ok);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {message ? (
        <p className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
          {message}
        </p>
      ) : null}

      <section className="space-y-3 rounded-xl border border-border/60 px-4 py-4">
        <h3 className="font-heading text-sm font-semibold">Record expense</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={expCategory}
              onValueChange={(v) => setExpCategory(v ?? "operations")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Vendor</Label>
            <Input
              value={expVendor}
              onChange={(e) => setExpVendor(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Amount (EGP)</Label>
            <Input
              type="number"
              min={0}
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Account</Label>
            <Select
              value={expAccount}
              onValueChange={(v) =>
                setExpAccount((v as CashAccountCode) || "cash_safe")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_OPTIONS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Notes</Label>
            <Textarea
              value={expNotes}
              onChange={(e) => setExpNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <Button
          disabled={busy}
          onClick={() =>
            run(
              () =>
                createExpense({
                  category: expCategory,
                  vendor: expVendor.trim() || undefined,
                  amount: Number(expAmount),
                  accountCode: expAccount,
                  notes: expNotes.trim() || undefined,
                }),
              "Expense posted"
            )
          }
        >
          Post expense
        </Button>
      </section>

      <section className="space-y-3 rounded-xl border border-border/60 px-4 py-4">
        <h3 className="font-heading text-sm font-semibold">
          Transfer between accounts
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>From</Label>
            <Select
              value={fromAcct}
              onValueChange={(v) =>
                setFromAcct((v as CashAccountCode) || "cash_safe")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_OPTIONS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>To</Label>
            <Select
              value={toAcct}
              onValueChange={(v) =>
                setToAcct((v as CashAccountCode) || "bank")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_OPTIONS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Amount (EGP)</Label>
            <Input
              type="number"
              min={0}
              value={xferAmount}
              onChange={(e) => setXferAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input
              value={xferNotes}
              onChange={(e) => setXferNotes(e.target.value)}
            />
          </div>
        </div>
        <Button
          disabled={busy}
          onClick={() =>
            run(
              () =>
                transferBetweenAccounts({
                  fromAccountCode: fromAcct,
                  toAccountCode: toAcct,
                  amount: Number(xferAmount),
                  notes: xferNotes.trim() || undefined,
                }),
              "Transfer posted"
            )
          }
        >
          Transfer
        </Button>
      </section>

      <section className="space-y-3 rounded-xl border border-border/60 px-4 py-4">
        <h3 className="font-heading text-sm font-semibold">Period closing</h3>
        <p className="text-xs text-muted-foreground">
          Closing freezes the period. Admin can reopen with a reason.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              run(() => closeMonth({ monthKey }), `Closed month ${monthKey}`)
            }
          >
            Close month ({monthKey})
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              run(() => closeYear({ yearKey }), `Closed year ${yearKey}`)
            }
          >
            Close year ({yearKey})
          </Button>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() =>
              run(
                () =>
                  reopenPeriod({
                    periodType: "month",
                    periodKey: monthKey,
                    reason: "Admin reopen from Finance UI",
                  }),
                `Reopened month ${monthKey}`
              )
            }
          >
            Reopen month
          </Button>
        </div>
      </section>
    </div>
  );
}
