import Link from "next/link";
import { Calendar, Camera, Flag, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ScheduleItem } from "@/lib/dashboard/types";
import { formatDate } from "@/lib/orders/utils";

export type ScheduleSectionKey =
  | "today"
  | "tomorrow"
  | "deliveries"
  | "deadlines";

export const SCHEDULE_SECTION_META: Record<
  ScheduleSectionKey,
  {
    title: string;
    description: string;
    empty: string;
    icon: typeof Camera;
  }
> = {
  today: {
    title: "Today's Shoots",
    description: "Shoots scheduled for today.",
    empty: "No shoots today.",
    icon: Camera,
  },
  tomorrow: {
    title: "Tomorrow's Shoots",
    description: "Shoots scheduled for tomorrow.",
    empty: "No shoots tomorrow.",
    icon: Camera,
  },
  deliveries: {
    title: "Deliveries",
    description: "Upcoming delivery dates that need follow-up.",
    empty: "No upcoming deliveries.",
    icon: Truck,
  },
  deadlines: {
    title: "Deadlines",
    description: "Deadlines and milestones coming up.",
    empty: "No upcoming deadlines.",
    icon: Flag,
  },
};

function whenBadge(when: ScheduleItem["when"]) {
  if (when === "today") return "Today";
  if (when === "tomorrow") return "Tomorrow";
  return "Upcoming";
}

interface ScheduleSectionListProps {
  section: ScheduleSectionKey;
  items: ScheduleItem[];
}

export function ScheduleSectionList({
  section,
  items,
}: ScheduleSectionListProps) {
  const meta = SCHEDULE_SECTION_META[section];
  const Icon = meta.icon;

  return (
    <Card className="soda-cc-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4 text-soda-pink" />
          {meta.title}
        </CardTitle>
        <CardDescription>{meta.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-0">
        {items.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">{meta.empty}</p>
        ) : (
          items.map((item, index) => (
            <div key={item.id}>
              <Link
                href={item.href}
                className="flex cursor-pointer items-start justify-between gap-3 rounded-md py-2.5 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.clientName} · {formatDate(item.date)}
                    {item.location ? ` · ${item.location}` : ""}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {whenBadge(item.when)}
                </Badge>
              </Link>
              {index < items.length - 1 ? <Separator /> : null}
            </div>
          ))
        )}
        <Link
          href="/calendar"
          className="mt-4 inline-flex cursor-pointer items-center gap-1.5 pt-2 text-xs text-soda-pink hover:underline"
        >
          <Calendar className="size-3.5" />
          Full calendar
        </Link>
      </CardContent>
    </Card>
  );
}

export function isScheduleSectionKey(
  value: string
): value is ScheduleSectionKey {
  return value in SCHEDULE_SECTION_META;
}
