"use client";

/**
 * SODA Operations Desk — Founder Digital COO (Mission 05.3).
 * LEFT history · CENTER conversation · RIGHT understanding · BOTTOM controls
 * Phase A: Understand / Ask / Prepare · Phase B: Approve → Execute
 * Heuristic Intelligence Layer only. Voice = mic stub.
 */

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, Mic, MicOff, Send, Sparkles } from "lucide-react";

import {
  answerOpsQuestionAction,
  approveOpsDraftAction,
  brainContextAction,
  executeOpsDraftAction,
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

export function OperationsDesk({ initialMessages, migrationHint }: Props) {
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
  const [micArmed, setMicArmed] = useState(false);
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
          err instanceof Error ? err.message : "Failed to refresh desk."
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
    setMicArmed(false);
  }

  function pushAssistant(content: string) {
    setLocalBubbles((prev) => [
      ...prev,
      {
        id: `local-a-${Date.now()}`,
        role: "assistant",
        content,
        ephemeral: true,
      },
    ]);
  }

  function parse() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setError(null);
    setText("");

    // If draft open and waiting on a question — treat as follow-up answer
    if (
      understanding &&
      understanding.lifecycle === "draft" &&
      understanding.missingFields.length > 0
    ) {
      setLocalBubbles((prev) => [
        ...prev,
        {
          id: `local-u-${Date.now()}`,
          role: "user",
          content: trimmed,
          ephemeral: true,
        },
      ]);
      startTransition(async () => {
        try {
          const res = await answerOpsQuestionAction({
            understanding,
            answer: trimmed,
          });
          if (!res.ok || !res.understanding) {
            setError(res.error ?? "Follow-up failed");
            return;
          }
          setUnderstanding(res.understanding);
          pushAssistant(
            ar
              ? res.understanding.founderSummaryAr
              : res.understanding.founderSummaryEn
          );
        } catch (err) {
          setError(err instanceof Error ? err.message : "Follow-up failed.");
        }
      });
      return;
    }

    setLocalBubbles([
      {
        id: `local-u-${Date.now()}`,
        role: "user",
        content: trimmed,
        ephemeral: true,
      },
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
        pushAssistant(
          ar
            ? res.understanding.founderSummaryAr
            : res.understanding.founderSummaryEn
        );
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

  function onApprove() {
    if (!understanding) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await approveOpsDraftAction({ understanding });
        if (!res.ok || !res.understanding) {
          setError(res.error ?? "Approve failed");
          return;
        }
        setUnderstanding(res.understanding);
        pushAssistant(
          ar
            ? "موافق. اضغط تنفيذ لما تكون جاهز — مفيش حاجة هتتنفّذ لوحدها."
            : "Approved. Press Execute when ready — nothing runs on its own."
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Approve failed.");
      }
    });
  }

  function onExecute() {
    if (!understanding) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await executeOpsDraftAction({
          understanding,
          locale: ar ? "ar" : "en",
        });
        if (!res.ok) {
          setError(res.error ?? "Execute failed");
          return;
        }
        if (res.messages) setMessages(res.messages);
        pushAssistant(
          ar
            ? res.messageAr ?? "اتنفّذ."
            : res.messageEn ?? "Executed."
        );
        setUnderstanding(
          res.understanding
            ? { ...res.understanding, lifecycle: "executed" }
            : null
        );
        // Clear draft after short beat so Founder sees confirmation
        setTimeout(() => clearPending(), 600);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Execute failed.");
      }
    });
  }

  function onCancel() {
    clearPending();
  }

  function onMicStub() {
    setMicArmed((v) => !v);
    setError(
      ar
        ? "الميكروفون جاهز كـ stub — مفيش Speech API لسه."
        : "Mic stub armed — no Speech API yet."
    );
  }

  const showThread = messages.length > 0 || localBubbles.length > 0;
  const draftOpen = Boolean(understanding);

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border border-violet-500/25 bg-[linear-gradient(165deg,rgba(28,16,48,0.92)_0%,rgba(12,8,22,0.98)_42%,rgba(8,6,14,1)_100%)] text-violet-50 lg:flex-row">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.22),transparent_48%),radial-gradient(ellipse_at_bottom_left,rgba(91,33,182,0.12),transparent_45%)]"
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
              {ar ? "مكتب العمليات" : "Operations Desk"}
            </p>
            <p className="truncate text-[10px] text-violet-300/55">
              {ar ? "COO رقمي · للمؤسس فقط" : "Digital COO · Founder only"}
            </p>
          </div>
          <Sparkles className="size-4 text-violet-400/50" aria-hidden />
        </header>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          <p className="px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-violet-400/45">
            {ar ? "السجل" : "History"}
          </p>
          {messages.length === 0 && localBubbles.length === 0 ? (
            <p className="px-2 text-[11px] text-violet-400/40">
              {ar ? "فاضي لسه" : "Empty for now"}
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

      {/* CENTER — conversation */}
      <div className="relative z-[1] flex min-w-0 flex-1 flex-col">
        <header className="border-b border-violet-500/15 px-4 py-3">
          <p className="text-sm font-medium">
            {ar ? "مكتب العمليات · Brain COO" : "Operations Desk · Brain COO"}
          </p>
          <p className="text-[11px] text-violet-300/55">
            {ar
              ? "فهم → سؤال → مسودة → موافقة → تنفيذ · مفيش ERP صامت"
              : "Understand → ask → draft → approve → execute · no silent ERP"}
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
              <p className="text-sm text-violet-200/80">
                {ar
                  ? "كلّمني زي ما بتكلم مدير عمليات. هفهم وأسأل وأجهّز مسودة — التنفيذ بإيدك."
                  : "Brief me like your ops lead. I’ll understand, ask, and draft — you execute."}
              </p>
              <p className="mt-3 text-[11px] leading-relaxed text-violet-400/50">
                {ar
                  ? "أمثلة: «ليا عند المصرية 120 ألف» · «نيمو خد 1000» · «ضيف عميل RTM»"
                  : "Try: “ليا عند المصرية 120 ألف” · “نيمو خد 1000” · “ضيف عميل RTM”"}
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
                      {!mine && understanding?.lifecycle === "draft" ? (
                        <p className="mt-1.5 text-[10px] text-amber-200/60">
                          {ar
                            ? "مسودة — موافقة ثم تنفيذ من اللوحة / الشريط تحت"
                            : "Draft — Approve then Execute from panel / bottom bar"}
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

        {/* BOTTOM — input + Mic stub + Parse + Approve + Execute + Cancel */}
        <div className="border-t border-violet-500/15 p-3">
          <div className="flex items-end gap-2 rounded-2xl border border-violet-500/25 bg-violet-950/50 p-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onMicStub}
              className={cn(
                "h-10 w-10 shrink-0 rounded-xl",
                micArmed
                  ? "bg-violet-500/30 text-violet-100"
                  : "text-violet-300/60 hover:bg-violet-500/15"
              )}
              title={ar ? "ميكروفون (قريباً)" : "Mic (stub)"}
            >
              {micArmed ? (
                <Mic className="size-4" />
              ) : (
                <MicOff className="size-4" />
              )}
            </Button>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  parse();
                }
              }}
              disabled={
                pending ||
                understanding?.lifecycle === "approved" ||
                understanding?.lifecycle === "executed"
              }
              rows={2}
              placeholder={
                understanding?.lifecycle === "draft" &&
                understanding.missingFields.length > 0
                  ? ar
                    ? understanding.nextQuestionAr ?? "جاوب على السؤال…"
                    : understanding.nextQuestionEn ?? "Answer the question…"
                  : ar
                    ? "كلّم مكتب العمليات…"
                    : "Brief the Operations Desk…"
              }
              className="min-h-[52px] flex-1 resize-none border-0 bg-transparent text-sm text-violet-50 shadow-none placeholder:text-violet-400/40 focus-visible:ring-0"
            />
            <Button
              type="button"
              disabled={
                pending ||
                !text.trim() ||
                understanding?.lifecycle === "approved" ||
                understanding?.lifecycle === "executed"
              }
              onClick={parse}
              className="h-10 shrink-0 gap-1 rounded-xl bg-violet-500 text-white hover:bg-violet-400"
            >
              <Send className="size-3.5" />
              {ar ? "فهم" : "Parse"}
            </Button>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={
                pending ||
                !draftOpen ||
                !understanding?.canApprove ||
                understanding.lifecycle !== "draft"
              }
              onClick={onApprove}
              className="rounded-xl bg-violet-600/90 text-white hover:bg-violet-500 disabled:opacity-40"
            >
              {ar ? "موافقة" : "Approve"}
            </Button>
            <Button
              type="button"
              disabled={
                pending ||
                !draftOpen ||
                understanding?.lifecycle !== "approved"
              }
              onClick={onExecute}
              className="rounded-xl bg-emerald-600/90 text-white hover:bg-emerald-500 disabled:opacity-40"
            >
              {ar ? "تنفيذ" : "Execute"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={pending || !draftOpen}
              onClick={onCancel}
              className="rounded-xl text-violet-200/80 hover:bg-violet-500/15"
            >
              {ar ? "إلغاء" : "Cancel"}
            </Button>
          </div>
          <p className="mt-1.5 px-1 text-[10px] text-violet-400/40">
            {ar
              ? "Mic = stub · Heuristic فقط · ERP بعد موافقة + تنفيذ فقط"
              : "Mic = stub · Heuristic only · ERP only after Approve + Execute"}
          </p>
        </div>
      </div>

      {/* RIGHT — Understanding Panel */}
      <aside className="relative z-[1] flex w-full flex-col border-t border-violet-500/15 lg:w-[340px] lg:shrink-0 lg:border-s lg:border-t-0">
        <div className="flex-1 space-y-4 overflow-y-auto p-3">
          {understanding ? (
            <UnderstandingPanel
              understanding={understanding}
              ar={ar}
              pending={pending}
              onChange={onEdit}
              onApprove={onApprove}
              onExecute={onExecute}
              onCancel={onCancel}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-violet-500/20 bg-violet-950/25 px-3 py-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-violet-300/60">
                {ar ? "لوحة الفهم" : "Understanding Panel"}
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-violet-400/50">
                {ar
                  ? "بعد الفهم هتشوف النية والثقة والكيانات والأسئلة هنا. كل حاجة مسودة لحد ما توافق وتنفّذ."
                  : "After parse, intent, confidence, entities, and questions land here. Everything stays draft until Approve → Execute."}
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

/** @deprecated Use OperationsDesk — alias for older imports */
export const BrainChat = OperationsDesk;
