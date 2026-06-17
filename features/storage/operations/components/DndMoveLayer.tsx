"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { File as FileIcon, Folder } from "lucide-react";
import { t } from "@/lib/i18n";
import { duration, easing, useReducedMotion } from "@/lib/motion";
import { Badge, Dialog, DialogContent } from "@/components/ui";
import type { FolderEntry } from "../../browse/lib/entries";
import type { ItemSelection } from "../hooks/useItemSelection";
import { useMove } from "../hooks/useMove";
import { destinationKey } from "../lib/paths";
import { blockedPrefixes, canDropOn, resolveDragSet } from "../lib/dnd";
import { ConflictPrompt } from "./ConflictPrompt";

/** What a folder/breadcrumb droppable carries in `useDroppable({ data })`. */
export interface DropTargetData {
  type: "dir" | "crumb";
  path: string;
}

const noSuppress = { current: false };

/** dnd-kit's default drop animation, re-tuned to the motion tokens. */
const dropAnimation = {
  duration: duration.base * 1000,
  easing: `cubic-bezier(${easing.standard.join(", ")})`,
};

/** Rows/cards read this to self-disable invalid drop targets and to swallow
 *  the synthetic click that follows a drag (else a drop over the origin
 *  folder's link would navigate). Defaults keep rows working outside the
 *  layer (tests). */
export const DndMoveContext = createContext<{
  blocked: ReadonlySet<string>;
  suppressClickRef: RefObject<boolean>;
}>({ blocked: new Set(), suppressClickRef: noSuppress });

export function useDndMove() {
  return useContext(DndMoveContext);
}

/**
 * Desktop drag-move: wraps the browse surface in a DndContext (MouseSensor
 * only — touch gets the Stage D bottom sheet; an 8px activation distance keeps
 * plain clicks/links working). Dragging an entry that is part of the selection
 * moves the whole selection. A 409 on drop opens the shared ConflictPrompt in
 * its own dialog.
 */
export function DndMoveLayer({
  entries,
  path,
  selection,
  children,
}: {
  entries: ReadonlyArray<FolderEntry>;
  path: string;
  selection: ItemSelection;
  children: ReactNode;
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
  );
  const prefersReduced = useReducedMotion();
  const [dragSet, setDragSet] = useState<FolderEntry[]>([]);
  const [blocked, setBlocked] = useState<ReadonlySet<string>>(new Set());
  const suppressClickRef = useRef(false);
  const move = useMove(() => selection.clear());

  const endDrag = () => {
    setDragSet([]);
    setBlocked(new Set());
    // dnd-kit doesn't reliably swallow the click that follows a drag — guard
    // the next tick's click so a drop over a folder link doesn't navigate.
    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  };

  const onDragStart = (event: DragStartEvent) => {
    const set = resolveDragSet(
      String(event.active.id),
      selection.selectedEntries,
      entries,
    );
    setDragSet(set);
    setBlocked(blockedPrefixes(set));
  };

  const onDragEnd = (event: DragEndEvent) => {
    const target = event.over?.data.current as DropTargetData | undefined;
    if (target && canDropOn(dragSet, target.path, path)) {
      move.mutate({
        entries: dragSet,
        destinationKey: destinationKey(target.path),
      });
    }
    endDrag();
  };

  const first = dragSet[0];

  return (
    <DndMoveContext.Provider value={{ blocked, suppressClickRef }}>
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={endDrag}
      >
        {children}
        <DragOverlay dropAnimation={prefersReduced ? null : dropAnimation}>
          {first ? (
            <div className="flex w-fit max-w-60 items-center gap-2 rounded-md border border-border bg-surface-elevated px-3 py-2 shadow-e3">
              {first.kind === "dir" ? (
                <Folder className="size-4 shrink-0 text-brand" />
              ) : (
                <FileIcon className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate text-sm text-foreground">
                {first.name}
              </span>
              {dragSet.length > 1 ? (
                <Badge variant="secondary">+{dragSet.length - 1}</Badge>
              ) : null}
              <span className="sr-only">
                {dragSet.length} {t("storage.ops.dnd.overlayMoveSuffix")}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Dialog
        open={Boolean(move.conflict)}
        onOpenChange={(o) => !o && move.cancelConflict()}
      >
        <DialogContent className="sm:max-w-md">
          {move.conflict ? (
            <ConflictPrompt
              details={move.conflict}
              onResolve={move.resolve}
              onCancel={move.cancelConflict}
              pending={move.isPending}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </DndMoveContext.Provider>
  );
}
