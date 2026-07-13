"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  inviteUserAction,
  type AuthActionResult,
} from "@/lib/auth/actions";
import { SODA_ROLES, ROLE_LABELS } from "@/lib/identity/roles";
import { DEFAULT_COMPANY_EMAIL_DOMAIN } from "@/lib/auth/company-email";

const initial: AuthActionResult | null = null;

/**
 * Founder-only invite. Do not invent names — only invite people the Founder lists.
 */
export function InviteUserForm({
  emailDomain = DEFAULT_COMPANY_EMAIL_DOMAIN,
}: {
  emailDomain?: string;
}) {
  const [state, formAction, pending] = useActionState(
    inviteUserAction,
    initial
  );

  return (
    <form className="max-w-md space-y-4" action={formAction}>
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          autoComplete="off"
          placeholder={`local-part → @${emailDomain}`}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email (optional if username set)</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={`name@${emailDomain}`}
        />
        <p className="text-xs text-muted-foreground">
          Default domain: @{emailDomain}. Changeable in Settings.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          defaultValue="crew_member"
        >
          {SODA_ROLES.filter((r) => r !== "client").map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </div>
      {state?.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}
      {state?.ok && state.message ? (
        <p className="text-sm text-emerald-400">{state.message}</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Inviting…" : "Invite user"}
      </Button>
    </form>
  );
}
