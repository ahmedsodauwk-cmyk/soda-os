import { AppShell } from "@/components/layout/app-shell";
import { CommercialCompanyOrders } from "@/components/orders/commercial-company-orders";
import { getModuleSlogan } from "@/lib/brand/soda-voice";
import { refreshClients } from "@/lib/clients/repository";
import { refreshOrders } from "@/lib/orders/repository";
import { refreshPayments } from "@/lib/payments/repository";

export const dynamic = "force-dynamic";

export default async function CommercialCompanyOrdersPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  await Promise.all([refreshClients(), refreshOrders(), refreshPayments()]);
  return (
    <AppShell title="Commercial Orders" subtitle={getModuleSlogan("commercial")}>
      <CommercialCompanyOrders companyId={companyId} />
    </AppShell>
  );
}
