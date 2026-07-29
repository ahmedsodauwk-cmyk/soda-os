/**
 * Validates structured RLS probe JSON marker parsing (release runner contract).
 * Run: npx tsx scripts/verify-rls-probe-result-parser.ts
 */

import assert from "node:assert/strict";

import {
  SODA_RLS_PROBE_RESULT_MARKER,
  type RlsProbeStructuredResult,
} from "./rls-probe-result";

function parseMarkerLine(line: string): RlsProbeStructuredResult | null {
  if (!line.startsWith(SODA_RLS_PROBE_RESULT_MARKER)) return null;
  return JSON.parse(line.slice(SODA_RLS_PROBE_RESULT_MARKER.length)) as RlsProbeStructuredResult;
}

function parseFromOutput(lines: string[]): RlsProbeStructuredResult | null {
  for (let i = lines.length - 1; i >= 0; i--) {
    const parsed = parseMarkerLine(lines[i]!);
    if (parsed) return parsed;
  }
  return null;
}

const samplePass: RlsProbeStructuredResult = {
  status: "pass",
  failedProbeId: null,
  table: null,
  operation: null,
  stage: null,
  sqlState: null,
  governedBy000034: false,
  cleanupCompleted: true,
  migrationRollbackRecommended: false,
  exitCode: 0,
  sr02InsertGap: false,
};

const sampleRollback: RlsProbeStructuredResult = {
  status: "fail",
  failedProbeId: "founder-orders-update",
  table: "orders",
  operation: "UPDATE",
  stage: "operation under test",
  sqlState: "42501",
  governedBy000034: true,
  cleanupCompleted: true,
  migrationRollbackRecommended: true,
  exitCode: 2,
  sr02InsertGap: false,
};

const sampleFixture: RlsProbeStructuredResult = {
  status: "fail",
  failedProbeId: "fixture-privileged-insert",
  table: "clients",
  operation: "INSERT",
  stage: "fixture setup",
  sqlState: "42501",
  governedBy000034: false,
  cleanupCompleted: false,
  migrationRollbackRecommended: false,
  exitCode: 3,
  sr02InsertGap: false,
};

const passLine = `${SODA_RLS_PROBE_RESULT_MARKER}${JSON.stringify(samplePass)}`;
const rollbackLine = `${SODA_RLS_PROBE_RESULT_MARKER}${JSON.stringify(sampleRollback)}`;
const fixtureLine = `${SODA_RLS_PROBE_RESULT_MARKER}${JSON.stringify(sampleFixture)}`;

assert.deepEqual(parseMarkerLine(passLine), samplePass);
assert.deepEqual(parseMarkerLine(rollbackLine), sampleRollback);
assert.deepEqual(parseMarkerLine(fixtureLine), sampleFixture);

const mixedOutput = [
  "RUN   founder-orders-update — test",
  "FAIL  founder-orders-update — test",
  fixtureLine,
  "noise",
  passLine,
];
assert.deepEqual(parseFromOutput(mixedOutput), samplePass);

const rollbackOutput = ["log line", rollbackLine];
assert.deepEqual(parseFromOutput(rollbackOutput), sampleRollback);

assert.equal(parseFromOutput(["no marker here"]), null);

console.log("PASS  RLS probe structured result parser contract");
