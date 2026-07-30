"use server";

import { revalidatePath } from "next/cache";

import { resolveSessionForApp } from "@/lib/identity/session";
import { fetchPersonById, updatePerson } from "@/lib/people/repository";

export type SettingsActionResult = {
  ok: boolean;
  error?: string;
  message?: string;
};

const AVATAR_URL_MAX = 2048;
const DISPLAY_NAME_MAX = 120;

function isValidAvatarUrl(url: string): boolean {
  if (!url) return true;
  if (url.length > AVATAR_URL_MAX) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/** Self-service profile fields — linked person only; never HR / role fields. */
export async function updateMyProfileAction(input: {
  displayName?: string;
  avatarUrl?: string | null;
}): Promise<SettingsActionResult> {
  const session = await resolveSessionForApp();
  if (!session) return { ok: false, error: "Sign in required." };

  const personId = session.profile.personId;
  if (!personId) {
    return {
      ok: false,
      error: "No crew profile linked — ask Founder to link your identity.",
    };
  }

  const person = await fetchPersonById(personId);
  if (!person) return { ok: false, error: "Profile not found." };

  const displayName = input.displayName?.trim();
  const avatarRaw = input.avatarUrl?.trim() ?? "";

  if (displayName && displayName.length > DISPLAY_NAME_MAX) {
    return { ok: false, error: "Display name is too long." };
  }
  if (!isValidAvatarUrl(avatarRaw)) {
    return { ok: false, error: "Photo URL must be http(s) and under 2048 chars." };
  }

  try {
    await updatePerson(personId, {
      ...(displayName !== undefined ? { displayName: displayName || undefined } : {}),
      avatarUrl: avatarRaw || undefined,
    });
    revalidatePath("/settings/profile");
    revalidatePath("/settings");
    revalidatePath("/", "layout");
    revalidatePath(`/people/${personId}`);
    return { ok: true, message: "Profile updated." };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update profile.",
    };
  }
}
