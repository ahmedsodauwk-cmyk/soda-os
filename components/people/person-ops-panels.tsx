import { PeopleEmptyState } from "@/components/people/people-empty-state";
import { getPersonPaymentSummary, getPersonPerformance } from "@/lib/people/repository";

function egp(n: number) {
  return `${n.toLocaleString("en-EG")} EGP`;
}

interface PersonWalletPanelProps {
  personId: string;
}

export function PersonWalletPanel({ personId }: PersonWalletPanelProps) {
  const summary = getPersonPaymentSummary(personId);
  if (summary.lines.length === 0) {
    return (
      <PeopleEmptyState
        title="Wallet empty"
        detail="Earnings appear from order assignments — never entered manually."
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {[
        ["Earned", egp(summary.totalEarned)],
        ["Paid", egp(summary.totalPaid)],
        ["Outstanding", egp(summary.totalOutstanding)],
      ].map(([label, value]) => (
        <div
          key={label}
          className="rounded-xl border border-border/60 bg-card/40 px-3.5 py-3"
        >
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-mono text-lg font-semibold">{value}</p>
        </div>
      ))}
    </div>
  );
}

interface PersonPerformancePanelProps {
  personId: string;
}

export function PersonPerformancePanel({
  personId,
}: PersonPerformancePanelProps) {
  const performance = getPersonPerformance(personId);
  const hasSignal =
    performance.ordersCompleted > 0 ||
    performance.currentWorkload > 0 ||
    performance.projectsCompleted > 0;

  if (!hasSignal) {
    return (
      <PeopleEmptyState
        title="No performance signal yet"
        detail="Metrics appear from real completed assignments only."
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[
        ["Projects completed", String(performance.projectsCompleted)],
        ["Orders completed", String(performance.ordersCompleted)],
        ["Workload", String(performance.currentWorkload)],
        [
          "Avg delivery days",
          performance.avgDeliverySpeedDays != null
            ? String(performance.avgDeliverySpeedDays)
            : "—",
        ],
      ].map(([label, value]) => (
        <div
          key={label}
          className="rounded-xl border border-border/60 bg-card/40 px-3.5 py-3"
        >
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-mono text-lg font-semibold">{value}</p>
        </div>
      ))}
    </div>
  );
}
