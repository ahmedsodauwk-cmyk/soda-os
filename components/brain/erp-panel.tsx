"use client";

import type { BrainErpReadonlySummary } from "@/lib/brain/types";

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(n);
}

type Props = {
  summary: BrainErpReadonlySummary;
  locale: string;
  open: boolean;
  onToggle: () => void;
};

export function BrainErpReadonlyPanel({
  summary,
  locale,
  open,
  onToggle,
}: Props) {
  const ar = locale === "ar";

  return (
    <div className="border-t border-violet-500/15">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-2.5 text-start text-xs text-violet-200/70 hover:bg-violet-500/10"
      >
        <span>
          {ar ? "لوحة ERP (قراءة فقط)" : "ERP Read-Only Panel"}
          <span className="ms-2 text-[10px] text-violet-400/45">
            {ar ? "ملخصات فقط · مش قابل للتعديل" : "summaries only · not editable"}
          </span>
        </span>
        <span className="text-[10px] text-violet-400/50">
          {open ? (ar ? "إخفاء" : "Hide") : ar ? "إظهار" : "Show"}
        </span>
      </button>

      {open ? (
        <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2 xl:grid-cols-5">
          <PanelBlock title={ar ? "أوردرات النهارده" : "Today's Orders"}>
            {summary.todayOrders.length === 0 ? (
              <Empty ar={ar} />
            ) : (
              summary.todayOrders.slice(0, 4).map((o) => (
                <p key={o.id} className="truncate text-[11px] text-violet-200/75">
                  {o.clientName} · {o.status}
                </p>
              ))
            )}
          </PanelBlock>

          <PanelBlock title={ar ? "شوتات قريبة" : "Upcoming Shoots"}>
            {summary.upcomingShoots.length === 0 ? (
              <Empty ar={ar} />
            ) : (
              summary.upcomingShoots.slice(0, 4).map((s) => (
                <p key={`${s.id}-${s.date}`} className="truncate text-[11px] text-violet-200/75">
                  {s.clientName} · {s.date}
                </p>
              ))
            )}
          </PanelBlock>

          <PanelBlock title={ar ? "ملخص الإيراد" : "Revenue Summary"}>
            <p className="text-[11px] text-violet-200/75">
              {ar ? "هذا الشهر" : "This month"}:{" "}
              {fmtMoney(summary.revenueSummary.revenueThisMonth)}
            </p>
            <p className="text-[11px] text-violet-200/75">
              {ar ? "محصّل" : "Collected"}:{" "}
              {fmtMoney(summary.revenueSummary.collected)}
            </p>
            <p className="text-[11px] text-violet-200/75">
              {ar ? "مستحق" : "Outstanding"}:{" "}
              {fmtMoney(summary.revenueSummary.outstanding)}
            </p>
          </PanelBlock>

          <PanelBlock title={ar ? "طاقم شغال النهارده" : "Crew Working Today"}>
            {summary.crewWorkingToday.length === 0 ? (
              <Empty ar={ar} />
            ) : (
              summary.crewWorkingToday.slice(0, 4).map((c) => (
                <p key={c.name} className="truncate text-[11px] text-violet-200/75">
                  {c.name} · {c.role}
                </p>
              ))
            )}
          </PanelBlock>

          <PanelBlock title={ar ? "ملخص التقويم" : "Calendar Summary"}>
            <p className="text-[11px] text-violet-200/75">
              Today shoots: {summary.calendarSummary.todayShoots}
            </p>
            <p className="text-[11px] text-violet-200/75">
              Tomorrow: {summary.calendarSummary.tomorrowShoots}
            </p>
            <p className="text-[11px] text-violet-200/75">
              Deliveries: {summary.calendarSummary.deliveries}
            </p>
          </PanelBlock>
        </div>
      ) : null}
    </div>
  );
}

function PanelBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-violet-500/10 bg-violet-950/30 px-2.5 py-2">
      <p className="mb-1 text-[10px] tracking-wide text-violet-400/55 uppercase">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Empty({ ar }: { ar: boolean }) {
  return (
    <p className="text-[11px] text-violet-400/40">
      {ar ? "فاضي" : "None"}
    </p>
  );
}
