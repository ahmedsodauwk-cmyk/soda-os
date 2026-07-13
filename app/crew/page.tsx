import { redirect } from "next/navigation";

/** Compatibility — The Crew → People OS. */
export default function CrewRedirectPage() {
  redirect("/people");
}
