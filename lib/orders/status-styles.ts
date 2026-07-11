import type { OrderStatus } from "@/lib/orders/types";

export const statusStyles: Record<OrderStatus, string> = {
  Holding: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
  Confirmed: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  Pending: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
  Scheduled: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  Shooting: "border-primary/35 bg-primary/15 text-primary",
  Editing: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  Completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  Delivered: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  Cancelled: "border-red-500/30 bg-red-500/10 text-red-400",
};
