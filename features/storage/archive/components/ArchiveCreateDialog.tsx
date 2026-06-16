"use client";

import { useState } from "react";
import { FileArchive, Loader2 } from "lucide-react";
import { t } from "@/lib/i18n";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import type { FolderEntry } from "../../browse/lib/entries";
import { useArchiveCreate, type ArchiveFormat } from "../hooks/useArchiveCreate";

// Only formats the backend can CREATE (RAR is extract-only — `SupportsCreation`).
const FORMATS: ReadonlyArray<{ value: ArchiveFormat; label: string }> = [
  { value: "zip", label: "ZIP" },
  { value: "tar", label: "TAR" },
  { value: "tar.gz", label: "TAR.GZ" },
];

/**
 * Create-archive dialog (§6.3), launched from the bulk-selection bar. Pick a
 * format + optional name, Start → the dialog closes and progress shows in the
 * topbar `JobsMenu`; the `…-<uuid>.<ext>` output appears in the folder on
 * completion. No in-dialog progress (the job tray owns that).
 */
export function ArchiveCreateDialog({
  entries,
  path,
  open,
  onOpenChange,
  onArchived,
}: {
  entries: FolderEntry[];
  path: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArchived?: () => void;
}) {
  const { start, starting } = useArchiveCreate(path);
  const [format, setFormat] = useState<ArchiveFormat>("zip");
  const [name, setName] = useState("");

  // No in-dialog "started" announcement: the dialog closes on start, so a local
  // aria-live region would unmount before it could be read. The persistent topbar
  // JobsMenu surfaces the running job immediately and announces its outcome.
  const onCreate = async () => {
    const ok = await start(entries, { format, outputName: name });
    if (!ok) return;
    onOpenChange(false);
    onArchived?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileArchive className="size-5 text-muted-foreground" aria-hidden />
              {t("storage.archive.create.title")}
            </DialogTitle>
            <DialogDescription>
              {`${entries.length} ${t("storage.archive.create.itemsSuffix")}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-1">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("storage.archive.create.format")}
              </Label>
              <Tabs
                value={format}
                onValueChange={(v) => setFormat(v as ArchiveFormat)}
              >
                <TabsList className="w-full">
                  {FORMATS.map((f) => (
                    <TabsTrigger key={f.value} value={f.value}>
                      {f.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label htmlFor="archive-name" className="text-sm font-medium">
                {t("storage.archive.create.name")}
              </Label>
              <Input
                id="archive-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("storage.archive.create.namePlaceholder")}
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("storage.archive.create.cancel")}
            </Button>
            <Button
              onClick={() => void onCreate()}
              disabled={starting || entries.length === 0}
            >
              {starting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              {t("storage.archive.create.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
