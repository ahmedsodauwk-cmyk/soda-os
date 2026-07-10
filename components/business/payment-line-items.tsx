import type { PersonPaymentLine } from "@/lib/people/types";
import { cn } from "@/lib/utils";

function egp(n: number) {
  return `${n.toLocaleString("en-EG")} EGP`;
}

interface PaymentLineItemsProps {
  lines: PersonPaymentLine[];
  className?: string;
}

export function PaymentLineItems({ lines, className }: PaymentLineItemsProps) {
  if (lines.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No order-based payments yet.
      </p>
    );
  }

  return (
    <div className={cn("overflow-x-auto rounded-xl border border-border/60", className)}>
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-border/60 bg-muted/30 text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2.5 font-medium">Project</th>
            <th className="px-3 py-2.5 font-medium">Client</th>
            <th className="px-3 py-2.5 font-medium">Role</th>
            <th className="px-3 py-2.5 font-medium">Price</th>
            <th className="px-3 py-2.5 font-medium">Bonus</th>
            <th className="px-3 py-2.5 font-medium">Deduction</th>
            <th className="px-3 py-2.5 font-medium">Final</th>
            <th className="px-3 py-2.5 font-medium">Paid</th>
            <th className="px-3 py-2.5 font-medium">Remaining</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.assignmentId} className="border-b border-border/40 last:border-0">
              <td className="px-3 py-2.5">
                <p className="font-medium">{line.projectName}</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {line.orderId}
                </p>
              </td>
              <td className="px-3 py-2.5">{line.clientName}</td>
              <td className="px-3 py-2.5">{line.role}</td>
              <td className="px-3 py-2.5 font-mono text-xs">{egp(line.employeePrice)}</td>
              <td className="px-3 py-2.5 font-mono text-xs">{egp(line.bonus)}</td>
              <td className="px-3 py-2.5 font-mono text-xs">{egp(line.deduction)}</td>
              <td className="px-3 py-2.5 font-mono text-xs font-medium">
                {egp(line.finalAmount)}
              </td>
              <td className="px-3 py-2.5 font-mono text-xs">{egp(line.paidAmount)}</td>
              <td
                className={cn(
                  "px-3 py-2.5 font-mono text-xs font-medium",
                  line.remaining > 0 ? "text-soda-pink" : "text-emerald-400"
                )}
              >
                {egp(line.remaining)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
