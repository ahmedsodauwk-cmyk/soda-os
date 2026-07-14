"use client";

import Link from "next/link";
import { useActionState } from "react";

import { PageAtmosphere } from "@/components/brand/page-atmosphere";
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
    <main
      data-soda-section="auth"
      className="soda-auth-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4"
    >
      <PageAtmosphere section="auth" />

      <div className="soda-auth-card relative z-[1] w-full max-w-[400px] space-y-6 rounded-2xl p-8 backdrop-blur-md sm:p-10">
        <div className="soda-login-brand flex flex-col items-center gap-4 text-center">
          <SodaLogo placement="login" showWord={false} interactive />
          <h1 className="font-heading text-xl font-semibold tracking-tight text-white">
            Reset password
          </h1>
          <p className="text-sm text-white/45">
            We will email you a link to choose a new password.
          </p>
        </div>

        <form className="space-y-4" action={formAction}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/70">
              Username or email
            </Label>
            <Input
              id="email"
              name="email"
              type="text"
              required
              autoComplete="username"
              placeholder="you@sodavisuals.com"
              className="soda-auth-input"
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
