"use client";

import type { AccessLevel } from "@/lib/identity/access-levels";
import { useI18n } from "@/lib/i18n/provider";
import { accessLevelLabel } from "@/lib/i18n/access-levels";
import type { SodaRole } from "@/lib/identity/roles";
import { roleLabel } from "@/lib/i18n/roles";

export function ScopePanel({
  accessLevel,
  role,
  permissions,
}: {
  accessLevel: AccessLevel;
  role: SodaRole;
  permissions: readonly string[];
}) {
  const { t, locale } = useI18n();

  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="text-muted-foreground">{t("settings.accessLevel")}</p>
        <p className="font-medium">{accessLevelLabel(locale, accessLevel)}</p>
      </div>
      <div>
        <p className="text-muted-foreground">{t("settings.jobTitleDisplay")}</p>
        <p className="font-medium">{roleLabel(locale, role)}</p>
      </div>
      <div>
        <p className="mb-2 text-muted-foreground">{t("settings.permissions")}</p>
        <ul className="grid gap-1 sm:grid-cols-2">
          {permissions.map((p) => (
            <li
              key={p}
              className="rounded-md bg-muted/40 px-2 py-1 font-mono text-xs"
            >
              {p}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-muted-foreground">{t("settings.scopeFootnote")}</p>
    </div>
  );
}
