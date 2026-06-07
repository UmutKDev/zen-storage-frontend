import { z } from "zod";
import { passwordSchema } from "@/lib/validation";
import { t } from "@/lib/i18n";

/** Feature-local account form schemas, built on the global zod primitives. */
export const editProfileSchema = z.object({
  FullName: z.string().min(1, t("account.errors.fullNameRequired")),
  PhoneNumber: z.string(),
});

export const changePasswordSchema = z
  .object({
    CurrentPassword: z
      .string()
      .min(1, t("account.errors.currentPasswordRequired")),
    NewPassword: passwordSchema,
    NewPasswordConfirmation: z.string(),
  })
  .refine((data) => data.NewPassword === data.NewPasswordConfirmation, {
    path: ["NewPasswordConfirmation"],
    message: t("account.errors.passwordMismatch"),
  });

export const otpCodeSchema = z.object({
  code: z.string().length(6, t("auth.errors.otpLength")),
});

export const passkeyNameSchema = z.object({
  deviceName: z.string().min(1, t("account.errors.deviceNameRequired")),
});

export type EditProfileValues = z.infer<typeof editProfileSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
export type OtpCodeValues = z.infer<typeof otpCodeSchema>;
export type PasskeyNameValues = z.infer<typeof passkeyNameSchema>;
