import Link from "next/link";

import { SodaLogo } from "@/components/brand/soda-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getModuleSlogan } from "@/lib/brand";

/**
 * Login shell — branded placeholder for future auth.
 * Does not replace home or change business modules.
 */
export default function LoginPage() {
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
        <div className="flex flex-col items-center gap-4 text-center">
          <SodaLogo placement="login" showWord={false} />
          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              SODA OS
            </h1>
            <p
              className="font-ar text-[0.9375rem] leading-[1.85] text-muted-foreground"
              dir="rtl"
            >
              {getModuleSlogan("login")}
            </p>
          </div>
        </div>

        <form className="space-y-4" action="/">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@soda.studio"
              autoComplete="username"
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled
            />
          </div>
          <Button type="submit" className="w-full" disabled>
            Sign in — coming soon
          </Button>
        </form>

        <p
          className="font-ar text-center text-xs leading-relaxed text-muted-foreground"
          dir="rtl"
        >
          الـ login لسه placeholder — ادخل الستوديو من غير auth دلوقتي.
        </p>

        <Button
          variant="outline"
          className="w-full"
          nativeButton={false}
          render={<Link href="/" />}
        >
          Enter Command Center
        </Button>
      </div>
    </main>
  );
}
