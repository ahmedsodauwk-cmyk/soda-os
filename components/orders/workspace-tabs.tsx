"use client";

import { cn } from "@/lib/utils";
import type { Workspace } from "@/lib/taxonomy/types";

interface WorkspaceTabsProps {
  workspaces: Workspace[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function WorkspaceTabs({
  workspaces,
  activeId,
  onSelect,
}: WorkspaceTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Commercial lane"
      className="flex flex-wrap gap-1 border-b border-border/60 pb-px"
    >
      <TabButton
        active={activeId === "all"}
        onClick={() => onSelect("all")}
        label="All"
      />
      {workspaces.map((workspace) => (
        <TabButton
          key={workspace.id}
          active={activeId === workspace.id}
          onClick={() => onSelect(workspace.id)}
          label={workspace.label}
        />
      ))}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative rounded-t-md px-3 py-2 text-sm font-medium transition-colors",
        "text-muted-foreground hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active && "text-foreground"
      )}
    >
      {label}
      {active && (
        <span
          aria-hidden
          className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-primary"
        />
      )}
    </button>
  );
}
