import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { RoleGate } from "@/components/identity/role-gate";
import { BackLink } from "@/components/navigation/back-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Permission } from "@/lib/identity/permissions";
import { resolveSessionForApp } from "@/lib/identity/session";
import { refreshMeWalletDomainData } from "@/lib/supabase/refresh-all";
import { getCrewWallet } from "@/lib/wallets/crew-wallet";
import { formatPrice } from "@/lib/orders/utils";

export const dynamic = "force-dynamic";

type MePageConfig = {
  title: string;
  /** English card description (UI chrome). */
  description: string;
  /** SODA Side Language — Egyptian Arabic under the page title. */
  sideLanguage: string;
  permission: Permission;
  body: (
    wallet: ReturnType<typeof getCrewWallet> | null
  ) => React.ReactNode;
};

function makeMePage(config: MePageConfig) {
  return async function MeSectionPage() {
    const session = await resolveSessionForApp();
    if (!session) redirect("/login");
    // Lean refresh — wallet domains only (not full finance/files fan-out).
    await refreshMeWalletDomainData().catch(() => undefined);
    const wallet = session.profile.personId
      ? getCrewWallet(session.profile.personId)
      : null;

    return (
      <RoleGate session={session} anyOf={[config.permission]}>
        <AppShell
          title={config.title}
          layer="mySpace"
          subtitle={config.sideLanguage}
          session={session}
        >
          <BackLink href="/me" label="My Space" />
          <Card className="soda-cc-card">
            <CardHeader>
              <CardTitle>{config.title}</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {config.body(wallet)}
              <div className="flex flex-wrap gap-3 pt-2 text-sm">
                <Link href="/me/wallet" className="text-soda-pink hover:underline">
                  Wallet
                </Link>
                <Link href="/orders" className="text-soda-pink hover:underline">
                  Orders
                </Link>
                <Link href="/calendar" className="text-soda-pink hover:underline">
                  Calendar
                </Link>
                <Link
                  href="/notifications"
                  className="text-soda-pink hover:underline"
                >
                  Notifications
                </Link>
              </div>
            </CardContent>
          </Card>
        </AppShell>
      </RoleGate>
    );
  };
}

export const MeBonusPage = makeMePage({
  title: "Bonus",
  description: "Monthly target bonus progress",
  sideLanguage: "البونص الشهري حسب التارجيت.\nشوف تقدمك ومستحقاتك.",
  permission: "me.bonus",
  body: (wallet) =>
    wallet ? (
      <div className="space-y-2 text-sm">
        <p>
          Month {wallet.monthKey}: {wallet.monthlyCompletedOrders} completed
          orders · progress {Math.round(wallet.bonusProgress * 100)}%
        </p>
        <p>
          Bonus{" "}
          <Link href="/me/wallet" className="font-mono text-soda-pink">
            {formatPrice(wallet.bonusEgp)}
          </Link>{" "}
          {wallet.bonusQualified ? "(qualified)" : "(in progress)"}
        </p>
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">
        Link your account to a crew profile to track bonus.
      </p>
    ),
});

export const MeTargetPage = makeMePage({
  title: "Target",
  description: "Your monthly completion target",
  sideLanguage: "التارجيت الشهري بتاعك.\nكم أوردر خلّصت وقد إيه فاضل.",
  permission: "me.target",
  body: (wallet) =>
    wallet ? (
      <p className="text-sm">
        Completed this month:{" "}
        <Link href="/orders" className="font-mono text-soda-pink">
          {wallet.monthlyCompletedOrders}
        </Link>{" "}
        · Year: {wallet.yearlyCompletedOrders}
      </p>
    ) : (
      <p className="text-sm text-muted-foreground">
        Link your account to a crew profile to see targets.
      </p>
    ),
});

export const MePenaltiesPage = makeMePage({
  title: "Penalties",
  description: "Policy deductions and notes",
  sideLanguage: "الجزاءات والخصومات المسجّلة.\nلو في حاجة هتظهر هنا مع الأوردر.",
  permission: "me.penalties",
  body: () => (
    <p className="text-sm text-muted-foreground">
      No penalties on record. When logged, they appear here and link to the
      related order.
    </p>
  ),
});

export const MeFilesPage = makeMePage({
  title: "Files",
  description: "Briefs and shoot files for your assignments",
  sideLanguage: "ملفات الشوتات والتعيينات.\nالبريفز والتسليمات اللي تخصّك.",
  permission: "me.files",
  body: () => (
    <p className="text-sm text-muted-foreground">
      Open an{" "}
      <Link href="/orders" className="text-soda-pink hover:underline">
        order
      </Link>{" "}
      to download shoot files and deliveries.
    </p>
  ),
});

export const MeBriefsPage = makeMePage({
  title: "Briefs",
  description: "Call sheets and creative briefs",
  sideLanguage: "البريفز وورق التصوير.\nافتح الأوردر أو الجدول عشان تشوف اليوم.",
  permission: "me.briefs",
  body: () => (
    <p className="text-sm text-muted-foreground">
      Briefs attach to orders — open{" "}
      <Link href="/calendar" className="text-soda-pink hover:underline">
        Calendar
      </Link>{" "}
      or{" "}
      <Link href="/orders" className="text-soda-pink hover:underline">
        Orders
      </Link>{" "}
      for today&apos;s shoots.
    </p>
  ),
});

export const MeDressCodePage = makeMePage({
  title: "Dress Code",
  description: "Studio appearance standards",
  sideLanguage: "معايير المظهر في الشوتات.\nلبس مرتّب ومن غير مفاجآت قدام العميل.",
  permission: "me.dress_code",
  body: () => (
    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
      <li>Neutral, clean wardrobe on client shoots</li>
      <li>Black or studio kit for weddings unless briefed otherwise</li>
      <li>Check the order brief for client-specific notes</li>
    </ul>
  ),
});

export const MePerformancePage = makeMePage({
  title: "Performance",
  description: "Completed work and reliability",
  sideLanguage: "أدائك على الشغل المكتمل.\nالأوردرات والمستحقات في سطر واحد.",
  permission: "me.performance",
  body: (wallet) =>
    wallet ? (
      <div className="space-y-2 text-sm">
        <p>
          Year completed:{" "}
          <Link href="/orders" className="font-mono text-soda-pink">
            {wallet.yearlyCompletedOrders}
          </Link>
        </p>
        <p>
          Pending pay:{" "}
          <Link href="/me/wallet" className="font-mono text-soda-pink">
            {formatPrice(wallet.pendingTotal)}
          </Link>
        </p>
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">
        Performance metrics appear once your profile is linked to crew.
      </p>
    ),
});
