"use client";

import { MoreHorizontal, ScanSearch } from "lucide-react";
import { t } from "@/lib/i18n";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRichItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import { useStorageUiStore } from "../../operations";

/**
 * Toolbar overflow (`⋯`) menu for occasional, non-primary storage actions —
 * duplicate scan today, room for more maintenance actions later. Keeps the
 * primary New + Upload pair uncluttered. Duplicate scan is also a ⌘K command.
 */
export function MoreMenu() {
  const openScan = useStorageUiStore((s) => s.openScanDialog);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          aria-label={t("storage.more.label")}
          title={t("storage.more.label")}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuRichItem
          icon={ScanSearch}
          label={t("storage.duplicate.button")}
          description={t("storage.duplicate.menuDesc")}
          onSelect={openScan}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
