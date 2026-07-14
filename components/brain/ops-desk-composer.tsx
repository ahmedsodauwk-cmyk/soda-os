"use client";

/**
 * Isolated composer — typing state stays here so parent Ops Desk does NOT
 * re-render on every keystroke (Mission 06.0 Phase 13).
 * Parse triggers: Send / Enter / 500ms idle — never onChange itself.
 * Shift+Enter = newline; Enter = Send.
 */

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import { Mic, MicOff, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const IDLE_PARSE_MS = 500;

export type OpsDeskComposerHandle = {
  focus: () => void;
  clear: () => void;
  setValue: (v: string) => void;
  getValue: () => string;
};

type Props = {
  ar: boolean;
  pending: boolean;
  micArmed: boolean;
  onMicToggle: () => void;
  /** Enter / Send — full submit (clears locally then notifies parent). */
  onSubmit: (text: string, source: "text" | "voiceTranscript") => void;
  /**
   * Idle debounce only — parent may client-parse; must NOT clear input.
   * Never fires on every keypress; only 500ms after typing stops.
   */
  onIdleParse: (text: string) => void;
  placeholder: string;
  /** When true, idle auto-parse is suppressed (approved / executed lifecycle). */
  suppressIdleParse?: boolean;
};

export const OpsDeskComposer = forwardRef<OpsDeskComposerHandle, Props>(
  function OpsDeskComposer(
    {
      ar,
      pending,
      micArmed,
      onMicToggle,
      onSubmit,
      onIdleParse,
      placeholder,
      suppressIdleParse = false,
    },
    ref
  ) {
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const textRef = useRef("");

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      clear: () => {
        textRef.current = "";
        if (inputRef.current) inputRef.current.value = "";
      },
      setValue: (v: string) => {
        textRef.current = v;
        if (inputRef.current) inputRef.current.value = v;
      },
      getValue: () => textRef.current,
    }));

    useEffect(() => {
      return () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
      };
    }, []);

    function scheduleIdle(value: string) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      const draft = value.trim();
      if (draft.length < 2 || suppressIdleParse) return;
      debounceTimer.current = setTimeout(() => {
        // Re-read DOM in case user typed more after timer scheduled
        const latest = (inputRef.current?.value ?? textRef.current).trim();
        if (latest.length >= 2 && !suppressIdleParse) {
          onIdleParse(latest);
        }
      }, IDLE_PARSE_MS);
    }

    function submitNow() {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      const raw = inputRef.current?.value ?? textRef.current;
      const trimmed = raw.trim();
      if (!trimmed || pending) return;
      textRef.current = "";
      if (inputRef.current) inputRef.current.value = "";
      onSubmit(trimmed, micArmed ? "voiceTranscript" : "text");
      queueMicrotask(() => inputRef.current?.focus());
    }

    return (
      <div className="flex items-end gap-2 rounded-2xl border border-violet-500/25 bg-violet-950/50 p-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onMicToggle}
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
          defaultValue=""
          onChange={(e) => {
            // Uncontrolled — no parent setState on keystroke.
            textRef.current = e.target.value;
            scheduleIdle(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submitNow();
            }
          }}
          rows={2}
          placeholder={placeholder}
          className="min-h-[52px] flex-1 resize-none border-0 bg-transparent text-sm text-violet-50 shadow-none placeholder:text-violet-400/40 focus-visible:ring-0"
        />
        <Button
          type="button"
          disabled={pending}
          onClick={submitNow}
          className="h-10 shrink-0 gap-1 rounded-xl bg-violet-500 text-white hover:bg-violet-400"
        >
          <Send className="size-3.5" />
          {ar ? "فهم" : "Send"}
        </Button>
      </div>
    );
  }
);
