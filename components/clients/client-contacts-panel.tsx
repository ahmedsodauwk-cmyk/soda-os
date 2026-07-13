import { RelationshipEmptyState } from "@/components/clients/relationship-empty-state";
import { Badge } from "@/components/ui/badge";
import { getClientContacts } from "@/lib/clients/aggregators";
import { notFound } from "next/navigation";

interface ClientContactsPanelProps {
  clientId: string;
}

/** Decision makers + channels from client model (contactPerson + contacts jsonb). */
export function ClientContactsPanel({ clientId }: ClientContactsPanelProps) {
  const view = getClientContacts(clientId);
  if (!view) notFound();

  const channelLine = [
    view.channels.phone?.trim() || null,
    view.channels.whatsapp
      ? `WhatsApp ${view.channels.whatsapp}`
      : null,
    view.channels.email?.trim() || null,
  ]
    .filter(Boolean)
    .join(" · ");

  const hasChannels = Boolean(channelLine);
  const hasPeople = view.people.length > 0;

  if (!hasChannels && !hasPeople) {
    return (
      <RelationshipEmptyState
        title="Contacts"
        question="Who is this?"
        detail="No people or channels recorded yet. Phone, email, and decision-makers stay empty until the Founder enters them — never guessed."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-base font-semibold">Contacts</h3>
        <p className="text-sm text-muted-foreground">
          Decision makers and channels on this relationship. Edit via Overview →
          Edit client for primary fields; extra contacts live on the client
          record.
        </p>
      </div>

      <section className="rounded-2xl border border-border/60 px-3.5 py-3">
        <p className="text-xs font-medium text-muted-foreground">Channels</p>
        <p className="mt-1 text-sm">
          {channelLine || "No phone, WhatsApp, or email recorded yet."}
        </p>
      </section>

      {view.people.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No decision-maker contacts recorded yet. Add a contact person (or
          contacts list) on the client profile.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {view.people.map((person) => (
            <li
              key={`${person.source}-${person.name}-${person.role}`}
              className="rounded-xl border border-border/60 px-3.5 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{person.name}</p>
                <Badge variant="outline">{person.role}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {[person.phone, person.email].filter(Boolean).join(" · ") ||
                  "No phone/email on this contact"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
