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
import { ROLE_LABELS, type SodaRole } from "@/lib/identity/roles";
import {
  checkUsernameAvailableAction,
  createCrewLoginAccountAction,
} from "@/lib/people/actions";
import type { Person } from "@/lib/people/types";
import { cn } from "@/lib/utils";

type Step = "form" | "confirm" | "done";
type PasswordMode = "generate" | "manual";
type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

const USERNAME_RE = /^[a-z0-9]([a-z0-9._-]{1,30}[a-z0-9])?$/;
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

function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/^@/, "");
}

function emailForUsername(username: string, domain: string, personEmail?: string): string {
  if (personEmail?.trim()) return personEmail.trim().toLowerCase();
  const local = normalizeUsername(username);
  return local ? `${local}@${domain}` : "";
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
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
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

  function resetDialog() {
    setStep("form");
    setError(null);
    setUsername(suggestedUsername);
    setPasswordMode("generate");
    setManualPassword("");
    setUsernameStatus("idle");
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
  }, [open, suggestedUsername]);

  useEffect(() => {
    if (!open || step !== "form") return;

    const normalized = normalizeUsername(username);
    if (!normalized) {
      setUsernameStatus("idle");
      return;
    }
    if (normalized.length < 3 || !USERNAME_RE.test(normalized)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const gen = ++checkGenRef.current;

    debounceRef.current = setTimeout(() => {
      void (async () => {
        const result = await checkUsernameAvailableAction(normalized);
        if (gen !== checkGenRef.current) return;
        if (!result.ok) {
          setUsernameStatus("invalid");
          return;
        }
        setUsernameStatus(result.available ? "available" : "taken");
      })();
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username, open, step]);

  const usernameOk = usernameStatus === "available";
  const passwordOk =
    passwordMode === "generate" ||
    (manualPassword.length >= MIN_PASSWORD_LEN &&
      /[A-Za-z]/.test(manualPassword) &&
      /[0-9]/.test(manualPassword));

  function goConfirm() {
    setError(null);
    if (!usernameOk) {
      setError("Choose an available username.");
      return;
    }
    if (!passwordOk) {
      setError(
        `Manual password must be at least ${MIN_PASSWORD_LEN} characters and include letters and numbers.`
      );
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
          passwordMode === "manual" ? manualPassword : undefined,
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
                Give {displayName} a SODA OS login. Username and temporary
                password only — role and email come from Crew.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label>Crew member</Label>
                <Input value={fullName} readOnly disabled className="bg-muted/40" />
              </div>
              <div className="grid gap-1.5">
                <Label>Role</Label>
                <Input
                  value={ROLE_LABELS[suggestedRole]}
                  readOnly
                  disabled
                  className="bg-muted/40"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="crew-login-username">Username</Label>
                <div className="relative">
                  <Input
                    id="crew-login-username"
                    name="username"
                    required
                    autoComplete="off"
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={`e.g. ${suggestedUsername}`}
                    className="pr-9"
                    aria-invalid={
                      usernameStatus === "taken" || usernameStatus === "invalid"
                    }
                  />
                  <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2">
                    {usernameStatus === "checking" ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : usernameStatus === "available" ? (
                      <Check className="size-4 text-emerald-500" />
                    ) : usernameStatus === "taken" ||
                      usernameStatus === "invalid" ? (
                      <X className="size-4 text-red-400" />
                    ) : null}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {usernameStatus === "available"
                    ? "Username is available."
                    : usernameStatus === "taken"
                      ? "Username is already taken."
                      : usernameStatus === "invalid"
                        ? "Use 3–32 characters: letters, numbers, dots, hyphens."
                        : usernameStatus === "checking"
                          ? "Checking availability…"
                          : `Suggested from Crew name → maps to @${emailDomain}`}
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
                      <Input
                        type="text"
                        autoComplete="new-password"
                        value={manualPassword}
                        onChange={(e) => setManualPassword(e.target.value)}
                        placeholder={`Temporary password (min ${MIN_PASSWORD_LEN})`}
                      />
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
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!usernameOk || !passwordOk}
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
                <dt className="text-muted-foreground">Role</dt>
                <dd className="font-medium">{ROLE_LABELS[suggestedRole]}</dd>
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
