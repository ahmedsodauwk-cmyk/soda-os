import { redirect } from "next/navigation";

/** Compatibility — Workspaces renamed to Commercial. */
export default function WorkspacesRedirectPage() {
  redirect("/commercial");
}
