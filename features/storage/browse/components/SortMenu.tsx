"use client";

import {
  AArrowDown,
  ArrowDownWideNarrow,
  ArrowUpDown,
  ArrowUpNarrowWide,
  Check,
  ChevronDown,
  Clock,
  Scale,
  Shapes,
  type LucideIcon,
} from "lucide-react";
import { t } from "@/lib/i18n";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { useViewPrefs, type SortKey } from "../stores/viewPrefs.store";

/** Sort fields with their leading icon (swapped for a check when active). */
const FIELDS: ReadonlyArray<{ key: SortKey; icon: LucideIcon }> = [
  { key: "name", icon: AArrowDown },
  { key: "size", icon: Scale },
  { key: "modified", icon: Clock },
  { key: "type", icon: Shapes },
];

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
          variant="outline"
          size="sm"
          aria-label={t("storage.sort.label")}
          title={`${t("storage.sort.label")} — ${t(`storage.sort.${sortKey}`)} · ${dirLabel}`}
        >
          <ArrowUpDown className="size-4" />
          {t("storage.sort.label")}
          <ChevronDown className="-ml-0.5 size-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      {/* Icon-led menu: each row shows its field/direction icon, swapped for a
          check on the active choice (matches the Zen sort-menu design). */}
      <DropdownMenuContent align="end" className="w-[182px]">
        {FIELDS.map(({ key, icon: FieldIcon }) => {
          const active = sortKey === key;
          const Icon = active ? Check : FieldIcon;
          return (
            <DropdownMenuItem key={key} onSelect={() => setSort(key, sortDir)}>
              <Icon />
              {t(`storage.sort.${key}`)}
              {active ? (
                <span className="sr-only">({t("common.selected")})</span>
              ) : null}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setSort(sortKey, "asc")}>
          {sortDir === "asc" ? <Check /> : <ArrowUpNarrowWide />}
          {t("storage.sort.ascending")}
          {sortDir === "asc" ? (
            <span className="sr-only">({t("common.selected")})</span>
          ) : null}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setSort(sortKey, "desc")}>
          {sortDir === "desc" ? <Check /> : <ArrowDownWideNarrow />}
          {t("storage.sort.descending")}
          {sortDir === "desc" ? (
            <span className="sr-only">({t("common.selected")})</span>
          ) : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
