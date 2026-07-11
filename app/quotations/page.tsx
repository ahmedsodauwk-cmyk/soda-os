import { AppShell } from "@/components/layout/app-shell";
import { QuotationsHub } from "@/components/quotations/quotations-hub";
import { getModuleSlogan } from "@/lib/brand/soda-voice";
import { refreshQuotations } from "@/lib/quotations/repository";

export const dynamic = "force-dynamic";

export default async function QuotationsPage() {
  await refreshQuotations();
  return (
    <AppShell title="Quotations" subtitle={getModuleSlogan("quotations")}>
      <QuotationsHub />
    </AppShell>
  );
}
