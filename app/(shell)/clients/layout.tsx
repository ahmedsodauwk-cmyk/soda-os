import { redirect } from "next/navigation";

import { mayBrowseClientDirectory } from "@/lib/clients/privacy";
import { resolveSessionForApp } from "@/lib/identity/session";
import { homePathForAccessLevel } from "@/lib/identity/nav";
import { permissionsForAccessLevel } from "@/lib/identity/access-levels";

export default async function ClientsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await resolveSessionForApp();
  if (!session) return children;

  if (!mayBrowseClientDirectory(session.profile.accessLevel)) {
    const grants = permissionsForAccessLevel(session.profile.accessLevel);
    redirect(homePathForAccessLevel(session.profile.accessLevel, grants));
  }

  return children;
}
