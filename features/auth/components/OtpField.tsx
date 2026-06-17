"use client";

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui";

/** 6-digit TOTP input (autofocus + paste handled by input-otp). */
export function OtpField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <InputOTP
      maxLength={6}
      value={value}
      onChange={onChange}
      disabled={disabled}
      autoFocus
      aria-label="One-time code"
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
