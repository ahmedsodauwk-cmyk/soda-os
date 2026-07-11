"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

interface BackLinkProps {
  href?: string;
  label?: string;
}

export function BackLink({ href, label = "Back" }: BackLinkProps) {
  const router = useRouter();

  if (href) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="mb-3 -ml-2 gap-1.5 text-muted-foreground"
        nativeButton={false}
        render={<Link href={href} />}
      >
        <ArrowLeft className="size-3.5" />
        {label}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="mb-3 -ml-2 gap-1.5 text-muted-foreground"
      onClick={() => router.back()}
    >
      <ArrowLeft className="size-3.5" />
      {label}
    </Button>
  );
}
