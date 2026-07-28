import Link from "next/link";
import {
  Calendar,
  FileText,
  MessageCircle,
  UsersRound,
} from "lucide-react";

import { ClientEntryActions } from "@/components/clients/client-entry-actions";
import { SodaSectionHeader } from "@/components/brand/soda-section-header";
import { OrderEntryActions } from "@/components/orders/order-entry-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

/** Quick Actions — single placement on Home (management row). */
export function FounderQuickActionsPanel() {
  return (
    <Card className="soda-founder-panel soda-cc-card h-full min-w-0">
      <CardHeader className="px-3 py-2.5 pb-1.5">
        <SodaSectionHeader
          title="Quick Actions"
          layer="quickActions"
          as="h2"
          size="card"
        />
      </CardHeader>
      <CardContent className="space-y-2 px-3 pb-2.5 pt-0">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            size="sm"
            className="soda-btn-primary h-9 w-full justify-start gap-2 text-[15px] font-semibold"
            nativeButton={false}
            render={<Link href="/quotations/new" />}
          >
            <FileText className="size-4" aria-hidden />
            New Quotation
          </Button>
          <OrderEntryActions
            triggerLabel="New Order"
            triggerClassName="soda-btn-primary h-9 w-full justify-start gap-2 text-[15px] font-semibold"
          />
          <ClientEntryActions
            triggerLabel="New Client"
            triggerVariant="outline"
            triggerClassName="h-9 w-full justify-start gap-2 border-soda-pink/25 text-[15px] font-semibold"
          />
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border/40 pt-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 text-sm"
            nativeButton={false}
            render={<Link href="/people" />}
          >
            <UsersRound className="size-3.5" aria-hidden />
            Crew
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 text-sm"
            nativeButton={false}
            render={<Link href="/calendar" />}
          >
            <Calendar className="size-3.5" aria-hidden />
            Calendar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 text-sm"
            nativeButton={false}
            render={<Link href="/connect" />}
          >
            <MessageCircle className="size-3.5" aria-hidden />
            Team Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
