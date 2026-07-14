/**
 * Legacy Brain Chat route → Operations Desk (Mission 05.3).
 */

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function BrainChatRedirectPage() {
  redirect("/brain/operations-desk");
}
