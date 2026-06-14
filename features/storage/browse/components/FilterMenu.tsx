"use client";

import {
  Check,
  ChevronDown,
  FileArchive,
  FileText,
  Files,
  Film,
  Folder,
  Image as ImageIcon,
  ListFilter,
  Music,
  Type,
  type LucideIcon,
} from "lucide-react";
import { t } from "@/lib/i18n";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRichItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import { useViewPrefs, type FilterType } from "../stores/viewPrefs.store";

/** Filter categories with their leading icon (swapped for a check when active). */
const TYPES: ReadonlyArray<{ key: FilterType; icon: LucideIcon }> = [
  { key: "all", icon: Files },
  { key: "folder", icon: Folder },
  { key: "image", icon: ImageIcon },
  { key: "video", icon: Film },
  { key: "audio", icon: Music },
  { key: "doc", icon: FileText },
  { key: "text", icon: Type },
  { key: "archive", icon: FileArchive },
];

/** Composes the row label + an sr-only "(selected)" marker on the active row so
 *  the choice is exposed to assistive tech (the check glyph is visual-only). */
function filterLabel(label: string, active: boolean) {
  return (
    <>
      {label}
      {active ? <span className="sr-only"> ({t("common.selected")})</span> : null}
    </>
  );
}

export function FilterMenu() {
  const filterType = useViewPrefs((s) => s.filterType);
  const setFilter = useViewPrefs((s) => s.setFilter);
  const active = filterType !== "all";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          // Accent the trigger while a filter is active so files never look
          // "missing" — the active type is also read aloud via the label/title.
          className={active ? "border-primary/40 text-foreground" : undefined}
          aria-label={t("storage.filter.label")}
          title={`${t("storage.filter.label")} — ${t(`storage.filter.${filterType}`)}`}
        >
          <ListFilter className="size-4" />
          {active ? t(`storage.filter.${filterType}`) : t("storage.filter.label")}
          <ChevronDown className="-ml-0.5 size-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[182px]">
        {TYPES.map(({ key, icon: TypeIcon }) => {
          const isActive = filterType === key;
          return (
            <DropdownMenuRichItem
              key={key}
              icon={isActive ? Check : TypeIcon}
              label={filterLabel(t(`storage.filter.${key}`), isActive)}
              onSelect={() => setFilter(key, "")}
            />
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
