/**
 * Role-aware Home data-scope unit checks (no Production / no live DB).
 * Run: npx tsx scripts/verify-global-role-home-data.ts
 */

import assert from "node:assert/strict";

import {
  filterAttentionForHome,
  canShowCompanyFinance,
  activityFeedScopeFromDataScope,
  buildRoleKpiMetrics,
} from "@/lib/dashboard/home-registry";
import { buildDataScope } from "@/lib/identity/data-scope";
import type { AttentionItem } from "@/lib/dashboard/types";
import type { SodaSession } from "@/lib/identity/session";

let passed = 0;

function check(label: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`PASS  ${label}`);
}

function mockSession(level: SodaSession["profile"]["accessLevel"]): SodaSession {
  return {
    userId: "test-user",
    email: "test@example.com",
    profile: {
      id: "profile-test-user",
      accessLevel: level,
      role: "crew_member",
      personId: level === "founder" ? null : "person-1",
      displayName: "Test User",
      fullName: "Test User",
      email: "test@example.com",
      username: "testuser",
      avatarInitials: "TU",
      isActive: true,
      mustChangePassword: false,
    },
  };
}

const financeAttention: AttentionItem = {
  id: "fin-1",
  title: "Unpaid",
  detail: "Client owes",
  href: "/finance",
  category: "unpaid_client",
  severity: "warning",
};

const opsAttention: AttentionItem = {
  id: "ops-1",
  title: "Overdue",
  detail: "Delivery late",
  href: "/attention",
  category: "overdue_delivery",
  severity: "critical",
};

console.log("verify-global-role-home-data\n");

check("finance attention stripped for team", () => {
  const filtered = filterAttentionForHome(
    [financeAttention, opsAttention],
    "team"
  );
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.category, "overdue_delivery");
});

check("finance attention kept for founder", () => {
  const filtered = filterAttentionForHome(
    [financeAttention, opsAttention],
    "founder"
  );
  assert.equal(filtered.length, 2);
});

check("company finance denied for account_manager even with finance.view", () => {
  assert.equal(
    canShowCompanyFinance("account_manager", ["finance.view"]),
    false
  );
});

check("company finance allowed for founder with permission", () => {
  assert.equal(
    canShowCompanyFinance("founder", ["finance.view"]),
    true
  );
});

check("activity feed excludes payments for team scope", () => {
  const scope = buildDataScope(mockSession("team"), { orders: [], clients: [] });
  const feedScope = activityFeedScopeFromDataScope(scope);
  assert.equal(feedScope.includePayments, false);
  assert.ok(feedScope.orderIds instanceof Set);
});

check("activity feed includes payments for founder", () => {
  const scope = buildDataScope(mockSession("founder"), {
    orders: [],
    clients: [],
  });
  const feedScope = activityFeedScopeFromDataScope(scope);
  assert.equal(feedScope.includePayments, true);
  assert.equal(feedScope.orderIds, null);
});

check("team KPI metrics never include revenue", () => {
  const metrics = buildRoleKpiMetrics("team", {
    kpis: {
      revenueThisMonth: 999999,
      revenueLastMonth: 0,
      revenueMonthChangePct: null,
      outstandingPayments: 50000,
      activeProjects: 1,
      activeOrders: 2,
      upcomingShoots: 1,
      upcomingDeliveries: 0,
      activeClients: 1,
    },
    scopedOrders: [],
    pendingQuotations: [],
    teamMembers: 1,
    shootsToday: 0,
    showWallet: true,
  });
  assert.ok(metrics.every((m) => !m.label.toLowerCase().includes("revenue")));
  assert.ok(metrics.some((m) => m.id === "wallet"));
});

console.log(`\n${passed}/7 checks passed`);
