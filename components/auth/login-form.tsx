"use client";

import Link from "next/link";
import { useActionState } from "react";

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, color-mix(in oklch, var(--soda-purple) 32%, transparent), transparent 65%), radial-gradient(ellipse 40% 35% at 80% 80%, color-mix(in oklch, var(--soda-pink) 16%, transparent), transparent 50%)",
        }}
      />

      <div className="soda-page-enter relative w-full max-w-md space-y-8 rounded-2xl border border-primary/20 bg-card/90 p-8 shadow-[var(--soda-shadow-lift)] backdrop-blur-md">
        <div className="absolute top-4 end-4">
          <LanguageSwitcher variant="button" />
        </div>

        <div className="flex flex-col items-center gap-4 text-center">
          <SodaLogo placement="login" showWord={false} />
          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
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
            <Label htmlFor="email">{t("common.email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@soda.studio"
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
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t("common.forgotPassword")}
          </Link>
          <Link
            href="/bootstrap"
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t("common.firstOwnerSetup")}
          </Link>
        </div>
      </div>
    </main>
  );
}
