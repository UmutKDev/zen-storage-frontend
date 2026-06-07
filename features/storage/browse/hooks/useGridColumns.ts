"use client";

import { useEffect, useRef, useState } from "react";

/** Column count for the grid, measured from the container width (responsive). */
export function useGridColumns(minCardWidth = 168) {
  const ref = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(2);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () =>
      setColumns(Math.max(1, Math.floor(el.clientWidth / minCardWidth)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [minCardWidth]);

  return { ref, columns };
}
