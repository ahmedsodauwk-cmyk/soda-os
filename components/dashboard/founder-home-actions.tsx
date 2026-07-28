import { OrderEntryActions } from "@/components/orders/order-entry-actions";

import { ClientEntryActions } from "@/components/clients/client-entry-actions";
import { AddQuotationDrawer } from "@/components/quotations/add-quotation-drawer";
import { cn } from "@/lib/utils";

/** Single Founder Home action group — no duplicates elsewhere on Home. */
export function FounderHomeActions({ className }: { className?: string }) {
  return (
    <section
      aria-label="Quick actions"
      className={cn(
        "soda-founder-actions flex flex-wrap items-center justify-end gap-2",
        className
      )}
    >
      <OrderEntryActions
        triggerLabel="New Order"
        triggerClassName="soda-btn-primary h-9 gap-1.5 text-[15px] font-semibold"
      />
      <ClientEntryActions
        triggerLabel="Add Client"
        triggerVariant="outline"
        triggerClassName="h-9 border-soda-pink/25"
      />
      <AddQuotationDrawer triggerLabel="Add Quotation" />
    </section>
  );
}
