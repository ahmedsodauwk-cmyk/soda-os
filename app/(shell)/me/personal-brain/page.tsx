import { AppShell } from "@/components/layout/app-shell";
import { PersonalBrainGate } from "@/components/personal-brain/personal-brain-gate";
import { resolveSessionForApp } from "@/lib/identity/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Personal Brain — gated until migration 20260728000033 is Founder-approved. */
export default async function PersonalBrainPage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  return (
    <AppShell titleKey="pages.brain" layer="brain" session={session}>
      <PersonalBrainGate />
    </AppShell>
  );
}
