// Intercepting route (.)preview/[key] — renders the preview as a modal over the
// current storage page on client navigation. Stub for the 0.8a spike; the real
// preview modal (image/video/PDF/…) lands in Phase 4 via features/preview.
export default async function PreviewModalInterceptor({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  return (
    <div
      role="dialog"
      aria-label="Preview"
      className="glass-overlay fixed inset-0 z-50 m-auto h-fit max-w-lg rounded-lg p-6"
    >
      <p className="text-sm text-muted-foreground">Preview (Phase 4): {key}</p>
    </div>
  );
}
