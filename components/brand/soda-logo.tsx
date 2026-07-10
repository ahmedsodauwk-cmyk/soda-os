import { cn } from "@/lib/utils";
import {
  SODA_LOGO,
  SODA_LOGO_PLACEMENTS,
  type SodaLogoPlacement,
} from "@/lib/brand/logo";

interface SodaLogoProps {
  placement?: SodaLogoPlacement;
  className?: string;
  /** Override showWord from placement defaults */
  showWord?: boolean;
}

/**
 * Official SODA mark. Prefer this over ad-hoc Camera icons.
 * Keep usage sparse — sidebar / splash / documents / empty only.
 */
export function SodaLogo({
  placement = "sidebar",
  className,
  showWord,
}: SodaLogoProps) {
  const config = SODA_LOGO_PLACEMENTS[placement];
  const size = config.size;
  const withWord = showWord ?? config.showWord ?? false;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- brand SVG mark */}
      <img
        src={config.src}
        alt={SODA_LOGO.alt}
        width={size}
        height={size}
        className={cn(
          "shrink-0 rounded-[22%] shadow-[0_0_24px_color-mix(in_oklch,var(--soda-purple)_35%,transparent)]",
          placement === "empty" && "opacity-40 shadow-none"
        )}
      />
      {withWord ? (
        <div className="min-w-0 leading-tight">
          <p className="font-heading text-[0.9375rem] font-semibold tracking-tight text-sidebar-foreground">
            {SODA_LOGO.productName}
          </p>
          <p className="mt-0.5 text-[11px] tracking-[0.12em] text-soda-pink/80 uppercase">
            {SODA_LOGO.studioTagline}
          </p>
        </div>
      ) : null}
    </div>
  );
}
