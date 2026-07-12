import Link from "next/link";
import { Calendar, Camera, Flag, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DASHBOARD_SECTION_COPY,
  getEmptyState,
} from "@/lib/brand/soda-voice";
import type { ScheduleItem, UpcomingSchedule } from "@/lib/dashboard/types";
import { formatDate } from "@/lib/orders/utils";

interface UpcomingScheduleCardProps {
  schedule: UpcomingSchedule;
}

function whenBadge(when: ScheduleItem["when"]) {
  if (when === "today") return "Today";
  if (when === "tomorrow") return "Tomorrow";
  return "Upcoming";
}

function Section({
  title,
  icon: Icon,
  items,
  empty,
}: {
  title: string;
  icon: typeof Camera;
  items: ScheduleItem[];
  empty: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="size-3.5 text-muted-foreground" />
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {title}
        </p>
      </div>
      {items.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground" dir="rtl">
          {empty}
        </p>
      ) : (
        <div className="space-y-0">
          {items.map((item, index) => (
            <div key={item.id}>
              <Link
                href={item.href}
                className="flex items-start justify-between gap-3 rounded-md py-2.5 transition-colors hover:bg-muted/50"
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
          ))}
        </div>
      )}
    </div>
  );
}

export default function UpcomingScheduleCard({
  schedule,
}: UpcomingScheduleCardProps) {
  return (
    <Card className="soda-cc-card h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-4 text-soda-pink" />
              {DASHBOARD_SECTION_COPY.schedule.title}
            </CardTitle>
            <CardDescription
              className="font-ar text-[0.9375rem] leading-[1.8] text-muted-foreground"
              dir="rtl"
            >
              {DASHBOARD_SECTION_COPY.schedule.description}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            nativeButton={false}
            render={<Link href="/calendar" />}
          >
            Full calendar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <Section
          title="Today's shoots"
          icon={Camera}
          items={schedule.todayShoots}
          empty={getEmptyState("shoots").title}
        />
        <Section
          title="Tomorrow's shoots"
          icon={Camera}
          items={schedule.tomorrowShoots}
          empty={getEmptyState("shoots").title}
        />
        <Section
          title="Deliveries"
          icon={Truck}
          items={schedule.deliveries}
          empty={getEmptyState("deliveries").title}
        />
        <Section
          title="Deadlines"
          icon={Flag}
          items={schedule.deadlines}
          empty={getEmptyState("deadlines").title}
        />
      </CardContent>
    </Card>
  );
}
