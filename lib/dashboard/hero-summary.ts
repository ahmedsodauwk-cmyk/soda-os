/**
 * Hero operational summary — factual Arabic lines from live dashboard signals only.
 * Zero metrics are omitted (never invent filler).
 */

import { getGreeting, toEasternDigits } from "@/lib/brand/soda-voice";
import type { DashboardSnapshot } from "@/lib/dashboard/types";
import type { DashboardVoiceInput, DayPeriod } from "@/lib/brand/types";

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

/** Rotating natural greeting — prefers profile first name. */
export function getHeroGreeting(
  date: Date = new Date(),
  operatorName?: string | null
): string {
  return getGreeting(getHeroDayPeriod(date), date, operatorName);
}

/** @deprecated Prefer getHeroGreeting(date, name) — kept for soft compatibility. */
export const HERO_GREETINGS: Record<DayPeriod, string> = {
  morning: "صباح الخير يا جونيور صودا",
  afternoon: "نهارك أبيض يا جونيور صودا",
  evening: "مساء الفل يا جونيور صودا",
  late_night: "ليلة هادية يا جونيور صودا",
};

export type HeroOperationalLine = {
  text: string;
  href: string;
};

/** Short operational lines — omit any zero metric. Each line drills somewhere useful. */
export function buildHeroOperationalLines(
  input:
    | DashboardVoiceInput
    | Pick<DashboardSnapshot, "kpis" | "attention" | "schedule">
): HeroOperationalLine[] {
  const n = toEasternDigits;
  const lines: HeroOperationalLine[] = [];

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
    lines.push({
      text:
        todayShoots === 1
          ? "عندك شوت واحد النهاردة"
          : `عندك ${n(todayShoots)} شوتات النهاردة`,
      href: "/schedule/today",
    });
  }

  if (todayDeliveries > 0) {
    lines.push({
      text:
        todayDeliveries === 1
          ? "فيه تسليم النهاردة"
          : `فيه ${n(todayDeliveries)} تسليم النهاردة`,
      href: "/schedule/deliveries",
    });
  }

  if (overdue > 0) {
    lines.push({
      text:
        overdue === 1
          ? "فيه تسليمة متأخرة محتاجة متابعة"
          : `فيه ${n(overdue)} تسليمات متأخرة`,
      href: "/attention",
    });
  }

  if (unpaid > 0 && lines.length < 3) {
    lines.push({
      text:
        unpaid === 1
          ? "فيه عميل مستني متابعة فلوس"
          : `فيه ${n(unpaid)} عملاء عليهم فلوس`,
      href: "/attention",
    });
  }

  if (reviewWaiting > 0 && lines.length < 3 && overdue === 0) {
    lines.push({
      text:
        reviewWaiting === 1
          ? "فيه حاجة مستنية قرار منك"
          : `فيه ${n(reviewWaiting)} حاجات مستنية قرار`,
      href: "/attention",
    });
  }

  if (upcomingShoots > 0 && todayShoots === 0 && lines.length < 3) {
    lines.push({
      text: `عندك ${n(upcomingShoots)} شوتات قريبة في الجدول`,
      href: "/calendar",
    });
  }

  if (upcomingDeliveries > 0 && todayDeliveries === 0 && lines.length < 3) {
    lines.push({
      text: `فيه ${n(upcomingDeliveries)} تسليمات قريبة`,
      href: "/schedule/deliveries",
    });
  }

  if (lines.length === 0) {
    lines.push({ text: "أهلاً بيك.", href: "/attention" });
    lines.push({
      text: "دي نظرة سريعة على اللي مستنيك النهارده.",
      href: "/schedule/today",
    });
  }

  return lines.slice(0, 3);
}
