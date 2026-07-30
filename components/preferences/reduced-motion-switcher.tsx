"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  REDUCED_MOTION_COOKIE,
  REDUCED_MOTION_STORAGE_KEY,
  effectiveReducedMotion,
  parseReducedMotion,
  type ReducedMotionPreference,
} from "@/lib/preferences/config";
import { useI18n } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionaries";
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

function applyMotionDom(pref: ReducedMotionPreference) {
  const sys = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reduce = effectiveReducedMotion(pref, sys);
  document.documentElement.dataset.sodaReducedMotion = pref;
  document.documentElement.classList.toggle("soda-reduce-motion", reduce);
  document.documentElement.classList.toggle("soda-full-motion", pref === "no-preference");
}

function persistPreference(pref: ReducedMotionPreference) {
  try {
    window.localStorage.setItem(REDUCED_MOTION_STORAGE_KEY, pref);
  } catch {
    /* ignore */
  }
  document.cookie = `${REDUCED_MOTION_COOKIE}=${pref};path=/;max-age=31536000;samesite=lax`;
  applyMotionDom(pref);
  emit();
}

const OPTION_KEYS: { value: ReducedMotionPreference; labelKey: DictKey }[] = [
  { value: "system", labelKey: "settings.motionSystem" },
  { value: "reduce", labelKey: "settings.motionReduce" },
  { value: "no-preference", labelKey: "settings.motionFull" },
];

export function ReducedMotionSwitcher({ className }: { className?: string }) {
  const { t } = useI18n();
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
      aria-label={t("settings.motionTitle")}
    >
      {OPTION_KEYS.map(({ value, labelKey }) => (
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
          {t(labelKey)}
        </button>
      ))}
    </div>
  );
}
