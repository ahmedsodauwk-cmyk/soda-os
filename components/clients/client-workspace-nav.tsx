"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  CLIENT_WORKSPACE_TREE,
  clientWorkspaceHref,
  type ClientWorkspaceSectionId,
} from "@/lib/clients/workspace";

interface ClientWorkspaceNavProps {
  clientId: string;
  active: ClientWorkspaceSectionId;
}

/** Thin section nav for Client Workspace foundation routes. */
export function ClientWorkspaceNav({
  clientId,
  active,
}: ClientWorkspaceNavProps) {
  return (
    <nav
      aria-label="Client workspace"
      className="flex flex-wrap gap-1 border-b border-border/60 pb-px"
    >
      {CLIENT_WORKSPACE_TREE.map((section) => {
        const href = clientWorkspaceHref(clientId, section.id);
        const isActive = section.id === active;
        return (
          <Link
            key={section.id}
            href={href}
            className={cn(
              "relative rounded-t-md px-3 py-2 text-sm font-medium transition-colors",
              "text-muted-foreground hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              isActive && "text-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {section.label}
            {isActive && (
              <span
                aria-hidden
                className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-primary"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
