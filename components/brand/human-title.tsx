import { cn } from "@/lib/utils";
import {
  getHumanLayer,
  type HumanLayerKey,
} from "@/lib/brand/human-layer";

type TitleTag = "h1" | "h2" | "h3" | "h4" | "p" | "div";

const titleSizeClass = {
  page: "font-heading text-xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]",
  section: "font-heading text-base font-semibold tracking-tight text-foreground",
  card: "text-base font-semibold leading-none tracking-tight",
  compact: "text-sm font-medium text-muted-foreground",
} as const;

const explanationSizeClass = {
  page: "font-ar max-w-xl text-[0.9375rem] leading-[1.85] whitespace-pre-line text-muted-foreground sm:text-base sm:leading-[1.8]",
  section:
    "font-ar text-[0.9375rem] leading-[1.8] text-muted-foreground",
  card: "font-ar text-[0.9375rem] leading-[1.8] text-muted-foreground",
  compact: "font-ar text-[13px] leading-[1.75] text-muted-foreground",
} as const;

export type HumanTitleSize = keyof typeof titleSizeClass;

interface HumanExplanationProps {
  /** Human Layer key — preferred. */
  layer?: HumanLayerKey;
  /** Override / one-off Arabic line when no key fits. */
  children?: string;
  className?: string;
  size?: HumanTitleSize;
}

/** One muted Egyptian Arabic business line (`.font-ar`, RTL). */
export function HumanExplanation({
  layer,
  children,
  className,
  size = "section",
}: HumanExplanationProps) {
  const text = children ?? (layer ? getHumanLayer(layer) : undefined);
  if (!text) return null;

  return (
    <p
      className={cn(explanationSizeClass[size], className)}
      dir="rtl"
    >
      {text}
    </p>
  );
}

interface HumanTitleProps {
  /** English title — official system language. */
  title: string;
  /** Human Layer key for the Arabic explanation. */
  layer?: HumanLayerKey;
  /** Override Arabic line. */
  explanation?: string;
  as?: TitleTag;
  size?: HumanTitleSize;
  className?: string;
  titleClassName?: string;
  explanationClassName?: string;
}

/**
 * SODA Side Language title block:
 * UI-language title (primary) + Egyptian Arabic Side Language (always).
 */
export function HumanTitle({
  title,
  layer,
  explanation,
  as: Tag = "h2",
  size = "section",
  className,
  titleClassName,
  explanationClassName,
}: HumanTitleProps) {
  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      <Tag className={cn(titleSizeClass[size], titleClassName)}>{title}</Tag>
      <HumanExplanation
        layer={layer}
        size={size}
        className={explanationClassName}
      >
        {explanation}
      </HumanExplanation>
    </div>
  );
}
