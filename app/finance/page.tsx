import { AppShell } from "@/components/layout/app-shell";
import { FinancialOpsPanel } from "@/components/finance/financial-ops-panel";
import { PaymentsEntryContent } from "@/components/finance/payments-entry-content";
import { Badge } from "@/components/ui/badge";
import { getEmptyState, getModuleSlogan } from "@/lib/brand";
import { bootstrapBusinessCore } from "@/lib/core/bootstrap";
import { getFinancialReportSnapshot } from "@/lib/core/rules/aggregators";
import {
  getCompanyCashflow,
  getCompanyWallet,
  getFinanceSummary,
  listExpenses,
  listFinancialEvents,
  listPeriodClosings,
  listTransfers,
  refreshExpenses,
  refreshFinance,
  refreshPeriodClosings,
  refreshTransfers,
} from "@/lib/finance";
import { refreshOrders } from "@/lib/orders/repository";
import { refreshPayments } from "@/lib/payments/repository";
import {
  ensureDefaultCashAccounts,
  listAccountViews,
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
    refreshExpenses(),
    refreshTransfers(),
    refreshPeriodClosings(),
  ]);
  await ensureDefaultCashAccounts();

  const wallet = getCompanyWallet();
  const summary = getFinanceSummary();
  const report = getFinancialReportSnapshot();
  const cashflow = getCompanyCashflow();
  const accounts = listAccountViews();
  const events = listFinancialEvents().slice(0, 40);
  const expenses = listExpenses().slice(0, 10);
  const transfers = listTransfers().slice(0, 10);
  const closings = listPeriodClosings().slice(0, 5);

  return (
    <AppShell title="Finance" subtitle={getModuleSlogan("finance")}>
      <div className="space-y-6">
        <div className="rounded-xl border border-border/60 bg-muted/10 px-6 py-8">
          <p className="font-heading text-base font-semibold tracking-tight">
            Company wallet
          </p>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Live rollup from the Financial Core. Balances are derived from
            transactions — never edited directly.
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
          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {accounts.map((a) => (
              <div key={a.id}>
                <dt className="text-xs text-muted-foreground">{a.name}</dt>
                <dd className="font-mono text-sm tabular-nums">
                  {egp(a.currentBalance)}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/10 px-6 py-6">
          <p className="font-heading text-base font-semibold tracking-tight">
            Company cashflow
          </p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Today net</dt>
              <dd className="font-mono text-sm tabular-nums">
                {egp(cashflow.today.net)}
              </dd>
              <p className="mt-1 text-[11px] text-muted-foreground">
                in {egp(cashflow.today.income)} · out{" "}
                {egp(cashflow.today.expense)}
              </p>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                Month net ({cashflow.month.key})
              </dt>
              <dd className="font-mono text-sm tabular-nums">
                {egp(cashflow.netProfitMonth)}
              </dd>
              <p className="mt-1 text-[11px] text-muted-foreground">
                in {egp(cashflow.month.income)} · out{" "}
                {egp(cashflow.month.expense)}
              </p>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                Year net ({cashflow.year.key})
              </dt>
              <dd className="font-mono text-sm tabular-nums">
                {egp(cashflow.netProfitYear)}
              </dd>
              <p className="mt-1 text-[11px] text-muted-foreground">
                in {egp(cashflow.year.income)} · out{" "}
                {egp(cashflow.year.expense)}
              </p>
            </div>
          </dl>
        </div>

        <section className="space-y-3">
          <h2 className="font-heading text-base font-semibold">
            Financial operations
          </h2>
          <FinancialOpsPanel
            monthKey={report.monthKey}
            yearKey={report.yearKey}
          />
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-base font-semibold">Payments</h2>
          <PaymentsEntryContent />
        </section>

        {expenses.length > 0 ? (
          <section className="space-y-3">
            <h2 className="font-heading text-base font-semibold">
              Recent expenses
            </h2>
            <ul className="space-y-2">
              {expenses.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 px-3.5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {e.category}
                      {e.vendor ? ` · ${e.vendor}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {e.accountCode} · {e.expenseDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{e.status}</Badge>
                    <span className="font-mono text-sm tabular-nums">
                      {egp(e.amount)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {transfers.length > 0 ? (
          <section className="space-y-3">
            <h2 className="font-heading text-base font-semibold">
              Recent transfers
            </h2>
            <ul className="space-y-2">
              {transfers.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 px-3.5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {t.fromAccountCode} → {t.toAccountCode}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.occurredAt.slice(0, 10)}
                    </p>
                  </div>
                  <span className="font-mono text-sm tabular-nums">
                    {egp(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {closings.length > 0 ? (
          <section className="space-y-3">
            <h2 className="font-heading text-base font-semibold">
              Period closings
            </h2>
            <ul className="space-y-2">
              {closings.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 px-3.5 py-3"
                >
                  <p className="text-sm font-medium">
                    {c.periodType} {c.periodKey}
                  </p>
                  <Badge variant="outline">{c.status}</Badge>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

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
                Events appear when payments, expenses, transfers, or crew pay
                post through the Financial Core.
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
