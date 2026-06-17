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
import { useReset } from "../hooks/useReset";
import { useRetryCountdown } from "../hooks/useRetryCountdown";
import { resetSchema, type ResetValues } from "../lib/validation";
import { AuthCard } from "../components/AuthCard";
import { AuthError } from "../components/AuthError";

export function ResetScreen() {
  const { pending, sent, error, submit } = useReset();
  const retrySeconds = useRetryCountdown(error);
  const disabled = pending || retrySeconds > 0;

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: "" },
  });

  const backLink = (
    <Link href="/login" className="font-medium text-primary hover:underline">
      {t("auth.reset.backToLogin")}
    </Link>
  );

  if (sent) {
    return (
      <AuthCard title={t("auth.reset.sentTitle")} footer={backLink}>
        <p className="text-sm text-muted-foreground">
          {t("auth.reset.sentDescription")}
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t("auth.reset.title")}
      subtitle={t("auth.reset.description")}
      footer={backLink}
    >
      <AuthError error={error} retrySeconds={retrySeconds} />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((v) => submit(v.email))}
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
                    autoFocus
                    placeholder={t("auth.login.emailPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={disabled}>
            {t("auth.reset.send")}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
