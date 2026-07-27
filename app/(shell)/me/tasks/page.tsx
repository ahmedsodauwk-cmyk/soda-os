import { redirect } from "next/navigation";

import { resolveSessionForApp } from "@/lib/identity/session";

export const dynamic = "force-dynamic";

/** Redirect to the signed-in operator's task board when person id is linked. */
export default async function MeTasksPage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  const personId = session.profile.personId?.trim();
  if (personId) {
    redirect(`/people/${personId}/tasks`);
  }

  redirect("/me");
}
