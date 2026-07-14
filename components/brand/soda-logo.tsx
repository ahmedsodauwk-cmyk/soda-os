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
  /** Enable subtle hover glow (interactive chrome only) */
  interactive?: boolean;
}

/**
 * Official SODA mark — PNG identity only (never redrawn).
 * next/image; priority for sidebar + login. Proportions locked via object-contain.
 */
export function SodaLogo({
  placement = "sidebar",
  className,
  showWord,
  interactive = placement === "sidebar",
}: SodaLogoProps) {
  const config = SODA_LOGO_PLACEMENTS[placement];
  const size = config.size;
  const withWord = showWord ?? config.showWord ?? false;
  const priority = placement === "sidebar" || placement === "login";
  const wordMode = config.wordMode ?? "studio";

  return (
    <div
      className={cn(
        "flex items-center gap-2.5",
        interactive && "soda-logo-interactive group",
        className
      )}
    >
      <Image
        src={config.src}
        alt={SODA_LOGO.alt}
        width={size}
        height={size}
        priority={priority}
        className={cn(
          "aspect-square shrink-0 object-contain object-center",
          placement === "empty" && "opacity-40",
          interactive && "soda-logo-mark transition-[filter] duration-300"
        )}
        style={{ width: size, height: size, maxWidth: size, maxHeight: size }}
        draggable={false}
      />
      {withWord ? (
        <div className="min-w-0 leading-tight">
          <p
            className={cn(
              "font-heading font-semibold tracking-tight text-sidebar-foreground",
              placement === "sidebar" ? "text-[0.875rem]" : "text-[0.9375rem]"
            )}
          >
            {SODA_LOGO.productName}
          </p>
          <p
            className={cn(
              "mt-0.5 tracking-[0.12em] uppercase",
              wordMode === "system"
                ? "text-[10px] text-white/55 normal-case tracking-[0.08em]"
                : "text-[10px] text-soda-pink/80"
            )}
          >
            {wordMode === "system"
              ? SODA_LOGO.systemTagline
              : SODA_LOGO.studioTagline}
          </p>
        </div>
      ) : null}
    </div>
  );
}
