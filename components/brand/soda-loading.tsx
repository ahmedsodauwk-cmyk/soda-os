"use client";

import { cn } from "@/lib/utils";
import { SodaLogo } from "@/components/brand/soda-logo";
import { SodaSplash } from "@/components/brand/soda-splash";
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
 * Full-screen uses the splash shell; inline keeps a quiet mark.
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
    <div className={className}>
      <SodaSplash showWord label={message} />
      <p
        className="pointer-events-none fixed inset-x-0 bottom-[max(2.5rem,env(safe-area-inset-bottom))] z-[101] text-center font-ar text-sm tracking-wide text-white/55"
        dir="rtl"
        aria-hidden
      >
        {message}
      </p>
    </div>
  );
}
