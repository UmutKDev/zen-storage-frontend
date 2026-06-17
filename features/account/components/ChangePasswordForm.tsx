"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { t } from "@/lib/i18n";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@/components/ui";
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from "../lib/validation";
import { useChangePassword } from "../hooks";

export function ChangePasswordForm() {
  const change = useChangePassword();
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      CurrentPassword: "",
      NewPassword: "",
      NewPasswordConfirmation: "",
    },
  });

  const onSubmit = (values: ChangePasswordValues) => {
    change.mutate(values, { onSuccess: () => form.reset() });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("account.security.password.title")}</CardTitle>
        <CardDescription>
          {t("account.security.password.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="CurrentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("account.security.password.currentLabel")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="NewPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("account.security.password.newLabel")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="NewPasswordConfirmation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("account.security.password.confirmLabel")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={change.isPending}>
              {t("account.security.password.submit")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
