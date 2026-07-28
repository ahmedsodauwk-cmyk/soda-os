/**
 * SODA Brain — Command Center right-rail data (Founder only).
 * Reads dashboard + optional brain entries — never writes ERP tables.
 */

import { listBrainEntries } from "@/lib/brain/repository";
import { loadDashboardSnapshot } from "@/lib/dashboard";
import { buildRotatingSummaries } from "@/lib/dashboard/rotating-summaries";
import { formatPrice } from "@/lib/orders/utils";

export type BrainPanelFocusItem = {
  id: string;
  title: string;
  detail: string;
  href?: string;
  /** Visual checklist state — info-severity attention items count as done. */
  completed?: boolean;
};

export type BrainPanelInsightItem = {
  id: string;
  label: string;
  value: string;
  href?: string;
};

export type CommandCenterBrainPanelData = {
  focus: BrainPanelFocusItem[];
  insights: BrainPanelInsightItem[];
  migrationHint: string | null;
};

function priorityScore(severity: string): number {
  if (severity === "critical") return 100;
  if (severity === "warning") return 50;
  return 10;
}

/** Build Today's Focus + Key Insights from real operational data only. */
export async function loadCommandCenterBrainPanel(): Promise<CommandCenterBrainPanelData> {
  let migrationHint: string | null = null;

  try {
    const snapshot = await loadDashboardSnapshot();

    const focusFromAttention = [...snapshot.attention]
      .sort((a, b) => priorityScore(b.severity) - priorityScore(a.severity))
      .slice(0, 4)
      .map((item) => ({
        id: item.id,
        title: item.title,
        detail: item.detail,
        href: item.href,
        completed: item.severity === "info",
      }));

    const focusFromSchedule: BrainPanelFocusItem[] = [];
    if (focusFromAttention.length < 4) {
      for (const shoot of snapshot.schedule.todayShoots) {
        if (focusFromSchedule.length + focusFromAttention.length >= 4) break;
        focusFromSchedule.push({
          id: `shoot-${shoot.id}`,
          title: shoot.title,
          detail: `${shoot.clientName} · shoot today`,
          href: shoot.href,
        });
      }
    }

    const focus = [...focusFromAttention, ...focusFromSchedule].slice(0, 4);

    const insights: BrainPanelInsightItem[] = [];
    const seenInsightKeys = new Set<string>();
    const pushInsight = (item: BrainPanelInsightItem) => {
      const key = `${item.label}:${item.value}`;
      if (seenInsightKeys.has(key)) return;
      if (insights.length >= 3) return;
      seenInsightKeys.add(key);
      insights.push(item);
    };

    const { kpis, financial } = snapshot;

    if (kpis.activeOrders > 0) {
      pushInsight({
        id: "active-orders",
        label: "Active orders",
        value: String(kpis.activeOrders),
        href: "/orders",
      });
    }
    if (financial.outstanding > 0) {
      pushInsight({
        id: "outstanding",
        label: "Outstanding",
        value: formatPrice(financial.outstanding),
        href: "/finance",
      });
    }
    if (kpis.upcomingShoots > 0) {
      pushInsight({
        id: "upcoming-shoots",
        label: "Upcoming shoots",
        value: String(kpis.upcomingShoots),
        href: "/calendar",
      });
    }

    const rotating = buildRotatingSummaries(snapshot);
    for (const panel of rotating) {
      if (insights.length >= 3) break;
      for (const line of panel.lines) {
        if (insights.length >= 3) break;
        if (line.value === "0") continue;
        pushInsight({
          id: `${panel.key}-${line.label}`,
          label: line.label,
          value: line.value,
          href: line.href ?? panel.href,
        });
      }
    }

    try {
      const entries = await listBrainEntries();
      for (const entry of entries.slice(0, 3)) {
        if (insights.length >= 3) break;
        const title = entry.title?.trim() || entry.body.slice(0, 48);
        if (!title) continue;
        pushInsight({
          id: `brain-${entry.id}`,
          label: "Brain note",
          value: title,
          href: "/brain",
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (
        message.toLowerCase().includes("brain_entries") ||
        message.toLowerCase().includes("does not exist")
      ) {
        migrationHint =
          "Apply SODA Brain migrations in Supabase, then refresh.";
      }
    }

    return {
      focus,
      insights: insights.slice(0, 3),
      migrationHint,
    };
  } catch (err) {
    console.error(
      "[brain-panel] load failed:",
      err instanceof Error ? err.message : err
    );
    return { focus: [], insights: [], migrationHint: null };
  }
}
