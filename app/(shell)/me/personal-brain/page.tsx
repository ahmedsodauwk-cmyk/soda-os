import { redirect } from "next/navigation";

import { PersonalBrainGate } from "@/components/personal-brain/personal-brain-gate";
import { AppShell } from "@/components/layout/app-shell";
import { isPersonalBrainUiEnabled } from "@/lib/personal-brain/feature-flag";
import { resolveSessionForApp } from "@/lib/identity/session";

export const dynamic = "force-dynamic";

/**
 * Personal Brain — DEFERRED BY FOUNDER.
 * Route stays in source; no UI until migration 20260728000033 is approved.
 */
export default async function PersonalBrainPage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  if (
    session.profile.accessLevel !== "founder" ||
    !isPersonalBrainUiEnabled()
  ) {
    redirect("/me");
  }

  return (
    <AppShell titleKey="pages.brain" layer="brain" session={session}>
      <PersonalBrainGate />
    </AppShell>
  );
}
