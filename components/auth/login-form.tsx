"use client";

import Link from "next/link";
import { useActionState } from "react";

import { PageAtmosphere } from "@/components/brand/page-atmosphere";
import { SodaLogo } from "@/components/brand/soda-logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SODA_LOGO } from "@/lib/brand/logo";
import {
  signInAction,
  type AuthActionResult,
} from "@/lib/auth/actions";
import { useI18n } from "@/lib/i18n/provider";

const initial: AuthActionResult | null = null;

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, initial);
  const { t } = useI18n();

  return (
    <main
      data-soda-section="auth"
      className="soda-auth-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4"
    >
      <PageAtmosphere section="auth" />

      <div className="soda-page-enter soda-auth-card relative z-[1] w-full max-w-[400px] space-y-9 rounded-2xl p-8 backdrop-blur-md sm:p-10">
        <div className="absolute top-4 end-4">
          <LanguageSwitcher variant="button" />
        </div>

        <div className="soda-login-brand flex flex-col items-center gap-5 text-center">
          <SodaLogo placement="login" showWord={false} interactive />
          <div className="space-y-2">
            <h1 className="font-heading text-[1.75rem] font-semibold tracking-[0.22em] text-white">
              {SODA_LOGO.productName}
            </h1>
            <p className="text-[11px] tracking-[0.18em] text-white/45 uppercase">
              {SODA_LOGO.systemTagline}
            </p>
          </div>
        </div>

        <form className="space-y-4" action={formAction} aria-label="Sign in">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/70">
              Username or email
            </Label>
            <Input
              id="email"
              name="email"
              type="text"
              placeholder="you@sodavisuals.com"
              autoComplete="username"
              required
              className="soda-auth-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/70">
              {t("common.password")}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="soda-auth-input"
            />
          </div>

          {state?.error ? (
            <p className="text-sm text-red-300" role="alert">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" className="mt-2 w-full" disabled={pending}>
            {pending ? t("actions.signingIn") : t("actions.signIn")}
          </Button>
        </form>

        <div className="flex flex-col gap-2 text-center text-sm">
          <Link
            href="/forgot-password"
            className="text-white/45 underline-offset-4 hover:text-soda-pink hover:underline"
          >
            {t("common.forgotPassword")}
          </Link>
          <Link
            href="/bootstrap"
            className="text-white/35 underline-offset-4 hover:text-soda-pink hover:underline"
          >
            {t("common.firstOwnerSetup")}
          </Link>
        </div>
      </div>
    </main>
  );
}
