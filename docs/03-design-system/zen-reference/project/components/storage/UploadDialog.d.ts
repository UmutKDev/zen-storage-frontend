/**
 * Premium upload surface — dropzone dialog (files and folders) with encrypt → upload queue.
 * Opened by the `upload` Button variant (⌘U). One per app.
 * @startingPoint section="Storage" subtitle="Dropzone · simulated encrypt → upload lifecycle · encrypted footer"
 */
export interface UploadQueueItem {
  name: string;
  /** "folder" renders the row as a collapsed folder (count + aggregate size). Default: file. */
  kind?: "file" | "folder";
  /** Aggregate bytes for folders. */
  size?: number;
  /** File count inside a folder row; null shows "Scanning…". */
  count?: number | null;
  /** 0–100. Default 0. */
  progress?: number;
  /** Default "encrypting". */
  status?: "encrypting" | "uploading" | "done";
}
export interface UploadDialogProps {
  open: boolean;
  onClose?: () => void;
  /** Folder label shown in the header, e.g. the current breadcrumb leaf. Default "Home". */
  destination?: string;
  /** Seed the queue on open (demos, cards). */
  initialItems?: UploadQueueItem[];
  /** Run the fake encrypt → upload lifecycle. Set false to freeze seeded states. Default true. */
  simulate?: boolean;
}
export declare function UploadDialog(props: UploadDialogProps): JSX.Element | null;
