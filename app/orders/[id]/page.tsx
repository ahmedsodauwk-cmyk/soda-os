import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { RoleGate } from "@/components/identity/role-gate";
import { OrderCommandCenter } from "@/components/orders/order-command-center";
import { refreshAssignments } from "@/lib/assignments/repository";
import {
  getCalendarEventsByOrder,
  refreshCalendar,
} from "@/lib/calendar/repository";
import {
  getBusinessEventsByEntityFromDb,
  refreshBusinessEventsFromDb,
} from "@/lib/core";
import {
  getEquipment,
  getEquipmentAssignmentsByOrder,
  refreshEquipment,
} from "@/lib/equipment/repository";
import {
  listExpensesByOrder,
  refreshExpenses,
} from "@/lib/finance/expenses";
import { getFilesByOrder, refreshFiles } from "@/lib/files/repository";
import {
  can,
  canEditOrderFinance,
  canEditOps,
  canSeeCompanyFinance,
  canUpdateOrderStatus,
} from "@/lib/identity/permissions";
import { resolveSessionForApp } from "@/lib/identity/session";
import { getOrderOperatingView } from "@/lib/integration";
import { refreshInvoices } from "@/lib/invoices/repository";
import { fetchOrderById, refreshOrders } from "@/lib/orders/repository";
import { refreshPayments } from "@/lib/payments/repository";
import { getPeople, refreshPeople } from "@/lib/people/repository";
import { refreshProjects } from "@/lib/projects/repository";

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function OrderWorkspacePage({ params }: OrderPageProps) {
  const { id } = await params;
  const session = await resolveSessionForApp();

  await Promise.all([
    refreshOrders(),
    refreshProjects(),
    refreshPayments(),
    refreshAssignments(),
    refreshPeople(),
    refreshFiles(),
    refreshEquipment(),
    refreshInvoices(),
    refreshCalendar(),
    refreshExpenses(),
    refreshBusinessEventsFromDb(80).catch(() => []),
  ]);

  const order = await fetchOrderById(id);
  if (!order) {
    notFound();
  }

  const view = getOrderOperatingView(id);
  const peopleById = Object.fromEntries(getPeople().map((p) => [p.id, p]));
  const files = getFilesByOrder(id);
  const equipment = getEquipmentAssignmentsByOrder(id).map((a) => ({
    ...a,
    name: getEquipment().find((e) => e.id === a.equipmentId)?.name,
  }));
  const calendar = getCalendarEventsByOrder(id);
  const activity = await getBusinessEventsByEntityFromDb("order", id, 40).catch(
    () => []
  );
  const orderExpenses = listExpensesByOrder(id);

  const role = session?.profile.role ?? "owner";
  const seeMoney = canSeeCompanyFinance(role) || canEditOrderFinance(role);
  const capabilities = {
    canEdit: canEditOps(role),
    canEditFinance: canEditOrderFinance(role),
    canUpdateStatus: canUpdateOrderStatus(role),
    crewStatusOnly: can(role, "orders.status") && !can(role, "orders.edit"),
    canCollectPayment:
      canEditOrderFinance(role) ||
      can(role, "finance.edit") ||
      can(role, "finance.view"),
    canAddExpense: canEditOps(role) || can(role, "finance.view"),
    canSeeFullMoney: seeMoney,
    canAssignCrew: canEditOps(role),
  };

  const content = (
    <OrderCommandCenter
      view={view}
      peopleById={peopleById}
      files={files}
      equipment={equipment}
      calendar={calendar}
      activity={activity}
      orderExpenses={orderExpenses}
      capabilities={capabilities}
    />
  );

  return (
    <AppShell titleKey="pages.order" layer="orders" session={session}>
      {session ? (
        <RoleGate session={session} anyOf={["orders.view"]}>
          {content}
        </RoleGate>
      ) : (
        content
      )}
    </AppShell>
  );
}
