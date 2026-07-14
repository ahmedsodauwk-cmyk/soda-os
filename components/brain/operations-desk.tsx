"use client";

/**
 * SODA Operations Desk — Founder Digital COO (Human Experience).
 * LEFT history · CENTER conversation (hero) · RIGHT Smart Understanding (closed by default)
 * Parse ONLY on Send / Enter / 1500ms idle — never on every keypress.
 * احفظ في Brain · نفذ في النظام — never silent ERP writes.
 * Voice = mic stub (same ingest path as text / voiceTranscript later).
 */

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, Mic, MicOff, Send, Sparkles } from "lucide-react";

import {
  answerOpsQuestionAction,
  approveOpsDraftAction,
  executeOpsDraftAction,
  loadBrainChatAction,
  understandBrainChatAction,
} from "@/lib/brain/actions";
import {
  applyUnderstandingEdits,
  defaultExecuteTarget,
  type BrainUnderstanding,
  type EntityTimeline,
  type ExecuteTarget,
  type RelatedMemory,
  type UnderstandingEdits,
} from "@/lib/brain/intelligence";
import type { BrainChatMessage } from "@/lib/brain/types";
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

function greetingForHour(hour: number, ar: boolean): string {
  if (hour >= 5 && hour < 12) {
    return ar
      ? "صباح الخير. أنا معاك — قولّي اللي على بالك، وأنا أرتّبه."
      : "Good morning. I'm with you — tell me what's on your mind.";
  }
  if (hour >= 12 && hour < 17) {
    return ar
      ? "أهلاً. عايز نرتّب إيه النهاردة؟"
      : "Hey. What should we sort today?";
  }
  if (hour >= 17 && hour < 22) {
    return ar
      ? "مساء الخير. في حاجة مفتوحة محتاجة قرار، ولا نبدأ من جديد؟"
      : "Good evening. Open item needing a decision, or shall we start fresh?";
  }
  return ar
    ? "لسه صاحي؟ قولّي اللي محتاج تفضيه من دماغك."
    : "Still up? Tell me what you need off your mind.";
}

function canRunInSystem(u: BrainUnderstanding): boolean {
  if (u.executeTarget.startsWith("erp_")) return true;
  return (
    u.intent === "create_client" ||
    u.intent === "create_order" ||
    u.intent === "potential_order"
  );
}

function resolveSystemTarget(u: BrainUnderstanding): ExecuteTarget {
  if (u.executeTarget.startsWith("erp_")) return u.executeTarget;
  if (u.intent === "create_order" || u.intent === "potential_order") {
    return "erp_create_order";
  }
  if (u.intent === "create_client") return "erp_create_client";
  return defaultExecuteTarget(u.intent);
}

