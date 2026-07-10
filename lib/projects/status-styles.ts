import type { ProjectStatus } from "@/lib/projects/types";

export const projectStatusStyles: Record<ProjectStatus, string> = {
  Active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  OnHold: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  Completed: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  Cancelled: "border-red-500/30 bg-red-500/10 text-red-400",
};
