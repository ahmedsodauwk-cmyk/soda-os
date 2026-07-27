"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Brain, Send } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CommandCenterBrainPanelData } from "@/lib/brain/command-center-panel";
import { cn } from "@/lib/utils";

type Props = {
  data: CommandCenterBrainPanelData;
  /** Drawer / sheet variant — full width on small screens. */
  variant?: "rail" | "drawer";
  className?: string;
};

/** Founder SODA Brain right rail — Quick Ask, Today's Focus, Key Insights. */
export function SodaBrainPanelClient({
  data,
  variant = "rail",
  className,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  function handleQuickAsk(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    startTransition(() => {
      const params = new URLSearchParams({ q: trimmed });
      router.push(`/brain?${params.toString()}`);
      setQuery("");
    });
  }

  return (
    <aside
      className={cn(
        "soda-brain-panel flex min-h-0 flex-col border-border/60 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background)_92%,#29194A)_0%,var(--background)_100%)]",
        variant === "rail"
          ? "hidden h-screen w-[17.5rem] shrink-0 border-l xl:flex"
          : "flex h-full w-full flex-col border-0",
        className
      )}
      aria-label="SODA Brain"
    >
      <div className="flex items-center gap-2 border-b border-violet-500/20 px-4 py-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/20 text-violet-200">
          <Brain className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">SODA Brain</p>
          <p className="truncate text-xs text-muted-foreground">
            Founder intelligence
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <form onSubmit={handleQuickAsk} className="space-y-2">
          <label htmlFor="brain-quick-ask" className="sr-only">
            Quick Ask
          </label>
          <div className="relative">
            <Input
              id="brain-quick-ask"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اسأل سودا…"
              lang="ar"
              dir="rtl"
              disabled={pending}
              className="h-10 border-violet-500/25 bg-background/60 pe-10 text-[15px]"
            />
            <Button
              type="submit"
              size="icon-sm"
              variant="ghost"
              disabled={pending || !query.trim()}
              className="absolute inset-y-0 end-1 my-auto text-violet-300 hover:text-violet-100"
              aria-label="Send"
            >
              <Send className="size-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Enter to send</p>
        </form>

        <section aria-labelledby="brain-today-focus">
          <h2
            id="brain-today-focus"
            className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
          >
            Today&apos;s Focus
          </h2>
          {data.focus.length === 0 ? (
            <p className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              No urgent focus items — you&apos;re clear for now.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {data.focus.map((item) => (
                <li key={item.id}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="block rounded-lg border border-violet-500/15 bg-violet-500/5 px-3 py-2 transition-colors hover:bg-violet-500/10"
                    >
                      <p className="text-sm font-semibold leading-snug">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.detail}
                      </p>
                    </Link>
                  ) : (
                    <div className="rounded-lg border border-violet-500/15 bg-violet-500/5 px-3 py-2">
                      <p className="text-sm font-semibold leading-snug">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="brain-key-insights">
          <h2
            id="brain-key-insights"
            className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
          >
            Key Insights
          </h2>
          {data.insights.length === 0 ? (
            <p className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              Insights appear as operational data loads.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {data.insights.map((item) => (
                <li key={item.id}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border/50 px-3 py-2 transition-colors hover:bg-muted/40"
                    >
                      <span className="text-sm text-muted-foreground">
                        {item.label}
                      </span>
                      <span className="truncate text-sm font-semibold text-foreground">
                        {item.value}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-border/50 px-3 py-2">
                      <span className="text-sm text-muted-foreground">
                        {item.label}
                      </span>
                      <span className="truncate text-sm font-semibold">
                        {item.value}
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {data.migrationHint ? (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {data.migrationHint}
          </p>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-violet-500/20 p-4">
        <Button
          className="soda-btn-primary w-full gap-2"
          nativeButton={false}
          render={<Link href="/brain" />}
        >
          Open Brain
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </aside>
  );
}
