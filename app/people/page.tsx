import { redirect } from "next/navigation";

/** Compatibility — People renamed to The Crew. */
export default function PeopleRedirectPage() {
  redirect("/crew");
}
