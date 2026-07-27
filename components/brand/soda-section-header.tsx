import { cn } from "@/lib/utils";
import type { HumanLayerKey } from "@/lib/brand/human-layer";
import { SodaLanguage, type SodaLanguageSize } from "@/components/brand/soda-language";

const titleSizeClass = {
  page: "text-xl font-bold tracking-tight sm:text-2xl",
  section: "text-lg font-bold tracking-tight sm:text-[1.25rem]",
  card: "text-base font-semibold leading-snug sm:text-[17px]",
  compact: "text-sm font-semibold",
} as const;

export type SodaSectionSize = keyof typeof titleSizeClass;

type Props = {
  /** English operational title. */
  title: string;
  layer?: HumanLayerKey;
  /** Dynamic Arabic guidance from live data. */
  guidance?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "div";
  size?: SodaSectionSize;
  className?: string;
  titleClassName?: string;
  guidanceClassName?: string;
  guidanceSize?: SodaLanguageSize;
  /** Hide guidance on very small screens when space is tight. */
  hideGuidance?: boolean;
};

/** English title + SODA Language Arabic guidance block. */
export function SodaSectionHeader({
  title,
  layer,
  guidance,
  as: Tag = "h2",
  size = "section",
  className,
  titleClassName,
  guidanceClassName,
  guidanceSize,
  hideGuidance = false,
}: Props) {
  const guidanceSizeResolved =
    guidanceSize ?? (size === "card" ? "card" : size === "compact" ? "compact" : "section");

  return (
    <div className={cn("min-w-0 space-y-0.5", className)}>
      <Tag className={cn("font-heading text-foreground", titleSizeClass[size], titleClassName)}>
        {title}
      </Tag>
      {!hideGuidance ? (
        <SodaLanguage
          layer={layer}
          size={guidanceSizeResolved}
          className={guidanceClassName}
        >
          {guidance}
        </SodaLanguage>
      ) : null}
    </div>
  );
}
