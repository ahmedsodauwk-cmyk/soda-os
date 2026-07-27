import { OrderEntryActions } from "@/components/orders/order-entry-actions";
import Link from "next/link";
import { FileText } from "lucide-react";

import { ClientEntryActions } from "@/components/clients/client-entry-actions";
import { Button } from "@/components/ui/button";

/** Single Founder Home action group — no duplicates elsewhere on Home. */
export function FounderHomeActions() {
  return (
    <section
      aria-label="Quick actions"
      className="soda-founder-actions flex flex-wrap items-center gap-2"
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
      <Button
        size="sm"
        variant="outline"
        className="soda-creation-quotation h-9 gap-1.5 border-soda-pink/25 text-[15px] font-semibold"
        nativeButton={false}
        render={<Link href="/quotations/new" />}
      >
        <FileText className="size-4" aria-hidden />
        <span>Add Quotation</span>
      </Button>
    </section>
  );
}
