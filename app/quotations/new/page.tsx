import { AppShell } from "@/components/layout/app-shell";
import { NewQuotationForm } from "@/components/quotations/new-quotation-form";
import { getModuleSlogan } from "@/lib/brand/soda-voice";

export default function NewQuotationPage() {
  return (
    <AppShell title="New quotation" subtitle={getModuleSlogan("quotations")}>
      <NewQuotationForm />
    </AppShell>
  );
}
