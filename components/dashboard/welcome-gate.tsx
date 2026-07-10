"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  SODA_LAST_VISIT_KEY,
  getTodayVisitKey,
  resolveWelcomeMode,
  type DashboardVoiceInput,
  type WelcomeMode,
} from "@/lib/brand";

/** Session-stable welcome mode — read once, mark visit in effect. */
let sessionWelcomeMode: WelcomeMode | undefined;

function readWelcomeMode(): WelcomeMode {
  if (sessionWelcomeMode !== undefined) return sessionWelcomeMode;
  try {
    sessionWelcomeMode = resolveWelcomeMode(
      window.localStorage.getItem(SODA_LAST_VISIT_KEY)
    );
  } catch {
    sessionWelcomeMode = "command_center";
  }
  return sessionWelcomeMode;
}

function subscribeWelcome() {
  return () => {};
}

function useWelcomeMode(): WelcomeMode | null {
  return useSyncExternalStore(
    subscribeWelcome,
    readWelcomeMode,
    () => null
  );
}

interface WelcomeGateProps {
  dashboard: DashboardVoiceInput;
  children: React.ReactNode;
}

/**
 * Marks last visit for Experience v1.0.
 * Dense Morning Brief overlay removed — always-visible DashboardHero is primary.
 * First-visit / welcome-back still record mode for future light touches.
 */
export function WelcomeGate({ children }: WelcomeGateProps) {
  useWelcomeMode();

  useEffect(() => {
    try {
      window.localStorage.setItem(SODA_LAST_VISIT_KEY, getTodayVisitKey());
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  return (
    <div id="command-core" className="scroll-mt-24">
      {children}
    </div>
  );
}
