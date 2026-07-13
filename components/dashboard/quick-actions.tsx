"use client";

import Link from "next/link";
import {
  BarChart3,
  Briefcase,
  CalendarDays,
  ClipboardList,
  Contact,
  FileText,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DASHBOARD_SECTION_COPY } from "@/lib/brand/soda-voice";
import { useI18n } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionaries";
import type { Permission } from "@/lib/identity/permissions";
import { setHasAny } from "@/lib/identity/permissions";
import { cn } from "@/lib/utils";

const actions: {
  labelKey: DictKey;
  href: string;
  icon: typeof FileText;
  anyOf: Permission[];
}[] = [
  {
    labelKey: "quickActions.newQuotation",
    href: "/quotations/new",
    icon: FileText,
    anyOf: ["quotations.edit", "quotations.view"],
  },
  {
    labelKey: "quickActions.createOrder",
    href: "/orders",
    icon: ClipboardList,
    anyOf: ["orders.create", "orders.edit"],
  },
  {
    labelKey: "quickActions.createClient",
    href: "/clients",
    icon: Contact,
    anyOf: ["clients.manage", "clients.edit"],
  },
  {
    labelKey: "quickActions.crew",
    href: "/people",
    icon: UsersRound,
    anyOf: ["people.view", "crew.view", "crew.manage"],
  },
  {
    labelKey: "quickActions.commercial",
    href: "/commercial",
    icon: Briefcase,
    anyOf: ["commercial.view"],
  },
  {
    labelKey: "quickActions.calendar",
    href: "/calendar",
    icon: CalendarDays,
    anyOf: ["calendar.view", "calendar.manage"],
  },
  {
    labelKey: "quickActions.reports",
    href: "/statistics",
    icon: BarChart3,
    anyOf: ["statistics.view", "reports.view", "reports.manage"],
  },
];

interface QuickActionsProps {
  /** DB permission ids for the signed-in role. */
  allowedPermissions?: readonly string[];
}

export default function QuickActions({
  allowedPermissions,
}: QuickActionsProps) {
  const { t } = useI18n();
  const granted = allowedPermissions ?? null;

  const visible = actions.filter((action) =>
    granted ? setHasAny(granted, action.anyOf) : true
  );

  if (visible.length === 0) return null;

  return (
    <Card className="soda-cc-card">
      <CardHeader className="pb-3">
        <CardTitle>{DASHBOARD_SECTION_COPY.quickActions.title}</CardTitle>
        <CardDescription
          className="font-ar text-[0.9375rem] leading-[1.8] text-muted-foreground"
          dir="rtl"
        >
          {DASHBOARD_SECTION_COPY.quickActions.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {visible.map((action) => {
            const Icon = action.icon;
            const label = t(action.labelKey);
            const className = cn(
              "h-auto cursor-pointer flex-col gap-2 py-4",
              "hover:border-soda-pink/40 hover:bg-soda-pink/[0.07]"
            );

            return (
              <Button
                key={action.labelKey}
                variant="outline"
                nativeButton={false}
                render={<Link href={action.href} />}
                className={className}
              >
                <Icon className="size-4" />
                <span className="text-xs font-medium">{label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
