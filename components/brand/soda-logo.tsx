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
 * Keep usage sparse — sidebar / splash / documents only.
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
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- brand SVG mark */}
      <img
        src={config.src}
        alt={SODA_LOGO.alt}
        width={size}
        height={size}
        className="shrink-0 rounded-[22%]"
      />
      {withWord ? (
        <div className="min-w-0 leading-tight">
          <p className="font-heading text-sm font-semibold tracking-tight text-sidebar-foreground">
            {SODA_LOGO.productName}
          </p>
          <p className="text-[11px] tracking-wide text-muted-foreground">
            {SODA_LOGO.studioTagline}
          </p>
        </div>
      ) : null}
    </div>
  );
}
