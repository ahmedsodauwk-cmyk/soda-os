"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  KeyRound,
  UserCheck,
  UserX,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  archiveAccountAction,
  changeAccountAccessLevelAction,
  changeAccountRoleAction,
  resetAccountPasswordAction,
  setAccountActiveAction,
  type AuthorityAccountRow,
} from "@/lib/identity/authority-actions";
import {
  ACCESS_LEVEL_LABELS,
  ACCESS_LEVELS,
  type AccessLevel,
} from "@/lib/identity/access-levels";
import { INVITEABLE_ROLES, ROLE_LABELS, type SodaRole } from "@/lib/identity/roles";

interface AccountDirectoryProps {
  accounts: AuthorityAccountRow[];
}

function formatWhen(iso: string | null): string {
  if (!iso) return "Never";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function AccountDirectory({ accounts }: AccountDirectoryProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [tempCred, setTempCred] = useState<{
    id: string;
    password: string;
  } | null>(null);

  function run(
    fn: () => Promise<{ ok: boolean; error?: string; message?: string; credentials?: { temporaryPassword: string } }>
  ) {
    setMessage(null);
    setTempCred(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        setMessage(result.error ?? "Action failed.");
        return;
      }
      setMessage(result.message ?? "Done.");
      if (result.credentials?.temporaryPassword) {
        /* handled by caller via id */
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {message ? (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{message}</p>
      ) : null}

      {accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No accounts yet. Create login accounts from each crew member&apos;s
          workspace — never invent people.
        </p>
      ) : (
        <ul className="space-y-3">
          {accounts.map((account) => {
            const roleLabel =
              ROLE_LABELS[account.role as SodaRole] ?? account.role;
            return (
              <li
                key={account.id}
                className="space-y-3 rounded-2xl border border-border/60 bg-card/30 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-heading text-base font-semibold">
                      {account.fullName || account.username || account.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{account.username ?? "—"} · {account.email ?? "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline">
                      {ACCESS_LEVEL_LABELS[account.accessLevel]}
                    </Badge>
                    <Badge variant="secondary">{roleLabel}</Badge>
                    <Badge variant={account.isActive ? "default" : "secondary"}>
                      {account.isActive ? "Active" : "Disabled"}
                    </Badge>
                    {account.mustChangePassword ? (
                      <Badge variant="outline">Must change password</Badge>
                    ) : null}
                  </div>
                </div>

                <dl className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                  <div>
                    <dt className="inline">Last password reset · </dt>
                    <dd className="inline">
                      {formatWhen(account.passwordResetAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline">Last activity · </dt>
                    <dd className="inline">{formatWhen(account.lastSignInAt)}</dd>
                  </div>
                  <div>
                    <dt className="inline">Login status · </dt>
                    <dd className="inline">
                      {account.isActive
                        ? account.lastSignInAt
                          ? "Has signed in"
                          : "Never signed in"
                        : "Disabled"}
                    </dd>
                  </div>
                  {account.personId ? (
                    <div className="sm:col-span-2">
                      <dt className="inline">Crew link · </dt>
                      <dd className="inline">
                        <Link
                          href={`/people/${account.personId}`}
                          className="text-soda-pink hover:underline"
                        >
                          Open workspace
                        </Link>
                      </dd>
                    </div>
                  ) : null}
                </dl>

                {tempCred?.id === account.id ? (
                  <p className="rounded-lg border border-soda-pink/30 bg-soda-pink/5 px-3 py-2 font-mono text-sm">
                    Temp password (copy once): {tempCred.password}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Access Level</span>
                    <select
                      className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                      disabled={pending}
                      value={account.accessLevel}
                      onChange={(e) => {
                        const next = e.target.value as AccessLevel;
                        run(() =>
                          changeAccountAccessLevelAction(account.id, next)
                        );
                      }}
                    >
                      {ACCESS_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {ACCESS_LEVEL_LABELS[level]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Role</span>
                    <select
                      className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                      disabled={pending}
                      value={account.role}
                      onChange={(e) => {
                        const next = e.target.value;
                        run(() => changeAccountRoleAction(account.id, next));
                      }}
                    >
                      {INVITEABLE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                      {!INVITEABLE_ROLES.includes(account.role as SodaRole) ? (
                        <option value={account.role}>{account.role}</option>
                      ) : null}
                    </select>
                  </label>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={pending}
                    onClick={() => {
                      startTransition(async () => {
                        setMessage(null);
                        const result = await resetAccountPasswordAction(
                          account.id
                        );
                        if (!result.ok) {
                          setMessage(result.error ?? "Reset failed.");
                          return;
                        }
                        setMessage(result.message ?? "Password reset.");
                        if (result.credentials?.temporaryPassword) {
                          setTempCred({
                            id: account.id,
                            password: result.credentials.temporaryPassword,
                          });
                        }
                        router.refresh();
                      });
                    }}
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
                      onClick={() =>
                        run(() => setAccountActiveAction(account.id, false))
                      }
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
                      onClick={() =>
                        run(() => setAccountActiveAction(account.id, true))
                      }
                    >
                      <UserCheck className="size-3.5" />
                      Enable
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={pending || !account.isActive}
                    onClick={() => {
                      if (
                        !window.confirm(
                          `Archive ${account.fullName || account.username}? Account stays but cannot sign in.`
                        )
                      ) {
                        return;
                      }
                      run(() => archiveAccountAction(account.id));
                    }}
                  >
                    <Archive className="size-3.5" />
                    Archive
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
