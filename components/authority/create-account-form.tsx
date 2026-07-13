"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createAuthorityAccountAction,
  type AuthorityActionResult,
} from "@/lib/identity/authority-actions";
import { INVITEABLE_ROLES, ROLE_LABELS } from "@/lib/identity/roles";
import { DEFAULT_COMPANY_EMAIL_DOMAIN } from "@/lib/auth/company-email-shared";

type Credentials = NonNullable<AuthorityActionResult["credentials"]>;

interface CreateAccountFormProps {
  emailDomain?: string;
  unlinkedPeople?: { id: string; name: string }[];
}

/**
 * Founder Create Account — credentials shown once after save.
 * Does not invent crew; Founder supplies name/username/role.
 */
export function CreateAccountForm({
  emailDomain = DEFAULT_COMPANY_EMAIL_DOMAIN,
  unlinkedPeople = [],
}: CreateAccountFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const fullName = String(fd.get("fullName") ?? "").trim();
    const username = String(fd.get("username") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const role = String(fd.get("role") ?? "crew_member");
    const personId = String(fd.get("personId") ?? "").trim();

    setError(null);
    setCredentials(null);
    setCopied(false);

    startTransition(async () => {
      const result = await createAuthorityAccountAction({
        fullName,
        username,
        email: email || undefined,
        role,
        personId: personId || undefined,
      });
      if (!result.ok) {
        setError(result.error ?? "Create failed.");
        return;
      }
      if (result.credentials) {
        setCredentials(result.credentials);
      }
      router.refresh();
      (e.target as HTMLFormElement).reset();
    });
  }

  async function copyCredentials() {
    if (!credentials) return;
    const text = [
      `SODA VISUALS login`,
      `Username: ${credentials.username}`,
      `Email: ${credentials.email}`,
      `Temporary password: ${credentials.temporaryPassword}`,
      ``,
      `Change password on first login.`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" required autoComplete="off" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            required
            autoComplete="off"
            placeholder={`local-part → @${emailDomain}`}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email (optional)</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="off"
            placeholder={`defaults to username@${emailDomain}`}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role template</Label>
          <select
            id="role"
            name="role"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            defaultValue="project_manager"
          >
            {INVITEABLE_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </div>
        {unlinkedPeople.length > 0 ? (
          <div className="space-y-2">
            <Label htmlFor="personId">Link to crew member (optional)</Label>
            <select
              id="personId"
              name="personId"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              defaultValue=""
            >
              <option value="">— No link —</option>
              {unlinkedPeople.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create account"}
        </Button>
      </form>

      {credentials ? (
        <div className="space-y-3 rounded-xl border border-soda-pink/40 bg-soda-pink/5 p-4">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-primary/80 uppercase">
            Credentials — copy once
          </p>
          <p className="text-sm text-muted-foreground">
            This temporary password will not be stored or shown again.
          </p>
          <dl className="space-y-1 font-mono text-sm">
            <div>
              <dt className="inline text-muted-foreground">Username · </dt>
              <dd className="inline">{credentials.username}</dd>
            </div>
            <div>
              <dt className="inline text-muted-foreground">Email · </dt>
              <dd className="inline">{credentials.email}</dd>
            </div>
            <div>
              <dt className="inline text-muted-foreground">Temp password · </dt>
              <dd className="inline">{credentials.temporaryPassword}</dd>
            </div>
          </dl>
          <Button type="button" variant="outline" size="sm" onClick={() => void copyCredentials()}>
            {copied ? "Copied" : "Copy credentials"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
