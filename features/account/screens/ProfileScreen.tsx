"use client";

import { t } from "@/lib/i18n";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/ui";
import { useProfile } from "../hooks";
import { AvatarBlock } from "../components/AvatarBlock";
import { ProfileForm } from "../components/ProfileForm";

export function ProfileScreen() {
  const { data: profile, isPending, isError, refetch } = useProfile();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("account.profile.title")}</CardTitle>
        <CardDescription>{t("account.profile.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isPending ? (
          <div className="space-y-6" aria-busy>
            <div className="flex items-center gap-4">
              <Skeleton className="size-16 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        ) : isError || !profile ? (
          <div
            className="flex flex-col items-start gap-3"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-sm text-muted-foreground">
              {t("common.errorGeneric")}
            </p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              {t("common.retry")}
            </Button>
          </div>
        ) : (
          <>
            <AvatarBlock
              name={profile.FullName}
              email={profile.Email}
              image={profile.Image}
            />
            <ProfileForm profile={profile} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
