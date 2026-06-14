import { fromSegments, toSegments } from "@/lib/utils";

/** Build the deep-link URL for a child folder of `path`. */
export function folderHref(path: string, name: string): string {
  const segments = [...toSegments(path), name].map(encodeURIComponent);
  return `/storage/${segments.join("/")}`;
}

/** The normalized relative folder path of `name` under `path` — the value the
 *  directory/secure endpoints expect as `Path` (matches create/navigation). */
export function folderPathOf(path: string, name: string): string {
  return fromSegments([...toSegments(path), name]);
}
