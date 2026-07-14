"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";

import { CredentialsOncePanel } from "@/components/people/credentials-once-panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_COMPANY_EMAIL_DOMAIN } from "@/lib/auth/company-email-shared";
import {
  ACCESS_LEVEL_LABELS,
  INVITEABLE_ACCESS_LEVELS,
  type AccessLevel,
} from "@/lib/identity/access-levels";
import { ROLE_LABELS, type SodaRole } from "@/lib/identity/roles";
import {
  isValidUsernameFormat,
  normalizeUsername,
} from "@/lib/identity/username-suggest";
import {
  checkUsernameAvailableAction,
  createCrewLoginAccountAction,
} from "@/lib/people/actions";
import type { Person } from "@/lib/people/types";
import { cn } from "@/lib/utils";

type Step = "form" | "confirm" | "done";
type PasswordMode = "generate" | "manual";
/** Async + format gate for username — Continue requires `available`. */
type UsernameStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid"
  | "error";

const MIN_PASSWORD_LEN = 10;

interface CreateLoginAccountFormProps {
  person: Person;
  suggestedUsername: string;
  suggestedEmail: string;
  suggestedRole: SodaRole;
  emailDomain?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function emailForUsername(
  username: string,
  domain: string,
  personEmail?: string
): string {
  if (personEmail?.trim()) return personEmail.trim().toLowerCase();
  const local = normalizeUsername(username);
  return local ? `${local}@${domain}` : "";
}

function manualPasswordReason(password: string): string | null {
  const trimmed = password.trim();
  if (!trimmed) return `Enter a temporary password (min ${MIN_PASSWORD_LEN}).`;
  if (trimmed.length < MIN_PASSWORD_LEN) {
    return `Password must be at least ${MIN_PASSWORD_LEN} characters.`;
  }
  if (!/[A-Za-z]/.test(trimmed)) {
    return "Password must include at least one letter.";
  }
  if (!/[0-9]/.test(trimmed)) {
    return "Password must include at least one number.";
  }
  return null;
}

/**
 * Founder Create Login Account dialog — username, password mode, confirm, credentials once.
 */
export function CreateLoginAccountForm({
  person,
  suggestedUsername,
  suggestedEmail,
  suggestedRole,
  emailDomain = DEFAULT_COMPANY_EMAIL_DOMAIN,
  open,
  onOpenChange,
}: CreateLoginAccountFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState(suggestedUsername);
  const [passwordMode, setPasswordMode] = useState<PasswordMode>("generate");
  const [manualPassword, setManualPassword] = useState("");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("team");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [usernameReason, setUsernameReason] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{
    username: string;
    email: string;
    temporaryPassword: string;
  } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkGenRef = useRef(0);

  const fullName = person.nameEn.trim();
  const displayName =
    person.displayName?.trim() || person.nickname?.trim() || fullName;
  const previewEmail =
    suggestedEmail ||
    emailForUsername(username, emailDomain, person.email ?? undefined);

  const usernameOk = usernameStatus === "available";
  const passwordBlockReason =
    passwordMode === "manual" ? manualPasswordReason(manualPassword) : null;
  const passwordOk = passwordBlockReason === null;
  const canContinue = usernameOk && passwordOk;

  const continueBlockReasons: string[] = [];
  if (!usernameOk) {
    if (usernameStatus === "checking") {
      continueBlockReasons.push("Waiting for username availability check.");
    } else if (usernameStatus === "idle") {
      continueBlockReasons.push("Enter a username.");
    } else if (usernameReason) {
      continueBlockReasons.push(usernameReason);
    } else {
      continueBlockReasons.push("Username is not ready.");
    }
  }
  if (!passwordOk && passwordBlockReason) {
    continueBlockReasons.push(passwordBlockReason);
  }

  function resetDialog() {
    setStep("form");
    setError(null);
    setUsername(suggestedUsername);
    setPasswordMode("generate");
    setManualPassword("");
    setAccessLevel("team");
    setUsernameStatus("idle");
    setUsernameReason(null);
    setCredentials(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Block closing while credentials are visible until Done
      if (step === "done" && credentials) return;
      resetDialog();
    } else {
      resetDialog();
    }
    onOpenChange(next);
  }

  useEffect(() => {
    if (!open) return;
    setUsername(suggestedUsername);
    setUsernameStatus("idle");
    setUsernameReason(null);
  }, [open, suggestedUsername]);

  useEffect(() => {
    if (!open || step !== "form") return;

    const normalized = normalizeUsername(username);
    if (!normalized) {
      // Invalidate any in-flight availability response for the prior username.
      checkGenRef.current += 1;
      setUsernameStatus("idle");
      setUsernameReason("Enter a username.");
      return;
    }
    if (!isValidUsernameFormat(normalized)) {
      checkGenRef.current += 1;
      setUsernameStatus("invalid");
      setUsernameReason(
        normalized.length < 3
          ? "Username must be at least 3 characters."
          : "Use 3–32 characters: letters, numbers, dots, hyphens, underscores. Must start and end with a letter or number."
      );
      return;
    }

    setUsernameStatus("checking");
    setUsernameReason("Checking availability…");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const gen = ++checkGenRef.current;

    debounceRef.current = setTimeout(() => {
      void (async () => {
        try {
          const result = await checkUsernameAvailableAction(normalized);
          if (gen !== checkGenRef.current) return;
          if (!result.ok) {
            // Never map server/auth failures to format-invalid (that locked Continue
            // with a misleading red "format" message).
            setUsernameStatus("error");
            setUsernameReason(
              result.error ?? "Could not verify username. Try again."
            );
            return;
          }
          if (result.available) {
            setUsernameStatus("available");
            setUsernameReason(null);
          } else {
            setUsernameStatus("taken");
            setUsernameReason("Username is already taken.");
          }
        } catch (err) {
          if (gen !== checkGenRef.current) return;
          setUsernameStatus("error");
          setUsernameReason(
            err instanceof Error
              ? err.message
              : "Could not verify username. Try again."
          );
        }
      })();
    }, 350);

    return () => {
      // Drop pending debounce only. In-flight requests are ignored via gen
      // mismatch when the next effect bumps checkGenRef.
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [username, open, step]);

  function goConfirm() {
    setError(null);
    if (!canContinue) {
      setError(continueBlockReasons.join(" ") || "Fix the fields above to continue.");
      return;
    }
    setStep("confirm");
  }

  function onCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createCrewLoginAccountAction(person.id, {
        username: normalizeUsername(username),
        passwordMode,
        temporaryPassword:
          passwordMode === "manual" ? manualPassword.trim() : undefined,
        accessLevel,
      });
      if (!result.ok) {
        setError(result.error ?? "Create failed.");
        setStep("form");
        return;
      }
      if (result.credentials) {
        setCredentials(result.credentials);
        setStep("done");
      }
      router.refresh();
    });
  }

