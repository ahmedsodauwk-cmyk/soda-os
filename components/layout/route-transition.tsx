"use client";

import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/lib/visual/animations";
import { motionV3 } from "@/lib/visual/motion";
import { useNavigationDirection } from "@/lib/visual/use-navigation-direction";
import { cn } from "@/lib/utils";

type Phase = "enter" | "exit" | "idle";

/**
 * Command Center route motion V3 — exit left fade (~240ms), enter from right (~580ms).
 * Sidebar + Brain rail stay mounted; only page body animates.
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const [display, setDisplay] = useState(children);
  const [phase, setPhase] = useState<Phase>("idle");
  const reducedMotion = useReducedMotion();
  const direction = useNavigationDirection();
  const goingBack = direction === "back";
  const exitTimer = useRef<number | null>(null);
  const enterTimer = useRef<number | null>(null);

  useEffect(() => {
    if (children === display) return;

    if (exitTimer.current) window.clearTimeout(exitTimer.current);
    if (enterTimer.current) window.clearTimeout(enterTimer.current);

    const nextChildren = children;

    if (reducedMotion) {
      const id = window.requestAnimationFrame(() => {
        setDisplay(nextChildren);
        setPhase("idle");
      });
      return () => window.cancelAnimationFrame(id);
    }

    const raf = window.requestAnimationFrame(() => {
      setPhase("exit");
      exitTimer.current = window.setTimeout(() => {
        setDisplay(nextChildren);
        setPhase("enter");
        enterTimer.current = window.setTimeout(
          () => setPhase("idle"),
          motionV3.routeEnterMs
        );
      }, motionV3.routeExitMs);
    });

    return () => {
      window.cancelAnimationFrame(raf);
      if (exitTimer.current) window.clearTimeout(exitTimer.current);
      if (enterTimer.current) window.clearTimeout(enterTimer.current);
    };
  }, [children, display, reducedMotion]);

  return (
    <div
      className={cn(
        "soda-route-transition",
        goingBack && "soda-route-back",
        phase === "exit" && "soda-route-exit",
        phase === "enter" && "soda-route-enter-active",
        phase === "idle" && "soda-route-idle"
      )}
    >
      {display}
    </div>
  );
}
