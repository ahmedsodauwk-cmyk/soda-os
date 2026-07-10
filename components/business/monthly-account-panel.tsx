import type { MonthlyAccountSummary } from "@/lib/business/commercial-account";
import { HUMAN_LAYER } from "@/lib/brand";
import { cn } from "@/lib/utils";

function egp(n: number) {
  return `${n.toLocaleString("en-EG")} EGP`;
}

interface MonthlyAccountPanelProps {
  account: MonthlyAccountSummary;
  className?: string;
  title?: string;
}

/**
 * Settlement panel — close a commercial monthly account from one view.
 */
export function MonthlyAccountPanel({
  account,
  className,
  title = "Monthly account",
}: MonthlyAccountPanelProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-soda-pink/25 bg-[linear-gradient(145deg,color-mix(in_oklch,var(--soda-pink)_8%,transparent),var(--card)_55%)] p-4 sm:p-5",
        className
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-[0.14em] text-soda-pink uppercase">
            {title}
          </p>
          <h3 className="font-heading mt-1 text-xl font-semibold tracking-tight">
            {account.periodMonth}
          </h3>
          <p
            className="font-ar mt-1 text-[13px] leading-[1.75] text-muted-foreground"
            dir="rtl"
          >
            {HUMAN_LAYER.monthlyAccount}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-right">
          <div>
            <p className="text-[11px] text-muted-foreground">Invoiced</p>
            <p
              className="font-ar text-[10px] leading-[1.6] text-muted-foreground"
              dir="rtl"
            >
              {HUMAN_LAYER.totalDue}
            </p>
            <p className="font-mono text-sm font-medium">{egp(account.invoiced)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Collected</p>
            <p
              className="font-ar text-[10px] leading-[1.6] text-muted-foreground"
              dir="rtl"
            >
              {HUMAN_LAYER.collected}
            </p>
            <p className="font-mono text-sm font-medium text-emerald-400">
              {egp(account.collected)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Outstanding</p>
            <p
              className="font-ar text-[10px] leading-[1.6] text-muted-foreground"
              dir="rtl"
            >
              {HUMAN_LAYER.outstanding}
            </p>
            <p className="font-mono text-sm font-medium text-soda-pink">
              {egp(account.outstanding)}
            </p>
          </div>
        </div>
      </div>

      {account.lines.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No invoices in this period.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border/50 rounded-xl border border-border/50 bg-background/40">
          {account.lines.map((line) => (
            <li
              key={line.invoiceId}
              className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{line.number}</p>
                <p className="text-xs text-muted-foreground">
                  Due {line.dueDate} · {line.status}
                  {line.orderId ? ` · ${line.orderId}` : ""}
                </p>
              </div>
              <div className="text-right font-mono text-xs">
                <p>{egp(line.amount)}</p>
                <p className="text-soda-pink">{egp(line.outstanding)} left</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        {account.orderCount} orders · {account.deliveryCount} deliveries in period
      </p>
    </section>
  );
}
