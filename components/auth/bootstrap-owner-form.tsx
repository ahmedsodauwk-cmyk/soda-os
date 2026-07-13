"use client";

import { useActionState } from "react";
import Link from "next/link";

import { SodaLogo } from "@/components/brand/soda-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  bootstrapOwnerAction,
  type AuthActionResult,
} from "@/lib/auth/actions";

const initial: AuthActionResult | null = null;

export function BootstrapOwnerForm() {
  const [state, formAction, pending] = useActionState(
    bootstrapOwnerAction,
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
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            First owner setup
          </h1>
          <p className="text-sm text-muted-foreground">
            One-time only. Creates the Owner account when none exist yet.
          </p>
        </div>

        <form className="space-y-4" action={formAction}>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              name="fullName"
              defaultValue="SODA Owner"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue="owner@sodavisuals.com"
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          {state?.error ? (
            <p className="text-sm text-red-400" role="alert">
              {state.error}
            </p>
          ) : null}
          {state?.ok && state.message ? (
            <p className="text-sm text-emerald-400">{state.message}</p>
          ) : null}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating owner…" : "Create owner & sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already set up?{" "}
          <Link href="/login" className="underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
