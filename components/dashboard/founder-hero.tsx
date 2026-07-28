"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  buildHeroOperationalLines,
  getHeroGreetingParts,
  type HeroOperationalLine,
} from "@/lib/dashboard/hero-summary";
import type { DashboardVoiceInput } from "@/lib/brand/types";
import { useReducedMotion } from "@/lib/visual/animations";
import { motionV3 } from "@/lib/visual/motion";
import { cn } from "@/lib/utils";

type HeroPhase = "greeting" | "brief";

interface FounderHeroProps {
  dashboard: DashboardVoiceInput;
  operatorName?: string | null;
}

/** Bold Eastern-Arabic numerals and key counts in operational lines. */
function OperationalLineText({ text }: { text: string }) {
  const parts = text.split(/(\d+[\u0660-\u0669\u06F0-\u06F9]*)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^\d/.test(part) ? (
          <strong key={i} className="font-bold text-foreground">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function GreetingView({
  prefix,
  name,
  emoji,
  reducedMotion,
}: {
  prefix: string;
  name: string;
  emoji: string;
  reducedMotion: boolean;
}) {
  const full = `${prefix}${name}`;
  const [typedLen, setTypedLen] = useState(reducedMotion ? full.length : 0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (reducedMotion || startedRef.current) return;
    startedRef.current = true;
    let i = 0;
    const step = Math.max(1, Math.floor(full.length / 16));
    const id = window.setInterval(() => {
      i += step;
      if (i >= full.length) {
        setTypedLen(full.length);
        window.clearInterval(id);
      } else {
        setTypedLen(i);
      }
    }, 30);
    return () => window.clearInterval(id);
  }, [full, reducedMotion]);

  const visible = full.slice(0, typedLen);
  const showEmoji = typedLen >= full.length;

  return (
    <h1
      id="founder-command-greeting"
      lang="ar"
      dir="rtl"
      className="soda-founder-greeting font-ar min-w-0 font-bold leading-tight tracking-tight text-foreground"
    >
      <span className="soda-founder-greeting-prefix">{visible}</span>
      {showEmoji ? (
        <span className="soda-founder-greeting-emoji" aria-hidden>
          {emoji}
        </span>
      ) : null}
    </h1>
  );
}

function BriefView({ lines }: { lines: HeroOperationalLine[] }) {
  return (
    <div
      lang="ar"
      dir="rtl"
      className="soda-founder-operational font-ar space-y-1.5 text-muted-foreground"
      aria-label="ملخص تشغيلي"
    >
      <p className="text-xs font-semibold tracking-wide text-foreground/70 uppercase">
        ملخص اليوم
      </p>
      <ul className="list-none space-y-1">
        {lines.map((line) => (
          <li key={line.href + line.text}>
            <Link
              href={line.href}
              className="block rounded-md transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span aria-hidden className="me-1.5 text-soda-pink">
                •
              </span>
              <OperationalLineText text={line.text} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Rotating founder hero — greeting ↔ operational brief, fixed height. */
export function FounderHero({ dashboard, operatorName }: FounderHeroProps) {
  const reducedMotion = useReducedMotion();
  const lines = buildHeroOperationalLines(dashboard);
  const { prefix, name, emoji } = getHeroGreetingParts(
    new Date(),
    operatorName
  );

  const [phase, setPhase] = useState<HeroPhase>(
    reducedMotion ? "brief" : "greeting"
  );
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const swapTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (swapTimerRef.current) {
      window.clearTimeout(swapTimerRef.current);
      swapTimerRef.current = null;
    }
  }, []);

  const scheduleNext = useCallback(() => {
    clearTimers();
    if (paused || reducedMotion) return;

    const duration =
      phase === "greeting" ? motionV3.heroGreetingMs : motionV3.heroBriefMs;

    timerRef.current = window.setTimeout(() => {
      setVisible(false);
      swapTimerRef.current = window.setTimeout(() => {
        setPhase((p) => (p === "greeting" ? "brief" : "greeting"));
        setVisible(true);
      }, motionV3.heroTransitionMs / 2);
    }, duration);
  }, [phase, paused, reducedMotion, clearTimers]);

  useEffect(() => {
    scheduleNext();
    return clearTimers;
  }, [phase, paused, reducedMotion, scheduleNext, clearTimers]);

  useEffect(() => {
    const onVisibility = () => {
      setPaused(document.hidden);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <header
      aria-labelledby="founder-command-greeting"
      className="soda-founder-header soda-founder-hero-rotator min-w-0 flex-1"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setPaused(false);
        }
      }}
    >
      <div
        className={cn(
          "soda-founder-hero-slide relative min-h-[4.5rem]",
          !visible && "soda-founder-hero-slide-exit",
          visible && "soda-founder-hero-slide-enter"
        )}
      >
        {reducedMotion || phase === "brief" ? (
          <BriefView lines={lines} />
        ) : (
          <GreetingView
            prefix={prefix}
            name={name}
            emoji={emoji}
            reducedMotion={reducedMotion}
          />
        )}
      </div>
    </header>
  );
}
