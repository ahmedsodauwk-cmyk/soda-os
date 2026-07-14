"use client";

/**
 * SODA Brain Chat — ChatGPT-like Founder UI.
 * Heuristic classification into Brain only. No AI API. No ERP creates.
 */

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, Send } from "lucide-react";

import {
  loadBrainChatAction,
  sendBrainChatAction,
} from "@/lib/brain/actions";
import type { BrainChatMessage } from "@/lib/brain/types";
import { WORKSPACE_LABELS_AR, WORKSPACE_LABELS_EN } from "@/lib/brain/types";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  initialMessages: BrainChatMessage[];
  migrationHint?: string | null;
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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    startTransition(async () => {
      try {
        const res = await loadBrainChatAction();
        if (res.ok && res.messages) setMessages(res.messages);
      } catch (err) {
        // Uncaught Server Action throws become opaque RSC errors in production.
        setError(err instanceof Error ? err.message : "Failed to refresh chat.");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount refresh only
  }, []);

  function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setError(null);
    setText("");
    startTransition(async () => {
      try {
        const res = await sendBrainChatAction({
          text: trimmed,
          locale: ar ? "ar" : "en",
        });
        if (!res.ok) {
          setError(res.error ?? "Failed");
          setText(trimmed);
          return;
        }
        if (res.messages) setMessages(res.messages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Chat failed.");
        setText(trimmed);
      }
    });
  }

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border border-violet-500/20 bg-[linear-gradient(180deg,rgba(36,22,64,0.55)_0%,rgba(12,10,20,0.96)_45%,rgba(10,8,16,0.99)_100%)] text-violet-50">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.2),transparent_50%)]"
        aria-hidden
      />

      <header className="relative flex items-center gap-3 border-b border-violet-500/15 px-4 py-3">
        <Link
          href="/brain"
          className="rounded-md p-1.5 text-violet-300/70 hover:bg-violet-500/15 hover:text-violet-50"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">SODA Brain Chat</p>
          <p className="text-[11px] text-violet-300/60">
            {ar
              ? "تصنيف مبدئي → الدماغ فقط · مش AI لسه · مفيش ERP"
              : "Heuristic → Brain only · not AI yet · never ERP"}
          </p>
        </div>
        <span className="text-lg opacity-70">🧠</span>
      </header>

      {migrationHint ? (
        <p className="relative border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-100/90">
          {migrationHint}
        </p>
      ) : null}

      <div className="relative flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="mx-auto max-w-md py-16 text-center">
            <p className="text-sm text-violet-200/70">
              {ar
                ? "اكتب بأي لغة. هنحطها في مساحة مناسبة في الدماغ (مؤقتًا بقواعد بسيطة)."
                : "Write naturally (Arabic OK). We’ll file it into a Brain workspace (simple rules until AI)."}
            </p>
            <p className="mt-2 text-[11px] text-violet-400/50">
              {ar
                ? "جرّب: «أحمد مديون بـ 5k» أو «فكرة لموقع جديد»"
                : "Try: “Ahmed owes 5k” or “idea for a new site”"}
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.role === "user";
            return (
              <div
                key={m.id}
                className={cn(
                  "flex",
                  mine ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
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
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <p className="relative border-t border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-100">
          {error}
        </p>
      ) : null}

      <div className="relative border-t border-violet-500/15 p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-violet-500/20 bg-violet-950/40 p-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder={
              ar ? "اكتب للمؤسس…" : "Message your Brain…"
            }
            className="min-h-[52px] flex-1 resize-none border-0 bg-transparent text-sm text-violet-50 shadow-none placeholder:text-violet-400/40 focus-visible:ring-0"
          />
          <Button
            type="button"
            disabled={pending || !text.trim()}
            onClick={send}
            className="h-10 shrink-0 gap-1 rounded-xl bg-violet-500 text-white hover:bg-violet-400"
          >
            <Send className="size-3.5" />
            {ar ? "إرسال" : "Send"}
          </Button>
        </div>
        <p className="mt-1.5 px-1 text-[10px] text-violet-400/40">
          {ar
            ? "Enter للإرسال · Shift+Enter سطر جديد · كل حاجة بتتسجل في brain_entries"
            : "Enter to send · Shift+Enter newline · everything stays in brain_entries"}
        </p>
      </div>
    </div>
  );
}
