"use client";

import { useCallback, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import {
  REDUCED_MOTION_COOKIE,
  REDUCED_MOTION_STORAGE_KEY,
  parseReducedMotion,
  type ReducedMotionPreference,
} from "@/lib/preferences/config";
import { cn } from "@/lib/utils";

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readPreference(): ReducedMotionPreference {
  try {
    return parseReducedMotion(
      window.localStorage.getItem(REDUCED_MOTION_STORAGE_KEY)
    );
  } catch {
    return "system";
  }
}

function persistPreference(pref: ReducedMotionPreference) {
  try {
    window.localStorage.setItem(REDUCED_MOTION_STORAGE_KEY, pref);
  } catch {
    /* ignore */
  }
  document.cookie = `${REDUCED_MOTION_COOKIE}=${pref};path=/;max-age=31536000;samesite=lax`;
  document.documentElement.dataset.sodaReducedMotion = pref;
  emit();
}

const OPTIONS: { value: ReducedMotionPreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "reduce", label: "Reduce motion" },
  { value: "no-preference", label: "Full motion" },
];

export function ReducedMotionSwitcher({ className }: { className?: string }) {
  const preference = useSyncExternalStore(
    subscribe,
    readPreference,
    () => "system" as ReducedMotionPreference
  );

  const pick = useCallback((next: ReducedMotionPreference) => {
    persistPreference(next);
  }, []);

  return (
    <div
      className={cn(
        "flex overflow-hidden rounded-md border border-border",
        className
      )}
      role="group"
      aria-label="Reduced motion"
    >
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => pick(value)}
          className={cn(
            "px-2.5 py-1.5 text-xs font-medium transition-colors",
            preference === value
              ? "bg-soda-pink/15 text-foreground"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          )}
          aria-pressed={preference === value}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
