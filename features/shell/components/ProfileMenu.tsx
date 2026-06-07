"use client";

import Link from "next/link";
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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { signOutAndCleanup } from "@/features/auth";
import { useProfile } from "@/features/account";

export function ProfileMenu() {
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
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          {profile?.FullName ? (
            <span className="truncate font-medium text-foreground">
              {profile.FullName}
            </span>
          ) : null}
          {profile?.Email ? (
            <span className="truncate text-xs font-normal text-muted-foreground">
              {profile.Email}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account/profile">
            <User className="size-4" />
            {t("account.shell.profileMenu.profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/security">
            <Shield className="size-4" />
            {t("account.shell.profileMenu.security")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/subscription">
            <CreditCard className="size-4" />
            {t("account.shell.profileMenu.subscription")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOutAndCleanup(queryClient)}>
          <LogOut className="size-4" />
          {t("account.shell.profileMenu.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
