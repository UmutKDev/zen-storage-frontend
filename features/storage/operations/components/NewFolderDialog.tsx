"use client";

import { useState, type FormEvent } from "react";
import { FolderPlus, Lock } from "lucide-react";
import { basename, cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { Button, Dialog, DialogContent, Input } from "@/components/ui";
import { useCreateFolder } from "../hooks/useCreateFolder";
import { ConflictPrompt } from "./ConflictPrompt";
import { SectionedDialog } from "./SectionedDialog";

const MIN_PASSPHRASE = 8;

/**
 * Create-folder dialog on the sectioned chrome. The encrypt toggle (Phase 5)
 * reveals a passphrase field; when on, the folder is created encrypted
 * (`IsEncrypted` + the `X-Folder-Passphrase` header — the passphrase is never
 * stored).
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
  const [encrypt, setEncrypt] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [tooShort, setTooShort] = useState(false);
  const folder = useCreateFolder(path, () => onOpenChange(false));
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setName("");
      setEncrypt(false);
      setPassphrase("");
      setTooShort(false);
      folder.cancelConflict();
    }
    onOpenChange(next);
  };
  const close = () => handleOpenChange(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (encrypt && passphrase.length < MIN_PASSPHRASE) {
      setTooShort(true);
      return;
    }
    folder.mutate({ name: trimmed, encrypt, passphrase });
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
                    disabled={
                      folder.isPending ||
                      name.trim().length === 0 ||
                      (encrypt && passphrase.length === 0)
                    }
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
              {/* Encrypt toggle — reveals the passphrase field when armed. */}
              <button
                type="button"
                onClick={() => setEncrypt((e) => !e)}
                aria-pressed={encrypt}
                className={cn(
                  "zs-create-option text-left",
                  encrypt && "zs-create-option--on",
                )}
              >
                <span className="zs-create-option-glyph">
                  <Lock className="size-4" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-px">
                  <span className="text-sm font-medium text-foreground">
                    {t("storage.ops.create.encrypt")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("storage.ops.create.encryptHint")}
                  </span>
                </span>
              </button>
              {encrypt ? (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="zs-new-folder-passphrase"
                    className="text-sm font-medium text-foreground"
                  >
                    {t("storage.ops.secure.unlock.password")}
                  </label>
                  <Input
                    id="zs-new-folder-passphrase"
                    type="password"
                    value={passphrase}
                    onChange={(e) => {
                      setPassphrase(e.target.value);
                      if (tooShort) setTooShort(false);
                    }}
                    aria-invalid={tooShort}
                    aria-describedby={
                      tooShort ? "zs-new-folder-passphrase-error" : undefined
                    }
                  />
                  <p
                    id="zs-new-folder-passphrase-error"
                    className={cn(
                      "text-xs",
                      tooShort ? "text-destructive" : "text-muted-foreground",
                    )}
                    role={tooShort ? "alert" : undefined}
                  >
                    {t("storage.ops.secure.passphraseMin")}
                  </p>
                </div>
              ) : null}
            </SectionedDialog>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
