import { SkeletonCard, SkeletonList } from "@/components/ui/soda-skeleton";

export default function BrainLoading() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <SkeletonList items={6} />
      <SkeletonCard />
    </div>
  );
}
