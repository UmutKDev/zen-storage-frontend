"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard, LogOut, Shield, User } from "lucide-react";
import { t } from "@/lib/i18n";
import { getInitials } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRichItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { signOutAndCleanup } from "@/features/auth";
import { useProfile } from "@/features/account";

export function ProfileMenu() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const displayName = profile?.FullName?.trim() || profile?.Email || "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={t("account.shell.profileMenu.account")}
        >
          <Avatar>
            <AvatarImage src={profile?.Image || undefined} alt="" />
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 p-1.5">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="size-9">
            <AvatarImage src={profile?.Image || undefined} alt="" />
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            {profile?.FullName ? (
              <span className="truncate text-sm font-semibold tracking-[-0.01em] text-foreground">
                {profile.FullName}
              </span>
            ) : null}
            {profile?.Email ? (
              <span className="truncate text-xs text-muted-foreground">
                {profile.Email}
              </span>
            ) : null}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuRichItem
          icon={User}
          label={t("account.shell.profileMenu.profile")}
          onSelect={() => router.push("/account/profile")}
        />
        <DropdownMenuRichItem
          icon={Shield}
          label={t("account.shell.profileMenu.security")}
          onSelect={() => router.push("/account/security")}
        />
        <DropdownMenuRichItem
          icon={CreditCard}
          label={t("account.shell.profileMenu.subscription")}
          onSelect={() => router.push("/account/subscription")}
        />
        <DropdownMenuSeparator />
        <DropdownMenuRichItem
          icon={LogOut}
          variant="destructive"
          label={t("account.shell.profileMenu.signOut")}
          onSelect={() => void signOutAndCleanup(queryClient)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
