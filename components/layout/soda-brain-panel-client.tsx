"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Brain, Check, Send } from "lucide-react";
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

function BrainOrb() {
  return (
    <div className="soda-brain-orb mx-auto" aria-hidden>
      <div className="soda-brain-orb-ring">
        <div className="soda-brain-orb-core">
          <Brain className="size-9 text-violet-200 drop-shadow-[0_0_12px_rgba(210,59,104,0.65)]" />
        </div>
      </div>
    </div>
  );
}

/** Founder SODA Brain right rail — Quick Ask, Today's Focus, Key Insights. */
export function SodaBrainPanelClient({
  data,
  variant = "rail",
  className,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const focusTotal = data.focus.length;
  const focusDone = data.focus.filter((item) => item.completed).length;
  const focusProgress =
    focusTotal > 0 ? Math.round((focusDone / focusTotal) * 100) : 0;

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
        "soda-brain-panel flex min-h-0 flex-col border-border/60 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background)_88%,#29194A)_0%,var(--background)_55%,color-mix(in_srgb,var(--background)_94%,#1a1030)_100%)]",
        variant === "rail"
          ? "hidden h-screen w-[var(--soda-brain-rail-width,17.5rem)] shrink-0 border-l lg:flex"
          : "flex h-full w-full flex-col border-0",
        className
      )}
      aria-label="SODA Brain"
    >
      <div className="shrink-0 border-b border-violet-500/20 px-4 pb-4 pt-5">
        <BrainOrb />
        <div className="mt-3 text-center">
          <p className="text-xs font-bold tracking-[0.14em] text-violet-200 uppercase">
            SODA Brain
          </p>
          <div className="mt-1 flex items-center justify-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              Founder Intelligence
            </p>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              Online
            </span>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <form onSubmit={handleQuickAsk} className="space-y-2">
          <p
            className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
            lang="ar"
            dir="rtl"
          >
            اسأل سودا
          </p>
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
        </form>

        <section aria-labelledby="brain-today-focus">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2
              id="brain-today-focus"
              className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
            >
              Today&apos;s Focus
            </h2>
            {focusTotal > 0 ? (
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                {focusDone} / {focusTotal}
              </span>
            ) : null}
          </div>
          {focusTotal > 0 ? (
            <div
              className="mb-2 h-1.5 overflow-hidden rounded-full bg-violet-500/15"
              role="progressbar"
              aria-valuenow={focusProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Today's focus progress"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-soda-pink transition-[width] duration-500 ease-out"
                style={{ width: `${focusProgress}%` }}
              />
            </div>
          ) : null}
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
                      className="soda-brain-focus-item flex items-start gap-2 rounded-lg border border-violet-500/15 bg-violet-500/5 px-3 py-2 transition-colors hover:bg-violet-500/10"
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border",
                          item.completed
                            ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                            : "border-violet-500/30 bg-background/40"
                        )}
                        aria-hidden
                      >
                        {item.completed ? (
                          <Check className="size-2.5" />
                        ) : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-snug">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.detail}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div className="soda-brain-focus-item flex items-start gap-2 rounded-lg border border-violet-500/15 bg-violet-500/5 px-3 py-2">
                      <span
                        className={cn(
                          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border",
                          item.completed
                            ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                            : "border-violet-500/30 bg-background/40"
                        )}
                        aria-hidden
                      >
                        {item.completed ? (
                          <Check className="size-2.5" />
                        ) : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-snug">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.detail}
                        </p>
                      </div>
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
              {data.insights.map((item) => {
                const row = (
                  <div className="soda-brain-insight-card rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2.5">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="truncate text-sm font-bold text-foreground">
                      {item.value}
                    </p>
                  </div>
                );
                return (
                  <li key={item.id}>
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="block transition-opacity hover:opacity-90"
                      >
                        {row}
                      </Link>
                    ) : (
                      row
                    )}
                  </li>
                );
              })}
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
          variant="outline"
          className="w-full gap-2 border-violet-500/35 bg-transparent text-foreground hover:bg-violet-500/10"
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
