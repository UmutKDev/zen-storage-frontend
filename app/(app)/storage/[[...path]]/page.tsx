import { fromSegments } from "@/lib/utils";
import { StorageScreen } from "@/features/storage";

/**
 * Folder deep-linking catch-all. The optional segments become the current
 * folder path; the browse screen (features/storage) renders the contents.
 */
export default async function StoragePage({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path } = await params;
  return <StorageScreen path={fromSegments(path ?? [])} />;
}
