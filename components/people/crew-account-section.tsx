"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, UserCheck, UserPlus, UserX } from "lucide-react";

import { CreateLoginAccountForm } from "@/components/people/create-login-account-form";
import { CredentialsOncePanel } from "@/components/people/credentials-once-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROLE_LABELS, type SodaRole } from "@/lib/identity/roles";
import type { LinkedAccountInfo } from "@/lib/identity/identity-link";
import {
  resetCrewPasswordAction,
  setCrewAccountActiveAction,
} from "@/lib/people/actions";
import type { Person } from "@/lib/people/types";

function formatWhen(iso: string | null): string {
  if (!iso) return "Never";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

interface CrewAccountSectionProps {
  person: Person;
  account: LinkedAccountInfo;
  suggestedUsername: string;
  suggestedEmail: string;
  suggestedRole: SodaRole;
  emailDomain?: string;
}

/** Founder-only Account section — identity link status + lifecycle. */
export function CrewAccountSection({
  person,
  account,
  suggestedUsername,
  suggestedEmail,
  suggestedRole,
  emailDomain,
}: CrewAccountSectionProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [credentials, setCredentials] = useState<{
    username: string;
    email: string;
    temporaryPassword: string;
  } | null>(null);

  function runActive(active: boolean) {
    setMessage(null);
    setCredentials(null);
    startTransition(async () => {
      const result = await setCrewAccountActiveAction(person.id, active);
      setMessage(result.ok ? result.message ?? "Done." : result.error ?? "Failed.");
      if (result.ok) router.refresh();
    });
  }

  function runReset() {
    setMessage(null);
    setCredentials(null);
    startTransition(async () => {
      const result = await resetCrewPasswordAction(person.id);
      if (!result.ok) {
        setMessage(result.error ?? "Reset failed.");
        return;
      }
      if (result.credentials) {
        setCredentials(result.credentials);
      } else {
        setMessage(result.message ?? "Password reset.");
      }
      router.refresh();
    });
  }

  if (credentials) {
    return (
      <Card className="soda-cc-card border-soda-pink/30">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Temporary password — shown once.</CardDescription>
        </CardHeader>
        <CardContent>
          <CredentialsOncePanel
            credentials={credentials}
            onDone={() => {
              setCredentials(null);
              setMessage("Password reset recorded.");
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="soda-cc-card">
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>
          Login identity for this crew member — one account per person.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={account.linked ? "default" : "secondary"}>
            {account.linked ? "Linked" : "Not linked"}
          </Badge>
          {account.linked ? (
            <Badge variant={account.isActive ? "outline" : "secondary"}>
              {account.isActive ? "Active" : "Disabled"}
            </Badge>
          ) : null}
          {account.mustChangePassword ? (
            <Badge variant="outline">Must change password</Badge>
          ) : null}
        </div>

        {account.linked ? (
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Username</dt>
              <dd className="font-medium">{account.username ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium break-all">{account.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last login</dt>
              <dd>{formatWhen(account.lastSignInAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last password reset</dt>
              <dd>{formatWhen(account.passwordResetAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Role</dt>
              <dd>
                {account.role ? ROLE_LABELS[account.role] : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Account status</dt>
              <dd>
                {account.isActive
                  ? account.lastSignInAt
                    ? "Active — has signed in"
                    : "Active — never signed in"
                  : "Disabled"}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">
            No login account yet. Create one from this crew profile — never
            from a generic form.
          </p>
        )}

        {message ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {message}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {account.linked ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={pending}
                onClick={() => void runReset()}
              >
                <KeyRound className="size-3.5" />
                Reset password
              </Button>
              {account.isActive ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={pending}
                  onClick={() => runActive(false)}
                >
                  <UserX className="size-3.5" />
                  Disable
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={pending}
                  onClick={() => runActive(true)}
                >
                  <UserCheck className="size-3.5" />
                  Enable
                </Button>
              )}
            </>
          ) : showCreate ? null : (
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowCreate(true)}
            >
              <UserPlus className="size-3.5" />
              Create login account
            </Button>
          )}
        </div>

        {showCreate && !account.linked ? (
          <div className="rounded-xl border border-border/50 bg-card/20 p-4">
            <CreateLoginAccountForm
              person={person}
              suggestedUsername={suggestedUsername}
              suggestedEmail={suggestedEmail}
              suggestedRole={suggestedRole}
              emailDomain={emailDomain}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
