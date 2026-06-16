"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { AlertTriangle, Lock, RotateCcw, Save } from "lucide-react";
import { basicSetup } from "codemirror";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { python } from "@codemirror/lang-python";
import { yaml } from "@codemirror/lang-yaml";
import { oneDark } from "@codemirror/theme-one-dark";
import { Button } from "@/components/ui";
import { t } from "@/lib/i18n";
import { editorLanguageForName, type EditorLanguageKey } from "@/lib/preview";
import type { CloudObjectModel, DocumentContentResponseModel } from "@/service/models";
import { useDocumentContent } from "../../hooks/useDocumentContent";
import { useDocumentLock } from "../../hooks/useDocumentLock";
import { useDocumentEditing } from "../../hooks/useDocumentEditing";
import { useEditorStore } from "../../stores/editor.store";
import { PreviewLoading } from "../states/PreviewLoading";
import { PreviewError } from "../states/PreviewError";

function languageExtension(key: EditorLanguageKey): Extension | null {
  switch (key) {
    case "javascript":
      return javascript({ jsx: true, typescript: true });
    case "json":
      return json();
    case "markdown":
      return markdown();
    case "html":
      return html();
    case "css":
      return css();
    case "python":
      return python();
    case "yaml":
      return yaml();
    default:
      return null;
  }
}

const baseTheme = EditorView.theme({
  "&": { height: "100%", fontSize: "13px" },
  ".cm-scroller": {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },
});

/** Outer: load the content, then mount the editor surface once it's ready. */
export function DocumentEditor({ object }: { object: CloudObjectModel }) {
  const { data, isPending, isError, refetch } = useDocumentContent(object.Path.Key);

  if (isError) return <PreviewError onRetry={refetch} />;
  if (isPending || !data) return <PreviewLoading />;
  return <EditorSurface object={object} initial={data} reload={refetch} />;
}

