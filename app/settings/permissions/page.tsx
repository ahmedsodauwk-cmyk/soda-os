import { redirect } from "next/navigation";

/**
 * Legacy permissions matrix URL → Authority Center.
 */
export default function PermissionsSettingsRedirect() {
  redirect("/settings/authority#permissions");
}
