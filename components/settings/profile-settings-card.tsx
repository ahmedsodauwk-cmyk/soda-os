"use client";

import Link from "next/link";

import { ProfilePhotoEditor } from "@/components/settings/profile-photo-editor";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";

type ProfileSettingsCardProps = {
  userId: string;
  displayName: string;
  avatarInitials: string;
  avatarUrl?: string | null;
  jobTitle?: string;
  personId?: string;
  fallbackName: string;
};

export function ProfileSettingsCard({
  userId,
  displayName,
  avatarInitials,
  avatarUrl,
  jobTitle,
  personId,
  fallbackName,
}: ProfileSettingsCardProps) {
  const { t } = useI18n();

  return (
    <Card className="soda-cc-card">
      <CardHeader>
        <CardTitle>{t("settings.myProfile")}</CardTitle>
        <CardDescription>{t("settings.profileDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        {personId ? (
          <ProfilePhotoEditor
            key={`${avatarUrl ?? ""}|${displayName}`}
            userId={userId}
            displayName={displayName}
            avatarInitials={avatarInitials}
            avatarUrl={avatarUrl}
            jobTitle={jobTitle}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("settings.profileNoPerson")}{" "}
            <span className="font-medium text-foreground">{fallbackName}</span>
          </p>
        )}
        {personId ? (
          <p className="mt-4 text-xs text-muted-foreground">
            {t("settings.profileCrewLink")}:{" "}
            <Link
              href={`/people/${personId}`}
              className="text-soda-pink hover:underline"
            >
              /people/{personId}
            </Link>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
