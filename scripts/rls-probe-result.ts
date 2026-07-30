export type RlsProbeOperation = "SELECT" | "INSERT" | "UPDATE" | "DELETE";
export type RlsProbeStage =
  | "fixture setup"
  | "fixture verification"
  | "identity setup"
  | "operation under test"
  | "assertion"
  | "cleanup";

export const SODA_RLS_PROBE_RESULT_MARKER = "SODA_RLS_PROBE_RESULT_JSON:";

export const RLS_PROBE_EXIT_RLS_FAIL = 2;
export const RLS_PROBE_EXIT_FIXTURE_DEFECT = 3;

export interface RlsProbeStructuredResult {
  status: "pass" | "fail";
  failedProbeId: string | null;
  table: string | null;
  operation: RlsProbeOperation | null;
  stage: RlsProbeStage | null;
  sqlState: string | null;
  governedBy000034: boolean;
  cleanupCompleted: boolean;
  migrationRollbackRecommended: boolean;
  exitCode: number;
  sr02InsertGap: boolean;
}

export function emitRlsProbeStructuredResult(result: RlsProbeStructuredResult): void {
  console.log(`${SODA_RLS_PROBE_RESULT_MARKER}${JSON.stringify(result)}`);
}
