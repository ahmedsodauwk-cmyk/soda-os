"use client";

import { Brain } from "lucide-react";

import { SodaBrainPanelClient } from "@/components/layout/soda-brain-panel-client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { CommandCenterBrainPanelData } from "@/lib/brain/command-center-panel";

type Props = {
  data: CommandCenterBrainPanelData;
  className?: string;
};

/** Tablet / mobile — Brain opens as full-height sheet. */
export function SodaBrainDrawer({ data, className }: Props) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={className}
            aria-label="Open SODA Brain"
          />
        }
      >
        <Brain className="size-4 text-violet-300" aria-hidden />
        <span className="hidden sm:inline">Brain</span>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full max-w-md border-violet-500/20 p-0"
      >
        <SheetTitle className="sr-only">SODA Brain</SheetTitle>
        <SodaBrainPanelClient data={data} variant="drawer" />
      </SheetContent>
    </Sheet>
  );
}
