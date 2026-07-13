"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateClient } from "@/lib/clients/repository";

interface ClientNotesEditorProps {
  clientId: string;
  initialNotes: string;
  canEdit: boolean;
}

/** Persist founder notes on `clients.notes` (single text field). */
export function ClientNotesEditor({
  clientId,
  initialNotes,
  canEdit,
}: ClientNotesEditorProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function save() {
    setMessage(null);
    startTransition(async () => {
      try {
        await updateClient(clientId, {
          notes: notes.trim() || undefined,
        });
        setMessage("Saved");
        router.refresh();
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  if (!canEdit) {
    return (
      <div className="space-y-3">
        <h3 className="font-heading text-base font-semibold">Notes</h3>
        {initialNotes ? (
          <p className="whitespace-pre-wrap rounded-xl border border-border/60 bg-muted/20 px-3.5 py-3 text-sm">
            {initialNotes}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No internal notes yet — this relationship has nothing written beyond
            the name.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-heading text-base font-semibold">Notes</h3>
        <p className="text-sm text-muted-foreground">
          Internal Founder notes for this relationship — empty until you write
          them.
        </p>
      </div>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={10}
        placeholder="What matters about this relationship…"
        className="min-h-40"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save notes"}
        </Button>
        {message ? (
          <span className="text-xs text-muted-foreground">{message}</span>
        ) : null}
      </div>
    </div>
  );
}
