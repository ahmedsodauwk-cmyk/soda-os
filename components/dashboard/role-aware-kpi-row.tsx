import Link from "next/link";

import { SodaLanguage } from "@/components/brand/soda-language";
import type { HomeKpiMetric } from "@/lib/dashboard/home-registry";
import { cn } from "@/lib/utils";

interface RoleAwareKpiRowProps {
  metrics: HomeKpiMetric[];
}

/** Shared V3 KPI row — same visual tokens as Founder, role-scoped metrics. */
export function RoleAwareKpiRow({ metrics }: RoleAwareKpiRowProps) {
  if (metrics.length === 0) return null;

  const cols =
    metrics.length >= 5
      ? "lg:grid-cols-5"
      : metrics.length === 4
        ? "lg:grid-cols-4"
        : "lg:grid-cols-3";

  return (
    <section aria-label="Key performance indicators">
      <div
        className={cn(
          "soda-founder-kpi-row soda-stagger-children grid grid-cols-2 gap-2",
          cols
        )}
        role="list"
      >
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.id}
              href={m.href}
              role="listitem"
              className={cn(
                "soda-founder-metric group flex min-w-0 flex-col gap-1 rounded-lg border border-border/60 bg-card/60 px-3 py-2.5 transition-colors",
                "hover:border-soda-pink/35 hover:bg-soda-pink/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <div className="flex items-center gap-2">
                <div className="soda-kpi-icon-pink flex size-7 shrink-0 items-center justify-center rounded-md">
                  <Icon className="size-3.5" aria-hidden />
                </div>
                <p className="soda-founder-kpi-label truncate font-semibold text-foreground">
                  {m.label}
                </p>
              </div>
              <p className="soda-founder-kpi-value font-mono font-bold tabular-nums leading-none">
                {m.value}
              </p>
              <SodaLanguage
                layer={m.guidanceLayer}
                size="compact"
                className="hidden truncate sm:block"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
