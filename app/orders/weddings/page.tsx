import { AppShell } from "@/components/layout/app-shell";
import { WeddingOrdersView } from "@/components/orders/wedding-orders-view";
import { refreshOrders } from "@/lib/orders/repository";

export const dynamic = "force-dynamic";

interface WeddingOrdersPageProps {
  searchParams: Promise<{ year?: string }>;
}

export default async function WeddingOrdersPage({
  searchParams,
}: WeddingOrdersPageProps) {
  await refreshOrders();
  const params = await searchParams;
  const yearRaw = params.year ? Number(params.year) : undefined;
  const selectedYear =
    yearRaw && Number.isFinite(yearRaw) ? yearRaw : undefined;

  return (
    <AppShell titleKey="pages.weddingOrders" layer="weddingOrders">
      <WeddingOrdersView selectedYear={selectedYear} />
    </AppShell>
  );
}
