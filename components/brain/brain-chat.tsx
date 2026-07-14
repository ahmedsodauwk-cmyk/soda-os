"use client";

/**
 * SODA Brain Chat — Founder COO assistant (Mission 05.2).
 * Left: conversation · Center: compose · Right: Understood + Related Memories
 * Intelligence Layer only. No AI API. No ERP. Save only after Founder approves.
 */

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, Brain, Send } from "lucide-react";

import {
  brainContextAction,
  confirmBrainUnderstandingAction,
  loadBrainChatAction,
  understandBrainChatAction,
} from "@/lib/brain/actions";
import {
  applyUnderstandingEdits,
  type BrainUnderstanding,
  type EntityTimeline,
  type RelatedMemory,
  type UnderstandingEdits,
} from "@/lib/brain/intelligence";
import type { BrainChatMessage } from "@/lib/brain/types";
import { WORKSPACE_LABELS_AR, WORKSPACE_LABELS_EN } from "@/lib/brain/types";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { UnderstandingPanel } from "@/components/brain/understanding-panel";
import { RelatedMemoriesPanel } from "@/components/brain/related-memories-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  initialMessages: BrainChatMessage[];
  migrationHint?: string | null;
};

type LocalBubble = {
  id: string;
  role: "user" | "assistant";
  content: string;
  ephemeral?: boolean;
};

