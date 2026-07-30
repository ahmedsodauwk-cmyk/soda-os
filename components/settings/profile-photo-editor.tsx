"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AVATAR_ALLOWED_MIME,
  AVATAR_MAX_BYTES,
  AVATAR_OUTPUT_SIZE,
} from "@/lib/avatars/config";
import { cropImageToSquare } from "@/lib/avatars/crop";
import { uploadAvatarBlob } from "@/lib/avatars/upload-client";
import { useI18n } from "@/lib/i18n/provider";
import { updateMyProfileAction } from "@/lib/settings/actions";

type ProfilePhotoEditorProps = {
  userId: string;
  displayName: string;
  avatarInitials: string;
  avatarUrl?: string | null;
  jobTitle?: string;
  readOnlyJobTitle?: boolean;
};

export function ProfilePhotoEditor({
  userId,
  displayName,
  avatarInitials,
  avatarUrl,
  jobTitle,
  readOnlyJobTitle = true,
}: ProfilePhotoEditorProps) {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(displayName);
  const [previewUrl, setPreviewUrl] = useState(avatarUrl ?? "");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  const onPickFile = useCallback(() => {
    fileRef.current?.click();
  }, []);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setMessage(null);
    if (!AVATAR_ALLOWED_MIME.has(file.type)) {
      setError(t("settings.profilePhotoMimeError"));
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setError(t("settings.profilePhotoSizeError"));
      return;
    }
    try {
      const { blob } = await cropImageToSquare(file, AVATAR_OUTPUT_SIZE);
      const preview = URL.createObjectURL(blob);
      setPreviewUrl(preview);
      setPendingFile(
        new File([blob], "avatar.webp", { type: blob.type || "image/webp" })
      );
      setRemovePhoto(false);
    } catch {
      setError(t("settings.profilePhotoCropError"));
    }
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      let nextUrl: string | null = removePhoto ? null : avatarUrl ?? null;

      if (pendingFile) {
        setUploading(true);
        const uploaded = await uploadAvatarBlob(userId, pendingFile, pendingFile.type);
        setUploading(false);
        if (!uploaded.ok) {
          setError(uploaded.error);
          setSaving(false);
          return;
        }
        nextUrl = uploaded.publicUrl;
      } else if (removePhoto) {
        nextUrl = null;
      }

      const result = await updateMyProfileAction({
        displayName: name,
        avatarUrl: nextUrl,
      });
      if (!result.ok) {
        setError(result.error ?? t("settings.profileSaveFailed"));
        setSaving(false);
        return;
      }
      setMessage(result.message ?? t("settings.profileSaved"));
      setPendingFile(null);
      setRemovePhoto(false);
      if (nextUrl) setPreviewUrl(nextUrl);
      else if (removePhoto) setPreviewUrl("");
    } catch {
      setError(t("settings.profileSaveFailed"));
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  function onRemovePhoto() {
    setPendingFile(null);
    setPreviewUrl("");
    setRemovePhoto(true);
    setError(null);
    setMessage(null);
  }

  const busy = saving || uploading;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="relative">
          <Avatar size="lg" className="size-20">
            {previewUrl ? (
              <AvatarImage src={previewUrl} alt={name} />
            ) : null}
            <AvatarFallback className="bg-[linear-gradient(135deg,#29194A,#D23B68)] text-lg font-medium text-white">
              {avatarInitials}
            </AvatarFallback>
          </Avatar>
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
              <Loader2 className="size-6 animate-spin text-soda-pink" />
            </div>
          ) : null}
        </div>
        <div className="min-w-0 space-y-1">
          <p className="font-medium text-foreground">{name || displayName}</p>
          {readOnlyJobTitle && jobTitle ? (
            <p className="text-sm text-muted-foreground">{jobTitle}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {previewUrl
              ? t("settings.profilePhotoPreview")
              : t("settings.profilePhotoInitials")}
          </p>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={onFileChange}
      />

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onPickFile} disabled={busy}>
          <Upload className="me-1.5 size-3.5" />
          {t("settings.profilePhotoUpload")}
        </Button>
        {previewUrl ? (
          <Button type="button" variant="ghost" size="sm" onClick={onRemovePhoto} disabled={busy}>
            <X className="me-1.5 size-3.5" />
            {t("settings.profilePhotoRemove")}
          </Button>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">{t("settings.displayName")}</Label>
        <Input
          id="displayName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onSave} disabled={busy}>
          {busy ? t("actions.saving") : t("settings.saveProfile")}
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}
