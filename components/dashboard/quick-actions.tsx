"use client";

import Link from "next/link";
import {
  BarChart3,
  Briefcase,
  CalendarDays,
  FileText,
  Plus,
  UserPlus,
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
import { cn } from "@/lib/utils";

const actions: {
  labelKey: DictKey;
  href: string;
  icon: typeof FileText;
  enabled: boolean;
}[] = [
  {
    labelKey: "quickActions.newQuotation",
    href: "/quotations/new",
    icon: FileText,
    enabled: true,
  },
  {
    labelKey: "quickActions.createOrder",
    href: "/orders",
    icon: Plus,
    enabled: true,
  },
  {
    labelKey: "quickActions.createClient",
    href: "/clients",
    icon: UserPlus,
    enabled: true,
  },
  {
    labelKey: "quickActions.crew",
    href: "/crew",
    icon: UsersRound,
    enabled: true,
  },
  {
    labelKey: "quickActions.commercial",
    href: "/commercial",
    icon: Briefcase,
    enabled: true,
  },
  {
    labelKey: "quickActions.calendar",
    href: "/calendar",
    icon: CalendarDays,
    enabled: true,
  },
  {
    labelKey: "quickActions.reports",
    href: "/statistics",
    icon: BarChart3,
    enabled: true,
  },
];

export default function QuickActions() {
  const { t } = useI18n();

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
          {actions.map((action) => {
            const Icon = action.icon;
            const label = t(action.labelKey);
            const className = cn(
              "h-auto flex-col gap-2 py-4",
              action.enabled &&
                "hover:border-soda-pink/40 hover:bg-soda-pink/[0.07]",
              !action.enabled && "opacity-60"
            );

            if (!action.enabled) {
              return (
                <Button
                  key={action.labelKey}
                  variant="outline"
                  disabled
                  className={className}
                >
                  <Icon className="size-4" />
                  <span className="text-xs font-medium">{label}</span>
                </Button>
              );
            }

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
