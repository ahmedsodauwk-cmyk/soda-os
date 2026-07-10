import { AppShell } from "@/components/layout/app-shell";
import { CommercialCompanyOrders } from "@/components/orders/commercial-company-orders";
import { getModuleSlogan } from "@/lib/brand/soda-voice";

export default async function CommercialCompanyOrdersPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  return (
    <AppShell title="Commercial Orders" subtitle={getModuleSlogan("commercial")}>
      <CommercialCompanyOrders companyId={companyId} />
    </AppShell>
  );
}
