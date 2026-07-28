import { cn } from "@/lib/utils";

/** SODA skeleton primitives — Mission 06.0 Phase 07. No blank screens. */

function SkeletonPulse({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/60 dark:bg-muted/40",
        className
      )}
      {...props}
    />
  );
}

export function SkeletonStat({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "space-y-3 rounded-xl border border-border/50 bg-card/40 p-4",
        className
      )}
    >
      <SkeletonPulse className="h-3 w-24" />
      <SkeletonPulse className="h-8 w-32" />
      <SkeletonPulse className="h-3 w-16" />
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "space-y-3 rounded-xl border border-border/50 bg-card/40 p-4",
        className
      )}
    >
      <SkeletonPulse className="h-4 w-40" />
      <SkeletonPulse className="h-3 w-full" />
      <SkeletonPulse className="h-3 w-5/6 max-w-[85%]" />
      <SkeletonPulse className="mt-2 h-24 w-full rounded-lg" />
    </div>
  );
}

export function SkeletonTable({
  rows = 6,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/50 bg-card/40",
        className
      )}
    >
      <div className="flex gap-3 border-b border-border/40 px-4 py-3">
        <SkeletonPulse className="h-3 w-24" />
        <SkeletonPulse className="h-3 w-32" />
        <SkeletonPulse className="h-3 w-20" />
        <SkeletonPulse className="ms-auto h-3 w-16" />
      </div>
      <div className="divide-y divide-border/30">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <SkeletonPulse className="h-3 w-28" />
            <SkeletonPulse className="h-3 w-36" />
            <SkeletonPulse className="h-3 w-20" />
            <SkeletonPulse className="ms-auto h-3 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({
  items = 5,
  className,
}: {
  items?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/30 px-3 py-2.5"
        >
          <SkeletonPulse className="size-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonPulse className="h-3 w-40" />
            <SkeletonPulse className="h-2.5 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTimeline({
  items = 4,
  className,
}: {
  items?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <SkeletonPulse className="size-2.5 rounded-full" />
            {i < items - 1 ? (
              <SkeletonPulse className="mt-1 w-0.5 flex-1 min-h-[2rem]" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1 space-y-2 pb-2">
            <SkeletonPulse className="h-3 w-48" />
            <SkeletonPulse className="h-2.5 w-full max-w-sm" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboardHome() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <SkeletonPulse className="h-20 w-full max-w-xl rounded-xl" />
        <SkeletonPulse className="h-[5.5rem] w-44 shrink-0 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat className="col-span-2 lg:col-span-1" />
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard className="min-h-[280px]" />
        <SkeletonCard />
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

export { SkeletonPulse };
