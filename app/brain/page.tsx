/**
 * SODA Brain — Founder Intelligence Workspace (Mission 05.0).
 * Founder only. Completely isolated from ERP modules.
 */

import { redirect } from "next/navigation";

import { BrainWorkspace } from "@/components/brain/brain-workspace";
import { AppShell } from "@/components/layout/app-shell";
import { sessionCanAccessBrain } from "@/lib/brain/access";
import { listBrainEntries } from "@/lib/brain/repository";
import { homePathForAccessLevel } from "@/lib/identity/nav";
import { permissionsForAccessLevel } from "@/lib/identity/access-levels";
import { resolveSessionForApp } from "@/lib/identity/session";

export const dynamic = "force-dynamic";

export default async function BrainPage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  // Hard Founder gate — never Team / TL / Account Manager
  if (!sessionCanAccessBrain(session)) {
    redirect(
      homePathForAccessLevel(
        session.profile.accessLevel,
        permissionsForAccessLevel(session.profile.accessLevel)
      )
    );
  }

  let entries: Awaited<ReturnType<typeof listBrainEntries>> = [];
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
        "Apply migration 20260714000020_soda_brain_foundation.sql in Supabase SQL Editor, then refresh.";
      entries = [];
    } else {
      migrationHint = message;
      entries = [];
    }
  }

  return (
    <AppShell titleKey="pages.brain" layer="brain" session={session}>
      <BrainWorkspace
        initialEntries={entries}
        migrationHint={migrationHint}
      />
    </AppShell>
  );
}
