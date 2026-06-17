"use client";

import dynamic from "next/dynamic";
import type { CloudObjectModel } from "@/service/models";
import { PreviewLoading } from "../states/PreviewLoading";

// CodeMirror is heavy — keep it in its own chunk, loaded only when a text/code
// file opens (never in the image/pdf/office path or the main bundle).
const DocumentEditor = dynamic(
  () => import("./DocumentEditor").then((m) => m.DocumentEditor),
  { ssr: false, loading: () => <PreviewLoading /> },
);

export function DocumentEditorLazy({ object }: { object: CloudObjectModel }) {
  return <DocumentEditor object={object} />;
}
