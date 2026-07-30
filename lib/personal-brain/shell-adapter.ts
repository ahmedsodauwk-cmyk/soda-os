/**
 * Personal Brain shell integration boundary.
 * DEFERRED BY FOUNDER — NOT PART OF CURRENT RELEASE.
 * No UI surface for any Access Level until migration 20260728000033 is approved.
 */

import type { AccessLevel } from "@/lib/identity/access-levels";

export type PersonalBrainShellContract = {
  /** Whether the shell should show a Personal Brain surface. */
  visible: boolean;
  /** User-facing title when surface is shown. */
  title: string;
  /** Safe empty copy — never shown while deferred. */
  placeholderMessage: string;
  /** Capability hook for future data adapter. */
  dataAdapterReady: boolean;
};

/** Internal contract only — always hidden until Personal Brain ships. */
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

  return {
    visible: false,
    title: "",
    placeholderMessage: "",
    dataAdapterReady: false,
  };
}
