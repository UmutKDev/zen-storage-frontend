"use client";

import { useRef, useState, type DragEvent } from "react";
import {
  filesFromDataTransfer,
  type TraversedFile,
} from "../lib/traverse";

/**
 * Native OS-file drop (HTML5 drag events) — deliberately a different event
 * system from the dnd-kit move layer (MouseSensor), so the two drops can
 * never be ambiguous (upload-pipeline §3): internal item drags fire no native
 * drag events, and OS-file drags never activate MouseSensor.
 *
 * `dragenter`/`dragleave` fire per child node — a depth counter keeps the
 * highlight stable while the pointer crosses children.
 */
export function useFileDrop(onFiles: (files: TraversedFile[]) => void) {
  const [isDragActive, setIsDragActive] = useState(false);
  const depth = useRef(0);

  const hasFiles = (e: DragEvent) =>
    Array.from(e.dataTransfer?.types ?? []).includes("Files");

  const onDragEnter = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth.current += 1;
    setIsDragActive(true);
  };

  const onDragOver = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    // Required, or the browser navigates to the dropped file.
    e.preventDefault();
  };

  const onDragLeave = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setIsDragActive(false);
  };

  const onDrop = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth.current = 0;
    setIsDragActive(false);
    void filesFromDataTransfer(e.dataTransfer).then((files) => {
      if (files.length > 0) onFiles(files);
    });
  };

  return {
    isDragActive,
    dropProps: { onDragEnter, onDragOver, onDragLeave, onDrop },
  };
}
