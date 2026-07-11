"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

interface NavHrefProps {
  href: string;
  className?: string;
  children: React.ReactNode;
  /** When false, render children without link (still no dead end if parent links). */
  enabled?: boolean;
}

/** Wrap any card/stat/row so it always navigates. */
export function NavHref({
  href,
  className,
  children,
  enabled = true,
}: NavHrefProps) {
  if (!enabled) return <>{children}</>;
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-inherit outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      {children}
    </Link>
  );
}
