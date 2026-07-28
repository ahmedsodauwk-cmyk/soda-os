/**
 * Personal Brain shell integration boundary (no migration / no data in this mission).
 * Non-Founder: rail hidden; placeholder contract for future Personal Brain mission.
 */

import type { AccessLevel } from "@/lib/identity/access-levels";
import { isPersonalBrainUiEnabled } from "@/lib/personal-brain/feature-flag";

export type PersonalBrainShellContract = {
  /** Whether the shell should show a Personal Brain surface. */
  visible: boolean;
  /** User-facing title when surface is shown. */
  title: string;
  /** Safe empty/placeholder copy — not labeled as working until migration applied. */
  placeholderMessage: string;
  /** Capability hook for future data adapter. */
  dataAdapterReady: boolean;
};

export function resolvePersonalBrainShell(
  accessLevel: AccessLevel
): PersonalBrainShellContract {
  if (accessLevel === "founder") {
    return {
      visible: false,
      title: "SODA Brain",
      placeholderMessage: "",
      dataAdapterReady: true,
    };
  }

  const enabled = isPersonalBrainUiEnabled();

  return {
    visible: false,
    title: "Personal Brain",
    placeholderMessage: enabled
      ? "Personal Brain is coming soon — your private notes will live here."
      : "Personal Brain is not enabled yet. Founder migration approval is required.",
    dataAdapterReady: false,
  };
}
