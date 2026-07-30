"use client";

import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMyProfileAction } from "@/lib/settings/actions";

type ProfilePhotoEditorProps = {
  displayName: string;
  avatarInitials: string;
  avatarUrl?: string | null;
  jobTitle?: string;
  readOnlyJobTitle?: boolean;
};

export function ProfilePhotoEditor({
  displayName,
  avatarInitials,
  avatarUrl,
  jobTitle,
  readOnlyJobTitle = true,
}: ProfilePhotoEditorProps) {
  const [name, setName] = useState(displayName);
  const [photoUrl, setPhotoUrl] = useState(avatarUrl ?? "");
  const [previewUrl, setPreviewUrl] = useState(avatarUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setName(displayName);
    setPhotoUrl(avatarUrl ?? "");
    setPreviewUrl(avatarUrl ?? "");
  }, [displayName, avatarUrl]);

  async function onSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    const result = await updateMyProfileAction({
      displayName: name,
      avatarUrl: photoUrl.trim() || null,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? "Save failed.");
      return;
    }
    setMessage(result.message ?? "Saved.");
    setPreviewUrl(photoUrl.trim());
  }

  function onRemovePhoto() {
    setPhotoUrl("");
    setPreviewUrl("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Avatar size="lg" className="size-20">
          {previewUrl ? (
            <AvatarImage src={previewUrl} alt={name} />
          ) : null}
          <AvatarFallback
            className="bg-[linear-gradient(135deg,#29194A,#D23B68)] text-lg font-medium text-white"
          >
            {avatarInitials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 space-y-1">
          <p className="font-medium text-foreground">{name || displayName}</p>
          {readOnlyJobTitle && jobTitle ? (
            <p className="text-sm text-muted-foreground">{jobTitle}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {previewUrl ? "Photo preview" : "Initials fallback when no photo"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="photoUrl">Photo URL</Label>
        <Input
          id="photoUrl"
          type="url"
          value={photoUrl}
          onChange={(e) => {
            setPhotoUrl(e.target.value);
            setPreviewUrl(e.target.value.trim());
          }}
          placeholder="https://…"
          maxLength={2048}
        />
        <p className="text-xs text-muted-foreground">
          HTTPS image URL. Upload/crop storage coming — URL is the current source of truth.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onSave} disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
        <Button type="button" variant="outline" onClick={onRemovePhoto}>
          Remove photo
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      ) : null}
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}
