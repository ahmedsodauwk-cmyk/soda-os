import Link from "next/link";
import { notFound } from "next/navigation";

import { EquipmentList } from "@/components/business/equipment-list";
import { PaymentLineItems } from "@/components/business/payment-line-items";
import { PersonAvatar } from "@/components/business/person-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getActiveEquipmentForPerson,
  getEquipmentHistoryForPerson,
} from "@/lib/equipment/repository";
import {
  getPersonById,
  getPersonPaymentSummary,
  getPersonPerformance,
} from "@/lib/people/repository";

function egp(n: number) {
  return `${n.toLocaleString("en-EG")} EGP`;
}

interface PersonProfileProps {
  personId: string;
}

export function PersonProfile({ personId }: PersonProfileProps) {
  const person = getPersonById(personId);
  if (!person) notFound();

  const performance = getPersonPerformance(personId);
  const payments = getPersonPaymentSummary(personId);
  const equipment = getActiveEquipmentForPerson(personId);
  const history = getEquipmentHistoryForPerson(personId);

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link href="/people" />}
        className="-ml-2"
      >
        ← People
      </Button>

      <div className="flex flex-wrap items-start gap-4">
        <PersonAvatar
          nameAr={person.nameAr}
          nameEn={person.nameEn}
          initials={person.initials}
          avatarUrl={person.avatarUrl}
          size="lg"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="font-ar text-2xl font-semibold" dir="rtl">
            {person.nameAr}
          </h2>
          <p className="font-heading text-lg text-muted-foreground">
            {person.nameEn}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="outline">{person.jobTitle}</Badge>
            <Badge variant="outline" className="capitalize">
              {person.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="max-w-2xl pt-2 text-sm text-muted-foreground">
            {person.jobDescription}
          </p>
          <p className="text-xs text-muted-foreground">
            {person.phone} · {person.email} · Joined {person.joinDate}
          </p>
        </div>
      </div>

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
          <Card key={label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {(performance.achievements.length > 0 ||
        performance.warnings.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {performance.achievements.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Achievements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {performance.achievements.map((a) => (
                  <p key={a} className="text-emerald-300">
                    {a}
                  </p>
                ))}
              </CardContent>
            </Card>
          ) : null}
          {performance.warnings.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Warnings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {performance.warnings.map((w) => (
                  <p key={w} className="text-amber-300">
                    {w}
                  </p>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-heading text-base font-semibold">
              Order-based payments
            </h3>
            <p className="text-xs text-muted-foreground">
              Calculated from assignments only — no manual salary entry.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-right text-xs sm:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Earned</p>
              <p className="font-mono font-medium">{egp(payments.totalEarned)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Paid</p>
              <p className="font-mono font-medium text-emerald-400">
                {egp(payments.totalPaid)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Outstanding</p>
              <p className="font-mono font-medium text-soda-pink">
                {egp(payments.totalOutstanding)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Prev / current</p>
              <p className="font-mono font-medium">
                {egp(payments.previousBalance)} / {egp(payments.currentBalance)}
              </p>
            </div>
          </div>
        </div>
        <PaymentLineItems lines={payments.lines} />
        {payments.monthly.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-border/60 bg-muted/30 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Month</th>
                  <th className="px-3 py-2">Earned</th>
                  <th className="px-3 py-2">Paid</th>
                  <th className="px-3 py-2">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {payments.monthly.map((m) => (
                  <tr key={m.month} className="border-b border-border/40">
                    <td className="px-3 py-2 font-mono text-xs">{m.month}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {egp(m.earned)}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{egp(m.paid)}</td>
                    <td className="px-3 py-2 font-mono text-xs text-soda-pink">
                      {egp(m.remaining)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-2">
          <h3 className="font-heading text-base font-semibold">
            Equipment assigned
          </h3>
          <EquipmentList items={equipment} />
        </section>
        <section className="space-y-2">
          <h3 className="font-heading text-base font-semibold">
            Assignment history
          </h3>
          <EquipmentList items={history} showHistory />
        </section>
      </div>
    </div>
  );
}
