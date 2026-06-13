"use client";

import { useState, type FormEvent } from "react";
import { FolderPlus, Lock } from "lucide-react";
import { basename } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { Button, Dialog, DialogContent, Input } from "@/components/ui";
import { useCreateFolder } from "../hooks/useCreateFolder";
import { ConflictPrompt } from "./ConflictPrompt";
import { SectionedDialog } from "./SectionedDialog";

/**
 * Create-folder dialog on the sectioned chrome. The encrypt option mirrors the
 * design but is disabled at MVP — encrypted folders are a Phase-5 secure
 * feature (the create mutation carries no encrypt field; we don't fake it).
 */
export function NewFolderDialog({
  path,
  open,
  onOpenChange,
}: {
  path: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const folder = useCreateFolder(path, () => onOpenChange(false));
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setName("");
      folder.cancelConflict();
    }
    onOpenChange(next);
  };
  const close = () => handleOpenChange(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) folder.mutate({ name: trimmed });
  };

  const destination = basename(path) || t("storage.breadcrumb.home");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-[440px]"
      >
        {folder.conflict ? (
          <div className="p-6">
            <ConflictPrompt
              details={folder.conflict}
              onResolve={folder.resolve}
              onCancel={folder.cancelConflict}
              pending={folder.isPending}
            />
          </div>
        ) : (
          <form onSubmit={submit}>
            <SectionedDialog
              icon={FolderPlus}
              title={t("storage.ops.create.folderTitle")}
              subtitle={
                <>
                  {t("storage.ops.create.in")}{" "}
                  <strong className="font-medium text-foreground">
                    {destination}
                  </strong>
                </>
              }
              footActions={
                <>
                  <Button type="button" variant="ghost" size="sm" onClick={close}>
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={folder.isPending || name.trim().length === 0}
                  >
                    {t("storage.ops.create.submit")}
                  </Button>
                </>
              }
            >
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="zs-new-folder-name"
                  className="text-sm font-medium text-foreground"
                >
                  {t("storage.ops.create.folderName")}
                </label>
                <Input
                  id="zs-new-folder-name"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("storage.ops.create.namePlaceholder")}
                />
              </div>
              {/* Encrypt option — Phase 5 wires the actual encryption. */}
              <div
                className="zs-create-option cursor-not-allowed opacity-60"
                aria-disabled
              >
                <span className="zs-create-option-glyph">
                  <Lock className="size-4" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-px">
                  <span className="text-sm font-medium text-foreground">
                    {t("storage.ops.create.encrypt")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("storage.ops.create.encryptSoon")}
                  </span>
                </span>
              </div>
            </SectionedDialog>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
