import { notFound } from "next/navigation";
import { isEnabled } from "@/lib/flags";
import { decodePreviewKey } from "@/lib/preview";
import { FilePreviewModal } from "@/features/preview";

/**
 * Non-intercepted preview route — the destination for a hard navigation: page
 * refresh, a shared deep link, or opening the URL directly. Renders the same
 * full-screen `FilePreviewModal`; closing pushes to the containing folder
 * (`mode="page"`). The specific `preview/[key]` segment outranks the sibling
 * optional catch-all `[[...path]]`, so this never resolves as a folder.
 */
export default async function PreviewPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  if (!isEnabled("preview")) notFound();
  const { key } = await params;
  return <FilePreviewModal previewKey={decodePreviewKey(key)} mode="page" />;
}
