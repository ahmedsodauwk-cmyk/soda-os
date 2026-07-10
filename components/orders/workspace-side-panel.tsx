"use client";

import { cn } from "@/lib/utils";
import type { WorkspaceSubcategory } from "@/lib/taxonomy/types";

interface WorkspaceSidePanelProps {
  title: string;
  subcategories: WorkspaceSubcategory[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}

export function WorkspaceSidePanel({
  title,
  subcategories,
  activeId,
  onSelect,
}: WorkspaceSidePanelProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-1 sm:w-48">
      <p className="mb-1 px-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </p>

      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          activeId === null
            ? "bg-muted font-medium text-foreground"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        All {title}
      </button>

      {subcategories.map((sub) => (
        <button
          key={sub.id}
          type="button"
          onClick={() => onSelect(sub.id)}
          className={cn(
            "rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            activeId === sub.id
              ? "bg-muted font-medium text-foreground"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          {sub.label}
        </button>
      ))}
    </aside>
  );
}