  const usernameHelp =
    usernameStatus === "available"
      ? "Username is available."
      : usernameStatus === "checking"
        ? "Checking availability…"
        : usernameReason
          ? usernameReason
          : `Suggested from Crew name → maps to @${emailDomain}`;

  const usernameInvalid =
    usernameStatus === "taken" ||
    usernameStatus === "invalid" ||
    usernameStatus === "error";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        showCloseButton={step !== "done"}
      >
        {step === "done" && credentials ? (
          <>
            <DialogHeader>
              <DialogTitle>Login account created</DialogTitle>
              <DialogDescription>
                Copy credentials now — the temporary password is never shown
                again.
              </DialogDescription>
            </DialogHeader>
            <CredentialsOncePanel
              credentials={credentials}
              onDone={() => {
                resetDialog();
                onOpenChange(false);
              }}
            />
          </>
        ) : null}

        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle>Create login account</DialogTitle>
              <DialogDescription>
                Give {displayName} a SODA OS login. Access Level controls what
                they can open — Job Title never changes permissions. Founder
                access is Owner/manual only.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label>Crew member</Label>
                <Input value={fullName} readOnly disabled className="bg-muted/40" />
              </div>
              <div className="grid gap-1.5">
                <Label>Job title</Label>
                <Input
                  value={person.jobTitle || "—"}
                  readOnly
                  disabled
                  className="bg-muted/40"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Role (work identity)</Label>
                <Input
                  value={ROLE_LABELS[suggestedRole]}
                  readOnly
                  disabled
                  className="bg-muted/40"
                />
              </div>

