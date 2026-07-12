import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
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
import { getFilesByOrder, refreshFiles } from "@/lib/files/repository";
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

export default async function OrderCommandCenterPage({ params }: OrderPageProps) {
  const { id } = await params;

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

  return (
    <AppShell titleKey="pages.order" layer="orders">
      <OrderCommandCenter
        view={view}
        peopleById={peopleById}
        files={files}
        equipment={equipment}
        calendar={calendar}
        activity={activity}
      />
    </AppShell>
  );
}
