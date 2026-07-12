import { AppShell } from "@/components/layout/app-shell";
import { NewQuotationForm } from "@/components/quotations/new-quotation-form";
import { getModuleSlogan } from "@/lib/brand/soda-voice";
import { refreshClients } from "@/lib/clients/repository";
import { refreshQuotations } from "@/lib/quotations/repository";

export const dynamic = "force-dynamic";

export default async function NewQuotationPage() {
  await Promise.all([refreshClients(), refreshQuotations()]);
  return (
    <AppShell title="عرض سعر جديد" subtitle={getModuleSlogan("quotations")}>
      <NewQuotationForm />
    </AppShell>
  );
}
