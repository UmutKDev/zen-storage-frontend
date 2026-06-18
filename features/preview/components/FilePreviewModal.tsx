"use client";

import { useCallback, useEffect, useState } from "react";
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
import { cn, parentPath, toSegments } from "@/lib/utils";
import { previewHref, viewerKindForName } from "@/lib/preview";
import { usePreviewObject } from "../hooks/usePreviewObject";
import { usePreviewNavigation } from "../hooks/usePreviewNavigation";
import { useEditorStore } from "../stores/editor.store";
import type { PreviewMode } from "../types";
import { PreviewToolbar } from "./PreviewToolbar";
import { PreviewStage } from "./PreviewStage";
import { PreviewDetailsRail, type RailTab } from "./PreviewDetailsRail";
import { PreviewLoading } from "./states/PreviewLoading";
import { PreviewError } from "./states/PreviewError";

/** Storage URL for a folder path (root = /storage). */
function folderUrl(path: string): string {
  const segments = toSegments(path).map(encodeURIComponent);
  return segments.length ? `/storage/${segments.join("/")}` : "/storage";
}

/** Don't hijack the `F` fullscreen shortcut while typing (e.g. in the editor). */
function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.isContentEditable
  );
}

/**
 * The deep-linkable file preview — a Zen lightbox. Rendered into the `@modal`
 * slot on soft nav (`mode="overlay"` → close returns via `router.back`) and as a
 * full page on a cold load / shared link (`mode="page"` → close pushes to the
 * folder). Layout-fullscreen (F key), a collapsible details rail, and image zoom
 * are all local UI state — reset per file. The editor's unsaved-changes guard
 * still gates close.
 */
export function FilePreviewModal({
  previewKey,
  mode = "overlay",
}: {
  previewKey: string;
  mode?: PreviewMode;
}) {
  const router = useRouter();
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const [layoutFullscreen, setLayoutFullscreen] = useState(false);
  const [railOpen, setRailOpen] = useState(true);
  const [activeRailTab, setActiveRailTab] = useState<RailTab>("details");
  const [zoom, setZoom] = useState(1);
  const [diffFor, setDiffFor] = useState<{ docKey: string; versionId: string } | null>(
    null,
  );

  // The displayed file. Seeded from the route prop; ←/→ nav swaps it IN PLACE
  // (internal state + `history.replaceState`) instead of a Next route change, so
  // the dialog never remounts — fullscreen/rail/zoom survive and there's no
  // loading flash between files.
  const [activeKey, setActiveKey] = useState(previewKey);
  const [seededFrom, setSeededFrom] = useState(previewKey);
  if (previewKey !== seededFrom) {
    // An external route change (opening a different file) — adopt it + reset.
    // The sanctioned derive-on-render pattern, not an effect.
    setSeededFrom(previewKey);
    setActiveKey(previewKey);
    setZoom(1);
    setDiffFor(null);
  }

  const selectKey = useCallback((key: string) => {
    setActiveKey(key);
    setZoom(1);
    setDiffFor(null);
    // Keep the URL deep-linkable without a Next navigation (which would remount).
    if (typeof window !== "undefined") {
      window.history.replaceState(window.history.state, "", previewHref(key));
    }
  }, []);

  const { object, isPending, isFetching, isError, refetch } =
    usePreviewObject(activeKey);

  const isEditor = object ? viewerKindForName(object.Name) === "editor" : false;
  // For a video, the player owns ←/→ (seek) + `F` (browser fullscreen); file
  // nav moves to Shift+←/→ and the modal's layout-fullscreen `F` stands down.
  const isVideo = object ? viewerKindForName(object.Name) === "video" : false;

  const nav = usePreviewNavigation(activeKey, selectKey, {
    arrowsClaimed: isVideo,
  });

  // `F` toggles layout-fullscreen (not while typing / with modifiers / on video,
  // where the player owns `F` for browser fullscreen). Re-subscribes when the
  // active file's viewer kind flips between video and non-video.
  useEffect(() => {
    if (isVideo) return;
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.key === "f" || e.key === "F") &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !isEditableTarget(e.target) &&
        // Don't toggle behind an open dropdown / confirm dialog.
        !document.querySelector(
          '[role="alertdialog"], [role="menu"][data-state="open"]',
        )
      ) {
        setLayoutFullscreen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isVideo]);

  const navigate = () => {
    if (mode === "overlay") router.back();
    else router.push(folderUrl(parentPath(activeKey)));
  };
  // Guard close on unsaved editor changes (the editor registers the guard).
  const close = () => {
    if (useEditorStore.getState().guard?.dirty) {
      setUnsavedOpen(true);
      return;
    }
    navigate();
  };

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && close()}>
        <DialogContent
          showCloseButton={false}
          overlayClassName="zs-preview-backdrop"
          onEscapeKeyDown={(e) => {
            // Browser fullscreen (the video player) consumes Escape first — keep
            // the modal open underneath so Escape just exits fullscreen.
            if (document.fullscreenElement) {
              e.preventDefault();
              return;
            }
            if (layoutFullscreen) {
              e.preventDefault();
              setLayoutFullscreen(false);
            }
          }}
          className={cn(
            "zs-preview-shell flex max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none",
            layoutFullscreen
              ? "h-screen w-screen rounded-none"
              : "h-[min(720px,calc(100vh-64px))] w-[min(1120px,calc(100vw-48px))] rounded-xl",
          )}
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
              folderPath={parentPath(activeKey)}
              railOpen={railOpen}
              layoutFullscreen={layoutFullscreen}
              onToggleRail={() => setRailOpen((o) => !o)}
              onToggleFullscreen={() => setLayoutFullscreen((v) => !v)}
              onHistoryClick={() => {
                setRailOpen(true);
                setActiveRailTab("versions");
              }}
              onClose={close}
            />
          ) : (
            <div className="flex items-center justify-end border-b border-border px-5 py-3.5">
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

          <div className="relative flex min-h-0 flex-1">
            {isFetching ? (
              <div
                className="zs-preview-loadbar"
                role="progressbar"
                aria-label={t("preview.loading")}
              />
            ) : null}
            {isError ? (
              <div className="min-h-0 flex-1">
                <PreviewError onRetry={refetch} />
              </div>
            ) : isPending || !object ? (
              <div className="min-h-0 flex-1">
                <PreviewLoading />
              </div>
            ) : (
              <>
                <PreviewStage
                  object={object}
                  zoom={zoom}
                  onZoomChange={setZoom}
                  hasPrev={nav.hasPrev}
                  hasNext={nav.hasNext}
                  onPrev={nav.goPrev}
                  onNext={nav.goNext}
                  diffFor={diffFor}
                  onCloseDiff={() => setDiffFor(null)}
                  onReload={refetch}
                />
                <PreviewDetailsRail
                  open={railOpen}
                  activeTab={activeRailTab}
                  onTabChange={setActiveRailTab}
                  previewKey={activeKey}
                  object={object}
                  isEditor={isEditor}
                  onViewDiff={(docKey, versionId) =>
                    setDiffFor({ docKey, versionId })
                  }
                />
              </>
            )}
          </div>
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