export function BrainChat({ initialMessages, migrationHint }: Props) {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const labels = ar ? WORKSPACE_LABELS_AR : WORKSPACE_LABELS_EN;
  const [messages, setMessages] = useState(() =>
    Array.isArray(initialMessages) ? initialMessages : []
  );
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [understanding, setUnderstanding] = useState<BrainUnderstanding | null>(
    null
  );
  const [related, setRelated] = useState<RelatedMemory[]>([]);
  const [timelines, setTimelines] = useState<EntityTimeline[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [localBubbles, setLocalBubbles] = useState<LocalBubble[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const contextTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, localBubbles.length, understanding]);

  useEffect(() => {
    startTransition(async () => {
      try {
        const res = await loadBrainChatAction();
        if (res.ok && res.messages) setMessages(res.messages);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to refresh chat."
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount refresh only
  }, []);

  useEffect(() => {
    if (contextTimer.current) clearTimeout(contextTimer.current);
    const draft = text.trim();
    if (draft.length < 3 || understanding) return;

    contextTimer.current = setTimeout(() => {
      startTransition(async () => {
        try {
          const res = await brainContextAction({ text: draft });
          if (!res.ok) return;
          if (res.related) setRelated(res.related);
          if (res.timelines) setTimelines(res.timelines);
          if (res.suggestions) setSuggestions(res.suggestions);
        } catch {
          /* live context is best-effort */
        }
      });
    }, 450);

    return () => {
      if (contextTimer.current) clearTimeout(contextTimer.current);
    };
  }, [text, understanding]);

  function clearPending() {
    setUnderstanding(null);
    setLocalBubbles([]);
    setRelated([]);
    setTimelines([]);
    setSuggestions([]);
  }

  function parse() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setError(null);
    setText("");
    setLocalBubbles([
      { id: `local-u-${Date.now()}`, role: "user", content: trimmed, ephemeral: true },
    ]);

    startTransition(async () => {
      try {
        const res = await understandBrainChatAction({ text: trimmed });
        if (!res.ok || !res.understanding) {
          setError(res.error ?? "Parse failed");
          setText(trimmed);
          setLocalBubbles([]);
          return;
        }
        setUnderstanding(res.understanding);
        setRelated(res.related ?? []);
        setTimelines(res.timelines ?? []);
        setSuggestions(res.suggestions ?? []);
        setLocalBubbles((prev) => [
          ...prev,
          {
            id: `local-a-${Date.now()}`,
            role: "assistant",
            content: ar
              ? res.understanding!.founderSummaryAr
              : res.understanding!.founderSummaryEn,
            ephemeral: true,
          },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Parse failed.");
        setText(trimmed);
        setLocalBubbles([]);
      }
    });
  }

  function onEdit(edits: UnderstandingEdits) {
    setUnderstanding((prev) =>
      prev ? applyUnderstandingEdits(prev, edits) : prev
    );
  }

  function onSave() {
    if (!understanding) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await confirmBrainUnderstandingAction({
          understanding,
          locale: ar ? "ar" : "en",
        });
        if (!res.ok) {
          setError(res.error ?? "Save failed");
          return;
        }
        if (res.messages) setMessages(res.messages);
        clearPending();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed.");
      }
    });
  }

  function onCancel() {
    clearPending();
  }

  const showThread =
    messages.length > 0 || localBubbles.length > 0;

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border border-violet-500/20 bg-[linear-gradient(180deg,rgba(36,22,64,0.55)_0%,rgba(12,10,20,0.96)_45%,rgba(10,8,16,0.99)_100%)] text-violet-50 lg:flex-row">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.18),transparent_50%)]"
        aria-hidden
      />

      {/* LEFT — conversation history */}
      <aside className="relative z-[1] flex w-full flex-col border-b border-violet-500/15 lg:w-[240px] lg:shrink-0 lg:border-b-0 lg:border-e">
        <header className="flex items-center gap-2 border-b border-violet-500/15 px-3 py-3">
          <Link
            href="/brain"
            className="rounded-md p-1.5 text-violet-300/70 hover:bg-violet-500/15 hover:text-violet-50"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium tracking-tight">
              SODA Brain
            </p>
            <p className="truncate text-[10px] text-violet-300/55">
              {ar ? "مساعد المؤسس · COO" : "Founder COO desk"}
            </p>
          </div>
          <Brain className="size-4 text-violet-400/50" aria-hidden />
        </header>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          <p className="px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-violet-400/45">
            {ar ? "المحادثة" : "Conversation"}
          </p>
          {messages.length === 0 && localBubbles.length === 0 ? (
            <p className="px-2 text-[11px] text-violet-400/40">
              {ar ? "فاضية لسه" : "Empty for now"}
            </p>
          ) : (
            messages
              .filter((m) => m.role === "user")
              .slice(-24)
              .reverse()
              .map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="w-full rounded-lg px-2 py-1.5 text-start text-[11px] text-violet-200/70 hover:bg-violet-500/10"
                  onClick={() =>
                    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  <span className="line-clamp-2">{m.content}</span>
                  {m.classifiedWorkspace ? (
                    <span className="mt-0.5 block text-[9px] text-violet-400/45">
                      {labels[m.classifiedWorkspace] ?? m.classifiedWorkspace}
                    </span>
                  ) : null}
                </button>
              ))
          )}
        </div>
      </aside>

      {/* CENTER — chat */}
      <div className="relative z-[1] flex min-w-0 flex-1 flex-col">
        <header className="border-b border-violet-500/15 px-4 py-3">
          <p className="text-sm font-medium">
            {ar ? "طبقة الذكاء" : "Intelligence Layer"}
          </p>
          <p className="text-[11px] text-violet-300/55">
            {ar
              ? "تحليل محلي · موافقة قبل الحفظ · مفيش ERP · مفيش AI خارجي"
              : "Local parse · approve before save · never ERP · no external AI"}
          </p>
        </header>

        {migrationHint ? (
          <p className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-100/90">
            {migrationHint}
          </p>
        ) : null}

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {!showThread ? (
            <div className="mx-auto max-w-md py-14 text-center">
              <p className="text-sm text-violet-200/75">
                {ar
                  ? "اكتب زي ما بتتكلم مع كوّ. الدماغ هيفهم ويقترح — وأنت اللي بتحفظ."
                  : "Write like you’re briefing your COO. Brain understands and proposes — you approve the save."}
              </p>
              <p className="mt-3 text-[11px] leading-relaxed text-violet-400/50">
                {ar
                  ? "أمثلة: «ليا عند RTM 120 ألف» · «نيمو خد 1000» · «فكرة لموقع جديد»"
                  : "Try: “ليا عند RTM 120 ألف” · “نيمو خد 1000” · “idea for a new site”"}
              </p>
            </div>
          ) : (
            <>
              {messages.map((m) => {
                const mine = m.role === "user";
                return (
                  <div
                    key={m.id}
                    className={cn("flex", mine ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                        mine
                          ? "bg-violet-500/85 text-white"
                          : "border border-violet-500/20 bg-violet-950/50 text-violet-100/90"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      {!mine && m.classifiedWorkspace ? (
                        <p className="mt-1.5 text-[10px] text-violet-300/55">
                          →{" "}
                          {labels[m.classifiedWorkspace] ??
                            m.classifiedWorkspace}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              {localBubbles.map((m) => {
                const mine = m.role === "user";
                return (
                  <div
                    key={m.id}
                    className={cn("flex", mine ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                        mine
                          ? "bg-violet-500/70 text-white ring-1 ring-violet-300/30"
                          : "border border-dashed border-violet-400/30 bg-violet-950/40 text-violet-100/90"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      {!mine ? (
                        <p className="mt-1.5 text-[10px] text-amber-200/60">
                          {ar
                            ? "معلق — احفظ من اللوحة يمين"
                            : "Pending — save from the right panel"}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {error ? (
          <p className="border-t border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-100">
            {error}
          </p>
        ) : null}

        <div className="border-t border-violet-500/15 p-3">
          <div className="flex items-end gap-2 rounded-2xl border border-violet-500/20 bg-violet-950/40 p-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!understanding) parse();
                }
              }}
              disabled={Boolean(understanding) || pending}
              rows={2}
              placeholder={
                ar
                  ? "اكتب للمؤسس… (تحليل قبل الحفظ)"
                  : "Brief your Brain… (parse before save)"
              }
              className="min-h-[52px] flex-1 resize-none border-0 bg-transparent text-sm text-violet-50 shadow-none placeholder:text-violet-400/40 focus-visible:ring-0"
            />
            <Button
              type="button"
              disabled={pending || !text.trim() || Boolean(understanding)}
              onClick={parse}
              className="h-10 shrink-0 gap-1 rounded-xl bg-violet-500 text-white hover:bg-violet-400"
            >
              <Send className="size-3.5" />
              {ar ? "فهم" : "Parse"}
            </Button>
          </div>
          <p className="mt-1.5 px-1 text-[10px] text-violet-400/40">
            {ar
              ? "Enter للتحليل · الحفظ من لوحة «الدماغ فهم» فقط"
              : "Enter to parse · Save only from Brain Understood panel"}
          </p>
        </div>
      </div>

      {/* RIGHT — Understood + Related + Suggestions */}
      <aside className="relative z-[1] flex w-full flex-col border-t border-violet-500/15 lg:w-[320px] lg:shrink-0 lg:border-s lg:border-t-0">
        <div className="flex-1 space-y-4 overflow-y-auto p-3">
          {understanding ? (
            <UnderstandingPanel
              understanding={understanding}
              ar={ar}
              pending={pending}
              onChange={onEdit}
              onSave={onSave}
              onCancel={onCancel}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-violet-500/20 bg-violet-950/25 px-3 py-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-violet-300/60">
                {ar ? "الدماغ فهم" : "Brain Understood"}
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-violet-400/50">
                {ar
                  ? "بعد التحليل هتظهر الحقول والثقة هنا. مفيش حفظ صامت."
                  : "After parse, fields and confidence appear here. No silent saves."}
              </p>
            </div>
          )}

          <RelatedMemoriesPanel
            related={related}
            timelines={timelines}
            suggestions={suggestions}
            ar={ar}
          />
        </div>
      </aside>
    </div>
  );
}
