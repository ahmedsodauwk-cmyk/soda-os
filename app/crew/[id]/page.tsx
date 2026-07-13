import { redirect } from "next/navigation";

interface CrewMemberRedirectProps {
  params: Promise<{ id: string }>;
}

/** Compatibility — /crew/:id → /people/:id workspace. */
export default async function CrewMemberRedirect({
  params,
}: CrewMemberRedirectProps) {
  const { id } = await params;
  redirect(`/people/${id}`);
}
