import { isEnabled } from "@/lib/flags";
import { decodePreviewKey } from "@/lib/preview";
import { FilePreviewModal } from "@/features/preview";

/**
 * Intercepting route: renders the file preview as a modal over the current
 * storage page on client navigation (the `@modal` slot). The matching
 * non-intercepted route at `storage/preview/[key]` handles refresh / shared
 * links. Flag-gated — off → nothing renders (rows also don't link).
 */
export default async function PreviewModalInterceptor({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  if (!isEnabled("preview")) return null;
  const { key } = await params;
  return <FilePreviewModal previewKey={decodePreviewKey(key)} mode="overlay" />;
}
