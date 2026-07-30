/**
 * User preference keys — one canonical localStorage + cookie owner per setting.
 */

export const REDUCED_MOTION_STORAGE_KEY = "soda-visuals:reduced-motion";
export const REDUCED_MOTION_COOKIE = "soda-reduced-motion";

export type ReducedMotionPreference = "system" | "reduce" | "no-preference";

export function parseReducedMotion(
  raw: string | null | undefined
): ReducedMotionPreference {
  if (raw === "reduce" || raw === "no-preference" || raw === "system") {
    return raw;
  }
  return "system";
}

/** Effective reduced motion: user override or OS preference. */
export function effectiveReducedMotion(
  preference: ReducedMotionPreference,
  systemReduced: boolean
): boolean {
  if (preference === "reduce") return true;
  if (preference === "no-preference") return false;
  return systemReduced;
}
