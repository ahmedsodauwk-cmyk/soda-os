/**
 * Hero operational summary — factual Arabic lines from live dashboard signals only.
 * Zero metrics are omitted (never invent filler).
 */

import { toEasternDigits } from "@/lib/brand/soda-voice";
import type { DashboardSnapshot } from "@/lib/dashboard/types";
import type { DashboardVoiceInput, DayPeriod } from "@/lib/brand/types";

/** Exact time-of-day greetings for Command Center hero. */
export const HERO_GREETINGS: Record<DayPeriod, string> = {
  morning: "صباح الخير يا جونيور صودا",
  afternoon: "نهارك أبيض يا جونيور صودا",
  evening: "مساء الفل يا جونيور صودا",
  late_night: "ليلة هادية يا جونيور صودا",
};

/**
 * Local-time buckets:
 * late night 22–04 · morning 05–11 · afternoon 12–16 · evening 17–21
 */
export function getHeroDayPeriod(date: Date = new Date()): DayPeriod {
  const hour = date.getHours();
  if (hour >= 22 || hour < 5) return "late_night";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function getHeroGreeting(date: Date = new Date()): string {
  return HERO_GREETINGS[getHeroDayPeriod(date)];
}

/** Short operational lines — omit any zero metric. */
export function buildHeroOperationalLines(
  input: DashboardVoiceInput | Pick<DashboardSnapshot, "kpis" | "attention" | "schedule">
): string[] {
  const n = toEasternDigits;
  const lines: string[] = [];

  const todayShoots = input.schedule.todayShoots.length;
  const todayDeliveries = input.schedule.deliveries.filter(
    (d) => d.when === "today"
  ).length;
  const overdue = input.attention.filter(
    (a) => a.category === "overdue_delivery"
  ).length;
  const unpaid = input.attention.filter(
    (a) => a.category === "unpaid_client"
  ).length;
  const reviewWaiting = input.attention.filter(
    (a) =>
      a.category === "unpaid_client" ||
      a.category === "deadline_soon" ||
      a.severity === "critical"
  ).length;
  const upcomingShoots = input.kpis.upcomingShoots;
  const upcomingDeliveries = input.kpis.upcomingDeliveries;

  if (todayShoots > 0) {
    lines.push(
      todayShoots === 1
        ? "عندك شوت واحد النهاردة"
        : `عندك ${n(todayShoots)} شوتات النهاردة`
    );
  }

  if (todayDeliveries > 0) {
    lines.push(
      todayDeliveries === 1
        ? "فيه تسليم النهاردة"
        : `فيه ${n(todayDeliveries)} تسليم النهاردة`
    );
  }

  if (overdue > 0) {
    lines.push(
      overdue === 1
        ? "فيه تسليمة متأخرة محتاجة متابعة"
        : `فيه ${n(overdue)} تسليمات متأخرة`
    );
  }

  if (unpaid > 0) {
    lines.push(
      unpaid === 1
        ? "فيه عميل مستني متابعة فلوس"
        : `فيه ${n(unpaid)} عملاء عليهم فلوس`
    );
  } else if (reviewWaiting > 0 && lines.length < 3) {
    lines.push(
      reviewWaiting === 1
        ? "فيه عميل مستني مراجعة"
        : `فيه ${n(reviewWaiting)} حاجات مستنية مراجعة`
    );
  }

  if (todayShoots === 0 && upcomingShoots > 0 && lines.length < 3) {
    lines.push(`عندك ${n(upcomingShoots)} شوتات قريبة في الجدول`);
  }

  if (todayDeliveries === 0 && upcomingDeliveries > 0 && lines.length < 3) {
    lines.push(`فيه ${n(upcomingDeliveries)} تسليمات قريبة`);
  }

  return lines.slice(0, 4);
}
