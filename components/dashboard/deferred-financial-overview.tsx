"use client";

/**
 * Lazy-load recharts financial card — keeps Home first paint lighter (Phase 08/10).
 */

import dynamic from "next/dynamic";

import { SkeletonCard } from "@/components/ui/soda-skeleton";
import type {
  FinancialOverview,
  MonthlyRevenuePoint,
} from "@/lib/dashboard/types";

const FinancialOverviewCard = dynamic(
  () => import("@/components/dashboard/financial-overview"),
  {
    ssr: false,
    loading: () => <SkeletonCard className="h-[280px]" />,
  }
);

export function DeferredFinancialOverview({
  financial,
  monthlyRevenue,
}: {
  financial: FinancialOverview;
  monthlyRevenue: MonthlyRevenuePoint[];
}) {
  return (
    <FinancialOverviewCard
      financial={financial}
      monthlyRevenue={monthlyRevenue}
    />
  );
}
