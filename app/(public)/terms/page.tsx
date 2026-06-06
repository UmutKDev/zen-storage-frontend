import type { Metadata } from "next";
import { LegalDocument } from "@/components/patterns";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalDocument title={t("legal.terms.heading")}>
      <p>{t("legal.terms.body")}</p>
    </LegalDocument>
  );
}
