import type { Metadata } from "next";
import { LegalDocument } from "@/components/patterns";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: "Data Processing" };

export default function DataProcessingPage() {
  return (
    <LegalDocument title={t("legal.dataProcessing.heading")}>
      <p>{t("legal.dataProcessing.body")}</p>
    </LegalDocument>
  );
}
