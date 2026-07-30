"use client";

import Link from "next/link";

import { InviteUserForm } from "@/components/auth/invite-user-form";
import { CompanyEmailDomainForm } from "@/components/auth/company-email-domain-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";

export function SystemSettingsCards({
  emailDomain,
  isFounder,
}: {
  emailDomain: string;
  isFounder: boolean;
}) {
  const { t } = useI18n();

  return (
    <div className="soda-stagger-children grid gap-4 lg:grid-cols-2">
      <Card className="soda-cc-card">
        <CardHeader>
          <CardTitle>{t("settings.systemCompanyEmail")}</CardTitle>
          <CardDescription>
            username@{emailDomain}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyEmailDomainForm currentDomain={emailDomain} />
        </CardContent>
      </Card>

      <Card className="soda-cc-card">
        <CardHeader>
          <CardTitle>{t("settings.systemAuthority")}</CardTitle>
          <CardDescription>{t("settings.systemAuthorityDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/settings/authority"
            className="text-sm text-soda-pink hover:underline"
          >
            {t("settings.openAuthority")}
          </Link>
        </CardContent>
      </Card>

      {isFounder ? (
        <Card className="soda-cc-card border-soda-pink/20">
          <CardHeader>
            <CardTitle>{t("settings.systemBackup")}</CardTitle>
            <CardDescription>{t("settings.systemBackupDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/settings/backup"
              className="text-sm text-soda-pink hover:underline"
            >
              {t("settings.openBackup")}
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <Card className="soda-cc-card">
        <CardHeader>
          <CardTitle>{t("settings.systemInvite")}</CardTitle>
          <CardDescription>{t("settings.systemInviteDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <InviteUserForm emailDomain={emailDomain} />
        </CardContent>
      </Card>
    </div>
  );
}
