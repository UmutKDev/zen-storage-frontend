"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { t } from "@/lib/i18n";
import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Label,
} from "@/components/ui";
import type { AccountProfileResponseModel } from "@/service/models";
import { editProfileSchema, type EditProfileValues } from "../lib/validation";
import { useUpdateProfile } from "../hooks";

export function ProfileForm({
  profile,
}: {
  profile: AccountProfileResponseModel;
}) {
  const update = useUpdateProfile();
  const form = useForm<EditProfileValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      FullName: profile.FullName ?? "",
      PhoneNumber: profile.PhoneNumber ?? "",
    },
  });

  const onSubmit = (values: EditProfileValues) => {
    update.mutate(values, {
      // Reset dirty state on success; on error rhf keeps the values for retry.
      onSuccess: () => form.reset(values),
    });
  };

  const busy = update.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="FullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("account.profile.fullNameLabel")}</FormLabel>
              <FormControl>
                <Input
                  autoComplete="name"
                  placeholder={t("account.profile.fullNamePlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="PhoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("account.profile.phoneLabel")}</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  autoComplete="tel"
                  placeholder={t("account.profile.phonePlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-2">
          <Label htmlFor="account-email">
            {t("account.profile.emailLabel")}
          </Label>
          <Input
            id="account-email"
            type="email"
            value={profile.Email ?? ""}
            disabled
            readOnly
          />
          <FormDescription>{t("account.profile.emailHint")}</FormDescription>
        </div>
        <Button
          type="submit"
          disabled={busy || !form.formState.isDirty}
        >
          {t("account.profile.save")}
        </Button>
      </form>
    </Form>
  );
}
