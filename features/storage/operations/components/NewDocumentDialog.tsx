"use client";

import { useState, type FormEvent } from "react";
import { FilePlus, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { Button, Dialog, DialogContent, Input } from "@/components/ui";
import { useCreateFile } from "../hooks/useCreateFile";
import { ConflictPrompt } from "./ConflictPrompt";
import { SectionedDialog } from "./SectionedDialog";

const FORMATS = ["txt", "md", "html", "csv", "json"] as const;
type DocFormat = (typeof FORMATS)[number];

/** Create-document dialog: name + live mono extension suffix + format chips,
 *  with the final filename previewed in the recessed foot. */
export function NewDocumentDialog({
  path,
  open,
  onOpenChange,
}: {
  path: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<DocFormat>("txt");
  const file = useCreateFile(path, () => onOpenChange(false));
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setName("");
      setFormat("txt");
      file.cancelConflict();
    }
    onOpenChange(next);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) file.mutate({ name: `${trimmed}.${format}` });
  };

  const previewName = `${name.trim() || t("storage.ops.create.namePlaceholder")}.${format}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-[440px]"
      >
        {file.conflict ? (
          <div className="p-6">
            <ConflictPrompt
              details={file.conflict}
              onResolve={file.resolve}
              onCancel={file.cancelConflict}
              pending={file.isPending}
            />
          </div>
        ) : (
          <form onSubmit={submit}>
            <SectionedDialog
              icon={FilePlus}
              title={t("storage.ops.create.documentTitle")}
              footStart={
                <span className="flex min-w-0 items-center gap-1.5 truncate font-mono text-xs text-muted-foreground">
                  <FileText className="size-3.5 shrink-0" />
                  {previewName}
                </span>
              }
              footActions={
                <Button
                  type="submit"
                  size="sm"
                  disabled={file.isPending || name.trim().length === 0}
                >
                  {t("storage.ops.create.submit")}
                </Button>
              }
            >
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="zs-new-doc-name"
                  className="text-sm font-medium text-foreground"
                >
                  {t("storage.ops.create.documentName")}
                </label>
                <div className="relative">
                  <Input
                    id="zs-new-doc-name"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("storage.ops.create.namePlaceholder")}
                    className="pr-16"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-mono text-xs text-muted-foreground">
                    .{format}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">
                  {t("storage.ops.create.format")}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {FORMATS.map((ext) => (
                    <button
                      key={ext}
                      type="button"
                      aria-pressed={format === ext}
                      onClick={() => setFormat(ext)}
                      className={cn(
                        "zs-format-chip",
                        format === ext && "zs-format-chip--on",
                      )}
                    >
                      <span className="font-mono text-xs font-medium text-foreground">
                        .{ext}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </SectionedDialog>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
