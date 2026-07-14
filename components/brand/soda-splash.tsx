import { cn } from "@/lib/utils";
import { SodaLogo } from "@/components/brand/soda-logo";
import { SODA_LOGO } from "@/lib/brand/logo";

interface SodaSplashProps {
  className?: string;
  /** Show product lines under the mark */
  showWord?: boolean;
  label?: string;
}

/**
 * Premium boot / splash — dark + deep purple, soft glow, micro fade.
 * No spinner. No bounce. Subtle mark pulse only.
 */
export function SodaSplash({
  className,
  showWord = true,
  label,
}: SodaSplashProps) {
  return (
    <div
      className={cn(
        "soda-splash fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={label ?? "SODA is starting"}
    >
      <div className="soda-splash-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="soda-splash-fade relative flex flex-col items-center gap-5">
        <div className="soda-mark-pulse">
          <SodaLogo placement="splash" showWord={false} interactive={false} />
        </div>
        {showWord ? (
          <div className="space-y-1.5 text-center">
            <p className="font-heading text-xl font-semibold tracking-[0.2em] text-white">
              {SODA_LOGO.productName}
            </p>
            <p className="text-[11px] tracking-[0.16em] text-white/50 uppercase">
              {SODA_LOGO.systemTagline}
            </p>
          </div>
        ) : null}
        {label ? (
          <p className="sr-only">{label}</p>
        ) : null}
      </div>
    </div>
  );
}
