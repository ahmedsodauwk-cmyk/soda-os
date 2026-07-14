"use client";

import { useEffect } from "react";

import { SodaLogo } from "@/components/brand/soda-logo";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <SodaLogo placement="empty" showWord={false} />
      <p className="font-heading text-lg font-semibold tracking-tight">
        Something went wrong
      </p>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || "An unexpected error occurred."}
      </p>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
