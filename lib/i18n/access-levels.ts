import type { Locale } from "@/lib/i18n/config";
import type { AccessLevel } from "@/lib/identity/access-levels";

const LABELS: Record<Locale, Record<AccessLevel, string>> = {
  en: {
    founder: "Founder",
    account_manager: "Account Manager",
    team_leader: "Team Leader",
    team: "Team",
  },
  ar: {
    founder: "المؤسس",
    account_manager: "مدير حساب",
    team_leader: "قائد فريق",
    team: "فريق",
  },
};

export function accessLevelLabel(locale: Locale, level: AccessLevel): string {
  return LABELS[locale][level] ?? LABELS.en[level];
}
