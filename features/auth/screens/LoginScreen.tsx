"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence } from "framer-motion";
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
import { useLoginFlow } from "../hooks/useLoginFlow";
import { useRetryCountdown } from "../hooks/useRetryCountdown";
import {
  loginEmailSchema,
  loginPasswordSchema,
  type LoginEmailValues,
  type LoginPasswordValues,
} from "../lib/validation";
import { AuthCard } from "../components/AuthCard";
import { AuthError } from "../components/AuthError";
import { OtpField } from "../components/OtpField";
import { MotionStep } from "../components/MotionStep";

export function LoginScreen() {
  const flow = useLoginFlow();
  const retrySeconds = useRetryCountdown(flow.error);
  const disabled = flow.pending || retrySeconds > 0;
  const [otp, setOtp] = useState("");

  const emailForm = useForm<LoginEmailValues>({
    resolver: zodResolver(loginEmailSchema),
    defaultValues: { email: "" },
  });
  const passwordForm = useForm<LoginPasswordValues>({
    resolver: zodResolver(loginPasswordSchema),
    defaultValues: { password: "" },
  });

  return (
    <AuthCard
      title={t("auth.login.title")}
      subtitle={t("auth.login.subtitle")}
      footer={
        <>
          {t("auth.login.noAccount")}{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            {t("auth.login.signUp")}
          </Link>
        </>
      }
    >
      <AuthError error={flow.error} retrySeconds={retrySeconds} />
      <AnimatePresence mode="wait" initial={false}>
        {flow.step === "email" && (
          <MotionStep key="email">
            <Form {...emailForm}>
              <form
                onSubmit={emailForm.handleSubmit((v) => flow.submitEmail(v.email))}
                className="space-y-4"
                noValidate
              >
                <FormField
                  control={emailForm.control}
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
                  {t("auth.login.continue")}
                </Button>
              </form>
            </Form>
          </MotionStep>
        )}

        {flow.step === "password" && (
          <MotionStep key="password">
            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit((v) =>
                  flow.submitPassword(v.password),
                )}
                className="space-y-4"
                noValidate
              >
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>{t("auth.login.passwordLabel")}</FormLabel>
                        <Link
                          href="/reset"
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          {t("auth.login.forgot")}
                        </Link>
                      </div>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="current-password"
                          autoFocus
                          placeholder={t("auth.login.passwordPlaceholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={disabled}>
                  {t("auth.login.signIn")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={flow.restart}
                  disabled={flow.pending}
                >
                  {t("auth.login.back")}
                </Button>
              </form>
            </Form>
          </MotionStep>
        )}

        {flow.step === "twoFactor" && (
          <MotionStep key="twoFactor">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void flow.submitOtp(otp);
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5 text-center">
                <p className="text-sm font-medium text-foreground">
                  {t("auth.login.twoFactorTitle")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("auth.login.twoFactorDescription")}
                </p>
              </div>
              <div className="flex justify-center">
                <OtpField value={otp} onChange={setOtp} disabled={disabled} />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={disabled || otp.length < 6}
              >
                {t("auth.login.verify")}
              </Button>
            </form>
          </MotionStep>
        )}
      </AnimatePresence>
    </AuthCard>
  );
}
