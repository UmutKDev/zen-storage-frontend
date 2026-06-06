import { z } from "zod";
import { emailSchema, passwordSchema } from "@/lib/validation";
import { t } from "@/lib/i18n";

/** Feature-local auth form schemas, built on the global zod primitives. */
export const loginEmailSchema = z.object({ email: emailSchema });

export const loginPasswordSchema = z.object({
  password: z.string().min(1, t("auth.errors.passwordRequired")),
});

export const otpSchema = z.object({
  code: z.string().length(6, t("auth.errors.otpLength")),
});

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: t("auth.errors.passwordMismatch"),
  });

export const resetSchema = z.object({ email: emailSchema });

export type LoginEmailValues = z.infer<typeof loginEmailSchema>;
export type LoginPasswordValues = z.infer<typeof loginPasswordSchema>;
export type OtpValues = z.infer<typeof otpSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ResetValues = z.infer<typeof resetSchema>;
