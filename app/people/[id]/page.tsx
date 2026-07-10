import { AppShell } from "@/components/layout/app-shell";
import { PersonProfile } from "@/components/people/person-profile";

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell title="People" subtitle="Member profile">
      <PersonProfile personId={id} />
    </AppShell>
  );
}
