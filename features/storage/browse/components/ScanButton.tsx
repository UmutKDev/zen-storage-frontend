"use client";

import { ScanSearch } from "lucide-react";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui";
import { useStorageUiStore } from "../../operations";

/** Toolbar entry point for the duplicate-scan dialog (also a ⌘K command). */
export function ScanButton() {
  const openScan = useStorageUiStore((s) => s.openScanDialog);
  return (
    <Button variant="outline" size="sm" onClick={openScan}>
      <ScanSearch />
      {t("storage.duplicate.button")}
    </Button>
  );
}
