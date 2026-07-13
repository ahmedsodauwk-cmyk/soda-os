import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { getClientFinancialHistory } from "@/lib/clients/aggregators";

function egp(n: number) {
  return `${n.toLocaleString("en-EG")} EGP`;
}

interface ClientFinancialHistoryPanelProps {
  clientId: string;
}

/** Collected, outstanding, expenses, profit, invoices, payment methods. */
export function ClientFinancialHistoryPanel({
  clientId,
}: ClientFinancialHistoryPanelProps) {
  const view = getClientFinancialHistory(clientId);

  const kpis = [
    { label: "Collected", value: egp(view.collected) },
    {
      label: "Outstanding",
      value: egp(view.outstanding),
      accent: view.outstanding > 0,
    },
    { label: "Expenses", value: egp(view.expenses) },
    {
      label: "Profit",
      value:
        view.profit == null
          ? "Not enough data"
          : egp(view.profit),
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-base font-semibold">Financial History</h3>
        <p className="text-sm text-muted-foreground">
          Money with this relationship over time. Never deleted — closed work
          still rolls into this trail
          {view.obligated > 0 ? ` · Booked ${egp(view.obligated)}` : ""}.
        </p>
      </div>

      {view.payments.length === 0 &&
      view.invoices.length === 0 &&
      view.collected === 0 &&
      view.outstanding === 0 ? (
        <p className="rounded-xl border border-border/60 px-3.5 py-4 text-sm text-muted-foreground">
          No money recorded yet. Payments, invoices, and balances will appear
          here when the Founder records them — zeros are not invented activity.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="soda-cc-card rounded-xl border border-border/60 px-3.5 py-3"
            >
              <p className="text-xs font-medium text-muted-foreground">
                {kpi.label}
              </p>
              <p
                className={`mt-1 font-mono text-lg font-semibold ${
                  "accent" in kpi && kpi.accent ? "text-soda-pink" : ""
                }`}
              >
                {kpi.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <section className="space-y-2">
        <h4 className="font-heading text-sm font-semibold">Payment methods</h4>
        {view.methods.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No payment methods on record yet.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {view.methods.map((m) => (
              <li
                key={m.method}
                className="rounded-xl border border-border/60 px-3.5 py-3 text-sm"
              >
                <p className="font-medium capitalize">{m.method}</p>
                <p className="text-xs text-muted-foreground">
                  {m.count} · {egp(m.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h4 className="font-heading text-sm font-semibold">Invoices</h4>
        {view.invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invoices for this client.</p>
        ) : (
          <ul className="space-y-2">
            {view.invoices.map((inv) => (
              <li key={inv.id}>
                <Link
                  href="/finance"
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 px-3.5 py-3 transition-colors hover:border-soda-pink/35"
                >
                  <div>
                    <p className="font-medium">{inv.number}</p>
                    <p className="text-xs text-muted-foreground">
                      {inv.periodMonth} · due {inv.dueDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{inv.status}</Badge>
                    <span className="font-mono text-sm">{egp(inv.amount)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h4 className="font-heading text-sm font-semibold">Payments</h4>
        {view.payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments yet.</p>
        ) : (
          <ul className="space-y-2">
            {view.payments.map((p) => (
              <li key={p.id}>
                <Link
                  href={p.orderId ? `/orders/${p.orderId}` : "/finance"}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 px-3.5 py-3 transition-colors hover:border-soda-pink/35"
                >
                  <div>
                    <p className="font-medium">{p.label ?? p.kind}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.status}
                      {p.paidAt ? ` · ${p.paidAt}` : ""}
                      {p.method ? ` · ${p.method}` : ""}
                    </p>
                  </div>
                  <Badge variant="outline">{egp(p.amount)}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {view.expenseLines.length > 0 ? (
        <section className="space-y-2">
          <h4 className="font-heading text-sm font-semibold">Linked expenses</h4>
          <ul className="space-y-2">
            {view.expenseLines.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 px-3.5 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{e.category}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.expenseDate}
                    {e.orderId ? ` · ${e.orderId}` : ""}
                    {e.vendor ? ` · ${e.vendor}` : ""}
                  </p>
                </div>
                <span className="font-mono">{egp(e.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
