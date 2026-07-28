/**
 * SODA OS Visual System V2 — design token constants.
 * Runtime theme lives in `app/globals.css`; this file is the TS mirror for components.
 */

import { motionV3 } from "@/lib/visual/motion";

/** @deprecated Prefer `motionV3` from `@/lib/visual/motion` — kept for verify scripts. */
export const v2Motion = {
  routeExitMs: motionV3.routeExitMs,
  routeEnterMs: motionV3.routeEnterMs,
  cardStaggerMs: 45,
  hoverMs: motionV3.cardHoverMs,
  pressMs: motionV3.cardPressMs,
  sidebarIndicatorMs: motionV3.sidebarIndicatorMs,
  creationOrderMs: motionV3.creationOrderMs,
  creationQuotationMs: motionV3.creationQuotationMs,
  creationClientMs: motionV3.creationClientMs,
  ease: motionV3.ease,
} as const;

export const v2Typography = {
  greeting: "text-[clamp(1.875rem,2.8vw,2.25rem)] font-bold leading-tight",
  heading: "text-xl font-bold tracking-tight sm:text-2xl",
  cardTitle: "text-base font-semibold leading-snug sm:text-[17px]",
  body: "text-[15px] leading-relaxed sm:text-base",
  button: "text-[15px] font-semibold",
  metadata: "text-sm text-muted-foreground",
} as const;

export const v2Radius = {
  card: "rounded-xl",
  button: "rounded-lg",
  input: "rounded-lg",
} as const;

export const v2Spacing = {
  page: "p-4 sm:p-5 lg:p-6",
  card: "p-4",
  section: "space-y-4",
} as const;

/** CSS class for staggered card entrance — pairs with globals.css `.soda-stagger-children` */
export const v2StaggerClass = "soda-stagger-children";

/** CSS class for route/page entrance */
export const v2RouteEnterClass = "soda-route-enter";