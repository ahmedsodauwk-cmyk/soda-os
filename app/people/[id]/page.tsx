import { redirect } from "next/navigation";

interface PeopleDetailRedirectProps {
  params: Promise<{ id: string }>;
}

/** Compatibility — /people/:id → /crew/:id */
export default async function PeopleDetailRedirect({
  params,
}: PeopleDetailRedirectProps) {
  const { id } = await params;
  redirect(`/crew/${id}`);
}
