"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { useTheme } from "@/lib/theme/provider";
import type { Theme } from "@/lib/theme/config";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "فاتح", icon: Sun },
  { value: "dark", label: "داكن", icon: Moon },
  { value: "system", label: "النظام", icon: Monitor },
];

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn("flex overflow-hidden rounded-md border border-border", className)}
      role="group"
      aria-label="المظهر"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={cn(
            "inline-flex cursor-pointer items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors",
            theme === value
              ? "bg-soda-pink/15 text-foreground"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          )}
          aria-pressed={theme === value}
        >
          <Icon className="size-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
