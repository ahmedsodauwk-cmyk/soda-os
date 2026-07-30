"use client";

import Link from "next/link";

import { ReducedMotionSwitcher } from "@/components/preferences/reduced-motion-switcher";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";

export function PreferencesCards() {
  const { t } = useI18n();

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="soda-cc-card">
        <CardHeader>
          <CardTitle>{t("settings.languageTitle")}</CardTitle>
          <CardDescription>{t("settings.languageDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LanguageSwitcher variant="inline" />
        </CardContent>
      </Card>

      <Card className="soda-cc-card">
        <CardHeader>
          <CardTitle>{t("settings.appearanceTitle")}</CardTitle>
          <CardDescription>{t("settings.appearanceDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSwitcher />
        </CardContent>
      </Card>

      <Card className="soda-cc-card">
        <CardHeader>
          <CardTitle>{t("settings.motionTitle")}</CardTitle>
          <CardDescription>{t("settings.motionDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ReducedMotionSwitcher />
        </CardContent>
      </Card>

      <Card className="soda-cc-card">
        <CardHeader>
          <CardTitle>{t("nav.notifications")}</CardTitle>
          <CardDescription>{t("settings.notificationsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/notifications"
            className="text-sm text-soda-pink hover:underline"
          >
            {t("settings.openNotifications")}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
