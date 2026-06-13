"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { Button, Dialog, DialogContent, Input } from "@/components/ui";
import { SectionedDialog } from "./SectionedDialog";

/**
 * Password gate for encrypted folders (click) and hidden items (double-Shift).
 * PRESENTATIONAL ONLY — built as the design-system primitive. Phase 5 wires the
 * in-memory secure-folder token source + the ⇧⇧ reveal gesture (CLAUDE.md
 * rule #5: tokens are never persisted). Not mounted anywhere yet.
 */
export function UnlockDialog({
  open,
  onOpenChange,
  mode = "folder",
  onSubmit,
  error,
  pending = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "folder" | "hidden";
  onSubmit?: (password: string) => void;
  error?: string | null;
  pending?: boolean;
}) {
  const hidden = mode === "hidden";
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setPassword("");
      setReveal(false);
    }
    onOpenChange(next);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (password) onSubmit?.(password);
  };

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
            icon={hidden ? EyeOff : Lock}
            emblemTone={hidden ? "neutral" : "armed"}
            title={
              hidden
                ? t("storage.secure.unlock.titleHidden")
                : t("storage.secure.unlock.title")
            }
            subtitle={
              hidden
                ? t("storage.secure.unlock.subtitleHidden")
                : t("storage.secure.unlock.subtitle")
            }
            footStart={
              <span className="zs-section-cipher">
                <Lock className="size-3" />
                {t("storage.secure.unlock.cipher")}
              </span>
            }
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
                <Button type="submit" size="sm" disabled={pending || !password}>
                  {hidden
                    ? t("storage.secure.unlock.reveal")
                    : t("storage.secure.unlock.submit")}
                </Button>
              </>
            }
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="zs-unlock-password"
                className="text-sm font-medium text-foreground"
              >
                {t("storage.secure.unlock.password")}
              </label>
              <div className="relative">
                <Input
                  id="zs-unlock-password"
                  type={reveal ? "text" : "password"}
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "zs-unlock-error" : undefined}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setReveal((r) => !r)}
                  aria-label={
                    reveal
                      ? t("storage.secure.unlock.hide")
                      : t("storage.secure.unlock.show")
                  }
                  className="absolute top-1/2 right-1 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {error ? (
                <p id="zs-unlock-error" role="alert" className="text-xs text-destructive">
                  {error}
                </p>
              ) : null}
            </div>
          </SectionedDialog>
        </form>
      </DialogContent>
    </Dialog>
  );
}
