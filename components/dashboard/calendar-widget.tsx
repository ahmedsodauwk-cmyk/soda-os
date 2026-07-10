import { Calendar, Camera, Clapperboard, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const events = [
  {
    title: "Wedding Shoot",
    time: "Today - 10:00 AM",
    badge: "Today",
    icon: Camera,
  },
  {
    title: "Commercial Shoot",
    time: "Tomorrow - 2:00 PM",
    badge: "Tomorrow",
    icon: Clapperboard,
  },
  {
    title: "Team Meeting",
    time: "Friday - 6:00 PM",
    badge: "Friday",
    icon: Users,
  },
];

export default function CalendarWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          Upcoming
        </CardTitle>
        <CardDescription>Your schedule at a glance</CardDescription>
      </CardHeader>

      <CardContent className="space-y-0">
        {events.map((event, index) => {
          const Icon = event.icon;

          return (
            <div key={event.title}>
              <div className="flex items-start justify-between gap-3 py-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>

                  <div>
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.time}
                    </p>
                  </div>
                </div>

                <Badge variant="secondary" className="shrink-0">
                  {event.badge}
                </Badge>
              </div>

              {index < events.length - 1 && <Separator />}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
