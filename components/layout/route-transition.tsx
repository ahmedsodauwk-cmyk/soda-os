"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { v2Motion } from "@/lib/visual/v2";

type Phase = "enter" | "exit" | "idle";

/**
 * Command Center route motion — exit left fade, enter from right (~650ms).
 * Sidebar + Brain rail stay mounted; only page body animates.
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [display, setDisplay] = useState(children);
  const [phase, setPhase] = useState<Phase>("idle");
  const [goingBack, setGoingBack] = useState(false);
  const reducedMotion = useRef(false);
  const historyIdx = useRef(0);

  useEffect(() => {
    reducedMotion.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const current = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    setGoingBack(current < historyIdx.current);
    historyIdx.current = current;
  }, [pathname]);

  useEffect(() => {
    if (children === display) return;

    if (reducedMotion.current) {
      setDisplay(children);
      setPhase("idle");
      return;
    }

    setPhase("exit");
    const timer = window.setTimeout(() => {
      setDisplay(children);
      setPhase("enter");
    }, v2Motion.routeExitMs);

    return () => window.clearTimeout(timer);
  }, [children, display]);

  useEffect(() => {
    if (phase !== "enter") return;
    const timer = window.setTimeout(
      () => setPhase("idle"),
      v2Motion.routeEnterMs
    );
    return () => window.clearTimeout(timer);
  }, [phase]);

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
