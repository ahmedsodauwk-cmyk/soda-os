"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const EXIT_MS = 130;
const ENTER_MS = 220;

type Phase = "enter" | "exit" | "idle";

/**
 * Soft route transition — exit 100–160ms, enter 180–260ms, 8–14px translate.
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
    }, EXIT_MS);

    return () => window.clearTimeout(timer);
  }, [children, display]);

  useEffect(() => {
    if (phase !== "enter") return;
    const timer = window.setTimeout(() => setPhase("idle"), ENTER_MS);
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
