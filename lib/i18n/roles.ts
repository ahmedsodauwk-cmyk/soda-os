import type { Locale } from "@/lib/i18n/config";
import { ROLE_LABELS, type SodaRole } from "@/lib/identity/roles";

const AR_ROLE_LABELS: Partial<Record<SodaRole, string>> = {
  owner: "مالك",
  admin: "مدير",
  crew_member: "عضو فريق",
  photo_editor: "مونتير صور",
  video_editor: "مونتير فيديو",
  photographer: "مصور",
  videographer: "مصور فيديو",
};

export function roleLabel(locale: Locale, role: SodaRole): string {
  if (locale === "ar" && AR_ROLE_LABELS[role]) {
    return AR_ROLE_LABELS[role]!;
  }
  return ROLE_LABELS[role] ?? role;
}
