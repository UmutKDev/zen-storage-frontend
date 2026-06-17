import { cloudArchiveApiFactory } from "@/service/factories";
import type {
  CloudArchiveCreateStartRequestModel,
  CloudArchiveCreateStartResponseModel,
  CloudArchiveExtractStartRequestModel,
  CloudArchiveExtractStartRequestModelStrategyEnum,
  CloudArchiveExtractStartResponseModel,
  CloudArchivePreviewResponseModel,
} from "@/service/models";

/**
 * Conflict strategy for an extract's output folder — the generated enum from the
 * backend `ConflictResolutionStrategy`. Chosen up front in the extract dialog (a
 * batch job can't prompt mid-extract).
 */
export type ArchiveConflictStrategy =
  CloudArchiveExtractStartRequestModelStrategyEnum;

/** Start a Create-archive job (zip/tar/…) over the selected keys. */
export async function startArchiveCreate(
  input: CloudArchiveCreateStartRequestModel,
): Promise<CloudArchiveCreateStartResponseModel> {
  const res = await cloudArchiveApiFactory.archiveCreateStart({
    cloudArchiveCreateStartRequestModel: input,
  });
  return res.data as unknown as CloudArchiveCreateStartResponseModel;
}

/**
 * Start an Extract job. `Strategy` (conflict handling) and `CreateFolder` (new
 * subfolder vs. straight into the archive's own folder) ride on the generated
 * DTO. The Instance interceptor auto-injects `x-folder-session` from the `Key`
 * for locked folders.
 */
export async function startArchiveExtract(
  input: CloudArchiveExtractStartRequestModel,
): Promise<CloudArchiveExtractStartResponseModel> {
  const res = await cloudArchiveApiFactory.archiveExtractStart({
    cloudArchiveExtractStartRequestModel: input,
  });
  return res.data as unknown as CloudArchiveExtractStartResponseModel;
}

/** Preview an archive's entries (path/type/size) for selective extraction. */
export async function previewArchive(
  key: string,
  signal?: AbortSignal,
): Promise<CloudArchivePreviewResponseModel> {
  const res = await cloudArchiveApiFactory.archivePreview({ key }, { signal });
  return res.data as unknown as CloudArchivePreviewResponseModel;
}