              <fieldset className="grid gap-2">
                <legend className="text-sm font-medium">Access Level</legend>
                <p className="text-xs text-muted-foreground">
                  What this account can access. Not selectable: Founder.
                </p>
                {INVITEABLE_ACCESS_LEVELS.map((level) => (
                  <label
                    key={level}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                      accessLevel === level
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/60"
                    )}
                  >
                    <input
                      type="radio"
                      name="access-level"
                      className="mt-1"
                      checked={accessLevel === level}
                      onChange={() => setAccessLevel(level)}
                    />
                    <span>
                      <span className="block text-sm font-medium">
                        {ACCESS_LEVEL_LABELS[level]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {level === "team"
                          ? "Home, My Orders/Tasks, Wallet, Attendance, Files, Performance, Notifications."
                          : level === "team_leader"
                            ? "Orders, Assign Work, Crew Workspace, Calendar — no Authority or Finance."
                            : "Quotations, Orders, Clients, Commercial, Calendar, Assign Work — no Authority or Finance."}
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>

              <div className="grid gap-1.5">
                <Label htmlFor="crew-login-username">Username</Label>
                <div className="relative">
                  <Input
                    id="crew-login-username"
                    name="username"
                    autoComplete="off"
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={`e.g. ${suggestedUsername}`}
                    className="pr-9"
                    aria-invalid={usernameInvalid}
                  />
                  <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2">
                    {usernameStatus === "checking" ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : usernameStatus === "available" ? (
                      <Check className="size-4 text-emerald-500" />
                    ) : usernameInvalid ? (
                      <X className="size-4 text-red-400" />
                    ) : null}
                  </span>
                </div>
                <p
                  className={cn(
                    "text-xs",
                    usernameInvalid
                      ? "text-red-400"
                      : "text-muted-foreground"
                  )}
                >
                  {usernameHelp}
                </p>
              </div>

              <div className="grid gap-1.5">
                <Label>Email</Label>
                <Input
                  value={previewEmail}
                  readOnly
                  disabled
                  className="bg-muted/40"
                />
              </div>

              <fieldset className="grid gap-2">
                <legend className="text-sm font-medium">Password</legend>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                    passwordMode === "generate"
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/60"
                  )}
                >
                  <input
                    type="radio"
                    name="password-mode"
                    className="mt-1"
                    checked={passwordMode === "generate"}
                    onChange={() => setPasswordMode("generate")}
                  />
                  <span>
                    <span className="block text-sm font-medium">
                      Generate secure password
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Recommended. Temporary password shown once after create.
                    </span>
                  </span>
                </label>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                    passwordMode === "manual"
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/60"
                  )}
                >
                  <input
                    type="radio"
                    name="password-mode"
                    className="mt-1"
                    checked={passwordMode === "manual"}
                    onChange={() => setPasswordMode("manual")}
                  />
                  <span className="block w-full space-y-2">
                    <span className="block text-sm font-medium">
                      Create password manually
                    </span>
                    {passwordMode === "manual" ? (
                      <>
                        <Input
                          type="text"
                          autoComplete="new-password"
                          value={manualPassword}
                          onChange={(e) => setManualPassword(e.target.value)}
                          placeholder={`Temporary password (min ${MIN_PASSWORD_LEN})`}
                          aria-invalid={Boolean(passwordBlockReason)}
                        />
                        {passwordBlockReason ? (
                          <span className="block text-xs text-red-400">
                            {passwordBlockReason}
                          </span>
                        ) : (
                          <span className="block text-xs text-muted-foreground">
                            Meets length and letter + number requirements.
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        You type a temporary password the crew member must
                        change on first login.
                      </span>
                    )}
                  </span>
                </label>
              </fieldset>

              {error ? <p className="text-sm text-red-400">{error}</p> : null}
            </div>

            <DialogFooter>
              {!canContinue ? (
                <p className="w-full text-xs text-red-400 sm:mr-auto sm:text-left">
                  Continue disabled: {continueBlockReasons.join(" ")}
                </p>
              ) : null}
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!canContinue}
                onClick={goConfirm}
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        ) : null}

        {step === "confirm" ? (
          <>
            <DialogHeader>
              <DialogTitle>Confirm login account</DialogTitle>
              <DialogDescription>
                Review details before creating. Credentials appear only once
                after save.
              </DialogDescription>
            </DialogHeader>

            <dl className="grid gap-3 rounded-xl border border-border/50 bg-muted/20 p-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Crew member</dt>
                <dd className="font-medium">{fullName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Access Level</dt>
                <dd className="font-medium">
                  {ACCESS_LEVEL_LABELS[accessLevel]}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Role (work identity)</dt>
                <dd className="font-medium">{ROLE_LABELS[suggestedRole]}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Job title</dt>
                <dd className="font-medium">{person.jobTitle || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Username</dt>
                <dd className="font-mono font-medium">
                  {normalizeUsername(username)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="break-all font-medium">{previewEmail}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Password mode</dt>
                <dd className="font-medium">
                  {passwordMode === "generate"
                    ? "Generate secure password"
                    : "Manual temporary password"}
                </dd>
              </div>
            </dl>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => {
                  setError(null);
                  setStep("form");
                }}
              >
                Back
              </Button>
              <Button type="button" disabled={pending} onClick={onCreate}>
                {pending ? "Creating…" : "Create login account"}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
