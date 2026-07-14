import { redirect } from "next/navigation";

import { ConnectWorkspace } from "@/components/connect/connect-workspace";
import { AppShell } from "@/components/layout/app-shell";
import { RoleGate } from "@/components/identity/role-gate";
import { resolveSessionForApp } from "@/lib/identity/session";

export const dynamic = "force-dynamic";

export default async function ConnectPage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  return (
    <RoleGate session={session} anyOf={["connect.view"]} path="/connect">
      <AppShell
        titleKey="pages.connect"
        layer="connect"
        session={session}
        showBreadcrumbs={false}
      >
        <ConnectWorkspace
          userId={session.userId}
          displayName={session.profile.displayName}
        />
      </AppShell>
    </RoleGate>
  );
}