export function OperationsDesk({ initialMessages, migrationHint }: Props) {
  // Operations Desk speaks Egyptian Arabic to Founder (Mission 05.2).
  const ar = true;
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
  const [panelOpen, setPanelOpen] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const parseGeneration = useRef(0);
  const understandingRef = useRef<BrainUnderstanding | null>(null);

  useEffect(() => {
    understandingRef.current = understanding;
  }, [understanding]);

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
          err instanceof Error
            ? err.message
            : ar
              ? "مقدرتش أحدّث المكتب."
              : "Failed to refresh desk."
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount refresh only
  }, []);

  // Light initiation — once per open, not spam
  useEffect(() => {
    if (greeted) return;
    setGreeted(true);
    const hasHistory =
      (Array.isArray(initialMessages) && initialMessages.length > 0) ||
      messages.length > 0;
    if (hasHistory) return;
    const hour = new Date().getHours();
    setLocalBubbles([
      {
        id: `greet-${Date.now()}`,
        role: "assistant",
        content: greetingForHour(hour, ar),
        ephemeral: true,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- greet once on open
  }, [greeted]);

  // Keep input focused and instant — refocus after transitions settle
  useEffect(() => {
    if (!pending) {
      inputRef.current?.focus();
    }
  }, [pending, understanding?.lifecycle]);

  function clearPending() {
    setUnderstanding(null);
    understandingRef.current = null;
    setLocalBubbles([]);
    setRelated([]);
    setTimelines([]);
    setSuggestions([]);
    setMicArmed(false);
    setPanelOpen(false);
    queueMicrotask(() => inputRef.current?.focus());
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

  function focusInputSoon() {
    queueMicrotask(() => inputRef.current?.focus());
  }

  /**
   * Single ingest path for typed text OR future voiceTranscript.
   * NEVER called from onChange character-by-character (only debounce / Send / Enter).
   */
  function ingest(raw: string, source: "text" | "voiceTranscript" = "text") {
    const trimmed = raw.trim();
    if (!trimmed) return;

    const gen = ++parseGeneration.current;
    setError(null);
    setText("");
    focusInputSoon();

    if (process.env.NODE_ENV === "development") {
      // Dev-only — never surface to Founder
      console.debug("[brain-ops]", source, trimmed.slice(0, 80));
    }

    const current = understandingRef.current;

    // Follow-up answer while draft waiting on one smart question
    if (
      current &&
      current.lifecycle === "draft" &&
      current.missingFields.length > 0
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
            understanding: current,
            answer: trimmed,
          });
          if (gen !== parseGeneration.current) return;
          if (!res.ok || !res.understanding) {
            setError(res.error ?? (ar ? "مقدرتش أكمّل" : "Follow-up failed"));
            setText(trimmed);
            focusInputSoon();
            return;
          }
          setUnderstanding(res.understanding);
          understandingRef.current = res.understanding;
          setPanelOpen(true);
          pushAssistant(
            ar
              ? res.understanding.founderSummaryAr
              : res.understanding.founderSummaryEn
          );
          focusInputSoon();
        } catch (err) {
          if (gen !== parseGeneration.current) return;
          setError(
            err instanceof Error
              ? err.message
              : ar
                ? "مقدرتش أكمّل."
                : "Follow-up failed."
          );
          setText(trimmed);
          focusInputSoon();
        }
      });
      return;
    }

    setLocalBubbles((prev) => {
      const keepGreet = prev.filter((b) => b.id.startsWith("greet-"));
      return [
        ...keepGreet,
        {
          id: `local-u-${Date.now()}`,
          role: "user",
          content: trimmed,
          ephemeral: true,
        },
      ];
    });

    startTransition(async () => {
      try {
        const res = await understandBrainChatAction({ text: trimmed });
        if (gen !== parseGeneration.current) return;
        if (!res.ok || !res.understanding) {
          setError(res.error ?? (ar ? "مقدرتش أفهم ده" : "Couldn't understand"));
          setText(trimmed);
          setLocalBubbles((prev) => prev.filter((b) => b.id.startsWith("greet-")));
          focusInputSoon();
          return;
        }
        // Stamp voice stub when ingest came from mic path later
        const u =
          source === "voiceTranscript"
            ? {
                ...res.understanding,
                voice: {
                  enabled: false as const,
                  mode: "stub" as const,
                  transcript: trimmed,
                },
              }
            : res.understanding;
        setUnderstanding(u);
        understandingRef.current = u;
        setRelated(res.related ?? []);
        setTimelines(res.timelines ?? []);
        setSuggestions(res.suggestions ?? []);
        setPanelOpen(true);
        pushAssistant(ar ? u.founderSummaryAr : u.founderSummaryEn);
        focusInputSoon();
      } catch (err) {
        if (gen !== parseGeneration.current) return;
        setError(
          err instanceof Error
            ? err.message
            : ar
              ? "مقدرتش أفهم ده."
              : "Couldn't understand."
        );
        setText(trimmed);
        setLocalBubbles((prev) => prev.filter((b) => b.id.startsWith("greet-")));
        focusInputSoon();
      }
    });
  }

  function onTextChange(value: string) {
    setText(value);
    // CRITICAL: never parse / never server-action on keypress.
    // Only schedule idle debounce (1500ms after stop typing).
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    const draft = value.trim();
    if (draft.length < 2) return;
    // Don't auto-parse while already mid-approved lifecycle
    if (
      understandingRef.current?.lifecycle === "approved" ||
      understandingRef.current?.lifecycle === "executed"
    ) {
      return;
    }
    debounceTimer.current = setTimeout(() => {
      // Re-read latest text from DOM-bound state via closure value
      if (value.trim().length >= 2) {
        ingest(value, "text");
      }
    }, 1500);
  }

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  function submitNow() {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    ingest(text, micArmed ? "voiceTranscript" : "text");
  }

  function onEdit(edits: UnderstandingEdits) {
    setUnderstanding((prev) => {
      const next = prev ? applyUnderstandingEdits(prev, edits) : prev;
      understandingRef.current = next;
      return next;
    });
  }

  async function approveThenExecute(
    base: BrainUnderstanding,
    target: ExecuteTarget
  ) {
    const withTarget =
      base.executeTarget === target
        ? base
        : applyUnderstandingEdits(base, { executeTarget: target });

    const approved = await approveOpsDraftAction({
      understanding: withTarget,
    });
    if (!approved.ok || !approved.understanding) {
      setError(
        approved.error ??
          (ar ? "لسه ناقص حاجة قبل الحفظ" : "Still missing something")
      );
      return;
    }
    setUnderstanding(approved.understanding);
    understandingRef.current = approved.understanding;

    const res = await executeOpsDraftAction({
      understanding: approved.understanding,
      locale: ar ? "ar" : "en",
    });
    if (!res.ok) {
      setError(res.error ?? (ar ? "مقدرتش أنفّذ" : "Couldn't run"));
      return;
    }
    if (res.messages) setMessages(res.messages);
    pushAssistant(
      ar ? (res.messageAr ?? "خلاص اتعمل.") : (res.messageEn ?? "Done.")
    );
    setUnderstanding(
      res.understanding
        ? { ...res.understanding, lifecycle: "executed" }
        : null
    );
    setTimeout(() => clearPending(), 700);
  }

  function onBrainSave() {
    if (!understanding) return;
    setError(null);
    startTransition(async () => {
      try {
        await approveThenExecute(understanding, "brain_save");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : ar
              ? "مقدرتش أحفظ."
              : "Couldn't save."
        );
      }
    });
  }

  function onSystemExecute() {
    if (!understanding) return;
    if (!canRunInSystem(understanding)) {
      setError(
        ar
          ? "دي مش خطوة نظام — احفظها في Brain أحسن."
          : "This isn't a system write — save it to Brain instead."
      );
      return;
    }
    setError(null);
    const target = resolveSystemTarget(understanding);
    startTransition(async () => {
      try {
        await approveThenExecute(understanding, target);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : ar
              ? "مقدرتش أنفّذ في النظام."
              : "Couldn't run in system."
        );
      }
    });
  }

  function onCancel() {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    clearPending();
  }

  function onMicStub() {
    setMicArmed((v) => !v);
    // Stub only — same ingest path will accept voiceTranscript later
    setError(
      ar
        ? "الميكروفون جاهز كشكل — الصوت لسه قادم. اكتب عادي دلوقتي."
        : "Mic is a stub for now — type normally; voice uses the same path later."
    );
    focusInputSoon();
  }

  const showThread = messages.length > 0 || localBubbles.length > 0;
  const draftOpen = Boolean(understanding);
  const systemOk = understanding ? canRunInSystem(understanding) : false;
  const showRightRail =
    panelOpen &&
    understanding &&
    (understanding.canApprove ||
      understanding.missingFields.length > 0 ||
      related.length > 0);

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border border-violet-500/25 bg-[linear-gradient(165deg,rgba(28,16,48,0.92)_0%,rgba(12,8,22,0.98)_42%,rgba(8,6,14,1)_100%)] text-violet-50 lg:flex-row">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.22),transparent_48%),radial-gradient(ellipse_at_bottom_left,rgba(91,33,182,0.12),transparent_45%)]"
        aria-hidden
      />

      {/* LEFT — conversation history */}
      <aside className="relative z-[1] flex w-full flex-col border-b border-violet-500/15 lg:w-[220px] lg:shrink-0 lg:border-b-0 lg:border-e">
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
              {ar ? "COO · للمؤسس" : "COO · Founder"}
            </p>
          </div>
          <Sparkles className="size-4 text-violet-400/50" aria-hidden />
        </header>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          <p className="px-2 py-1 text-[10px] tracking-[0.12em] text-violet-400/45">
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
                </button>
              ))
          )}
        </div>
      </aside>

      {/* CENTER — conversation HERO */}
      <div className="relative z-[1] flex min-w-0 flex-1 flex-col">
        <header className="border-b border-violet-500/15 px-4 py-3">
          <p className="text-sm font-medium">
            {ar ? "SODA Brain · COO" : "SODA Brain · COO"}
          </p>
          <p className="text-[11px] text-violet-300/55">
            {ar
              ? "كلّمني عادي — أنا هفهم وأسأل قبل أي خطوة."
              : "Talk normally — I'll understand and ask before any step."}
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
                  ? "كلّمني زي ما بتكلم مدير عمليات. هفهم وأسأل — التنفيذ بإيدك."
                  : "Brief me like your ops lead. I'll understand and ask — you decide."}
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

        {/* BOTTOM — input always interactive; parse only via Send / Enter / idle debounce */}
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
              title={ar ? "ميكروفون (قريباً)" : "Mic (soon)"}
            >
              {micArmed ? (
                <Mic className="size-4" />
              ) : (
                <MicOff className="size-4" />
              )}
            </Button>
            <Textarea
              ref={inputRef}
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!pending && text.trim()) submitNow();
                }
              }}
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
              disabled={pending || !text.trim()}
              onClick={submitNow}
              className="h-10 shrink-0 gap-1 rounded-xl bg-violet-500 text-white hover:bg-violet-400"
            >
              <Send className="size-3.5" />
              {ar ? "فهم" : "Send"}
            </Button>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={
                pending ||
                !draftOpen ||
                !understanding?.canApprove ||
                understanding.lifecycle === "executed"
              }
              onClick={onBrainSave}
              className="rounded-xl bg-violet-600/90 text-white hover:bg-violet-500 disabled:opacity-40"
            >
              {ar ? "احفظ في Brain" : "Save to Brain"}
            </Button>
            <Button
              type="button"
              disabled={
                pending ||
                !draftOpen ||
                !understanding?.canApprove ||
                !systemOk ||
                understanding.lifecycle === "executed"
              }
              onClick={onSystemExecute}
              className="rounded-xl bg-emerald-600/90 text-white hover:bg-emerald-500 disabled:opacity-40"
            >
              {ar ? "نفذ في النظام" : "Run in system"}
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
            {understanding && !panelOpen ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPanelOpen(true)}
                className="rounded-xl text-violet-300/70 hover:bg-violet-500/15"
              >
                {ar ? "افتح الفهم" : "Open understanding"}
              </Button>
            ) : null}
          </div>
          <p className="mt-1.5 px-1 text-[10px] text-violet-400/40">
            {ar
              ? "مفيش تسجيل في النظام غير لما تختار نفذ في النظام."
              : "Nothing hits the system until you choose Run in system."}
          </p>
        </div>
      </div>

      {/* RIGHT — Smart Understanding CLOSED by default; opens only when useful */}
      {showRightRail ? (
        <aside className="relative z-[1] flex w-full flex-col border-t border-violet-500/15 lg:w-[320px] lg:shrink-0 lg:border-s lg:border-t-0">
          <div className="flex-1 space-y-4 overflow-y-auto p-3">
            {understanding ? (
              <UnderstandingPanel
                understanding={understanding}
                ar={ar}
                pending={pending}
                onChange={onEdit}
                onBrainSave={onBrainSave}
                onSystemExecute={onSystemExecute}
                onCancel={onCancel}
                onClose={() => setPanelOpen(false)}
                canSystemExecute={systemOk}
              />
            ) : null}

            {related.length > 0 ||
            timelines.length > 0 ||
            suggestions.length > 0 ? (
              <RelatedMemoriesPanel
                related={related}
                timelines={timelines}
                suggestions={suggestions}
                ar={ar}
              />
            ) : null}
          </div>
        </aside>
      ) : null}
    </div>
  );
}

/** @deprecated Use OperationsDesk — alias for older imports */
export const BrainChat = OperationsDesk;
