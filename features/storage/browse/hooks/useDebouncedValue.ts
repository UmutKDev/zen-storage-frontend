"use client";

import { useEffect, useState } from "react";

/** Returns `value` after it has stayed unchanged for `delayMs`. Used to keep the
 *  search URL/query from updating on every keystroke. */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
