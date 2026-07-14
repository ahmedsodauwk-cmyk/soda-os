"use client";

import { useState } from "react";
import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export type CredentialsOnce = {
  username: string;
  email: string;
  temporaryPassword: string;
};

interface CredentialsOncePanelProps {
  credentials: CredentialsOnce;
  onDone: () => void;
}

/**
 * Shown once after Create Login Account or Reset Password.
 * Never stored — Copy, Print, Done.
 */
export function CredentialsOncePanel({
  credentials,
  onDone,
}: CredentialsOncePanelProps) {
  const [copied, setCopied] = useState(false);

  const text = [
    "SODA VISUALS login",
    `Username: ${credentials.username}`,
    `Email: ${credentials.email}`,
    `Temporary password: ${credentials.temporaryPassword}`,
    "",
    "Change password on first login.",
  ].join("\n");

  async function copyCredentials() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function printCredentials() {
    const w = window.open("", "_blank", "noopener,noreferrer,width=480,height=520");
    if (!w) return;
    w.document.write(`
      <html><head><title>SODA VISUALS — Login credentials</title></head>
      <body style="font-family:system-ui,sans-serif;padding:24px">
        <h1 style="font-size:18px">SODA VISUALS login</h1>
        <pre style="font-size:14px;line-height:1.6">${text.replace(/</g, "&lt;")}</pre>
        <p style="font-size:12px;color:#666">Temporary password — shown once. Change on first login.</p>
      </body></html>
    `);
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <div className="space-y-3 rounded-xl border border-soda-pink/40 bg-soda-pink/5 p-4">
      <p className="text-[11px] font-semibold tracking-[0.12em] text-primary/80 uppercase">
        Credentials — copy once
      </p>
      <p className="text-sm text-muted-foreground">
        This temporary password will not be stored or shown again.
      </p>
      <dl className="space-y-1 font-mono text-sm">
        <div>
          <dt className="inline text-muted-foreground">Username · </dt>
          <dd className="inline">{credentials.username}</dd>
        </div>
        <div>
          <dt className="inline text-muted-foreground">Email · </dt>
          <dd className="inline">{credentials.email}</dd>
        </div>
        <div>
          <dt className="inline text-muted-foreground">Temp password · </dt>
          <dd className="inline">{credentials.temporaryPassword}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void copyCredentials()}>
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={printCredentials}
        >
          <Printer className="size-3.5" />
          Print
        </Button>
        <Button type="button" size="sm" onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  );
}
