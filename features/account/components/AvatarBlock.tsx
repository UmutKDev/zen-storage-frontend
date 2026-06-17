"use client";

import { useFlag } from "@/lib/flags";
import { t } from "@/lib/i18n";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage, Button } from "@/components/ui";

/**
 * Read-only avatar. The backend `Account/Upload/Image` endpoint is INACTIVE
 * (Q7), so the upload control only renders when the `avatarUpload` flag is on —
 * no dead button ships.
 */
export function AvatarBlock({
  name,
  email,
  image,
}: {
  name?: string;
  email?: string;
  image?: string;
}) {
  const canUpload = useFlag("avatarUpload");
  const display = name?.trim() || email || "";

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16">
        <AvatarImage src={image || undefined} alt={t("account.profile.avatarAlt")} />
        <AvatarFallback className="text-lg">
          {getInitials(display)}
        </AvatarFallback>
      </Avatar>
      {canUpload ? (
        <Button type="button" variant="outline" size="sm">
          {t("account.profile.avatarUpload")}
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t("account.profile.avatarUploadHint")}
        </p>
      )}
    </div>
  );
}
