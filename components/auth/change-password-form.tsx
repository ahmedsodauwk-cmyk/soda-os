"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  changePasswordAction,
  type AuthActionResult,
} from "@/lib/auth/actions";

const initial: AuthActionResult | null = null;

export function ChangePasswordForm({ forced = false }: { forced?: boolean }) {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initial
  );
  const router = useRouter();

  useEffect(() => {
    if (state?.ok && forced) {
      router.replace("/");
      router.refresh();
    }
  }, [state?.ok, forced, router]);

  return (
    <form className="max-w-md space-y-4" action={formAction}>
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>
      {state?.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}
      {state?.ok && state.message ? (
        <p className="text-sm text-emerald-400">{state.message}</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}
