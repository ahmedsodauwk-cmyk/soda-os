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
    <main
      data-soda-section="auth"
      className="soda-auth-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4"
    >
      <div className="soda-auth-card relative z-[1] w-full max-w-[400px] space-y-6 rounded-2xl p-8 backdrop-blur-md sm:p-10">
        <div className="soda-login-brand flex flex-col items-center gap-4 text-center">
          <SodaLogo placement="login" showWord={false} interactive />
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-white">
            First owner setup
          </h1>
          <p className="text-sm text-white/45">
            One-time only. Creates the Owner account when none exist yet.
          </p>
        </div>

        <form className="space-y-4" action={formAction}>
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-white/70">
              Full name
            </Label>
            <Input
              id="fullName"
              name="fullName"
              defaultValue="SODA Owner"
              required
              className="soda-auth-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/70">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue="owner@sodavisuals.com"
              autoComplete="username"
              required
              className="soda-auth-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/70">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className="soda-auth-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-white/70">
              Confirm password
            </Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className="soda-auth-input"
            />
          </div>

          {state?.error ? (
            <p className="text-sm text-red-300" role="alert">
              {state.error}
            </p>
          ) : null}
          {state?.ok && state.message ? (
            <p className="text-sm text-emerald-300">{state.message}</p>
          ) : null}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating owner…" : "Create owner & sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-white/40">
          Already set up?{" "}
          <Link
            href="/login"
            className="text-white/70 underline underline-offset-4 hover:text-soda-pink"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
