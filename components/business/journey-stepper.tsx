import { Check } from "lucide-react";

import {
  JOURNEY_STAGES,
  JOURNEY_STAGE_LABELS,
  type JourneyStage,
} from "@/lib/journey/types";
import { cn } from "@/lib/utils";

interface JourneyStepperProps {
  current: JourneyStage;
  className?: string;
  compact?: boolean;
}

export function JourneyStepper({
  current,
  className,
  compact = false,
}: JourneyStepperProps) {
  const currentIndex = JOURNEY_STAGES.indexOf(current);

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Project journey
          </p>
          <p className="font-heading mt-1 text-lg font-semibold tracking-tight">
            {JOURNEY_STAGE_LABELS[current]}
          </p>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {currentIndex + 1}/{JOURNEY_STAGES.length}
        </p>
      </div>
      <ol
        className={cn(
          "grid gap-1.5",
          compact
            ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6"
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6"
        )}
      >
        {JOURNEY_STAGES.map((stage, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <li
              key={stage}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs",
                done && "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
                active &&
                  "border-soda-pink/40 bg-soda-pink/10 text-soda-pink shadow-[inset_0_0_20px_color-mix(in_oklch,var(--soda-pink)_12%,transparent)]",
                !done &&
                  !active &&
                  "border-border/60 bg-muted/20 text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                  done && "bg-emerald-500/20",
                  active && "bg-soda-pink/20",
                  !done && !active && "bg-muted/40"
                )}
              >
                {done ? <Check className="size-3" /> : index + 1}
              </span>
              <span className="truncate font-medium">
                {JOURNEY_STAGE_LABELS[stage]}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
