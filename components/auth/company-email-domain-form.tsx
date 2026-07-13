"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateCompanyEmailDomainAction,
  type AuthActionResult,
} from "@/lib/auth/actions";

const initial: AuthActionResult | null = null;

export function CompanyEmailDomainForm({
  currentDomain,
}: {
  currentDomain: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateCompanyEmailDomainAction,
    initial
  );

  return (
    <form className="max-w-md space-y-3" action={formAction}>
      <div className="space-y-2">
        <Label htmlFor="domain">Company email domain</Label>
        <Input
          id="domain"
          name="domain"
          defaultValue={currentDomain}
          placeholder="sodavisuals.com"
          required
        />
        <p className="text-xs text-muted-foreground">
          Usernames become username@{currentDomain}. Changeable later without
          rewriting auth.
        </p>
      </div>
      {state?.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}
      {state?.ok && state.message ? (
        <p className="text-sm text-emerald-400">{state.message}</p>
      ) : null}
      <Button type="submit" disabled={pending} variant="outline" size="sm">
        {pending ? "Saving…" : "Save domain"}
      </Button>
    </form>
  );
}
