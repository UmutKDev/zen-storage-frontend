"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { Button, Dialog, DialogContent, Input } from "@/components/ui";
import { SectionedDialog } from "./SectionedDialog";

/** Minimum passphrase length (the backend enforces it too; we fail fast). */
const MIN_PASSPHRASE = 8;

/**
 * Passphrase entry for the encrypt (set) + decrypt (verify) folder flows.
 * Presentational — the `SecureFolderDialogs` controller passes the action's
 * title/subtitle/submit copy + wires `onSubmit` to the secure-folder hook. Does
 * a client-side min-length check before submitting; the server error (e.g. wrong
 * passphrase on decrypt) arrives back via `error`.
 */
export function PassphraseDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  submitLabel,
  onSubmit,
  error,
  pending = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle: string;
  submitLabel: string;
  onSubmit?: (passphrase: string) => void;
  error?: string | null;
  pending?: boolean;
}) {
  const [passphrase, setPassphrase] = useState("");
  const [reveal, setReveal] = useState(false);
  const [tooShort, setTooShort] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setPassphrase("");
      setReveal(false);
      setTooShort(false);
    }
    onOpenChange(next);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (passphrase.length < MIN_PASSPHRASE) {
      setTooShort(true);
      return;
    }
    setTooShort(false);
    onSubmit?.(passphrase);
  };

  const shownError = tooShort ? t("storage.ops.secure.passphraseMin") : error;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "gap-0 overflow-hidden p-0 sm:max-w-[420px]",
          error && "zs-shake",
        )}
      >
        <form onSubmit={submit}>
          <SectionedDialog
            icon={KeyRound}
            emblemTone="armed"
            title={title}
            subtitle={subtitle}
            footActions={
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenChange(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={pending || passphrase.length === 0}
                >
                  {submitLabel}
                </Button>
              </>
            }
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="zs-passphrase"
                className="text-sm font-medium text-foreground"
              >
                {t("storage.ops.secure.unlock.password")}
              </label>
              <div className="relative">
                <Input
                  id="zs-passphrase"
                  type={reveal ? "text" : "password"}
                  autoFocus
                  value={passphrase}
                  onChange={(e) => {
                    setPassphrase(e.target.value);
                    if (tooShort) setTooShort(false);
                  }}
                  aria-invalid={Boolean(shownError)}
                  aria-describedby={shownError ? "zs-passphrase-error" : undefined}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setReveal((r) => !r)}
                  aria-label={
                    reveal
                      ? t("storage.ops.secure.unlock.hide")
                      : t("storage.ops.secure.unlock.show")
                  }
                  className="absolute top-1/2 right-1 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {shownError ? (
                <p
                  id="zs-passphrase-error"
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {shownError}
                </p>
              ) : null}
            </div>
          </SectionedDialog>
        </form>
      </DialogContent>
    </Dialog>
  );
}
