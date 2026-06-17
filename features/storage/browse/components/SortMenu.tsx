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
  DropdownMenuRichItem,
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

/** Composes the row label + an sr-only "(selected)" marker on the active row so
 *  the choice is exposed to assistive tech (the check glyph is visual-only). */
function sortLabel(label: string, active: boolean) {
  return (
    <>
      {label}
      {active ? <span className="sr-only"> ({t("common.selected")})</span> : null}
    </>
  );
}

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
          size="sm"
          aria-label={t("storage.sort.label")}
          title={`${t("storage.sort.label")} — ${t(`storage.sort.${sortKey}`)} · ${dirLabel}`}
        >
          <ArrowUpDown className="size-4" />
          {t("storage.sort.label")}
          <ChevronDown className="-ml-0.5 size-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      {/* Icon-TILE rows (machined .zs-menu-icon), matching the Zen sort menu:
          the active field/direction swaps its tile icon for a check. */}
      <DropdownMenuContent align="end" className="w-[182px]">
        {FIELDS.map(({ key, icon: FieldIcon }) => {
          const active = sortKey === key;
          return (
            <DropdownMenuRichItem
              key={key}
              icon={active ? Check : FieldIcon}
              label={sortLabel(t(`storage.sort.${key}`), active)}
              onSelect={() => setSort(key, sortDir)}
            />
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuRichItem
          icon={sortDir === "asc" ? Check : ArrowUpNarrowWide}
          label={sortLabel(t("storage.sort.ascending"), sortDir === "asc")}
          onSelect={() => setSort(sortKey, "asc")}
        />
        <DropdownMenuRichItem
          icon={sortDir === "desc" ? Check : ArrowDownWideNarrow}
          label={sortLabel(t("storage.sort.descending"), sortDir === "desc")}
          onSelect={() => setSort(sortKey, "desc")}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
