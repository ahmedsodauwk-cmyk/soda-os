import Image from "next/image";

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
 * Official SODA mark — extracted white geometric symbol (never redrawn).
 * next/image; priority only for sidebar + login (Mission 06.0 Phase 11).
 */
export function SodaLogo({
  placement = "sidebar",
  className,
  showWord,
}: SodaLogoProps) {
  const config = SODA_LOGO_PLACEMENTS[placement];
  const size = config.size;
  const withWord = showWord ?? config.showWord ?? false;
  const priority = placement === "sidebar" || placement === "login";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src={config.src}
        alt={SODA_LOGO.alt}
        width={size}
        height={size}
        priority={priority}
        className={cn(
          "aspect-square shrink-0 object-contain object-center",
          !config.onDark && "rounded-[22%]",
          placement === "empty" && "opacity-40"
        )}
        style={{ width: size, height: size }}
        draggable={false}
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
