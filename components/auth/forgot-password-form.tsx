"use client";

import Link from "next/link";
import { useActionState } from "react";

import { SodaLogo } from "@/components/brand/soda-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  forgotPasswordAction,
  type AuthActionResult,
} from "@/lib/auth/actions";

const initial: AuthActionResult | null = null;

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    initial
  );

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, color-mix(in oklch, var(--soda-purple) 32%, transparent), transparent 65%)",
        }}
      />

      <div className="relative w-full max-w-md space-y-6 rounded-2xl border border-primary/20 bg-card/90 p-8 shadow-[var(--soda-shadow-lift)] backdrop-blur-md">
        <div className="flex flex-col items-center gap-3 text-center">
          <SodaLogo placement="login" showWord={false} />
          <h1 className="font-heading text-xl font-semibold">Reset password</h1>
          <p className="text-sm text-muted-foreground">
            We will email you a link to choose a new password.
          </p>
        </div>

        <form className="space-y-4" action={formAction}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
            />
          </div>
          {state?.error ? (
            <p className="text-sm text-red-400">{state.error}</p>
          ) : null}
          {state?.ok && state.message ? (
            <p className="text-sm text-emerald-400">{state.message}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </form>

        <Button
          variant="outline"
          className="w-full"
          nativeButton={false}
          render={<Link href="/login" />}
        >
          Back to sign in
        </Button>
      </div>
    </main>
  );
}
