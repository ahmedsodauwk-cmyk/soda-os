"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionaries";

const PERSONAL_ITEMS: { href: string; labelKey: DictKey }[] = [
  { href: "/settings/profile", labelKey: "settings.myProfile" },
  { href: "/settings/account", labelKey: "settings.accountSecurity" },
  { href: "/settings/scope", labelKey: "settings.myScope" },
  { href: "/settings/preferences", labelKey: "settings.myPreferences" },
];

export function SettingsHubNav({
  showSystem,
  className,
}: {
  showSystem?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const { t } = useI18n();

  const items = [
    ...PERSONAL_ITEMS,
    ...(showSystem
      ? [{ href: "/settings/system", labelKey: "settings.systemSettings" as DictKey }]
      : []),
  ];

  return (
    <nav
      className={cn(
        "flex flex-wrap gap-2 border-b border-border/60 pb-3",
        className
      )}
      aria-label={t("settings.hubTitle")}
    >
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href === "/settings/profile" && pathname === "/settings");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-soda-pink/15 text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
            aria-current={active ? "page" : undefined}
          >
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
