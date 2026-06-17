import { cloudApiFactory } from "@/service/factories";
import type {
  CloudDuplicateScanCancelResponseModel,
  CloudDuplicateScanResultResponseModel,
  CloudDuplicateScanStartRequestModel,
  CloudDuplicateScanStartResponseModel,
} from "@/service/models";

/** Start a duplicate scan of `Path` (recursive + perceptual-similarity options). */
export async function startDuplicateScan(
  input: CloudDuplicateScanStartRequestModel,
): Promise<CloudDuplicateScanStartResponseModel> {
  const res = await cloudApiFactory.duplicateScanStart({
    cloudDuplicateScanStartRequestModel: input,
  });
  return res.data as unknown as CloudDuplicateScanStartResponseModel;
}

/** Fetch the completed scan's grouped results. */
export async function getDuplicateScanResult(
  scanId: string,
  signal?: AbortSignal,
): Promise<CloudDuplicateScanResultResponseModel> {
  const res = await cloudApiFactory.duplicateScanResult({ scanId }, { signal });
  return res.data as unknown as CloudDuplicateScanResultResponseModel;
}

/** Cancel an in-progress scan (the backend emits DUPLICATE_SCAN_CANCELLED). */
export async function cancelDuplicateScan(
  scanId: string,
): Promise<CloudDuplicateScanCancelResponseModel> {
  const res = await cloudApiFactory.duplicateScanCancel({
    cloudDuplicateScanIdRequestModel: { ScanId: scanId },
  });
  return res.data as unknown as CloudDuplicateScanCancelResponseModel;
}
