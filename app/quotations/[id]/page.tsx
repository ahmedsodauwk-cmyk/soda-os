import { AppShell } from "@/components/layout/app-shell";
import { QuotationBuilder } from "@/components/quotations/quotation-builder";
import { getModuleSlogan } from "@/lib/brand/soda-voice";
import { refreshQuotations } from "@/lib/quotations/repository";

interface QuotationDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function QuotationDetailPage({
  params,
}: QuotationDetailPageProps) {
  const { id } = await params;
  await refreshQuotations();

  return (
    <AppShell title="Quotation" subtitle={getModuleSlogan("quotations")}>
      <QuotationBuilder key={id} quotationId={id} />
    </AppShell>
  );
}
