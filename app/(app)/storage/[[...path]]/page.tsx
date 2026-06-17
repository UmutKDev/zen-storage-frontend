import { fromRouteSegments } from "@/lib/utils";
import { StorageScreen } from "@/features/storage";

/**
 * Folder deep-linking catch-all. The optional segments become the current
 * folder path; the browse screen (features/storage) renders the contents.
 * `fromRouteSegments` decodes the percent-encoded segments (a space would
 * otherwise double-encode and the backend couldn't find the folder).
 */
export default async function StoragePage({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path } = await params;
  return <StorageScreen path={fromRouteSegments(path)} />;
}
