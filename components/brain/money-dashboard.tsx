"use client";

import type { MoneyDashboard } from "@/lib/brain/types";
import { WORKSPACE_LABELS_EN } from "@/lib/brain/types";
import { cn } from "@/lib/utils";

function fmt(n: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: currency === "EGP" ? "EGP" : currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n} ${currency}`;
  }
}

function Card({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3.5 py-3",
        accent
          ? "border-violet-400/35 bg-violet-500/20"
          : "border-violet-500/15 bg-violet-950/40"
      )}
    >
      <p className="text-[10px] tracking-wide text-violet-300/60 uppercase">
        {label}
      </p>
      <p className="mt-1 text-lg font-medium tabular-nums tracking-tight text-violet-50">
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-[10px] text-violet-400/50">{hint}</p>
      ) : null}
    </div>
  );
}

type Props = {
  dash: MoneyDashboard;
  locale: string;
  onOpenMoney?: () => void;
};

export function BrainMoneyDashboard({ dash, locale, onOpenMoney }: Props) {
  const ar = locale === "ar";
  const c = dash.currency;

  return (
    <div className="space-y-3 border-b border-violet-500/15 px-3 py-3 lg:px-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-violet-100">
            {ar ? "لوحة فلوس المؤسس" : "Founder Money Dashboard"}
          </p>
          <p className="text-[10px] text-violet-400/55">
            {ar
              ? "من ذاكرة المال فقط — مش مالية ERP"
              : "From Money Memory only — not ERP Finance"}
          </p>
        </div>
        {onOpenMoney ? (
          <button
            type="button"
            onClick={onOpenMoney}
            className="text-[10px] text-violet-300/70 underline-offset-2 hover:underline"
          >
            {WORKSPACE_LABELS_EN.money_memory}
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
        <Card
          label={ar ? "فلوس مستنية" : "Money Waiting"}
          value={fmt(dash.moneyWaiting, c)}
          hint={`${dash.counts.waiting}`}
        />
        <Card
          label={ar ? "سلف اديتها" : "Loans Given"}
          value={fmt(dash.loansGiven, c)}
          hint={`${dash.counts.loansGiven}`}
        />
        <Card
          label={ar ? "سلف واخداها" : "Loans Taken"}
          value={fmt(dash.loansTaken, c)}
          hint={`${dash.counts.loansTaken}`}
        />
        <Card
          label={ar ? "عهود طاقم" : "Crew Advances"}
          value={fmt(dash.crewAdvances, c)}
          hint={`${dash.counts.crewAdvances}`}
        />
        <Card
          label={ar ? "ديون عملاء" : "Client Debts"}
          value={fmt(dash.clientDebts, c)}
          hint={`${dash.counts.clientDebts}`}
        />
        <Card
          label={ar ? "تحصيل قريب" : "Upcoming Collections"}
          value={fmt(dash.upcomingCollections, c)}
          hint={`${dash.counts.upcoming} · 30d`}
        />
        <Card
          label={ar ? "إجمالي الانتظار" : "Total Waiting"}
          value={fmt(dash.totalWaiting, c)}
          accent
        />
      </div>

      {dash.recentActivity.length > 0 ? (
        <div className="rounded-xl border border-violet-500/10 bg-black/20 px-3 py-2">
          <p className="mb-1.5 text-[10px] text-violet-400/55 uppercase">
            {ar ? "آخر نشاط مالي" : "Recent Money Activity"}
          </p>
          <ul className="space-y-1">
            {dash.recentActivity.slice(0, 5).map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-2 text-[11px] text-violet-200/70"
              >
                <span className="truncate">
                  {e.title || e.body.slice(0, 40) || e.moneyKind || "—"}
                </span>
                <span className="shrink-0 tabular-nums text-violet-300/60">
                  {e.amount != null ? fmt(e.amount, e.currency ?? c) : "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
