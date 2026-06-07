"use client";

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui";
import { t } from "@/lib/i18n";

/** 6-digit TOTP input (autofocus + paste handled by input-otp). */
export function OtpField({
  value,
  onChange,
  disabled,
  autoFocus = true,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <InputOTP
      maxLength={6}
      value={value}
      onChange={onChange}
      disabled={disabled}
      autoFocus={autoFocus}
      aria-label={t("account.security.twoFactor.otpLabel")}
      containerClassName="justify-center"
    >
      <InputOTPGroup>
        {Array.from({ length: 6 }, (_, i) => (
          <InputOTPSlot key={i} index={i} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
