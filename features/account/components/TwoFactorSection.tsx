"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Shield, ShieldCheck } from "lucide-react";
import { t } from "@/lib/i18n";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from "@/components/ui";
import {
  use2FADisable,
  use2FASetup,
  use2FAStatus,
  useRegenerateBackupCodes,
} from "../hooks";
import { CodeDialog } from "./CodeDialog";
import { BackupCodesPanel } from "./BackupCodesPanel";
import { SectionError } from "./SectionError";

// Lazy — `qrcode.react` only loads when the user starts enrollment.
const TwoFactorSetupWizard = dynamic(
  () => import("./TwoFactorSetupWizard").then((m) => m.TwoFactorSetupWizard),
  { ssr: false },
);

export function TwoFactorSection() {
  const { data: status, isPending, isError, refetch } = use2FAStatus();
  const setup = use2FASetup();
  const disable = use2FADisable();
  const regenerate = useRegenerateBackupCodes();

  const [wizardOpen, setWizardOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [newCodes, setNewCodes] = useState<ReadonlyArray<string> | null>(null);

  const enabled = status?.IsEnabled ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("account.security.twoFactor.title")}</CardTitle>
        <CardDescription>
          {t("account.security.twoFactor.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPending ? (
          <Skeleton className="h-10 w-full" />
        ) : isError ? (
          <SectionError onRetry={() => void refetch()} />
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {enabled ? (
                  <ShieldCheck className="size-5 text-success" />
                ) : (
                  <Shield className="size-5 text-muted-foreground" />
                )}
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {enabled
                      ? t("account.security.twoFactor.statusEnabled")
                      : t("account.security.twoFactor.statusDisabled")}
                  </p>
                  {enabled && status ? (
                    <p className="text-xs text-muted-foreground">
                      {status.BackupCodesRemaining}{" "}
                      {t("account.security.twoFactor.backupRemaining")}
                    </p>
                  ) : null}
                </div>
              </div>
              {enabled ? (
                <Button variant="outline" onClick={() => setDisableOpen(true)}>
                  {t("account.security.twoFactor.disable")}
                </Button>
              ) : (
                <Button
                  onClick={() =>
                    setup.mutate(undefined, {
                      onSuccess: () => setWizardOpen(true),
                    })
                  }
                  disabled={setup.isPending}
                >
                  {t("account.security.twoFactor.enable")}
                </Button>
              )}
            </div>
            {enabled ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRegenOpen(true)}
              >
                {t("account.security.twoFactor.regenerate")}
              </Button>
            ) : null}
          </>
        )}
      </CardContent>

      {wizardOpen && setup.data ? (
        <TwoFactorSetupWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          setupData={setup.data}
        />
      ) : null}

      <CodeDialog
        open={disableOpen}
        onOpenChange={setDisableOpen}
        title={t("account.security.twoFactor.disableTitle")}
        description={t("account.security.twoFactor.disableDescription")}
        confirmLabel={t("account.security.twoFactor.disable")}
        pending={disable.isPending}
        onSubmit={(code) =>
          disable.mutate(code, { onSuccess: () => setDisableOpen(false) })
        }
      />

      <CodeDialog
        open={regenOpen}
        onOpenChange={setRegenOpen}
        title={t("account.security.twoFactor.regenerateTitle")}
        description={t("account.security.twoFactor.regenerateDescription")}
        confirmLabel={t("account.security.twoFactor.regenerate")}
        pending={regenerate.isPending}
        onSubmit={(code) =>
          regenerate.mutate(code, {
            onSuccess: (data) => {
              setRegenOpen(false);
              setNewCodes(data.BackupCodes ?? []);
            },
          })
        }
      />

      <Dialog
        open={newCodes !== null}
        onOpenChange={(open) => {
          if (!open) setNewCodes(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {t("account.security.twoFactor.backupTitle")}
            </DialogTitle>
          </DialogHeader>
          {newCodes ? (
            <BackupCodesPanel codes={newCodes} onDone={() => setNewCodes(null)} />
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
