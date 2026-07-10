import { AppShell } from "@/components/layout/app-shell";
import { QuotationsHub } from "@/components/quotations/quotations-hub";
import { getModuleSlogan } from "@/lib/brand/soda-voice";

export default function QuotationsPage() {
  return (
    <AppShell title="Quotations" subtitle={getModuleSlogan("quotations")}>
      <QuotationsHub />
    </AppShell>
  );
}
