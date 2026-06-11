"use client";

import { useRef, useState } from "react";
import { FileUp, FolderUp, Upload } from "lucide-react";
import { t } from "@/lib/i18n";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import { useUploadQueue } from "../hooks/useUploadQueue";
import { filesFromDirectoryInput } from "../lib/traverse";

/**
 * Header "Upload" menu: file picker + (desktop-only) folder picker via
 * `webkitdirectory` — mobile browsers don't implement it reliably, so the
 * affordance is hidden on touch (upload-pipeline §5.4).
 */
export function UploadMenu({ path }: { path: string }) {
  const queue = useUploadQueue();
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  // Safe in the initializer: the menu content only mounts client-side on
  // open, so the conditional item is never part of SSR/hydration output.
  const [folderPickerSupported] = useState(
    () =>
      typeof window === "undefined" ||
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm">
            <Upload className="size-4" />
            {t("storage.upload.menu.button")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => fileInput.current?.click()}>
            <FileUp className="size-4" />
            {t("storage.upload.menu.files")}
          </DropdownMenuItem>
          {folderPickerSupported ? (
            <DropdownMenuItem onSelect={() => folderInput.current?.click()}>
              <FolderUp className="size-4" />
              {t("storage.upload.menu.folder")}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInput}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []).map((file) => ({
            file,
            relativeDir: "",
          }));
          e.target.value = "";
          if (files.length > 0) void queue.enqueue(files, path);
        }}
      />
      <input
        ref={folderInput}
        type="file"
        hidden
        // React has no prop for it — set as a plain attribute.
        {...{ webkitdirectory: "" }}
        onChange={(e) => {
          const files = filesFromDirectoryInput(e.target.files ?? []);
          e.target.value = "";
          if (files.length > 0) void queue.enqueue(files, path);
        }}
      />
    </>
  );
}
