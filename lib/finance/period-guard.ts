/**
 * Period open/closed guard — tiny module to avoid circular imports.
 * Closing cache is owned by lib/finance/closing.ts and synced here.
 */

type PeriodType = "month" | "year";

interface ClosedPeriodKey {
  periodType: PeriodType;
  periodKey: string;
}

let closedKeys: ClosedPeriodKey[] = [];

export function syncClosedPeriods(
  keys: Array<{ periodType: PeriodType; periodKey: string; status: string }>
): void {
  closedKeys = keys
    .filter((k) => k.status === "closed")
    .map((k) => ({ periodType: k.periodType, periodKey: k.periodKey }));
}

export function isPeriodClosedForDate(isoDate: string): boolean {
  const monthKey = isoDate.slice(0, 7);
  const yearKey = isoDate.slice(0, 4);
  return closedKeys.some(
    (k) =>
      (k.periodType === "month" && k.periodKey === monthKey) ||
      (k.periodType === "year" && k.periodKey === yearKey)
  );
}

export function assertPeriodOpen(isoDate: string, action: string): void {
  if (isPeriodClosedForDate(isoDate)) {
    throw new Error(
      `Period closed — cannot ${action} for ${isoDate.slice(0, 10)}. Admin must reopen.`
    );
  }
}
