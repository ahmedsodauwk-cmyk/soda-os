import { cn } from "@/lib/utils";
import { PageAtmosphere } from "@/components/brand/page-atmosphere";
import { SodaLogo } from "@/components/brand/soda-logo";
import { SODA_LOGO } from "@/lib/brand/logo";

interface SodaSplashProps {
  className?: string;
  /** Show product lines under the mark */
  showWord?: boolean;
  label?: string;
}

/**
 * Premium boot / splash — SODA page background, transparent mark shell.
 * No spinner. Subtle opacity pulse only (prefers-reduced-motion safe).
 */
export function SodaSplash({
  className,
  showWord = true,
  label,
}: SodaSplashProps) {
  return (
    <div
      className={cn("soda-loading-viewport", className)}
      role="status"
      aria-live="polite"
      aria-label={label ?? "SODA is starting"}
    >
      <PageAtmosphere section="home" />
      <div className="soda-splash-fade relative z-[1] flex flex-col items-center gap-5 px-4">
        <div className="soda-mark-pulse">
          <SodaLogo placement="splash" showWord={false} interactive={false} />
        </div>
        {showWord ? (
          <div className="space-y-1.5 text-center">
            <p className="font-heading text-xl font-semibold tracking-[0.2em] text-foreground sm:text-2xl">
              {SODA_LOGO.productName}
            </p>
            <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
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
