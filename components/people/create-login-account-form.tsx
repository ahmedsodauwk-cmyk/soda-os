"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { CredentialsOncePanel } from "@/components/people/credentials-once-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_COMPANY_EMAIL_DOMAIN } from "@/lib/auth/company-email-shared";
import { ROLE_LABELS, type SodaRole } from "@/lib/identity/roles";
import { createCrewLoginAccountAction } from "@/lib/people/actions";
import type { Person } from "@/lib/people/types";

interface CreateLoginAccountFormProps {
  person: Person;
  suggestedUsername: string;
  suggestedEmail: string;
  suggestedRole: SodaRole;
  emailDomain?: string;
}

/**
 * Founder creates login from Crew Workspace — username only editable.
 * Full name, display name, email, role prefilled from crew profile.
 */
export function CreateLoginAccountForm({
  person,
  suggestedUsername,
  suggestedEmail,
  suggestedRole,
  emailDomain = DEFAULT_COMPANY_EMAIL_DOMAIN,
}: CreateLoginAccountFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState(suggestedUsername);
  const [credentials, setCredentials] = useState<{
    username: string;
    email: string;
    temporaryPassword: string;
  } | null>(null);

  const fullName = person.nameEn.trim();
  const displayName =
    person.displayName?.trim() || person.nickname?.trim() || fullName;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCredentials(null);

    startTransition(async () => {
      const result = await createCrewLoginAccountAction(person.id, username);
      if (!result.ok) {
        setError(result.error ?? "Create failed.");
        return;
      }
      if (result.credentials) {
        setCredentials(result.credentials);
      }
      router.refresh();
    });
  }

  if (credentials) {
    return (
      <CredentialsOncePanel
        credentials={credentials}
        onDone={() => setCredentials(null)}
      />
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label>Full name</Label>
        <Input value={fullName} readOnly disabled className="bg-muted/40" />
      </div>
      <div className="space-y-2">
        <Label>Display name</Label>
        <Input value={displayName} readOnly disabled className="bg-muted/40" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="crew-username">Username</Label>
        <Input
          id="crew-username"
          name="username"
          required
          autoComplete="off"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={`local-part → @${emailDomain}`}
        />
        <p className="text-xs text-muted-foreground">
          Only field you may edit. Maps to {suggestedEmail || `username@${emailDomain}`}.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          value={suggestedEmail}
          readOnly
          disabled
          className="bg-muted/40"
        />
      </div>
      <div className="space-y-2">
        <Label>Role</Label>
        <Input
          value={ROLE_LABELS[suggestedRole]}
          readOnly
          disabled
          className="bg-muted/40"
        />
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create login account"}
      </Button>
    </form>
  );
}
