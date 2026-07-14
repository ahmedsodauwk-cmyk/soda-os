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
import {
  ACCESS_LEVEL_LABELS,
  ACCESS_LEVELS,
  isAssignableAccessLevel,
  type AccessLevel,
} from "@/lib/identity/access-levels";
import { ROLE_LABELS, type SodaRole } from "@/lib/identity/roles";
import type { LinkedAccountInfo } from "@/lib/identity/identity-link";
import {
  resetCrewPasswordAction,
  setCrewAccountActiveAction,
  updateLinkedAccessLevelAction,
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

/** Founder-only Account section — identity link status + Access Level lifecycle. */
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

  function runAccessLevel(next: AccessLevel) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateLinkedAccessLevelAction(person.id, next);
      setMessage(
        result.ok ? result.message ?? "Access Level updated." : result.error ?? "Failed."
      );
      if (result.ok) router.refresh();
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

  const statusLabel = !account.linked
    ? "Not linked"
    : account.isActive
      ? "Active"
      : "Disabled";

  return (
    <Card className="soda-cc-card">
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>
          Login identity for this crew member — Access Level controls navigation
          and permissions; Job Title does not.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={account.linked ? "default" : "secondary"}>
            {account.linked ? "Linked" : "Not linked"}
          </Badge>
          {account.linked ? (
            <Badge variant={account.isActive ? "outline" : "secondary"}>
              {statusLabel}
            </Badge>
          ) : null}
          {account.mustChangePassword ? (
            <Badge variant="outline">Must change password</Badge>
          ) : null}
        </div>

        {account.linked ? (
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Access Level</dt>
              <dd className="pt-1">
                <select
                  className="h-8 w-full max-w-xs rounded-md border border-input bg-transparent px-2 text-sm"
                  disabled={pending}
                  value={account.accessLevel ?? "team"}
                  onChange={(e) =>
                    runAccessLevel(e.target.value as AccessLevel)
                  }
                >
                  {ACCESS_LEVELS.map((level) => (
                    <option
                      key={level}
                      value={level}
                      disabled={!isAssignableAccessLevel(level)}
                    >
                      {ACCESS_LEVEL_LABELS[level]}
                    </option>
                  ))}
                </select>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Job Title</dt>
              <dd className="font-medium">{person.jobTitle || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Username</dt>
              <dd className="font-medium">{account.username ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Role</dt>
              <dd>
                {account.role ? ROLE_LABELS[account.role] : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium">{statusLabel}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium break-all">{account.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created at</dt>
              <dd>{formatWhen(account.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last login</dt>
              <dd>{formatWhen(account.lastSignInAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last password reset</dt>
              <dd>{formatWhen(account.passwordResetAt)}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">
            No login account yet. Create one from this crew profile — never
            from a generic form. You will choose Access Level (Team / Team
            Leader / Account Manager).
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
          ) : (
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

        {!account.linked ? (
          <CreateLoginAccountForm
            person={person}
            suggestedUsername={suggestedUsername}
            suggestedEmail={suggestedEmail}
            suggestedRole={suggestedRole}
            emailDomain={emailDomain}
            open={showCreate}
            onOpenChange={setShowCreate}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
