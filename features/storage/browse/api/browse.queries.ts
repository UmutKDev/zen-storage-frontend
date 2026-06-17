import { itemsOf } from "@/lib/api";
import { cloudApiFactory } from "@/service/factories";
import type {
  CloudDirectoryModel,
  CloudObjectModel,
  CloudUserStorageUsageResponseModel,
} from "@/service/models";

/**
 * Single-call folder listing — **no Skip/Take**. Omitting both makes the backend
 * take its non-paginated path (one S3 call, the whole folder up to ~1000),
 * avoiding the paginated aggregation loop (which errored on some folders) and
 * the directory page-overlap. `delimiter: true` keeps objects scoped to THIS
 * folder (not recursive). `itemsOf` reads the post-envelope `{ items }`.
 */
export async function getDirectories(
  path: string,
  signal?: AbortSignal,
): Promise<CloudDirectoryModel[]> {
  const res = await cloudApiFactory.listDirectories(
    { path, delimiter: true },
    { signal },
  );
  return itemsOf<CloudDirectoryModel>(res.data);
}

export async function getObjects(
  path: string,
  signal?: AbortSignal,
): Promise<CloudObjectModel[]> {
  const res = await cloudApiFactory.listObjects(
    // `isMetadataProcessing` makes the backend compute object metadata
    // (thumbnails, dimensions) the grid needs. Directories force it off server-side.
    { path, delimiter: true, isMetadataProcessing: true },
    { signal },
  );
  return itemsOf<CloudObjectModel>(res.data);
}

export async function getStorageUsage(
  signal?: AbortSignal,
): Promise<CloudUserStorageUsageResponseModel> {
  const res = await cloudApiFactory.userStorageUsage({}, { signal });
  return res.data as unknown as CloudUserStorageUsageResponseModel;
}
