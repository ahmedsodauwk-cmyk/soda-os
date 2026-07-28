import { SkeletonCard } from "@/components/ui/soda-skeleton";

export default function CalendarLoading() {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <SkeletonCard className="min-h-[28rem]" />
      <SkeletonCard className="min-h-[20rem] hidden lg:block" />
    </div>
  );
}
