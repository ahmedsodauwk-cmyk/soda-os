/**
 * Personal Brain — feature flag (UI gated until Founder migration approval).
 * DO NOT enable in Production without applying migration 20260728000033.
 */

/** When false, Personal Brain routes/components stay hidden. */
export function isPersonalBrainUiEnabled(): boolean {
  const flag = process.env.SODA_PERSONAL_BRAIN_ENABLED?.trim();
  return flag === "1" || flag?.toLowerCase() === "true";
}

/** Table names — isolated from SODA Brain (brain_entries). */
export const PERSONAL_BRAIN_TABLES = [
  "personal_brain_entries",
  "personal_brain_chat_messages",
  "personal_brain_entry_history",
] as const;
