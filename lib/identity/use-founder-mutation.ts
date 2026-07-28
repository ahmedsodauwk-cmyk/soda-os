"use client";

import { canFounderMutateExisting } from "@/lib/identity/access-levels";
import { useShellOptional } from "@/components/layout/shell-context";

/** Client hook — resolves Access Level from trusted shell session. */
export function useCanFounderMutateExisting(): boolean {
  const shell = useShellOptional();
  return canFounderMutateExisting(shell?.user?.accessLevel);
}
