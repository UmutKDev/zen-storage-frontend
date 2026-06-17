"use client";

import { LayoutGrid, List } from "lucide-react";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui";
import { useViewPrefs } from "../stores/viewPrefs.store";

export function ViewToggle() {
  const view = useViewPrefs((s) => s.view);
  const setView = useViewPrefs((s) => s.setView);

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
      <Button
        variant={view === "list" ? "secondary" : "ghost"}
        size="icon"
        className="size-7"
        aria-label={t("storage.view.list")}
        aria-pressed={view === "list"}
        onClick={() => setView("list")}
      >
        <List className="size-4" />
      </Button>
      <Button
        variant={view === "grid" ? "secondary" : "ghost"}
        size="icon"
        className="size-7"
        aria-label={t("storage.view.grid")}
        aria-pressed={view === "grid"}
        onClick={() => setView("grid")}
      >
        <LayoutGrid className="size-4" />
      </Button>
    </div>
  );
}
