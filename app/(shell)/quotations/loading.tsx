import { SkeletonTable } from "@/components/ui/soda-skeleton";

export default function QuotationsLoading() {
  return (
    <div className="space-y-4">
      <SkeletonTable rows={8} />
    </div>
  );
}
