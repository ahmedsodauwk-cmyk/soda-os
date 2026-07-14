/**
 * SODA Brain — Founder Intelligence Workspace (Mission 05.1).
 * Founder only. Completely isolated from ERP modules.
 * Mission 06.0: entries + ERP panel load in parallel (no waterfall).
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";

import { BrainWorkspace } from "@/components/brain/brain-workspace";
import { AppShell } from "@/components/layout/app-shell";
import { sessionCanAccessBrain } from "@/lib/brain/access";
import { loadBrainErpReadonlySummary } from "@/lib/brain/erp-readonly";
import { listBrainEntries } from "@/lib/brain/repository";
import { homePathForAccessLevel } from "@/lib/identity/nav";
import { permissionsForAccessLevel } from "@/lib/identity/access-levels";
import { resolveSessionForApp } from "@/lib/identity/session";
import type { BrainErpReadonlySummary, BrainEntry } from "@/lib/brain/types";

export const dynamic = "force-dynamic";

async function BrainErpDeferred({
  entries,
  migrationHint,
}: {
  entries: BrainEntry[];
  migrationHint: string | null;
}) {
  const erpSummary = await loadBrainErpReadonlySummary();
  return (
    <BrainWorkspace
      initialEntries={entries}
      erpSummary={erpSummary}
      migrationHint={migrationHint}
    />
  );
}

function emptyErpSummary(): BrainErpReadonlySummary {
  const asOf = new Date().toISOString().slice(0, 10);
  return {
    asOf,
    todayOrders: [],
    upcomingShoots: [],
    revenueSummary: {
      revenueThisMonth: 0,
      outstanding: 0,
      collected: 0,
    },
    crewWorkingToday: [],
    calendarSummary: {
      todayShoots: 0,
      tomorrowShoots: 0,
      deliveries: 0,
      deadlines: 0,
    },
  };
}

export default async function BrainPage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  if (!sessionCanAccessBrain(session)) {
    redirect(
      homePathForAccessLevel(
        session.profile.accessLevel,
        permissionsForAccessLevel(session.profile.accessLevel)
      )
    );
  }

  let entries: BrainEntry[] = [];
  let migrationHint: string | null = null;

  try {
    entries = await listBrainEntries();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.toLowerCase().includes("brain_entries") ||
      message.toLowerCase().includes("does not exist") ||
      message.toLowerCase().includes("schema cache")
    ) {
      migrationHint =
        "Apply migrations 20260714000020 + 20260714000021_soda_brain_evolution.sql in Supabase SQL Editor, then refresh.";
      entries = [];
    } else {
      migrationHint = message;
      entries = [];
    }
  }

  return (
    <AppShell titleKey="pages.brain" layer="brain" session={session}>
      <Suspense
        fallback={
          <BrainWorkspace
            initialEntries={entries}
            erpSummary={emptyErpSummary()}
            migrationHint={migrationHint}
          />
        }
      >
        <BrainErpDeferred entries={entries} migrationHint={migrationHint} />
      </Suspense>
    </AppShell>
  );
}
