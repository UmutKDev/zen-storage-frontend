"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Input,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui";
import { t } from "@/lib/i18n";
import { useRegister } from "../hooks/useRegister";
import { useRetryCountdown } from "../hooks/useRetryCountdown";
import { registerSchema, type RegisterValues } from "../lib/validation";
import { AuthCard } from "../components/AuthCard";
import { AuthError } from "../components/AuthError";

export function RegisterScreen() {
  const { pending, error, submit } = useRegister();
  const retrySeconds = useRetryCountdown(error);
  const disabled = pending || retrySeconds > 0;

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", passwordConfirmation: "" },
  });

  return (
    <AuthCard
      title={t("auth.register.title")}
      subtitle={t("auth.register.subtitle")}
      footer={
        <>
          {t("auth.register.haveAccount")}{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            {t("auth.register.signIn")}
          </Link>
        </>
      }
    >
      <AuthError error={error} retrySeconds={retrySeconds} />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((v) =>
            submit(v.email, v.password, v.passwordConfirmation),
          )}
          className="space-y-4"
          noValidate
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.login.emailLabel")}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder={t("auth.login.emailPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.login.passwordLabel")}</FormLabel>
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
            name="passwordConfirmation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.register.passwordConfirmLabel")}</FormLabel>
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
          <Button type="submit" className="w-full" disabled={disabled}>
            {t("auth.register.create")}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
