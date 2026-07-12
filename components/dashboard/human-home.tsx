import Link from "next/link";
import { Lightbulb, MessageCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBriefCopy } from "@/lib/brand/soda-voice";
import type { DashboardVoiceInput } from "@/lib/brand/types";

interface HumanMessageProps {
  dashboard: DashboardVoiceInput;
  operatorName?: string | null;
}

/** Teammate mood line — from existing brief/mood engine, not a parallel system. */
export function HumanMessage({ dashboard, operatorName }: HumanMessageProps) {
  const brief = getBriefCopy(dashboard, new Date(), operatorName);

  return (
    <Card className="soda-cc-card soda-brief-shell overflow-hidden">
      <CardHeader className="py-3 pb-1.5">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <MessageCircle className="size-3.5 text-soda-pink sm:size-4" />
          رسالة النهاردة
        </CardTitle>
        <CardDescription className="font-ar text-xs" dir="rtl">
          {brief.label}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 pb-3" dir="rtl">
        <p className="font-ar text-sm leading-snug text-foreground/90">
          {brief.hook}
        </p>
        {brief.closer ? (
          <p className="font-ar text-xs text-muted-foreground">{brief.closer}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

interface SmartTipProps {
  dashboard: DashboardVoiceInput;
}

/** One actionable tip from attention / schedule — reuses brief priority. */
export function SmartTip({ dashboard }: SmartTipProps) {
  const brief = getBriefCopy(dashboard, new Date());
  const tip = brief.priority;

  return (
    <Card className="soda-cc-card">
      <CardHeader className="py-3 pb-1.5">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Lightbulb className="size-3.5 text-soda-pink sm:size-4" />
          نصيحة ذكية
        </CardTitle>
        <CardDescription className="font-ar text-xs" dir="rtl">
          خطوة واحدة تستاهل نظرة دلوقتي.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3" dir="rtl">
        {tip ? (
          <div className="space-y-1">
            <p className="font-ar text-xs text-muted-foreground">{tip.eyebrow}</p>
            <p className="font-ar text-sm font-medium leading-snug">{tip.title}</p>
            <p className="font-ar line-clamp-2 text-xs text-muted-foreground">
              {tip.detail}
            </p>
            <Link
              href={tip.href}
              className="font-ar inline-block cursor-pointer text-xs font-medium text-soda-pink hover:underline"
            >
              {tip.ctaLabel === "Open issue"
                ? "افتح المتابعة"
                : tip.ctaLabel === "View schedule"
                  ? "شوف الجدول"
                  : tip.ctaLabel === "Open orders"
                    ? "افتح الأوردرات"
                    : tip.ctaLabel}
            </Link>
          </div>
        ) : (
          <p className="font-ar text-sm text-muted-foreground">
            مفيش ضغط دلوقتي — استغل الهدوء ورتّب اللي جاي.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
