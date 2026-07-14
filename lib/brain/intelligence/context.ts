/**
 * Context Engine — Related Memories while typing / after parse.
 * Searches Money / Ideas / Client Notes / Potential Orders / Meetings / Reminders.
 * Read-only over Brain entries. No ERP. No auto-writes.
 */

import type { BrainEntry, BrainWorkspace } from "@/lib/brain/types";
import { findRelatedMemories } from "@/lib/brain/intelligence/memory";
import { parseBrainText } from "@/lib/brain/intelligence/parser";
import type {
  BrainUnderstanding,
  RelatedMemory,
} from "@/lib/brain/intelligence/types";

const SEARCH_WORKSPACES: BrainWorkspace[] = [
  "money_memory",
  "ideas",
  "client_notebook",
  "potential_orders",
  "meeting_notes",
  "reminders",
];

/**
 * Live context while Founder types (or after parse).
 * Uses partial text → soft parse → memory search.
 */
export function buildRelatedContext(
  draftText: string,
  entries: BrainEntry[],
  limit = 6
): {
  understanding: BrainUnderstanding | null;
  related: RelatedMemory[];
} {
  const text = draftText.trim();
  if (text.length < 2) {
    return { understanding: null, related: [] };
  }

  const understanding = parseBrainText(text);
  const pool = entries.filter(
    (e) =>
      !e.archivedAt &&
      (SEARCH_WORKSPACES.includes(e.workspace) || e.workspace === "inbox")
  );
  const related = findRelatedMemories(understanding, pool, limit);
  return { understanding, related };
}

/**
 * Workspace-filtered context for the right rail (explicit).
 */
export function searchContextByWorkspaces(
  query: string,
  entries: BrainEntry[],
  workspaces: BrainWorkspace[] = SEARCH_WORKSPACES,
  limit = 8
): BrainEntry[] {
  const q = query.trim().toLowerCase();
  const pool = entries.filter(
    (e) => !e.archivedAt && workspaces.includes(e.workspace)
  );
  if (!q) return pool.slice(0, limit);

  return pool
    .filter((e) => {
      const hay = [
        e.title,
        e.body,
        e.rawText,
        e.personLabel,
        e.companyLabel,
        e.clientLabel,
        e.amountNote,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    })
    .slice(0, limit);
}
