"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/actions";
import { useI18n } from "@/lib/i18n/provider";

type AccountSecurityPanelProps = {
  username: string | null;
  email: string;
};

export function AccountSecurityPanel({ username, email }: AccountSecurityPanelProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="text-muted-foreground">{t("settings.username")}</p>
        <p className="font-medium">{username ?? "—"}</p>
      </div>
      <div>
        <p className="text-muted-foreground">{t("common.email")}</p>
        <p className="font-medium">{email}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("settings.emailReadOnly")}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/settings/password" />}
        >
          {t("common.changePassword")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/forgot-password" />}
        >
          {t("common.forgotPassword")}
        </Button>
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" size="sm">
            {t("actions.logOut")}
          </Button>
        </form>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">{t("settings.twoFactorUnavailable")}</p>
        <p className="mt-1">{t("settings.twoFactorExplanation")}</p>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">{t("settings.phoneLoginBlocked")}</p>
        <p className="mt-1">{t("settings.phoneLoginExplanation")}</p>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">{t("settings.smsRecoveryBlocked")}</p>
        <p className="mt-1">{t("settings.phoneRecoveryBlocked")}</p>
      </div>
    </div>
  );
}
