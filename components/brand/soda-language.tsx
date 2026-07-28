import { cn } from "@/lib/utils";
import {
  getHumanLayer,
  type HumanLayerKey,
} from "@/lib/brand/human-layer";

const sizeClass = {
  page: "text-[15px] leading-[1.75] sm:text-base sm:leading-[1.7]",
  section: "text-[15px] leading-[1.75]",
  card: "text-sm leading-[1.7] sm:text-[14px]",
  compact: "text-[14px] leading-[1.65]",
  header: "soda-founder-operational",
} as const;

export type SodaLanguageSize = keyof typeof sizeClass;

type Props = {
  /** Human Layer key — preferred. */
  layer?: HumanLayerKey;
  /** Dynamic Arabic line from live data (still Egyptian guidance voice). */
  children?: string;
  className?: string;
  size?: SodaLanguageSize;
};

/**
 * SODA Language — Egyptian Arabic guidance under English operational titles.
 * Always lang="ar" dir="rtl"; never follows UI locale switcher.
 */
export function SodaLanguage({
  layer,
  children,
  className,
  size = "section",
}: Props) {
  const text = children ?? (layer ? getHumanLayer(layer) : undefined);
  if (!text) return null;

  return (
    <p
      lang="ar"
      dir="rtl"
      className={cn(
        "font-ar whitespace-pre-line text-muted-foreground",
        sizeClass[size],
        className
      )}
    >
      {text}
    </p>
  );
}
