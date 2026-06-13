"use client";

import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui";
import { UploadDialog } from "./UploadDialog";

/**
 * The storage browser's hero action — the single `upload` Button variant
 * (engraved icon well + ⌘U chip). Opens the premium UploadDialog, which feeds
 * the existing multipart queue + background tray. Exactly ONE per view.
 */
export function UploadButton({ path }: { path: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "u") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Button
        variant="upload"
        size="sm"
        onClick={() => setOpen(true)}
        title={`${t("storage.upload.menu.button")} (⌘U)`}
      >
        <span className="zs-btn-upload__well" aria-hidden>
          <Upload />
        </span>
        {t("storage.upload.menu.button")}
        <kbd className="zs-btn-upload__kbd" aria-hidden>
          ⌘U
        </kbd>
      </Button>
      <UploadDialog path={path} open={open} onOpenChange={setOpen} />
    </>
  );
}
