import type { LucideIcon } from "lucide-react";

import { SodaLanguage } from "@/components/brand/soda-language";
import type { HumanLayerKey } from "@/lib/brand/human-layer";
import { cn } from "@/lib/utils";

type Props = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  layer?: HumanLayerKey;
  className?: string;
  children?: React.ReactNode;
};

/** Branded empty / zero-data state — English title + optional SODA Language guidance. */
export function SodaEmptyState({
  icon: Icon,
  title,
  description,
  layer,
  className,
  children,
}: Props) {
  return (
    <div
      className={cn(
        "soda-empty-state flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/40 px-6 py-10 text-center",
        className
      )}
    >
      {Icon ? (
        <div className="soda-kpi-icon mb-3 flex size-12 items-center justify-center rounded-xl">
          <Icon className="size-5 opacity-70" aria-hidden />
        </div>
      ) : null}
      <p className="text-[15px] font-semibold text-foreground sm:text-base">
        {title}
      </p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {layer ? (
        <SodaLanguage layer={layer} size="compact" className="mt-2 max-w-md" />
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
