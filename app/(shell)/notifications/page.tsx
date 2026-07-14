import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { RoleGate } from "@/components/identity/role-gate";
import { NotificationCenter } from "@/components/notifications/notification-center";
import type { AccessLevel } from "@/lib/identity/access-levels";
import { resolveSessionForApp } from "@/lib/identity/session";

export const dynamic = "force-dynamic";

function scopeSubtitle(level: AccessLevel): string {
  switch (level) {
    case "team":
      return "تنبيهاتك بس — الجديد يبرق، والمقروء يهدى. اسحب يمين/شمال على الموبايل.";
    case "team_leader":
      return "تنبيهاتك وتنبيهات فريقك — من غير مالية الشركة. اختار كرت وشوف التفاصيل.";
    case "account_manager":
      return "تنبيهات الكوميرشال والعملاء بتوعك — غير المقروء ظاهر من أول نظرة.";
    default:
      return "زي الـ Notification Center — اشوف الجديد فوراً، افتح التفاصيل، وخلّص من غير ما تدور.";
  }
}

export default async function NotificationsPage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  return (
    <RoleGate session={session} anyOf={["notifications.view"]}>
      <AppShell
        titleKey="pages.notifications"
        layer="notifications"
        session={session}
      >
        <NotificationCenter
          subtitle={scopeSubtitle(session.profile.accessLevel)}
        />
      </AppShell>
    </RoleGate>
  );
}
