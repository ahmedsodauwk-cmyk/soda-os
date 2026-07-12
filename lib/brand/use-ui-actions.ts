"use client";

import { useMemo } from "react";

import { getUiActions } from "@/lib/brand/ui-actions";
import { useI18n } from "@/lib/i18n/provider";

/** Locale-aware create/edit action labels. */
export function useUiActions() {
  const { locale } = useI18n();
  return useMemo(() => getUiActions(locale), [locale]);
}
