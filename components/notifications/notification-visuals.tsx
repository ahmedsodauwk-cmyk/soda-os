"use client";

/**
 * Shared Notification Center presentation — Mission 06.2 UX only.
 * No lifecycle / permission changes.
 */

import {
  NOTIFICATION_CATEGORY_ICONS,
  categoryLabel,
} from "@/lib/core/notifications/categories";
import {
  notificationActionLabel,
  notificationPriorityTier,
} from "@/lib/core/notifications/engine";
import { lifecycleLabel } from "@/lib/core/notifications/lifecycle-labels";
import type {
  BusinessEntityType,
  NotificationCategory,
  NotificationRecord,
} from "@/lib/core/types";
import { cn } from "@/lib/utils";

export const NT_MOTION =
  "transition-[opacity,background-color,border-color,box-shadow,transform,color] duration-[180ms] ease-out";

export type SmartFilterKey =
  | "all"
  | "unread"
  | "action"
  | "finance"
  | "orders"
  | "calendar"
  | "crew"
  | "brain"
  | "completed";

export const SMART_FILTERS: Array<{
  key: SmartFilterKey;
  label: string;
  icon?: string;
}> = [
  { key: "all", label: "الكل" },
  { key: "unread", label: "غير مقروء", icon: "●" },
  { key: "action", label: "محتاج رد", icon: "✅" },
  { key: "finance", label: "المالية", icon: "💰" },
  { key: "orders", label: "الأوردرات", icon: "📦" },
  { key: "calendar", label: "التقويم", icon: "📅" },
  { key: "crew", label: "الفريق", icon: "👤" },
  { key: "brain", label: "البراين", icon: "🧠" },
  { key: "completed", label: "مكتمل", icon: "✓" },
];

export type SortKey = "newest" | "oldest" | "priority";

export const SORT_LABELS: Record<SortKey, string> = {
  newest: "الأحدث",
  oldest: "الأقدم",
  priority: "الأولوية",
};

const PRIORITY_RANK: Record<NotificationRecord["priority"], number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

const ENTITY_LABELS: Partial<Record<BusinessEntityType, string>> = {
  order: "أوردر",
  client: "عميل",
  project: "مشروع",
  person: "فرد",
  invoice: "فاتورة",
  payment: "دفعة",
  assignment: "تعيين",
};

export function formatNotificationWhen(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    if (sameDay) {
      return d.toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return d.toLocaleString("ar-EG", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

export function categoryGlyph(category: NotificationCategory): string {
  return NOTIFICATION_CATEGORY_ICONS[category] ?? "⚙️";
}

/** Confirmation ✅ / Warning ⚠️ overlay signal for human scan. */
export function signalGlyph(item: NotificationRecord): string | null {
  if (
    item.requiresAck ||
    item.priority === "urgent" ||
    notificationPriorityTier(item.priority) === "critical"
  ) {
    if (item.requiresAck) return "✅";
    return "⚠️";
  }
  if (notificationPriorityTier(item.priority) === "high") return "⚠️";
  return null;
}

export function entityLine(item: NotificationRecord): string {
  const rel = item.relatedObjects?.[0];
  if (rel?.label) return rel.label;
  const base = ENTITY_LABELS[item.entityType] ?? categoryLabel(item.category);
  if (item.entityId) return `${base} · ${item.entityId.slice(0, 8)}`;
  return base;
}

export function statusLine(item: NotificationRecord): string {
  const action = notificationActionLabel(item);
  const life = lifecycleLabel(item.status);
  if (item.status === "unread") return `${life} · ${action}`;
  return `${life} · ${action}`;
}

export function priorityVisual(priority: NotificationRecord["priority"]) {
  const tier = notificationPriorityTier(priority);
  switch (tier) {
    case "critical":
      return {
        bar: "bg-destructive",
        chip: "bg-destructive/15 text-destructive",
        glow: "shadow-[0_0_24px_-4px_color-mix(in_srgb,var(--destructive)_45%,transparent)]",
      };
    case "high":
      return {
        bar: "bg-soda-pink",
        chip: "bg-soda-pink/15 text-soda-pink",
        glow: "shadow-[0_0_22px_-2px_color-mix(in_srgb,var(--soda-pink)_40%,transparent)]",
      };
    case "info":
      return {
        bar: "bg-muted-foreground/35",
        chip: "bg-muted text-muted-foreground",
        glow: "",
      };
    default:
      return {
        bar: "bg-soda-purple/45",
        chip: "bg-soda-purple/10 text-foreground/80",
        glow: "shadow-[0_0_18px_-4px_color-mix(in_srgb,var(--soda-pink)_28%,transparent)]",
      };
  }
}

export function notificationCardClass(
  item: NotificationRecord,
  opts: { selected?: boolean; compact?: boolean } = {}
): string {
  const unread = item.status === "unread";
  const visual = priorityVisual(item.priority);
  return cn(
    NT_MOTION,
    "relative overflow-hidden rounded-xl border text-start",
    opts.compact ? "px-3 py-2.5" : "px-3 py-3",
    unread
      ? cn(
          "border-soda-pink/35 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--soda-pink)_14%,transparent)_0%,color-mix(in_oklch,var(--soda-purple)_8%,var(--card))_55%)]",
          "ring-1 ring-soda-pink/20",
          visual.glow
        )
      : "border-border/50 bg-background/30 opacity-[0.72] hover:opacity-90",
    opts.selected &&
      "border-soda-pink/55 bg-soda-pink/[0.12] opacity-100 ring-1 ring-soda-pink/35 shadow-[inset_3px_0_0_0_var(--soda-pink)]"
  );
}

export function matchesSmartFilter(
  item: NotificationRecord,
  filter: SmartFilterKey,
  needsAction: boolean
): boolean {
  switch (filter) {
    case "all":
      return item.status !== "completed";
    case "unread":
      return item.status === "unread";
    case "action":
      return needsAction && item.status !== "completed";
    case "finance":
      return item.category === "finance" && item.status !== "completed";
    case "orders":
      return item.category === "orders" && item.status !== "completed";
    case "calendar":
      return item.category === "calendar" && item.status !== "completed";
    case "crew":
      return item.category === "crew" && item.status !== "completed";
    case "brain":
      return item.category === "brain" && item.status !== "completed";
    case "completed":
      return item.status === "completed";
    default:
      return true;
  }
}

export function sortNotifications(
  items: NotificationRecord[],
  sort: SortKey
): NotificationRecord[] {
  const copy = [...items];
  copy.sort((a, b) => {
    if (sort === "priority") {
      const pr =
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
        (a.status === "unread" ? 0 : 1) - (b.status === "unread" ? 0 : 1);
      if (pr !== 0) return pr;
      return b.createdAt.localeCompare(a.createdAt);
    }
    const t = a.createdAt.localeCompare(b.createdAt);
    return sort === "oldest" ? t : -t;
  });
  return copy;
}

export function CategoryBadge({
  category,
  className,
}: {
  category: NotificationCategory;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-ar inline-flex items-center gap-1 text-[11px] text-muted-foreground",
        className
      )}
    >
      <span aria-hidden>{categoryGlyph(category)}</span>
      {categoryLabel(category)}
    </span>
  );
}
