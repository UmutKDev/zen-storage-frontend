"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import {
  Button,
  Checkbox,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
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
  applyToAll,
}: {
  details: ConflictDetailsResponseModel;
  onResolve: (strategy: ConflictStrategy) => void;
  onCancel: () => void;
  pending?: boolean;
  /** Looped-batch hosts (the upload queue: N independent Creates) show the
   *  "apply to all" checkbox here; single-call batches don't need it. */
  applyToAll?: { checked: boolean; onChange: (checked: boolean) => void };
}) {
  const applyToAllId = useId();
  // Batch conflicts (bulk move / multi-drag) get count copy + a name sample
  // and "many" hints; the chosen strategy applies to every conflicting item
  // in THIS batch (apply-to-all radius = one user action).
  const batch = details.TotalItems > 1;
  const names = (details.Conflicts ?? [])
    .map((c) => c.Source?.Name)
    .filter(Boolean);
  const name = names[0];

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("storage.ops.conflict.title")}</DialogTitle>
        <DialogDescription>
          {batch
            ? `${details.ConflictCount} ${t("storage.ops.conflict.of")} ${details.TotalItems} ${t("storage.ops.conflict.existSuffix")}`
            : t("storage.ops.conflict.descriptionGeneric")}
        </DialogDescription>
      </DialogHeader>
      {batch && names.length > 0 ? (
        <ul className="rounded-md bg-muted px-3 py-2 text-sm font-medium text-foreground">
          {names.slice(0, 3).map((n) => (
            <li key={n} className="truncate">
              {n}
            </li>
          ))}
          {names.length > 3 ? (
            <li className="text-xs font-normal text-muted-foreground">
              +{names.length - 3}
            </li>
          ) : null}
        </ul>
      ) : name ? (
        <p className="truncate rounded-md bg-muted px-3 py-2 text-sm font-medium text-foreground">
          {name}
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        <Option
          label={t("storage.ops.conflict.replace")}
          hint={t(
            batch
              ? "storage.ops.conflict.replaceHintMany"
              : "storage.ops.conflict.replaceHint",
          )}
          onClick={() => onResolve("REPLACE")}
          disabled={pending}
          destructive
        />
        <Option
          label={t("storage.ops.conflict.keepBoth")}
          hint={t(
            batch
              ? "storage.ops.conflict.keepBothHintMany"
              : "storage.ops.conflict.keepBothHint",
          )}
          onClick={() => onResolve("KEEP_BOTH")}
          disabled={pending}
        />
        <Option
          label={t("storage.ops.conflict.skip")}
          hint={t(
            batch
              ? "storage.ops.conflict.skipHintMany"
              : "storage.ops.conflict.skipHint",
          )}
          onClick={() => onResolve("SKIP")}
          disabled={pending}
        />
      </div>
      {applyToAll ? (
        <div className="flex items-center gap-2">
          <Checkbox
            id={applyToAllId}
            checked={applyToAll.checked}
            onCheckedChange={(checked) => applyToAll.onChange(checked === true)}
          />
          <Label htmlFor={applyToAllId} className="text-sm font-normal">
            {t("storage.upload.conflict.applyToAll")}
          </Label>
        </div>
      ) : null}
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </DialogFooter>
    </>
  );
}
