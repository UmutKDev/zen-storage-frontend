"use client";

import { ArrowUpDown, Check } from "lucide-react";
import { t } from "@/lib/i18n";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { useViewPrefs, type SortKey } from "../stores/viewPrefs.store";

const KEYS: ReadonlyArray<SortKey> = ["name", "size", "modified", "type"];

export function SortMenu() {
  const sortKey = useViewPrefs((s) => s.sortKey);
  const sortDir = useViewPrefs((s) => s.sortDir);
  const setSort = useViewPrefs((s) => s.setSort);

  const dirLabel =
    sortDir === "asc"
      ? t("storage.sort.ascending")
      : t("storage.sort.descending");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("storage.sort.label")}
          title={`${t("storage.sort.label")} — ${t(`storage.sort.${sortKey}`)} · ${dirLabel}`}
        >
          <ArrowUpDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{t("storage.sort.label")}</DropdownMenuLabel>
        {KEYS.map((key) => (
          <DropdownMenuItem key={key} onSelect={() => setSort(key, sortDir)}>
            <span className="flex-1">{t(`storage.sort.${key}`)}</span>
            {sortKey === key ? <Check className="size-4" /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setSort(sortKey, "asc")}>
          <span className="flex-1">{t("storage.sort.ascending")}</span>
          {sortDir === "asc" ? <Check className="size-4" /> : null}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setSort(sortKey, "desc")}>
          <span className="flex-1">{t("storage.sort.descending")}</span>
          {sortDir === "desc" ? <Check className="size-4" /> : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
