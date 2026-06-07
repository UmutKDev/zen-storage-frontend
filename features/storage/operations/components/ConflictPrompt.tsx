"use client";

import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import {
  Button,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import type { ConflictDetailsResponseModel } from "@/service/models";
import type { ConflictStrategy } from "../lib/conflict";

function Option({
  label,
  hint,
  onClick,
  disabled,
  destructive,
}: {
  label: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full flex-col items-start gap-0.5 rounded-md border border-border p-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
    >
      <span
        className={cn(
          "text-sm font-medium",
          destructive ? "text-destructive" : "text-foreground",
        )}
      >
        {label}
      </span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </button>
  );
}

/**
 * Conflict resolver content (rendered inside an op dialog's DialogContent — not
 * its own Dialog). Offers REPLACE / KEEP_BOTH / SKIP; never silently overwrites.
 */
export function ConflictPrompt({
  details,
  onResolve,
  onCancel,
  pending,
}: {
  details: ConflictDetailsResponseModel;
  onResolve: (strategy: ConflictStrategy) => void;
  onCancel: () => void;
  pending?: boolean;
}) {
  const name = details.Conflicts?.[0]?.Source?.Name;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("storage.ops.conflict.title")}</DialogTitle>
        <DialogDescription>
          {t("storage.ops.conflict.descriptionGeneric")}
        </DialogDescription>
      </DialogHeader>
      {name ? (
        <p className="truncate rounded-md bg-muted px-3 py-2 text-sm font-medium text-foreground">
          {name}
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        <Option
          label={t("storage.ops.conflict.replace")}
          hint={t("storage.ops.conflict.replaceHint")}
          onClick={() => onResolve("REPLACE")}
          disabled={pending}
          destructive
        />
        <Option
          label={t("storage.ops.conflict.keepBoth")}
          hint={t("storage.ops.conflict.keepBothHint")}
          onClick={() => onResolve("KEEP_BOTH")}
          disabled={pending}
        />
        <Option
          label={t("storage.ops.conflict.skip")}
          hint={t("storage.ops.conflict.skipHint")}
          onClick={() => onResolve("SKIP")}
          disabled={pending}
        />
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </DialogFooter>
    </>
  );
}
