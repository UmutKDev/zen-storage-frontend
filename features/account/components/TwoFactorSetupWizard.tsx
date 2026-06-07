"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { t } from "@/lib/i18n";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import type { TwoFactorSetupResponseModel } from "@/service/models";
import { use2FAVerify } from "../hooks";
import { MotionStep } from "./MotionStep";
import { OtpField } from "./OtpField";
import { BackupCodesPanel } from "./BackupCodesPanel";

type Step = "scan" | "verify" | "codes";

/**
 * Lazy-loaded 2FA enrollment wizard (pulls `qrcode.react`): scan → verify →
 * one-time backup codes. The verify mutation invalidates the 2FA status.
 */
export function TwoFactorSetupWizard({
  open,
  onOpenChange,
  setupData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setupData: TwoFactorSetupResponseModel;
}) {
  const verify = use2FAVerify();
  const [step, setStep] = useState<Step>("scan");
  const [code, setCode] = useState("");
  const [codes, setCodes] = useState<ReadonlyArray<string>>([]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setStep("scan");
      setCode("");
      setCodes([]);
    }
    onOpenChange(next);
  };

  const submitVerify = () => {
    verify.mutate(code, {
      onSuccess: (data) => {
        setCodes(data.BackupCodes ?? []);
        setStep("codes");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <AnimatePresence mode="wait" initial={false}>
          {step === "scan" && (
            <MotionStep key="scan">
              <DialogHeader>
                <DialogTitle>
                  {t("account.security.twoFactor.setupTitle")}
                </DialogTitle>
                <DialogDescription>
                  {t("account.security.twoFactor.setupDescription")}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 flex flex-col items-center gap-4">
                {/* Intentional bg-white: a TOTP QR must stay dark-on-white to
                    scan reliably — a theme token would invert it in dark mode. */}
                <div className="rounded-lg bg-white p-3">
                  <QRCodeSVG value={setupData.OtpAuthUrl} size={160} />
                </div>
                <code className="w-full break-all rounded-md border border-border bg-muted/40 px-3 py-2 text-center text-xs">
                  {setupData.Secret}
                </code>
                <Button className="w-full" onClick={() => setStep("verify")}>
                  {t("account.security.twoFactor.continue")}
                </Button>
              </div>
            </MotionStep>
          )}

          {step === "verify" && (
            <MotionStep key="verify">
              <DialogHeader>
                <DialogTitle>
                  {t("account.security.twoFactor.verifyTitle")}
                </DialogTitle>
                <DialogDescription>
                  {t("account.security.twoFactor.verifyDescription")}
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitVerify();
                }}
                className="mt-4 space-y-4"
              >
                <OtpField
                  value={code}
                  onChange={setCode}
                  disabled={verify.isPending}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={verify.isPending || code.length < 6}
                >
                  {t("account.security.twoFactor.verify")}
                </Button>
              </form>
            </MotionStep>
          )}

          {step === "codes" && (
            <MotionStep key="codes">
              <DialogHeader>
                <DialogTitle>
                  {t("account.security.twoFactor.backupTitle")}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <BackupCodesPanel
                  codes={codes}
                  onDone={() => handleOpenChange(false)}
                />
              </div>
            </MotionStep>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
