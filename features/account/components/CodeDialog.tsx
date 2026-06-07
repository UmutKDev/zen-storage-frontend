"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { OtpField } from "./OtpField";

/**
 * A dialog that collects a 6-digit code and runs a code-gated action (disable
 * 2FA, regenerate backup codes). The OTP is cleared whenever the dialog closes.
 */
export function CodeDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pending = false,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  pending?: boolean;
  onSubmit: (code: string) => void;
}) {
  const [code, setCode] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (!next) setCode("");
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(code);
          }}
          className="space-y-4"
        >
          <OtpField value={code} onChange={setCode} disabled={pending} />
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={pending || code.length < 6}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
