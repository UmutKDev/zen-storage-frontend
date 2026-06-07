import { toSegments } from "@/lib/utils";

/** Build the deep-link URL for a child folder of `path`. */
export function folderHref(path: string, name: string): string {
  const segments = [...toSegments(path), name].map(encodeURIComponent);
  return `/storage/${segments.join("/")}`;
}
