/**
 * SODA Brain Chat — Founder only (Mission 05.1).
 * Heuristic classification into Brain. Never creates ERP entities.
 */

import { redirect } from "next/navigation";

import { BrainChat } from "@/components/brain/brain-chat";
import { AppShell } from "@/components/layout/app-shell";
import { sessionCanAccessBrain } from "@/lib/brain/access";
import { listBrainChatMessages } from "@/lib/brain/repository";
import { homePathForAccessLevel } from "@/lib/identity/nav";
import { permissionsForAccessLevel } from "@/lib/identity/access-levels";
import { resolveSessionForApp } from "@/lib/identity/session";

export const dynamic = "force-dynamic";

export default async function BrainChatPage() {
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

  let messages: Awaited<ReturnType<typeof listBrainChatMessages>> = [];
  let migrationHint: string | null = null;

  try {
    messages = await listBrainChatMessages();
  } catch (err) {
    // listBrainChatMessages is now throw-safe; keep belt-and-suspenders.
    const message = err instanceof Error ? err.message : String(err);
    migrationHint =
      message.toLowerCase().includes("brain_chat") ||
      message.toLowerCase().includes("does not exist") ||
      message.toLowerCase().includes("schema cache")
        ? "Apply migration 20260714000021_soda_brain_evolution.sql in Supabase SQL Editor, then refresh."
        : message;
    messages = [];
  }

  return (
    <AppShell titleKey="pages.brain" layer="brain" session={session}>
      <BrainChat
        initialMessages={Array.isArray(messages) ? messages : []}
        migrationHint={migrationHint}
      />
    </AppShell>
  );
}
