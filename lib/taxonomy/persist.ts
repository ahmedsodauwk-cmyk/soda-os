/**
 * Persist product taxonomy (workspaces + subcategories) into Supabase.
 * These are structural reference rows required by FKs — not demo business data.
 */
import { createDomainDb } from "@/lib/supabase/domain-db";
import {
  seedSubcategories,
  seedWorkspaces,
} from "@/lib/taxonomy/seed-data";

let ensured = false;

export async function ensureTaxonomyPersisted(): Promise<void> {
  if (ensured) return;
  const db = createDomainDb();

  const workspaceRows = seedWorkspaces.map((w) => ({
    id: w.id,
    label: w.label,
    slug: w.slug,
    description: w.description ?? null,
    icon: w.icon ?? null,
    sort_order: w.order,
    is_active: w.isActive,
    has_subcategories: w.hasSubcategories,
    color: w.color ?? null,
    default_team_id: w.defaultTeamId ?? null,
    settings: w.settings ?? {},
  }));

  const { error: wErr } = await db
    .from("workspaces")
    .upsert(workspaceRows, { onConflict: "id" });
  if (wErr) {
    throw new Error(`Failed to upsert workspaces: ${wErr.message}`);
  }

  const subRows = seedSubcategories.map((s) => ({
    id: s.id,
    workspace_id: s.workspaceId,
    label: s.label,
    slug: s.slug,
    sort_order: s.order,
    is_active: s.isActive,
  }));

  const { error: sErr } = await db
    .from("workspace_subcategories")
    .upsert(subRows, { onConflict: "id" });
  if (sErr) {
    throw new Error(`Failed to upsert subcategories: ${sErr.message}`);
  }

  ensured = true;
}
