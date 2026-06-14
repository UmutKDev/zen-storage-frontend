"use client";

import { type ReactNode, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui";
import { t } from "@/lib/i18n";
import { parentPath, toSegments } from "@/lib/utils";
import { viewerKindForName } from "@/lib/preview";
import { usePreviewObject } from "../hooks/usePreviewObject";
import { useScanStatus } from "../hooks/useScanStatus";
import { usePreviewNavigation } from "../hooks/usePreviewNavigation";
import { useFullscreenEnabled, useIsFullscreen } from "../hooks/useFullscreen";
import { useEditorStore } from "../stores/editor.store";
import type { PreviewMode } from "../types";
import { PreviewToolbar } from "./PreviewToolbar";
import { PreviewBody } from "./PreviewBody";
import { PreviewNavButtons } from "./PreviewNavButtons";
import { VersionHistoryPanel } from "./VersionHistoryPanel";
import { DocumentVersionsPanel } from "./DocumentVersionsPanel";
import { AvGate } from "./states/AvGate";
import { PreviewLoading } from "./states/PreviewLoading";
import { PreviewError } from "./states/PreviewError";

/** Storage URL for a folder path (root = /storage). */
function folderUrl(path: string): string {
  const segments = toSegments(path).map(encodeURIComponent);
  return segments.length ? `/storage/${segments.join("/")}` : "/storage";
}

/**
 * The deep-linkable file preview. Rendered into the `@modal` slot on soft nav
 * (`mode="overlay"` → close returns via `router.back`) and as a full page on a
 * cold load / shared link (`mode="page"` → close pushes to the folder). The
 * `footerSlot` + the open body switch are the Stage B/C extension seams.
 */
export function FilePreviewModal({
  previewKey,
  mode = "overlay",
  footerSlot,
}: {
  previewKey: string;
  mode?: PreviewMode;
  footerSlot?: ReactNode;
}) {
  const router = useRouter();
  const bodyRef = useRef<HTMLDivElement>(null);
  const fullscreenEnabled = useFullscreenEnabled();
  const isFullscreen = useIsFullscreen();
  const [unsavedOpen, setUnsavedOpen] = useState(false);

  const { object, isPending, isError, refetch } = usePreviewObject(previewKey);
  const { gate } = useScanStatus(previewKey);
  const nav = usePreviewNavigation(previewKey);

  const isEditor = object ? viewerKindForName(object.Name) === "editor" : false;

  const navigate = () => {
    if (mode === "overlay") router.back();
    else router.push(folderUrl(parentPath(previewKey)));
  };
  // Guard close on unsaved editor changes (the editor registers the guard).
  const close = () => {
    if (useEditorStore.getState().guard?.dirty) {
      setUnsavedOpen(true);
      return;
    }
    navigate();
  };

  const toggleFullscreen = () => {
    const el = bodyRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  };

  return (
    <>
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[min(92vh,52rem)] w-[min(96vw,72rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none"
      >
        {/* Always present (even while loading) so Radix has its required title. */}
        <DialogTitle className="sr-only">
          {object?.Name ?? t("preview.title")}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {t("preview.navHint")}
        </DialogDescription>

        {object ? (
          <PreviewToolbar
            object={object}
            folderPath={parentPath(previewKey)}
            blocked={gate === "infected"}
            canFullscreen={fullscreenEnabled}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            onClose={close}
          />
        ) : (
          <div className="flex items-center justify-end border-b border-border/60 px-3 py-2">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("preview.close")}
              onClick={close}
            >
              <X className="size-4" />
            </Button>
          </div>
        )}

        <div ref={bodyRef} className="relative min-h-0 flex-1 bg-surface">
          {isError ? (
            <PreviewError onRetry={refetch} />
          ) : isPending || !object ? (
            <PreviewLoading />
          ) : (
            <AvGate gate={gate}>
              <PreviewBody object={object} />
            </AvGate>
          )}
          <PreviewNavButtons
            hasPrev={nav.hasPrev}
            hasNext={nav.hasNext}
            onPrev={nav.goPrev}
            onNext={nav.goNext}
          />
        </div>

        {/* Footer: a caller `footerSlot` overrides; otherwise editor files get
            the document version history + diff panel (Stage C2) and everything
            else gets the object-version history panel (Stage B). */}
        {footerSlot ? (
          <div className="border-t border-border/60">{footerSlot}</div>
        ) : object ? (
          <div className="border-t border-border/60">
            {isEditor ? (
              <DocumentVersionsPanel previewKey={previewKey} />
            ) : (
              <VersionHistoryPanel previewKey={previewKey} />
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>

    <AlertDialog open={unsavedOpen} onOpenChange={(o) => !o && setUnsavedOpen(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("preview.editor.unsavedTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("preview.editor.unsavedBody")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <Button
            variant="ghost-destructive"
            onClick={() => {
              void useEditorStore.getState().guard?.discard();
              setUnsavedOpen(false);
              navigate();
            }}
          >
            {t("preview.editor.discard")}
          </Button>
          <AlertDialogAction
            onClick={() => {
              void useEditorStore
                .getState()
                .guard?.save()
                .then((ok) => {
                  if (ok) navigate();
                });
              setUnsavedOpen(false);
            }}
          >
            {t("preview.editor.save")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
