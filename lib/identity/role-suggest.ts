import { isSodaRole, type SodaRole } from "@/lib/identity/roles";

const JOB_TITLE_ROLE_HINTS: Array<{ pattern: RegExp; role: SodaRole }> = [
  { pattern: /founder|owner/i, role: "founder" },
  { pattern: /project\s*manager|producer/i, role: "project_manager" },
  { pattern: /photo\s*editor|retouch/i, role: "photo_editor" },
  { pattern: /video\s*editor|editor/i, role: "video_editor" },
  { pattern: /photographer|photo/i, role: "photographer" },
  { pattern: /videographer|video/i, role: "videographer" },
  { pattern: /social\s*media/i, role: "social_media_manager" },
  { pattern: /sales/i, role: "sales" },
  { pattern: /customer\s*service|support/i, role: "customer_service" },
  { pattern: /accountant|finance/i, role: "accountant" },
  { pattern: /freelance/i, role: "freelancer" },
  { pattern: /admin/i, role: "admin" },
];

/** Map crew job title → operational role template for new login accounts. */
export function suggestRoleFromPerson(jobTitle: string): SodaRole {
  const title = jobTitle.trim();
  if (!title) return "crew_member";
  for (const { pattern, role } of JOB_TITLE_ROLE_HINTS) {
    if (pattern.test(title)) return role;
  }
  const normalized = title.toLowerCase().replace(/\s+/g, "_");
  if (isSodaRole(normalized)) return normalized;
  return "crew_member";
}
