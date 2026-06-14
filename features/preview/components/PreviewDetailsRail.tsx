"use client";

import {
  Download,
  History,
  Info,
  Link as LinkIcon,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";
import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { cn, fileMeta, formatBytes, formatDateTime } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useDownload } from "@/features/storage";
import type { CloudObjectModel } from "@/service/models";
import type { ScanGate } from "../hooks/useScanStatus";
import { useShare } from "../hooks/useShare";
import { VersionHistoryRail } from "./VersionHistoryRail";
import { DocumentVersionsRail } from "./DocumentVersionsRail";

export type RailTab = "details" | "versions";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="zs-preview-detail-row">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right text-xs font-medium tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}

/** The AV scan line — driven by the real scan gate; nothing rendered when the
 *  status is unknown (no data to assert). */
function ScanLine({ gate }: { gate: ScanGate }) {
  if (gate === "clean") {
    return (
      <p className="flex items-center gap-2 text-xs text-success" role="status">
        <ShieldCheck className="size-3.5 shrink-0" />
        {t("preview.rail.avClean")}
      </p>
    );
  }
  if (gate === "pending") {
    return (
      <p className="flex items-center gap-2 text-xs text-warning" role="status">
        <ShieldQuestion className="size-3.5 shrink-0" />
        {t("preview.rail.avScanning")}
      </p>
    );
  }
  if (gate === "infected") {
    // Assertive — a threat result should interrupt (matches the AvGate body banner).
    return (
      <p className="flex items-center gap-2 text-xs text-destructive" role="alert">
        <ShieldAlert className="size-3.5 shrink-0" />
        {t("preview.rail.avThreat")}
      </p>
    );
  }
  return null;
}

/**
 * The collapsible right details rail. Two tabs — **Details** (real metadata +
 * the AV scan status; no fabricated integrity data) and **Versions** (the
 * object/document history) — over a footer with Download + Copy-share-link.
 * Collapsing animates the outer width to 0 while the inner content stays pinned
 * at 300px so it doesn't reflow mid-transition.
 */
export function PreviewDetailsRail({
  open,
  activeTab,
  onTabChange,
  previewKey,
  object,
  gate,
  isEditor,
  onViewDiff,
}: {
  open: boolean;
  activeTab: RailTab;
  onTabChange: (tab: RailTab) => void;
  previewKey: string;
  object: CloudObjectModel;
  gate: ScanGate;
  isEditor: boolean;
  onViewDiff: (docKey: string, versionId: string) => void;
}) {
  const { download } = useDownload();
  const { share, isPending: sharing } = useShare();
  const blocked = gate === "infected";
  const typeLabel = fileMeta(object.Name, "file").label;

  return (
    <div
      className={cn("zs-preview-rail", !open && "zs-preview-rail--collapsed")}
      // `inert` (not just aria-hidden): the rail collapses via width:0 while its
      // controls stay in the DOM, so without this they'd remain tabbable + a
      // screen-reader would reach controls inside an aria-hidden subtree.
      inert={!open}
    >
      <div className="flex h-full w-[300px] flex-col">
        <Tabs
          value={activeTab}
          onValueChange={(v) => onTabChange(v as RailTab)}
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <TabsList variant="underline" className="shrink-0 gap-5 px-5">
            <TabsTrigger value="details">
              <Info className="size-4" />
              {t("preview.rail.details")}
            </TabsTrigger>
            <TabsTrigger value="versions">
              <History className="size-4" />
              {t("preview.rail.versions")}
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="details"
            className="min-h-0 overflow-y-auto px-5 py-4"
          >
            <div className="zs-preview-rail-label mb-1.5">
              {t("preview.rail.detailsLabel")}
            </div>
            <DetailRow label={t("preview.rail.type")} value={typeLabel} />
            <DetailRow
              label={t("preview.rail.size")}
              value={formatBytes(object.Size)}
            />
            <DetailRow
              label={t("preview.rail.modified")}
              value={formatDateTime(object.LastModified)}
            />
            <DetailRow label={t("preview.rail.ownerLabel")} value={t("preview.rail.owner")} />
            <div className="mt-3 border-t border-border pt-3">
              <ScanLine gate={gate} />
            </div>
          </TabsContent>

          <TabsContent
            value="versions"
            className="min-h-0 flex-1 overflow-hidden"
          >
            {isEditor ? (
              <DocumentVersionsRail previewKey={previewKey} onViewDiff={onViewDiff} />
            ) : (
              <VersionHistoryRail previewKey={previewKey} />
            )}
          </TabsContent>
        </Tabs>

        <div className="flex shrink-0 flex-col gap-2 border-t border-border px-5 pt-3.5 pb-4">
          <Button
            variant="default"
            className="w-full"
            disabled={blocked}
            onClick={() => download(object.Path.Key)}
          >
            <Download className="size-4" />
            {t("preview.download")}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={blocked || sharing}
            onClick={() => void share(object.Path.Key, object.Name)}
          >
            <LinkIcon className="size-4" />
            {t("preview.rail.copyShareLink")}
          </Button>
        </div>
      </div>
    </div>
  );
}
