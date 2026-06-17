"use client";

import { Download } from "lucide-react";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui";
import { downloadBackupCodes } from "../lib/backup-codes";

/**
 * One-time backup-codes reveal. Codes are held in component state only (never
 * cached) and can't be fetched again — `onDone` gates dismissal.
 */
export function BackupCodesPanel({
  codes,
  onDone,
}: {
  codes: ReadonlyArray<string>;
  onDone: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("account.security.twoFactor.backupDescription")}
      </p>
      <ul className="grid grid-cols-2 gap-2 rounded-md border border-border bg-muted/40 p-3 font-mono text-sm">
        {codes.map((code) => (
          <li key={code} className="text-center tabular-nums">
            {code}
          </li>
        ))}
      </ul>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => downloadBackupCodes(codes as string[])}
        >
          <Download className="size-4" />
          {t("account.security.twoFactor.download")}
        </Button>
        <Button type="button" onClick={onDone}>
          {t("account.security.twoFactor.savedConfirm")}
        </Button>
      </div>
    </div>
  );
}
