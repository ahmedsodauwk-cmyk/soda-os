"use client";

import { cn } from "@/lib/utils";
import { SodaLogo } from "@/components/brand/soda-logo";
import { getLoadingMessage, type LoadingKey } from "@/lib/brand/soda-voice";

interface SodaLoadingProps {
  /** Show full-screen overlay */
  open?: boolean;
  messageKey?: LoadingKey;
  className?: string;
  /** Compact inline loader (no overlay) */
  inline?: boolean;
}

/**
 * Branded loading — official mark + soft pulse (no spinner).
 */
export function SodaLoading({
  open = true,
  messageKey = "default",
  className,
  inline = false,
}: SodaLoadingProps) {
  if (!open) return null;

  const message = getLoadingMessage(messageKey);

  if (inline) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 py-10",
          className
        )}
        role="status"
        aria-live="polite"
      >
        <div className="soda-mark-pulse">
          <SodaLogo placement="splash" showWord={false} interactive={false} />
        </div>
        <p className="font-ar text-sm text-muted-foreground" dir="rtl">
          {message}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "soda-splash fixed inset-0 z-50 flex flex-col items-center justify-center gap-5",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="soda-splash-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="soda-splash-fade relative flex flex-col items-center gap-4">
        <div className="soda-mark-pulse">
          <SodaLogo placement="splash" showWord={false} interactive={false} />
        </div>
        <p className="font-ar text-sm tracking-wide text-white/55" dir="rtl">
          {message}
        </p>
      </div>
    </div>
  );
}
