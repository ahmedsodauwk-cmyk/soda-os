/**
 * Temporary password generation for Founder-provisioned accounts.
 * Architecture only — do not call to create users until Founder provides crew list.
 *
 * Flow (future mission):
 * 1. Founder supplies official crew list
 * 2. Create auth user with generateTemporaryPassword()
 * 3. profiles.must_change_password = true
 * 4. Login → AppShell redirects to /settings/password
 * 5. changePasswordAction clears the flag
 */

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const SPECIAL = "!@#$%";

function pick(chars: string, n: number): string {
  let out = "";
  for (let i = 0; i < n; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]!;
  }
  return out;
}

/** Generate a temporary password (min 10 chars, mixed). */
export function generateTemporaryPassword(): string {
  return `SV-${pick(ALPHA, 4)}${pick(DIGITS, 3)}${pick(SPECIAL, 1)}${pick(ALPHA, 2)}`;
}

export type ProvisionAccountFlags = {
  /** Always true for temp-password provisioning */
  must_change_password: true;
  username: string;
  role: string;
  full_name: string;
};

/** Metadata payload for Auth createUser / invite (no account created here). */
export function buildProvisionUserMetadata(
  input: Omit<ProvisionAccountFlags, "must_change_password">
): ProvisionAccountFlags & Record<string, unknown> {
  return {
    ...input,
    must_change_password: true,
  };
}
