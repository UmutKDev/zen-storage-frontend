import { CloudDuplicateScanProgressModelPhaseEnum } from "@/service/models";

/** Ordered duplicate-scan phases — the monotonic guard for `applyEvent`. */
const ORDER: readonly string[] = [
  CloudDuplicateScanProgressModelPhaseEnum.Listing,
  CloudDuplicateScanProgressModelPhaseEnum.SizeGrouping,
  CloudDuplicateScanProgressModelPhaseEnum.ContentHashing,
  CloudDuplicateScanProgressModelPhaseEnum.PerceptualHashing,
  CloudDuplicateScanProgressModelPhaseEnum.Finalizing,
];

/** Monotonic rank for a duplicate-scan phase (0 for unknown/unordered). */
export function scanPhaseRank(phase?: string | null): number {
  if (!phase) return 0;
  const i = ORDER.indexOf(phase);
  return i < 0 ? 0 : i;
}
