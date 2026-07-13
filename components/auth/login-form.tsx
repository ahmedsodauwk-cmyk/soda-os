"use client";

import Link from "next/link";
import { useActionState } from "react";

import { PageAtmosphere } from "@/components/brand/page-atmosphere";
import { SodaLogo } from "@/components/brand/soda-logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getModuleSlogan } from "@/lib/brand";
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

      <div className="soda-page-enter soda-auth-card relative z-[1] w-full max-w-md space-y-8 rounded-2xl p-8 backdrop-blur-md">
        <div className="absolute top-4 end-4">
          <LanguageSwitcher variant="button" />
        </div>

        <div className="flex flex-col items-center gap-4 text-center">
          <SodaLogo placement="login" showWord={false} />
          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#29194A]">
              SODA VISUALS
            </h1>
            <p
              className="font-ar text-[0.9375rem] leading-[1.85] text-muted-foreground"
              dir="rtl"
            >
              {getModuleSlogan("login")}
            </p>
          </div>
        </div>

        <form className="space-y-4" action={formAction}>
          <div className="space-y-2">
            <Label htmlFor="email">Username or email</Label>
            <Input
              id="email"
              name="email"
              type="text"
              placeholder="you@sodavisuals.com"
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("common.password")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {state?.error ? (
            <p className="text-sm text-red-400" role="alert">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t("actions.signingIn") : t("actions.signIn")}
          </Button>
        </form>

        <div className="flex flex-col gap-2 text-center text-sm">
          <Link
            href="/forgot-password"
            className="text-muted-foreground underline-offset-4 hover:text-[#D23B68] hover:underline"
          >
            {t("common.forgotPassword")}
          </Link>
          <Link
            href="/bootstrap"
            className="text-muted-foreground underline-offset-4 hover:text-[#D23B68] hover:underline"
          >
            {t("common.firstOwnerSetup")}
          </Link>
        </div>
      </div>
    </main>
  );
}
