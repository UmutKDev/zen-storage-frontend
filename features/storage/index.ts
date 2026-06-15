// Public barrel for the storage feature.
export { StorageScreen } from "./browse/screens/StorageScreen";
export { SidebarUsageCard } from "./browse/components/SidebarUsageCard";
export { QuotaBanner } from "./browse/components/QuotaBanner";
export { UploadTray } from "./upload/components/UploadTray";
export { teardownUploads } from "./upload/core/teardown";

// Surface reused by features/preview (the modal toolbar reuses storage's
// delete/download + entry type; arrow-nav reads the previewable-key list the
// browser publishes). One-way: preview → storage; storage never imports preview.
export type { FolderEntry } from "./browse/lib/entries";
export { usePreviewNavStore } from "./browse/stores/previewNav.store";
export { useDelete } from "./operations/hooks/useDelete";
export { useDownload } from "./operations/hooks/useDownload";
export { DeleteConfirmDialog } from "./operations/components/DeleteConfirmDialog";
