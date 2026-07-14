import { SodaLogo } from "@/components/brand/soda-logo";

interface PeopleEmptyStateProps {
  title: string;
  detail: string;
  hint?: string;
}

/**
 * Honest empty surface for People OS — never invents members or metrics.
 */
export function PeopleEmptyState({
  title,
  detail,
  hint,
}: PeopleEmptyStateProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-border/70 bg-gradient-to-br from-background via-background to-primary/[0.04] px-5 py-8 sm:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -left-8 size-40 rounded-full bg-primary/8 blur-3xl"
      />
      <div className="relative flex max-w-lg flex-col gap-3">
        <SodaLogo placement="empty" showWord={false} />
        <h3 className="font-heading text-lg font-semibold tracking-tight">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{detail}</p>
        {hint ? <p className="text-xs text-muted-foreground/90">{hint}</p> : null}
      </div>
    </div>
  );
}
