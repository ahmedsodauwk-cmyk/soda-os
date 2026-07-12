import { cn } from "@/lib/utils";
import type { SodaSectionPersonality } from "@/lib/brand/tokens";

interface PageAtmosphereProps {
  section?: SodaSectionPersonality;
  className?: string;
}

/**
 * Per-route lighting composition — soft blurred brand glows.
 * Positions/intensities come from `[data-soda-section]` CSS vars.
 */
export function PageAtmosphere({
  section = "default",
  className,
}: PageAtmosphereProps) {
  return (
    <div
      className={cn("soda-atmosphere", className)}
      data-soda-atmosphere={section}
      aria-hidden
    >
      <div className="soda-atmosphere-side" />
    </div>
  );
}
