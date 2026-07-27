import Link from "next/link";
import { Plus } from "lucide-react";

import { ClientEntryActions } from "@/components/clients/client-entry-actions";
import { SodaLanguage } from "@/components/brand/soda-language";
import { Button } from "@/components/ui/button";

/** Action strip — New Order, Add Client, SODA Language guidance. */
export function FounderActionStrip() {
  return (
    <section
      aria-label="Quick actions"
      className="soda-founder-action-strip flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/50 bg-card/40 px-3 py-2.5"
    >
      <SodaLanguage layer="quickActions" size="compact" className="max-w-md" />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          className="soda-btn-primary h-9 gap-1.5 text-[15px] font-semibold"
          nativeButton={false}
          render={<Link href="/orders" />}
        >
          <Plus className="size-4" />
          <span>New Order</span>
        </Button>
        <ClientEntryActions
          triggerLabel="Add Client"
          triggerVariant="outline"
          triggerClassName="h-9 border-soda-pink/25"
        />
      </div>
    </section>
  );
}
