"use client";

import { Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LOCALE_FLAGS,
  LOCALE_LABELS,
  LOCALES,
  type Locale,
} from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
  /** Visual density for header vs login vs settings. */
  variant?: "icon" | "button" | "inline";
  className?: string;
  align?: "start" | "center" | "end";
};

export function LanguageSwitcher({
  variant = "icon",
  className,
  align = "end",
}: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();

  function pick(next: Locale) {
    if (next === locale) return;
    setLocale(next);
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2", className)} role="group">
        <span className="text-xs text-muted-foreground">
          {t("common.language")}
        </span>
        <div className="flex overflow-hidden rounded-md border border-border">
          {LOCALES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => pick(code)}
              className={cn(
                "px-2.5 py-1.5 text-xs font-medium transition-colors",
                locale === code
                  ? "bg-soda-pink/15 text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
              aria-pressed={locale === code}
            >
              {LOCALE_FLAGS[code]} {LOCALE_LABELS[code]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          variant === "button" ? (
            <Button variant="outline" size="sm" className={cn("gap-2", className)} />
          ) : (
            <Button variant="ghost" size="icon-sm" className={className} />
          )
        }
      >
        {variant === "button" ? (
          <>
            <Languages className="size-3.5" />
            <span>
              {LOCALE_FLAGS[locale]} {LOCALE_LABELS[locale]}
            </span>
          </>
        ) : (
          <>
            <Languages className="size-4" />
            <span className="sr-only">{t("common.language")}</span>
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        <DropdownMenuLabel>{t("common.language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LOCALES.map((code) => (
          <DropdownMenuItem
            key={code}
            onClick={() => pick(code)}
            className={cn(locale === code && "bg-accent")}
          >
            <span className="mr-2">{LOCALE_FLAGS[code]}</span>
            {LOCALE_LABELS[code]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
