"use client";

import { useEffect, useState } from "react";

import { motionV3 } from "@/lib/visual/motion";

/** Subscribe to prefers-reduced-motion — SSR-safe default false. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return reduced;
}

/** CSS class names for motion surfaces — pair with globals.css. */
export const motionClasses = {
  routeTransition: "soda-route-transition",
  routeExit: "soda-route-exit",
  routeEnter: "soda-route-enter-active",
  routeIdle: "soda-route-idle",
  routeBack: "soda-route-back",
  cardInteractive: "soda-card-interactive",
  heroRotator: "soda-founder-hero-rotator",
  heroSlide: "soda-founder-hero-slide",
  creationPanel: "soda-creation-panel",
  creationDrawer: "soda-creation-drawer",
  creationOrder: "soda-creation-order",
  creationQuotation: "soda-creation-quotation",
  creationClient: "soda-creation-client",
  sidebarIndicator: "soda-sidebar-indicator",
  myWorkspaceCollapse: "soda-my-workspace-collapse",
} as const;

export { motionV3 };
