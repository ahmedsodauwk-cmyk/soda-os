import { SkeletonTable } from "@/components/ui/soda-skeleton";

export default function OrdersLoading() {
  return (
    <div className="space-y-4">
      <SkeletonTable rows={8} />
    </div>
  );
}
