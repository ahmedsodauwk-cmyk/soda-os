/**
 * SODA MOTION V3 — timing tokens for route, hero, cards, drawers, sidebar.
 * CSS mirror lives in `app/globals.css` (--soda-duration-* variables).
 */

export const motionV3 = {
  /** Route exit phase — 220–260ms target */
  routeExitMs: 240,
  /** Route enter phase — 540–620ms target */
  routeEnterMs: 580,
  /** Combined route transition — ~820ms */
  routeTotalMs: 820,

  cardHoverMs: 260,
  cardPressMs: 140,
  cardLiftPx: 3,

  sidebarIndicatorMs: 450,
  myWorkspaceMs: 370,

  heroTransitionMs: 675,
  heroGreetingMs: 3750,
  heroBriefMs: 5500,

  creationOrderMs: 720,
  creationQuotationMs: 660,
  creationClientMs: 585,

  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
  routeExitTranslatePx: 27,
  routeEnterTranslatePx: 34,
} as const;

export type MotionV3 = typeof motionV3;
