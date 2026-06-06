import { fromSegments } from "@/lib/utils";

/**
 * Folder deep-linking catch-all. Renders the path segments; the real storage
 * browser screen (features/storage) lands in Phase 3.
 */
export default async function StoragePage({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path } = await params;
  const current = fromSegments(path ?? []) || "Root";

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Storage</h1>
      <p className="mt-2 text-sm text-muted-foreground">{current}</p>
    </main>
  );
}
