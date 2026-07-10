import Link from "next/link";
import { notFound } from "next/navigation";

import { EquipmentList } from "@/components/business/equipment-list";
import { PaymentLineItems } from "@/components/business/payment-line-items";
import { PersonAvatar } from "@/components/business/person-avatar";
import { AssignEquipmentDialog } from "@/components/crew/assign-equipment-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EMPLOYMENT_TYPE_LABELS,
  getCrewMemberById,
  getCrewPaymentSummary,
  getCrewPerformance,
  getCrewWorkHistory,
} from "@/lib/crew";
import {
  getActiveEquipmentForPerson,
  getEquipmentHistoryForPerson,
} from "@/lib/equipment/repository";

function egp(n: number) {
  return `${n.toLocaleString("en-EG")} EGP`;
}

interface CrewProfileProps {
  personId: string;
}

export function CrewProfile({ personId }: CrewProfileProps) {
  const person = getCrewMemberById(personId);
  if (!person) notFound();

  const performance = getCrewPerformance(personId);
  const payments = getCrewPaymentSummary(personId);
  const equipment = getActiveEquipmentForPerson(personId);
  const history = getEquipmentHistoryForPerson(personId);
  const workHistory = getCrewWorkHistory(personId);

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link href="/crew" />}
        className="-ml-2"
      >
        ← The Crew
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
            {person.nickname ? (
              <span className="font-ar ms-2 text-base text-soda-pink" dir="rtl">
                ({person.nickname})
              </span>
            ) : null}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="outline">{person.jobTitle}</Badge>
            {person.employmentType ? (
              <Badge variant="secondary">
                {EMPLOYMENT_TYPE_LABELS[person.employmentType]}
              </Badge>
            ) : null}
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

      {(person.responsibilities?.length || person.notResponsibleFor?.length) ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {person.responsibilities && person.responsibilities.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Responsible for</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {person.responsibilities.map((r) => (
                  <Badge key={r} variant="outline" className="border-soda-pink/40">
                    {r}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          ) : null}
          {person.notResponsibleFor && person.notResponsibleFor.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Not responsible for</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {person.notResponsibleFor.map((r) => (
                  <Badge key={r} variant="secondary">
                    {r}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
          ["Late / long-cycle", String(performance.lateDeliveries)],
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
              From assignments only — no manual salary entry.
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
        {payments.yearly.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead className="border-b border-border/60 bg-muted/30 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Year</th>
                  <th className="px-3 py-2">Earned</th>
                  <th className="px-3 py-2">Paid</th>
                  <th className="px-3 py-2">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {payments.yearly.map((y) => (
                  <tr key={y.year} className="border-b border-border/40">
                    <td className="px-3 py-2 font-mono text-xs">{y.year}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {egp(y.earned)}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{egp(y.paid)}</td>
                    <td className="px-3 py-2 font-mono text-xs text-soda-pink">
                      {egp(y.remaining)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {workHistory.length > 0 ? (
        <section className="space-y-2">
          <h3 className="font-heading text-base font-semibold">Work history</h3>
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border/60 bg-muted/30 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Client</th>
                  <th className="px-3 py-2">Project</th>
                  <th className="px-3 py-2">Lane</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {workHistory.slice(0, 40).map((row) => (
                  <tr key={row.assignmentId} className="border-b border-border/40">
                    <td className="px-3 py-2 font-mono text-xs">
                      {row.shootDate}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {row.clientName}
                      <span className="ms-1 text-muted-foreground">
                        ({row.clientSegment})
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <Link
                        href={`/projects/${row.projectId}`}
                        className="hover:text-soda-pink"
                      >
                        {row.projectName}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-xs capitalize">
                      {row.commercialLane}
                    </td>
                    <td className="px-3 py-2 text-xs">{row.role}</td>
                    <td className="px-3 py-2 text-xs">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-heading text-base font-semibold">
              Equipment assigned
            </h3>
            <AssignEquipmentDialog personId={personId} />
          </div>
          <EquipmentList items={equipment} />
        </section>
        <section className="space-y-2">
          <h3 className="font-heading text-base font-semibold">
            Equipment history
          </h3>
          <EquipmentList items={history} showHistory />
        </section>
      </div>
    </div>
  );
}