function EditorSurface({
  object,
  initial,
  reload,
}: {
  object: CloudObjectModel;
  initial: DocumentContentResponseModel;
  reload: () => Promise<{ data?: DocumentContentResponseModel }>;
}) {
  const key = object.Path.Key;
  const { resolvedTheme } = useTheme();
  const lock = useDocumentLock(key, true);
  const editing = useDocumentEditing(key, initial.ContentHash);

  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const readonlyComp = useRef(new Compartment());
  const themeComp = useRef(new Compartment());

  const [dirty, setDirty] = useState(initial.IsDraft);

  const canEdit = lock.canEdit;

  const commitNow = useCallback(async (): Promise<boolean> => {
    const view = viewRef.current;
    if (!view) return false;
    const ok = await editing.commit(view.state.doc.toString());
    if (ok) setDirty(false);
    return ok;
  }, [editing]);

  const discardNow = useCallback(async () => {
    await editing.discard();
    setDirty(false);
  }, [editing]);

  // Latest handlers for the CodeMirror update listener + ⌘S (captured once).
  const latestRef = useRef({ canEdit, queueDraft: editing.queueDraft, commitNow });
  useEffect(() => {
    latestRef.current = { canEdit, queueDraft: editing.queueDraft, commitNow };
  });

  // Mount CodeMirror once.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const langExt = languageExtension(editorLanguageForName(object.Name));
    const state = EditorState.create({
      doc: initial.Content,
      extensions: [
        keymap.of([
          {
            key: "Mod-s",
            preventDefault: true,
            run: () => {
              void latestRef.current.commitNow();
              return true;
            },
          },
        ]),
        basicSetup,
        ...(langExt ? [langExt] : []),
        baseTheme,
        themeComp.current.of([]),
        readonlyComp.current.of(EditorState.readOnly.of(true)),
        EditorView.updateListener.of((u) => {
          if (!u.docChanged) return;
          setDirty(true);
          if (latestRef.current.canEdit) {
            latestRef.current.queueDraft(u.state.doc.toString());
          }
        }),
      ],
    });
    const view = new EditorView({ state, parent: host });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Mount-once: re-seeding on prop change would clobber edits (handled via reload()).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle read-only with the lock; reconfigure the syntax theme with the app theme.
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: readonlyComp.current.reconfigure(EditorState.readOnly.of(!canEdit)),
    });
  }, [canEdit]);
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: themeComp.current.reconfigure(
        resolvedTheme === "dark" ? oneDark : [],
      ),
    });
  }, [resolvedTheme]);

  // Register the unsaved-changes guard the modal consults on close.
  useEffect(() => {
    useEditorStore
      .getState()
      .setGuard({ dirty, save: commitNow, discard: discardNow });
    return () => useEditorStore.getState().setGuard(null);
  }, [dirty, commitNow, discardNow]);

  // Publish lock ownership so the versions panel can gate restore/delete.
  useEffect(() => {
    useEditorStore.getState().setCanEdit(canEdit);
    return () => useEditorStore.getState().setCanEdit(false);
  }, [canEdit]);

  // Best-effort draft on tab background/close (never `beforeunload` — repo rule).
  useEffect(() => {
    const onHide = () => {
      if (latestRef.current.canEdit && viewRef.current) {
        editing.flushDraftNow(viewRef.current.state.doc.toString());
      }
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [editing]);

  const onReload = async () => {
    const res = await reload();
    const fresh = res.data;
    const view = viewRef.current;
    if (fresh && view) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: fresh.Content },
      });
      editing.resetBase(fresh.ContentHash);
      setDirty(false);
    }
  };

  // A version restore (footer panel) bumps the reload signal → re-seed in place
  // with the restored content, keeping the lock. Skip the initial mount value.
  const reloadNonce = useEditorStore((s) => s.reloadNonce);
  const seenReloadNonce = useRef(reloadNonce);
  useEffect(() => {
    if (seenReloadNonce.current === reloadNonce) return;
    seenReloadNonce.current = reloadNonce;
    void onReload();
    // onReload reads current refs/closures; only re-run on a signal bump.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadNonce]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border/60 px-3 py-1.5 text-xs">
        {/* Persistent polite live region: lock/draft/save status changes
            asynchronously (lock acquire, heartbeat loss, save) and must be
            announced via `role="status"`. */}
        <span role="status" className="flex items-center gap-1.5">
          {!canEdit ? (
            <span className="flex items-center gap-1.5 text-warning">
              <Lock className="size-3.5" />
              {lock.lockState === "other" && lock.lockedByName
                ? `${t("preview.editor.lockedBy")} ${lock.lockedByName}`
                : lock.lockState === "lost"
                  ? t("preview.editor.lockLost")
                  : t("preview.editor.readOnly")}
            </span>
          ) : initial.IsDraft ? (
            <span className="text-muted-foreground">
              {t("preview.editor.draftRestored")}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {editing.saving
                ? t("preview.editor.saving")
                : editing.savedAt
                  ? t("preview.editor.saved")
                  : ""}
            </span>
          )}
        </span>
        <span className="flex-1" />
        {canEdit ? (
          <Button
            variant="outline"
            size="xs"
            disabled={!dirty || editing.saving}
            onClick={() => void commitNow()}
          >
            <Save className="size-3.5" />
            {t("preview.editor.save")}
          </Button>
        ) : null}
      </div>

      {editing.conflict ? (
        <div
          role="alert"
          className="flex items-center gap-2 border-b border-warning/30 bg-warning/10 px-3 py-2 text-xs text-foreground"
        >
          <AlertTriangle className="size-4 shrink-0 text-warning" />
          <span className="flex-1">{t("preview.editor.conflictReload")}</span>
          <Button variant="outline" size="xs" onClick={() => void onReload()}>
            <RotateCcw className="size-3.5" />
            {t("common.retry")}
          </Button>
        </div>
      ) : null}

      <div ref={hostRef} className="min-h-0 flex-1 overflow-hidden bg-surface" />
    </div>
  );
}
