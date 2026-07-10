import { AppShell } from "@/components/layout/app-shell";
import { QuotationBuilder } from "@/components/quotations/quotation-builder";
import { getModuleSlogan } from "@/lib/brand/soda-voice";

interface QuotationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuotationDetailPage({
  params,
}: QuotationDetailPageProps) {
  const { id } = await params;

  return (
    <AppShell title="Quotation" subtitle={getModuleSlogan("quotations")}>
      <QuotationBuilder key={id} quotationId={id} />
    </AppShell>
  );
}
