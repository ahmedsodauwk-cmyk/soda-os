import { AppShell } from "@/components/layout/app-shell";
import { PaymentsEntryContent } from "@/components/finance/payments-entry-content";
import { Badge } from "@/components/ui/badge";
import { getEmptyState, getModuleSlogan } from "@/lib/brand";
import { bootstrapBusinessCore } from "@/lib/core/bootstrap";
import { getFinancialReportSnapshot } from "@/lib/core/rules/aggregators";
import {
  getCompanyWallet,
  getFinanceSummary,
  listFinancialEvents,
  refreshFinance,
} from "@/lib/finance";
import { refreshOrders } from "@/lib/orders/repository";
import { refreshPayments } from "@/lib/payments/repository";
import {
  ensureDefaultCashAccounts,
  refreshCashAccounts,
  refreshCashMovements,
} from "@/lib/wallets/cash-accounts";
import { refreshCrewEarnings } from "@/lib/wallets/crew-wallet";

export const dynamic = "force-dynamic";

function egp(n: number) {
  return `${n.toLocaleString("en-EG")} EGP`;
}

export default async function FinancePage() {
  bootstrapBusinessCore();
  await Promise.all([
    refreshFinance(),
    refreshOrders(),
    refreshPayments(),
    refreshCashAccounts(),
    refreshCashMovements(),
    refreshCrewEarnings(),
  ]);
  await ensureDefaultCashAccounts();

  const wallet = getCompanyWallet();
  const summary = getFinanceSummary();
  const report = getFinancialReportSnapshot();
  const events = listFinancialEvents().slice(0, 40);

  return (
    <AppShell title="Finance" subtitle={getModuleSlogan("finance")}>
      <div className="space-y-6">
        <div className="rounded-xl border border-border/60 bg-muted/10 px-6 py-8">
          <p className="font-heading text-base font-semibold tracking-tight">
            Company wallet
          </p>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Live rollup from the Business Rules Engine. Method wallets update
            automatically when payments are received.
          </p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <dt className="text-xs text-muted-foreground">Balance</dt>
              <dd className="font-mono text-sm tabular-nums">
                {egp(wallet.balance)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Inflow</dt>
              <dd className="font-mono text-sm tabular-nums">
                {egp(wallet.totalInflow)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Outflow</dt>
              <dd className="font-mono text-sm tabular-nums">
                {egp(wallet.totalOutflow)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Revenue paid</dt>
              <dd className="font-mono text-sm tabular-nums">
                {egp(summary.revenuePaid)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Pending crew</dt>
              <dd className="font-mono text-sm tabular-nums">
                {egp(report.pendingCrewPayments)}
              </dd>
            </div>
          </dl>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Cash Safe</dt>
              <dd className="font-mono text-sm tabular-nums">
                {egp(report.cashSafe)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Bank</dt>
              <dd className="font-mono text-sm tabular-nums">
                {egp(report.bank)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Instapay</dt>
              <dd className="font-mono text-sm tabular-nums">
                {egp(report.instapay)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Vodafone Cash</dt>
              <dd className="font-mono text-sm tabular-nums">
                {egp(report.vodafoneCash)}
              </dd>
            </div>
          </dl>
        </div>

        <section className="space-y-3">
          <h2 className="font-heading text-base font-semibold">Payments</h2>
          <PaymentsEntryContent />
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-base font-semibold">
            Recent ledger events
          </h2>
          {events.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 px-6 py-10 text-center">
              <p className="text-sm font-medium">
                {getEmptyState("payments").title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Events appear when quotations convert, deposits land, or crew is
                paid.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {events.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 px-3.5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {e.type.replace(/_/g, " ")}
                      {e.notes ? (
                        <span className="ms-2 font-normal text-muted-foreground">
                          · {e.notes}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {e.parent.parentType}/{e.parent.parentId} ·{" "}
                      {e.occurredAt.slice(0, 10)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{e.direction}</Badge>
                    <span className="font-mono text-sm tabular-nums">
                      {egp(e.amount)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
