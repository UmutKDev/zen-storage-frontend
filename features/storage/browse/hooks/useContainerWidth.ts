"use client";

import { useEffect, useRef, useState } from "react";

/** Measure a container's content width (responsive, via ResizeObserver). 0 until
 *  the first measure — callers gate layout that needs a real width. */
export function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}
