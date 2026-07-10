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
 * Branded loading — subtle mark pulse + Arabic whisper.
 * Usable app-wide as overlay or inline.
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
      >
        <SodaLogo placement="splash" showWord={false} className="soda-mark-pulse" />
        <p className="font-ar text-sm text-muted-foreground" dir="rtl">
          {message}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center gap-4",
        "bg-background/80 backdrop-blur-sm",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <SodaLogo placement="splash" showWord={false} className="soda-mark-pulse" />
      <p className="font-ar text-sm tracking-wide text-muted-foreground" dir="rtl">
        {message}
      </p>
    </div>
  );
}
