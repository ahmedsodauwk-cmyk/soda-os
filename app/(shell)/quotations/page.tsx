import { AppShell } from "@/components/layout/app-shell";
import { QuotationsHub } from "@/components/quotations/quotations-hub";
import { refreshQuotations } from "@/lib/quotations/repository";

export const dynamic = "force-dynamic";

export default async function QuotationsPage() {
  await refreshQuotations();
  return (
    <AppShell titleKey="pages.quotations" layer="quotations">
      <QuotationsHub />
    </AppShell>
  );
}
