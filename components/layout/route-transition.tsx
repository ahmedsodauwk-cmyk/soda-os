"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { v2Motion } from "@/lib/visual/v2";

type Phase = "enter" | "exit" | "idle";

/**
 * Motion V2 — exit then enter (~400ms total), 16px translate.
 * AppShell chrome stays mounted; only page body animates.
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const [display, setDisplay] = useState(children);
  const [phase, setPhase] = useState<Phase>("idle");
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

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
        phase === "exit" && "soda-route-exit",
        phase === "enter" && "soda-route-enter-active",
        phase === "idle" && "soda-route-idle"
      )}
    >
      {display}
    </div>
  );
}
