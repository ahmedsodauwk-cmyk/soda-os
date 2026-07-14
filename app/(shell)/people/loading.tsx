import { SkeletonList } from "@/components/ui/soda-skeleton";

export default function PeopleLoading() {
  return (
    <div className="space-y-4">
      <SkeletonList items={8} />
    </div>
  );
}
